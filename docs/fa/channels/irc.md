---
read_when:
    - می‌خواهید OpenClaw را به کانال‌های IRC یا پیام‌های مستقیم متصل کنید
    - در حال پیکربندی فهرست‌های مجاز IRC، خط‌مشی گروه یا محدودسازی منشن‌ها هستید
summary: راه‌اندازی Plugin IRC، کنترل‌های دسترسی و عیب‌یابی
title: IRC
x-i18n:
    generated_at: "2026-05-06T09:03:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7de49784dec1b6a21a5a65b298552c66ce82543e3f0a7075abedb442b4ebff7e
    source_path: channels/irc.md
    workflow: 16
---

وقتی OpenClaw را در کانال‌های کلاسیک (`#room`) و پیام‌های مستقیم می‌خواهید، از IRC استفاده کنید.
IRC به‌صورت یک Plugin بسته‌بندی‌شده عرضه می‌شود، اما در پیکربندی اصلی زیر `channels.irc` تنظیم می‌شود.

## شروع سریع

1. پیکربندی IRC را در `~/.openclaw/openclaw.json` فعال کنید.
2. حداقل موارد زیر را تنظیم کنید:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

برای هماهنگی بات، یک سرور IRC خصوصی را ترجیح دهید. اگر عمداً از یک شبکهٔ IRC عمومی استفاده می‌کنید، گزینه‌های رایج شامل Libera.Chat، OFTC، و Snoonet هستند. برای ترافیک کانال پشتیبان بات یا swarm، از کانال‌های عمومی قابل‌حدس پرهیز کنید.

3. Gateway را شروع/راه‌اندازی دوباره کنید:

```bash
openclaw gateway run
```

## پیش‌فرض‌های امنیتی

- IRC از سوکت‌های خام TCP/TLS خارج از مسیریابی پراکسی پیشروی مدیریت‌شده توسط اپراتور OpenClaw استفاده می‌کند. در استقرارهایی که همهٔ خروجی‌ها باید از آن پراکسی پیشرو عبور کنند، مگر اینکه خروجی مستقیم IRC صراحتاً تأیید شده باشد، `channels.irc.enabled=false` را تنظیم کنید.
- مقدار پیش‌فرض `channels.irc.dmPolicy` برابر `"pairing"` است.
- مقدار پیش‌فرض `channels.irc.groupPolicy` برابر `"allowlist"` است.
- با `groupPolicy="allowlist"`، برای تعریف کانال‌های مجاز `channels.irc.groups` را تنظیم کنید.
- مگر اینکه عمداً انتقال متن ساده را بپذیرید، از TLS (`channels.irc.tls=true`) استفاده کنید.

## کنترل دسترسی

برای کانال‌های IRC دو «دروازه» جداگانه وجود دارد:

1. **دسترسی کانال** (`groupPolicy` + `groups`): اینکه آیا بات اصلاً پیام‌های یک کانال را می‌پذیرد یا نه.
2. **دسترسی فرستنده** (`groupAllowFrom` / `groups["#channel"].allowFrom` برای هر کانال): چه کسی اجازه دارد بات را درون آن کانال تحریک کند.

کلیدهای پیکربندی:

- فهرست مجاز DM (دسترسی فرستندهٔ DM): `channels.irc.allowFrom`
- فهرست مجاز فرستندهٔ گروه (دسترسی فرستندهٔ کانال): `channels.irc.groupAllowFrom`
- کنترل‌های هر کانال (قواعد کانال + فرستنده + mention): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` کانال‌های پیکربندی‌نشده را مجاز می‌کند (**با این حال به‌صورت پیش‌فرض همچنان mention-gated است**)

ورودی‌های فهرست مجاز باید از هویت‌های پایدار فرستنده (`nick!user@host`) استفاده کنند.
تطبیق nick تنها قابل‌تغییر است و فقط وقتی فعال می‌شود که `channels.irc.dangerouslyAllowNameMatching: true` باشد.

### نکتهٔ رایج: `allowFrom` برای DM است، نه کانال‌ها

اگر لاگ‌هایی مانند این می‌بینید:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...یعنی فرستنده برای پیام‌های **گروه/کانال** مجاز نبوده است. آن را با یکی از این روش‌ها اصلاح کنید:

- تنظیم `channels.irc.groupAllowFrom` (سراسری برای همهٔ کانال‌ها)، یا
- تنظیم فهرست‌های مجاز فرستنده برای هر کانال: `channels.irc.groups["#channel"].allowFrom`

مثال (اجازه دادن به هر کسی در `#tuirc-dev` برای صحبت با بات):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## تحریک پاسخ (mentions)

