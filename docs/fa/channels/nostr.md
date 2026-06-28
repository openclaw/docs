---
read_when:
    - می‌خواهید OpenClaw پیام‌های مستقیم را از طریق Nostr دریافت کند
    - در حال راه‌اندازی پیام‌رسانی غیرمتمرکز هستید
summary: کانال پیام مستقیم Nostr از طریق پیام‌های رمزگذاری‌شده NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-05-02T22:16:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6158c22c0ffc5aea56d0ac2b68955f30c3a785013dba5410cbd70f9b689dc3c
    source_path: channels/nostr.md
    workflow: 16
    postprocess_version: locale-links-v1
---

**وضعیت:** Plugin همراه اختیاری (تا زمان پیکربندی، به‌طور پیش‌فرض غیرفعال است).

Nostr یک پروتکل غیرمتمرکز برای شبکه‌های اجتماعی است. این کانال به OpenClaw امکان می‌دهد پیام‌های مستقیم رمزگذاری‌شده (DMها) را از طریق NIP-04 دریافت کند و به آن‌ها پاسخ دهد.

## Plugin همراه

نسخه‌های فعلی OpenClaw، Nostr را به‌عنوان یک Plugin همراه ارائه می‌کنند، بنابراین ساخت‌های بسته‌بندی‌شده معمولی به نصب جداگانه نیاز ندارند.

### نصب‌های قدیمی‌تر/سفارشی

- Onboarding (`openclaw onboard`) و `openclaw channels add` همچنان Nostr را از کاتالوگ کانال مشترک نمایش می‌دهند.
- اگر ساخت شما Nostr همراه را حذف کرده است، بسته npm را مستقیم نصب کنید.

```bash
openclaw plugins install @openclaw/nostr
```

از بسته ساده استفاده کنید تا برچسب انتشار رسمی فعلی را دنبال کنید. فقط زمانی نسخه دقیق را پین کنید که به نصب بازتولیدپذیر نیاز دارید.

از checkout محلی استفاده کنید (جریان‌های کاری توسعه):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

پس از نصب یا فعال‌سازی Pluginها، Gateway را راه‌اندازی مجدد کنید.

### راه‌اندازی غیرتعاملی

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

از `--use-env` استفاده کنید تا `NOSTR_PRIVATE_KEY` به‌جای ذخیره‌شدن کلید در پیکربندی، در محیط باقی بماند.

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

| کلید         | نوع      | پیش‌فرض                                    | توضیح                                |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | الزامی                                     | کلید خصوصی در قالب `nsec` یا hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URLهای رله (WebSocket)              |
| `dmPolicy`   | string   | `pairing`                                   | سیاست دسترسی DM                    |
| `allowFrom`  | string[] | `[]`                                        | pubkeyهای فرستنده مجاز              |
| `enabled`    | boolean  | `true`                                      | فعال/غیرفعال کردن کانال             |
| `name`       | string   | -                                           | نام نمایشی                          |
| `profile`    | object   | -                                           | فراداده پروفایل NIP-01             |

## فراداده پروفایل

داده‌های پروفایل به‌عنوان یک رویداد NIP-01 با `kind:0` منتشر می‌شوند. می‌توانید آن را از Control UI (Channels -> Nostr -> Profile) مدیریت کنید یا مستقیم در پیکربندی تنظیم کنید.

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
- وارد کردن از رله‌ها، فیلدها را ادغام می‌کند و بازنویسی‌های محلی را حفظ می‌کند.

## کنترل دسترسی

### سیاست‌های DM

- **pairing** (پیش‌فرض): فرستندگان ناشناس یک کد pairing دریافت می‌کنند.
- **allowlist**: فقط pubkeyهای موجود در `allowFrom` می‌توانند DM ارسال کنند.
- **open**: DMهای ورودی عمومی (نیازمند `allowFrom: ["*"]`).
- **disabled**: DMهای ورودی نادیده گرفته می‌شوند.

نکته‌های اعمال سیاست:

- امضاهای رویدادهای ورودی پیش از سیاست فرستنده و رمزگشایی NIP-04 تأیید می‌شوند، بنابراین رویدادهای جعلی زود رد می‌شوند.
- پاسخ‌های pairing بدون پردازش بدنه DM اصلی ارسال می‌شوند.
- DMهای ورودی محدودیت نرخ دارند و payloadهای بیش‌ازحد بزرگ پیش از رمزگشایی کنار گذاشته می‌شوند.

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

- **کلید خصوصی:** `nsec...` یا hex با 64 نویسه
- **Pubkeyها (`allowFrom`):** `npub...` یا hex

## رله‌ها

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

- برای افزونگی از 2 تا 3 رله استفاده کنید.
- از تعداد زیاد رله پرهیز کنید (تأخیر، تکرار).
- رله‌های پولی می‌توانند قابلیت اطمینان را بهتر کنند.
- رله‌های محلی برای آزمایش مناسب هستند (`ws://localhost:7777`).

## پشتیبانی پروتکل

| NIP    | وضعیت     | توضیح                                  |
| ------ | --------- | ------------------------------------- |
| NIP-01 | پشتیبانی می‌شود | قالب پایه رویداد + فراداده پروفایل |
| NIP-04 | پشتیبانی می‌شود | DMهای رمزگذاری‌شده (`kind:4`)        |
| NIP-17 | برنامه‌ریزی‌شده | DMهای gift-wrapped                    |
| NIP-44 | برنامه‌ریزی‌شده | رمزگذاری نسخه‌دار                     |

## آزمایش

### رله محلی

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

1. pubkey ربات (npub) را از لاگ‌ها یادداشت کنید.
2. یک کلاینت Nostr باز کنید (Damus، Amethyst و غیره).
3. به pubkey ربات DM بفرستید.
4. پاسخ را تأیید کنید.

## عیب‌یابی

### پیام‌ها دریافت نمی‌شوند

- تأیید کنید کلید خصوصی معتبر است.
- مطمئن شوید URLهای رله در دسترس هستند و از `wss://` استفاده می‌کنند (یا برای محلی از `ws://`).
- تأیید کنید `enabled` برابر `false` نیست.
- لاگ‌های Gateway را برای خطاهای اتصال رله بررسی کنید.

### پاسخ‌ها ارسال نمی‌شوند

- بررسی کنید رله نوشتن را می‌پذیرد.
- اتصال خروجی را تأیید کنید.
- مراقب محدودیت‌های نرخ رله باشید.

### پاسخ‌های تکراری

- هنگام استفاده از چند رله مورد انتظار است.
- پیام‌ها بر اساس شناسه رویداد حذف تکراری می‌شوند؛ فقط اولین تحویل، پاسخ را فعال می‌کند.

## امنیت

- هرگز کلیدهای خصوصی را commit نکنید.
- برای کلیدها از متغیرهای محیطی استفاده کنید.
- برای ربات‌های تولید، `allowlist` را در نظر بگیرید.
- امضاها پیش از سیاست فرستنده تأیید می‌شوند و سیاست فرستنده پیش از رمزگشایی اعمال می‌شود، بنابراین رویدادهای جعلی زود رد می‌شوند و فرستندگان ناشناس نمی‌توانند کار کامل رمزنگاری را تحمیل کنند.

## محدودیت‌ها (MVP)

- فقط پیام‌های مستقیم (بدون چت گروهی).
- بدون پیوست رسانه‌ای.
- فقط NIP-04 (gift-wrap در NIP-17 برنامه‌ریزی شده است).

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و gating اشاره‌ها
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
