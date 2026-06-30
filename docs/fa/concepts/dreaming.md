---
read_when:
    - می‌خواهید ارتقای حافظه به‌صورت خودکار اجرا شود
    - می‌خواهید بفهمید هر مرحلهٔ Dreaming چه کاری انجام می‌دهد
    - می‌خواهید تجمیع را بدون آلوده‌کردن MEMORY.md تنظیم کنید
sidebarTitle: Dreaming
summary: تثبیت حافظه در پس‌زمینه با فازهای سبک، عمیق و REM به‌همراه دفترچهٔ رؤیا
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T14:17:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming سامانهٔ یکپارچه‌سازی حافظه در پس‌زمینه در `memory-core` است. این سامانه به OpenClaw کمک می‌کند سیگنال‌های کوتاه‌مدت قوی را به حافظهٔ پایدار منتقل کند، در حالی که فرایند توضیح‌پذیر و قابل‌بازبینی باقی می‌ماند.

<Note>
Dreaming **اختیاری** است و به‌صورت پیش‌فرض غیرفعال است.
</Note>

## Dreaming چه چیزهایی می‌نویسد

Dreaming دو نوع خروجی نگه می‌دارد:

- **وضعیت ماشینی** در `memory/.dreams/` (ذخیرهٔ recall، سیگنال‌های فاز، نقاط وارسی ingestion، قفل‌ها).
- **خروجی خوانا برای انسان** در `DREAMS.md` (یا `dreams.md` موجود) و فایل‌های اختیاری گزارش فاز در `memory/dreaming/<phase>/YYYY-MM-DD.md`.

ارتقای بلندمدت همچنان فقط در `MEMORY.md` می‌نویسد.

## مدل فاز

Dreaming از سه فاز همکاری‌کننده استفاده می‌کند:

| فاز | هدف                                   | نوشتن پایدار     |
| ----- | ----------------------------------------- | ----------------- |
| Light | مرتب‌سازی و آماده‌سازی مواد کوتاه‌مدت اخیر | خیر                |
| Deep  | امتیازدهی و ارتقای نامزدهای پایدار      | بله (`MEMORY.md`) |
| REM   | بازاندیشی دربارهٔ تم‌ها و ایده‌های تکرارشونده     | خیر                |

این فازها جزئیات داخلی پیاده‌سازی هستند، نه «حالت‌های» جداگانه‌ای که کاربر پیکربندی کند.

<AccordionGroup>
  <Accordion title="فاز Light">
    فاز Light سیگنال‌های حافظهٔ روزانهٔ اخیر و ردهای recall را ingest می‌کند، آن‌ها را dedupe می‌کند، و خط‌های نامزد را آماده می‌کند.

    - از وضعیت recall کوتاه‌مدت، فایل‌های حافظهٔ روزانهٔ اخیر، و رونوشت‌های redacted جلسه در صورت وجود می‌خواند.
    - وقتی ذخیره‌سازی شامل خروجی درون‌خطی باشد، یک بلوک مدیریت‌شدهٔ `## Light Sleep` می‌نویسد.
    - سیگنال‌های reinforcement را برای رتبه‌بندی Deep بعدی ثبت می‌کند.
    - هرگز در `MEMORY.md` نمی‌نویسد.

  </Accordion>
  <Accordion title="فاز Deep">
    فاز Deep تصمیم می‌گیرد چه چیزی به حافظهٔ بلندمدت تبدیل شود.

    - نامزدها را با امتیازدهی وزن‌دار و gateهای آستانه رتبه‌بندی می‌کند.
    - برای عبور، به `minScore`، `minRecallCount`، و `minUniqueQueries` نیاز دارد.
    - پیش از نوشتن، snippetها را از فایل‌های روزانهٔ زنده rehydrate می‌کند تا snippetهای کهنه/حذف‌شده نادیده گرفته شوند.
    - ورودی‌های ارتقایافته را به `MEMORY.md` اضافه می‌کند.
    - یک خلاصهٔ `## Deep Sleep` در `DREAMS.md` می‌نویسد و در صورت پیکربندی، `memory/dreaming/deep/YYYY-MM-DD.md` را نیز می‌نویسد.

  </Accordion>
  <Accordion title="فاز REM">
    فاز REM الگوها و سیگنال‌های تأملی را استخراج می‌کند.

    - خلاصه‌های theme و reflection را از ردهای کوتاه‌مدت اخیر می‌سازد.
    - وقتی ذخیره‌سازی شامل خروجی درون‌خطی باشد، یک بلوک مدیریت‌شدهٔ `## REM Sleep` می‌نویسد.
    - سیگنال‌های reinforcement فاز REM را که رتبه‌بندی Deep استفاده می‌کند ثبت می‌کند.
    - هرگز در `MEMORY.md` نمی‌نویسد.

  </Accordion>
