---
read_when:
    - می‌خواهید OpenClaw را به QQ متصل کنید
    - به راه‌اندازی اعتبارنامه‌های QQ Bot نیاز دارید
    - به پشتیبانی از چت گروهی یا خصوصی QQ Bot نیاز دارید
summary: راه‌اندازی، پیکربندی و استفاده از QQ Bot
title: ربات QQ
x-i18n:
    generated_at: "2026-05-02T11:36:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d37dd5846ecf07b1e3e8729faa23877780abdd40577b8dab61ea1ac9399885a
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot از طریق API رسمی QQ Bot (Gateway مبتنی بر WebSocket) به OpenClaw متصل می‌شود. این
Plugin از چت خصوصی C2C، پیام‌های @ گروهی، و پیام‌های کانال guild همراه با
رسانه‌های غنی (تصاویر، صدا، ویدیو، فایل‌ها) پشتیبانی می‌کند.

وضعیت: Plugin قابل دانلود. پیام‌های مستقیم، چت‌های گروهی، کانال‌های guild، و
رسانه پشتیبانی می‌شوند. واکنش‌ها و threadها پشتیبانی نمی‌شوند.

## نصب

پیش از راه‌اندازی، QQ Bot را نصب کنید:

```bash
openclaw plugins install @openclaw/qqbot
```

## راه‌اندازی

