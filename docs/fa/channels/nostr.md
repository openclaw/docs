---
read_when:
    - می‌خواهید OpenClaw پیام‌های مستقیم را از طریق Nostr دریافت کند
    - در حال راه‌اندازی پیام‌رسانی غیرمتمرکز هستید
summary: کانال DM ‏Nostr از طریق پیام‌های رمزگذاری‌شده NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-29T22:27:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**وضعیت:** Plugin همراه اختیاری (تا زمانی که پیکربندی شود، به‌طور پیش‌فرض غیرفعال است).

Nostr یک پروتکل غیرمتمرکز برای شبکه‌های اجتماعی است. این کانال به OpenClaw امکان می‌دهد پیام‌های مستقیم رمزگذاری‌شده (DM) را از طریق NIP-04 دریافت کند و به آن‌ها پاسخ دهد.

## Plugin همراه

انتشارهای فعلی OpenClaw، Nostr را به‌صورت یک Plugin همراه عرضه می‌کنند، بنابراین بیلدهای بسته‌بندی‌شده معمولی به نصب جداگانه نیاز ندارند.

### نصب‌های قدیمی‌تر/سفارشی

- فرایند راه‌اندازی (`openclaw onboard`) و `openclaw channels add` همچنان Nostr را از کاتالوگ کانال مشترک نمایش می‌دهند.
- اگر بیلد شما Nostr همراه را شامل نمی‌شود، وقتی یک بسته npm فعلی منتشر شد آن را نصب کنید.

```bash
openclaw plugins install @openclaw/nostr
```

اگر npm بسته متعلق به OpenClaw را منسوخ گزارش کرد، تا زمان انتشار یک بسته npm جدیدتر، از یک بیلد بسته‌بندی‌شده فعلی OpenClaw یا یک checkout محلی استفاده کنید.

از یک checkout محلی استفاده کنید (گردش‌کارهای توسعه):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

پس از نصب یا فعال‌سازی Pluginها، Gateway را راه‌اندازی مجدد کنید.

### راه‌اندازی غیرتعاملی

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

برای نگه داشتن `NOSTR_PRIVATE_KEY` در محیط به‌جای ذخیره کردن کلید در پیکربندی، از `--use-env` استفاده کنید.

## راه‌اندازی سریع

1. یک جفت‌کلید Nostr تولید کنید (در صورت نیاز):

```bash
# Using nak
nak key generate
```

2. به پیکربندی اضافه کنید:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. کلید را صادر کنید:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Gateway را راه‌اندازی مجدد کنید.

## مرجع پیکربندی

| کلید         | نوع      | پیش‌فرض                                    | توضیح                                 |
| ------------ | -------- | ------------------------------------------ | ------------------------------------- |
| `privateKey` | string   | الزامی                                     | کلید خصوصی در قالب `nsec` یا hex      |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | نشانی‌های Relay (WebSocket)           |
| `dmPolicy`   | string   | `pairing`                                  | سیاست دسترسی DM                       |
| `allowFrom`  | string[] | `[]`                                       | کلیدهای عمومی فرستنده مجاز            |
| `enabled`    | boolean  | `true`                                     | فعال/غیرفعال کردن کانال               |
| `name`       | string   | -                                          | نام نمایشی                            |
| `profile`    | object   | -                                          | فراداده پروفایل NIP-01                |

## فراداده پروفایل

داده‌های پروفایل به‌صورت یک رویداد NIP-01 با `kind:0` منتشر می‌شوند. می‌توانید آن را از رابط کاربری کنترل (Channels -> Nostr -> Profile) مدیریت کنید یا مستقیماً در پیکربندی تنظیم کنید.

مثال:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

نکته‌ها:

- URLهای پروفایل باید از `https://` استفاده کنند.
- وارد کردن از relayها فیلدها را ادغام می‌کند و بازنویسی‌های محلی را حفظ می‌کند.

## کنترل دسترسی

### سیاست‌های DM

- **pairing** (پیش‌فرض): فرستنده‌های ناشناس یک کد جفت‌سازی دریافت می‌کنند.
- **allowlist**: فقط کلیدهای عمومی موجود در `allowFrom` می‌توانند DM ارسال کنند.
- **open**: DMهای ورودی عمومی (به `allowFrom: ["*"]` نیاز دارد).
- **disabled**: DMهای ورودی را نادیده بگیر.

