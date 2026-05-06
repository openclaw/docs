---
read_when:
    - می‌خواهید بدانید «زمینه» در OpenClaw به چه معناست
    - در حال اشکال‌زدایی این هستید که چرا مدل چیزی را «می‌داند» (یا آن را فراموش کرده است)
    - می‌خواهید سربار زمینه را کاهش دهید (/context, /status, /compact)
summary: 'زمینه: آنچه مدل می‌بیند، نحوهٔ ساخته‌شدن آن، و نحوهٔ بررسی آن'
title: زمینه
x-i18n:
    generated_at: "2026-05-06T09:10:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

«Context» یعنی **هر چیزی که OpenClaw برای یک اجرا به مدل می‌فرستد**. این مقدار با **context window** مدل (محدودیت توکن) محدود می‌شود.

مدل ذهنی برای مبتدیان:

- **پرامپت سیستم** (ساخته‌شده توسط OpenClaw): قوانین، ابزارها، فهرست Skills، زمان/محیط اجرا، و فایل‌های workspace تزریق‌شده.
- **تاریخچه مکالمه**: پیام‌های شما + پیام‌های دستیار در این نشست.
- **فراخوانی‌ها/نتایج ابزار + پیوست‌ها**: خروجی فرمان، خواندن فایل‌ها، تصاویر/صدا، و غیره.

Context _همان_ «حافظه» نیست: حافظه می‌تواند روی دیسک ذخیره شود و بعداً دوباره بارگذاری شود؛ context چیزی است که داخل پنجره فعلی مدل قرار دارد.

## شروع سریع (بررسی context)

- `/status` → نمای سریع «پنجره من چقدر پر است؟» + تنظیمات نشست.
- `/context list` → موارد تزریق‌شده + اندازه‌های تقریبی (برای هر فایل + مجموع‌ها).
- `/context detail` → تفکیک عمیق‌تر: اندازه‌های هر فایل، هر schema ابزار، هر ورودی Skill، و اندازه پرامپت سیستم.
- `/usage tokens` → افزودن پانویس مصرف هر پاسخ به پاسخ‌های عادی.
- `/compact` → خلاصه‌سازی تاریخچه قدیمی‌تر در یک ورودی فشرده برای آزاد کردن فضای پنجره.

همچنین ببینید: [فرمان‌های اسلش](/fa/tools/slash-commands)، [مصرف توکن و هزینه‌ها](/fa/reference/token-use)، [Compaction](/fa/concepts/compaction).

## نمونه خروجی

مقادیر بسته به مدل، provider، سیاست ابزار، و محتوای workspace شما متفاوت‌اند.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## چه چیزهایی در context window محاسبه می‌شوند

هر چیزی که مدل دریافت می‌کند محاسبه می‌شود، از جمله:

- پرامپت سیستم (همه بخش‌ها).
- تاریخچه مکالمه.
- فراخوانی‌های ابزار + نتایج ابزار.
- پیوست‌ها/رونوشت‌ها (تصاویر/صدا/فایل‌ها).
- خلاصه‌های Compaction و آثار هرس.
- «پوشش‌ها» یا سرآیندهای پنهان provider (قابل مشاهده نیستند، اما همچنان محاسبه می‌شوند).

## OpenClaw چگونه پرامپت سیستم را می‌سازد

پرامپت سیستم **در مالکیت OpenClaw** است و در هر اجرا دوباره ساخته می‌شود. شامل این موارد است:

- فهرست ابزار + توضیح‌های کوتاه.
- فهرست Skills (فقط فراداده؛ پایین‌تر را ببینید).
- مکان workspace.
- زمان (UTC + زمان تبدیل‌شده کاربر، اگر پیکربندی شده باشد).
- فراداده محیط اجرا (host/OS/model/thinking).
- فایل‌های bootstrap تزریق‌شده workspace زیر **Project Context**.

تفکیک کامل: [پرامپت سیستم](/fa/concepts/system-prompt).

## فایل‌های تزریق‌شده workspace (Project Context)

به‌صورت پیش‌فرض، OpenClaw مجموعه ثابتی از فایل‌های workspace را تزریق می‌کند (اگر وجود داشته باشند):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (فقط اجرای نخست)

فایل‌های بزرگ برای هر فایل با استفاده از `agents.defaults.bootstrapMaxChars` (پیش‌فرض `12000` کاراکتر) کوتاه می‌شوند. OpenClaw همچنین یک سقف کلی تزریق bootstrap در همه فایل‌ها با `agents.defaults.bootstrapTotalMaxChars` (پیش‌فرض `60000` کاراکتر) اعمال می‌کند. `/context` اندازه‌های **خام در برابر تزریق‌شده** و وقوع کوتاه‌سازی را نشان می‌دهد.

وقتی کوتاه‌سازی رخ می‌دهد، محیط اجرا می‌تواند یک بلوک هشدار داخل پرامپت زیر Project Context تزریق کند. این را با `agents.defaults.bootstrapPromptTruncationWarning` (`off`، `once`، `always`؛ پیش‌فرض `once`) پیکربندی کنید.

## Skills: تزریق‌شده در برابر بارگذاری برحسب نیاز

پرامپت سیستم شامل یک **فهرست Skills** فشرده است (نام + توضیح + مکان). این فهرست سربار واقعی دارد.

