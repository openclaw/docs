---
read_when:
    - می‌خواهید OpenClaw را به کانال‌های IRC یا پیام‌های مستقیم وصل کنید
    - در حال پیکربندی فهرست‌های مجاز IRC، سیاست گروهی، یا محدودسازی منشن هستید
summary: راه‌اندازی Plugin IRC، کنترل‌های دسترسی و عیب‌یابی
title: IRC
x-i18n:
    generated_at: "2026-05-04T02:21:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43c3098fe49a5e7405443df73e1bf752a579460dc0b2070c3d07f43b512bb555
    source_path: channels/irc.md
    workflow: 16
---

از IRC زمانی استفاده کنید که OpenClaw را در کانال‌های کلاسیک (`#room`) و پیام‌های مستقیم می‌خواهید.
IRC به‌صورت یک Plugin همراه ارائه می‌شود، اما در پیکربندی اصلی زیر `channels.irc` تنظیم می‌شود.

## شروع سریع

1. پیکربندی IRC را در `~/.openclaw/openclaw.json` فعال کنید.
2. دست‌کم این موارد را تنظیم کنید:

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

برای هماهنگی ربات، یک سرور IRC خصوصی را ترجیح دهید. اگر عمدا از یک شبکه IRC عمومی استفاده می‌کنید، گزینه‌های رایج شامل Libera.Chat، OFTC و Snoonet هستند. از کانال‌های عمومی قابل حدس برای ترافیک کانال پشتی ربات یا ازدحام خودداری کنید.

3. Gateway را شروع/راه‌اندازی دوباره کنید:

```bash
openclaw gateway run
```

## پیش‌فرض‌های امنیتی

- IRC از سوکت‌های TCP/TLS خام بیرون از مسیریابی پراکسی رو به جلوی مدیریت‌شده توسط اپراتور OpenClaw استفاده می‌کند. در استقرارهایی که نیاز دارند همه خروجی‌ها از طریق آن پراکسی رو به جلو عبور کنند، `channels.irc.enabled=false` را تنظیم کنید، مگر اینکه خروجی مستقیم IRC صریحا تأیید شده باشد.
- مقدار پیش‌فرض `channels.irc.dmPolicy` برابر `"pairing"` است.
- مقدار پیش‌فرض `channels.irc.groupPolicy` برابر `"allowlist"` است.
- با `groupPolicy="allowlist"`، برای تعریف کانال‌های مجاز `channels.irc.groups` را تنظیم کنید.
- از TLS (`channels.irc.tls=true`) استفاده کنید، مگر اینکه عمدا انتقال متن ساده را بپذیرید.

## کنترل دسترسی

برای کانال‌های IRC دو «دروازه» جداگانه وجود دارد:

1. **دسترسی کانال** (`groupPolicy` + `groups`): اینکه ربات اصلا پیام‌ها را از یک کانال بپذیرد یا نه.
2. **دسترسی فرستنده** (`groupAllowFrom` / `groups["#channel"].allowFrom` برای هر کانال): چه کسی اجازه دارد ربات را داخل آن کانال فعال کند.

کلیدهای پیکربندی:

- فهرست مجاز پیام مستقیم (دسترسی فرستنده پیام مستقیم): `channels.irc.allowFrom`
- فهرست مجاز فرستنده گروه (دسترسی فرستنده کانال): `channels.irc.groupAllowFrom`
- کنترل‌های هر کانال (قواعد کانال + فرستنده + منشن): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` کانال‌های پیکربندی‌نشده را مجاز می‌کند (**همچنان به‌صورت پیش‌فرض نیازمند منشن است**)

ورودی‌های فهرست مجاز باید از هویت‌های پایدار فرستنده (`nick!user@host`) استفاده کنند.
تطبیق nick ساده تغییرپذیر است و فقط زمانی فعال می‌شود که `channels.irc.dangerouslyAllowNameMatching: true` باشد.

### اشتباه رایج: `allowFrom` برای پیام‌های مستقیم است، نه کانال‌ها

اگر لاگ‌هایی مانند این می‌بینید:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...یعنی فرستنده برای پیام‌های **گروه/کانال** مجاز نبوده است. با یکی از روش‌های زیر آن را اصلاح کنید:

- تنظیم `channels.irc.groupAllowFrom` (سراسری برای همه کانال‌ها)، یا
- تنظیم فهرست‌های مجاز فرستنده برای هر کانال: `channels.irc.groups["#channel"].allowFrom`

مثال (اجازه دادن به همه افراد در `#tuirc-dev` برای صحبت با ربات):

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

