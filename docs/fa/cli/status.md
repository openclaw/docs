---
read_when:
    - می‌خواهید یک تشخیص سریع از سلامت کانال + گیرندگان نشست‌های اخیر داشته باشید
    - برای اشکال‌زدایی، یک وضعیت «همه» می‌خواهید که قابل چسباندن باشد
summary: مرجع CLI برای `openclaw status` (عیب‌یابی، پروب‌ها، نماگرفت‌های کاربرد)
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T17:29:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
    source_path: cli/status.md
    workflow: 16
---

عیب‌یابی برای کانال‌ها + نشست‌ها.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

نکات:

- `--deep` کاوش‌های زنده را اجرا می‌کند (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` ساده روی مسیر سریع فقط‌خواندنی می‌ماند و وقتی بررسی حافظه را رد می‌کند، به‌جای ناموجود، حافظه را با `not checked` علامت‌گذاری می‌کند. ممیزی امنیتی سنگین، سازگاری Plugin، و کاوش‌های بردار حافظه به `openclaw status --all`، `openclaw status --deep`، `openclaw security audit`، و `openclaw memory status --deep` واگذار می‌شوند.
- `status --json --all` جزئیات حافظه را از زمان‌اجرای Plugin حافظه فعال که با `plugins.slots.memory` انتخاب شده گزارش می‌کند. Pluginهای حافظه سفارشی می‌توانند `agents.defaults.memorySearch.enabled` داخلی را غیرفعال نگه دارند و همچنان فایل‌ها، قطعه‌ها، بردار، و وضعیت FTS خودشان را گزارش کنند.
- `--usage` پنجره‌های استفاده نرمال‌سازی‌شده ارائه‌دهنده را به‌شکل `X% left` چاپ می‌کند.
- خروجی وضعیت نشست، `Execution:` را از `Runtime:` جدا می‌کند. `Execution` مسیر sandbox است (`direct`، `docker/*`)، درحالی‌که `Runtime` به شما می‌گوید نشست از `OpenClaw Default`، `OpenAI Codex`، یک backend مربوط به CLI، یا یک backend مربوط به ACP مانند `codex (acp/acpx)` استفاده می‌کند. برای تمایز ارائه‌دهنده/مدل/زمان‌اجرا، [زمان‌اجراهای عامل](/fa/concepts/agent-runtimes) را ببینید.
- فیلدهای خام `usage_percent` / `usagePercent` در MiniMax سهمیه باقی‌مانده هستند، بنابراین OpenClaw پیش از نمایش آن‌ها را معکوس می‌کند؛ فیلدهای مبتنی بر شمارش، در صورت وجود، اولویت دارند. پاسخ‌های `model_remains` ورودی مدل چت را ترجیح می‌دهند، در صورت نیاز برچسب پنجره را از timestampها استخراج می‌کنند، و نام مدل را در برچسب طرح می‌آورند.
- وقتی snapshot نشست فعلی کم‌جزئیات باشد، `/status` می‌تواند شمارنده‌های توکن و cache را از جدیدترین گزارش استفاده transcript تکمیل کند. مقدارهای زنده غیرصفر موجود همچنان بر مقدارهای fallback مربوط به transcript اولویت دارند.
- `/status` مدت‌زمان اجرای فشرده فرایند Gateway و مدت‌زمان روشن بودن سیستم میزبان را شامل می‌شود.
- fallback مربوط به transcript همچنین می‌تواند برچسب مدل زمان‌اجرای فعال را وقتی در ورودی نشست زنده وجود ندارد بازیابی کند. اگر آن مدل transcript با مدل انتخاب‌شده متفاوت باشد، status پنجره context را به‌جای مدل انتخاب‌شده، بر اساس مدل زمان‌اجرای بازیابی‌شده resolve می‌کند.
- وقتی یک نشست به مدلی pin شده باشد که با primary پیکربندی‌شده متفاوت است، status هر دو مقدار، دلیل (`session override`)، و راهنمای روشن (`/model default`) را چاپ می‌کند. primary پیکربندی‌شده برای نشست‌های جدید یا unpinned اعمال می‌شود؛ نشست‌های pinشده موجود انتخاب نشست خود را تا زمان پاک شدن نگه می‌دارند.
- برای حسابداری اندازه prompt، fallback مربوط به transcript وقتی فراداده نشست وجود ندارد یا کوچک‌تر است، مجموع بزرگ‌تر و promptمحور را ترجیح می‌دهد، تا نشست‌های ارائه‌دهنده سفارشی به نمایش `0` توکن فرو نریزند.
- وقتی چند عامل پیکربندی شده باشند، خروجی شامل storeهای نشست برای هر عامل است.
- Overview در صورت موجود بودن، وضعیت نصب/زمان‌اجرای Gateway + سرویس میزبان node را شامل می‌شود.
- Overview شامل کانال به‌روزرسانی + SHA گیت است (برای checkoutهای source).
- اطلاعات به‌روزرسانی در Overview نمایش داده می‌شود؛ اگر به‌روزرسانی در دسترس باشد، status راهنمای اجرای `openclaw update` را چاپ می‌کند ([به‌روزرسانی](/fa/install/updating) را ببینید).
- شکست‌های نوسازی قیمت‌گذاری مدل به‌عنوان هشدارهای اختیاری قیمت‌گذاری نشان داده می‌شوند. آن‌ها به این معنی نیستند که Gateway یا کانال‌ها ناسالم هستند.
- سطح‌های فقط‌خواندنی status (`status`، `status --json`، `status --all`) در صورت امکان SecretRefهای پشتیبانی‌شده را برای مسیرهای config هدفشان resolve می‌کنند.
- اگر یک SecretRef کانال پشتیبانی‌شده پیکربندی شده باشد اما در مسیر دستور فعلی در دسترس نباشد، status فقط‌خواندنی می‌ماند و به‌جای crash کردن، خروجی degraded گزارش می‌کند. خروجی انسانی هشدارهایی مانند "configured token unavailable in this command path" را نشان می‌دهد، و خروجی JSON شامل `secretDiagnostics` است.
- وقتی resolve کردن SecretRef محلیِ دستور موفق شود، status snapshot resolveشده را ترجیح می‌دهد و نشانگرهای موقت کانال با پیام "secret unavailable" را از خروجی نهایی پاک می‌کند.
- `status --all` شامل یک ردیف overview برای Secrets و یک بخش تشخیص است که diagnostics مربوط به secret را (برای خوانایی کوتاه‌شده) بدون متوقف کردن تولید گزارش خلاصه می‌کند.

## مرتبط

- [مرجع CLI](/fa/cli)
- [عیب‌یاب](/fa/gateway/doctor)
