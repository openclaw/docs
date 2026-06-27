---
read_when:
    - می‌خواهید OpenClaw را به کانال‌ها یا پیام‌های مستقیم IRC وصل کنید
    - در حال پیکربندی allowlistهای IRC، خط‌مشی گروه، یا کنترل اشاره هستید
summary: راه‌اندازی Plugin IRC، کنترل‌های دسترسی و عیب‌یابی
title: IRC
x-i18n:
    generated_at: "2026-06-27T17:11:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

از IRC زمانی استفاده کنید که OpenClaw را در کانال‌های کلاسیک (`#room`) و پیام‌های مستقیم می‌خواهید.
Plugin رسمی IRC را نصب کنید، سپس آن را زیر `channels.irc` پیکربندی کنید.

## شروع سریع

1. Plugin را نصب کنید:

```bash
openclaw plugins install @openclaw/irc
```

2. پیکربندی IRC را در `~/.openclaw/openclaw.json` فعال کنید.
3. دست‌کم این موارد را تنظیم کنید:

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

برای هماهنگی ربات، یک سرور IRC خصوصی را ترجیح دهید. اگر عمداً از یک شبکه IRC عمومی استفاده می‌کنید، گزینه‌های رایج شامل Libera.Chat، OFTC و Snoonet هستند. برای ترافیک کانال پشتی ربات یا دسته، از کانال‌های عمومی قابل پیش‌بینی پرهیز کنید.

4. Gateway را شروع/بازراه‌اندازی کنید:

```bash
openclaw gateway run
```

## پیش‌فرض‌های امنیتی

- IRC از سوکت‌های خام TCP/TLS بیرون از مسیریابی پروکسی روبه‌جلوی مدیریت‌شده توسط عملگر OpenClaw استفاده می‌کند. در استقرارهایی که لازم است همه خروجی‌ها از آن پروکسی روبه‌جلو عبور کنند، مگر اینکه خروجی مستقیم IRC صراحتاً تأیید شده باشد، `channels.irc.enabled=false` را تنظیم کنید.
- `channels.irc.dmPolicy` به‌طور پیش‌فرض `"pairing"` است.
- `channels.irc.groupPolicy` به‌طور پیش‌فرض `"allowlist"` است.
- با `groupPolicy="allowlist"`، برای تعریف کانال‌های مجاز `channels.irc.groups` را تنظیم کنید.
- از TLS (`channels.irc.tls=true`) استفاده کنید، مگر اینکه عمداً انتقال متن ساده را بپذیرید.

## کنترل دسترسی

برای کانال‌های IRC دو «دروازه» جداگانه وجود دارد:

1. **دسترسی کانال** (`groupPolicy` + `groups`): اینکه ربات اساساً پیام‌ها را از یک کانال می‌پذیرد یا نه.
2. **دسترسی فرستنده** (`groupAllowFrom` / در هر کانال `groups["#channel"].allowFrom`): چه کسی مجاز است ربات را درون آن کانال فعال کند.

کلیدهای پیکربندی:

- فهرست مجاز DM (دسترسی فرستنده DM): `channels.irc.allowFrom`
- فهرست مجاز فرستنده گروه (دسترسی فرستنده کانال): `channels.irc.groupAllowFrom`
- کنترل‌های هر کانال (قوانین کانال + فرستنده + اشاره): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` کانال‌های پیکربندی‌نشده را مجاز می‌کند (**همچنان به‌طور پیش‌فرض پشت دروازه اشاره است**)

ورودی‌های فهرست مجاز باید از هویت‌های پایدار فرستنده (`nick!user@host`) استفاده کنند.
تطبیق نام مستعار خام تغییرپذیر است و فقط وقتی فعال می‌شود که `channels.irc.dangerouslyAllowNameMatching: true` باشد.

### دام رایج: `allowFrom` برای DMها است، نه کانال‌ها

اگر لاگ‌هایی مانند این می‌بینید:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...یعنی فرستنده برای پیام‌های **گروه/کانال** مجاز نبوده است. آن را با یکی از این روش‌ها اصلاح کنید:

- تنظیم `channels.irc.groupAllowFrom` (سراسری برای همه کانال‌ها)، یا
- تنظیم فهرست‌های مجاز فرستنده در هر کانال: `channels.irc.groups["#channel"].allowFrom`

مثال (اجازه دادن به هر کسی در `#tuirc-dev` برای صحبت با ربات):

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

## فعال‌سازی پاسخ (اشاره‌ها)

حتی اگر یک کانال مجاز باشد (از طریق `groupPolicy` + `groups`) و فرستنده هم مجاز باشد، OpenClaw در زمینه‌های گروهی به‌طور پیش‌فرض از **دروازه اشاره** استفاده می‌کند.

یعنی ممکن است لاگ‌هایی مانند `drop channel … (missing-mention)` ببینید، مگر اینکه پیام شامل الگوی اشاره‌ای باشد که با ربات مطابقت دارد.

برای اینکه ربات در یک کانال IRC **بدون نیاز به اشاره** پاسخ دهد، دروازه اشاره را برای آن کانال غیرفعال کنید:

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

یا برای مجاز کردن **همه** کانال‌های IRC (بدون فهرست مجاز هر کانال) و همچنان پاسخ دادن بدون اشاره:

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

اگر در یک کانال عمومی `allowFrom: ["*"]` را مجاز کنید، هر کسی می‌تواند به ربات اعلان بدهد.
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

از `toolsBySender` استفاده کنید تا یک سیاست سخت‌گیرانه‌تر برای `"*"` و یک سیاست آسان‌گیرانه‌تر برای نام مستعار خودتان اعمال شود:

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

نکات:

- کلیدهای `toolsBySender` باید برای مقادیر هویت فرستنده IRC از `id:` استفاده کنند:
  `id:eigen` یا برای تطبیق قوی‌تر `id:eigen!~eigen@174.127.248.171`.
- کلیدهای قدیمی بدون پیشوند همچنان پذیرفته می‌شوند و فقط به‌عنوان `id:` تطبیق داده می‌شوند.
- اولین سیاست فرستنده‌ای که مطابقت کند برنده است؛ `"*"` جایگزین wildcard است.

برای اطلاعات بیشتر درباره دسترسی گروهی در برابر دروازه اشاره (و نحوه تعامل آن‌ها)، ببینید: [/channels/groups](/fa/channels/groups).

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

ثبت‌نام اختیاری یک‌باره هنگام اتصال:

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

پس از ثبت شدن نام مستعار، `register` را غیرفعال کنید تا از تلاش‌های تکراری REGISTER جلوگیری شود.

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

`IRC_HOST` را نمی‌توان از یک `.env` فضای کاری تنظیم کرد؛ [فایل‌های `.env` فضای کاری](/fa/gateway/security) را ببینید.

## عیب‌یابی

- اگر ربات وصل می‌شود اما هرگز در کانال‌ها پاسخ نمی‌دهد، `channels.irc.groups` **و** اینکه آیا دروازه اشاره پیام‌ها را حذف می‌کند (`missing-mention`) بررسی کنید. اگر می‌خواهید بدون پینگ پاسخ دهد، برای کانال `requireMention:false` را تنظیم کنید.
- اگر ورود ناموفق است، در دسترس بودن نام مستعار و گذرواژه سرور را بررسی کنید.
- اگر TLS در یک شبکه سفارشی ناموفق است، میزبان/درگاه و تنظیمات گواهی را بررسی کنید.

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت DM و جریان جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفت‌وگوی گروهی و دروازه اشاره
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
