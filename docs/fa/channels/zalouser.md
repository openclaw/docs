---
read_when:
    - راه‌اندازی Zalo Personal برای OpenClaw
    - اشکال‌زدایی ورود یا جریان پیام در Zalo Personal
summary: پشتیبانی از حساب شخصی Zalo از طریق zca-js بومی (ورود با کد QR)، قابلیت‌ها و پیکربندی
title: Zalo شخصی
x-i18n:
    generated_at: "2026-04-29T22:31:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

Status: آزمایشی. این یکپارچه‌سازی یک **حساب شخصی Zalo** را از طریق `zca-js` بومی در OpenClaw خودکار می‌کند.

<Warning>
این یکپارچه‌سازی غیررسمی است و ممکن است به تعلیق یا مسدود شدن حساب منجر شود. با مسئولیت خودتان استفاده کنید.
</Warning>

## Plugin همراه

Zalo Personal در نسخه‌های فعلی OpenClaw به‌عنوان یک Plugin همراه عرضه می‌شود، بنابراین buildهای
بسته‌بندی‌شده عادی به نصب جداگانه نیاز ندارند.

اگر از یک build قدیمی‌تر یا نصب سفارشی استفاده می‌کنید که Zalo Personal را مستثنا می‌کند،
وقتی یک بسته npm فعلی منتشر شد، آن را نصب کنید:

- نصب از طریق CLI: `openclaw plugins install @openclaw/zalouser`
- یا از یک checkout منبع: `openclaw plugins install ./path/to/local/zalouser-plugin`
- جزئیات: [Pluginها](/fa/tools/plugin)

اگر npm بسته متعلق به OpenClaw را منسوخ گزارش کرد، تا زمانی که بسته npm جدیدتری
منتشر شود، از یک build بسته‌بندی‌شده فعلی OpenClaw یا مسیر checkout محلی استفاده کنید.

هیچ باینری CLI خارجی `zca`/`openzca` لازم نیست.

## راه‌اندازی سریع (مبتدی)

1. مطمئن شوید Plugin مربوط به Zalo Personal در دسترس است.
   - نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه خود دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند با دستورهای بالا آن را به‌صورت دستی اضافه کنند.
2. وارد شوید (QR، روی ماشین Gateway):
   - `openclaw channels login --channel zalouser`
   - کد QR را با اپ موبایل Zalo اسکن کنید.
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

4. Gateway را بازراه‌اندازی کنید (یا راه‌اندازی را کامل کنید).
5. دسترسی DM به‌طور پیش‌فرض روی جفت‌سازی است؛ در اولین تماس، کد جفت‌سازی را تأیید کنید.

## چیست

- کاملاً درون همان فرایند از طریق `zca-js` اجرا می‌شود.
- از شنونده‌های رویداد بومی برای دریافت پیام‌های ورودی استفاده می‌کند.
- پاسخ‌ها را مستقیماً از طریق API جاوااسکریپت ارسال می‌کند (متن/رسانه/لینک).
- برای موارد استفاده «حساب شخصی» طراحی شده است، وقتی API ربات Zalo در دسترس نیست.

## نام‌گذاری

شناسه کانال `zalouser` است تا صریح باشد که این مورد یک **حساب کاربر شخصی Zalo** را خودکار می‌کند (غیررسمی). ما `zalo` را برای یک یکپارچه‌سازی احتمالی آینده با API رسمی Zalo رزرو نگه می‌داریم.

## یافتن شناسه‌ها (دایرکتوری)

از CLI دایرکتوری برای کشف همتاها/گروه‌ها و شناسه‌های آن‌ها استفاده کنید:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## محدودیت‌ها

- متن خروجی به قطعه‌های حدوداً ۲۰۰۰ نویسه‌ای تقسیم می‌شود (محدودیت‌های کلاینت Zalo).
- Streaming به‌طور پیش‌فرض مسدود است.

## کنترل دسترسی (DMها)

`channels.zalouser.dmPolicy` پشتیبانی می‌کند از: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).

`channels.zalouser.allowFrom` شناسه‌های کاربر یا نام‌ها را می‌پذیرد. هنگام راه‌اندازی، نام‌ها با استفاده از lookup مخاطبان درون‌فرایندی Plugin به شناسه‌ها تبدیل می‌شوند.

تأیید از طریق:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## دسترسی گروه (اختیاری)

