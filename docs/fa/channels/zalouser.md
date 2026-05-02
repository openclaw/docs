---
read_when:
    - راه‌اندازی Zalo Personal برای OpenClaw
    - اشکال‌زدایی جریان ورود یا پیام‌رسانی Zalo Personal
summary: پشتیبانی از حساب شخصی Zalo از طریق zca-js بومی (ورود با QR)، قابلیت‌ها و پیکربندی
title: Zalo شخصی
x-i18n:
    generated_at: "2026-05-02T22:17:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

وضعیت: آزمایشی. این یکپارچه‌سازی یک **حساب شخصی Zalo** را از طریق `zca-js` بومی داخل OpenClaw خودکار می‌کند.

<Warning>
این یکپارچه‌سازی غیررسمی است و ممکن است به تعلیق یا مسدود شدن حساب منجر شود. با مسئولیت خودتان استفاده کنید.
</Warning>

## Plugin همراه

Zalo Personal در نسخه‌های فعلی OpenClaw به‌صورت Plugin همراه ارائه می‌شود، بنابراین بیلدهای
بسته‌بندی‌شده معمولی به نصب جداگانه نیاز ندارند.

اگر از یک بیلد قدیمی‌تر یا نصب سفارشی استفاده می‌کنید که Zalo Personal را شامل نمی‌شود،
بسته npm را مستقیما نصب کنید:

- نصب از طریق CLI: `openclaw plugins install @openclaw/zalouser`
- نسخه پین‌شده: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- یا از یک checkout منبع: `openclaw plugins install ./path/to/local/zalouser-plugin`
- جزئیات: [Plugins](/fa/tools/plugin)

هیچ باینری CLI خارجی `zca`/`openzca` لازم نیست.

## راه‌اندازی سریع (مبتدی)

1. مطمئن شوید Plugin Zalo Personal در دسترس است.
   - نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند آن را با فرمان‌های بالا به‌صورت دستی اضافه کنند.
2. وارد شوید (QR، روی دستگاه Gateway):
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

4. Gateway را راه‌اندازی مجدد کنید (یا راه‌اندازی را تمام کنید).
5. دسترسی DM به‌طور پیش‌فرض از pairing استفاده می‌کند؛ در اولین تماس کد pairing را تأیید کنید.

## چیست

- کاملا درون‌فرآیندی از طریق `zca-js` اجرا می‌شود.
- از شنونده‌های رویداد بومی برای دریافت پیام‌های ورودی استفاده می‌کند.
- پاسخ‌ها را مستقیما از طریق API جاوااسکریپت ارسال می‌کند (متن/رسانه/پیوند).
- برای موارد استفاده «حساب شخصی» طراحی شده است، جایی که Zalo Bot API در دسترس نیست.

## نام‌گذاری

شناسه کانال `zalouser` است تا صراحتا مشخص کند که این مورد یک **حساب کاربر شخصی Zalo** را خودکار می‌کند (غیررسمی). ما `zalo` را برای یکپارچه‌سازی رسمی احتمالی آینده با Zalo API رزرو نگه می‌داریم.

## یافتن شناسه‌ها (دایرکتوری)

برای پیدا کردن همتاها/گروه‌ها و شناسه‌هایشان از CLI دایرکتوری استفاده کنید:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## محدودیت‌ها

- متن خروجی به قطعه‌هایی با حدود ۲۰۰۰ نویسه تقسیم می‌شود (محدودیت‌های کلاینت Zalo).
- Streaming به‌طور پیش‌فرض مسدود است.

## کنترل دسترسی (DMها)

`channels.zalouser.dmPolicy` از این موارد پشتیبانی می‌کند: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).

`channels.zalouser.allowFrom` شناسه‌های کاربر یا نام‌ها را می‌پذیرد. هنگام راه‌اندازی، نام‌ها با استفاده از جست‌وجوی مخاطب درون‌فرآیندی Plugin به شناسه تبدیل می‌شوند.

تأیید از طریق:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## دسترسی گروه (اختیاری)