</AccordionGroup>

## ingestion رونوشت جلسه

Dreaming می‌تواند رونوشت‌های redacted جلسه را در پیکرهٔ Dreaming ingest کند. وقتی رونوشت‌ها موجود باشند، همراه با سیگنال‌های حافظهٔ روزانه و ردهای recall وارد فاز Light می‌شوند. محتوای شخصی و حساس پیش از ingestion redacted می‌شود.

## دفترچهٔ رؤیا

Dreaming همچنین یک **دفترچهٔ رؤیا** روایی در `DREAMS.md` نگه می‌دارد. پس از آنکه هر فاز مواد کافی داشته باشد، `memory-core` یک نوبت subagent پس‌زمینه به‌صورت best-effort اجرا می‌کند و یک یادداشت کوتاه دفترچه اضافه می‌کند. مگر اینکه `dreaming.model` پیکربندی شده باشد، از مدل runtime پیش‌فرض استفاده می‌کند. اگر مدل پیکربندی‌شده در دسترس نباشد، دفترچهٔ رؤیا یک‌بار با مدل پیش‌فرض جلسه دوباره تلاش می‌کند.

<Note>
این دفترچه برای خواندن انسان در رابط کاربری رؤیاهاست، نه منبع ارتقا. artifactهای دفترچه/گزارش تولیدشده توسط Dreaming از ارتقای کوتاه‌مدت مستثنا هستند. فقط snippetهای حافظهٔ grounded واجد شرایط ارتقا به `MEMORY.md` هستند.
</Note>

همچنین یک مسیر backfill تاریخی grounded برای کارهای بازبینی و بازیابی وجود دارد:

<AccordionGroup>
  <Accordion title="دستورهای Backfill">
    - `memory rem-harness --path ... --grounded` خروجی دفترچهٔ grounded را از یادداشت‌های تاریخی `YYYY-MM-DD.md` پیش‌نمایش می‌کند.
    - `memory rem-backfill --path ...` ورودی‌های دفترچهٔ grounded و برگشت‌پذیر را در `DREAMS.md` می‌نویسد.
    - `memory rem-backfill --path ... --stage-short-term` نامزدهای پایدار grounded را در همان ذخیرهٔ شواهد کوتاه‌مدتی stage می‌کند که فاز Deep عادی از قبل استفاده می‌کند.
    - `memory rem-backfill --rollback` و `--rollback-short-term` آن artifactهای backfill آماده‌شده را بدون دست‌زدن به ورودی‌های عادی دفترچه یا recall کوتاه‌مدت زنده حذف می‌کنند.

  </Accordion>
</AccordionGroup>

رابط کاربری کنترل همان جریان backfill/reset دفترچه را ارائه می‌کند تا بتوانید پیش از تصمیم‌گیری دربارهٔ اینکه نامزدهای grounded شایستهٔ ارتقا هستند یا نه، نتایج را در صحنهٔ رؤیاها بررسی کنید. صحنه همچنین یک مسیر grounded مجزا نشان می‌دهد تا بتوانید ببینید کدام ورودی‌های کوتاه‌مدت stage‌شده از بازپخش تاریخی آمده‌اند، کدام موارد ارتقایافته grounded-led بوده‌اند، و فقط ورودی‌های stage‌شدهٔ grounded-only را بدون دست‌زدن به وضعیت کوتاه‌مدت زندهٔ عادی پاک کنید.

## سیگنال‌های رتبه‌بندی Deep

رتبه‌بندی Deep از شش سیگنال پایهٔ وزن‌دار به‌علاوهٔ reinforcement فاز استفاده می‌کند:

| سیگنال              | وزن | توضیح                                       |
| ------------------- | ------ | ------------------------------------------------- |
| فراوانی           | 0.24   | تعداد سیگنال‌های کوتاه‌مدتی که ورودی انباشته کرده است |
| ارتباط           | 0.30   | میانگین کیفیت بازیابی برای ورودی           |
| تنوع query     | 0.15   | زمینه‌های query/روز متمایزی که آن را آشکار کرده‌اند      |
| تازگی             | 0.15   | امتیاز تازگی با کاهش زمانی                      |
| یکپارچه‌سازی       | 0.10   | قدرت تکرار در چند روز                     |
| غنای مفهومی | 0.06   | چگالی tag مفهومی از snippet/path             |

hitهای فاز Light و REM یک boost کوچک با کاهش تازگی از `memory/.dreams/phase-signals.json` اضافه می‌کنند.

نتایج shadow-trial می‌توانند به‌عنوان یک سیگنال بازبینی، پیش از هر نوشتن پایدار، روی آن امتیاز پایه لایه‌بندی شوند. یک trial مفید به نامزد boost کوچک و bounded می‌دهد، یک trial خنثی آن را deferred نگه می‌دارد، و یک trial مضر آن را برای آن گذر امتیازدهی rejected علامت‌گذاری می‌کند. این سیگنال همچنان فقط گزارشی است: می‌تواند ترتیب نامزدها یا metadata بازبینی را تغییر دهد، اما در `MEMORY.md` نمی‌نویسد و به‌تنهایی نامزد را ارتقا نمی‌دهد.

## پوشش گزارش shadow trial در QA

QA Lab یک سناریوی فقط-گزارشی برای بررسی این دارد که shadow trial آیندهٔ Dreaming چگونه می‌تواند پیش از ارتقا یک حافظهٔ نامزد را بازبینی کند. این سناریو از یک agent می‌خواهد یک پاسخ baseline را با پاسخی که می‌تواند از حافظهٔ نامزد استفاده کند مقایسه کند، سپس یک گزارش محلی با verdict، دلیل، و flagهای ریسک بنویسد.

این پوشش عمداً به QA محدود شده است. تأیید می‌کند که artifact گزارش جدا از `MEMORY.md` باقی می‌ماند و agent ادعا نمی‌کند که نامزد ارتقا یافته است. این پوشش رفتار production برای shadow-trial اضافه نمی‌کند و موتور ارتقای فاز Deep را تغییر نمی‌دهد.

runner مربوط به shadow-trial در `memory-core` همین قرارداد فقط-گزارشی را برای مسیرهای کدی که به artifact پایدار نیاز دارند نگه می‌دارد. این runner نامزد، prompt آزمایش، نتیجهٔ baseline، نتیجهٔ نامزد، verdict، دلیل، flagهای ریسک، و ارجاع‌های شواهد را می‌پذیرد، سپس گزارشی با `promotion action: report-only` می‌نویسد. verdictهای مفید به توصیهٔ `promote` نگاشت می‌شوند، verdictهای خنثی به `defer`، و verdictهای مضر به `reject`؛ هیچ‌کدام از این توصیه‌ها در `MEMORY.md` نمی‌نویسد یا ارتقای فاز Deep را اعمال نمی‌کند.

## زمان‌بندی

وقتی فعال باشد، `memory-core` یک job از نوع Cron را برای یک sweep کامل Dreaming به‌صورت خودکار مدیریت می‌کند. هر sweep فازها را به‌ترتیب اجرا می‌کند: Light → REM → Deep.

این sweep شامل workspace اصلی runtime و هر workspace پیکربندی‌شدهٔ agent است که بر اساس path dedupe شده‌اند، بنابراین fan-out مربوط به workspaceهای subagent باعث حذف `DREAMS.md` و وضعیت حافظهٔ agent اصلی نمی‌شود.

رفتار cadence پیش‌فرض:

| تنظیم              | پیش‌فرض       |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |
| `dreaming.model`     | مدل پیش‌فرض |

## شروع سریع

<Tabs>
  <Tab title="فعال‌سازی Dreaming">
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
  </Tab>
  <Tab title="cadence سفارشی sweep">
    ```json
    {
      "plugins": {
        "entries": {
          "memory-core": {
            "config": {
              "dreaming": {
                "enabled": true,
                "timezone": "America/Los_Angeles",
                "frequency": "0 */6 * * *"
              }
            }
          }
        }
      }
    }
    ```
  </Tab>