نکته‌های اعمال سیاست:

- امضاهای رویداد ورودی پیش از سیاست فرستنده و رمزگشایی NIP-04 تأیید می‌شوند، بنابراین رویدادهای جعلی زود رد می‌شوند.
- پاسخ‌های جفت‌سازی بدون پردازش بدنه DM اصلی ارسال می‌شوند.
- DMهای ورودی محدودسازی نرخ می‌شوند و payloadهای بیش‌ازحد بزرگ پیش از رمزگشایی کنار گذاشته می‌شوند.

### مثال allowlist

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## قالب‌های کلید

قالب‌های پذیرفته‌شده:

- **کلید خصوصی:** `nsec...` یا hex با ۶۴ نویسه
- **کلیدهای عمومی (`allowFrom`):** `npub...` یا hex

## Relayها

پیش‌فرض‌ها: `relay.damus.io` و `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

نکته‌ها:

- برای افزونگی از ۲ تا ۳ relay استفاده کنید.
- از relayهای بیش‌ازحد زیاد پرهیز کنید (تأخیر، تکرار).
- relayهای پولی می‌توانند قابلیت اطمینان را بهبود دهند.
- relayهای محلی برای آزمایش مناسب هستند (`ws://localhost:7777`).

## پشتیبانی پروتکل

| NIP    | وضعیت       | توضیح                                  |
| ------ | ----------- | -------------------------------------- |
| NIP-01 | پشتیبانی‌شده | قالب پایه رویداد + فراداده پروفایل     |
| NIP-04 | پشتیبانی‌شده | DMهای رمزگذاری‌شده (`kind:4`)          |
| NIP-17 | برنامه‌ریزی‌شده | DMهای gift-wrapped                     |
| NIP-44 | برنامه‌ریزی‌شده | رمزگذاری نسخه‌دار                      |

## آزمایش

### Relay محلی

```bash
# Start strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### آزمایش دستی

1. کلید عمومی ربات (npub) را از لاگ‌ها یادداشت کنید.
2. یک کلاینت Nostr باز کنید (Damus، Amethyst، و غیره).
3. به کلید عمومی ربات DM ارسال کنید.
4. پاسخ را تأیید کنید.

## عیب‌یابی

### پیام‌ها دریافت نمی‌شوند

- اعتبار کلید خصوصی را بررسی کنید.
- مطمئن شوید URLهای relay در دسترس هستند و از `wss://` استفاده می‌کنند (یا برای حالت محلی از `ws://`).
- تأیید کنید `enabled` مقدار `false` ندارد.
- لاگ‌های Gateway را برای خطاهای اتصال relay بررسی کنید.

### پاسخ‌ها ارسال نمی‌شوند

- بررسی کنید relay نوشتن را می‌پذیرد.
- اتصال خروجی را تأیید کنید.
- محدودیت‌های نرخ relay را زیر نظر بگیرید.

### پاسخ‌های تکراری

- هنگام استفاده از چند relay مورد انتظار است.
- پیام‌ها بر اساس شناسه رویداد deduplicate می‌شوند؛ فقط اولین تحویل باعث ایجاد پاسخ می‌شود.

## امنیت

- هرگز کلیدهای خصوصی را commit نکنید.
- برای کلیدها از متغیرهای محیطی استفاده کنید.
- برای ربات‌های تولید، `allowlist` را در نظر بگیرید.
- امضاها پیش از سیاست فرستنده تأیید می‌شوند، و سیاست فرستنده پیش از رمزگشایی اعمال می‌شود، بنابراین رویدادهای جعلی زود رد می‌شوند و فرستنده‌های ناشناس نمی‌توانند کار کامل رمزنگاری را تحمیل کنند.

## محدودیت‌ها (MVP)

- فقط پیام‌های مستقیم (بدون چت گروهی).
- بدون پیوست رسانه.
- فقط NIP-04 (gift-wrap در NIP-17 برنامه‌ریزی شده است).

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و دروازه‌گذاری mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