حتی اگر یک کانال مجاز باشد (از طریق `groupPolicy` + `groups`) و فرستنده هم مجاز باشد، OpenClaw به‌صورت پیش‌فرض در زمینه‌های گروهی از **mention-gating** استفاده می‌کند.

یعنی ممکن است لاگ‌هایی مثل `drop channel … (missing-mention)` ببینید، مگر اینکه پیام شامل الگوی mentionای باشد که با بات مطابقت دارد.

برای اینکه بات در یک کانال IRC **بدون نیاز به mention** پاسخ دهد، mention gating را برای آن کانال غیرفعال کنید:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

یا برای مجاز کردن **همهٔ** کانال‌های IRC (بدون فهرست مجاز برای هر کانال) و همچنان پاسخ دادن بدون mention:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## نکتهٔ امنیتی (توصیه‌شده برای کانال‌های عمومی)

اگر `allowFrom: ["*"]` را در یک کانال عمومی مجاز کنید، هر کسی می‌تواند به بات prompt بدهد.
برای کاهش ریسک، ابزارها را برای آن کانال محدود کنید.

### ابزارهای یکسان برای همهٔ افراد کانال

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### ابزارهای متفاوت برای هر فرستنده (مالک قدرت بیشتری می‌گیرد)

از `toolsBySender` برای اعمال یک سیاست سخت‌گیرانه‌تر به `"*"` و یک سیاست آزادتر به nick خودتان استفاده کنید:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

یادداشت‌ها:

- کلیدهای `toolsBySender` باید برای مقادیر هویت فرستندهٔ IRC از `id:` استفاده کنند:
  `id:eigen` یا `id:eigen!~eigen@174.127.248.171` برای تطبیق قوی‌تر.
- کلیدهای قدیمی بدون پیشوند همچنان پذیرفته می‌شوند و فقط به‌عنوان `id:` تطبیق داده می‌شوند.
- نخستین سیاست فرستندهٔ مطابق برنده می‌شود؛ `"*"` fallback wildcard است.

برای اطلاعات بیشتر دربارهٔ دسترسی گروه در برابر mention-gating (و نحوهٔ تعامل آن‌ها)، ببینید: [/channels/groups](/fa/channels/groups).

## NickServ

برای شناسایی با NickServ پس از اتصال:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

ثبت‌نام یک‌بارهٔ اختیاری هنگام اتصال:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

پس از ثبت nick، `register` را غیرفعال کنید تا از تلاش‌های تکراری REGISTER جلوگیری شود.

## متغیرهای محیطی

حساب پیش‌فرض از این موارد پشتیبانی می‌کند:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (جداشده با کاما)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` را نمی‌توان از یک فایل `.env` فضای کاری تنظیم کرد؛ ببینید [فایل‌های `.env` فضای کاری](/fa/gateway/security).

## عیب‌یابی

- اگر بات وصل می‌شود اما هرگز در کانال‌ها پاسخ نمی‌دهد، `channels.irc.groups` **و** اینکه آیا mention-gating پیام‌ها را حذف می‌کند (`missing-mention`) بررسی کنید. اگر می‌خواهید بدون ping پاسخ دهد، برای کانال `requireMention:false` را تنظیم کنید.
- اگر ورود ناموفق است، در دسترس بودن nick و گذرواژهٔ سرور را بررسی کنید.
- اگر TLS روی یک شبکهٔ سفارشی ناموفق است، host/port و تنظیمات گواهی را بررسی کنید.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و mention gating
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
