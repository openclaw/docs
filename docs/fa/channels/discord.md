---
read_when:
    - کار روی قابلیت‌های کانال Discord
summary: وضعیت پشتیبانی ربات Discord، قابلیت‌ها و پیکربندی
title: Discord
x-i18n:
    generated_at: "2026-07-03T02:51:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e8724b02baa1a2dba1ac932e20533c9293b6021f30b1a79107349c34f195e5
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های مستقیم و کانال‌های گیلد از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Discord به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و کاتالوگ دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و جریان تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید همراه با یک ربات بسازید، ربات را به سرور خود اضافه کنید و آن را با OpenClaw جفت کنید. پیشنهاد می‌کنیم ربات خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز یکی ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="ساخت یک برنامه و ربات Discord">
    به [پرتال توسعه‌دهندگان Discord](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را به هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="فعال‌سازی intentهای دارای امتیاز ویژه">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **Message Content Intent** (الزامی)
    - **Server Members Intent** (پیشنهادی؛ برای فهرست‌های مجاز نقش و تطبیق نام با شناسه الزامی است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="کپی کردن توکن ربات">
    در صفحه **Bot** دوباره به بالا بروید و روی **Reset Token** کلیک کنید.

    <Note>
    برخلاف نامش، این کار اولین توکن شما را ایجاد می‌کند — چیزی «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی کنید و جایی ذخیره کنید. این **Bot Token** شماست و کمی بعد به آن نیاز دارید.

  </Step>

  <Step title="ایجاد URL دعوت و افزودن ربات به سرور">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست ایجاد می‌کنید تا ربات را به سرور خود اضافه کنید.

    به پایین تا **OAuth2 URL Generator** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    یک بخش **Bot Permissions** در پایین ظاهر می‌شود. حداقل این موارد را فعال کنید:

    **مجوزهای عمومی**
      - مشاهده کانال‌ها

    **مجوزهای متنی**
      - ارسال پیام‌ها
      - خواندن تاریخچه پیام‌ها
      - درج لینک‌ها
      - پیوست کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعه پایه برای کانال‌های متنی معمولی است. اگر قصد دارید در رشته‌های Discord پست بگذارید، از جمله جریان‌های کاری کانال انجمن یا رسانه که یک رشته ایجاد یا ادامه می‌دهند، **Send Messages in Threads** را نیز فعال کنید.
    URL ایجادشده در پایین را کپی کنید، آن را در مرورگر خود وارد کنید، سرور خود را انتخاب کنید و برای اتصال روی **Continue** کلیک کنید. اکنون باید ربات خود را در سرور Discord ببینید.

  </Step>

  <Step title="فعال‌سازی حالت توسعه‌دهنده و جمع‌آوری شناسه‌ها">
    در برنامه Discord، باید حالت توسعه‌دهنده را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **User Settings** (آیکون چرخ‌دنده کنار آواتار شما) کلیک کنید → در نوار کناری به **Developer** بروید → **Developer Mode** را روشن کنید

        *(نکته: در برنامه موبایل Discord، حالت توسعه‌دهنده زیر **App Settings** → **Advanced** قرار دارد)*

    2. روی **آیکون سرور** خود در نوار کناری راست‌کلیک کنید → **Copy Server ID**
    3. روی **آواتار خودتان** راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را کنار Bot Token ذخیره کنید — در مرحله بعد هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="اجازه دادن به پیام‌های مستقیم از اعضای سرور">
    برای اینکه جفت‌سازی کار کند، Discord باید به ربات شما اجازه دهد به شما پیام مستقیم بدهد. روی **آیکون سرور** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار به اعضای سرور (از جمله ربات‌ها) اجازه می‌دهد به شما پیام مستقیم بفرستند. اگر می‌خواهید از پیام‌های مستقیم Discord با OpenClaw استفاده کنید، این گزینه را روشن نگه دارید. اگر فقط قصد دارید از کانال‌های گیلد استفاده کنید، می‌توانید پس از جفت‌سازی پیام‌های مستقیم را غیرفعال کنید.

  </Step>

  <Step title="تنظیم امن توکن ربات (آن را در چت نفرستید)">
    توکن ربات Discord شما یک راز است (مثل گذرواژه). پیش از پیام دادن به عامل خود، آن را روی ماشینی که OpenClaw را اجرا می‌کند تنظیم کنید.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    اگر OpenClaw از قبل به‌عنوان سرویس پس‌زمینه اجرا می‌شود، آن را از طریق برنامه Mac OpenClaw یا با متوقف کردن و راه‌اندازی دوباره فرایند `openclaw gateway run` بازراه‌اندازی کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از پوسته‌ای اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس بتواند SecretRef محیط را پس از بازراه‌اندازی resolve کند.
    اگر میزبان شما توسط lookup برنامه هنگام شروع Discord مسدود یا rate-limit شده است، شناسه برنامه/کلاینت Discord را از پورتال توسعه‌دهندگان تنظیم کنید تا راه‌اندازی بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند ربات Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="پیکربندی OpenClaw و جفت‌سازی">

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        با عامل OpenClaw خود در هر کانال موجود (مثلاً Telegram) چت کنید و به آن بگویید. اگر Discord اولین کانال شماست، به‌جای آن از زبانه CLI / پیکربندی استفاده کنید.

        > «من قبلاً توکن ربات Discord خود را در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با User ID `<user_id>` و Server ID `<server_id>` کامل کن.»
      </Tab>
      <Tab title="CLI / پیکربندی">
        اگر پیکربندی مبتنی بر فایل را ترجیح می‌دهید، این را تنظیم کنید:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        fallback محیطی برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا از راه دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس دوباره بدون `--dry-run` اجرا کنید. مقدارهای متن ساده `token` پشتیبانی می‌شوند. مقدارهای SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند ربات Discord، توکن و شناسه برنامه هر ربات را زیر حساب خودش نگه دارید. یک `channels.discord.applicationId` سطح بالا توسط حساب‌ها به ارث برده می‌شود، بنابراین فقط زمانی آن را آنجا تنظیم کنید که همه حساب‌ها باید از یک شناسه برنامه یکسان استفاده کنند.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="تأیید اولین جفت‌سازی پیام مستقیم">
    صبر کنید تا Gateway در حال اجرا باشد، سپس در Discord به ربات خود پیام مستقیم بدهید. ربات با یک کد جفت‌سازی پاسخ می‌دهد.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        کد جفت‌سازی را در کانال موجود خود برای عامل بفرستید:

        > «این کد جفت‌سازی Discord را تأیید کن: `<CODE>`»
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.

    اکنون باید بتوانید از طریق پیام مستقیم در Discord با عامل خود چت کنید.

  </Step>
</Steps>

<Note>
resolve کردن توکن نسبت به حساب آگاه است. مقدارهای توکن پیکربندی بر fallback محیطی اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به یک توکن ربات یکسان resolve شوند، OpenClaw فقط یک مانیتور Gateway برای آن توکن شروع می‌کند. توکن مبتنی بر پیکربندی بر fallback محیطی پیش‌فرض اولویت دارد؛ در غیر این صورت اولین حساب فعال برنده می‌شود و حساب تکراری به‌صورت غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار پیام/اقدام‌های کانال)، یک `token` صریح برای همان فراخوانی استفاده می‌شود. این مورد برای اقدام‌های send و read/probe-style اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات سیاست حساب/تلاش مجدد همچنان از حساب انتخاب‌شده در snapshot فعال runtime می‌آیند.
</Note>

## پیشنهادی: راه‌اندازی یک فضای کاری گیلد

وقتی پیام‌های مستقیم کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که هر کانال در آن نشست عامل خودش را با زمینه خودش دارد. این کار برای سرورهای خصوصی که فقط شما و رباتتان در آن هستید توصیه می‌شود.

<Steps>
  <Step title="افزودن سرور به فهرست مجاز گیلد">
    این کار به عامل شما اجازه می‌دهد در هر کانالی روی سرورتان پاسخ دهد، نه فقط در پیام‌های مستقیم.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «Discord Server ID من یعنی `<server_id>` را به فهرست مجاز گیلد اضافه کن»
      </Tab>
      <Tab title="پیکربندی">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="اجازه دادن به پاسخ‌ها بدون @mention">
    به‌طور پیش‌فرض، عامل شما در کانال‌های گیلد فقط زمانی پاسخ می‌دهد که @mention شود. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های گیلد، پاسخ‌های معمولی به‌طور پیش‌فرض خودکار پست می‌شوند. برای اتاق‌های مشترک همیشه‌روشن، `messages.groupChat.visibleReplies: "message_tool"` را فعال کنید تا عامل بتواند در سکوت حضور داشته باشد و فقط وقتی تصمیم می‌گیرد پاسخ کانال مفید است پست کند. این حالت با مدل‌های نسل جدید و قابل‌اعتماد در ابزارها مثل GPT 5.5 بهترین عملکرد را دارد. رویدادهای محیطی اتاق ساکت می‌مانند مگر اینکه ابزار ارسال کند. برای پیکربندی کامل حالت حضور خاموش، [رویدادهای محیطی اتاق](/fa/channels/ambient-room-events) را ببینید.

    اگر Discord نشان می‌دهد که در حال تایپ است و لاگ‌ها مصرف توکن را نشان می‌دهند اما هیچ پیامی پست نشده است، بررسی کنید که آیا نوبت به‌عنوان رویداد محیطی اتاق پیکربندی شده یا پاسخ‌های قابل‌مشاهده message-tool را فعال کرده است.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «به عامل من اجازه بده روی این سرور بدون نیاز به @mention شدن پاسخ دهد»
      </Tab>
      <Tab title="پیکربندی">
        در پیکربندی گیلد خود `requireMention: false` را تنظیم کنید:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        برای الزام ارسال‌های message-tool برای پاسخ‌های قابل‌مشاهده گروه/کانال، `messages.groupChat.visibleReplies: "message_tool"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="برنامه‌ریزی برای حافظه در کانال‌های گیلد">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در نشست‌های پیام مستقیم بارگذاری می‌شود. کانال‌های گیلد MEMORY.md را خودکار بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر به زمینه بلندمدت از MEMORY.md نیاز داری از memory_search یا memory_get استفاده کن.»
      </Tab>
      <Tab title="دستی">
        اگر در هر کانال به زمینه مشترک نیاز دارید، دستورهای پایدار را در `AGENTS.md` یا `USER.md` بگذارید (آن‌ها برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال روی سرور Discord خود بسازید و شروع به چت کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال نشست ایزوله خودش را دارد — بنابراین می‌توانید `#coding`، `#home`، `#research` یا هر چیزی را که با جریان کاری شما سازگار است راه‌اندازی کنید.

## مدل runtime

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord دوباره به Discord برمی‌گردند.
- فرادادهٔ سرور/کانال Discord به‌عنوان زمینهٔ نامطمئن به اعلان مدل افزوده می‌شود، نه به‌عنوان پیشوند پاسخ قابل مشاهده برای کاربر. اگر مدلی آن پوشش را دوباره کپی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از زمینهٔ بازپخش آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، گفت‌وگوهای مستقیم جلسهٔ اصلی عامل را به‌اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های سرور، کلیدهای جلسهٔ ایزوله هستند (`agent:<agentId>:discord:channel:<channelId>`).
- پیام‌های مستقیم گروهی به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های اسلش بومی در جلسه‌های فرمان ایزوله اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، درحالی‌که همچنان `CommandTargetSessionKey` را به جلسهٔ گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان Cron/Heartbeat فقط متنی به Discord، پاسخ نهاییِ قابل مشاهده برای دستیار را یک‌بار استفاده می‌کند. رسانه و بارهای مؤلفهٔ ساخت‌یافته وقتی عامل چند بار قابل تحویل تولید می‌کند، همچنان چندپیامی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانهٔ Discord فقط پست‌های رشته را می‌پذیرند. OpenClaw از دو روش برای ایجاد آن‌ها پشتیبانی می‌کند:

- به والد انجمن (`channel:<forumId>`) پیام بفرستید تا یک رشته به‌طور خودکار ایجاد شود. عنوان رشته از نخستین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ایجاد مستقیم رشته استفاده کنید. برای کانال‌های انجمن `--message-id` را ارسال نکنید.

مثال: ارسال به والد انجمن برای ایجاد رشته

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: ایجاد صریح یک رشتهٔ انجمن

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود رشته بفرستید (`channel:<threadId>`).

## مؤلفه‌های تعاملی

OpenClaw از ظرف‌های مؤلفهٔ v2 Discord برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با بار `components` استفاده کنید. نتیجه‌های تعامل به‌عنوان پیام‌های ورودی عادی به عامل مسیریابی می‌شوند و تنظیمات موجود `replyToMode` مربوط به Discord را دنبال می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- ردیف‌های کنش تا ۵ دکمه یا یک منوی انتخاب تکی را مجاز می‌کنند
- انواع انتخاب: `string`، `user`، `role`، `mentionable`، `channel`

به‌طور پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌گرها و فرم‌ها تا زمان انقضا چندین بار قابل استفاده باشند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی دکمه کلیک کند، `allowedUsers` را روی آن دکمه تنظیم کنید (شناسه‌های کاربر Discord، برچسب‌ها، یا `*`). وقتی پیکربندی شده باشد، کاربران نامطابق یک رد ناپایدار دریافت می‌کنند.

بازخوانی‌های مؤلفه به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند. برای تغییر طول عمر رجیستری بازخوانی برای حساب پیش‌فرض Discord، `channels.discord.agentComponents.ttlMs` را تنظیم کنید، یا برای بازنویسی یک حساب در راه‌اندازی چندحسابی، `channels.discord.accounts.<accountId>.agentComponents.ttlMs` را تنظیم کنید. مقدار بر حسب میلی‌ثانیه است، باید یک عدد صحیح مثبت باشد، و سقف آن `86400000` (۲۴ ساعت) است. TTLهای طولانی‌تر برای گردش‌کارهای بازبینی یا تأیید که نیاز دارند دکمه‌ها قابل استفاده بمانند مفیدند، اما پنجره‌ای را هم طولانی‌تر می‌کنند که در آن یک پیام قدیمی Discord هنوز می‌تواند کنشی را فعال کند. کوتاه‌ترین TTL متناسب با گردش‌کار را ترجیح دهید، و وقتی بازخوانی‌های کهنه غافلگیرکننده هستند مقدار پیش‌فرض را نگه دارید.

فرمان‌های اسلش `/model` و `/models` یک انتخاب‌گر تعاملی مدل را با فهرست‌های کشویی ارائه‌دهنده، مدل و زمان‌اجرای سازگار، به‌همراه یک مرحلهٔ ارسال، باز می‌کنند. `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از گفت‌وگو، یک پیام منسوخ‌شدن برمی‌گرداند. پاسخ انتخاب‌گر ناپایدار است و فقط کاربر فراخواننده می‌تواند از آن استفاده کند. منوهای انتخاب Discord به ۲۵ گزینه محدودند، بنابراین وقتی می‌خواهید انتخاب‌گر مدل‌های کشف‌شدهٔ پویا را فقط برای ارائه‌دهندگان منتخب مانند `openai` یا `vllm` نشان دهد، ورودی‌های `provider/*` را به `agents.defaults.models` اضافه کنید.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (فایل تکی)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با مرجع پیوست مطابقت داشته باشد، از `filename` برای بازنویسی نام استفاده کنید

فرم‌های مودال:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- انواع فیلد: `text`، `checkbox`، `radio`، `select`، `role-select`، `user-select`
- OpenClaw به‌طور خودکار یک دکمهٔ محرک اضافه می‌کند

مثال:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست DM">
    `channels.discord.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.discord.allowFrom` فهرست مجاز متعارف DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست DM باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` برای جفت‌سازی راهنمایی می‌شوند).

    اولویت چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی اولویت دارد.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب هدف DM برای تحویل:

    - `user:<id>`
    - ذکر `<@id>`

    شناسه‌های عددی تنها معمولاً وقتی پیش‌فرض کانال فعال باشد به‌عنوان شناسه‌های کانال حل می‌شوند، اما شناسه‌های فهرست‌شده در `allowFrom` مؤثر DM حساب، برای سازگاری به‌عنوان هدف‌های DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="گروه‌های دسترسی">
    مجوزدهی DMهای Discord و فرمان‌های متنی می‌تواند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کند.

    نام‌های گروه دسترسی در میان کانال‌های پیام مشترک‌اند. برای یک گروه ایستا که اعضایش با نحو عادی `allowFrom` هر کانال بیان می‌شوند، از `type: "message.senders"` استفاده کنید، یا وقتی مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کنند، از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک گروه دسترسی اینجا مستند شده است: [گروه‌های دسترسی](/fa/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    یک کانال متنی Discord فهرست عضو جداگانه ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستندهٔ DM عضو سرور پیکربندی‌شده است و در حال حاضر پس از اعمال بازنویسی‌های نقش و کانال، مجوز مؤثر `ViewChannel` روی کانال پیکربندی‌شده دارد.

    مثال: به هر کسی که می‌تواند `#maintainers` را ببیند اجازه دهید به ربات DM بفرستد، درحالی‌که DMها برای دیگران بسته می‌مانند.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    می‌توانید ورودی‌های پویا و ایستا را ترکیب کنید:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    جست‌وجوها به‌صورت بسته شکست می‌خورند. اگر Discord، `Missing Access` برگرداند، جست‌وجوی عضو شکست بخورد، یا کانال به سرور دیگری تعلق داشته باشد، فرستندهٔ DM غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر مخاطب کانال، **Server Members Intent** را در Discord Developer Portal برای ربات فعال کنید. DMها وضعیت عضو سرور را شامل نمی‌شوند، بنابراین OpenClaw عضو را در زمان مجوزدهی از طریق REST Discord حل می‌کند.

  </Tab>

  <Tab title="سیاست سرور">
    مدیریت سرور با `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط مبنای امن وقتی `channels.discord` وجود دارد، `allowlist` است.

    رفتار `allowlist`:

    - سرور باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شود) و `roles` (فقط شناسه‌های نقش)؛ اگر هرکدام پیکربندی شده باشد، فرستنده‌ها وقتی با `users` یا `roles` مطابقت داشته باشند مجازند
    - تطبیق مستقیم نام/برچسب به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/برچسب‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌ترند؛ `openclaw security audit` هنگام استفاده از ورودی‌های نام/برچسب هشدار می‌دهد
    - اگر سروری `channels` پیکربندی‌شده داشته باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر سروری بلوک `channels` نداشته باشد، همهٔ کانال‌های آن سرورِ فهرست‌مجاز مجازند

    مثال:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` نسازید، جایگزین زمان اجرا `groupPolicy="allowlist"` است (همراه با هشدار در گزارش‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="ذکرها و DMهای گروهی">
    پیام‌های سرور به‌طور پیش‌فرض با ذکر محدود می‌شوند.

    تشخیص ذکر شامل این موارد است:

    - ذکر صریح ربات
    - الگوهای ذکر پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، جایگزین `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ‌به‌ربات در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از نحو متعارف ذکر استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای نقش‌ها. از قالب قدیمی ذکر نام مستعار `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر سرور/کانال پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که کاربر/نقش دیگری را ذکر می‌کنند اما ربات را ذکر نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).

    DMهای گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌ها یا slugهای کانال)

  </Tab>
</Tabs>

### مسیریابی عامل مبتنی بر نقش

از `bindings[].match.roles` برای مسیریابی اعضای سرور Discord به عامل‌های متفاوت بر اساس شناسه نقش استفاده کنید. اتصال‌های مبتنی بر نقش فقط شناسه نقش‌ها را می‌پذیرند و پس از اتصال‌های همتا یا همتای والد و پیش از اتصال‌های فقط سرور ارزیابی می‌شوند. اگر یک اتصال فیلدهای تطبیق دیگری هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همه فیلدهای پیکربندی‌شده باید تطبیق داشته باشند.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## فرمان‌های بومی و احراز مجوز فرمان

- مقدار پیش‌فرض `commands.native` برابر `"auto"` است و برای Discord فعال است.
- بازنویسی برای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` ثبت و پاک‌سازی فرمان‌های اسلش Discord را هنگام راه‌اندازی رد می‌کند. فرمان‌های ثبت‌شده قبلی ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف کنید، همچنان در Discord دیده شوند.
- احراز مجوز فرمان بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که پردازش پیام عادی استفاده می‌کند.
- فرمان‌ها ممکن است همچنان در رابط کاربری Discord برای کاربرانی که مجاز نیستند دیده شوند؛ اجرا همچنان احراز مجوز OpenClaw را اعمال می‌کند و «مجاز نیست» برمی‌گرداند.

برای فهرست فرمان‌ها و رفتار، [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض فرمان اسلش:

- `ephemeral: true`

## جزئیات قابلیت

<AccordionGroup>
  <Accordion title="برچسب‌های پاسخ و پاسخ‌های بومی">
    Discord از برچسب‌های پاسخ در خروجی عامل پشتیبانی می‌کند:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    با `channels.discord.replyToMode` کنترل می‌شود:

    - `off` (پیش‌فرض)
    - `first`
    - `all`
    - `batched`

    نکته: `off` رشته‌سازی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه ارجاع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای نوبت متصل می‌کند.
    `batched` فقط زمانی ارجاع پاسخ بومی ضمنی Discord را متصل می‌کند که
    رویداد ورودی یک دسته با دیبانس از چند پیام بوده باشد. این زمانی مفید است
    که پاسخ‌های بومی را عمدتاً برای چت‌های انفجاری و مبهم می‌خواهید، نه برای هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در زمینه/تاریخچه نمایش داده می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش‌های پیوند">
    Discord به‌صورت پیش‌فرض برای URLها جاسازی‌های غنی پیوند تولید می‌کند. OpenClaw این جاسازی‌های تولیدشده را به‌صورت پیش‌فرض در پیام‌های خروجی Discord سرکوب می‌کند، بنابراین URLهای ارسال‌شده توسط عامل به‌صورت پیوند ساده باقی می‌مانند مگر اینکه آن را فعال کنید:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    برای بازنویسی یک حساب، `channels.discord.accounts.<id>.suppressEmbeds` را تنظیم کنید. ارسال‌های ابزار پیام عامل نیز می‌توانند برای یک پیام واحد `suppressEmbeds: false` را پاس دهند. بارهای داده صریح Discord `embeds` با تنظیم پیش‌فرض پیش‌نمایش پیوند سرکوب نمی‌شوند.

  </Accordion>

  <Accordion title="پیش‌نمایش پخش زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هنگام رسیدن متن، پاسخ‌های پیش‌نویس را پخش کند. `channels.discord.streaming` یکی از `off` | `partial` | `block` | `progress` (پیش‌فرض) را می‌پذیرد. `progress` یک پیش‌نویس وضعیت قابل ویرایش نگه می‌دارد و تا تحویل نهایی آن را با پیشرفت ابزار به‌روزرسانی می‌کند؛ برچسب آغازگر مشترک یک خط چرخان است، بنابراین وقتی کار کافی ظاهر شود مانند بقیه محتوا از دید خارج می‌شود. `streamMode` یک نام مستعار قدیمی زمان اجرا است. `openclaw doctor --fix` را اجرا کنید تا پیکربندی ماندگارشده به کلید canonical بازنویسی شود.

    برای غیرفعال کردن ویرایش‌های پیش‌نمایش Discord، `channels.discord.streaming.mode` را روی `off` تنظیم کنید. اگر پخش بلوکی Discord به‌صورت صریح فعال باشد، OpenClaw برای جلوگیری از پخش دوگانه، جریان پیش‌نمایش را رد می‌کند.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` هنگام رسیدن توکن‌ها یک پیام پیش‌نمایش واحد را ویرایش می‌کند.
    - `block` قطعه‌هایی در اندازه پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، محدودشده به `textChunkLimit`).
    - رسانه، خطا و پاسخ‌های نهایی صریح، ویرایش‌های پیش‌نمایش در انتظار را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.
    - ردیف‌های ابزار/پیشرفت، در صورت وجود، به‌شکل ایموجی فشرده + عنوان + جزئیات نمایش داده می‌شوند، برای مثال `🛠️ Bash: run tests` یا `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (پیش‌فرض `false`) متن توضیحی/مقدمه دستیار را در پیش‌نویس موقت پیشرفت فعال می‌کند. توضیح پیش از نمایش پاک‌سازی می‌شود، گذرا می‌ماند و تحویل پاسخ نهایی را تغییر نمی‌دهد.
    - `streaming.progress.maxLineChars` بودجه پیش‌نمایش پیشرفت برای هر خط را کنترل می‌کند. نثر در مرز واژه‌ها کوتاه می‌شود؛ جزئیات فرمان و مسیر پسوندهای مفید را نگه می‌دارند.
    - `streaming.preview.commandText` / `streaming.progress.commandText` جزئیات فرمان/اجرا را در خطوط فشرده پیشرفت کنترل می‌کند: `raw` (پیش‌فرض) یا `status` (فقط برچسب ابزار).

    پنهان کردن متن خام فرمان/اجرا در حالی که خطوط فشرده پیشرفت حفظ می‌شوند:

    ```json
    {
      "channels": {
        "discord": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    پخش پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی برمی‌گردند. وقتی پخش `block` به‌صورت صریح فعال باشد، OpenClaw برای جلوگیری از پخش دوگانه، جریان پیش‌نمایش را رد می‌کند.

  </Accordion>

  <Accordion title="تاریخچه، زمینه و رفتار رشته">
    زمینه تاریخچه سرور:

    - پیش‌فرض `channels.discord.historyLimit` برابر `20`
    - جایگزین: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچه پیام خصوصی:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار رشته:

    - رشته‌های Discord به‌عنوان نشست‌های کانال مسیریابی می‌شوند و مگر اینکه بازنویسی شوند، پیکربندی کانال والد را به ارث می‌برند.
    - نشست‌های رشته انتخاب `/model` در سطح نشست کانال والد را فقط به‌عنوان جایگزین مدل به ارث می‌برند؛ انتخاب‌های محلی رشته برای `/model` همچنان اولویت دارند و تاریخچه رونوشت والد کپی نمی‌شود مگر اینکه ارث‌بری رونوشت فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) رشته‌های خودکار جدید را برای بذرگذاری از رونوشت والد فعال می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند اهداف پیام خصوصی `user:<id>` را حل کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام جایگزین فعال‌سازی در مرحله پاسخ حفظ می‌شود.

    موضوعات کانال به‌عنوان زمینه **نامطمئن** تزریق می‌شوند. فهرست‌های مجاز تعیین می‌کنند چه کسی می‌تواند عامل را تحریک کند، نه یک مرز کامل ویرایش زمینه تکمیلی.

  </Accordion>

  <Accordion title="نشست‌های مقید به رشته برای زیرعامل‌ها">
    Discord می‌تواند یک رشته را به یک هدف نشست متصل کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست (از جمله نشست‌های زیرعامل) مسیریابی شوند.

    فرمان‌ها:

    - `/focus <target>` اتصال رشته فعلی/جدید به هدف زیرعامل/نشست
    - `/unfocus` حذف اتصال رشته فعلی
    - `/agents` نمایش اجراهای فعال و وضعیت اتصال
    - `/session idle <duration|off>` بررسی/به‌روزرسانی لغو تمرکز خودکار بر اثر غیرفعالی برای اتصال‌های متمرکز
    - `/session max-age <duration|off>` بررسی/به‌روزرسانی حداکثر سن سخت برای اتصال‌های متمرکز

    پیکربندی:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    نکته‌ها:

    - `session.threadBindings.*` پیش‌فرض‌های سراسری را تنظیم می‌کند.
    - `channels.discord.threadBindings.*` رفتار Discord را بازنویسی می‌کند.
    - `spawnSessions` ایجاد/اتصال خودکار رشته‌ها را برای `sessions_spawn({ thread: true })` و ایجاد رشته‌های ACP کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` زمینه زیرعامل بومی را برای ایجادهای مقید به رشته کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` توسط `openclaw doctor --fix` مهاجرت داده می‌شوند.
    - اگر اتصال‌های رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط اتصال رشته در دسترس نیستند.

    [زیرعامل‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents) و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="اتصال‌های ماندگار کانال ACP">
    برای فضاهای کاری ACP پایدار و «همیشه روشن»، اتصال‌های ACP نوع‌دار سطح بالا را که گفتگوهای Discord را هدف می‌گیرند پیکربندی کنید.

    مسیر پیکربندی:

    - `bindings[]` با `type: "acp"` و `match.channel: "discord"`

    مثال:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    نکته‌ها:

    - `/acp spawn codex --bind here` کانال یا رشته فعلی را درجا متصل می‌کند و پیام‌های آینده را در همان نشست ACP نگه می‌دارد. پیام‌های رشته اتصال کانال والد را به ارث می‌برند.
    - در یک کانال یا رشته متصل، `/new` و `/reset` همان نشست ACP را درجا بازنشانی می‌کنند. اتصال‌های موقت رشته می‌توانند هنگام فعال بودن، حل هدف را بازنویسی کنند.
    - `spawnSessions` ایجاد/اتصال رشته فرزند را از طریق `--thread auto|here` کنترل می‌کند.

    برای جزئیات رفتار اتصال، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش برای هر سرور:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستمی تبدیل می‌شوند و به نشست Discord مسیریابی‌شده متصل می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید دریافت">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw، یک ایموجی تأیید دریافت می‌فرستد.

    ترتیب حل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Discord ایموجی یونیکد یا نام ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی">
    نوشتن پیکربندی آغازشده از کانال به‌صورت پیش‌فرض فعال است.

    این روی جریان‌های `/config set|unset` اثر می‌گذارد (وقتی قابلیت‌های فرمان فعال باشند).

    غیرفعال‌سازی:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="پروکسی Gateway">
    ترافیک WebSocket درگاه Discord و جست‌وجوهای REST هنگام راه‌اندازی (شناسه برنامه + حل فهرست مجاز) را با `channels.discord.proxy` از طریق یک پروکسی HTTP(S) مسیریابی کنید.
    پروکسی‌کردن WebSocket درگاه Discord صریح است؛ اتصال‌های WebSocket متغیرهای محیطی پروکسی پیرامونی را از فرایند Gateway به ارث نمی‌برند. وقتی `channels.discord.proxy` پیکربندی شده باشد، جست‌وجوهای REST هنگام راه‌اندازی از این پروکسی استفاده می‌کنند.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    بازنویسی برای هر حساب:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="پشتیبانی از PluralKit">
    حل‌وفصل PluralKit را فعال کنید تا پیام‌های پروکسی‌شده به هویت عضو سیستم نگاشت شوند:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    نکات:

    - allowlistها می‌توانند از `pk:<memberId>` استفاده کنند
    - نام‌های نمایشی اعضا فقط زمانی بر اساس نام/slug تطبیق داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true` باشد
    - جست‌وجوها از شناسه پیام اصلی استفاده می‌کنند و به یک بازه زمانی محدود هستند
    - اگر جست‌وجو شکست بخورد، پیام‌های پروکسی‌شده به‌عنوان پیام‌های bot در نظر گرفته می‌شوند و حذف می‌شوند، مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="نام‌های مستعار mention خروجی">
    زمانی از `mentionAliases` استفاده کنید که عامل‌ها برای کاربران شناخته‌شده Discord به mentionهای خروجی قطعی نیاز دارند. کلیدها handleهای بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربر Discord هستند. handleهای ناشناخته، `@everyone`، `@here`، و mentionهای داخل code spanهای Markdown بدون تغییر باقی می‌مانند.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="پیکربندی حضور">
    به‌روزرسانی‌های حضور زمانی اعمال می‌شوند که یک فیلد status یا activity را تنظیم کنید، یا زمانی که حضور خودکار را فعال کنید.

    نمونه فقط status:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    نمونه activity (custom status نوع پیش‌فرض activity است):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    نمونه streaming:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    نقشه نوع activity:

    - 0: در حال بازی
    - 1: در حال پخش زنده (به `activityUrl` نیاز دارد)
    - 2: در حال گوش دادن
    - 3: در حال تماشا
    - 4: سفارشی (از متن activity به‌عنوان وضعیت status استفاده می‌کند؛ emoji اختیاری است)
    - 5: در حال رقابت

    نمونه حضور خودکار (سیگنال سلامت runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    حضور خودکار دسترس‌پذیری runtime را به status در Discord نگاشت می‌کند: سالم => آنلاین، degraded یا ناشناخته => idle، exhausted یا unavailable => dnd. جایگزینی‌های اختیاری متن:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از placeholder‏ `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="تأییدها در Discord">
    Discord از مدیریت تأیید مبتنی بر دکمه در DMها پشتیبانی می‌کند و به‌صورت اختیاری می‌تواند promptهای تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    Discord زمانی تأییدهای native exec را به‌صورت خودکار فعال می‌کند که `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک approver قابل حل‌وفصل باشد، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`. Discord approverهای exec را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنباط نمی‌کند. برای غیرفعال کردن صریح Discord به‌عنوان client تأیید native، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط ویژه owner مانند `/diagnostics` و `/export-trajectory`، OpenClaw promptهای تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. وقتی owner فراخواننده یک مسیر owner در Discord داشته باشد، ابتدا Discord DM را امتحان می‌کند؛ اگر آن در دسترس نباشد، به اولین مسیر owner موجود از `commands.ownerAllowFrom`، مانند Telegram، برمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، prompt تأیید در کانال قابل مشاهده است. فقط approverهای حل‌وفصل‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. promptهای تأیید متن فرمان را شامل می‌شوند، بنابراین تحویل در کانال را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال از کلید session قابل استخراج نباشد، OpenClaw به تحویل از طریق DM برمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترکی را که دیگر کانال‌های chat استفاده می‌کنند render می‌کند. adapter native Discord عمدتاً مسیریابی DM به approver و fanout کانال را اضافه می‌کند.
    وقتی آن دکمه‌ها وجود دارند، UX اصلی تأیید هستند؛ OpenClaw
    فقط زمانی باید فرمان دستی `/approve` را شامل کند که نتیجه tool بگوید
    تأییدهای chat در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر runtime تأیید native در Discord فعال نباشد، OpenClaw prompt
    قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    runtime فعال باشد اما یک کارت native به هیچ هدفی قابل تحویل نباشد،
    OpenClaw یک اعلان fallback در همان chat با فرمان دقیق `/approve`
    از تأیید pending ارسال می‌کند.

    احراز هویت Gateway و حل‌وفصل تأیید از قرارداد مشترک client در Gateway پیروی می‌کند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل‌وفصل می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌صورت پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و gateهای action

actionهای پیام Discord شامل پیام‌رسانی، مدیریت کانال، moderation، حضور، و actionهای metadata هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- moderation: `timeout`، `kick`، `ban`
- حضور: `setPresence`

action‏ `event-create` یک پارامتر اختیاری `image` می‌پذیرد (URL یا مسیر فایل محلی) تا تصویر cover رویداد زمان‌بندی‌شده را تنظیم کند.

gateهای action زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض gate:

| گروه action                                                                                                                                                             | پیش‌فرض  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | فعال  |
| roles                                                                                                                                                                    | غیرفعال |
| moderation                                                                                                                                                               | غیرفعال |
| presence                                                                                                                                                                 | غیرفعال |

## UI کامپوننت‌های v2

OpenClaw از کامپوننت‌های v2 در Discord برای تأییدهای exec و markerهای بین‌زمینه‌ای استفاده می‌کند. actionهای پیام Discord همچنین می‌توانند برای UI سفارشی `components` بپذیرند (پیشرفته؛ نیازمند ساخت payload کامپوننت از طریق tool مربوط به discord)، درحالی‌که `embeds` قدیمی همچنان در دسترس است اما توصیه نمی‌شود.

- `channels.discord.ui.components.accentColor` رنگ accent استفاده‌شده توسط containerهای کامپوننت Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- `channels.discord.agentComponents.ttlMs` کنترل می‌کند callbackهای کامپوننت ارسال‌شده Discord چه مدت ثبت‌شده باقی بمانند (پیش‌فرض `1800000`، حداکثر `86400000`). برای هر حساب با `channels.discord.accounts.<id>.agentComponents.ttlMs` تنظیم کنید.
- وقتی کامپوننت‌های v2 وجود داشته باشند، `embeds` نادیده گرفته می‌شوند.
- پیش‌نمایش‌های URL ساده به‌صورت پیش‌فرض سرکوب می‌شوند. زمانی که یک لینک خروجی واحد باید گسترش یابد، در action پیام `suppressEmbeds: false` را تنظیم کنید.

نمونه:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## صدا

Discord دو سطح صدای متمایز دارد: **کانال‌های صوتی** realtime (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش waveform). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

چک‌لیست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی allowlistهای role/user استفاده می‌شوند، Server Members Intent را فعال کنید.
3. bot را با scopeهای `bot` و `applications.commands` دعوت کنید.
4. در کانال صوتی هدف، Connect، Speak، Send Messages، و Read Message History را اعطا کنید.
5. فرمان‌های native را فعال کنید (`commands.native` یا `channels.discord.commands.native`).
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل sessionها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان قواعد allowlist و سیاست گروهی را مانند دیگر فرمان‌های Discord دنبال می‌کند.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

برای بررسی مجوزهای مؤثر bot پیش از پیوستن، اجرا کنید:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

نمونه auto-join:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

نکات:

- `voice.tts` فقط برای پخش صدای `stt-tts`، `messages.tts` را بازنویسی می‌کند. حالت‌های بی‌درنگ از `voice.realtime.speakerVoice` استفاده می‌کنند.
- `voice.mode` مسیر مکالمه را کنترل می‌کند. پیش‌فرض `agent-proxy` است: یک فرانت‌اند صوتی بی‌درنگ زمان‌بندی نوبت، وقفه و پخش را مدیریت می‌کند، کارهای محتوایی را از طریق `openclaw_agent_consult` به عامل OpenClaw مسیریابی‌شده واگذار می‌کند، و نتیجه را مانند یک اعلان تایپ‌شده Discord از همان گوینده در نظر می‌گیرد. `stt-tts` جریان قدیمی‌تر STT دسته‌ای به‌همراه TTS را نگه می‌دارد. `bidi` به مدل بی‌درنگ اجازه می‌دهد مستقیماً مکالمه کند، درحالی‌که `openclaw_agent_consult` را برای مغز OpenClaw در دسترس می‌گذارد.
- `voice.agentSession` کنترل می‌کند کدام مکالمه OpenClaw نوبت‌های صوتی را دریافت کند. برای استفاده از نشست خود کانال صوتی، آن را تنظیم‌نشده بگذارید، یا `{ mode: "target", target: "channel:<text-channel-id>" }` را تنظیم کنید تا کانال صوتی به‌عنوان افزونه میکروفون/بلندگوی یک نشست موجود کانال متنی Discord مانند `#maintainers` عمل کند.
- `voice.model` مغز عامل OpenClaw را برای پاسخ‌های صوتی Discord و مشورت‌های بی‌درنگ بازنویسی می‌کند. برای به‌ارث‌بردن مدل عامل مسیریابی‌شده، آن را تنظیم‌نشده بگذارید. این گزینه از `voice.realtime.model` جداست.
- `voice.followUsers` به بات اجازه می‌دهد همراه کاربران انتخاب‌شده به صدای Discord بپیوندد، جابه‌جا شود و خارج شود. برای قواعد رفتار و نمونه‌ها، [دنبال‌کردن کاربران در صدا](#follow-users-in-voice) را ببینید.
- `agent-proxy` گفتار را از طریق `discord-voice` مسیریابی می‌کند؛ این مسیر مجوزدهی عادی مالک/ابزار را برای گوینده و نشست هدف حفظ می‌کند، اما ابزار `tts` عامل را پنهان می‌کند چون صدای Discord مالک پخش است. به‌طور پیش‌فرض، `agent-proxy` برای گویندگان مالک، دسترسی کامل ابزار معادل مالک را به مشورت می‌دهد (`voice.realtime.toolPolicy: "owner"`) و قویاً ترجیح می‌دهد پیش از پاسخ‌های محتوایی با عامل OpenClaw مشورت کند (`voice.realtime.consultPolicy: "always"`). در حالت پیش‌فرض `always`، لایه بی‌درنگ پیش از پاسخ مشورت، پرکننده را خودکار به گفتار تبدیل نمی‌کند؛ گفتار را ضبط و رونویسی می‌کند، سپس پاسخ مسیریابی‌شده OpenClaw را پخش می‌کند. اگر چند پاسخ مشورت اجباری درحالی تمام شوند که Discord هنوز پاسخ نخست را پخش می‌کند، پاسخ‌های گفتاری دقیق بعدی به‌جای جایگزین‌کردن گفتار در میانه جمله، تا بیکارشدن پخش در صف می‌مانند.
- در حالت `stt-tts`، STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` روی رونویسی اثر نمی‌گذارد.
- در حالت‌های بی‌درنگ، `voice.realtime.provider`، `voice.realtime.model` و `voice.realtime.speakerVoice` نشست صوتی بی‌درنگ را پیکربندی می‌کنند. برای OpenAI Realtime 2 به‌همراه مغز Codex، از `voice.realtime.model: "gpt-realtime-2"` و `voice.model: "openai/gpt-5.5"` استفاده کنید.
- حالت‌های صوتی بی‌درنگ به‌طور پیش‌فرض فایل‌های کوچک نمایه `IDENTITY.md`، `USER.md` و `SOUL.md` را در دستورالعمل‌های ارائه‌دهنده بی‌درنگ قرار می‌دهند تا نوبت‌های مستقیم سریع همان هویت، زمینه کاربر و پرسونا را مانند عامل OpenClaw مسیریابی‌شده حفظ کنند. برای سفارشی‌سازی، `voice.realtime.bootstrapContextFiles` را روی زیرمجموعه‌ای تنظیم کنید، یا برای غیرفعال‌کردن آن `[]` را تنظیم کنید. فایل‌های بوت‌استرپ بی‌درنگ پشتیبانی‌شده به همان فایل‌های نمایه محدودند؛ `AGENTS.md` در زمینه عادی عامل باقی می‌ماند. زمینه نمایه تزریق‌شده جایگزین `openclaw_agent_consult` برای کارهای فضای‌کاری، حقایق جاری، جست‌وجوی حافظه یا اقدام‌های متکی به ابزار نمی‌شود.
- در حالت بی‌درنگ OpenAI `agent-proxy`، `voice.realtime.requireWakeName: true` را تنظیم کنید تا صدای بی‌درنگ Discord تا زمانی که یک رونویسی با نام بیدارباش شروع یا تمام نشده است ساکت بماند. نام‌های بیدارباش پیکربندی‌شده باید یک یا دو واژه باشند. اگر `voice.realtime.wakeNames` تنظیم نشده باشد، OpenClaw از `name` عامل مسیریابی‌شده به‌همراه `OpenClaw` استفاده می‌کند، و در صورت نبود آن به شناسه عامل به‌همراه `OpenClaw` برمی‌گردد. دروازه‌گذاری با نام بیدارباش، پاسخ خودکار ارائه‌دهنده بی‌درنگ را غیرفعال می‌کند، نوبت‌های پذیرفته‌شده را از مسیر مشورت عامل OpenClaw عبور می‌دهد، و وقتی یک نام بیدارباش ابتدایی از رونویسی جزئی پیش از رسیدن رونویسی نهایی تشخیص داده شود، یک تأیید گفتاری کوتاه می‌دهد.
- ارائه‌دهنده بی‌درنگ OpenAI نام رویدادهای فعلی Realtime 2 و نام‌های مستعار قدیمی سازگار با Codex را برای رویدادهای صوت خروجی و رونویسی می‌پذیرد، بنابراین اسنپ‌شات‌های سازگار ارائه‌دهنده می‌توانند بدون حذف صدای دستیار دچار تغییر شوند.
- `voice.realtime.bargeIn` کنترل می‌کند که آیا رویدادهای شروع گوینده Discord پخش بی‌درنگ فعال را قطع کنند یا نه. اگر تنظیم‌نشده باشد، از تنظیم وقفه صوت ورودی ارائه‌دهنده بی‌درنگ پیروی می‌کند.
- `voice.realtime.minBargeInAudioEndMs` حداقل مدت پخش دستیار پیش از آن را کنترل می‌کند که یک ورود میانی بی‌درنگ OpenAI صدا را کوتاه کند. پیش‌فرض: `250`. برای وقفه فوری در اتاق‌های با پژواک کم، `0` را تنظیم کنید، یا برای چیدمان‌های بلندگوی دارای پژواک زیاد آن را افزایش دهید.
- برای یک صدای OpenAI روی پخش Discord، `voice.tts.provider: "openai"` را تنظیم کنید و زیر `voice.tts.providers.openai.speakerVoice` یک صدای Text-to-speech انتخاب کنید. `cedar` روی مدل TTS فعلی OpenAI انتخاب خوبی با صدایی مردانه است.
- بازنویسی‌های `systemPrompt` هر کانال Discord روی نوبت‌های رونویسی صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونویسی صوتی وضعیت مالک را برای فرمان‌های محدود به مالک و اقدام‌های کانال از `allowFrom` در Discord (یا `dm.allowFrom`) به‌دست می‌آورند. نمایانی ابزار عامل از سیاست ابزار پیکربندی‌شده برای نشست مسیریابی‌شده پیروی می‌کند.
- صدای Discord برای پیکربندی‌های فقط متنی اختیاری است؛ برای فعال‌کردن فرمان‌های `/vc`، زمان‌اجرای صوتی، و intent مربوط به Gateway با نام `GuildVoiceStates`، `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صدا را صریحاً بازنویسی کند. برای اینکه intent از فعال‌سازی مؤثر صدا پیروی کند، آن را تنظیم‌نشده بگذارید.
- اگر `voice.autoJoin` چند ورودی برای یک guild داشته باشد، OpenClaw به آخرین کانال پیکربندی‌شده برای آن guild می‌پیوندد.
- `voice.allowedChannels` یک allowlist اقامت اختیاری است. برای اجازه‌دادن به `/vc join` برای ورود به هر کانال صوتی مجاز Discord، آن را تنظیم‌نشده بگذارید. وقتی تنظیم شود، `/vc join`، پیوستن خودکار هنگام راه‌اندازی، و جابه‌جایی‌های وضعیت صوتی بات به ورودی‌های فهرست‌شده `{ guildId, channelId }` محدود می‌شوند. برای رد همه پیوستن‌های صوتی Discord، آن را روی آرایه خالی تنظیم کنید. اگر Discord بات را به خارج از allowlist منتقل کند، OpenClaw آن کانال را ترک می‌کند و وقتی هدف پیوستن خودکار پیکربندی‌شده‌ای در دسترس باشد، دوباره به آن می‌پیوندد.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های پیوستن `@discordjs/voice` منتقل می‌شوند.
- پیش‌فرض‌های `@discordjs/voice` در صورت تنظیم‌نشدن، `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- OpenClaw از کدک همراه `libopus-wasm` برای دریافت صدای Discord و پخش PCM خام بی‌درنگ استفاده می‌کند. این کدک یک ساخت WebAssembly سنجاق‌شده libopus را ارسال می‌کند و به افزونه‌های opus بومی نیاز ندارد.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای `/vc join` و تلاش‌های پیوستن خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw پس از قطع یک نشست صوتی، پیش از نابودکردن آن، چه مدت منتظر شروع اتصال دوباره بماند. پیش‌فرض: `15000`.
- در حالت `stt-tts`، پخش صدا صرفاً به‌خاطر شروع صحبت کاربر دیگر متوقف نمی‌شود. برای جلوگیری از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS ضبط صدای جدید را نادیده می‌گیرد؛ برای نوبت بعدی پس از پایان پخش صحبت کنید. حالت‌های بی‌درنگ شروع گوینده را به‌عنوان سیگنال‌های ورود میانی به ارائه‌دهنده بی‌درنگ ارسال می‌کنند.
- در حالت‌های بی‌درنگ، پژواک بلندگوها در یک میکروفون باز می‌تواند شبیه ورود میانی به‌نظر برسد و پخش را قطع کند. برای اتاق‌های Discord با پژواک زیاد، `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید تا OpenAI به‌طور خودکار با صوت ورودی وقفه ایجاد نکند. اگر همچنان می‌خواهید رویدادهای شروع گوینده Discord پخش فعال را قطع کنند، `voice.realtime.bargeIn: true` را اضافه کنید. پل بی‌درنگ OpenAI کوتاه‌سازی‌های پخش کوتاه‌تر از `voice.realtime.minBargeInAudioEndMs` را به‌عنوان پژواک/نویز محتمل نادیده می‌گیرد و به‌جای پاک‌کردن پخش Discord، آن‌ها را به‌عنوان ردشده ثبت می‌کند.
- `voice.captureSilenceGraceMs` کنترل می‌کند OpenClaw پس از گزارش Discord مبنی بر توقف یک گوینده، چه مدت پیش از نهایی‌کردن آن قطعه صوتی برای STT صبر کند. پیش‌فرض: `2000`؛ اگر Discord مکث‌های عادی را به رونویسی‌های جزئی بریده‌بریده تقسیم می‌کند، این مقدار را افزایش دهید.
- وقتی ElevenLabs ارائه‌دهنده TTS انتخاب‌شده باشد، پخش صدای Discord از TTS جریانی استفاده می‌کند و از جریان پاسخ ارائه‌دهنده شروع می‌شود. ارائه‌دهندگان بدون پشتیبانی جریان به مسیر فایل موقت سنتز‌شده برمی‌گردند.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را پایش می‌کند و پس از خطاهای تکراری در یک پنجره کوتاه، با ترک و پیوستن دوباره به کانال صوتی، خودکار بازیابی می‌شود.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت مکرراً `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح padding بالادستی از PR شماره #11449 در discord.js است که issue شماره #11419 در discord.js را بست.
- رویدادهای دریافت `The operation was aborted` زمانی که OpenClaw یک قطعه گوینده ضبط‌شده را نهایی می‌کند مورد انتظارند؛ آن‌ها عیب‌یابی‌های پرجزئیات هستند، نه هشدار.
- لاگ‌های پرجزئیات صدای Discord برای هر قطعه گوینده پذیرفته‌شده، یک پیش‌نمایش محدود و تک‌خطی از رونویسی STT دارند، بنابراین اشکال‌زدایی هم سمت کاربر و هم سمت پاسخ عامل را بدون بیرون‌ریختن متن رونویسی نامحدود نشان می‌دهد.
- در حالت `agent-proxy`، fallback مشورت اجباری قطعه‌های رونویسی احتمالاً ناقص را نادیده می‌گیرد؛ مانند متنی که به `...` ختم می‌شود یا یک اتصال‌دهنده پایانی مثل `and` دارد، به‌علاوه پایان‌بندی‌های آشکارا غیرقابل‌اقدام مانند “be right back” یا “bye”. وقتی این کار از یک پاسخ صف‌شده کهنه جلوگیری کند، لاگ‌ها `forced agent consult skipped reason=...` را نشان می‌دهند.

### دنبال‌کردن کاربران در صدا

وقتی می‌خواهید بات صوتی Discord به‌جای پیوستن به یک کانال ثابت هنگام راه‌اندازی یا منتظرماندن برای `/vc join`، همراه یک یا چند کاربر شناخته‌شده Discord بماند، از `voice.followUsers` استفاده کنید.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

رفتار:

- `followUsers` شناسه‌های خام کاربر Discord و مقدارهای `discord:<id>` را می‌پذیرد. OpenClaw پیش از تطبیق رویدادهای وضعیت صدا، هر دو قالب را نرمال‌سازی می‌کند.
- وقتی `followUsers` پیکربندی شده باشد، پیش‌فرض `followUsersEnabled` برابر `true` است. برای نگه‌داشتن فهرست ذخیره‌شده اما توقف دنبال‌کردن خودکار صدا، آن را روی `false` تنظیم کنید.
- وقتی کاربر دنبال‌شده به یک کانال صوتی مجاز می‌پیوندد، OpenClaw به آن کانال می‌پیوندد. وقتی کاربر جابه‌جا می‌شود، OpenClaw همراه او جابه‌جا می‌شود. وقتی کاربر دنبال‌شده فعال قطع اتصال می‌کند، OpenClaw خارج می‌شود.
- اگر چند کاربر دنبال‌شده در یک guild باشند و کاربر دنبال‌شده فعال خارج شود، OpenClaw پیش از ترک guild به کانال کاربر دنبال‌شده ردیابی‌شده دیگری منتقل می‌شود. اگر چند کاربر دنبال‌شده هم‌زمان جابه‌جا شوند، آخرین رویداد وضعیت صوتی مشاهده‌شده برنده است.
- `allowedChannels` همچنان اعمال می‌شود. کاربر دنبال‌شده در کانال غیرمجاز نادیده گرفته می‌شود، و یک نشست متعلق به دنبال‌کردن به کاربر دنبال‌شده دیگری منتقل می‌شود یا خارج می‌شود.
- OpenClaw رویدادهای وضعیت صوتی ازدست‌رفته را هنگام راه‌اندازی و در یک بازه محدود همگام‌سازی می‌کند. همگام‌سازی از guildهای پیکربندی‌شده نمونه‌برداری می‌کند و تعداد جست‌وجوهای REST را در هر اجرا محدود می‌کند، بنابراین فهرست‌های بسیار بزرگ `followUsers` ممکن است برای همگراشدن به بیش از یک بازه نیاز داشته باشند.
- اگر Discord یا یک مدیر، بات را درحالی‌که کاربری را دنبال می‌کند جابه‌جا کند، OpenClaw نشست صوتی را بازسازی می‌کند و وقتی مقصد مجاز باشد مالکیت دنبال‌کردن را حفظ می‌کند. اگر بات به خارج از `allowedChannels` منتقل شود، OpenClaw خارج می‌شود و وقتی هدف پیکربندی‌شده‌ای وجود داشته باشد دوباره به آن می‌پیوندد.
- بازیابی دریافت DAVE ممکن است پس از خطاهای رمزگشایی تکراری، همان کانال را ترک کند و دوباره به آن بپیوندد. نشست‌های متعلق به دنبال‌کردن در این مسیر بازیابی مالکیت دنبال‌کردن خود را حفظ می‌کنند، بنابراین قطع اتصال بعدی کاربر دنبال‌شده همچنان کانال را ترک می‌کند.

بین حالت‌های پیوستن انتخاب کنید:

- برای چیدمان‌های شخصی یا اپراتوری که بات باید هنگام حضور شما در صدا به‌طور خودکار در صدا باشد، از `followUsers` استفاده کنید.
- برای بات‌های اتاق ثابت که حتی وقتی هیچ کاربر ردیابی‌شده‌ای در صدا نیست باید حاضر باشند، از `autoJoin` استفاده کنید.
- برای پیوستن‌های موردی یا اتاق‌هایی که حضور صوتی خودکار غافلگیرکننده خواهد بود، از `/vc join` استفاده کنید.

کدک صدای Discord:

- لاگ‌های دریافت صوت نشان می‌دهند `discord voice: opus decoder: libopus-wasm`.
- پخش بلادرنگ، PCM خام استریوی 48 kHz را پیش از تحویل بسته‌ها به `@discordjs/voice`، با همان بستهٔ همراه `libopus-wasm` به Opus کدگذاری می‌کند.
- پخش فایل و جریانِ provider با ffmpeg به PCM خام استریوی 48 kHz تبدیل می‌شود، سپس برای جریان بستهٔ Opus که به Discord فرستاده می‌شود از `libopus-wasm` استفاده می‌کند.

خط لولهٔ STT به‌همراه TTS:

- دریافت PCM از Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` مدیریت STT را انجام می‌دهد، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونوشت از مسیر ورودی و مسیریابی Discord عبور داده می‌شود، در حالی که LLM پاسخ با سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و متن بازگشتی می‌خواهد، چون صوت Discord مالک پخش نهایی TTS است.
- `voice.model`، وقتی تنظیم شده باشد، فقط LLM پاسخ را برای این نوبتِ کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ providerهای دارای قابلیت جریان‌دهی مستقیماً player را تغذیه می‌کنند، وگرنه فایل صوتی حاصل در کانال ملحق‌شده پخش می‌شود.

نمونهٔ نشست کانال صوتی پیش‌فرض agent-proxy:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

بدون بلوک `voice.agentSession`، هر کانال صوتی نشست مسیریابی‌شدهٔ OpenClaw خودش را دریافت می‌کند. برای مثال، `/vc join channel:234567890123456789` با نشست همان کانال صوتی Discord صحبت می‌کند. مدل بلادرنگ فقط پیشانهٔ صوتی است؛ درخواست‌های اصلی به عامل OpenClaw پیکربندی‌شده تحویل داده می‌شوند. اگر مدل بلادرنگ بدون فراخوانی ابزار مشورت، رونوشت نهایی تولید کند، OpenClaw مشورت را به‌عنوان fallback اجباری می‌کند تا پیش‌فرض همچنان مانند صحبت با عامل رفتار کند.

نمونهٔ قدیمی STT به‌همراه TTS:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

نمونهٔ bidi بلادرنگ:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

صوت به‌عنوان افزونهٔ یک نشست کانال Discord موجود:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

در حالت `agent-proxy`، ربات به کانال صوتی پیکربندی‌شده ملحق می‌شود، اما نوبت‌های عامل OpenClaw از نشست و عامل مسیریابی‌شدهٔ عادیِ کانال هدف استفاده می‌کنند. نشست صوتی بلادرنگ نتیجهٔ بازگشتی را دوباره در کانال صوتی می‌گوید. عامل ناظر همچنان می‌تواند مطابق سیاست ابزار خود از ابزارهای پیام عادی استفاده کند، از جمله ارسال یک پیام جداگانه در Discord اگر آن اقدام درست باشد.

وقتی یک اجرای واگذارشدهٔ OpenClaw فعال است، رونوشت‌های صوتی جدید Discord پیش از شروع نوبت عامل دیگر، به‌عنوان کنترل اجرای زنده پردازش می‌شوند. عبارت‌هایی مانند "status"، "cancel that"، "use the smaller fix"، یا "when you're done also check tests" به‌عنوان وضعیت، لغو، هدایت، یا ورودی پیگیری برای نشست فعال طبقه‌بندی می‌شوند. نتیجه‌های وضعیت، لغو، هدایت پذیرفته‌شده، و پیگیری در کانال صوتی گفته می‌شوند تا تماس‌گیرنده بداند OpenClaw درخواست را مدیریت کرده است یا نه.

شکل‌های هدف مفید:

- `target: "channel:123456789012345678"` از طریق نشست کانال متنی Discord مسیریابی می‌شود.
- `target: "123456789012345678"` به‌عنوان هدف کانال پردازش می‌شود.
- `target: "dm:123456789012345678"` یا `target: "user:123456789012345678"` از طریق نشست پیام مستقیم همان کاربر مسیریابی می‌شود.

نمونهٔ OpenAI Realtime با اکو زیاد:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

وقتی مدل پخش خودش در Discord را از طریق میکروفون باز می‌شنود، اما همچنان می‌خواهید با صحبت کردن آن را قطع کنید، از این استفاده کنید. OpenClaw جلوی قطع خودکار OpenAI بر اساس صوت ورودی خام را می‌گیرد، در حالی که `bargeIn: true` اجازه می‌دهد رویدادهای شروع گوینده در Discord و صوت گوینده‌ای که از قبل فعال است، پاسخ‌های بلادرنگ فعال را پیش از رسیدن نوبت ضبط‌شدهٔ بعدی به OpenAI لغو کنند. سیگنال‌های بسیار زودهنگام ورود با `audioEndMs` کمتر از `minBargeInAudioEndMs` به‌عنوان اکو/نویز احتمالی در نظر گرفته و نادیده گرفته می‌شوند تا مدل در اولین فریم پخش قطع نشود.

لاگ‌های صوتی مورد انتظار:

- هنگام پیوستن: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- هنگام شروع بلادرنگ: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- هنگام صوت گوینده: `discord voice: realtime speaker turn opened ...`، `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`، و `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- هنگام گفتار کهنهٔ نادیده‌گرفته‌شده: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` یا `reason=non-actionable-closing ...`
- هنگام تکمیل پاسخ بلادرنگ: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- هنگام توقف/بازنشانی پخش: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- هنگام مشورت بلادرنگ: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- هنگام پاسخ عامل: `discord voice: agent turn answer ...`
- هنگام گفتار دقیق در صف: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، سپس `discord voice: realtime exact speech dequeued reason=player-idle ...`
- هنگام تشخیص ورود: `discord voice: realtime barge-in detected source=speaker-start ...` یا `discord voice: realtime barge-in detected source=active-speaker-audio ...`، سپس `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- هنگام وقفهٔ بلادرنگ: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، سپس یا `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` یا `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- هنگام اکو/نویز نادیده‌گرفته‌شده: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- هنگام غیرفعال بودن ورود: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- هنگام پخش بیکار: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

برای اشکال‌زدایی صوت قطع‌شده، لاگ‌های صوتی بلادرنگ را مانند یک خط زمانی بخوانید:

1. `realtime audio playback started` یعنی Discord شروع به پخش صوت دستیار کرده است. پل از همین نقطه شمردن قطعه‌های خروجی دستیار، بایت‌های PCM Discord، بایت‌های بلادرنگ provider، و مدت صوت سنتزشده را شروع می‌کند.
2. `realtime speaker turn opened` فعال شدن یک گویندهٔ Discord را مشخص می‌کند. اگر پخش از قبل فعال باشد و `bargeIn` فعال شده باشد، ممکن است پس از آن `barge-in detected source=speaker-start` بیاید.
3. `realtime input audio started` اولین فریم صوتی واقعیِ دریافت‌شده برای آن نوبت گوینده را مشخص می‌کند. `outputActive=true` یا یک `outputAudioMs` غیرصفر در اینجا یعنی میکروفون در حالی ورودی می‌فرستد که پخش دستیار هنوز فعال است.
4. `barge-in detected source=active-speaker-audio` یعنی OpenClaw هنگام فعال بودن پخش دستیار، صوت زندهٔ گوینده را دیده است. این برای تشخیص یک وقفهٔ واقعی از رویداد شروع گویندهٔ Discord بدون صوت مفید، کاربرد دارد.
5. `barge-in requested reason=...` یعنی OpenClaw از provider بلادرنگ خواسته است پاسخ فعال را لغو یا کوتاه کند. این شامل `outputAudioMs`، `outputActive`، و `playbackChunks` است تا بتوانید ببینید پیش از وقفه واقعاً چه مقدار صوت دستیار پخش شده بود.
6. `realtime audio playback stopped reason=...` نقطهٔ بازنشانی پخش محلی Discord است. دلیل نشان می‌دهد چه کسی پخش را متوقف کرده است: `barge-in`، `player-idle`، `provider-clear-audio`، `forced-agent-consult`، `stream-close`، یا `session-close`.
7. `realtime speaker turn closed` نوبت ورودی ضبط‌شده را خلاصه می‌کند. `chunks=0` یا `hasAudio=false` یعنی نوبت گوینده باز شد اما هیچ صوت قابل استفاده‌ای به پل بلادرنگ نرسید. `interruptedPlayback=true` یعنی آن نوبت ورودی با خروجی دستیار هم‌پوشانی داشت و منطق ورود را فعال کرد.

فیلدهای مفید:

- `outputAudioMs`: مدت صوت دستیار که پیش از خط لاگ توسط provider بلادرنگ تولید شده است.
- `audioMs`: مدت صوت دستیار که OpenClaw پیش از توقف پخش شمرده است.
- `elapsedMs`: زمان ساعت دیواری بین باز کردن و بستن جریان پخش یا نوبت گوینده.
- `discordBytes`: بایت‌های PCM استریوی 48 kHz که به صوت Discord فرستاده یا از آن دریافت شده‌اند.
- `realtimeBytes`: بایت‌های PCM با قالب provider که به provider بلادرنگ فرستاده یا از آن دریافت شده‌اند.
- `playbackChunks`: قطعه‌های صوتی دستیار که برای پاسخ فعال به Discord ارسال شده‌اند.
- `sinceLastAudioMs`: فاصلهٔ بین آخرین فریم صوتی ضبط‌شدهٔ گوینده و بسته شدن نوبت گوینده.

الگوهای رایج:

- قطع فوری با `source=active-speaker-audio`، مقدار کم `outputAudioMs`، و همان کاربر در نزدیکی معمولاً به ورود اکوی بلندگو به میکروفون اشاره دارد. `voice.realtime.minBargeInAudioEndMs` را افزایش دهید، صدای بلندگو را کم کنید، از هدفون استفاده کنید، یا `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید.
- `source=speaker-start` و سپس `speaker turn closed ... hasAudio=false` یعنی Discord شروع گوینده را گزارش کرده اما هیچ صوتی به OpenClaw نرسیده است. این می‌تواند یک رویداد گذرای صوتی Discord، رفتار دروازهٔ نویز، یا روشن شدن بسیار کوتاه میکروفون از طرف کلاینت باشد.
- `audio playback stopped reason=stream-close` بدون ورود نزدیک یا `provider-clear-audio` یعنی جریان پخش محلی Discord به‌طور غیرمنتظره پایان یافته است. لاگ‌های قبلی provider و player مربوط به Discord را بررسی کنید.
- `capture ignored during playback (barge-in disabled)` یعنی OpenClaw عمداً ورودی را هنگام فعال بودن صوت دستیار حذف کرده است. اگر می‌خواهید گفتار پخش را قطع کند، `voice.realtime.bargeIn` را فعال کنید.
- `barge-in ignored ... outputActive=false` یعنی Discord یا VAD provider گفتار را گزارش کرده، اما OpenClaw هیچ پخش فعالی برای قطع کردن نداشته است. این نباید صوت را قطع کند.

اعتبارنامه‌ها برای هر مؤلفه جداگانه resolve می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، احراز هویت TTS برای `messages.tts`/`voice.tts`، و احراز هویت provider بلادرنگ برای `voice.realtime.providers` یا پیکربندی عادی احراز هویت همان provider.

### پیام‌های صوتی

پیام‌های صوتی Discord پیش‌نمایش موج صوتی نشان می‌دهند و به صوت OGG/Opus نیاز دارند. OpenClaw موج صوتی را خودکار تولید می‌کند، اما برای بازرسی و تبدیل به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord پیام متنی + پیام صوتی را در یک payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="از intents غیرمجاز استفاده شده یا ربات پیام‌های guild را نمی‌بیند">

    - Message Content Intent را فعال کنید
    - وقتی به حل‌وفصل کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intents، gateway را بازراه‌اندازی کنید

  </Accordion>

  <Accordion title="پیام‌های guild به‌طور غیرمنتظره مسدود شده‌اند">

    - `groupPolicy` را بررسی کنید
    - allowlist گیلد را زیر `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` برای گیلد وجود دارد، فقط کانال‌های فهرست‌شده مجاز هستند
    - رفتار `requireMention` و الگوهای mention را بررسی کنید

    بررسی‌های مفید:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention برابر false است اما همچنان مسدود می‌شود">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون allowlist مطابق برای گیلد/کانال
    - `requireMention` در جای اشتباه پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی کانال باشد)
    - فرستنده توسط allowlist `users` در سطح گیلد/کانال مسدود شده است

  </Accordion>

  <Accordion title="turnهای طولانی Discord یا پاسخ‌های تکراری">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    کلیدهای تنظیم صف Discord gateway:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener در Discord gateway را کنترل می‌کند، نه طول عمر turn عامل را

    Discord هیچ timeout متعلق به کانال را روی turnهای صف‌شده عامل اعمال نمی‌کند. listenerهای پیام بلافاصله واگذار می‌کنند، و اجراهای صف‌شده Discord ترتیب هر نشست را تا زمانی که چرخه عمر نشست/ابزار/runtime کامل شود یا کار را لغو کند حفظ می‌کنند.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="هشدارهای timeout در lookup فراداده Gateway">
    OpenClaw پیش از اتصال، فراداده `/gateway/bot` مربوط به Discord را دریافت می‌کند. خرابی‌های گذرا به URL پیش‌فرض gateway Discord برمی‌گردند و در لاگ‌ها rate-limit می‌شوند.

    کلیدهای تنظیم timeout فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback محیطی وقتی config تنظیم نشده باشد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، بیشینه: `120000`

  </Accordion>

  <Accordion title="بازراه‌اندازی‌های timeout برای Gateway READY">
    OpenClaw هنگام راه‌اندازی و پس از اتصال دوباره runtime منتظر رویداد `READY` در gateway Discord می‌ماند. راه‌اندازی‌های چندحسابی با stagger در شروع می‌توانند به پنجره READY طولانی‌تری نسبت به پیش‌فرض نیاز داشته باشند.

    کلیدهای تنظیم timeout برای READY:

    - راه‌اندازی تک‌حساب: `channels.discord.gatewayReadyTimeoutMs`
    - راه‌اندازی چندحساب: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback محیطی راه‌اندازی وقتی config تنظیم نشده باشد: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض راه‌اندازی: `15000` (۱۵ ثانیه)، بیشینه: `120000`
    - runtime تک‌حساب: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime چندحساب: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback محیطی runtime وقتی config تنظیم نشده باشد: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض runtime: `30000` (۳۰ ثانیه)، بیشینه: `120000`

  </Accordion>

  <Accordion title="ناسازگاری‌های ممیزی مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای IDهای عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق runtime همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را کامل تأیید کند.

  </Accordion>

  <Accordion title="مشکلات DM و pairing">

    - DM غیرفعال است: `channels.discord.dm.enabled=false`
    - سیاست DM غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در حالت `pairing` در انتظار تأیید pairing است

  </Accordion>

  <Accordion title="حلقه‌های ربات به ربات">
    به‌طور پیش‌فرض پیام‌های ساخته‌شده توسط ربات نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قواعد mention و allowlist سخت‌گیرانه استفاده کنید.
    ترجیحاً از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های رباتی پذیرفته شوند که ربات را mention می‌کنند.

    OpenClaw همچنین [محافظت در برابر حلقه ربات](/fa/channels/bot-loop-protection) مشترک را ارائه می‌کند. هر زمان `allowBots` اجازه دهد پیام‌های ساخته‌شده توسط ربات به dispatch برسند، Discord رویداد ورودی را به facts مربوط به `(account, channel, bot pair)` نگاشت می‌کند و guard عمومی pair پس از عبور pair از بودجه رویداد پیکربندی‌شده، آن را سرکوب می‌کند. این guard از حلقه‌های مهارنشدنی دو ربات که پیش‌تر باید با rate limitهای Discord متوقف می‌شدند جلوگیری می‌کند؛ روی استقرارهای تک‌ربات یا پاسخ‌های یک‌باره ربات که زیر بودجه می‌مانند اثری ندارد.

    تنظیمات پیش‌فرض (وقتی `allowBots` تنظیم شده باشد فعال است):

    - `maxEventsPerWindow: 20` -- pair ربات می‌تواند در پنجره لغزان ۲۰ پیام مبادله کند
    - `windowSeconds: 60` -- طول پنجره لغزان
    - `cooldownSeconds: 60` -- پس از عبور از بودجه، هر پیام اضافی ربات به ربات در هر جهت به مدت یک دقیقه حذف می‌شود

    پیش‌فرض مشترک را یک‌بار زیر `channels.defaults.botLoopProtection` پیکربندی کنید، سپس وقتی یک workflow معتبر به ظرفیت بیشتری نیاز دارد، Discord را override کنید. اولویت چنین است:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - پیش‌فرض‌های داخلی

    Discord از کلیدهای عمومی `maxEventsPerWindow`، `windowSeconds` و `cooldownSeconds` استفاده می‌کند.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="افت Voice STT با DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صوت Discord موجود باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض upstream) شروع کنید و فقط در صورت نیاز تنظیمش کنید
    - لاگ‌ها را برای این موارد زیر نظر بگیرید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر خرابی‌ها پس از rejoin خودکار ادامه داشتند، لاگ‌ها را جمع‌آوری کنید و با تاریخچه دریافت upstream DAVE در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای مهم Discord">

- راه‌اندازی/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- سیاست: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- فرمان: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجه listener)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (نام مستعار قدیمی: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش دوباره: `mediaMaxMb` (آپلودهای خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`)، `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ویژگی‌ها: `threadBindings`, سطح‌بالا `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- با tokenهای ربات مانند secrets رفتار کنید (`DISCORD_BOT_TOKEN` در محیط‌های تحت نظارت ترجیح داده می‌شود).
- کمترین مجوزهای لازم Discord را اعطا کنید.
- اگر deploy/state فرمان کهنه است، gateway را بازراه‌اندازی کنید و دوباره با `openclaw channels status --probe` بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را به gateway pair کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار گفت‌وگوی گروهی و allowlist.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها هدایت کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    گیلدها و کانال‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="فرمان‌های Slash" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان native.
  </Card>
</CardGroup>