1. به [QQ Open Platform](https://q.qq.com/) بروید و برای ثبت‌نام / ورود، کد QR را با
   QQ روی تلفن خود اسکن کنید.
2. برای ساخت یک bot جدید QQ روی **Create Bot** کلیک کنید.
3. **AppID** و **AppSecret** را در صفحه تنظیمات bot پیدا کنید و آن‌ها را کپی کنید.

> AppSecret به‌صورت متن ساده ذخیره نمی‌شود — اگر بدون ذخیره کردن از صفحه خارج شوید،
> باید یک مورد جدید بازتولید کنید.

4. کانال را اضافه کنید:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway را راه‌اندازی مجدد کنید.

مسیرهای راه‌اندازی تعاملی:

```bash
openclaw channels add
openclaw configure --section channels
```

## پیکربندی

پیکربندی حداقلی:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

متغیرهای محیطی حساب پیش‌فرض:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret مبتنی بر فایل:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

یادداشت‌ها:

- fallback محیط فقط برای حساب پیش‌فرض QQ Bot اعمال می‌شود.
- `openclaw channels add --channel qqbot --token-file ...` فقط
  AppSecret را فراهم می‌کند؛ AppID باید از قبل در پیکربندی یا `QQBOT_APP_ID` تنظیم شده باشد.
- `clientSecret` علاوه بر رشته متن ساده، ورودی SecretRef را نیز می‌پذیرد.

### راه‌اندازی چندحسابی

چند QQ bot را زیر یک نمونه OpenClaw اجرا کنید:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

هر حساب اتصال WebSocket خودش را راه‌اندازی می‌کند و یک کش token مستقل
(ایزوله‌شده بر اساس `appId`) نگه می‌دارد.

یک bot دوم را از طریق CLI اضافه کنید:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### چت‌های گروهی

پشتیبانی چت گروهی QQ Bot از OpenIDهای گروه QQ استفاده می‌کند، نه نام‌های نمایشی. bot را
به یک گروه اضافه کنید، سپس آن را mention کنید یا گروه را طوری پیکربندی کنید که بدون mention اجرا شود.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` پیش‌فرض‌ها را برای همه گروه‌ها تنظیم می‌کند، و یک ورودی مشخص
`groups.GROUP_OPENID` این پیش‌فرض‌ها را برای یک گروه بازنویسی می‌کند. تنظیمات گروه
شامل موارد زیر است:

- `requireMention`: پیش از پاسخ bot به یک @mention نیاز دارد. پیش‌فرض: `true`.
- `ignoreOtherMentions`: پیام‌هایی را که فرد دیگری را mention می‌کنند اما bot را نه، حذف می‌کند.
- `historyLimit`: پیام‌های اخیر گروهی بدون mention را به‌عنوان زمینه برای نوبت mention بعدی نگه می‌دارد. برای غیرفعال‌سازی، `0` تنظیم کنید.
- `toolPolicy`: `full`، `restricted`، یا `none` برای ابزارهای محدود به گروه.
- `name`: برچسب خوانا که در logها و زمینه گروه استفاده می‌شود.
- `prompt`: prompt رفتاری مختص هر گروه که به زمینه عامل افزوده می‌شود.

حالت‌های فعال‌سازی `mention` و `always` هستند. `requireMention: true` به
`mention` نگاشت می‌شود؛ `requireMention: false` به `always` نگاشت می‌شود. بازنویسی فعال‌سازی
در سطح نشست، در صورت وجود، بر پیکربندی اولویت دارد.

صف ورودی برای هر peer جداگانه است. peerهای گروهی سقف صف بزرگ‌تری دارند، هنگام پر بودن
پیام‌های انسانی را جلوتر از گفت‌وگوهای نوشته‌شده توسط bot نگه می‌دارند، و burstهای پیام‌های عادی
گروه را در یک نوبت منتسب‌شده ادغام می‌کنند. دستورهای slash همچنان یکی‌یکی اجرا می‌شوند.

### صدا (STT / TTS)

پشتیبانی STT و TTS از پیکربندی دو سطحی با fallback اولویت‌دار استفاده می‌کند:

| تنظیم | مختص Plugin                                             | fallback چارچوب              |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        qq-main: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

برای غیرفعال‌سازی هرکدام، `enabled: false` را تنظیم کنید.
بازنویسی‌های TTS در سطح حساب، همان ساختار `messages.tts` را دارند و روی پیکربندی
TTS کانال/سراسری deep-merge می‌شوند.

پیوست‌های صوتی ورودی QQ به‌عنوان فراداده رسانه صوتی در اختیار عامل‌ها قرار می‌گیرند، در حالی که
فایل‌های صوتی خام از `MediaPaths` عمومی بیرون نگه داشته می‌شوند. پاسخ‌های متنی ساده
`[[audio_as_voice]]` در صورت پیکربندی TTS، TTS را سنتز می‌کنند و یک پیام صوتی بومی QQ می‌فرستند.

رفتار بارگذاری/ترنسکد صوت خروجی را نیز می‌توان با
`channels.qqbot.audioFormatPolicy` تنظیم کرد:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## قالب‌های مقصد

| قالب                      | توضیح              |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | چت خصوصی (C2C)    |
| `qqbot:group:GROUP_OPENID` | چت گروهی          |
| `qqbot:channel:CHANNEL_ID` | کانال guild        |

> هر bot مجموعه OpenIDهای کاربری خودش را دارد. OpenID دریافت‌شده توسط Bot A **نمی‌تواند**
> برای ارسال پیام‌ها از طریق Bot B استفاده شود.

## دستورهای slash

دستورهای داخلی که پیش از صف هوش مصنوعی رهگیری می‌شوند:

| دستور          | توضیح                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | آزمون تأخیر                                                                                              |
| `/bot-version` | نمایش نسخه چارچوب OpenClaw                                                                              |
| `/bot-help`    | فهرست کردن همه دستورها                                                                                   |
| `/bot-me`      | نمایش شناسه کاربر QQ فرستنده (openid) برای راه‌اندازی `allowFrom`/`groupAllowFrom`                      |
| `/bot-upgrade` | نمایش لینک راهنمای ارتقای QQBot                                                                          |
| `/bot-logs`    | خروجی گرفتن از logهای اخیر gateway به‌صورت فایل                                                          |
| `/bot-approve` | تأیید یک اقدام در انتظار QQ Bot (برای مثال، تأیید بارگذاری C2C یا گروهی) از طریق جریان بومی.            |

برای راهنمای استفاده، به هر دستور `?` اضافه کنید (برای مثال `/bot-upgrade ?`).

دستورهای مدیر (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) فقط در پیام مستقیم مجازند و به openid فرستنده در یک فهرست صریح و غیر wildcard با نام `allowFrom` نیاز دارند. wildcard `allowFrom: ["*"]` چت را مجاز می‌کند اما دسترسی دستور مدیر نمی‌دهد. پیام‌های گروهی ابتدا با `groupAllowFrom` تطبیق داده می‌شوند و سپس به `allowFrom` fallback می‌کنند. اجرای یک دستور مدیر در گروه به‌جای حذف بی‌صدا، یک راهنما برمی‌گرداند.

## معماری موتور

QQ Bot به‌عنوان یک موتور خودکفا داخل Plugin ارائه می‌شود:

- هر حساب مالک یک پشته منبع ایزوله (اتصال WebSocket، کلاینت API، کش token، ریشه ذخیره‌سازی رسانه) است که با `appId` کلیدگذاری می‌شود. حساب‌ها هرگز وضعیت ورودی/خروجی را با هم به اشتراک نمی‌گذارند.
- logger چندحسابی، خطوط log را با حساب مالک برچسب‌گذاری می‌کند تا هنگام اجرای چند bot زیر یک gateway، عیب‌یابی‌ها جداپذیر بمانند.
- مسیرهای ورودی، خروجی، و پل gateway یک ریشه payload رسانه مشترک زیر `~/.openclaw/media` دارند، بنابراین uploadها، downloadها، و کش‌های transcode به‌جای یک درخت جدا برای هر زیرسامانه، زیر یک دایرکتوری محافظت‌شده قرار می‌گیرند.
- تحویل رسانه غنی برای مقصدهای C2C و گروهی از یک مسیر `sendMedia` عبور می‌کند. فایل‌های محلی و bufferهای بالاتر از آستانه فایل بزرگ از endpointهای بارگذاری تکه‌ای QQ استفاده می‌کنند، در حالی که payloadهای کوچک‌تر از API رسانه one-shot استفاده می‌کنند.
- اعتبارنامه‌ها می‌توانند به‌عنوان بخشی از snapshotهای استاندارد اعتبارنامه OpenClaw پشتیبان‌گیری و بازیابی شوند؛ موتور هنگام بازیابی، پشته منبع هر حساب را بدون نیاز به یک جفت‌سازی QR-code تازه دوباره متصل می‌کند.

## ورود QR-code

به‌عنوان جایگزین چسباندن دستی `AppID:AppSecret`، موتور از یک جریان ورود QR-code برای پیوند دادن QQ Bot به OpenClaw پشتیبانی می‌کند:

1. مسیر راه‌اندازی QQ Bot را اجرا کنید (برای مثال `openclaw channels add --channel qqbot`) و هنگام درخواست، جریان QR-code را انتخاب کنید.
2. کد QR تولیدشده را با برنامه تلفن متصل به QQ Bot مقصد اسکن کنید.
3. جفت‌سازی را روی تلفن تأیید کنید. OpenClaw اعتبارنامه‌های برگشتی را در `credentials/` زیر محدوده حساب درست پایدار می‌کند.

promptهای تأیید تولیدشده توسط خود bot (برای مثال، جریان‌های «allow this action?» که QQ Bot API ارائه می‌کند) به‌صورت promptهای بومی OpenClaw نمایش داده می‌شوند که می‌توانید آن‌ها را به‌جای پاسخ دادن از طریق کلاینت خام QQ، با `/bot-approve` بپذیرید.

## عیب‌یابی

- **bot پاسخ «gone to Mars» می‌دهد:** اعتبارنامه‌ها پیکربندی نشده‌اند یا Gateway شروع نشده است.
- **پیام ورودی وجود ندارد:** بررسی کنید `appId` و `clientSecret` درست هستند، و
  bot در QQ Open Platform فعال است.
- **خودپاسخ‌های تکراری:** OpenClaw شاخص‌های ref خروجی QQ را به‌عنوان
  نوشته‌شده توسط bot ثبت می‌کند و رویدادهای ورودی‌ای را که `msgIdx` فعلی‌شان با همان
  حساب bot یکسان است نادیده می‌گیرد. این کار از حلقه‌های echo پلتفرم جلوگیری می‌کند، در حالی که همچنان به کاربران اجازه می‌دهد
  پیام‌های قبلی bot را quote کنند یا به آن‌ها پاسخ دهند.
- **راه‌اندازی با `--token-file` همچنان پیکربندی‌نشده نشان داده می‌شود:** `--token-file` فقط
  AppSecret را تنظیم می‌کند. هنوز به `appId` در پیکربندی یا `QQBOT_APP_ID` نیاز دارید.
- **پیام‌های proactive نمی‌رسند:** اگر کاربر اخیراً تعامل نداشته باشد، QQ ممکن است پیام‌های آغازشده توسط bot را رهگیری کند.
- **صدا رونویسی نمی‌شود:** مطمئن شوید STT پیکربندی شده و provider در دسترس است.

## مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [گروه‌ها](/fa/channels/groups)
- [عیب‌یابی کانال](/fa/channels/troubleshooting)
