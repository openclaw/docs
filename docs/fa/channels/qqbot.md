---
read_when:
    - می‌خواهید OpenClaw را به QQ متصل کنید
    - به راه‌اندازی اعتبارنامه‌های ربات QQ نیاز دارید
    - پشتیبانی از گروه QQ Bot یا چت خصوصی می‌خواهید
summary: راه‌اندازی، پیکربندی و استفاده از QQ Bot
title: ربات QQ
x-i18n:
    generated_at: "2026-04-29T22:29:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: aefece6b05bb16d5c4f588bf7af4fd710b5f98aab0dbed8221490c46bf3f379c
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot از طریق API رسمی QQ Bot (Gateway وب‌سوکت) به OpenClaw وصل می‌شود. این
Plugin از چت خصوصی C2C، @پیام‌های گروهی، و پیام‌های کانال guild همراه با
رسانه‌های غنی (تصویر، صدا، ویدئو، فایل) پشتیبانی می‌کند.

وضعیت: Plugin همراه. پیام‌های مستقیم، چت‌های گروهی، کانال‌های guild، و
رسانه پشتیبانی می‌شوند. واکنش‌ها و threadها پشتیبانی نمی‌شوند.

## Plugin همراه

نسخه‌های فعلی OpenClaw شامل QQ Bot هستند، بنابراین buildهای بسته‌بندی‌شده عادی به
مرحله جداگانه `openclaw plugins install` نیاز ندارند.

## راه‌اندازی

