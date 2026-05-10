---
read_when:
    - می‌خواهید بدانید حافظه چگونه کار می‌کند
    - می‌خواهید بدانید کدام فایل‌های حافظه را بنویسید
summary: OpenClaw چگونه موارد را بین نشست‌ها به خاطر می‌سپارد
title: نمای کلی حافظه
x-i18n:
    generated_at: "2026-05-10T19:35:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw چیزها را با نوشتن **فایل‌های ساده Markdown** در workspace عامل شما به خاطر می‌سپارد. مدل فقط چیزی را «به خاطر می‌سپارد» که روی دیسک ذخیره شود — هیچ state پنهانی وجود ندارد.

## نحوه کار

عامل شما سه فایل مرتبط با حافظه دارد:

- **`MEMORY.md`** — حافظه بلندمدت. واقعیت‌ها، ترجیح‌ها و تصمیم‌های پایدار. در آغاز هر نشست DM بارگذاری می‌شود.
- **`memory/YYYY-MM-DD.md`** — یادداشت‌های روزانه. زمینه و مشاهدات جاری. یادداشت‌های امروز و دیروز به‌صورت خودکار بارگذاری می‌شوند.
- **`DREAMS.md`** (اختیاری) — دفترچه Dream و خلاصه‌های sweep مربوط به Dreaming برای بازبینی انسانی، شامل ورودی‌های backfill تاریخی مبتنی بر شواهد.

این فایل‌ها در workspace عامل قرار دارند (پیش‌فرض `~/.openclaw/workspace`).

## چه چیزی کجا قرار می‌گیرد

`MEMORY.md` لایه فشرده و گزینش‌شده است. از آن برای واقعیت‌های پایدار، ترجیح‌ها، تصمیم‌های ماندگار و خلاصه‌های کوتاهی استفاده کنید که باید در آغاز یک نشست خصوصی اصلی در دسترس باشند. این فایل برای transcript خام، گزارش روزانه یا بایگانی جامع در نظر گرفته نشده است.

فایل‌های `memory/YYYY-MM-DD.md` لایه کاری هستند. از آن‌ها برای یادداشت‌های روزانه مفصل، مشاهدات، خلاصه‌های نشست و زمینه خامی استفاده کنید که ممکن است بعدا هنوز مفید باشد. این فایل‌ها برای `memory_search` و `memory_get` ایندکس می‌شوند، اما در هر نوبت به prompt معمول bootstrap تزریق نمی‌شوند.

با گذشت زمان، انتظار می‌رود عامل مطالب مفید را از یادداشت‌های روزانه به `MEMORY.md` تقطیر کند و ورودی‌های بلندمدت کهنه را حذف کند. دستورالعمل‌های تولیدشده workspace و جریان Heartbeat می‌توانند این کار را دوره‌ای انجام دهند؛ لازم نیست برای هر جزئیاتی که باید به خاطر سپرده شود، `MEMORY.md` را دستی ویرایش کنید.

اگر `MEMORY.md` از بودجه فایل bootstrap فراتر برود، OpenClaw فایل را روی دیسک سالم نگه می‌دارد اما نسخه‌ای را که به context مدل تزریق می‌شود کوتاه می‌کند. این را نشانه‌ای بدانید برای انتقال مطالب مفصل به `memory/*.md`، نگه داشتن فقط خلاصه پایدار در `MEMORY.md`، یا افزایش محدودیت‌های bootstrap اگر صراحتا می‌خواهید بودجه prompt بیشتری مصرف کنید. برای دیدن اندازه‌های خام در برابر تزریق‌شده و وضعیت کوتاه‌سازی، از `/context list`، `/context detail` یا `openclaw doctor` استفاده کنید.

<Tip>
اگر می‌خواهید عامل شما چیزی را به خاطر بسپارد، فقط از آن بخواهید: «به خاطر بسپار که من TypeScript را ترجیح می‌دهم.» آن را در فایل مناسب می‌نویسد.
</Tip>

## تعهدات استنباط‌شده

برخی پیگیری‌های آینده واقعیت‌های پایدار نیستند. اگر به مصاحبه‌ای در فردا اشاره کنید، حافظه مفید ممکن است «بعد از مصاحبه پیگیری کن» باشد، نه «این را برای همیشه در `MEMORY.md` ذخیره کن.»

[تعهدات](/fa/concepts/commitments) حافظه‌های پیگیری کوتاه‌مدت و opt-in برای همین مورد هستند. OpenClaw آن‌ها را در یک گذر پس‌زمینه پنهان استنباط می‌کند، به همان عامل و کانال محدود می‌کند، و check-inهای موعددار را از طریق Heartbeat تحویل می‌دهد. یادآورهای صریح همچنان از [کارهای زمان‌بندی‌شده](/fa/automation/cron-jobs) استفاده می‌کنند.

