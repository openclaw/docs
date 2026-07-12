---
read_when:
    - راه‌اندازی Zalo Personal برای OpenClaw
    - اشکال‌زدایی ورود یا جریان پیام در Zalo Personal
summary: پشتیبانی از حساب شخصی Zalo از طریق zca-js بومی (ورود با کد QR)، قابلیت‌ها و پیکربندی
title: Zalo شخصی
x-i18n:
    generated_at: "2026-07-12T09:45:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

وضعیت: آزمایشی. این یکپارچه‌سازی یک **حساب شخصی Zalo** را به‌صورت درون‌پردازه‌ای از طریق `zca-js` بومی و بدون فایل اجرایی خارجی CLI خودکار می‌کند.

<Warning>
این یکپارچه‌سازی غیررسمی است و ممکن است به تعلیق یا مسدودشدن حساب منجر شود. با مسئولیت خودتان از آن استفاده کنید.
</Warning>

## نصب

Zalo Personal یک Plugin خارجی رسمی است و همراه هسته ارائه نمی‌شود. پیش از استفاده، آن را نصب کنید:

```bash
openclaw plugins install @openclaw/zalouser
```

- تثبیت یک نسخه: `openclaw plugins install @openclaw/zalouser@<version>`
- از یک وارسی کد منبع: `openclaw plugins install ./path/to/local/zalouser-plugin`
- جزئیات: [Pluginها](/fa/tools/plugin)

## راه‌اندازی سریع

1. Plugin را نصب کنید (در بالا).
2. وارد شوید (با کد QR، روی دستگاه Gateway):
   - `openclaw channels login --channel zalouser`
   - کد QR را با برنامه موبایل Zalo اسکن کنید.
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

4. Gateway را راه‌اندازی مجدد کنید (یا راه‌اندازی را به پایان برسانید).
5. دسترسی پیام مستقیم به‌طور پیش‌فرض از جفت‌سازی استفاده می‌کند؛ در نخستین تماس، کد جفت‌سازی را تأیید کنید.

## چیست

- کاملاً به‌صورت درون‌پردازه‌ای از طریق کتابخانه `zca-js` اجرا می‌شود (بدون فایل اجرایی خارجی `zca`/`openzca`).
- برای دریافت پیام‌های ورودی از شنونده‌های رویداد بومی (`message`، `error`) استفاده می‌کند.
- پاسخ‌ها را مستقیماً از طریق API جاوااسکریپت ارسال می‌کند (متن/رسانه/پیوند).
- برای موارد استفاده «حساب شخصی» طراحی شده است که در آن‌ها API ربات Zalo در دسترس نیست.

## نام‌گذاری

شناسه کانال `zalouser` است تا صریحاً مشخص شود که این یکپارچه‌سازی یک **حساب کاربری شخصی Zalo** را خودکار می‌کند (غیررسمی). `zalo` برای یکپارچه‌سازی رسمی احتمالی با API زالو در آینده رزرو شده است.

## یافتن شناسه‌ها (دایرکتوری)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## محدودیت‌ها

- متن خروجی به قطعه‌های ۲۰۰۰ نویسه‌ای تقسیم می‌شود (محدودیت کارخواه Zalo).
- پخش جریانی پشتیبانی نمی‌شود.

## کنترل دسترسی (پیام‌های مستقیم)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).

`channels.zalouser.allowFrom` باید از شناسه‌های پایدار کاربران Zalo استفاده کند. همچنین می‌تواند به گروه‌های ثابت دسترسی فرستنده (`accessGroup:<name>`) ارجاع دهد. هنگام راه‌اندازی تعاملی، نام‌های واردشده را می‌توان با استفاده از جست‌وجوی درون‌پردازه‌ای مخاطبان Plugin به شناسه تبدیل کرد.

اگر نام خامی در پیکربندی باقی بماند، هنگام راه‌اندازی فقط در صورتی تبدیل می‌شود که `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد. بدون این پذیرش صریح، بررسی‌های فرستنده در زمان اجرا فقط بر اساس شناسه انجام می‌شوند و نام‌های خام برای مجوزدهی نادیده گرفته می‌شوند.

تأیید از طریق:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## دسترسی گروهی (اختیاری)

- پیش‌فرض: `channels.zalouser.groupPolicy = "allowlist"` (گروه‌ها به ورودی صریح در فهرست مجاز نیاز دارند).
- بازکردن همه گروه‌ها: `channels.zalouser.groupPolicy = "open"`.
- مسدودکردن همه گروه‌ها: `channels.zalouser.groupPolicy = "disabled"`.
- با `groupPolicy = "allowlist"`:
  - کلیدهای `channels.zalouser.groups` باید شناسه‌های پایدار گروه باشند؛ نام‌ها هنگام راه‌اندازی فقط در صورتی به شناسه تبدیل می‌شوند که `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد.
  - `channels.zalouser.groupAllowFrom` تعیین می‌کند کدام فرستندگان در گروه‌های مجاز می‌توانند ربات را فعال کنند؛ گروه‌های ثابت دسترسی فرستنده را می‌توان با `accessGroup:<name>` ارجاع داد.
