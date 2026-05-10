---
read_when:
    - راه‌اندازی Zalo Personal برای OpenClaw
    - اشکال‌زدایی ورود به Zalo Personal یا جریان پیام
summary: پشتیبانی از حساب شخصی Zalo از طریق zca-js بومی (ورود با QR)، قابلیت‌ها، و پیکربندی
title: Zalo شخصی
x-i18n:
    generated_at: "2026-05-10T19:25:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

وضعیت: آزمایشی. این یکپارچه‌سازی یک **حساب شخصی Zalo** را از طریق `zca-js` بومی داخل OpenClaw خودکار می‌کند.

<Warning>
این یکپارچه‌سازی غیررسمی است و ممکن است باعث تعلیق یا مسدود شدن حساب شود. با مسئولیت خودتان استفاده کنید.
</Warning>

## Plugin همراه

Zalo Personal در نسخه‌های فعلی OpenClaw به‌صورت Plugin همراه ارائه می‌شود، بنابراین ساخت‌های بسته‌بندی‌شدهٔ معمولی به نصب جداگانه نیاز ندارند.

اگر از یک ساخت قدیمی‌تر یا نصب سفارشی استفاده می‌کنید که Zalo Personal را شامل نمی‌شود، بستهٔ npm را مستقیماً نصب کنید:

- نصب از طریق CLI: `openclaw plugins install @openclaw/zalouser`
- نسخهٔ پین‌شده: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- یا از یک checkout منبع: `openclaw plugins install ./path/to/local/zalouser-plugin`
- جزئیات: [Plugins](/fa/tools/plugin)

هیچ باینری CLI خارجی `zca`/`openzca` لازم نیست.

## راه‌اندازی سریع (مبتدی)

1. مطمئن شوید Plugin مربوط به Zalo Personal در دسترس است.
   - نسخه‌های بسته‌بندی‌شدهٔ فعلی OpenClaw از قبل آن را همراه دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند آن را به‌صورت دستی با دستورهای بالا اضافه کنند.
2. ورود (QR، روی ماشین Gateway):
   - `openclaw channels login --channel zalouser`
   - کد QR را با برنامهٔ موبایل Zalo اسکن کنید.
3. کانال را فعال کنید:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Gateway را راه‌اندازی مجدد کنید (یا راه‌اندازی را کامل کنید).
5. دسترسی پیام مستقیم به‌طور پیش‌فرض روی جفت‌سازی است؛ در اولین تماس، کد جفت‌سازی را تأیید کنید.

## چیست

- کاملاً درون فرایند و از طریق `zca-js` اجرا می‌شود.
- برای دریافت پیام‌های ورودی از شنونده‌های رویداد بومی استفاده می‌کند.
- پاسخ‌ها را مستقیماً از طریق API جاوااسکریپت ارسال می‌کند (متن/رسانه/لینک).
- برای موارد استفادهٔ «حساب شخصی» طراحی شده است، جایی که API بات Zalo در دسترس نیست.

## نام‌گذاری

شناسهٔ کانال `zalouser` است تا صریح باشد که این مورد یک **حساب کاربری شخصی Zalo** را خودکار می‌کند (غیررسمی). ما `zalo` را برای یکپارچه‌سازی احتمالی رسمی API Zalo در آینده رزرو نگه می‌داریم.

## یافتن شناسه‌ها (دایرکتوری)

برای کشف همتاها/گروه‌ها و شناسه‌های آن‌ها از CLI دایرکتوری استفاده کنید:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## محدودیت‌ها

- متن خروجی به قطعه‌های حدوداً ۲۰۰۰ نویسه‌ای تقسیم می‌شود (محدودیت‌های کلاینت Zalo).
- جریان‌دهی به‌طور پیش‌فرض مسدود است.

## کنترل دسترسی (پیام‌های مستقیم)

`channels.zalouser.dmPolicy` از این موارد پشتیبانی می‌کند: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).

`channels.zalouser.allowFrom` باید از شناسه‌های پایدار کاربر Zalo استفاده کند. همچنین می‌تواند به گروه‌های دسترسی فرستندهٔ ایستا ارجاع دهد (`accessGroup:<name>`). هنگام راه‌اندازی تعاملی، نام‌های واردشده را می‌توان با استفاده از جست‌وجوی مخاطب درون‌فرایندی Plugin به شناسه تبدیل کرد.

اگر یک نام خام در پیکربندی باقی بماند، هنگام شروع فقط زمانی تبدیل می‌شود که `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد. بدون این پذیرش صریح، بررسی‌های فرستنده در زمان اجرا فقط بر اساس شناسه هستند و نام‌های خام برای مجوزدهی نادیده گرفته می‌شوند.

تأیید از طریق:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## دسترسی گروه (اختیاری)

- پیش‌فرض: `channels.zalouser.groupPolicy = "open"` (گروه‌ها مجاز هستند). برای بازنویسی مقدار پیش‌فرض هنگام تنظیم نبودن، از `channels.defaults.groupPolicy` استفاده کنید.
- محدود کردن به فهرست مجاز با:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (کلیدها باید شناسه‌های پایدار گروه باشند؛ نام‌ها هنگام شروع فقط زمانی به شناسه تبدیل می‌شوند که `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد)
  - `channels.zalouser.groupAllowFrom` (کنترل می‌کند کدام فرستنده‌ها در گروه‌های مجاز می‌توانند بات را فعال کنند؛ گروه‌های دسترسی فرستندهٔ ایستا را می‌توان با `accessGroup:<name>` ارجاع داد)