## ابزارهای حافظه

عامل دو ابزار برای کار با حافظه دارد:

- **`memory_search`** — یادداشت‌های مرتبط را با جست‌وجوی معنایی پیدا می‌کند، حتی وقتی عبارت‌بندی با متن اصلی فرق داشته باشد.
- **`memory_get`** — یک فایل حافظه مشخص یا محدوده‌ای از خطوط را می‌خواند.

هر دو ابزار توسط Plugin حافظه فعال ارائه می‌شوند (پیش‌فرض: `memory-core`).

## Plugin همراه Memory Wiki

اگر می‌خواهید حافظه پایدار بیشتر شبیه یک پایگاه دانش نگهداری‌شده رفتار کند تا فقط یادداشت‌های خام، از Plugin همراه `memory-wiki` استفاده کنید.

`memory-wiki` دانش پایدار را به یک vault ویکی با این موارد کامپایل می‌کند:

- ساختار صفحه قطعی
- ادعاها و شواهد ساختاریافته
- ردیابی تناقض و تازگی
- داشبوردهای تولیدشده
- digestهای کامپایل‌شده برای مصرف‌کنندگان عامل/runtime
- ابزارهای بومی ویکی مثل `wiki_search`، `wiki_get`، `wiki_apply` و `wiki_lint`

این جایگزین Plugin حافظه فعال نمی‌شود. Plugin حافظه فعال همچنان مالک recall، promotion و Dreaming است. `memory-wiki` یک لایه دانش غنی از provenance در کنار آن اضافه می‌کند.

[Memory Wiki](/fa/plugins/memory-wiki) را ببینید.

## جست‌وجوی حافظه

وقتی یک embedding provider پیکربندی شده باشد، `memory_search` از **جست‌وجوی ترکیبی** استفاده می‌کند — ترکیب شباهت برداری (معنای معنایی) با تطبیق کلیدواژه (اصطلاحات دقیق مثل IDها و نمادهای کد). وقتی برای هر provider پشتیبانی‌شده یک API key داشته باشید، این قابلیت بدون تنظیم اضافه کار می‌کند.

<Info>
OpenClaw embedding provider شما را از روی API keyهای موجود به‌صورت خودکار تشخیص می‌دهد. اگر یک کلید OpenAI، Gemini، Voyage یا Mistral پیکربندی کرده باشید، جست‌وجوی حافظه به‌صورت خودکار فعال می‌شود.
</Info>

برای جزئیات درباره نحوه کار جست‌وجو، گزینه‌های تنظیم و راه‌اندازی provider، [جست‌وجوی حافظه](/fa/concepts/memory-search) را ببینید.

## backendهای حافظه

<CardGroup cols={3}>
<Card title="داخلی (پیش‌فرض)" icon="database" href="/fa/concepts/memory-builtin">
مبتنی بر SQLite. با جست‌وجوی کلیدواژه، شباهت برداری و جست‌وجوی ترکیبی، بدون تنظیم اضافه کار می‌کند. وابستگی اضافی ندارد.
</Card>
<Card title="QMD" icon="search" href="/fa/concepts/memory-qmd">
sidecar محلی-اول با reranking، گسترش query و توانایی ایندکس کردن دایرکتوری‌های خارج از workspace.
</Card>
<Card title="Honcho" icon="brain" href="/fa/concepts/memory-honcho">
حافظه بین‌نشستی AI-native با مدل‌سازی کاربر، جست‌وجوی معنایی و آگاهی چندعاملی. نصب Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/fa/plugins/memory-lancedb">
حافظه همراه مبتنی بر LanceDB با embeddingهای سازگار با OpenAI، auto-recall، auto-capture و پشتیبانی از embedding محلی Ollama.
</Card>
</CardGroup>

## لایه ویکی دانش

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/fa/plugins/memory-wiki">
حافظه پایدار را به یک vault ویکی غنی از provenance با ادعاها، داشبوردها، حالت bridge و workflowهای سازگار با Obsidian کامپایل می‌کند.
</Card>
</CardGroup>

## flush خودکار حافظه

پیش از آن‌که [Compaction](/fa/concepts/compaction) گفت‌وگوی شما را خلاصه کند، OpenClaw یک نوبت بی‌صدا اجرا می‌کند که به عامل یادآوری می‌کند context مهم را در فایل‌های حافظه ذخیره کند. این به‌صورت پیش‌فرض روشن است — لازم نیست چیزی را پیکربندی کنید.

برای نگه داشتن آن نوبت housekeeping روی یک مدل محلی، یک override دقیق برای مدل memory-flush تنظیم کنید:

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

این override فقط روی نوبت memory-flush اعمال می‌شود و زنجیره fallback نشست فعال را به ارث نمی‌برد.

