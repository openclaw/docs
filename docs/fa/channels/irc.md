---
read_when:
    - می‌خواهید OpenClaw را به کانال‌های IRC یا پیام‌های مستقیم متصل کنید
    - در حال پیکربندی فهرست‌های مجاز IRC، سیاست گروهی یا کنترل منشن هستید
summary: راه‌اندازی Plugin IRC، کنترل‌های دسترسی و عیب‌یابی
title: IRC
x-i18n:
    generated_at: "2026-04-29T22:26:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 16
---

از IRC وقتی استفاده کنید که OpenClaw را در کانال‌های کلاسیک (`#room`) و پیام‌های مستقیم می‌خواهید.
IRC به‌صورت یک Plugin همراه ارائه می‌شود، اما در پیکربندی اصلی زیر `channels.irc` پیکربندی می‌شود.

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

برای هماهنگی بات، یک سرور IRC خصوصی را ترجیح دهید. اگر عمداً از یک شبکه IRC عمومی استفاده می‌کنید، گزینه‌های رایج شامل Libera.Chat، OFTC و Snoonet هستند. از کانال‌های عمومی قابل‌پیش‌بینی برای ترافیک بک‌چنل بات یا swarm پرهیز کنید.

3. Gateway را شروع/بازراه‌اندازی کنید:

```bash
openclaw gateway run
```

## پیش‌فرض‌های امنیتی

- مقدار پیش‌فرض `channels.irc.dmPolicy` برابر `"pairing"` است.
- مقدار پیش‌فرض `channels.irc.groupPolicy` برابر `"allowlist"` است.
- با `groupPolicy="allowlist"`، برای تعریف کانال‌های مجاز `channels.irc.groups` را تنظیم کنید.
- مگر اینکه عمداً انتقال متن ساده را بپذیرید، از TLS (`channels.irc.tls=true`) استفاده کنید.

## کنترل دسترسی

برای کانال‌های IRC دو «دروازه» جداگانه وجود دارد:

1. **دسترسی کانال** (`groupPolicy` + `groups`): اینکه بات اساساً پیام‌های یک کانال را بپذیرد یا نه.
2. **دسترسی فرستنده** (`groupAllowFrom` / `groups["#channel"].allowFrom` در سطح هر کانال): اینکه چه کسی مجاز است بات را در آن کانال فعال کند.

کلیدهای پیکربندی:

- فهرست مجاز DM (دسترسی فرستنده DM): `channels.irc.allowFrom`
- فهرست مجاز فرستنده گروه (دسترسی فرستنده کانال): `channels.irc.groupAllowFrom`
- کنترل‌های هر کانال (قواعد کانال + فرستنده + منشن): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` کانال‌های پیکربندی‌نشده را مجاز می‌کند (**همچنان به‌صورت پیش‌فرض منشن‌محور است**)

ورودی‌های فهرست مجاز باید از هویت‌های پایدار فرستنده (`nick!user@host`) استفاده کنند.
تطبیق nick خام تغییرپذیر است و فقط زمانی فعال می‌شود که `channels.irc.dangerouslyAllowNameMatching: true` باشد.

### نکته رایج: `allowFrom` برای DM است، نه کانال‌ها

اگر لاگ‌هایی مانند این می‌بینید:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…یعنی فرستنده برای پیام‌های **گروه/کانال** مجاز نبوده است. برای رفع آن، یکی از این کارها را انجام دهید:

- تنظیم `channels.irc.groupAllowFrom` (سراسری برای همه کانال‌ها)، یا
- تنظیم فهرست‌های مجاز فرستنده در سطح هر کانال: `channels.irc.groups["#channel"].allowFrom`

نمونه (به همه افراد در `#tuirc-dev` اجازه دهید با بات صحبت کنند):

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

حتی اگر یک کانال مجاز باشد (از طریق `groupPolicy` + `groups`) و فرستنده هم مجاز باشد، OpenClaw به‌صورت پیش‌فرض در زمینه‌های گروهی از **دروازه‌گذاری با منشن** استفاده می‌کند.

یعنی ممکن است لاگ‌هایی مانند `drop channel … (missing-mention)` ببینید، مگر اینکه پیام شامل الگوی منشن مطابق با بات باشد.

برای اینکه بات در یک کانال IRC **بدون نیاز به منشن** پاسخ دهد، دروازه‌گذاری با منشن را برای آن کانال غیرفعال کنید:

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

یا برای مجاز کردن **همه** کانال‌های IRC (بدون فهرست مجاز در سطح هر کانال) و همچنان پاسخ دادن بدون منشن:

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

## نکته امنیتی (توصیه‌شده برای کانال‌های عمومی)

اگر در یک کانال عمومی `allowFrom: ["*"]` را مجاز کنید، هر کسی می‌تواند بات را prompt کند.
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

از `toolsBySender` استفاده کنید تا یک سیاست سخت‌گیرانه‌تر روی `"*"` و یک سیاست آزادتر روی nick خودتان اعمال شود:

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

نکته‌ها:

- کلیدهای `toolsBySender` باید برای مقادیر هویت فرستنده IRC از `id:` استفاده کنند:
  `id:eigen` یا برای تطبیق قوی‌تر `id:eigen!~eigen@174.127.248.171`.
- کلیدهای قدیمی بدون پیشوند هنوز پذیرفته می‌شوند و فقط به‌عنوان `id:` تطبیق داده می‌شوند.
- نخستین سیاست فرستنده‌ای که تطبیق پیدا کند اعمال می‌شود؛ `"*"` fallback wildcard است.

برای اطلاعات بیشتر درباره دسترسی گروه در برابر دروازه‌گذاری با منشن (و نحوه تعامل آن‌ها)، ببینید: [/channels/groups](/fa/channels/groups).

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

پس از ثبت nick، `register` را غیرفعال کنید تا از تلاش‌های مکرر REGISTER جلوگیری شود.

## متغیرهای محیطی

حساب پیش‌فرض از این موارد پشتیبانی می‌کند:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (جداشده با ویرگول)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` را نمی‌توان از یک `.env` در workspace تنظیم کرد؛ [فایل‌های `.env` در Workspace](/fa/gateway/security) را ببینید.

## عیب‌یابی

- اگر بات وصل می‌شود اما هرگز در کانال‌ها پاسخ نمی‌دهد، `channels.irc.groups` **و** اینکه آیا دروازه‌گذاری با منشن پیام‌ها را حذف می‌کند (`missing-mention`) بررسی کنید. اگر می‌خواهید بدون ping پاسخ دهد، برای کانال `requireMention:false` را تنظیم کنید.
- اگر ورود ناموفق است، در دسترس بودن nick و رمز عبور سرور را بررسی کنید.
- اگر TLS در یک شبکه سفارشی ناموفق است، host/port و تنظیمات گواهی را بررسی کنید.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و دروازه‌گذاری با منشن
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
