---
read_when:
    - می‌خواهید بفهمید «زمینه» در OpenClaw به چه معناست.
    - در حال اشکال‌زدایی این هستید که چرا مدل چیزی را «می‌داند» (یا آن را فراموش کرده است)
    - می‌خواهید سربار زمینه را کاهش دهید (/context, /status, /compact)
summary: 'زمینه: مدل چه چیزهایی را می‌بیند، چگونه ساخته می‌شود، و چگونه آن را بررسی کنید'
title: زمینه
x-i18n:
    generated_at: "2026-05-10T19:35:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc2dae290e63f82111d865ae066567ef58ec3f48eb62b409b76ee9e6ff65d696
    source_path: concepts/context.md
    workflow: 16
---

«زمینه» یعنی **هر چیزی که OpenClaw برای یک اجرا به مدل می‌فرستد**. این مقدار به **پنجرهٔ زمینه** مدل (محدودیت توکن) محدود است.

مدل ذهنی مبتدی:

- **پرامپت سیستم** (ساخته‌شده توسط OpenClaw): قواعد، ابزارها، فهرست Skills، زمان/محیط اجرا، و فایل‌های فضای کاری تزریق‌شده.
- **تاریخچهٔ گفتگو**: پیام‌های شما + پیام‌های دستیار برای این نشست.
- **فراخوانی‌ها/نتایج ابزار + پیوست‌ها**: خروجی دستور، خواندن فایل‌ها، تصاویر/صدا، و غیره.

زمینه _همان چیزی_ نیست که «حافظه» نامیده می‌شود: حافظه می‌تواند روی دیسک ذخیره شود و بعدا دوباره بارگذاری گردد؛ زمینه چیزی است که داخل پنجرهٔ فعلی مدل قرار دارد.

## شروع سریع (بازبینی زمینه)

- `/status` → نمای سریع «پنجرهٔ من چقدر پر است؟» + تنظیمات نشست.
- `/context list` → موارد تزریق‌شده + اندازه‌های تقریبی (برای هر فایل + مجموع‌ها).
- `/context detail` → تفکیک عمیق‌تر: اندازه‌ها برای هر فایل، هر schema ابزار، هر ورودی Skill، و اندازهٔ پرامپت سیستم.
- `/context map` → تصویر treemap به سبک WinDirStat از مشارکت‌کنندگان ردیابی‌شدهٔ زمینه در نشست فعلی.
- `/usage tokens` → افزودن پانوشت مصرف برای هر پاسخ به پاسخ‌های عادی.
- `/compact` → خلاصه‌سازی تاریخچهٔ قدیمی‌تر در یک ورودی فشرده برای آزاد کردن فضای پنجره.

همچنین ببینید: [دستورهای Slash](/fa/tools/slash-commands)، [مصرف توکن و هزینه‌ها](/fa/reference/token-use)، [Compaction](/fa/concepts/compaction).

## خروجی نمونه

مقادیر بسته به مدل، provider، سیاست ابزار، و محتوای فضای کاری شما متفاوت است.

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

### `/context map`

تصویری تولیدشده از آخرین گزارش اجرای cacheشده را می‌فرستد. پیش از آنکه یک پیام عادی در نشست گزارشی از اجرا تولید کرده باشد، `/context map` به‌جای رندر کردن برآورد، یک پیام ناموجود بودن برمی‌گرداند. مساحت مستطیل با نویسه‌های پرامپت ردیابی‌شده متناسب است:

- فایل‌های فضای کاری تزریق‌شده
- متن پایهٔ پرامپت سیستم
- ورودی‌های پرامپت Skill
- schemaهای JSON ابزار

`/context list`، `/context detail`، و `/context json` همچنان می‌توانند وقتی هیچ گزارش اجرایی cache نشده است، یک برآورد درخواستی را بررسی کنند.

## چه چیزهایی در پنجرهٔ زمینه حساب می‌شوند

هر چیزی که مدل دریافت می‌کند حساب می‌شود، از جمله:

