---
read_when:
    - اشکال‌زدایی یا پیکربندی دسترسی به WebChat
summary: میزبان ایستای وب‌چت لوپ‌بک و استفاده از WS در Gateway برای رابط کاربری چت
title: گفت‌وگوی وب
x-i18n:
    generated_at: "2026-05-04T02:29:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

وضعیت: رابط کاربری چت SwiftUI در macOS/iOS مستقیما با WebSocketِ Gateway صحبت می‌کند.

## چیستی آن

- یک رابط کاربری چت بومی برای Gateway، بدون مرورگر تعبیه‌شده و بدون سرور ایستای محلی.
- از همان نشست‌ها و قواعد مسیریابی کانال‌های دیگر استفاده می‌کند.
- مسیریابی قطعی: پاسخ‌ها همیشه به WebChat برمی‌گردند.

## شروع سریع

1. Gateway را راه‌اندازی کنید.
2. رابط کاربری WebChat، یعنی برنامه macOS/iOS، یا زبانه چت Control UI را باز کنید.
3. مطمئن شوید یک مسیر احراز هویت معتبر برای Gateway پیکربندی شده است؛ به‌صورت پیش‌فرض shared-secret،
   حتی روی loopback.

## سازوکار آن (رفتار)

- رابط کاربری به WebSocketِ Gateway وصل می‌شود و از `chat.history`، `chat.send` و `chat.inject` استفاده می‌کند.
- `chat.history` برای پایداری محدود شده است: Gateway ممکن است فیلدهای متنی بلند را کوتاه کند، فراداده‌های سنگین را حذف کند، و ورودی‌های بیش‌ازحد بزرگ را با `[chat.history omitted: message too large]` جایگزین کند.
- `chat.history` برای فایل‌های نشست append-only مدرن، شاخه فعال رونوشت را دنبال می‌کند؛ بنابراین شاخه‌های بازنویسی رهاشده و کپی‌های superseded prompt در WebChat نمایش داده نمی‌شوند.
- ورودی‌های Compaction به‌صورت یک جداکننده صریح تاریخچه فشرده‌شده نمایش داده می‌شوند. این جداکننده توضیح می‌دهد که نوبت‌های قبلی در یک checkpoint حفظ شده‌اند و به کنترل‌های checkpoint نشست‌ها پیوند می‌دهد؛ جایی که اپراتورها در صورت داشتن مجوز می‌توانند شاخه‌سازی کنند یا نمای پیش از Compaction را بازیابی کنند.
- Control UI مقدار `sessionId` پشتیبان Gateway را که توسط `chat.history` برگردانده می‌شود به خاطر می‌سپارد و آن را در فراخوانی‌های بعدی `chat.send` می‌گنجاند؛ بنابراین اتصال مجدد و نوسازی صفحه همان گفت‌وگوی ذخیره‌شده را ادامه می‌دهند، مگر اینکه کاربر نشستی را شروع یا بازنشانی کند.
- Control UI پیش از تولید یک شناسه اجرای جدید برای `chat.send`، ارسال‌های هم‌زمان تکراری را برای همان نشست، پیام و پیوست‌ها ادغام می‌کند؛ Gateway همچنان درخواست‌های تکراری را که از همان کلید idempotency دوباره استفاده می‌کنند dedupe می‌کند.
- فایل‌های راه‌اندازی workspace و دستورالعمل‌های معلق `BOOTSTRAP.md` از طریق Project Context در system prompt عامل ارائه می‌شوند، نه اینکه در پیام کاربر WebChat کپی شوند. کوتاه‌سازی bootstrap فقط یک اعلان بازیابی کوتاه در system-prompt اضافه می‌کند؛ شمارش‌های دقیق و knobهای پیکربندی روی سطوح تشخیصی باقی می‌مانند.
- `chat.history` همچنین برای نمایش نرمال‌سازی می‌شود: زمینه OpenClaw فقط‌زمان‌اجرا،
  wrapperهای envelope ورودی، tagهای directive تحویل درون‌خطی
  مانند `[[reply_to_*]]` و `[[audio_as_voice]]`، payloadهای XML فراخوانی ابزار به‌صورت متن ساده
  شامل `<tool_call>...</tool_call>`،
  `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`،
  `<function_calls>...</function_calls>`، و بلوک‌های کوتاه‌شده فراخوانی ابزار، و
  توکن‌های کنترلی مدل ASCII/full-width نشت‌کرده از متن قابل مشاهده حذف می‌شوند،
  و ورودی‌های assistant که کل متن قابل مشاهده آن‌ها فقط توکن خاموش دقیق
  `NO_REPLY` / `no_reply` است حذف می‌شوند.
- payloadهای پاسخ علامت‌گذاری‌شده به‌عنوان reasoning (`isReasoning: true`) از محتوای assistant در WebChat، متن بازپخش رونوشت و بلوک‌های محتوای صوتی کنار گذاشته می‌شوند؛ بنابراین payloadهای صرفا مربوط به thinking به‌صورت پیام assistant قابل مشاهده یا صوت قابل پخش ظاهر نمی‌شوند.
- `chat.inject` یک یادداشت assistant را مستقیما به رونوشت اضافه می‌کند و آن را به رابط کاربری پخش می‌کند؛ اجرای agent انجام نمی‌شود.
- اجراهای لغوشده می‌توانند خروجی جزئی assistant را در رابط کاربری قابل مشاهده نگه دارند.
- Gateway وقتی خروجی بافرشده وجود داشته باشد، متن جزئی لغوشده assistant را در تاریخچه رونوشت پایدار می‌کند و آن ورودی‌ها را با فراداده abort علامت‌گذاری می‌کند.
- تاریخچه همیشه از Gateway واکشی می‌شود؛ پایش فایل محلی انجام نمی‌شود.
- اگر Gateway در دسترس نباشد، WebChat فقط‌خواندنی است.