- پیش‌فرض: `channels.zalouser.groupPolicy = "open"` (گروه‌ها مجاز هستند). برای بازنویسی مقدار پیش‌فرض هنگام تنظیم‌نبودن، از `channels.defaults.groupPolicy` استفاده کنید.
- محدود کردن به allowlist با:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (کلیدها باید شناسه‌های پایدار گروه باشند؛ نام‌ها در صورت امکان هنگام راه‌اندازی به شناسه تبدیل می‌شوند)
  - `channels.zalouser.groupAllowFrom` (کنترل می‌کند کدام فرستنده‌ها در گروه‌های مجاز می‌توانند bot را فعال کنند)
- مسدود کردن همه گروه‌ها: `channels.zalouser.groupPolicy = "disabled"`.
- راهنمای پیکربندی می‌تواند برای allowlistهای گروه سؤال کند.
- هنگام راه‌اندازی، OpenClaw نام‌های گروه/کاربر در allowlistها را به شناسه تبدیل می‌کند و نگاشت را در لاگ ثبت می‌کند.
- تطبیق allowlist گروه به‌طور پیش‌فرض فقط بر اساس شناسه است. نام‌های حل‌نشده برای احراز مجوز نادیده گرفته می‌شوند، مگر اینکه `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد.
- `channels.zalouser.dangerouslyAllowNameMatching: true` یک حالت سازگاری اضطراری است که تطبیق تغییرپذیر نام گروه را دوباره فعال می‌کند.
- اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا برای بررسی‌های فرستنده گروه به `allowFrom` برمی‌گردد.
- بررسی‌های فرستنده هم روی پیام‌های عادی گروه و هم روی فرمان‌های کنترل اعمال می‌شوند (برای مثال `/new`، `/reset`).

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

### دروازه‌گذاری mention در گروه

- `channels.zalouser.groups.<group>.requireMention` کنترل می‌کند که آیا پاسخ‌های گروه به mention نیاز دارند یا نه.
- ترتیب حل: شناسه/نام دقیق گروه -> slug نرمال‌شده گروه -> `*` -> پیش‌فرض (`true`).
- این هم برای گروه‌های allowlistشده و هم حالت گروه باز اعمال می‌شود.
- نقل‌قول کردن پیام bot به‌عنوان mention ضمنی برای فعال‌سازی گروه محسوب می‌شود.
- فرمان‌های کنترل مجاز (برای مثال `/new`) می‌توانند از دروازه‌گذاری mention عبور کنند.
- وقتی پیام گروه به دلیل نیاز به mention نادیده گرفته می‌شود، OpenClaw آن را به‌عنوان تاریخچه گروه در انتظار ذخیره می‌کند و در پیام گروه پردازش‌شده بعدی آن را لحاظ می‌کند.
- حد تاریخچه گروه به‌طور پیش‌فرض `messages.groupChat.historyLimit` است (fallback `50`). می‌توانید برای هر حساب با `channels.zalouser.historyLimit` آن را بازنویسی کنید.

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

## تایپ کردن، واکنش‌ها و تأییدیه‌های تحویل

- OpenClaw پیش از ارسال پاسخ، یک رویداد typing می‌فرستد (در حد تلاش).
- کنش واکنش پیام `react` برای `zalouser` در کنش‌های کانال پشتیبانی می‌شود.
  - برای حذف یک ایموجی واکنش مشخص از پیام، از `remove: true` استفاده کنید.
  - معناشناسی واکنش: [واکنش‌ها](/fa/tools/reactions)
- برای پیام‌های ورودی‌ای که شامل فراداده رویداد هستند، OpenClaw تأییدیه‌های delivered + seen را ارسال می‌کند (در حد تلاش).

## عیب‌یابی

**ورود ماندگار نمی‌شود:**

- `openclaw channels status --probe`
- ورود دوباره: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**نام allowlist/گروه حل نشد:**

- از شناسه‌های عددی در `allowFrom`/`groupAllowFrom`/`groups`، یا نام‌های دقیق دوست/گروه استفاده کنید.

**از راه‌اندازی قدیمی مبتنی بر CLI ارتقا داده‌اید:**

- هرگونه فرض قدیمی درباره فرایند خارجی `zca` را حذف کنید.
- اکنون کانال بدون باینری‌های CLI خارجی کاملا در OpenClaw اجرا می‌شود.

## مرتبط

- [مرور کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و دروازه‌گذاری mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی جلسه برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و مقاوم‌سازی