- پرامپت سیستم (همهٔ بخش‌ها).
- تاریخچهٔ گفتگو.
- فراخوانی‌های ابزار + نتایج ابزار.
- پیوست‌ها/رونوشت‌ها (تصاویر/صدا/فایل‌ها).
- خلاصه‌های Compaction و artifactهای هرس.
- «wrapper»های provider یا سرآیندهای پنهان (قابل مشاهده نیستند، اما همچنان حساب می‌شوند).

## OpenClaw چگونه پرامپت سیستم را می‌سازد

پرامپت سیستم **در مالکیت OpenClaw** است و در هر اجرا دوباره ساخته می‌شود. شامل این موارد است:

- فهرست ابزارها + توضیح‌های کوتاه.
- فهرست Skills (فقط metadata؛ پایین‌تر را ببینید).
- مکان فضای کاری.
- زمان (UTC + زمان کاربرِ تبدیل‌شده اگر پیکربندی شده باشد).
- metadata محیط اجرا (host/OS/model/thinking).
- فایل‌های bootstrap تزریق‌شدهٔ فضای کاری زیر **زمینهٔ پروژه**.

تفکیک کامل: [پرامپت سیستم](/fa/concepts/system-prompt).

## فایل‌های فضای کاری تزریق‌شده (زمینهٔ پروژه)

به‌طور پیش‌فرض، OpenClaw مجموعه‌ای ثابت از فایل‌های فضای کاری را تزریق می‌کند (اگر موجود باشند):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (فقط اجرای اول)

فایل‌های بزرگ برای هر فایل با استفاده از `agents.defaults.bootstrapMaxChars` (پیش‌فرض `12000` نویسه) کوتاه می‌شوند. OpenClaw همچنین یک سقف کلی برای تزریق bootstrap در میان فایل‌ها با `agents.defaults.bootstrapTotalMaxChars` (پیش‌فرض `60000` نویسه) اعمال می‌کند. `/context` اندازه‌های **خام در برابر تزریق‌شده** و اینکه آیا کوتاه‌سازی رخ داده است یا نه را نشان می‌دهد.

وقتی کوتاه‌سازی رخ می‌دهد، محیط اجرا می‌تواند یک بلوک هشدار درون پرامپت زیر زمینهٔ پروژه تزریق کند. این را با `agents.defaults.bootstrapPromptTruncationWarning` (`off`، `once`، `always`؛ پیش‌فرض `once`) پیکربندی کنید.

## Skills: تزریق‌شده در برابر بارگذاری در زمان نیاز

پرامپت سیستم یک **فهرست Skills** فشرده (نام + توضیح + مکان) را شامل می‌شود. این فهرست سربار واقعی دارد.

دستورالعمل‌های Skill به‌طور پیش‌فرض گنجانده نمی‌شوند. انتظار می‌رود مدل `SKILL.md` مربوط به Skill را **فقط وقتی لازم است** `read` کند.

## ابزارها: دو نوع هزینه وجود دارد

ابزارها به دو روش روی زمینه اثر می‌گذارند:

1. **متن فهرست ابزارها** در پرامپت سیستم (چیزی که با عنوان «ابزارسازی» می‌بینید).
2. **schemaهای ابزار** (JSON). این‌ها به مدل فرستاده می‌شوند تا بتواند ابزارها را فراخوانی کند. با وجود اینکه آن‌ها را به‌صورت متن ساده نمی‌بینید، در زمینه حساب می‌شوند.

`/context detail` بزرگ‌ترین schemaهای ابزار را تفکیک می‌کند تا ببینید چه چیزی غالب است.

## دستورها، directiveها، و «میان‌برهای درون‌خطی»

دستورهای Slash توسط Gateway مدیریت می‌شوند. چند رفتار متفاوت وجود دارد:

- **دستورهای مستقل**: پیامی که فقط `/...` باشد به‌عنوان دستور اجرا می‌شود.
- **directiveها**: `/think`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/model`، `/queue` پیش از اینکه مدل پیام را ببیند حذف می‌شوند.
  - پیام‌های فقط directive تنظیمات نشست را ماندگار می‌کنند.
  - directiveهای درون‌خطی در یک پیام عادی به‌عنوان راهنمای همان پیام عمل می‌کنند.
- **میان‌برهای درون‌خطی** (فقط فرستنده‌های allowlistشده): برخی tokenهای `/...` داخل یک پیام عادی می‌توانند بلافاصله اجرا شوند (مثال: "hey /status")، و پیش از اینکه مدل متن باقی‌مانده را ببیند حذف می‌شوند.

جزئیات: [دستورهای Slash](/fa/tools/slash-commands).

## نشست‌ها، Compaction، و هرس (چه چیزی ماندگار می‌ماند)

اینکه چه چیزی بین پیام‌ها ماندگار می‌ماند به سازوکار بستگی دارد:

- **تاریخچهٔ عادی** تا زمانی که طبق سیاست compact/هرس شود، در رونوشت نشست ماندگار می‌ماند.
- **Compaction** یک خلاصه را در رونوشت ماندگار می‌کند و پیام‌های اخیر را دست‌نخورده نگه می‌دارد.
- **هرس** نتایج قدیمی ابزار را از پرامپت _درون‌حافظه‌ای_ حذف می‌کند تا فضای پنجرهٔ زمینه آزاد شود، اما رونوشت نشست را بازنویسی نمی‌کند - تاریخچهٔ کامل همچنان روی دیسک قابل بررسی است.

مستندات: [نشست](/fa/concepts/session)، [Compaction](/fa/concepts/compaction)، [هرس نشست](/fa/concepts/session-pruning).

به‌طور پیش‌فرض، OpenClaw برای مونتاژ و Compaction از موتور زمینهٔ داخلی `legacy` استفاده می‌کند. اگر Pluginای نصب کنید که `kind: "context-engine"` را ارائه می‌دهد و آن را با `plugins.slots.contextEngine` انتخاب کنید، OpenClaw مونتاژ زمینه، `/compact`، و hookهای مرتبط چرخهٔ عمر زمینهٔ subagent را به‌جای آن به همان موتور واگذار می‌کند. `ownsCompaction: false` به‌طور خودکار به موتور `legacy` fallback نمی‌کند؛ موتور فعال همچنان باید `compact()` را درست پیاده‌سازی کند. برای رابط pluggable کامل، hookهای چرخهٔ عمر، و پیکربندی، [موتور زمینه](/fa/concepts/context-engine) را ببینید.

## `/context` در عمل چه چیزی گزارش می‌کند

`/context` وقتی در دسترس باشد، آخرین گزارش پرامپت سیستم **ساخته‌شده در اجرا** را ترجیح می‌دهد:

- `System prompt (run)` = از آخرین اجرای embedded (دارای قابلیت ابزار) گرفته شده و در مخزن نشست ماندگار شده است.
- `System prompt (estimate)` = وقتی هیچ گزارش اجرایی وجود ندارد (یا هنگام اجرا از طریق backend نوع CLI که گزارش را تولید نمی‌کند) در لحظه محاسبه می‌شود.

در هر حالت، اندازه‌ها و مشارکت‌کنندگان اصلی را گزارش می‌کند؛ **نه** پرامپت سیستم کامل یا schemaهای ابزار را dump می‌کند.

## مرتبط

<CardGroup cols={2}>
  <Card title="موتور زمینه" href="/fa/concepts/context-engine" icon="puzzle-piece">
    تزریق زمینهٔ سفارشی از طریق plugins.
  </Card>
  <Card title="Compaction" href="/fa/concepts/compaction" icon="compress">
    خلاصه‌سازی گفتگوهای طولانی برای نگه داشتن آن‌ها داخل پنجرهٔ مدل.
  </Card>
  <Card title="پرامپت سیستم" href="/fa/concepts/system-prompt" icon="message-lines">
    پرامپت سیستم چگونه ساخته می‌شود و در هر نوبت چه چیزی تزریق می‌کند.
  </Card>
  <Card title="حلقهٔ agent" href="/fa/concepts/agent-loop" icon="arrows-rotate">
    چرخهٔ کامل اجرای agent از پیام ورودی تا پاسخ نهایی.
  </Card>
</CardGroup>