<Tip>
flush حافظه از از دست رفتن context هنگام Compaction جلوگیری می‌کند. اگر عامل شما در گفت‌وگو واقعیت‌های مهمی داشته باشد که هنوز در فایلی نوشته نشده‌اند، پیش از رخ دادن خلاصه‌سازی به‌صورت خودکار ذخیره می‌شوند.
</Tip>

## Dreaming

Dreaming یک گذر اختیاری consolidation پس‌زمینه برای حافظه است. سیگنال‌های کوتاه‌مدت را جمع‌آوری می‌کند، candidateها را امتیازدهی می‌کند و فقط موارد واجد شرایط را به حافظه بلندمدت (`MEMORY.md`) promotion می‌کند.

طراحی شده است تا حافظه بلندمدت را پرسیگنال نگه دارد:

- **Opt-in**: به‌صورت پیش‌فرض غیرفعال است.
- **زمان‌بندی‌شده**: وقتی فعال باشد، `memory-core` به‌صورت خودکار یک cron job تکرارشونده را برای یک sweep کامل Dreaming مدیریت می‌کند.
- **آستانه‌دار**: promotionها باید از gateهای امتیاز، فراوانی recall و تنوع query عبور کنند.
- **قابل بازبینی**: خلاصه‌های فاز و ورودی‌های دفترچه در `DREAMS.md` برای بازبینی انسانی نوشته می‌شوند.

برای رفتار فاز، سیگنال‌های امتیازدهی و جزئیات Dream Diary، [Dreaming](/fa/concepts/dreaming) را ببینید.

## backfill مبتنی بر شواهد و promotion زنده

سیستم Dreaming اکنون دو lane بازبینی نزدیک به هم دارد:

- **Dreaming زنده** از store کوتاه‌مدت Dreaming در `memory/.dreams/` کار می‌کند و همان چیزی است که فاز عمیق عادی هنگام تصمیم‌گیری درباره اینکه چه چیزی می‌تواند به `MEMORY.md` منتقل شود، استفاده می‌کند.
- **backfill مبتنی بر شواهد** یادداشت‌های تاریخی `memory/YYYY-MM-DD.md` را به‌عنوان فایل‌های روز مستقل می‌خواند و خروجی بازبینی ساختاریافته را در `DREAMS.md` می‌نویسد.

backfill مبتنی بر شواهد زمانی مفید است که می‌خواهید یادداشت‌های قدیمی‌تر را دوباره پخش کنید و بررسی کنید سیستم چه چیزی را بدون ویرایش دستی `MEMORY.md` پایدار می‌داند.

وقتی استفاده می‌کنید:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

candidateهای پایدار مبتنی بر شواهد مستقیما promotion نمی‌شوند. آن‌ها در همان store کوتاه‌مدت Dreaming مرحله‌بندی می‌شوند که فاز عمیق عادی از قبل استفاده می‌کند. یعنی:

- `DREAMS.md` سطح بازبینی انسانی باقی می‌ماند.
- store کوتاه‌مدت سطح رتبه‌بندی روبه‌ماشین باقی می‌ماند.
- `MEMORY.md` همچنان فقط توسط promotion عمیق نوشته می‌شود.

اگر تصمیم گرفتید replay مفید نبوده است، می‌توانید artifactهای مرحله‌بندی‌شده را بدون دست زدن به ورودی‌های معمول diary یا state عادی recall حذف کنید:

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

## مطالعه بیشتر

- [موتور حافظه داخلی](/fa/concepts/memory-builtin): backend پیش‌فرض SQLite.
- [موتور حافظه QMD](/fa/concepts/memory-qmd): sidecar پیشرفته محلی-اول.
- [حافظه Honcho](/fa/concepts/memory-honcho): حافظه بین‌نشستی AI-native.
- [Memory LanceDB](/fa/plugins/memory-lancedb): Plugin مبتنی بر LanceDB با embeddingهای سازگار با OpenAI.
- [Memory Wiki](/fa/plugins/memory-wiki): vault دانش کامپایل‌شده و ابزارهای بومی ویکی.
- [جست‌وجوی حافظه](/fa/concepts/memory-search): pipeline جست‌وجو، providerها و تنظیم.
- [Dreaming](/fa/concepts/dreaming): promotion پس‌زمینه از recall کوتاه‌مدت به حافظه بلندمدت.
- [مرجع پیکربندی حافظه](/fa/reference/memory-config): همه knobهای پیکربندی.
- [Compaction](/fa/concepts/compaction): نحوه تعامل Compaction با حافظه.

## مرتبط

- [Active memory](/fa/concepts/active-memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
- [موتور حافظه داخلی](/fa/concepts/memory-builtin)
- [حافظه Honcho](/fa/concepts/memory-honcho)
- [Memory LanceDB](/fa/plugins/memory-lancedb)
- [تعهدات](/fa/concepts/commitments)
