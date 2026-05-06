---
read_when:
    - راه‌اندازی Zalo Personal برای OpenClaw
    - اشکال‌زدایی جریان ورود یا پیام در Zalo Personal
summary: پشتیبانی از حساب شخصی Zalo از طریق zca-js بومی (ورود با QR)، قابلیت‌ها و پیکربندی
title: Zalo شخصی
x-i18n:
    generated_at: "2026-05-06T17:52:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

وضعیت: آزمایشی. این یکپارچه‌سازی یک **حساب شخصی Zalo** را از طریق `zca-js` بومی داخل OpenClaw خودکار می‌کند.

<Warning>
این یکپارچه‌سازی غیررسمی است و ممکن است به تعلیق یا مسدود شدن حساب منجر شود. با مسئولیت خودتان استفاده کنید.
</Warning>

## Plugin همراه

Zalo Personal در نسخه‌های فعلی OpenClaw به‌صورت یک Plugin همراه ارائه می‌شود، بنابراین بیلدهای بسته‌بندی‌شدهٔ معمولی به نصب جداگانه نیاز ندارند.

اگر از یک بیلد قدیمی‌تر یا نصب سفارشی‌ای استفاده می‌کنید که Zalo Personal را حذف کرده است، بستهٔ npm را مستقیماً نصب کنید:

- نصب از طریق CLI: `openclaw plugins install @openclaw/zalouser`
- نسخهٔ سنجاق‌شده: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- یا از یک checkout سورس: `openclaw plugins install ./path/to/local/zalouser-plugin`
- جزئیات: [Pluginها](/fa/tools/plugin)

هیچ باینری CLI خارجی `zca`/`openzca` لازم نیست.

## راه‌اندازی سریع (مبتدی)

1. مطمئن شوید Plugin مربوط به Zalo Personal در دسترس است.
   - نسخه‌های بسته‌بندی‌شدهٔ فعلی OpenClaw از قبل آن را همراه دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند با دستورهای بالا آن را به‌صورت دستی اضافه کنند.
2. وارد شوید (QR، روی ماشین Gateway):
   - `openclaw channels login --channel zalouser`
   - کد QR را با اپلیکیشن موبایل Zalo اسکن کنید.
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
5. دسترسی DM به‌طور پیش‌فرض روی جفت‌سازی است؛ در اولین تماس، کد جفت‌سازی را تأیید کنید.

## چیستی آن

- کاملاً درون‌فرایندی از طریق `zca-js` اجرا می‌شود.
- از شنونده‌های رویداد بومی برای دریافت پیام‌های ورودی استفاده می‌کند.
- پاسخ‌ها را مستقیماً از طریق API جاوااسکریپت ارسال می‌کند (متن/رسانه/لینک).
- برای سناریوهای استفاده از «حساب شخصی» طراحی شده است که در آن‌ها Zalo Bot API در دسترس نیست.

## نام‌گذاری

شناسهٔ کانال `zalouser` است تا صریح باشد که این مورد یک **حساب کاربری شخصی Zalo** را خودکار می‌کند (غیررسمی). ما `zalo` را برای یکپارچه‌سازی احتمالی آینده با API رسمی Zalo رزرو نگه می‌داریم.

## یافتن شناسه‌ها (دایرکتوری)

برای کشف همتاها/گروه‌ها و شناسه‌هایشان از CLI دایرکتوری استفاده کنید:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## محدودیت‌ها

- متن خروجی به قطعه‌های حدوداً ۲۰۰۰ کاراکتری تقسیم می‌شود (محدودیت‌های کلاینت Zalo).
- پخش جریانی به‌طور پیش‌فرض مسدود است.

## کنترل دسترسی (DMها)

`channels.zalouser.dmPolicy` از این موارد پشتیبانی می‌کند: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).

`channels.zalouser.allowFrom` باید از شناسه‌های پایدار کاربران Zalo استفاده کند. در زمان راه‌اندازی تعاملی، نام‌های واردشده می‌توانند با استفاده از جست‌وجوی مخاطب درون‌فرایندی Plugin به شناسه‌ها تبدیل شوند.

اگر یک نام خام در پیکربندی باقی بماند، راه‌اندازی فقط وقتی آن را تبدیل می‌کند که `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد. بدون این opt-in، بررسی‌های فرستنده در زمان اجرا فقط مبتنی بر شناسه هستند و نام‌های خام برای مجوزدهی نادیده گرفته می‌شوند.

تأیید از طریق:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## دسترسی گروهی (اختیاری)

- پیش‌فرض: `channels.zalouser.groupPolicy = "open"` (گروه‌ها مجاز هستند). برای بازنویسی پیش‌فرض در حالت تنظیم‌نشده، از `channels.defaults.groupPolicy` استفاده کنید.
- محدودسازی به allowlist با:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (کلیدها باید شناسه‌های پایدار گروه باشند؛ نام‌ها فقط وقتی در هنگام راه‌اندازی به شناسه تبدیل می‌شوند که `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد)
  - `channels.zalouser.groupAllowFrom` (کنترل می‌کند کدام فرستنده‌ها در گروه‌های مجاز می‌توانند ربات را فعال کنند)
