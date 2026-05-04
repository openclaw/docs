---
read_when:
    - راه‌اندازی Zalo Personal برای OpenClaw
    - اشکال‌زدایی ورود به Zalo Personal یا جریان پیام
summary: پشتیبانی از حساب شخصی Zalo از طریق zca-js بومی (ورود با QR)، قابلیت‌ها و پیکربندی
title: Zalo شخصی
x-i18n:
    generated_at: "2026-05-04T18:23:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6d27f0ca502e6426abe21d609efd0a168a0b6b0fafe8d52d59f1a717da1ed5
    source_path: channels/zalouser.md
    workflow: 16
---

وضعیت: آزمایشی. این یکپارچه‌سازی یک **حساب شخصی Zalo** را از طریق `zca-js` بومی درون OpenClaw خودکار می‌کند.

<Warning>
این یکپارچه‌سازی غیررسمی است و ممکن است به تعلیق یا مسدود شدن حساب منجر شود. با مسئولیت خودتان استفاده کنید.
</Warning>

## Plugin همراه

Zalo Personal به‌عنوان یک Plugin همراه در انتشارهای فعلی OpenClaw ارائه می‌شود، بنابراین بیلدهای بسته‌بندی‌شده معمولی به نصب جداگانه نیاز ندارند.

اگر از یک بیلد قدیمی‌تر یا نصب سفارشی‌ای استفاده می‌کنید که Zalo Personal را شامل نمی‌شود، بسته npm را مستقیماً نصب کنید:

- نصب از طریق CLI: `openclaw plugins install @openclaw/zalouser`
- نسخه پین‌شده: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- یا از یک checkout منبع: `openclaw plugins install ./path/to/local/zalouser-plugin`
- جزئیات: [Plugins](/fa/tools/plugin)

هیچ باینری CLI خارجی `zca`/`openzca` لازم نیست.

## راه‌اندازی سریع (مبتدی)

1. مطمئن شوید Plugin مربوط به Zalo Personal در دسترس است.
   - انتشارهای بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه خود دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند آن را با دستورهای بالا به‌صورت دستی اضافه کنند.
2. ورود (QR، روی ماشین Gateway):
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

4. Gateway را راه‌اندازی مجدد کنید (یا راه‌اندازی را کامل کنید).
5. دسترسی DM به‌طور پیش‌فرض روی pairing است؛ در اولین تماس، کد pairing را تأیید کنید.

## چیستی آن

- کاملاً درون فرایند و از طریق `zca-js` اجرا می‌شود.
- از شنونده‌های رویداد بومی برای دریافت پیام‌های ورودی استفاده می‌کند.
- پاسخ‌ها را مستقیماً از طریق API جاوااسکریپت ارسال می‌کند (متن/رسانه/پیوند).
- برای موارد استفاده «حساب شخصی» طراحی شده است که در آن‌ها Zalo Bot API در دسترس نیست.

## نام‌گذاری

شناسه کانال `zalouser` است تا صریح باشد که این مورد یک **حساب کاربر شخصی Zalo** را خودکار می‌کند (غیررسمی). ما `zalo` را برای یک یکپارچه‌سازی احتمالی رسمی Zalo API در آینده رزرو نگه می‌داریم.

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

`channels.zalouser.dmPolicy` از این موارد پشتیبانی می‌کند: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).

`channels.zalouser.allowFrom` باید از شناسه‌های پایدار کاربران Zalo استفاده کند. هنگام راه‌اندازی تعاملی، نام‌های واردشده می‌توانند با استفاده از جست‌وجوی مخاطب درون‌فرایندی Plugin به شناسه تبدیل شوند.

اگر یک نام خام در پیکربندی باقی بماند، هنگام راه‌اندازی فقط وقتی resolve می‌شود که `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد. بدون این opt-in، بررسی‌های فرستنده در زمان اجرا فقط مبتنی بر شناسه هستند و نام‌های خام برای مجوزدهی نادیده گرفته می‌شوند.

تأیید از طریق:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## دسترسی گروهی (اختیاری)

- پیش‌فرض: `channels.zalouser.groupPolicy = "open"` (گروه‌ها مجاز هستند). برای بازنویسی مقدار پیش‌فرض در حالت تنظیم‌نشده، از `channels.defaults.groupPolicy` استفاده کنید.
- محدود کردن به یک allowlist با:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (کلیدها باید شناسه‌های پایدار گروه باشند؛ نام‌ها فقط هنگام راه‌اندازی و فقط وقتی `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد به شناسه تبدیل می‌شوند)
  - `channels.zalouser.groupAllowFrom` (کنترل می‌کند کدام فرستنده‌ها در گروه‌های مجاز می‌توانند بات را فعال کنند)