دستورالعمل‌های Skill به‌صورت پیش‌فرض گنجانده نمی‌شوند. انتظار می‌رود مدل `SKILL.md` مربوط به Skill را **فقط در صورت نیاز** `read` کند.

## ابزارها: دو نوع هزینه وجود دارد

ابزارها به دو شکل روی context اثر می‌گذارند:

1. **متن فهرست ابزار** در پرامپت سیستم (چیزی که به‌عنوان «Tooling» می‌بینید).
2. **schemaهای ابزار** (JSON). این‌ها به مدل فرستاده می‌شوند تا بتواند ابزارها را فراخوانی کند. حتی با اینکه آن‌ها را به‌صورت متن ساده نمی‌بینید، در context محاسبه می‌شوند.

`/context detail` بزرگ‌ترین schemaهای ابزار را تفکیک می‌کند تا ببینید چه چیزی غالب است.

## فرمان‌ها، directiveها، و «میان‌برهای درون‌خطی»

فرمان‌های اسلش توسط Gateway مدیریت می‌شوند. چند رفتار متفاوت وجود دارد:

- **فرمان‌های مستقل**: پیامی که فقط `/...` باشد به‌عنوان فرمان اجرا می‌شود.
- **directiveها**: `/think`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/model`، `/queue` پیش از اینکه مدل پیام را ببیند حذف می‌شوند.
  - پیام‌های فقط directive تنظیمات نشست را پایدار می‌کنند.
  - directiveهای درون‌خطی در یک پیام عادی به‌عنوان راهنمای همان پیام عمل می‌کنند.
- **میان‌برهای درون‌خطی** (فقط فرستنده‌های allowlist‌شده): برخی توکن‌های `/...` داخل یک پیام عادی می‌توانند بلافاصله اجرا شوند (مثال: "hey /status")، و پیش از اینکه مدل متن باقی‌مانده را ببیند حذف می‌شوند.

جزئیات: [فرمان‌های اسلش](/fa/tools/slash-commands).

## نشست‌ها، Compaction، و هرس (چه چیزی پایدار می‌ماند)

چیزی که بین پیام‌ها پایدار می‌ماند به سازوکار بستگی دارد:

- **تاریخچه عادی** تا زمانی که طبق سیاست compact/prune شود، در transcript نشست باقی می‌ماند.
- **Compaction** یک خلاصه را در transcript پایدار می‌کند و پیام‌های اخیر را دست‌نخورده نگه می‌دارد.
- **هرس** نتایج قدیمی ابزار را از پرامپت _درون‌حافظه‌ای_ حذف می‌کند تا فضای context-window آزاد شود، اما transcript نشست را بازنویسی نمی‌کند - تاریخچه کامل همچنان روی دیسک قابل بررسی است.

مستندات: [نشست](/fa/concepts/session)، [Compaction](/fa/concepts/compaction)، [هرس نشست](/fa/concepts/session-pruning).

به‌صورت پیش‌فرض، OpenClaw از موتور context داخلی `legacy` برای مونتاژ و
Compaction استفاده می‌کند. اگر Pluginی نصب کنید که `kind: "context-engine"` ارائه می‌دهد و
آن را با `plugins.slots.contextEngine` انتخاب کنید، OpenClaw به‌جای آن مونتاژ context،
`/compact`، و hookهای مرتبط چرخه‌عمر context زیرعامل را به همان
موتور واگذار می‌کند. `ownsCompaction: false` باعث fallback خودکار به موتور
legacy نمی‌شود؛ موتور فعال همچنان باید `compact()` را درست پیاده‌سازی کند. برای interface کامل
قابل‌اتصال، hookهای چرخه‌عمر، و پیکربندی، [موتور Context](/fa/concepts/context-engine) را ببینید.

## `/context` واقعاً چه چیزی را گزارش می‌کند

`/context` وقتی در دسترس باشد، تازه‌ترین گزارش پرامپت سیستم **ساخته‌شده برای اجرا** را ترجیح می‌دهد:

- `System prompt (run)` = از آخرین اجرای embedded (دارای قابلیت ابزار) گرفته شده و در session store پایدار شده است.
- `System prompt (estimate)` = وقتی گزارش اجرا وجود ندارد (یا هنگام اجرا از طریق یک backend CLI که گزارش تولید نمی‌کند) همان لحظه محاسبه می‌شود.

در هر دو حالت، اندازه‌ها و مشارکت‌کنندگان اصلی را گزارش می‌کند؛ **کل** پرامپت سیستم یا schemaهای ابزار را dump نمی‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="موتور Context" href="/fa/concepts/context-engine" icon="puzzle-piece">
    تزریق context سفارشی از طریق plugins.
  </Card>
  <Card title="Compaction" href="/fa/concepts/compaction" icon="compress">
    خلاصه‌سازی مکالمه‌های طولانی برای نگه‌داشتن آن‌ها داخل پنجره مدل.
  </Card>
  <Card title="پرامپت سیستم" href="/fa/concepts/system-prompt" icon="message-lines">
    پرامپت سیستم چگونه ساخته می‌شود و در هر نوبت چه چیزی تزریق می‌کند.
  </Card>
  <Card title="حلقه عامل" href="/fa/concepts/agent-loop" icon="arrows-rotate">
    چرخه کامل اجرای عامل از پیام ورودی تا پاسخ نهایی.
  </Card>
</CardGroup>