- جادوگر پیکربندی می‌تواند فهرست‌های مجاز گروه را درخواست کند.
- تطبیق فهرست مجاز گروه به‌طور پیش‌فرض فقط بر اساس شناسه است. نام‌های تبدیل‌نشده برای احراز مجوز نادیده گرفته می‌شوند، مگر اینکه `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد.
- `channels.zalouser.dangerouslyAllowNameMatching: true` یک حالت سازگاری اضطراری است که تبدیل نام‌های تغییرپذیر هنگام راه‌اندازی و تطبیق نام گروه در زمان اجرا را دوباره فعال می‌کند.
- `groupAllowFrom` برای پیام‌های عادی گروه به `allowFrom` بازنمی‌گردد: خالی گذاشتن آن در یک گروهِ موجود در فهرست مجاز، آن گروه را برای هر فرستنده‌ای باز می‌کند. فرمان‌های کنترلی مجاز (برای مثال `/new`) استثنا هستند؛ وقتی `groupAllowFrom` خالی باشد، بررسی فرستنده فرمان به `allowFrom` بازمی‌گردد.

مثال:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` نام یک فیلد قدیمی است؛ پیکربندی کنونی از `enabled` استفاده می‌کند. `openclaw doctor --fix` به‌طور خودکار `allow` را به `enabled` مهاجرت می‌دهد.
</Note>

### الزام اشاره در گروه

- `channels.zalouser.groups.<group>.requireMention` تعیین می‌کند آیا پاسخ‌های گروهی به اشاره نیاز دارند.
- ترتیب تفکیک: شناسه گروه -> نام مستعار `group:<id>` -> نام/نامک گروه (گزینه‌های مبتنی بر نام فقط وقتی اعمال می‌شوند که `dangerouslyAllowNameMatching: true` باشد) -> `*` -> پیش‌فرض (`true`).
- هم برای گروه‌های موجود در فهرست مجاز و هم برای حالت گروه باز اعمال می‌شود.
- نقل‌قول از پیام ربات برای فعال‌سازی گروه به‌عنوان اشاره ضمنی محسوب می‌شود.
- فرمان‌های کنترلی مجاز (برای مثال `/new`) می‌توانند الزام اشاره را دور بزنند.
- وقتی پیام گروهی به‌دلیل نیاز به اشاره نادیده گرفته شود، OpenClaw آن را به‌عنوان سابقه گروهِ در انتظار ذخیره می‌کند و در پیام گروهی پردازش‌شده بعدی می‌گنجاند.
- محدودیت سابقه گروه: ابتدا `channels.zalouser.historyLimit`، سپس `messages.groupChat.historyLimit` و در نهایت مقدار جایگزین `50`.

مثال:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## چندحسابی

حساب‌ها به نمایه‌های `zalouser` در وضعیت OpenClaw نگاشت می‌شوند. مثال:

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

## متغیرهای محیطی

انتخاب نمایه می‌تواند از متغیرهای محیطی نیز انجام شود:

| متغیر             | هدف                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | نام نمایه‌ای که وقتی `profile` در پیکربندی کانال یا حساب تنظیم نشده است، استفاده می‌شود. |
| `ZCA_PROFILE`      | مقدار جایگزین قدیمی که فقط وقتی `ZALOUSER_PROFILE` تنظیم نشده باشد، استفاده می‌شود.      |

نام نمایه‌ها اعتبارنامه‌های ورود ذخیره‌شده Zalo را در وضعیت OpenClaw انتخاب می‌کنند. ترتیب تفکیک:

1. `profile` صریح در پیکربندی.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. شناسه حساب برای حساب‌های غیرپیش‌فرض، یا `default` برای حساب پیش‌فرض.

برای راه‌اندازی‌های چندحسابی، بهتر است `profile` را در پیکربندی هر حساب تنظیم کنید تا یک متغیر محیطی باعث نشود چند حساب نشست ورود یکسانی را به‌اشتراک بگذارند.

## تایپ‌کردن، واکنش‌ها و تأییدیه‌های تحویل

- OpenClaw پیش از ارسال پاسخ، رویداد تایپ‌کردن را ارسال می‌کند (در حد امکان).
- کنش واکنش به پیام `react` برای `zalouser` در کنش‌های کانال پشتیبانی می‌شود.
  - برای حذف یک ایموجی واکنش مشخص از پیام، از `remove: true` استفاده کنید.
  - معناشناسی واکنش‌ها: [واکنش‌ها](/fa/tools/reactions)
- برای پیام‌های ورودی دارای فراداده رویداد، OpenClaw تأییدیه‌های تحویل‌شده و دیده‌شده را ارسال می‌کند (در حد امکان).

## عیب‌یابی

**ورود پایدار نمی‌ماند:**

- `openclaw channels status --probe`
- ورود مجدد: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**نام فهرست مجاز/گروه تفکیک نشد:**

- در `allowFrom`/`groupAllowFrom` از شناسه‌های عددی و در `groups` از شناسه‌های پایدار گروه استفاده کنید. اگر عمداً به نام دقیق دوست/گروه نیاز دارید، `channels.zalouser.dangerouslyAllowNameMatching: true` را فعال کنید.

**از یک راه‌اندازی خارجی قدیمی مبتنی بر `zca`/CLI ارتقا داده‌اید:**

- هرگونه فرض درباره پردازه خارجی `zca` را حذف کنید؛ کانال اکنون کاملاً به‌صورت درون‌پردازه‌ای از طریق `zca-js` و بدون فایل اجرایی خارجی CLI اجرا می‌شود.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) - همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) - احراز هویت پیام مستقیم و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) - رفتار گفت‌وگوی گروهی و الزام اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) - مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) - مدل دسترسی و مقاوم‌سازی