- مسدود کردن همه گروه‌ها: `channels.zalouser.groupPolicy = "disabled"`.
- ویزارد پیکربندی می‌تواند برای allowlistهای گروهی درخواست ورودی کند.
- هنگام راه‌اندازی، OpenClaw نام‌های گروه/کاربر در allowlistها را به شناسه‌ها تبدیل می‌کند و نگاشت را فقط وقتی `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد در لاگ ثبت می‌کند.
- تطبیق allowlist گروه به‌طور پیش‌فرض فقط مبتنی بر شناسه است. نام‌های resolveنشده برای احراز مجوز نادیده گرفته می‌شوند مگر اینکه `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد.
- `channels.zalouser.dangerouslyAllowNameMatching: true` یک حالت سازگاری اضطراری است که resolve نام‌های متغیر هنگام راه‌اندازی و تطبیق نام گروه در زمان اجرا را دوباره فعال می‌کند.
- اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا برای بررسی فرستنده‌های گروهی به `allowFrom` برمی‌گردد.
- بررسی‌های فرستنده هم برای پیام‌های عادی گروهی و هم برای فرمان‌های کنترلی اعمال می‌شوند (برای مثال `/new`، `/reset`).

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

### گیت‌گذاری اشاره در گروه

- `channels.zalouser.groups.<group>.requireMention` کنترل می‌کند که آیا پاسخ‌های گروهی به اشاره نیاز دارند یا نه.
- ترتیب resolve: شناسه/نام دقیق گروه -> slug نرمال‌شده گروه -> `*` -> پیش‌فرض (`true`).
- این هم برای گروه‌های allowlistشده و هم برای حالت گروه باز اعمال می‌شود.
- نقل‌قول کردن پیام بات به‌عنوان یک اشاره ضمنی برای فعال‌سازی گروه حساب می‌شود.
- فرمان‌های کنترلی مجاز (برای مثال `/new`) می‌توانند گیت‌گذاری اشاره را دور بزنند.
- وقتی یک پیام گروهی به این دلیل رد می‌شود که اشاره لازم است، OpenClaw آن را به‌عنوان تاریخچه گروهی معلق ذخیره می‌کند و در پیام گروهی پردازش‌شده بعدی آن را لحاظ می‌کند.
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

حساب‌ها در state مربوط به OpenClaw به پروفایل‌های `zalouser` نگاشت می‌شوند. مثال:

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

## تایپ کردن، واکنش‌ها، و تأییدهای تحویل

- OpenClaw پیش از ارسال پاسخ، یک رویداد typing می‌فرستد (best-effort).
- عمل واکنش پیام `react` برای `zalouser` در اقدام‌های کانال پشتیبانی می‌شود.
  - برای حذف یک ایموجی واکنش مشخص از پیام، از `remove: true` استفاده کنید.
  - معناشناسی واکنش‌ها: [Reactions](/fa/tools/reactions)
- برای پیام‌های ورودی که شامل فراداده رویداد هستند، OpenClaw تأییدهای delivered + seen را ارسال می‌کند (best-effort).

## عیب‌یابی

**ورود پایدار نمی‌ماند:**

- `openclaw channels status --probe`
- ورود دوباره: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**نام allowlist/گروه resolve نشد:**

- از شناسه‌های عددی در `allowFrom`/`groupAllowFrom` و شناسه‌های پایدار گروه در `groups` استفاده کنید. اگر عمداً به نام‌های دقیق دوست/گروه نیاز دارید، `channels.zalouser.dangerouslyAllowNameMatching: true` را فعال کنید.

**از راه‌اندازی قدیمی مبتنی بر CLI ارتقا داده‌اید:**

- هر فرض قدیمی درباره فرایند خارجی `zca` را حذف کنید.
- کانال اکنون به‌طور کامل در OpenClaw و بدون باینری‌های CLI خارجی اجرا می‌شود.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و گیت‌گذاری اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
