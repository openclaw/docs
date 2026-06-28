---
read_when:
    - اشکال‌زدایی زبانهٔ نمونه‌ها
    - بررسی ردیف‌های نمونهٔ تکراری یا قدیمی
    - تغییر بیکن‌های اتصال WS در Gateway یا system-event
summary: نحوهٔ تولید، ادغام و نمایش ورودی‌های حضور OpenClaw
title: حضور
x-i18n:
    generated_at: "2026-05-06T09:12:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
    postprocess_version: locale-links-v1
---

«presence» در OpenClaw نمایی سبک و با بهترین تلاش از موارد زیر است:

- خود **Gateway**، و
- **کلاینت‌های متصل به Gateway** (برنامه مک، WebChat، CLI، و غیره)

Presence عمدتاً برای رندر کردن زبانه **Instances** در برنامه macOS و فراهم کردن دید سریع برای اپراتور استفاده می‌شود.

## فیلدهای Presence (آنچه نمایش داده می‌شود)

ورودی‌های Presence آبجکت‌های ساختاریافته‌ای با فیلدهایی مانند موارد زیر هستند:

- `instanceId` (اختیاری اما قویاً توصیه‌شده): هویت پایدار کلاینت (معمولاً `connect.client.instanceId`)
- `host`: نام میزبان خوانا برای انسان
- `ip`: نشانی IP با بهترین تلاش
- `version`: رشته نسخه کلاینت
- `deviceFamily` / `modelIdentifier`: سرنخ‌های سخت‌افزاری
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: «ثانیه‌های گذشته از آخرین ورودی کاربر» (اگر معلوم باشد)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: مهر زمانی آخرین به‌روزرسانی (میلی‌ثانیه از epoch)

## تولیدکننده‌ها (presence از کجا می‌آید)

ورودی‌های Presence توسط چندین منبع تولید و **ادغام** می‌شوند.

### 1) ورودی خود Gateway

Gateway همیشه هنگام راه‌اندازی یک ورودی «self» اولیه ایجاد می‌کند تا UIها میزبان gateway را حتی پیش از اتصال هر کلاینتی نشان دهند.

### 2) اتصال WebSocket

هر کلاینت WS با یک درخواست `connect` شروع می‌کند. پس از handshake موفق، Gateway یک ورودی presence را برای آن اتصال upsert می‌کند.

#### چرا دستورهای یک‌باره CLI نمایش داده نمی‌شوند

CLI اغلب برای دستورهای کوتاه و یک‌باره وصل می‌شود. برای جلوگیری از شلوغ شدن فهرست Instances، `client.mode === "cli"` **به** ورودی presence تبدیل **نمی‌شود**.

### 3) بیکن‌های `system-event`

کلاینت‌ها می‌توانند بیکن‌های دوره‌ای غنی‌تری را از طریق متد `system-event` ارسال کنند. برنامه مک از این برای گزارش نام میزبان، IP، و `lastInputSeconds` استفاده می‌کند.

### 4) اتصال Nodeها (role: node)

وقتی یک node از طریق WebSocket مربوط به Gateway با `role: node` وصل می‌شود، Gateway یک ورودی presence برای آن node upsert می‌کند (همان جریان سایر کلاینت‌های WS).

## قواعد ادغام + حذف تکراری‌ها (چرا `instanceId` مهم است)

ورودی‌های Presence در یک map واحد درون‌حافظه‌ای ذخیره می‌شوند:

- ورودی‌ها با یک **کلید presence** کلیدگذاری می‌شوند.
- بهترین کلید یک `instanceId` پایدار است (از `connect.client.instanceId`) که از راه‌اندازی‌های مجدد جان سالم به در می‌برد.
- کلیدها به حروف بزرگ و کوچک حساس نیستند.

اگر کلاینتی بدون `instanceId` پایدار دوباره وصل شود، ممکن است به‌صورت یک ردیف **تکراری** نمایش داده شود.

## TTL و اندازه محدود

Presence عمداً موقتی است:

- **TTL:** ورودی‌های قدیمی‌تر از 5 دقیقه هرس می‌شوند
- **حداکثر ورودی‌ها:** 200 (قدیمی‌ترین‌ها اول حذف می‌شوند)

این کار فهرست را تازه نگه می‌دارد و از رشد نامحدود حافظه جلوگیری می‌کند.

## نکته مربوط به راه دور/تونل (IPهای loopback)

وقتی کلاینتی از طریق تونل SSH / فوروارد پورت محلی وصل می‌شود، Gateway ممکن است نشانی راه دور را به‌صورت `127.0.0.1` ببیند. برای جلوگیری از بازنویسی IP خوبی که کلاینت گزارش کرده است، نشانی‌های راه دور loopback نادیده گرفته می‌شوند.

## مصرف‌کننده‌ها

### زبانه Instances در macOS

برنامه macOS خروجی `system-presence` را رندر می‌کند و بر اساس سن آخرین به‌روزرسانی، یک نشانگر وضعیت کوچک (فعال/بی‌کار/کهنه) اعمال می‌کند.

## نکته‌های اشکال‌زدایی

- برای دیدن فهرست خام، `system-presence` را روی Gateway فراخوانی کنید.
- اگر موارد تکراری می‌بینید:
  - تأیید کنید کلاینت‌ها در handshake یک `client.instanceId` پایدار ارسال می‌کنند
  - تأیید کنید بیکن‌های دوره‌ای از همان `instanceId` استفاده می‌کنند
  - بررسی کنید آیا ورودی مشتق‌شده از اتصال فاقد `instanceId` است (در این حالت موارد تکراری مورد انتظار هستند)

## مرتبط

<CardGroup cols={2}>
  <Card title="نشانگرهای تایپ" href="/fa/concepts/typing-indicators" icon="ellipsis">
    اینکه چه زمانی نشانگرهای تایپ ارسال می‌شوند و چگونه آن‌ها را تنظیم کنید.
  </Card>
  <Card title="استریم و قطعه‌بندی" href="/fa/concepts/streaming" icon="bars-staggered">
    استریم خروجی، قطعه‌بندی، و قالب‌بندی مختص هر کانال.
  </Card>
  <Card title="معماری Gateway" href="/fa/concepts/architecture" icon="diagram-project">
    اجزای Gateway و پروتکل WebSocket که به‌روزرسانی‌های presence را هدایت می‌کند.
  </Card>
  <Card title="پروتکل Gateway" href="/fa/gateway/protocol" icon="plug">
    پروتکل سیمی برای `connect`، `system-event`، و `system-presence`.
  </Card>
</CardGroup>
