---
read_when:
    - در حال کار روی قابلیت‌های کانال Discord
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Discord
title: Discord
x-i18n:
    generated_at: "2026-06-30T14:12:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74244c721bfd752bf4ce73a6739503c902a14d07edef5ca6300c87f717669a7e
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های مستقیم و کانال‌های سرور از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Discord به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="دستورهای Slash" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و کاتالوگ دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    جریان عیب‌یابی و تعمیر میان‌کانالی.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید با یک بات بسازید، بات را به سرور خود اضافه کنید، و آن را با OpenClaw جفت کنید. توصیه می‌کنیم بات را به سرور خصوصی خودتان اضافه کنید. اگر هنوز سرور ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="ساخت یک برنامه و بات Discord">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را روی هر نامی که برای عامل OpenClaw خود می‌گذارید تنظیم کنید.

  </Step>

  <Step title="فعال‌کردن intentهای دارای امتیاز ویژه">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **Message Content Intent** (الزامی)
    - **Server Members Intent** (توصیه‌شده؛ برای فهرست‌های مجاز نقش و تطبیق نام به شناسه الزامی است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="کپی‌کردن توکن بات">
    در صفحه **Bot** دوباره به بالا بروید و روی **Reset Token** کلیک کنید.

    <Note>
    با وجود نامش، این کار اولین توکن شما را تولید می‌کند — چیزی «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی کنید و جایی ذخیره کنید. این **Bot Token** شماست و به‌زودی به آن نیاز دارید.

  </Step>

  <Step title="ساخت URL دعوت و اضافه‌کردن بات به سرورتان">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست برای اضافه‌کردن بات به سرورتان می‌سازید.

    به پایین تا **OAuth2 URL Generator** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    بخش **Bot Permissions** در پایین ظاهر می‌شود. حداقل این موارد را فعال کنید:

    **مجوزهای عمومی**
      - مشاهده کانال‌ها

    **مجوزهای متنی**
      - ارسال پیام‌ها
      - خواندن تاریخچه پیام‌ها
      - جاسازی پیوندها
      - پیوست‌کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعه پایه برای کانال‌های متنی معمولی است. اگر قصد دارید در threadهای Discord پست بگذارید، از جمله جریان‌های کاری کانال انجمن یا رسانه که یک thread ایجاد می‌کنند یا ادامه می‌دهند، **Send Messages in Threads** را هم فعال کنید.
    URL تولیدشده در پایین را کپی کنید، آن را در مرورگر خود جای‌گذاری کنید، سرورتان را انتخاب کنید، و برای اتصال روی **Continue** کلیک کنید. اکنون باید بات خود را در سرور Discord ببینید.

  </Step>

  <Step title="فعال‌کردن Developer Mode و جمع‌آوری شناسه‌ها">
    در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **User Settings** کلیک کنید (آیکون چرخ‌دنده کنار تصویر نمایه‌تان) → در نوار کناری تا **Developer** بروید → **Developer Mode** را روشن کنید

        *(یادداشت: در برنامه موبایل Discord، Developer Mode زیر **App Settings** → **Advanced** قرار دارد)*

    2. روی **آیکون سرور** خود در نوار کناری راست‌کلیک کنید → **Copy Server ID**
    3. روی **تصویر نمایه خودتان** راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را کنار Bot Token ذخیره کنید — در گام بعدی هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="اجازه‌دادن به پیام‌های مستقیم از اعضای سرور">
    برای اینکه جفت‌سازی کار کند، Discord باید به بات شما اجازه دهد به شما پیام مستقیم بفرستد. روی **آیکون سرور** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار به اعضای سرور (از جمله بات‌ها) اجازه می‌دهد به شما پیام مستقیم بفرستند. اگر می‌خواهید از پیام‌های مستقیم Discord با OpenClaw استفاده کنید، این گزینه را روشن نگه دارید. اگر فقط قصد دارید از کانال‌های سرور استفاده کنید، می‌توانید بعد از جفت‌سازی پیام‌های مستقیم را غیرفعال کنید.

  </Step>

  <Step title="تنظیم امن توکن بات (آن را در چت نفرستید)">
    توکن بات Discord شما یک راز است (مثل گذرواژه). پیش از پیام‌دادن به عامل خود، آن را روی ماشینی که OpenClaw را اجرا می‌کند تنظیم کنید.

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

    اگر OpenClaw از قبل به‌عنوان سرویس پس‌زمینه اجرا می‌شود، آن را از طریق برنامه OpenClaw Mac یا با متوقف‌کردن و راه‌اندازی دوباره فرایند `openclaw gateway run` راه‌اندازی مجدد کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از شلی اجرا کنید که `DISCORD_BOT_TOKEN` در آن موجود است، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس بتواند SecretRef محیطی را پس از راه‌اندازی مجدد resolve کند.
    اگر میزبان شما توسط جست‌وجوی برنامه هنگام شروع Discord مسدود یا rate-limit شده است، شناسه برنامه/کلاینت Discord را از Developer Portal تنظیم کنید تا شروع کار بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند بات Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="پیکربندی OpenClaw و جفت‌سازی">

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        با عامل OpenClaw خود در هر کانال موجود (مثلاً Telegram) چت کنید و به آن بگویید. اگر Discord اولین کانال شماست، به‌جای آن از زبانه CLI / پیکربندی استفاده کنید.

        > «من توکن بات Discord خود را از قبل در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با User ID `<user_id>` و Server ID `<server_id>` کامل کن.»
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

        fallback محیط برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا از راه دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس بدون `--dry-run` دوباره اجرا کنید. مقدارهای متن ساده `token` پشتیبانی می‌شوند. مقدارهای SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند بات Discord، هر توکن بات و شناسه برنامه را زیر حساب خودش نگه دارید. یک `channels.discord.applicationId` سطح بالا توسط حساب‌ها به ارث برده می‌شود، پس فقط وقتی آن را آنجا تنظیم کنید که همه حساب‌ها باید از همان شناسه برنامه استفاده کنند.

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
    صبر کنید تا Gateway در حال اجرا باشد، سپس در Discord به بات خود پیام مستقیم بدهید. بات با یک کد جفت‌سازی پاسخ می‌دهد.

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
resolve توکن نسبت به حساب آگاه است. مقدارهای توکن پیکربندی بر fallback محیطی اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب Discord فعال به همان توکن بات resolve شوند، OpenClaw فقط یک ناظر Gateway برای آن توکن شروع می‌کند. توکنی که از پیکربندی آمده باشد بر fallback محیط پیش‌فرض اولویت دارد؛ در غیر این صورت اولین حساب فعال برنده می‌شود و حساب تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار پیام/کنش‌های کانال)، یک `token` صریح برای همان فراخوانی استفاده می‌شود. این موضوع برای کنش‌های ارسال و خواندن/سبک probe اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات سیاست حساب/تلاش مجدد همچنان از حساب انتخاب‌شده در snapshot زمان اجرای فعال می‌آیند.
</Note>

## توصیه‌شده: راه‌اندازی یک فضای کاری سرور

پس از اینکه پیام‌های مستقیم کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال نشست عامل خودش را با زمینه خودش دریافت می‌کند. این برای سرورهای خصوصی که فقط شما و باتتان در آن هستید توصیه می‌شود.

