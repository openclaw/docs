---
read_when:
    - راه‌اندازی Zalo Personal برای OpenClaw
    - اشکال‌زدایی ورود یا جریان پیام Zalo Personal
summary: پشتیبانی از حساب شخصی Zalo از طریق zca-js بومی (ورود با QR)، قابلیت‌ها، و پیکربندی
title: Zalo شخصی
x-i18n:
    generated_at: "2026-06-27T17:16:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

وضعیت: آزمایشی. این یکپارچه‌سازی یک **حساب شخصی Zalo** را از طریق `zca-js` بومی داخل OpenClaw خودکار می‌کند.

<Warning>
این یکپارچه‌سازی غیررسمی است و ممکن است باعث تعلیق یا مسدود شدن حساب شود. با مسئولیت خودتان استفاده کنید.
</Warning>

## Plugin همراه

Zalo Personal در نسخه‌های فعلی OpenClaw به‌صورت Plugin همراه عرضه می‌شود، بنابراین بیلدهای
بسته‌بندی‌شده عادی به نصب جداگانه نیاز ندارند.

اگر از یک بیلد قدیمی‌تر یا نصب سفارشی استفاده می‌کنید که Zalo Personal را شامل نمی‌شود،
بسته npm را مستقیم نصب کنید:

- نصب از طریق CLI: `openclaw plugins install @openclaw/zalouser`
- نسخه ثابت: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- یا از یک checkout منبع: `openclaw plugins install ./path/to/local/zalouser-plugin`
- جزئیات: [Pluginها](/fa/tools/plugin)

هیچ باینری CLI خارجی `zca`/`openzca` لازم نیست.

## راه‌اندازی سریع (مبتدی)

1. مطمئن شوید Plugin مربوط به Zalo Personal در دسترس است.
   - نسخه‌های بسته‌بندی‌شده فعلی OpenClaw از قبل آن را همراه دارند.
   - نصب‌های قدیمی‌تر/سفارشی می‌توانند آن را با دستورهای بالا به‌صورت دستی اضافه کنند.
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

4. Gateway را بازراه‌اندازی کنید (یا راه‌اندازی را کامل کنید).
5. دسترسی پیام مستقیم به‌طور پیش‌فرض روی جفت‌سازی است؛ در اولین تماس، کد جفت‌سازی را تأیید کنید.

## چیستی آن

- کاملاً درون فرایند و از طریق `zca-js` اجرا می‌شود.
- برای دریافت پیام‌های ورودی از شنونده‌های رویداد بومی استفاده می‌کند.
- پاسخ‌ها را مستقیم از طریق JS API ارسال می‌کند (متن/رسانه/لینک).
- برای موارد استفاده «حساب شخصی» طراحی شده است که در آن‌ها Zalo Bot API در دسترس نیست.

## نام‌گذاری

شناسه کانال `zalouser` است تا صریح باشد که این یک **حساب کاربر شخصی Zalo** را خودکار می‌کند (غیررسمی). ما `zalo` را برای یکپارچه‌سازی احتمالی آینده با API رسمی Zalo رزرو نگه می‌داریم.

## یافتن شناسه‌ها (دایرکتوری)

برای کشف همتاها/گروه‌ها و شناسه‌های آن‌ها از CLI دایرکتوری استفاده کنید:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## محدودیت‌ها

- متن خروجی به قطعه‌های حدود ۲۰۰۰ نویسه‌ای تقسیم می‌شود (محدودیت‌های کلاینت Zalo).
- استریم به‌طور پیش‌فرض مسدود است.

## کنترل دسترسی (DMها)

`channels.zalouser.dmPolicy` از این موارد پشتیبانی می‌کند: `pairing | allowlist | open | disabled` (پیش‌فرض: `pairing`).

`channels.zalouser.allowFrom` باید از شناسه‌های کاربری پایدار Zalo استفاده کند. همچنین می‌تواند به گروه‌های دسترسی فرستنده ایستا ارجاع دهد (`accessGroup:<name>`). هنگام راه‌اندازی تعاملی، نام‌های واردشده می‌توانند با استفاده از جست‌وجوی مخاطب درون‌فرایندی Plugin به شناسه تبدیل شوند.