1. به [QQ Open Platform](https://q.qq.com/) بروید و کد QR را با QQ روی گوشی خود
   اسکن کنید تا ثبت‌نام / وارد شوید.
2. روی **Create Bot** کلیک کنید تا یک ربات QQ جدید بسازید.
3. **AppID** و **AppSecret** را در صفحه تنظیمات ربات پیدا کنید و آن‌ها را کپی کنید.

> AppSecret به‌صورت متن ساده ذخیره نمی‌شود — اگر بدون ذخیره کردن آن صفحه را ترک کنید،
> باید یک مورد جدید بازتولید کنید.

4. کانال را اضافه کنید:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway را بازراه‌اندازی کنید.

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

نکته‌ها:

- fallback محیط فقط برای حساب پیش‌فرض QQ Bot اعمال می‌شود.
- `openclaw channels add --channel qqbot --token-file ...` فقط AppSecret را فراهم می‌کند؛
  AppID باید از قبل در پیکربندی یا `QQBOT_APP_ID` تنظیم شده باشد.
- `clientSecret` ورودی SecretRef را هم می‌پذیرد، نه فقط یک رشته متن ساده.

### راه‌اندازی چندحسابی

چند ربات QQ را زیر یک نمونه OpenClaw اجرا کنید:

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

هر حساب اتصال WebSocket خودش را اجرا می‌کند و cache توکن مستقلی را نگه می‌دارد
(ایزوله‌شده بر اساس `appId`).

یک ربات دوم را از طریق CLI اضافه کنید:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### چت‌های گروهی

پشتیبانی QQ Bot از چت گروهی از OpenIDهای گروه QQ استفاده می‌کند، نه نام‌های نمایشی. ربات را
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

`groups["*"]` پیش‌فرض‌ها را برای هر گروه تنظیم می‌کند، و یک ورودی مشخص
`groups.GROUP_OPENID` آن پیش‌فرض‌ها را برای یک گروه override می‌کند. تنظیمات گروه
شامل این موارد است:

- `requireMention`: پیش از پاسخ دادن ربات، یک @mention لازم است. پیش‌فرض: `true`.
- `ignoreOtherMentions`: پیام‌هایی را که شخص دیگری را mention می‌کنند اما ربات را نه، حذف کن.
- `historyLimit`: پیام‌های گروهی اخیرِ بدون mention را به‌عنوان زمینه برای نوبت mention‌شده بعدی نگه دار. برای غیرفعال کردن `0` تنظیم کنید.
- `toolPolicy`: `full`، `restricted`، یا `none` برای ابزارهای محدود به گروه.
- `name`: برچسب خوانا که در logها و زمینه گروه استفاده می‌شود.
- `prompt`: prompt رفتاری مخصوص هر گروه که به زمینه agent افزوده می‌شود.

حالت‌های فعال‌سازی `mention` و `always` هستند. `requireMention: true` به
`mention` نگاشت می‌شود؛ `requireMention: false` به `always` نگاشت می‌شود. override فعال‌سازی
در سطح session، در صورت وجود، بر پیکربندی اولویت دارد.

صف ورودی برای هر peer جداگانه است. peerهای گروهی سقف صف بزرگ‌تری می‌گیرند، هنگام پر بودن
پیام‌های انسانی را جلوتر از گفت‌وگوی ساخته‌شده توسط ربات نگه می‌دارند، و burstهای پیام‌های عادی
گروه را در یک نوبت نسبت‌داده‌شده ادغام می‌کنند. دستورهای slash همچنان یکی‌یکی اجرا می‌شوند.

### صدا (STT / TTS)

پشتیبانی STT و TTS پیکربندی دوسطحی با fallback اولویت‌دار دارد:

| تنظیم | مخصوص Plugin                                           | fallback چارچوب             |
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

برای غیرفعال کردن هرکدام، `enabled: false` را روی آن تنظیم کنید.
overrideهای TTS در سطح حساب همان شکل `messages.tts` را استفاده می‌کنند و روی
پیکربندی TTS کانال/سراسری deep-merge می‌شوند.

پیوست‌های صوتی ورودی QQ به‌عنوان metadata رسانه صوتی در اختیار agentها قرار می‌گیرند، در حالی که
فایل‌های صوتی خام بیرون از `MediaPaths` عمومی نگه داشته می‌شوند. پاسخ‌های متن ساده
`[[audio_as_voice]]` وقتی TTS پیکربندی شده باشد، TTS را سنتز می‌کنند و یک پیام صوتی بومی QQ می‌فرستند.

رفتار upload/transcode صوت خروجی را می‌توان با
`channels.qqbot.audioFormatPolicy` هم تنظیم کرد:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## قالب‌های مقصد

| قالب                      | توضیح             |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | چت خصوصی (C2C)    |
| `qqbot:group:GROUP_OPENID` | چت گروهی          |
| `qqbot:channel:CHANNEL_ID` | کانال guild       |

> هر ربات مجموعه OpenIDهای کاربری خودش را دارد. یک OpenID دریافت‌شده توسط Bot A **نمی‌تواند**
> برای ارسال پیام از طریق Bot B استفاده شود.

## دستورهای slash

دستورهای داخلی که پیش از صف AI رهگیری می‌شوند:

| دستور          | توضیح                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | آزمون تأخیر                                                                                             |
| `/bot-version` | نمایش نسخه چارچوب OpenClaw                                                                              |
| `/bot-help`    | فهرست همه دستورها                                                                                       |
| `/bot-upgrade` | نمایش پیوند راهنمای ارتقای QQBot                                                                        |
| `/bot-logs`    | خروجی گرفتن از logهای اخیر gateway به‌صورت فایل                                                         |
| `/bot-approve` | تأیید یک اقدام در انتظار QQ Bot (برای مثال، تأیید یک upload در C2C یا گروه) از طریق جریان بومی. |

برای راهنمای استفاده، به هر دستور `?` اضافه کنید (برای مثال `/bot-upgrade ?`).

## معماری engine

QQ Bot به‌صورت یک engine خودبسنده داخل Plugin عرضه می‌شود:

- هر حساب مالک یک stack منبع ایزوله است (اتصال WebSocket، client API، cache توکن، ریشه ذخیره‌سازی رسانه) که با `appId` کلیدگذاری شده است. حساب‌ها هرگز state ورودی/خروجی را به اشتراک نمی‌گذارند.
- logger چندحسابی، خط‌های log را با حساب مالک برچسب‌گذاری می‌کند تا وقتی چند ربات را زیر یک gateway اجرا می‌کنید، عیب‌یابی‌ها قابل تفکیک بمانند.
- مسیرهای ورودی، خروجی، و bridge gateway یک ریشه واحد payload رسانه زیر `~/.openclaw/media` را به اشتراک می‌گذارند، بنابراین uploadها، downloadها، و cacheهای transcode به‌جای درخت مخصوص هر زیرسیستم، زیر یک پوشه محافظت‌شده واحد قرار می‌گیرند.
- تحویل رسانه غنی برای مقصدهای C2C و گروهی از یک مسیر `sendMedia` عبور می‌کند. فایل‌های محلی و bufferهای بالاتر از آستانه فایل بزرگ از endpointهای upload تکه‌ای QQ استفاده می‌کنند، در حالی که payloadهای کوچک‌تر از API رسانه یک‌مرحله‌ای استفاده می‌کنند.
- credentials می‌توانند به‌عنوان بخشی از snapshotهای استاندارد credential در OpenClaw پشتیبان‌گیری و بازیابی شوند؛ engine پس از بازیابی، stack منبع هر حساب را دوباره متصل می‌کند، بدون اینکه به جفت‌سازی QR-code تازه نیاز باشد.

## onboarding با QR-code

به‌عنوان جایگزینی برای چسباندن دستی `AppID:AppSecret`، engine از جریان onboarding با QR-code برای اتصال QQ Bot به OpenClaw پشتیبانی می‌کند:

1. مسیر راه‌اندازی QQ Bot را اجرا کنید (برای مثال `openclaw channels add --channel qqbot`) و وقتی prompt شد، جریان QR-code را انتخاب کنید.
2. کد QR تولیدشده را با app گوشی مرتبط با QQ Bot مقصد اسکن کنید.
3. جفت‌سازی را روی گوشی تأیید کنید. OpenClaw credentials برگشتی را در `credentials/` زیر scope درست حساب ذخیره می‌کند.

promptهای تأیید تولیدشده توسط خود ربات (برای مثال، جریان‌های «اجازه این اقدام؟» که توسط QQ Bot API ارائه می‌شوند) به‌صورت promptهای بومی OpenClaw نمایش داده می‌شوند که می‌توانید آن‌ها را با `/bot-approve` بپذیرید، به‌جای اینکه از طریق client خام QQ پاسخ دهید.

## عیب‌یابی

- **ربات پاسخ می‌دهد "gone to Mars":** credentials پیکربندی نشده‌اند یا Gateway شروع نشده است.
- **پیام ورودی وجود ندارد:** بررسی کنید `appId` و `clientSecret` درست باشند، و ربات
  روی QQ Open Platform فعال باشد.
- **خودپاسخ‌های تکراری:** OpenClaw شاخص‌های ref خروجی QQ را به‌عنوان
  ساخته‌شده توسط ربات ثبت می‌کند و رویدادهای ورودی‌ای را که `msgIdx` فعلی‌شان با همان
  حساب ربات یکسان است نادیده می‌گیرد. این کار از حلقه‌های echo پلتفرم جلوگیری می‌کند، در حالی که همچنان به کاربران اجازه می‌دهد
  پیام‌های قبلی ربات را نقل‌قول کنند یا به آن‌ها پاسخ دهند.
- **راه‌اندازی با `--token-file` همچنان unconfigured نشان می‌دهد:** `--token-file` فقط
  AppSecret را تنظیم می‌کند. همچنان به `appId` در پیکربندی یا `QQBOT_APP_ID` نیاز دارید.
- **پیام‌های proactive نمی‌رسند:** QQ ممکن است پیام‌های آغازشده توسط ربات را در صورتی که
  کاربر اخیراً تعامل نداشته باشد رهگیری کند.
- **صدا transcribe نمی‌شود:** مطمئن شوید STT پیکربندی شده و provider قابل دسترسی است.

## مرتبط

- [جفت‌سازی](/fa/channels/pairing)
- [گروه‌ها](/fa/channels/groups)
- [عیب‌یابی کانال](/fa/channels/troubleshooting)