<Steps>
  <Step title="اضافه‌کردن سرورتان به فهرست مجاز سرور">
    این کار به عامل شما امکان می‌دهد در هر کانالی روی سرورتان پاسخ دهد، نه فقط در پیام‌های مستقیم.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «Server ID Discord من، `<server_id>`، را به فهرست مجاز سرور اضافه کن»
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

  <Step title="اجازه‌دادن به پاسخ‌ها بدون @mention">
    به‌طور پیش‌فرض، عامل شما در کانال‌های سرور فقط وقتی پاسخ می‌دهد که @mention شده باشد. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های سرور، پاسخ‌های عادی به‌طور پیش‌فرض خودکار پست می‌شوند. برای اتاق‌های مشترک همیشه‌روشن، `messages.groupChat.visibleReplies: "message_tool"` را فعال کنید تا عامل بتواند در پس‌زمینه بماند و فقط وقتی تصمیم گرفت پاسخ کانالی مفید است پست کند. این با مدل‌های نسل جدید و قابل‌اعتماد از نظر ابزار، مثل GPT 5.5، بهترین عملکرد را دارد. رویدادهای محیطی اتاق ساکت می‌مانند مگر اینکه ابزار ارسال کند. برای پیکربندی کامل حالت کمین، [رویدادهای محیطی اتاق](/fa/channels/ambient-room-events) را ببینید.

    اگر Discord وضعیت تایپ را نشان می‌دهد و لاگ‌ها مصرف توکن را نشان می‌دهند اما هیچ پیامی پست نشده است، بررسی کنید آیا turn به‌عنوان رویداد محیطی اتاق پیکربندی شده یا پاسخ‌های قابل‌مشاهده ابزار پیام فعال شده‌اند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «به عامل من اجازه بده بدون اینکه لازم باشد @mention شود، روی این سرور پاسخ دهد»
      </Tab>
      <Tab title="پیکربندی">
        در پیکربندی سرور خود `requireMention: false` را تنظیم کنید:

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

        برای الزام ارسال‌های ابزار پیام برای پاسخ‌های قابل‌مشاهده گروه/کانال، `messages.groupChat.visibleReplies: "message_tool"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="برنامه‌ریزی برای حافظه در کانال‌های سرور">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در نشست‌های پیام مستقیم بارگذاری می‌شود. کانال‌های سرور MEMORY.md را خودکار بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر به زمینه بلندمدت از MEMORY.md نیاز داشتی، از memory_search یا memory_get استفاده کن.»
      </Tab>
      <Tab title="دستی">
        اگر در هر کانال به زمینه مشترک نیاز دارید، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` بگذارید (آن‌ها برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال روی سرور Discord خود بسازید و چت را شروع کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال نشست ایزوله خودش را دریافت می‌کند — بنابراین می‌توانید `#coding`، `#home`، `#research`، یا هر چیزی را که با جریان کاری‌تان سازگار است راه‌اندازی کنید.

## مدل زمان اجرا

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord دوباره به Discord برمی‌گردند.
- فراداده‌های guild/channel مربوط به Discord به‌عنوان زمینهٔ غیرقابل‌اعتماد به پرامپت مدل افزوده می‌شوند، نه به‌عنوان پیشوند پاسخ قابل‌مشاهده برای کاربر. اگر مدل آن پوشش را دوباره کپی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از زمینهٔ بازپخش آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، گفت‌وگوهای مستقیم جلسهٔ اصلی عامل را به اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های Guild کلیدهای جلسهٔ جداگانه دارند (`agent:<agentId>:discord:channel:<channelId>`).
- Group DMها به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- دستورهای اسلش بومی در جلسه‌های فرمان جداگانه اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، درحالی‌که همچنان `CommandTargetSessionKey` را به جلسهٔ گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان cron/heartbeat فقط‌متنی به Discord یک‌بار از پاسخ نهایی قابل‌مشاهده برای دستیار استفاده می‌کند. رسانه و payloadهای مؤلفهٔ ساختاریافته وقتی عامل چند payload قابل‌تحویل تولید می‌کند، همچنان چندپیامه باقی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانهٔ Discord فقط پست‌های thread را می‌پذیرند. OpenClaw از دو روش برای ایجاد آن‌ها پشتیبانی می‌کند:

- پیامی به والد انجمن (`channel:<forumId>`) بفرستید تا یک thread به‌صورت خودکار ایجاد شود. عنوان thread از نخستین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ایجاد مستقیم thread استفاده کنید. برای کانال‌های انجمن `--message-id` را ارسال نکنید.

مثال: ارسال به والد انجمن برای ایجاد thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: ایجاد صریح یک thread انجمن

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود thread ارسال کنید (`channel:<threadId>`).

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای مؤلفهٔ v2 متعلق به Discord برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با payload به نام `components` استفاده کنید. نتایج تعامل به‌عنوان پیام‌های ورودی عادی به عامل برگردانده می‌شوند و از تنظیمات موجود Discord برای `replyToMode` پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- ردیف‌های کنش حداکثر ۵ دکمه یا یک منوی انتخاب واحد را مجاز می‌کنند
- انواع انتخاب: `string`، `user`، `role`، `mentionable`، `channel`

به‌طور پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌ها و فرم‌ها تا زمان انقضا چندین بار قابل‌استفاده باشند، `components.reusable=true` را تنظیم کنید.

برای محدودکردن اینکه چه کسی می‌تواند روی دکمه کلیک کند، روی آن دکمه `allowedUsers` را تنظیم کنید (شناسه‌های کاربری Discord، برچسب‌ها، یا `*`). وقتی پیکربندی شده باشد، کاربران نامنطبق یک رد موقتی دریافت می‌کنند.

callbackهای مؤلفه به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند. برای تغییر عمر رجیستری callback برای حساب پیش‌فرض Discord، `channels.discord.agentComponents.ttlMs` را تنظیم کنید، یا برای override کردن یک حساب در راه‌اندازی چندحسابی از `channels.discord.accounts.<accountId>.agentComponents.ttlMs` استفاده کنید. مقدار برحسب میلی‌ثانیه است، باید یک عدد صحیح مثبت باشد، و حداکثر آن `86400000` (۲۴ ساعت) است. TTLهای طولانی‌تر برای جریان‌های کاری بازبینی یا تأیید که نیاز دارند دکمه‌ها قابل‌استفاده بمانند مفیدند، اما همچنین بازه‌ای را طولانی‌تر می‌کنند که در آن یک پیام قدیمی Discord هنوز می‌تواند کنشی را فعال کند. کوتاه‌ترین TTL متناسب با جریان کاری را ترجیح دهید، و وقتی callbackهای کهنه غافلگیرکننده خواهند بود مقدار پیش‌فرض را نگه دارید.

دستورهای اسلش `/model` و `/models` یک انتخابگر تعاملی مدل با dropdownهای provider، مدل، و runtime سازگار به‌همراه گام Submit باز می‌کنند. `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از چت، یک پیام منسوخ‌شدن برمی‌گرداند. پاسخ انتخابگر موقتی است و فقط کاربر فراخواننده می‌تواند از آن استفاده کند. منوهای انتخاب Discord به ۲۵ گزینه محدودند، بنابراین وقتی می‌خواهید انتخابگر مدل‌های کشف‌شدهٔ پویا را فقط برای providerهای انتخاب‌شده مانند `openai` یا `vllm` نشان دهد، ورودی‌های `provider/*` را به `agents.defaults.models` اضافه کنید.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` فراهم کنید (یک فایل)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام upload باید با مرجع پیوست مطابق باشد، برای override کردن نام از `filename` استفاده کنید

فرم‌های modal:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- انواع فیلد: `text`، `checkbox`، `radio`، `select`، `role-select`، `user-select`
- OpenClaw به‌صورت خودکار یک دکمهٔ فعال‌ساز اضافه می‌کند

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.discord.allowFrom` allowlist رسمی DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر policy مربوط به DM باز نباشد، کاربران ناشناخته مسدود می‌شوند (یا در حالت `pairing` برای pairing از آن‌ها درخواست می‌شود).

    اولویت چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی اولویت دارد.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب مقصد DM برای تحویل:

    - `user:<id>`
    - mention به‌شکل `<@id>`

    شناسه‌های عددی بدون پیشوند معمولاً وقتی یک پیش‌فرض کانال فعال است به‌عنوان شناسه‌های کانال resolve می‌شوند، اما شناسه‌های فهرست‌شده در `allowFrom` مؤثر DM حساب، برای سازگاری به‌عنوان مقصدهای DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="Access groups">
    مجوزدهی DMهای Discord و فرمان متنی می‌تواند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کند.

    نام‌های گروه دسترسی میان کانال‌های پیام مشترک‌اند. برای یک گروه ایستا که اعضایش در syntax عادی `allowFrom` هر کانال بیان می‌شوند از `type: "message.senders"` استفاده کنید، یا وقتی audience فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کند از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک گروه دسترسی اینجا مستند شده است: [گروه‌های دسترسی](/fa/channels/access-groups).

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

    یک کانال متنی Discord فهرست عضو جداگانه‌ای ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستندهٔ DM عضو guild پیکربندی‌شده است و پس از اعمال roleها و overrideهای کانال، درحال‌حاضر مجوز مؤثر `ViewChannel` روی کانال پیکربندی‌شده دارد.

    مثال: به هرکسی که می‌تواند `#maintainers` را ببیند اجازه دهید به bot پیام DM بدهد، درحالی‌که DMها برای همهٔ افراد دیگر بسته می‌مانند.

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

    lookupها در صورت شکست، بسته شکست می‌خورند. اگر Discord مقدار `Missing Access` را برگرداند، lookup عضو شکست بخورد، یا کانال متعلق به guild دیگری باشد، فرستندهٔ DM غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر audience کانال، در Discord Developer Portal گزینهٔ **Server Members Intent** را برای bot فعال کنید. DMها وضعیت عضو guild را شامل نمی‌شوند، بنابراین OpenClaw هنگام مجوزدهی عضو را از طریق Discord REST resolve می‌کند.

  </Tab>

  <Tab title="Guild policy">
    مدیریت Guild توسط `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط مبنای امن وقتی `channels.discord` وجود دارد `allowlist` است.

    رفتار `allowlist`:

    - guild باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - allowlistهای اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های role)؛ اگر هرکدام پیکربندی شده باشد، فرستندگان وقتی با `users` یا `roles` مطابق باشند مجازند
    - تطبیق مستقیم نام/برچسب به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/برچسب‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌ترند؛ وقتی ورودی‌های نام/برچسب استفاده شوند `openclaw security audit` هشدار می‌دهد
    - اگر یک guild دارای `channels` پیکربندی‌شده باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک guild بلوک `channels` نداشته باشد، همهٔ کانال‌ها در آن guild موجود در allowlist مجازند

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` نسازید، fallback زمان اجرا `groupPolicy="allowlist"` است (با هشدار در لاگ‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="Mentions and group DMs">
    پیام‌های Guild به‌طور پیش‌فرض با mention محدود می‌شوند.

    تشخیص mention شامل موارد زیر است:

    - mention صریح bot
    - الگوهای mention پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback با `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ‌به-bot در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از syntax رسمی mention استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای roleها. از فرم mention نام مستعار قدیمی `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر guild/channel پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که کاربر/role دیگری را mention می‌کنند اما bot را mention نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).

    Group DMها:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - allowlist اختیاری از طریق `dm.groupChannels` (شناسه‌های کانال یا slugها)

  </Tab>
</Tabs>

### مسیریابی عامل مبتنی بر role

از `bindings[].match.roles` برای مسیریابی اعضای guild در Discord به agentهای مختلف بر اساس Role ID استفاده کنید. bindingهای مبتنی بر role فقط Role ID می‌پذیرند و بعد از bindingهای peer یا parent-peer و قبل از bindingهای فقط guild ارزیابی می‌شوند. اگر یک binding فیلدهای match دیگری هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همه فیلدهای پیکربندی‌شده باید مطابقت داشته باشند.

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

- `commands.native` به‌طور پیش‌فرض `"auto"` است و برای Discord فعال است.
- override در سطح هر channel: `channels.discord.commands.native`.
- `commands.native=false` هنگام راه‌اندازی، ثبت و پاک‌سازی slash-commandهای Discord را رد می‌کند. فرمان‌های ثبت‌شده قبلی ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف کنید، همچنان در Discord دیده شوند.
- احراز مجوز فرمان بومی از همان allowlistها/سیاست‌های Discord استفاده می‌کند که پردازش پیام عادی استفاده می‌کند.
- فرمان‌ها ممکن است همچنان در UI Discord برای کاربرانی که مجاز نیستند دیده شوند؛ اجرا همچنان احراز مجوز OpenClaw را اعمال می‌کند و "not authorized" برمی‌گرداند.

برای catalog و رفتار فرمان، [Slash commands](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض slash command:

- `ephemeral: true`

## جزئیات قابلیت

<AccordionGroup>
  <Accordion title="برچسب‌های پاسخ و پاسخ‌های بومی">
    Discord از برچسب‌های پاسخ در خروجی agent پشتیبانی می‌کند:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    با `channels.discord.replyToMode` کنترل می‌شود:

    - `off` (پیش‌فرض)
    - `first`
    - `all`
    - `batched`

    نکته: `off` رشته‌بندی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه ارجاع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای turn پیوست می‌کند.
    `batched` فقط وقتی ارجاع پاسخ بومی ضمنی Discord را پیوست می‌کند که
    رویداد ورودی یک دسته debounced از چند پیام بوده باشد. این زمانی مفید است
    که پاسخ‌های بومی را عمدتا برای چت‌های مبهم و انفجاری می‌خواهید، نه هر
    turn تک‌پیامی.

    شناسه‌های پیام در context/history نمایان می‌شوند تا agentها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش‌های لینک">
    Discord به‌طور پیش‌فرض برای URLها embedهای غنی لینک تولید می‌کند. OpenClaw این embedهای تولیدشده را به‌طور پیش‌فرض در پیام‌های خروجی Discord سرکوب می‌کند، بنابراین URLهای ارسال‌شده توسط agent به‌صورت لینک ساده باقی می‌مانند مگر اینکه opt in کنید:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    برای override کردن یک account، `channels.discord.accounts.<id>.suppressEmbeds` را تنظیم کنید. ارسال‌های message-tool توسط agent هم می‌توانند برای یک پیام واحد `suppressEmbeds: false` را بفرستند. payloadهای صریح `embeds` در Discord با تنظیم پیش‌فرض پیش‌نمایش لینک سرکوب نمی‌شوند.

  </Accordion>

  <Accordion title="پیش‌نمایش پخش زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هنگام رسیدن متن، پاسخ‌های draft را stream کند. `channels.discord.streaming` مقدارهای `off` | `partial` | `block` | `progress` (پیش‌فرض) را می‌پذیرد. `progress` یک draft وضعیت قابل ویرایش را نگه می‌دارد و آن را تا زمان تحویل نهایی با پیشرفت ابزار به‌روزرسانی می‌کند؛ label آغازین مشترک یک خط چرخان است، بنابراین وقتی کار کافی ظاهر شود، مثل بقیه محتوا از دید خارج می‌شود. `streamMode` یک alias قدیمی runtime است. برای بازنویسی config ذخیره‌شده به کلید canonical، `openclaw doctor --fix` را اجرا کنید.

    برای غیرفعال کردن ویرایش‌های پیش‌نمایش Discord، `channels.discord.streaming.mode` را روی `off` تنظیم کنید. اگر streaming بلوکی Discord صریحا فعال شده باشد، OpenClaw برای جلوگیری از double-streaming، preview stream را رد می‌کند.

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

    - `partial` هنگام رسیدن tokenها یک پیام پیش‌نمایش واحد را ویرایش می‌کند.
    - `block` قطعه‌هایی در اندازه draft منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، محدودشده به `textChunkLimit`).
    - خروجی‌های نهایی media، error و explicit-reply ویرایش‌های پیش‌نمایش pending را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.
    - ردیف‌های ابزار/پیشرفت، در صورت موجود بودن، به‌صورت emoji فشرده + عنوان + جزئیات render می‌شوند، برای مثال `🛠️ Bash: run tests` یا `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (پیش‌فرض `false`) متن commentary/preamble دستیار را در draft موقت پیشرفت opt in می‌کند. commentary پیش از نمایش پاک‌سازی می‌شود، گذرا می‌ماند، و تحویل پاسخ نهایی را تغییر نمی‌دهد.
    - `streaming.progress.maxLineChars` بودجه پیش‌نمایش پیشرفت برای هر خط را کنترل می‌کند. نثر در مرزهای واژه کوتاه می‌شود؛ جزئیات command و path پسوندهای مفید را نگه می‌دارند.
    - `streaming.preview.commandText` / `streaming.progress.commandText` جزئیات command/exec را در خطوط فشرده پیشرفت کنترل می‌کند: `raw` (پیش‌فرض) یا `status` (فقط label ابزار).

    متن خام command/exec را پنهان کنید و خطوط فشرده پیشرفت را نگه دارید:

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

    streaming پیش‌نمایش فقط متنی است؛ پاسخ‌های media به تحویل عادی fallback می‌کنند. وقتی streaming از نوع `block` صریحا فعال شده باشد، OpenClaw برای جلوگیری از double-streaming، preview stream را رد می‌کند.

  </Accordion>

  <Accordion title="تاریخچه، context، و رفتار thread">
    context تاریخچه guild:

    - پیش‌فرض `channels.discord.historyLimit` برابر `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچه DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار thread:

    - threadهای Discord به‌صورت sessionهای channel مسیریابی می‌شوند و مگر اینکه override شوند، config channel والد را به ارث می‌برند.
    - sessionهای thread، انتخاب `/model` در سطح session مربوط به channel والد را به‌عنوان fallback فقط مدل به ارث می‌برند؛ انتخاب‌های `/model` محلی thread همچنان اولویت دارند و تاریخچه transcript والد کپی نمی‌شود مگر اینکه وراثت transcript فعال شده باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) auto-threadهای جدید را opt in می‌کند تا از transcript والد seed شوند. overrideهای هر account زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های message-tool می‌توانند targetهای DM از نوع `user:<id>` را resolve کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` در طول fallback فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوعات channel به‌عنوان context **نامطمئن** تزریق می‌شوند. allowlistها کنترل می‌کنند چه کسی می‌تواند agent را trigger کند، نه یک مرز کامل redaction برای context تکمیلی.

  </Accordion>

  <Accordion title="sessionهای وابسته به thread برای subagentها">
    Discord می‌تواند یک thread را به target یک session bind کند تا پیام‌های بعدی در آن thread همچنان به همان session مسیریابی شوند (شامل sessionهای subagent).

    فرمان‌ها:

    - `/focus <target>` اتصال thread فعلی/جدید به target یک subagent/session
    - `/unfocus` حذف binding thread فعلی
    - `/agents` نمایش runهای فعال و وضعیت binding
    - `/session idle <duration|off>` بررسی/به‌روزرسانی auto-unfocus عدم فعالیت برای bindingهای focused
    - `/session max-age <duration|off>` بررسی/به‌روزرسانی حداکثر سن سخت برای bindingهای focused

    config:

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

    نکات:

    - `session.threadBindings.*` پیش‌فرض‌های global را تنظیم می‌کند.
    - `channels.discord.threadBindings.*` رفتار Discord را override می‌کند.
    - `spawnSessions` ایجاد/bind خودکار threadها برای `sessions_spawn({ thread: true })` و spawnهای thread در ACP را کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` context بومی subagent را برای spawnهای وابسته به thread کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای deprecated `spawnSubagentSessions`/`spawnAcpSessions` توسط `openclaw doctor --fix` migrate می‌شوند.
    - اگر bindingهای thread برای یک account غیرفعال باشند، `/focus` و عملیات مرتبط با binding thread در دسترس نیستند.

    [Sub-agents](/fa/tools/subagents)، [ACP Agents](/fa/tools/acp-agents)، و [Configuration Reference](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="bindingهای پایدار channel در ACP">
    برای workspaceهای ACP پایدار و "always-on"، bindingهای typed در سطح top-level ACP را پیکربندی کنید که conversationهای Discord را target می‌کنند.

    مسیر config:

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

    نکات:

    - `/acp spawn codex --bind here` channel یا thread فعلی را در همان‌جا bind می‌کند و پیام‌های آینده را روی همان session در ACP نگه می‌دارد. پیام‌های thread، binding channel والد را به ارث می‌برند.
    - در یک channel یا thread bindشده، `/new` و `/reset` همان session در ACP را در همان‌جا reset می‌کنند. bindingهای موقت thread می‌توانند هنگام فعال بودن، resolution target را override کنند.
    - `spawnSessions` ایجاد/binding thread فرزند را از طریق `--thread auto|here` gate می‌کند.

    برای جزئیات رفتار binding، [ACP Agents](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش در سطح هر guild:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای system تبدیل می‌شوند و به session مسیریابی‌شده Discord پیوست می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های Ack">
    `ackReaction` هنگامی که OpenClaw در حال پردازش یک پیام ورودی است، یک emoji تأیید ارسال می‌کند.

    ترتیب resolution:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback به emoji هویت agent (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکات:

    - Discord emoji unicode یا نام‌های emoji سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک channel یا account، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن config">
    نوشتن config آغازشده از channel به‌طور پیش‌فرض فعال است.

    این روی flowهای `/config set|unset` اثر می‌گذارد (وقتی قابلیت‌های command فعال باشند).

    غیرفعال کردن:

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

  <Accordion title="proxy در Gateway">
    ترافیک WebSocket در gateway Discord و lookupهای REST هنگام راه‌اندازی (application ID + resolution مربوط به allowlist) را از طریق یک proxy از نوع HTTP(S) با `channels.discord.proxy` مسیریابی کنید.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    override در سطح هر account:

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

  <Accordion title="پشتیبانی PluralKit">
    برای map کردن پیام‌های proxied به هویت عضو system، resolution در PluralKit را فعال کنید:

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

    - فهرست‌های مجاز می‌توانند از `pk:<memberId>` استفاده کنند
    - نام‌های نمایشی اعضا فقط وقتی با نام/slug تطبیق داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true` باشد
    - جست‌وجوها از شناسهٔ پیام اصلی استفاده می‌کنند و به بازهٔ زمانی محدود هستند
    - اگر جست‌وجو ناموفق باشد، پیام‌های پروکسی‌شده به‌عنوان پیام‌های ربات در نظر گرفته می‌شوند و حذف می‌شوند، مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="نام‌های مستعار منشن خروجی">
    وقتی عامل‌ها برای کاربران شناخته‌شدهٔ Discord به منشن‌های خروجی قطعی نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها هندل‌های بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربری Discord هستند. هندل‌های ناشناخته، `@everyone`، `@here`، و منشن‌های داخل code spanهای Markdown بدون تغییر باقی می‌مانند.

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
    به‌روزرسانی‌های حضور وقتی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت را تنظیم کنید، یا حضور خودکار را فعال کنید.

    نمونهٔ فقط وضعیت:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    نمونهٔ فعالیت (وضعیت سفارشی نوع فعالیت پیش‌فرض است):

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

    نمونهٔ پخش زنده:

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

    نقشهٔ نوع فعالیت:

    - 0: در حال بازی
    - 1: در حال پخش زنده (به `activityUrl` نیاز دارد)
    - 2: در حال گوش دادن
    - 3: در حال تماشا
    - 4: سفارشی (از متن فعالیت به‌عنوان حالت وضعیت استفاده می‌کند؛ emoji اختیاری است)
    - 5: در حال رقابت

    نمونهٔ حضور خودکار (سیگنال سلامت زمان اجرا):

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

    حضور خودکار، دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => آنلاین، افت‌کرده یا ناشناخته => بیکار، تمام‌شده یا دردسترس‌نبودن => مزاحم نشوید. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از placeholder `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="تأییدها در Discord">
    Discord از مدیریت تأیید مبتنی بر دکمه در پیام‌های مستقیم پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری اعلان‌های تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک تأییدکننده قابل resolve باشد، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، Discord تأییدهای exec بومی را به‌صورت خودکار فعال می‌کند. Discord تأییدکنندگان exec را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنباط نمی‌کند. برای غیرفعال کردن صریح Discord به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط مالک مانند `/diagnostics` و `/export-trajectory`، OpenClaw اعلان‌های تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. وقتی مالک فراخواننده مسیر مالک Discord داشته باشد، ابتدا پیام مستقیم Discord را امتحان می‌کند؛ اگر دردسترس نباشد، به نخستین مسیر مالک دردسترس از `commands.ownerAllowFrom`، مانند Telegram، برمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، اعلان تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان resolve‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقتی دریافت می‌کنند. اعلان‌های تأیید شامل متن فرمان هستند، پس تحویل کانالی را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسهٔ کانال از کلید نشست قابل استخراج نباشد، OpenClaw به تحویل پیام مستقیم برمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترکی را که کانال‌های چت دیگر استفاده می‌کنند render می‌کند. آداپتر بومی Discord عمدتاً مسیریابی پیام مستقیم تأییدکننده و fanout کانال را اضافه می‌کند.
    وقتی آن دکمه‌ها وجود داشته باشند، تجربهٔ کاربری اصلی تأیید هستند؛ OpenClaw
    فقط باید زمانی فرمان دستی `/approve` را اضافه کند که نتیجهٔ ابزار بگوید
    تأییدهای چت دردسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان اجرای تأیید بومی Discord فعال نباشد، OpenClaw اعلان
    قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان اجرا فعال باشد اما کارت بومی به هیچ مقصدی قابل تحویل نباشد،
    OpenClaw یک اعلان جایگزین در همان چت با فرمان دقیق `/approve`
    از تأیید معلق ارسال می‌کند.

    احراز هویت Gateway و resolve کردن تأیید از قرارداد کلاینت مشترک Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` resolve می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌صورت پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و گیت‌های اقدام

اقدام‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، نظارت، حضور، و اقدام‌های فراداده هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- نظارت: `timeout`، `kick`، `ban`
- حضور: `setPresence`

اقدام `event-create` یک پارامتر اختیاری `image` (URL یا مسیر فایل محلی) می‌پذیرد تا تصویر کاور رویداد زمان‌بندی‌شده را تنظیم کند.

گیت‌های اقدام زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض گیت:

| گروه اقدام                                                                                                                                                              | پیش‌فرض     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| واکنش‌ها، پیام‌ها، رشته‌ها، پین‌ها، نظرسنجی‌ها، جست‌وجو، اطلاعات عضو، اطلاعات نقش، اطلاعات کانال، کانال‌ها، وضعیت صدا، رویدادها، استیکرها، بارگذاری‌های emoji، بارگذاری‌های استیکر، مجوزها | فعال      |
| نقش‌ها                                                                                                                                                                  | غیرفعال   |
| نظارت                                                                                                                                                                   | غیرفعال   |
| حضور                                                                                                                                                                    | غیرفعال   |

## رابط کاربری مؤلفه‌های v2

OpenClaw از مؤلفه‌های v2 Discord برای تأییدهای exec و نشانگرهای میان‌بافتی استفاده می‌کند. اقدام‌های پیام Discord همچنین می‌توانند برای رابط کاربری سفارشی `components` بپذیرند (پیشرفته؛ نیازمند ساخت payload مؤلفه از طریق ابزار discord)، در حالی که `embeds` قدیمی همچنان دردسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تأکیدی استفاده‌شده توسط کانتینرهای مؤلفهٔ Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- `channels.discord.agentComponents.ttlMs` کنترل می‌کند callbackهای مؤلفهٔ Discord ارسال‌شده چه مدت ثبت‌شده باقی بمانند (پیش‌فرض `1800000`، حداکثر `86400000`). برای هر حساب با `channels.discord.accounts.<id>.agentComponents.ttlMs` تنظیم کنید.
- وقتی مؤلفه‌های v2 وجود داشته باشند، `embeds` نادیده گرفته می‌شوند.
- پیش‌نمایش‌های URL ساده به‌صورت پیش‌فرض سرکوب می‌شوند. وقتی یک پیوند خروجی واحد باید باز شود، `suppressEmbeds: false` را روی اقدام پیام تنظیم کنید.

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

Discord دو سطح صدای متمایز دارد: **کانال‌های صوتی** بلادرنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موجی). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

چک‌لیست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی از فهرست‌های مجاز نقش/کاربر استفاده می‌شود، Server Members Intent را فعال کنید.
3. ربات را با scopeهای `bot` و `applications.commands` دعوت کنید.
4. در کانال صوتی مقصد، مجوزهای Connect، Speak، Send Messages، و Read Message History را اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان قوانین فهرست مجاز و سیاست گروهی سایر فرمان‌های Discord را دنبال می‌کند.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

برای بررسی مجوزهای مؤثر ربات پیش از پیوستن، اجرا کنید:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

نمونهٔ پیوستن خودکار:

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

- `voice.tts` فقط برای پخش صدای `stt-tts` مقدار `messages.tts` را بازنویسی می‌کند. حالت‌های بی‌درنگ از `voice.realtime.speakerVoice` استفاده می‌کنند.
- `voice.mode` مسیر گفتگو را کنترل می‌کند. پیش‌فرض `agent-proxy` است: یک جلوی صدای بی‌درنگ زمان‌بندی نوبت، وقفه و پخش را مدیریت می‌کند، کار محتوایی را از طریق `openclaw_agent_consult` به عامل مسیریابی‌شده OpenClaw واگذار می‌کند و نتیجه را مانند یک پرامپت تایپ‌شده Discord از همان گوینده در نظر می‌گیرد. `stt-tts` جریان قدیمی‌تر STT دسته‌ای به‌علاوه TTS را نگه می‌دارد. `bidi` به مدل بی‌درنگ اجازه می‌دهد مستقیما گفتگو کند و هم‌زمان `openclaw_agent_consult` را برای مغز OpenClaw در دسترس بگذارد.
- `voice.agentSession` کنترل می‌کند کدام گفتگوی OpenClaw نوبت‌های صوتی را دریافت کند. برای نشست خود کانال صوتی آن را تنظیم‌نشده بگذارید، یا `{ mode: "target", target: "channel:<text-channel-id>" }` را تنظیم کنید تا کانال صوتی به‌عنوان افزونه میکروفون/بلندگوی یک نشست موجود کانال متنی Discord مانند `#maintainers` عمل کند.
- `voice.model` مغز عامل OpenClaw را برای پاسخ‌های صوتی Discord و مشورت‌های بی‌درنگ بازنویسی می‌کند. برای به‌ارث‌بردن مدل عامل مسیریابی‌شده، آن را تنظیم‌نشده بگذارید. این گزینه از `voice.realtime.model` جداست.
- `voice.followUsers` به ربات اجازه می‌دهد همراه کاربران انتخاب‌شده وارد صدای Discord شود، جابه‌جا شود و خارج شود. برای قواعد رفتار و نمونه‌ها، [دنبال کردن کاربران در صدا](#follow-users-in-voice) را ببینید.
- `agent-proxy` گفتار را از طریق `discord-voice` مسیریابی می‌کند؛ این مسیر مجوزهای عادی مالک/ابزار را برای گوینده و نشست هدف حفظ می‌کند اما ابزار `tts` عامل را پنهان می‌کند چون صدای Discord مالک پخش است. به‌طور پیش‌فرض، `agent-proxy` برای گویندگان مالک دسترسی کامل ابزار در سطح مالک به مشورت می‌دهد (`voice.realtime.toolPolicy: "owner"`) و به‌شدت ترجیح می‌دهد پیش از پاسخ‌های محتوایی با عامل OpenClaw مشورت کند (`voice.realtime.consultPolicy: "always"`). در حالت پیش‌فرض `always`، لایه بی‌درنگ پیش از پاسخ مشورت به‌طور خودکار متن پرکننده را به گفتار تبدیل نمی‌کند؛ گفتار را ضبط و رونویسی می‌کند، سپس پاسخ مسیریابی‌شده OpenClaw را پخش می‌کند. اگر چند پاسخ مشورت اجباری در حالی تمام شوند که Discord هنوز پاسخ اول را پخش می‌کند، پاسخ‌های گفتار دقیق بعدی تا بیکار شدن پخش در صف می‌مانند، به‌جای اینکه گفتار را در میانه جمله جایگزین کنند.
- در حالت `stt-tts`، STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` روی رونویسی اثر نمی‌گذارد.
- در حالت‌های بی‌درنگ، `voice.realtime.provider`، `voice.realtime.model` و `voice.realtime.speakerVoice` نشست صوتی بی‌درنگ را پیکربندی می‌کنند. برای OpenAI Realtime 2 به‌همراه مغز Codex، از `voice.realtime.model: "gpt-realtime-2"` و `voice.model: "openai/gpt-5.5"` استفاده کنید.
- حالت‌های صوتی بی‌درنگ به‌طور پیش‌فرض فایل‌های پروفایل کوچک `IDENTITY.md`، `USER.md` و `SOUL.md` را در دستورالعمل‌های ارائه‌دهنده بی‌درنگ می‌گنجانند تا نوبت‌های مستقیم سریع همان هویت، زمینه‌سازی کاربر و پرسونا را مثل عامل مسیریابی‌شده OpenClaw حفظ کنند. برای سفارشی‌سازی، `voice.realtime.bootstrapContextFiles` را روی یک زیرمجموعه تنظیم کنید، یا برای غیرفعال‌سازی آن را روی `[]` بگذارید. فایل‌های بوت‌استرپ بی‌درنگ پشتیبانی‌شده به همین فایل‌های پروفایل محدودند؛ `AGENTS.md` در زمینه عادی عامل باقی می‌ماند. زمینه پروفایل تزریق‌شده جایگزین `openclaw_agent_consult` برای کارهای workspace، حقایق جاری، جست‌وجوی حافظه یا اقدام‌های پشتیبانی‌شده با ابزار نمی‌شود.
- در حالت بی‌درنگ OpenAI `agent-proxy`، `voice.realtime.requireWakeName: true` را تنظیم کنید تا صدای بی‌درنگ Discord تا وقتی یک رونویسی با نام بیدارباش شروع یا تمام نشده ساکت بماند. نام‌های بیدارباش پیکربندی‌شده باید یک یا دو کلمه باشند. اگر `voice.realtime.wakeNames` تنظیم نشده باشد، OpenClaw از `name` عامل مسیریابی‌شده به‌علاوه `OpenClaw` استفاده می‌کند و در صورت نبود آن به شناسه عامل به‌علاوه `OpenClaw` برمی‌گردد. دروازه‌گذاری با نام بیدارباش پاسخ خودکار ارائه‌دهنده بی‌درنگ را غیرفعال می‌کند، نوبت‌های پذیرفته‌شده را از مسیر مشورت عامل OpenClaw عبور می‌دهد و وقتی یک نام بیدارباش ابتدایی از رونویسی جزئی پیش از رسیدن رونویسی نهایی تشخیص داده شود، یک تأیید کوتاه گفتاری می‌دهد.
- ارائه‌دهنده بی‌درنگ OpenAI نام‌های رویداد فعلی Realtime 2 و نام‌های مستعار قدیمی سازگار با Codex را برای رویدادهای صدای خروجی و رونویسی می‌پذیرد، بنابراین snapshotهای سازگار ارائه‌دهنده می‌توانند بدون حذف صدای دستیار تغییر کنند.
- `voice.realtime.bargeIn` کنترل می‌کند آیا رویدادهای شروع صحبت گوینده Discord پخش بی‌درنگ فعال را قطع کنند یا نه. اگر تنظیم نشود، از تنظیم وقفه صدای ورودی ارائه‌دهنده بی‌درنگ پیروی می‌کند.
- `voice.realtime.minBargeInAudioEndMs` حداقل مدت پخش دستیار را پیش از اینکه یک ورود ناگهانی بی‌درنگ OpenAI صدا را کوتاه کند کنترل می‌کند. پیش‌فرض: `250`. برای وقفه فوری در اتاق‌های کم‌اکو، `0` را تنظیم کنید، یا برای چیدمان‌های بلندگوی پر‌اکو آن را افزایش دهید.
- برای صدای OpenAI روی پخش Discord، `voice.tts.provider: "openai"` را تنظیم کنید و یک صدای تبدیل متن به گفتار را زیر `voice.tts.providers.openai.speakerVoice` انتخاب کنید. `cedar` در مدل فعلی OpenAI TTS انتخاب خوبی با صدای مردانه است.
- بازنویسی‌های `systemPrompt` مخصوص هر کانال Discord برای نوبت‌های رونویسی صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونویسی صوتی وضعیت مالک را برای فرمان‌های نیازمند مالک و اقدام‌های کانال از `allowFrom` مربوط به Discord (یا `dm.allowFrom`) می‌گیرند. دیده‌شدن ابزارهای عامل از سیاست ابزار پیکربندی‌شده برای نشست مسیریابی‌شده پیروی می‌کند.
- صدای Discord برای پیکربندی‌های فقط متنی اختیاری است؛ برای فعال‌سازی فرمان‌های `/vc`، زمان اجرای صدا و intent مربوط به Gateway با نام `GuildVoiceStates`، `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صدا را صراحتا بازنویسی کند. برای اینکه intent از فعال‌سازی مؤثر صدا پیروی کند، آن را تنظیم‌نشده بگذارید.
- اگر `voice.autoJoin` برای یک guild چند ورودی داشته باشد، OpenClaw به آخرین کانال پیکربندی‌شده برای آن guild می‌پیوندد.
- `voice.allowedChannels` یک allowlist اختیاری برای اقامت است. برای اجازه دادن به `/vc join` در هر کانال صوتی مجاز Discord، آن را تنظیم‌نشده بگذارید. وقتی تنظیم شود، `/vc join`، پیوستن خودکار هنگام راه‌اندازی و جابه‌جایی‌های وضعیت صوتی ربات به ورودی‌های فهرست‌شده `{ guildId, channelId }` محدود می‌شوند. برای رد همه پیوستن‌های صوتی Discord، آن را روی آرایه خالی تنظیم کنید. اگر Discord ربات را بیرون از allowlist جابه‌جا کند، OpenClaw آن کانال را ترک می‌کند و وقتی هدف auto-join پیکربندی‌شده‌ای موجود باشد، دوباره به آن می‌پیوندد.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` مستقیما به گزینه‌های پیوستن `@discordjs/voice` منتقل می‌شوند.
- پیش‌فرض‌های `@discordjs/voice` در صورت تنظیم‌نشدن، `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- OpenClaw از کدک همراه `libopus-wasm` برای دریافت صدای Discord و پخش PCM خام بی‌درنگ استفاده می‌کند. این بسته یک ساخت libopus WebAssembly پین‌شده ارائه می‌کند و به افزونه‌های opus بومی نیاز ندارد.
- `voice.connectTimeoutMs` انتظار اولیه Ready مربوط به `@discordjs/voice` را برای تلاش‌های `/vc join` و auto-join کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw پس از قطع شدن یک نشست صوتی، پیش از نابود کردن آن، چه مدت برای شروع اتصال دوباره صبر کند. پیش‌فرض: `15000`.
- در حالت `stt-tts`، پخش صدا فقط به این دلیل که کاربر دیگری شروع به صحبت کرده متوقف نمی‌شود. برای جلوگیری از چرخه‌های بازخورد، OpenClaw در حالی که TTS در حال پخش است ضبط صدای جدید را نادیده می‌گیرد؛ برای نوبت بعدی پس از پایان پخش صحبت کنید. حالت‌های بی‌درنگ شروع صحبت گوینده را به‌عنوان سیگنال‌های ورود ناگهانی به ارائه‌دهنده بی‌درنگ ارسال می‌کنند.
- در حالت‌های بی‌درنگ، اکوی بلندگوها در یک میکروفون باز می‌تواند شبیه ورود ناگهانی به نظر برسد و پخش را قطع کند. برای اتاق‌های Discord پر‌اکو، `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید تا OpenAI هنگام صدای ورودی به‌طور خودکار وقفه ایجاد نکند. اگر همچنان می‌خواهید رویدادهای شروع صحبت گوینده Discord پخش فعال را قطع کنند، `voice.realtime.bargeIn: true` را اضافه کنید. پل بی‌درنگ OpenAI کوتاه‌سازی‌های پخش کوتاه‌تر از `voice.realtime.minBargeInAudioEndMs` را به‌عنوان اکوی/نویز احتمالی نادیده می‌گیرد و به‌جای پاک کردن پخش Discord، آن‌ها را به‌صورت ردشده ثبت می‌کند.
- `voice.captureSilenceGraceMs` کنترل می‌کند OpenClaw پس از اینکه Discord گزارش می‌دهد گوینده متوقف شده، چه مدت پیش از نهایی‌کردن آن قطعه صوتی برای STT صبر کند. پیش‌فرض: `2000`؛ اگر Discord مکث‌های عادی را به رونویسی‌های جزئی بریده‌بریده تقسیم می‌کند، این مقدار را افزایش دهید.
- وقتی ElevenLabs ارائه‌دهنده TTS انتخاب‌شده باشد، پخش صوتی Discord از TTS جریانی استفاده می‌کند و از جریان پاسخ ارائه‌دهنده شروع می‌شود. ارائه‌دهندگانی که از جریان پشتیبانی نمی‌کنند به مسیر فایل موقت سنتزشده برمی‌گردند.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را پایش می‌کند و پس از خطاهای تکراری در یک بازه کوتاه، با ترک کردن و پیوستن دوباره به کانال صوتی به‌طور خودکار بازیابی می‌کند.
- اگر پس از به‌روزرسانی، گزارش‌های دریافت بارها `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح padding بالادستی از PR شماره #11449 مربوط به discord.js است که issue شماره #11419 مربوط به discord.js را بست.
- رویدادهای دریافت `The operation was aborted` زمانی که OpenClaw یک قطعه گوینده ضبط‌شده را نهایی می‌کند مورد انتظارند؛ این‌ها عیب‌یابی‌های پرجزئیات‌اند، نه هشدار.
- لاگ‌های پرجزئیات صدای Discord برای هر قطعه گوینده پذیرفته‌شده یک پیش‌نمایش محدود یک‌خطی از رونویسی STT دارند، بنابراین عیب‌یابی بدون تخلیه متن رونویسی نامحدود، هم سمت کاربر و هم سمت پاسخ عامل را نشان می‌دهد.
- در حالت `agent-proxy`، fallback مشورت اجباری قطعه‌های رونویسی احتمالا ناقص، مانند متنی که به `...` ختم می‌شود یا یک رابط پایانی مثل `and` دارد، و همچنین پایان‌بندی‌های آشکارا غیرقابل‌اقدام مانند «برمی‌گردم» یا «خداحافظ» را رد می‌کند. وقتی این کار جلوی یک پاسخ صف‌شده کهنه را می‌گیرد، لاگ‌ها `forced agent consult skipped reason=...` را نشان می‌دهند.

### دنبال کردن کاربران در صدا

وقتی می‌خواهید ربات صوتی Discord به‌جای پیوستن به یک کانال ثابت هنگام راه‌اندازی یا انتظار برای `/vc join`، همراه یک یا چند کاربر شناخته‌شده Discord بماند، از `voice.followUsers` استفاده کنید.

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

- `followUsers` شناسه‌های خام کاربر Discord و مقادیر `discord:<id>` را می‌پذیرد. OpenClaw پیش از تطبیق رویدادهای وضعیت صدا، هر دو قالب را نرمال‌سازی می‌کند.
- وقتی `followUsers` پیکربندی شده باشد، پیش‌فرض `followUsersEnabled` برابر `true` است. برای نگه داشتن فهرست ذخیره‌شده اما توقف دنبال کردن خودکار صدا، آن را روی `false` تنظیم کنید.
- وقتی یک کاربر دنبال‌شده وارد یک کانال صوتی مجاز شود، OpenClaw به آن کانال می‌پیوندد. وقتی کاربر جابه‌جا شود، OpenClaw همراه او جابه‌جا می‌شود. وقتی کاربر دنبال‌شده فعال قطع اتصال کند، OpenClaw خارج می‌شود.
- اگر چند کاربر دنبال‌شده در یک guild باشند و کاربر دنبال‌شده فعال خارج شود، OpenClaw پیش از ترک guild به کانال کاربر دنبال‌شده ردیابی‌شده دیگری منتقل می‌شود. اگر چند کاربر دنبال‌شده هم‌زمان جابه‌جا شوند، آخرین رویداد وضعیت صوتی مشاهده‌شده برنده است.
- `allowedChannels` همچنان اعمال می‌شود. کاربر دنبال‌شده در کانال غیرمجاز نادیده گرفته می‌شود، و نشست متعلق به دنبال‌کردن به کاربر دنبال‌شده دیگری منتقل می‌شود یا خارج می‌شود.
- OpenClaw رویدادهای وضعیت صوتی ازدست‌رفته را هنگام راه‌اندازی و در یک بازه محدود همگام‌سازی می‌کند. همگام‌سازی از guildهای پیکربندی‌شده نمونه‌برداری می‌کند و جست‌وجوهای REST را در هر اجرا محدود می‌کند، بنابراین فهرست‌های بسیار بزرگ `followUsers` ممکن است برای همگرا شدن به بیش از یک بازه نیاز داشته باشند.
- اگر Discord یا یک ادمین ربات را در حالی که در حال دنبال کردن کاربر است جابه‌جا کند، OpenClaw نشست صوتی را بازسازی می‌کند و وقتی مقصد مجاز باشد، مالکیت دنبال‌کردن را حفظ می‌کند. اگر ربات بیرون از `allowedChannels` منتقل شود، OpenClaw خارج می‌شود و وقتی هدف پیکربندی‌شده‌ای وجود داشته باشد، دوباره به آن می‌پیوندد.
- بازیابی دریافت DAVE ممکن است پس از خطاهای رمزگشایی تکراری، همان کانال را ترک کند و دوباره به آن بپیوندد. نشست‌های متعلق به دنبال‌کردن مالکیت دنبال‌کردن خود را در این مسیر بازیابی حفظ می‌کنند، بنابراین قطع اتصال بعدی کاربر دنبال‌شده همچنان کانال را ترک می‌کند.

میان حالت‌های پیوستن انتخاب کنید:

- از `followUsers` برای راه‌اندازی‌های شخصی یا اپراتوری استفاده کنید که ربات باید وقتی شما در صدا هستید به‌طور خودکار در صدا باشد.
- از `autoJoin` برای ربات‌های اتاق ثابت استفاده کنید که حتی وقتی هیچ کاربر ردیابی‌شده‌ای در صدا نیست باید حاضر باشند.
- از `/vc join` برای پیوستن‌های یک‌باره یا اتاق‌هایی استفاده کنید که حضور صوتی خودکار در آن‌ها غیرمنتظره خواهد بود.

کدک صدای Discord:

- گزارش‌های دریافت صدا نشان می‌دهند `discord voice: opus decoder: libopus-wasm`.
- پخش بلادرنگ، PCM استریوی خام 48 کیلوهرتز را پیش از تحویل بسته‌ها به `@discordjs/voice` با همان بسته همراه `libopus-wasm` به Opus کدگذاری می‌کند.
- پخش فایل و جریان ارائه‌دهنده، با ffmpeg به PCM استریوی خام 48 کیلوهرتز ترنسکد می‌شود، سپس از `libopus-wasm` برای جریان بسته Opus ارسال‌شده به Discord استفاده می‌کند.

خط لوله STT به‌علاوه TTS:

- ضبط PCM از Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio`، STT را مدیریت می‌کند، برای مثال `openai/gpt-4o-mini-transcribe`.
- متن رونویسی‌شده از طریق ورودی و مسیریابی Discord ارسال می‌شود، در حالی که LLM پاسخ با یک سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و درخواست متن برگشتی می‌دهد، زیرا صدای Discord مالک پخش نهایی TTS است.
- `voice.model`، وقتی تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ ارائه‌دهندگان دارای قابلیت جریان‌دهی مستقیماً پخش‌کننده را تغذیه می‌کنند، در غیر این صورت فایل صوتی حاصل در کانال پیوسته پخش می‌شود.

نمونه نشست کانال صوتی پیش‌فرض agent-proxy:

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

بدون بلوک `voice.agentSession`، هر کانال صوتی نشست OpenClaw مسیریابی‌شده خودش را دریافت می‌کند. برای مثال، `/vc join channel:234567890123456789` با نشست مربوط به آن کانال صوتی Discord صحبت می‌کند. مدل بلادرنگ فقط بخش جلویی صوت است؛ درخواست‌های محتوایی به عامل پیکربندی‌شده OpenClaw تحویل داده می‌شوند. اگر مدل بلادرنگ بدون فراخوانی ابزار مشورت، متن نهایی تولید کند، OpenClaw مشورت را به‌عنوان fallback اجباری می‌کند تا حالت پیش‌فرض همچنان مثل صحبت کردن با عامل رفتار کند.

نمونه STT به‌علاوه TTS قدیمی:

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

نمونه bidi بلادرنگ:

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

صدا به‌عنوان افزونه‌ای برای یک نشست کانال موجود Discord:

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

در حالت `agent-proxy`، ربات به کانال صوتی پیکربندی‌شده می‌پیوندد، اما نوبت‌های عامل OpenClaw از نشست و عامل مسیریابی‌شده معمول کانال هدف استفاده می‌کنند. نشست صوتی بلادرنگ، نتیجه برگشتی را دوباره در کانال صوتی بیان می‌کند. عامل ناظر همچنان می‌تواند طبق سیاست ابزار خود از ابزارهای پیام معمول استفاده کند، از جمله ارسال یک پیام جداگانه در Discord اگر اقدام درست همین باشد.

در حالی که یک اجرای واگذارشده OpenClaw فعال است، متن‌های رونویسی‌شده صوتی جدید Discord پیش از شروع نوبت عامل دیگر، به‌عنوان کنترل اجرای زنده در نظر گرفته می‌شوند. عبارت‌هایی مانند «status»، «cancel that»، «use the smaller fix» یا «when you're done also check tests» به‌عنوان ورودی وضعیت، لغو، هدایت یا پیگیری برای نشست فعال طبقه‌بندی می‌شوند. خروجی‌های وضعیت، لغو، هدایت پذیرفته‌شده و پیگیری دوباره در کانال صوتی بیان می‌شوند تا تماس‌گیرنده بداند آیا OpenClaw درخواست را مدیریت کرده است یا نه.

فرم‌های هدف مفید:

- `target: "channel:123456789012345678"` از طریق یک نشست کانال متنی Discord مسیریابی می‌شود.
- `target: "123456789012345678"` به‌عنوان هدف کانال در نظر گرفته می‌شود.
- `target: "dm:123456789012345678"` یا `target: "user:123456789012345678"` از طریق آن نشست پیام مستقیم مسیریابی می‌شود.

نمونه OpenAI Realtime با پژواک زیاد:

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

از این حالت زمانی استفاده کنید که مدل پخش خودش در Discord را از طریق یک میکروفون باز می‌شنود، اما همچنان می‌خواهید با صحبت کردن آن را قطع کنید. OpenClaw مانع می‌شود OpenAI روی صدای ورودی خام به‌طور خودکار وقفه ایجاد کند، درحالی‌که `bargeIn: true` اجازه می‌دهد رویدادهای شروع صحبت در بلندگوی Discord و صدای بلندگوی از قبل فعال، پاسخ‌های فعال realtime را پیش از آنکه نوبت ضبط‌شده بعدی به OpenAI برسد لغو کنند. سیگنال‌های وقفه بسیار زودهنگام با `audioEndMs` کمتر از `minBargeInAudioEndMs` به‌عنوان پژواک/نویز محتمل در نظر گرفته و نادیده گرفته می‌شوند تا مدل در نخستین فریم پخش قطع نشود.

لاگ‌های صوتی مورد انتظار:

- هنگام پیوستن: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- هنگام شروع realtime: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- هنگام صدای گوینده: `discord voice: realtime speaker turn opened ...`، `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`، و `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- هنگام گفتار کهنه ردشده: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` یا `reason=non-actionable-closing ...`
- هنگام تکمیل پاسخ realtime: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- هنگام توقف/بازنشانی پخش: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- هنگام مشورت realtime: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- هنگام پاسخ agent: `discord voice: agent turn answer ...`
- هنگام گفتار دقیق صف‌شده: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، سپس `discord voice: realtime exact speech dequeued reason=player-idle ...`
- هنگام تشخیص وقفه: `discord voice: realtime barge-in detected source=speaker-start ...` یا `discord voice: realtime barge-in detected source=active-speaker-audio ...`، سپس `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- هنگام وقفه realtime: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، سپس یا `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` یا `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- هنگام پژواک/نویز نادیده‌گرفته‌شده: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- هنگام غیرفعال بودن وقفه: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- هنگام پخش بیکار: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

برای اشکال‌زدایی صدای قطع‌شده، لاگ‌های صوتی realtime را مانند یک خط زمانی بخوانید:

1. `realtime audio playback started` یعنی Discord شروع به پخش صدای دستیار کرده است. پل از این نقطه شروع به شمارش قطعه‌های خروجی دستیار، بایت‌های PCM در Discord، بایت‌های realtime ارائه‌دهنده، و مدت صدای ساخته‌شده می‌کند.
2. `realtime speaker turn opened` فعال شدن یک گوینده Discord را مشخص می‌کند. اگر پخش از قبل فعال باشد و `bargeIn` فعال شده باشد، ممکن است پس از آن `barge-in detected source=speaker-start` بیاید.
3. `realtime input audio started` نخستین فریم صوتی واقعی دریافت‌شده برای آن نوبت گوینده را مشخص می‌کند. `outputActive=true` یا یک `outputAudioMs` غیرصفر در اینجا یعنی میکروفون درحالی ورودی می‌فرستد که پخش دستیار هنوز فعال است.
4. `barge-in detected source=active-speaker-audio` یعنی OpenClaw هنگام فعال بودن پخش دستیار، صدای زنده گوینده را دیده است. این برای تمایز یک وقفه واقعی از رویداد شروع گوینده در Discord بدون صدای مفید کاربرد دارد.
5. `barge-in requested reason=...` یعنی OpenClaw از ارائه‌دهنده realtime خواسته پاسخ فعال را لغو یا کوتاه کند. این شامل `outputAudioMs`، `outputActive`، و `playbackChunks` است تا ببینید پیش از وقفه واقعاً چه مقدار صدای دستیار پخش شده بود.
6. `realtime audio playback stopped reason=...` نقطه بازنشانی پخش محلی Discord است. دلیل نشان می‌دهد چه چیزی پخش را متوقف کرده است: `barge-in`، `player-idle`، `provider-clear-audio`، `forced-agent-consult`، `stream-close`، یا `session-close`.
7. `realtime speaker turn closed` نوبت ورودی ضبط‌شده را خلاصه می‌کند. `chunks=0` یا `hasAudio=false` یعنی نوبت گوینده باز شد اما هیچ صدای قابل استفاده‌ای به پل realtime نرسید. `interruptedPlayback=true` یعنی آن نوبت ورودی با خروجی دستیار هم‌پوشانی داشته و منطق وقفه را فعال کرده است.

فیلدهای مفید:

- `outputAudioMs`: مدت صدای دستیار که پیش از خط لاگ توسط ارائه‌دهنده realtime تولید شده است.
- `audioMs`: مدت صدای دستیار که OpenClaw پیش از توقف پخش شمرده است.
- `elapsedMs`: زمان دیواری بین باز و بسته شدن جریان پخش یا نوبت گوینده.
- `discordBytes`: بایت‌های PCM استریوی 48 kHz ارسال‌شده به صدای Discord یا دریافت‌شده از آن.
- `realtimeBytes`: بایت‌های PCM با قالب ارائه‌دهنده که به ارائه‌دهنده realtime ارسال شده یا از آن دریافت شده‌اند.
- `playbackChunks`: قطعه‌های صدای دستیار که برای پاسخ فعال به Discord فرستاده شده‌اند.
- `sinceLastAudioMs`: فاصله بین آخرین فریم صوتی ضبط‌شده از گوینده و بسته شدن نوبت گوینده.

الگوهای رایج:

- قطع فوری با `source=active-speaker-audio`، مقدار کوچک `outputAudioMs`، و همان کاربر در نزدیکی، معمولاً نشان می‌دهد پژواک بلندگو وارد میکروفون شده است. `voice.realtime.minBargeInAudioEndMs` را افزایش دهید، صدای بلندگو را کم کنید، از هدفون استفاده کنید، یا `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید.
- `source=speaker-start` که پس از آن `speaker turn closed ... hasAudio=false` می‌آید یعنی Discord شروع یک گوینده را گزارش کرده، اما هیچ صدایی به OpenClaw نرسیده است. این می‌تواند یک رویداد گذرای صدای Discord، رفتار دروازه نویز، یا فعال‌سازی بسیار کوتاه میکروفون توسط کارخواه باشد.
- `audio playback stopped reason=stream-close` بدون وقفه نزدیک یا `provider-clear-audio` یعنی جریان پخش محلی Discord به‌طور غیرمنتظره پایان یافته است. لاگ‌های قبلی ارائه‌دهنده و پخش‌کننده Discord را بررسی کنید.
- `capture ignored during playback (barge-in disabled)` یعنی OpenClaw عمداً هنگام فعال بودن صدای دستیار، ورودی را کنار گذاشته است. اگر می‌خواهید گفتار پخش را قطع کند، `voice.realtime.bargeIn` را فعال کنید.
- `barge-in ignored ... outputActive=false` یعنی Discord یا VAD ارائه‌دهنده گفتار را گزارش کرده، اما OpenClaw هیچ پخش فعالی برای قطع کردن نداشته است. این نباید صدا را قطع کند.

اعتبارنامه‌ها برای هر جزء جداگانه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، احراز هویت TTS برای `messages.tts`/`voice.tts`، و احراز هویت ارائه‌دهنده realtime برای `voice.realtime.providers` یا پیکربندی احراز هویت عادی ارائه‌دهنده.

### پیام‌های صوتی

پیام‌های صوتی Discord پیش‌نمایش شکل موج نشان می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw شکل موج را به‌طور خودکار تولید می‌کند، اما برای بازرسی و تبدیل، به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord پیام متنی + پیام صوتی را در یک payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="از intents غیرمجاز استفاده شده یا بات هیچ پیام guild را نمی‌بیند">

    - Message Content Intent را فعال کنید
    - وقتی به حل‌وفصل کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intents، gateway را دوباره راه‌اندازی کنید

  </Accordion>

  <Accordion title="پیام‌های guild به‌طور غیرمنتظره مسدود شده‌اند">

    - `groupPolicy` را بررسی کنید
    - فهرست مجاز guild را زیر `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` برای guild وجود داشته باشد، فقط کانال‌های فهرست‌شده مجاز هستند
    - رفتار `requireMention` و الگوهای mention را بررسی کنید

    بررسی‌های مفید:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention غیرفعال است اما همچنان مسدود می‌شود">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون فهرست مجاز guild/channel منطبق
    - `requireMention` در جای اشتباه پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی channel باشد)
    - فرستنده توسط فهرست مجاز `users` در guild/channel مسدود شده است

  </Accordion>

  <Accordion title="turnهای طولانی Discord یا پاسخ‌های تکراری">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    گزینه‌های صف Gateway در Discord:

    - تک‌حسابی: `channels.discord.eventQueue.listenerTimeout`
    - چندحسابی: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener مربوط به Gateway در Discord را کنترل می‌کند، نه طول عمر turn عامل

    Discord برای turnهای عاملِ صف‌شده، timeout متعلق به channel اعمال نمی‌کند. message listenerها بلافاصله واگذار می‌کنند، و اجراهای صف‌شدهٔ Discord ترتیب هر نشست را تا زمانی که چرخهٔ عمر نشست/ابزار/runtime کامل شود یا کار را لغو کند حفظ می‌کنند.

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

  <Accordion title="هشدارهای timeout در جست‌وجوی metadata Gateway">
    OpenClaw پیش از اتصال، metadata مربوط به Discord `/gateway/bot` را دریافت می‌کند. شکست‌های گذرا به URL پیش‌فرض gateway در Discord برمی‌گردند و در لاگ‌ها rate-limit می‌شوند.

    گزینه‌های timeout برای metadata:

    - تک‌حسابی: `channels.discord.gatewayInfoTimeoutMs`
    - چندحسابی: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback محیطی وقتی config تنظیم نشده باشد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="راه‌اندازی‌های مجدد به‌دلیل timeout رویداد READY در Gateway">
    OpenClaw هنگام راه‌اندازی و پس از اتصال مجدد runtime، منتظر رویداد `READY` از Gateway در Discord می‌ماند. راه‌اندازی‌های چندحسابی با stagger در شروع ممکن است به پنجرهٔ READY طولانی‌تری نسبت به مقدار پیش‌فرض نیاز داشته باشند.

    گزینه‌های timeout برای READY:

    - راه‌اندازی تک‌حسابی: `channels.discord.gatewayReadyTimeoutMs`
    - راه‌اندازی چندحسابی: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback محیطی راه‌اندازی وقتی config تنظیم نشده باشد: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض راه‌اندازی: `15000` (۱۵ ثانیه)، حداکثر: `120000`
    - runtime تک‌حسابی: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime چندحسابی: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback محیطی runtime وقتی config تنظیم نشده باشد: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض runtime: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="ناهماهنگی‌های audit مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای IDهای عددی channel کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، matching در runtime همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را کامل راستی‌آزمایی کند.

  </Accordion>

  <Accordion title="مشکلات DM و pairing">

    - DM غیرفعال است: `channels.discord.dm.enabled=false`
    - policy مربوط به DM غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در حالت `pairing` منتظر تایید pairing است

  </Accordion>

  <Accordion title="حلقه‌های بات به بات">
    به‌طور پیش‌فرض پیام‌هایی که بات نوشته است نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قواعد strict mention و allowlist استفاده کنید.
    ترجیح دهید از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های باتی پذیرفته شوند که بات را mention می‌کنند.

    OpenClaw همچنین [محافظت در برابر حلقهٔ بات](/fa/channels/bot-loop-protection) مشترک را ارائه می‌کند. هر زمان `allowBots` اجازه دهد پیام‌های نوشته‌شده توسط بات به dispatch برسند، Discord رویداد ورودی را به facts مربوط به `(account, channel, bot pair)` نگاشت می‌کند و محافظ generic pair پس از عبور pair از بودجهٔ رویداد پیکربندی‌شده آن را suppress می‌کند. این محافظ جلوی حلقه‌های runaway دو بات را می‌گیرد که پیش‌تر باید با rate limitهای Discord متوقف می‌شدند؛ روی deploymentهای تک‌باتی یا پاسخ‌های یک‌بارهٔ بات که زیر بودجه می‌مانند اثری ندارد.

    تنظیمات پیش‌فرض (وقتی `allowBots` تنظیم شده باشد فعال هستند):

    - `maxEventsPerWindow: 20` -- pair بات می‌تواند در پنجرهٔ لغزان ۲۰ پیام تبادل کند
    - `windowSeconds: 60` -- طول پنجرهٔ لغزان
    - `cooldownSeconds: 60` -- وقتی بودجه فعال شود، هر پیام بات‌به‌بات اضافی در هر جهت به‌مدت یک دقیقه drop می‌شود

    پیش‌فرض مشترک را یک‌بار زیر `channels.defaults.botLoopProtection` پیکربندی کنید، سپس وقتی workflow مشروعی به headroom بیشتری نیاز دارد، Discord را override کنید. ترتیب precedence این است:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - پیش‌فرض‌های داخلی

    Discord از کلیدهای generic `maxEventsPerWindow`، `windowSeconds` و `cooldownSeconds` استفاده می‌کند.

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

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت voice در Discord موجود باشد
    - تایید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض upstream) شروع کنید و فقط در صورت نیاز تنظیم کنید
    - لاگ‌ها را برای موارد زیر دنبال کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر شکست‌ها پس از rejoin خودکار ادامه داشتند، لاگ‌ها را جمع‌آوری کنید و با تاریخچهٔ دریافت DAVE در upstream در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای پرسیگنال Discord">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجهٔ listener)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias قدیمی: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (uploadهای خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`)، `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`، `bindings[]` در سطح بالا (`type: "acp"`)، `pluralkit`، `execApprovals`، `intents`، `agentComponents.enabled`، `agentComponents.ttlMs`، `heartbeat`، `responsePrefix`

</Accordion>

## ایمنی و عملیات

- با tokenهای بات مانند secrets رفتار کنید (`DISCORD_BOT_TOKEN` در محیط‌های supervised ترجیح داده می‌شود).
- کمترین مجوزهای لازم Discord را اعطا کنید.
- اگر deploy/state دستور کهنه است، gateway را دوباره راه‌اندازی کنید و دوباره با `openclaw channels status --probe` بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را با Gateway pair کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار group chat و allowlist.
  </Card>
  <Card title="مسیریابی channel" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها route کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و channelها را به agentها نگاشت کنید.
  </Card>
  <Card title="دستورهای Slash" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستور native.
  </Card>
</CardGroup>