- مسدود کردن همهٔ گروه‌ها: `channels.zalouser.groupPolicy = "disabled"`.
- جادوگر پیکربندی می‌تواند برای allowlistهای گروهی درخواست ورودی کند.
- هنگام راه‌اندازی، OpenClaw فقط وقتی `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد، نام‌های گروه/کاربر را در allowlistها به شناسه تبدیل می‌کند و نگاشت را ثبت می‌کند.
- تطبیق allowlist گروهی به‌طور پیش‌فرض فقط مبتنی بر شناسه است. نام‌های تبدیل‌نشده برای احراز مجوز نادیده گرفته می‌شوند مگر اینکه `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد.
- `channels.zalouser.dangerouslyAllowNameMatching: true` یک حالت سازگاری اضطراری است که تبدیل نام تغییرپذیر در راه‌اندازی و تطبیق نام گروه در زمان اجرا را دوباره فعال می‌کند.
- اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا برای بررسی فرستندهٔ گروه به `allowFrom` برمی‌گردد.
- بررسی‌های فرستنده هم برای پیام‌های گروهی عادی و هم برای دستورهای کنترلی اعمال می‌شوند (برای مثال `/new`، `/reset`).

نمونه:

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

### محدودسازی منشن گروه

- `channels.zalouser.groups.<group>.requireMention` کنترل می‌کند که آیا پاسخ‌های گروهی به منشن نیاز دارند یا نه.
- ترتیب تبدیل: شناسه/نام دقیق گروه -> اسلاگ نرمال‌شدهٔ گروه -> `*` -> پیش‌فرض (`true`).
- این مورد هم برای گروه‌های allowlistشده و هم برای حالت گروه باز اعمال می‌شود.
- نقل‌قول کردن یک پیام ربات برای فعال‌سازی گروه به‌عنوان یک منشن ضمنی محسوب می‌شود.
- دستورهای کنترلی مجاز (برای مثال `/new`) می‌توانند محدودسازی منشن را دور بزنند.
- وقتی یک پیام گروهی به‌دلیل نیاز به منشن رد می‌شود، OpenClaw آن را به‌عنوان تاریخچهٔ گروهی در انتظار ذخیره می‌کند و در پیام گروهی پردازش‌شدهٔ بعدی وارد می‌کند.
- محدودیت تاریخچهٔ گروه به‌طور پیش‌فرض `messages.groupChat.historyLimit` است (fallback `50`). می‌توانید آن را برای هر حساب با `channels.zalouser.historyLimit` بازنویسی کنید.

نمونه:

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

حساب‌ها در state مربوط به OpenClaw به پروفایل‌های `zalouser` نگاشت می‌شوند. نمونه:

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

- OpenClaw پیش از ارسال پاسخ، یک رویداد تایپ ارسال می‌کند (در حد بهترین تلاش).
- اکشن واکنش پیام `react` برای `zalouser` در اکشن‌های کانال پشتیبانی می‌شود.
  - برای حذف یک ایموجی واکنش مشخص از پیام، از `remove: true` استفاده کنید.
  - معنای واکنش‌ها: [واکنش‌ها](/fa/tools/reactions)
- برای پیام‌های ورودی که شامل فرادادهٔ رویداد هستند، OpenClaw تأییدیه‌های delivered + seen را ارسال می‌کند (در حد بهترین تلاش).

## عیب‌یابی

**ورود ماندگار نمی‌شود:**

- `openclaw channels status --probe`
- ورود دوباره: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**نام allowlist/گروه تبدیل نشد:**

- از شناسه‌های عددی در `allowFrom`/`groupAllowFrom` و از شناسه‌های پایدار گروه در `groups` استفاده کنید. اگر عمداً به نام دقیق دوست/گروه نیاز دارید، `channels.zalouser.dangerouslyAllowNameMatching: true` را فعال کنید.

**از راه‌اندازی قدیمی مبتنی بر CLI ارتقا داده‌اید:**

- هرگونه فرض مربوط به فرایند خارجی قدیمی `zca` را حذف کنید.
- کانال اکنون بدون باینری‌های CLI خارجی، به‌طور کامل داخل OpenClaw اجرا می‌شود.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و محدودسازی منشن
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
