---
read_when:
    - اشکال‌زدایی یا پیکربندی دسترسی به WebChat
summary: میزبان ایستای WebChat روی لوپ‌بک و استفاده از WS در Gateway برای رابط کاربری چت
title: گفت‌وگوی وب
x-i18n:
    generated_at: "2026-04-29T23:49:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8a4fef0aab37ca82bff249c6b31eb65475f12c16dfb9b86ddd62c1a938a34f3
    source_path: web/webchat.md
    workflow: 16
---

وضعیت: رابط کاربری چت SwiftUI در macOS/iOS مستقیما با WebSocket Gateway ارتباط برقرار می‌کند.

## چیستی آن

- یک رابط کاربری چت بومی برای Gateway (بدون مرورگر تعبیه‌شده و بدون سرور ایستای محلی).
- از همان نشست‌ها و قواعد مسیریابی مانند کانال‌های دیگر استفاده می‌کند.
- مسیریابی قطعی: پاسخ‌ها همیشه به WebChat برمی‌گردند.

## شروع سریع

1. Gateway را شروع کنید.
2. رابط کاربری WebChat (برنامه macOS/iOS) یا زبانه چت Control UI را باز کنید.
3. مطمئن شوید یک مسیر احراز هویت معتبر برای Gateway پیکربندی شده است (به‌طور پیش‌فرض shared-secret،
   حتی روی loopback).

## نحوه کار (رفتار)

- رابط کاربری به WebSocket Gateway متصل می‌شود و از `chat.history`، `chat.send` و `chat.inject` استفاده می‌کند.
- `chat.history` برای پایداری محدود شده است: Gateway ممکن است فیلدهای متنی طولانی را کوتاه کند، فراداده سنگین را حذف کند، و ورودی‌های بیش‌ازحد بزرگ را با `[chat.history omitted: message too large]` جایگزین کند.
- `chat.history` برای فایل‌های نشست مدرنِ فقط-افزودنی، شاخه رونویس فعال را دنبال می‌کند؛ بنابراین شاخه‌های بازنویسی رهاشده و نسخه‌های prompt جایگزین‌شده در WebChat نمایش داده نمی‌شوند.
- Control UI ارسال‌های تکراریِ در حال انجام برای همان نشست، پیام و پیوست‌ها را پیش از تولید یک شناسه اجرای `chat.send` جدید ادغام می‌کند؛ Gateway همچنان درخواست‌های تکراری را که از همان کلید idempotency دوباره استفاده می‌کنند حذف تکراری می‌کند.
- `chat.history` برای نمایش نیز نرمال‌سازی می‌شود: بافت فقط-زمان‌اجرای OpenClaw،
  پوشش‌های envelope ورودی، برچسب‌های directive تحویل درون‌خطی
  مانند `[[reply_to_*]]` و `[[audio_as_voice]]`، payloadهای XML فراخوانی ابزارِ متن ساده
  (از جمله `<tool_call>...</tool_call>`،
  `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`،
  `<function_calls>...</function_calls>`، و بلوک‌های فراخوانی ابزار کوتاه‌شده)، و
  توکن‌های کنترلی مدلِ ASCII/تمام‌عرضِ نشت‌کرده از متن قابل مشاهده حذف می‌شوند،
  و ورودی‌های دستیار که کل متن قابل مشاهده آن‌ها فقط توکن خاموش دقیق
  `NO_REPLY` / `no_reply` است حذف می‌شوند.
- payloadهای پاسخ علامت‌گذاری‌شده به‌عنوان reasoning (`isReasoning: true`) از محتوای دستیار WebChat، متن بازپخش رونویس، و بلوک‌های محتوای صوتی کنار گذاشته می‌شوند؛ بنابراین payloadهای فقط-تفکر به‌صورت پیام دستیار قابل مشاهده یا صدای قابل پخش ظاهر نمی‌شوند.
- `chat.inject` یک یادداشت دستیار را مستقیما به رونویس اضافه می‌کند و آن را به رابط کاربری پخش می‌کند (بدون اجرای agent).
- اجراهای لغوشده می‌توانند خروجی جزئی دستیار را در رابط کاربری قابل مشاهده نگه دارند.
- Gateway متن جزئی دستیارِ لغوشده را وقتی خروجی بافرشده وجود داشته باشد در تاریخچه رونویس ماندگار می‌کند، و آن ورودی‌ها را با فراداده لغو علامت‌گذاری می‌کند.
- تاریخچه همیشه از Gateway واکشی می‌شود (بدون پایش فایل محلی).
- اگر Gateway در دسترس نباشد، WebChat فقط-خواندنی است.

## پنل ابزارهای agent در Control UI

- پنل Tools در Control UI `/agents` دو نمای جداگانه دارد:
  - **همین حالا در دسترس** از `tools.effective(sessionKey=...)` استفاده می‌کند و نشان می‌دهد نشست فعلی
    واقعا در زمان اجرا از چه چیزهایی می‌تواند استفاده کند، از جمله ابزارهای متعلق به هسته، Plugin و کانال.
  - **پیکربندی ابزار** از `tools.catalog` استفاده می‌کند و روی profileها، overrideها و
    معناشناسی catalog متمرکز می‌ماند.
- دسترس‌پذیری زمان اجرا محدود به نشست است. تعویض نشست‌ها روی همان agent می‌تواند فهرست
  **همین حالا در دسترس** را تغییر دهد.
- ویرایشگر پیکربندی به‌معنای دسترس‌پذیری زمان اجرا نیست؛ دسترسی موثر همچنان از اولویت سیاست
  (`allow`/`deny`، overrideهای به‌ازای agent و provider/channel) پیروی می‌کند.

## استفاده از راه دور

- حالت راه دور، WebSocket مربوط به Gateway را از طریق SSH/Tailscale تونل می‌کند.
- نیازی نیست یک سرور WebChat جداگانه اجرا کنید.

## مرجع پیکربندی (WebChat)

پیکربندی کامل: [پیکربندی](/fa/gateway/configuration)

گزینه‌های WebChat:

- `gateway.webchat.chatHistoryMaxChars`: حداکثر تعداد نویسه برای فیلدهای متنی در پاسخ‌های `chat.history`. وقتی یک ورودی رونویس از این حد فراتر برود، Gateway فیلدهای متنی طولانی را کوتاه می‌کند و ممکن است پیام‌های بیش‌ازحد بزرگ را با یک placeholder جایگزین کند. `maxChars` به‌ازای هر درخواست نیز می‌تواند توسط client ارسال شود تا این مقدار پیش‌فرض را برای یک فراخوانی `chat.history` تکی override کند.

گزینه‌های سراسری مرتبط:

- `gateway.port`, `gateway.bind`: میزبان/درگاه WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  احراز هویت WebSocket با shared-secret.
- `gateway.auth.allowTailscale`: زبانه چت Control UI در مرورگر می‌تواند هنگام فعال بودن، از headerهای هویت Tailscale
  Serve استفاده کند.
- `gateway.auth.mode: "trusted-proxy"`: احراز هویت reverse-proxy برای clientهای مرورگر پشت یک منبع proxy **غیر-loopback** آگاه به هویت ( [احراز هویت Trusted Proxy](/fa/gateway/trusted-proxy-auth) را ببینید).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: مقصد Gateway راه دور.
- `session.*`: پیش‌فرض‌های ذخیره‌سازی نشست و کلید اصلی.

## مرتبط

- [Control UI](/fa/web/control-ui)
- [داشبورد](/fa/web/dashboard)