- پیش‌فرض: `channels.zalouser.groupPolicy = "open"` (گروه‌ها مجاز هستند). برای بازنویسی پیش‌فرض وقتی تنظیم نشده است، از `channels.defaults.groupPolicy` استفاده کنید.
- محدودسازی به allowlist با:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (کلیدها باید شناسه‌های پایدار گروه باشند؛ نام‌ها هنگام راه‌اندازی، در صورت امکان، به شناسه‌ها تبدیل می‌شوند)
  - `channels.zalouser.groupAllowFrom` (کنترل می‌کند کدام فرستنده‌ها در گروه‌های مجاز می‌توانند ربات را فعال کنند)
- مسدود کردن همه گروه‌ها: `channels.zalouser.groupPolicy = "disabled"`.
- جادوگر پیکربندی می‌تواند برای allowlistهای گروه درخواست ورودی کند.
- هنگام راه‌اندازی، OpenClaw نام‌های گروه/کاربر را در allowlistها به شناسه‌ها تبدیل می‌کند و نگاشت را لاگ می‌کند.
- تطبیق allowlist گروه به‌طور پیش‌فرض فقط بر اساس شناسه است. نام‌های حل‌نشده برای احراز مجوز نادیده گرفته می‌شوند، مگر اینکه `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد.
- `channels.zalouser.dangerouslyAllowNameMatching: true` یک حالت سازگاری اضطراری است که تطبیق قابل‌تغییر نام گروه را دوباره فعال می‌کند.
- اگر `groupAllowFrom` تنظیم نشده باشد، runtime برای بررسی فرستنده‌های گروه به `allowFrom` برمی‌گردد.
- بررسی‌های فرستنده هم روی پیام‌های عادی گروه و هم روی دستورهای کنترلی اعمال می‌شوند (برای مثال `/new`، `/reset`).

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

### دروازه‌گذاری منشن گروه

- `channels.zalouser.groups.<group>.requireMention` کنترل می‌کند که آیا پاسخ‌های گروه به منشن نیاز دارند یا نه.
- ترتیب حل: شناسه/نام دقیق گروه -> slug نرمال‌شده گروه -> `*` -> پیش‌فرض (`true`).
- این هم روی گروه‌های موجود در allowlist و هم روی حالت گروه باز اعمال می‌شود.
- نقل‌قول کردن پیام ربات برای فعال‌سازی گروه به‌عنوان یک منشن ضمنی محسوب می‌شود.
- دستورهای کنترلی مجاز (برای مثال `/new`) می‌توانند دروازه‌گذاری منشن را دور بزنند.
- وقتی یک پیام گروه به دلیل نیاز به منشن رد می‌شود، OpenClaw آن را به‌عنوان تاریخچه گروه معلق ذخیره می‌کند و در پیام گروه پردازش‌شده بعدی آن را لحاظ می‌کند.
- حد تاریخچه گروه به‌طور پیش‌فرض `messages.groupChat.historyLimit` است (fallback `50`). می‌توانید آن را برای هر حساب با `channels.zalouser.historyLimit` بازنویسی کنید.

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

## تایپ، واکنش‌ها، و تأییدهای تحویل

- OpenClaw پیش از ارسال پاسخ، یک رویداد تایپ ارسال می‌کند (بهترین تلاش).
- کنش واکنش پیام `react` برای `zalouser` در کنش‌های کانال پشتیبانی می‌شود.
  - برای حذف یک ایموجی واکنش مشخص از یک پیام، از `remove: true` استفاده کنید.
  - معنای واکنش‌ها: [واکنش‌ها](/fa/tools/reactions)
- برای پیام‌های ورودی که شامل فراداده رویداد هستند، OpenClaw تأییدهای تحویل‌شده + دیده‌شده ارسال می‌کند (بهترین تلاش).

## عیب‌یابی

**ورود ماندگار نمی‌شود:**

- `openclaw channels status --probe`
- ورود دوباره: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**نام allowlist/گروه حل نشد:**

- در `allowFrom`/`groupAllowFrom`/`groups` از شناسه‌های عددی، یا نام‌های دقیق دوست/گروه استفاده کنید.

**از راه‌اندازی قدیمی مبتنی بر CLI ارتقا داده‌اید:**

- هرگونه فرض قدیمی درباره فرایند خارجی `zca` را حذف کنید.
- کانال اکنون بدون باینری‌های CLI خارجی، کاملاً در OpenClaw اجرا می‌شود.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و دروازه‌گذاری منشن
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