اگر یک نام خام در پیکربندی باقی بماند، راه‌اندازی فقط زمانی آن را resolve می‌کند که `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد. بدون این پذیرش صریح، بررسی‌های فرستنده در زمان اجرا فقط بر پایه شناسه هستند و نام‌های خام برای مجوزدهی نادیده گرفته می‌شوند.

تأیید از طریق:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## دسترسی گروهی (اختیاری)

- پیش‌فرض: `channels.zalouser.groupPolicy = "open"` (گروه‌ها مجاز هستند). برای بازنویسی پیش‌فرض وقتی تنظیم نشده است، از `channels.defaults.groupPolicy` استفاده کنید.
- محدود کردن به یک فهرست مجاز با:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (کلیدها باید شناسه‌های پایدار گروه باشند؛ نام‌ها فقط هنگام راه‌اندازی و فقط وقتی `channels.zalouser.dangerouslyAllowNameMatching: true` فعال است به شناسه تبدیل می‌شوند)
  - `channels.zalouser.groupAllowFrom` (کنترل می‌کند کدام فرستنده‌ها در گروه‌های مجاز می‌توانند ربات را فعال کنند؛ می‌توان با `accessGroup:<name>` به گروه‌های دسترسی فرستنده ایستا ارجاع داد)
- مسدود کردن همه گروه‌ها: `channels.zalouser.groupPolicy = "disabled"`.
- جادوگر پیکربندی می‌تواند برای فهرست‌های مجاز گروهی درخواست ورودی کند.
- هنگام راه‌اندازی، OpenClaw نام‌های گروه/کاربر در فهرست‌های مجاز را به شناسه تبدیل می‌کند و نگاشت را فقط وقتی `channels.zalouser.dangerouslyAllowNameMatching: true` فعال است در لاگ ثبت می‌کند.
- تطبیق فهرست مجاز گروهی به‌طور پیش‌فرض فقط بر پایه شناسه است. نام‌های resolveنشده برای احراز مجوز نادیده گرفته می‌شوند مگر اینکه `channels.zalouser.dangerouslyAllowNameMatching: true` فعال باشد.
- `channels.zalouser.dangerouslyAllowNameMatching: true` یک حالت سازگاری اضطراری است که resolve نام‌های قابل‌تغییر در راه‌اندازی و تطبیق نام گروه در زمان اجرا را دوباره فعال می‌کند.
- اگر `groupAllowFrom` تنظیم نشده باشد، زمان اجرا برای بررسی فرستنده گروه به `allowFrom` بازمی‌گردد.
- بررسی‌های فرستنده هم برای پیام‌های گروهی عادی و هم برای دستورهای کنترلی اعمال می‌شوند (برای مثال `/new`، `/reset`).

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

### کنترل فعال‌سازی با منشن گروه

- `channels.zalouser.groups.<group>.requireMention` کنترل می‌کند آیا پاسخ‌های گروهی به منشن نیاز دارند یا نه.
- ترتیب resolve: شناسه/نام دقیق گروه -> slug نرمال‌شده گروه -> `*` -> پیش‌فرض (`true`).
- این هم برای گروه‌های موجود در فهرست مجاز و هم برای حالت گروه باز اعمال می‌شود.
- نقل‌قول کردن یک پیام ربات به‌عنوان منشن ضمنی برای فعال‌سازی گروه حساب می‌شود.
- دستورهای کنترلی مجاز (برای مثال `/new`) می‌توانند کنترل منشن را دور بزنند.
- وقتی یک پیام گروهی به‌دلیل نیاز به منشن رد می‌شود، OpenClaw آن را به‌عنوان تاریخچه گروه در انتظار ذخیره می‌کند و در پیام گروهی پردازش‌شده بعدی آن را شامل می‌کند.
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

## متغیرهای محیطی

Plugin مربوط به Zalo Personal همچنین می‌تواند انتخاب پروفایل را از متغیرهای محیطی بخواند:

- `ZALOUSER_PROFILE`: نام پروفایلی که وقتی هیچ `profile` در پیکربندی کانال یا حساب تنظیم نشده است استفاده می‌شود.
- `ZCA_PROFILE`: نام پروفایل fallback قدیمی، فقط وقتی استفاده می‌شود که `ZALOUSER_PROFILE` تنظیم نشده باشد.

نام‌های پروفایل، اعتبارنامه‌های ورود ذخیره‌شده Zalo را در وضعیت OpenClaw انتخاب می‌کنند. ترتیب resolve چنین است:

1. `profile` صریح در پیکربندی.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. شناسه حساب برای حساب‌های غیرپیش‌فرض، یا `default` برای حساب پیش‌فرض.

برای راه‌اندازی‌های چندحسابی، بهتر است `profile` را روی هر حساب در پیکربندی تنظیم کنید تا
یک متغیر محیطی باعث نشود چند حساب همان نشست ورود مشترک را استفاده کنند.

## تایپ کردن، واکنش‌ها، و تأییدهای تحویل

- OpenClaw پیش از dispatch کردن یک پاسخ، رویداد تایپ کردن ارسال می‌کند (با بهترین تلاش).
- اکشن واکنش پیام `react` برای `zalouser` در اکشن‌های کانال پشتیبانی می‌شود.
  - برای حذف یک ایموجی واکنش مشخص از یک پیام، از `remove: true` استفاده کنید.
  - معناشناسی واکنش: [واکنش‌ها](/fa/tools/reactions)
- برای پیام‌های ورودی که فراداده رویداد دارند، OpenClaw تأییدهای تحویل‌شده + دیده‌شده ارسال می‌کند (با بهترین تلاش).

## عیب‌یابی

**ورود پایدار نمی‌ماند:**

- `openclaw channels status --probe`
- ورود دوباره: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**فهرست مجاز/نام گروه resolve نشد:**

- در `allowFrom`/`groupAllowFrom` از شناسه‌های عددی و در `groups` از شناسه‌های پایدار گروه استفاده کنید. اگر عمداً به نام دقیق دوست/گروه نیاز دارید، `channels.zalouser.dangerouslyAllowNameMatching: true` را فعال کنید.

**از راه‌اندازی قدیمی مبتنی بر CLI ارتقا داده‌اید:**

- هرگونه فرض قدیمی درباره فرایند خارجی `zca` را حذف کنید.
- کانال اکنون به‌طور کامل در OpenClaw و بدون باینری‌های CLI خارجی اجرا می‌شود.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و کنترل فعال‌سازی با منشن
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