</Tabs>

## دستور Slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` و `/dreaming off` پیکربندی سراسری gateway را تغییر می‌دهند. فراخوان‌های کانال باید owner باشند، و کلاینت‌های Gateway باید `operator.admin` داشته باشند. `/dreaming status` و `/dreaming help` فقط-خواندنی باقی می‌مانند.

## گردش‌کار CLI

<Tabs>
  <Tab title="پیش‌نمایش / اعمال ارتقا">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` دستی به‌صورت پیش‌فرض از آستانه‌های فاز Deep استفاده می‌کند، مگر اینکه با flagهای CLI override شده باشد.

  </Tab>
  <Tab title="توضیح ارتقا">
    توضیح دهید چرا یک نامزد مشخص ارتقا پیدا می‌کند یا نمی‌کند:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="پیش‌نمایش harness فاز REM">
    reflectionهای REM، truthهای نامزد، و خروجی ارتقای Deep را بدون نوشتن هیچ‌چیز پیش‌نمایش کنید:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## پیش‌فرض‌های کلیدی

همهٔ تنظیمات زیر `plugins.entries.memory-core.config.dreaming` قرار دارند.

<ParamField path="enabled" type="boolean" default="false">
  sweep مربوط به Dreaming را فعال یا غیرفعال کنید.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  cadence از نوع Cron برای sweep کامل Dreaming.
</ParamField>
<ParamField path="model" type="string">
  override اختیاری مدل subagent برای دفترچهٔ رؤیا. هنگام تنظیم allowlist مربوط به `allowedModels` در subagent، از مقدار canonical از نوع `provider/model` استفاده کنید.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  حداکثر تعداد token تخمینی که از هر snippet کوتاه‌مدت recall ارتقایافته به `MEMORY.md` نگه داشته می‌شود. provenance رتبه‌بندی همچنان قابل مشاهده می‌ماند.
</ParamField>

<Warning>
`dreaming.model` به `plugins.entries.memory-core.subagent.allowModelOverride: true` نیاز دارد. برای محدودکردن آن، `plugins.entries.memory-core.subagent.allowedModels` را نیز تنظیم کنید. خطاهای trust یا allowlist به‌جای fallback بی‌صدا، قابل مشاهده باقی می‌مانند؛ retry فقط خطاهای model-unavailable را پوشش می‌دهد.
</Warning>

<Note>
بیشتر policyهای فاز، آستانه‌ها، و رفتار ذخیره‌سازی جزئیات داخلی پیاده‌سازی هستند. برای فهرست کامل کلیدها، [مرجع پیکربندی حافظه](/fa/reference/memory-config#dreaming) را ببینید.
</Note>

## رابط کاربری رؤیاها

وقتی فعال باشد، تب **رؤیاها** در Gateway نشان می‌دهد:

- وضعیت فعلی فعال‌بودن Dreaming
- وضعیت در سطح فاز و وجود managed-sweep
- شمارش‌های کوتاه‌مدت، grounded، signal، و promoted-today
- زمان اجرای برنامه‌ریزی‌شدهٔ بعدی
- یک مسیر Scene grounded متمایز برای ورودی‌های بازپخش تاریخی stage‌شده
- یک خوانندهٔ قابل‌گسترش دفترچهٔ رؤیا با پشتوانهٔ `doctor.memory.dreamDiary`

## Dreaming هرگز اجرا نمی‌شود: status مقدار blocked نشان می‌دهد

اگر `openclaw memory status` مقدار `Dreaming status: blocked` را گزارش کند، Cron مدیریت‌شده وجود دارد اما Heartbeat پیش‌فرض agent اجرا نمی‌شود. بررسی کنید که Heartbeat برای agent پیش‌فرض فعال باشد و target آن `none` نباشد، سپس پس از فاصلهٔ Heartbeat بعدی دوباره `openclaw memory status --deep` را اجرا کنید.

## مرتبط

- [حافظه](/fa/concepts/memory)
- [CLI حافظه](/fa/cli/memory)
- [مرجع پیکربندی حافظه](/fa/reference/memory-config)
- [جستجوی حافظه](/fa/concepts/memory-search)