### مدل رونوشت و تحویل

WebChat دو مسیر داده جداگانه دارد:

- فایل JSONL نشست، رونوشت پایدار مدل/runtime است. برای اجراهای عادی عامل، Pi پیام‌های `user`، `assistant` و `toolResult` قابل مشاهده برای مدل را از طریق session manager خود پایدار می‌کند. WebChat متن دلخواه مربوط به تحویل، وضعیت یا helper را در آن رونوشت نمی‌نویسد.
- رویدادهای `ReplyPayload` در Gateway، projection زنده تحویل هستند. آن‌ها می‌توانند برای نمایش WebChat/کانال، streaming بلوک، tagهای directive، تعبیه رسانه، پرچم‌های TTS/audio و رفتار fallback رابط کاربری نرمال‌سازی شوند. خودشان log رسمی نشست نیستند.
- WebChat فقط وقتی ورودی‌های رونوشت assistant را inject می‌کند که Gateway مالک پیامی نمایش‌داده‌شده خارج از یک نوبت عادی assistant در Pi باشد: `chat.inject`، پاسخ‌های command غیرعامل، خروجی جزئی لغوشده، و مکمل‌های رونوشت رسانه که توسط WebChat مدیریت می‌شوند.
- `chat.history` رونوشت ذخیره‌شده نشست را می‌خواند و projection نمایش WebChat را اعمال می‌کند. اگر متن زنده assistant هنگام اجرا ظاهر می‌شود اما پس از بارگذاری مجدد تاریخچه ناپدید می‌شود، ابتدا بررسی کنید آیا JSONL خام شامل متن assistant هست یا نه، سپس بررسی کنید آیا projection در `chat.history` آن را حذف کرده است یا نه، و سپس بررسی کنید آیا merge خوش‌بینانه tail در Control UI وضعیت تحویل محلی را با snapshot پایدار جایگزین کرده است یا نه.

پاسخ‌های نهایی اجرای عادی عامل باید پایدار باشند، چون Pi مقدار `message_end` مربوط به assistant را می‌نویسد. هر fallback که payload نهایی تحویل‌داده‌شده را در رونوشت mirror می‌کند، ابتدا باید از تکرار نوبت assistant که Pi قبلا نوشته است جلوگیری کند.

## پنل ابزارهای agent در Control UI

- پنل Tools در `/agents` در Control UI دو نمای جداگانه دارد:
  - **هم‌اکنون در دسترس** از `tools.effective(sessionKey=...)` استفاده می‌کند و نشان می‌دهد نشست فعلی
    واقعا در runtime از چه چیزهایی می‌تواند استفاده کند، از جمله ابزارهای متعلق به core، Plugin و کانال.
  - **پیکربندی ابزار** از `tools.catalog` استفاده می‌کند و روی profileها، overrideها و
    معناشناسی catalog متمرکز می‌ماند.
- دسترس‌پذیری runtime به نشست scoped است. تغییر نشست‌ها روی همان agent می‌تواند فهرست
  **هم‌اکنون در دسترس** را تغییر دهد.
- ویرایشگر پیکربندی به‌معنای دسترس‌پذیری runtime نیست؛ دسترسی موثر همچنان از اولویت policy
  (`allow`/`deny`، overrideهای per-agent و provider/channel) پیروی می‌کند.

## استفاده راه دور

- حالت راه دور WebSocketِ Gateway را از طریق SSH/Tailscale تونل می‌کند.
- نیازی نیست یک سرور WebChat جداگانه اجرا کنید.

## مرجع پیکربندی (WebChat)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های WebChat:

- `gateway.webchat.chatHistoryMaxChars`: بیشینه تعداد نویسه برای فیلدهای متنی در پاسخ‌های `chat.history`. وقتی یک ورودی رونوشت از این حد فراتر برود، Gateway فیلدهای متنی بلند را کوتاه می‌کند و ممکن است پیام‌های بیش‌ازحد بزرگ را با یک placeholder جایگزین کند. مقدار per-request `maxChars` را نیز client می‌تواند ارسال کند تا این پیش‌فرض را برای یک فراخوانی `chat.history` override کند.

گزینه‌های global مرتبط:

- `gateway.port`، `gateway.bind`: میزبان/درگاه WebSocket.
- `gateway.auth.mode`، `gateway.auth.token`، `gateway.auth.password`:
  احراز هویت WebSocket با shared-secret.
- `gateway.auth.allowTailscale`: وقتی فعال باشد، زبانه چت Control UI در مرورگر می‌تواند از headerهای identity در Tailscale
  Serve استفاده کند.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت reverse-proxy برای clientهای مرورگر پشت یک منبع proxy **غیر-loopback** و آگاه از identity؛ ببینید [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth).
- `gateway.remote.url`، `gateway.remote.token`، `gateway.remote.password`: هدف Gateway راه دور.
- `session.*`: ذخیره‌سازی نشست و پیش‌فرض‌های کلید اصلی.

## مرتبط

- [Control UI](/fa/web/control-ui)
- [داشبورد](/fa/web/dashboard)