## فعال‌سازی پاسخ (منشن‌ها)

حتی اگر یک کانال مجاز باشد (از طریق `groupPolicy` + `groups`) و فرستنده نیز مجاز باشد، OpenClaw در زمینه‌های گروهی به‌صورت پیش‌فرض از **دروازه‌گذاری بر اساس منشن** استفاده می‌کند.

یعنی ممکن است لاگ‌هایی مانند `drop channel … (missing-mention)` ببینید، مگر اینکه پیام شامل الگوی منشنی باشد که با ربات مطابقت دارد.

برای اینکه ربات در یک کانال IRC **بدون نیاز به منشن** پاسخ دهد، دروازه‌گذاری منشن را برای آن کانال غیرفعال کنید:

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

یا برای مجاز کردن **همه** کانال‌های IRC (بدون فهرست مجاز برای هر کانال) و همچنان پاسخ دادن بدون منشن:

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

## یادداشت امنیتی (توصیه‌شده برای کانال‌های عمومی)

اگر `allowFrom: ["*"]` را در یک کانال عمومی مجاز کنید، هر کسی می‌تواند به ربات دستور بدهد.
برای کاهش ریسک، ابزارها را برای آن کانال محدود کنید.

### ابزارهای یکسان برای همه افراد کانال

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

از `toolsBySender` استفاده کنید تا یک سیاست سخت‌گیرانه‌تر را برای `"*"` و یک سیاست آزادتر را برای nick خودتان اعمال کنید:

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

- کلیدهای `toolsBySender` باید برای مقدارهای هویت فرستنده IRC از `id:` استفاده کنند:
  `id:eigen` یا `id:eigen!~eigen@174.127.248.171` برای تطبیق قوی‌تر.
- کلیدهای قدیمی بدون پیشوند هنوز پذیرفته می‌شوند و فقط به‌عنوان `id:` تطبیق داده می‌شوند.
- نخستین سیاست فرستنده منطبق اعمال می‌شود؛ `"*"` جایگزین عام است.

برای اطلاعات بیشتر درباره دسترسی گروه در برابر دروازه‌گذاری منشن (و نحوه تعامل آن‌ها)، ببینید: [/channels/groups](/fa/channels/groups).

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

ثبت‌نام یک‌باره اختیاری هنگام اتصال:

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

پس از ثبت nick، `register` را غیرفعال کنید تا از تلاش‌های REGISTER تکراری جلوگیری شود.

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

`IRC_HOST` را نمی‌توان از یک فایل `.env` در workspace تنظیم کرد؛ ببینید [فایل‌های `.env` در workspace](/fa/gateway/security).

## عیب‌یابی

- اگر ربات وصل می‌شود اما هرگز در کانال‌ها پاسخ نمی‌دهد، `channels.irc.groups` **و** اینکه آیا دروازه‌گذاری منشن پیام‌ها را حذف می‌کند یا نه (`missing-mention`) را بررسی کنید. اگر می‌خواهید بدون ping پاسخ دهد، برای کانال `requireMention:false` را تنظیم کنید.
- اگر ورود ناموفق است، دردسترس‌بودن nick و گذرواژه سرور را بررسی کنید.
- اگر TLS در یک شبکه سفارشی ناموفق است، میزبان/درگاه و تنظیمات گواهی را بررسی کنید.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت پیام مستقیم و جریان Pairing
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و دروازه‌گذاری منشن
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی session برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