- مسدود کردن همهٔ گروه‌ها: `channels.zalouser.groupPolicy = "disabled"`.
- جادوگر پیکربندی می‌تواند برای فهرست‌های مجاز گروه درخواست ورودی کند.
- هنگام شروع، OpenClaw نام‌های گروه/کاربر در فهرست‌های مجاز را به شناسه تبدیل می‌کند و نگاشت را فقط زمانی ثبت می‌کند که `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد.
- تطبیق فهرست مجاز گروه به‌طور پیش‌فرض فقط بر اساس شناسه است. نام‌های حل‌نشده برای احراز مجوز نادیده گرفته می‌شوند، مگر اینکه `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد.
- `channels.zalouser.dangerouslyAllowNameMatching: true` یک حالت سازگاری اضطراری است که تبدیل نام قابل‌تغییر در زمان شروع و تطبیق نام گروه در زمان اجرا را دوباره فعال می‌کند.
- اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا برای بررسی فرستندهٔ گروه به `allowFrom` برمی‌گردد.
- بررسی‌های فرستنده هم برای پیام‌های عادی گروه و هم برای فرمان‌های کنترلی اعمال می‌شوند (برای مثال `/new`، `/reset`).

مثال:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### کنترل فعال‌سازی با منشن در گروه

- `channels.zalouser.groups.<group>.requireMention` کنترل می‌کند که آیا پاسخ‌های گروه به منشن نیاز دارند یا نه.
- ترتیب تبدیل: شناسه/نام دقیق گروه -> اسلاگ نرمال‌شدهٔ گروه -> `*` -> پیش‌فرض (`true`).
- این هم برای گروه‌های موجود در فهرست مجاز و هم برای حالت گروه باز اعمال می‌شود.
- نقل‌قول کردن پیام بات به‌عنوان یک منشن ضمنی برای فعال‌سازی گروه حساب می‌شود.
- فرمان‌های کنترلی مجاز (برای مثال `/new`) می‌توانند کنترل منشن را دور بزنند.
- وقتی یک پیام گروه به دلیل نیاز به منشن رد می‌شود، OpenClaw آن را به‌عنوان تاریخچهٔ گروه در انتظار ذخیره می‌کند و آن را در پیام گروه پردازش‌شدهٔ بعدی قرار می‌دهد.
- محدودیت تاریخچهٔ گروه به‌طور پیش‌فرض `messages.groupChat.historyLimit` است (مقدار جایگزین `50`). می‌توانید آن را برای هر حساب با `channels.zalouser.historyLimit` بازنویسی کنید.

مثال:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## چندحسابی

حساب‌ها به پروفایل‌های `zalouser` در وضعیت OpenClaw نگاشت می‌شوند. مثال:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## در حال تایپ، واکنش‌ها و تأییدیه‌های تحویل

- OpenClaw پیش از ارسال پاسخ، یک رویداد در حال تایپ ارسال می‌کند (با بهترین تلاش).
- کنش واکنش پیام `react` برای `zalouser` در کنش‌های کانال پشتیبانی می‌شود.
  - برای حذف یک ایموجی واکنش مشخص از یک پیام، از `remove: true` استفاده کنید.
  - معناشناسی واکنش‌ها: [واکنش‌ها](/fa/tools/reactions)
- برای پیام‌های ورودی که شامل فرادادهٔ رویداد هستند، OpenClaw تأییدیه‌های تحویل‌شده + دیده‌شده را ارسال می‌کند (با بهترین تلاش).

## عیب‌یابی

**ورود پایدار نمی‌ماند:**

- `openclaw channels status --probe`
- ورود دوباره: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**نام فهرست مجاز/گروه تبدیل نشد:**

- در `allowFrom`/`groupAllowFrom` از شناسه‌های عددی و در `groups` از شناسه‌های پایدار گروه استفاده کنید. اگر عمداً به نام‌های دقیق دوست/گروه نیاز دارید، `channels.zalouser.dangerouslyAllowNameMatching: true` را فعال کنید.

**از راه‌اندازی قدیمی مبتنی بر CLI ارتقا داده‌اید:**

- هر فرض قدیمی دربارهٔ فرایند خارجی `zca` را حذف کنید.
- اکنون کانال بدون باینری‌های CLI خارجی، کاملاً داخل OpenClaw اجرا می‌شود.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و کنترل فعال‌سازی با منشن
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
