---
read_when:
    - کار روی قابلیت‌های کانال Discord
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Discord
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:40:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های خصوصی و کانال‌های guild از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های خصوصی Discord به‌صورت پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و فهرست دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و جریان تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید با یک bot بسازید، bot را به سرور خود اضافه کنید، و آن را با OpenClaw جفت کنید. توصیه می‌کنیم bot خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز یکی ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="ساخت یک برنامه و bot در Discord">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را به هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="فعال‌سازی intentهای دارای امتیاز">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **Message Content Intent** (ضروری)
    - **Server Members Intent** (توصیه‌شده؛ برای فهرست‌های مجاز نقش‌ها و تطبیق نام به شناسه ضروری است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="کپی کردن توکن bot">
    در صفحه **Bot** دوباره به بالا برگردید و روی **Reset Token** کلیک کنید.

    <Note>
    برخلاف نامش، این کار نخستین توکن شما را تولید می‌کند — چیزی «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی کنید و جایی ذخیره کنید. این **Bot Token** شماست و به‌زودی به آن نیاز خواهید داشت.

  </Step>

  <Step title="تولید URL دعوت و افزودن bot به سرور">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست برای افزودن bot به سرور خود تولید خواهید کرد.

    به پایین تا **OAuth2 URL Generator** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    یک بخش **Bot Permissions** در پایین ظاهر می‌شود. دست‌کم این موارد را فعال کنید:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختیاری)

    این مجموعه پایه برای کانال‌های متنی معمولی است. اگر قصد دارید در رشته‌های Discord پیام بگذارید، از جمله گردش‌کارهای کانال انجمن یا رسانه که یک رشته ایجاد یا ادامه می‌دهند، **Send Messages in Threads** را نیز فعال کنید.
    URL تولیدشده در پایین را کپی کنید، آن را در مرورگر خود بچسبانید، سرورتان را انتخاب کنید، و برای اتصال روی **Continue** کلیک کنید. اکنون باید bot خود را در سرور Discord ببینید.

  </Step>

  <Step title="فعال‌سازی Developer Mode و جمع‌آوری شناسه‌ها">
    در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **User Settings** (نماد چرخ‌دنده کنار آواتار شما) کلیک کنید → در نوار کناری تا **Developer** بروید → **Developer Mode** را روشن کنید

        *(توجه: در برنامه موبایل Discord، Developer Mode زیر **App Settings** → **Advanced** قرار دارد)*

    2. در نوار کناری روی **server icon** خود راست‌کلیک کنید → **Copy Server ID**
    3. روی **own avatar** خود راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را کنار Bot Token ذخیره کنید — در مرحله بعد هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="اجازه دادن به پیام‌های خصوصی از اعضای سرور">
    برای اینکه جفت‌سازی کار کند، Discord باید به bot شما اجازه دهد به شما پیام خصوصی بدهد. روی **server icon** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار به اعضای سرور (از جمله botها) اجازه می‌دهد برای شما پیام خصوصی بفرستند. اگر می‌خواهید از پیام‌های خصوصی Discord با OpenClaw استفاده کنید، این گزینه را روشن نگه دارید. اگر فقط قصد دارید از کانال‌های guild استفاده کنید، می‌توانید پس از جفت‌سازی پیام‌های خصوصی را غیرفعال کنید.

  </Step>

  <Step title="تنظیم امن توکن bot خود (آن را در چت نفرستید)">
    توکن bot Discord شما یک راز است (مثل گذرواژه). پیش از پیام دادن به عامل خود، آن را روی ماشینی که OpenClaw را اجرا می‌کند تنظیم کنید.

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

    اگر OpenClaw از قبل به‌عنوان یک سرویس پس‌زمینه در حال اجراست، آن را از طریق برنامه Mac مربوط به OpenClaw یا با متوقف کردن و راه‌اندازی دوباره فرایند `openclaw gateway run` دوباره راه‌اندازی کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از shellای اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید، تا سرویس پس از راه‌اندازی دوباره بتواند SecretRef محیطی را resolve کند.
    اگر میزبان شما در lookup برنامه هنگام شروع Discord مسدود یا محدودیت نرخ شده است، شناسه برنامه/کلاینت Discord را از Developer Portal تنظیم کنید تا شروع بتواند آن REST call را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چندین bot Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="پیکربندی OpenClaw و جفت‌سازی">

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        در هر کانال موجود (مثلاً Telegram) با عامل OpenClaw خود چت کنید و به آن بگویید. اگر Discord نخستین کانال شماست، به‌جای آن از زبانه CLI / config استفاده کنید.

        > «من از قبل توکن bot Discord خود را در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با User ID `<user_id>` و Server ID `<server_id>` کامل کن.»
      </Tab>
      <Tab title="CLI / config">
        اگر پیکربندی مبتنی بر فایل را ترجیح می‌دهید، تنظیم کنید:

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

        جایگزین env برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه‌اندازی از راه دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس دوباره بدون `--dry-run` اجرا کنید. مقدارهای متنی ساده‌ی `token` پشتیبانی می‌شوند. مقدارهای SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند ربات Discord، token و application ID هر ربات را زیر حساب خودش نگه دارید. `channels.discord.applicationId` سطح بالا توسط حساب‌ها به ارث برده می‌شود، پس فقط وقتی آن را آنجا تنظیم کنید که همه‌ی حساب‌ها باید از یک application ID یکسان استفاده کنند.

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

  <Step title="تأیید نخستین جفت‌سازی DM">
    صبر کنید تا Gateway در حال اجرا باشد، سپس در Discord به ربات خود DM بدهید. با یک کد جفت‌سازی پاسخ می‌دهد.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        کد جفت‌سازی را در کانال موجود خود برای عاملتان بفرستید:

        > "این کد جفت‌سازی Discord را تأیید کن: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.

    اکنون باید بتوانید از طریق DM در Discord با عامل خود گفت‌وگو کنید.

  </Step>
</Steps>

<Note>
حل token با آگاهی از حساب انجام می‌شود. مقدارهای token در پیکربندی نسبت به جایگزین env اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به یک bot token یکسان resolve شوند، OpenClaw فقط یک پایشگر Gateway برای آن token راه‌اندازی می‌کند. token برگرفته از پیکربندی نسبت به جایگزین env پیش‌فرض اولویت دارد؛ در غیر این صورت نخستین حساب فعال اولویت می‌گیرد و حساب تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار پیام/کنش‌های کانال)، یک `token` صریح برای همان فراخوانی استفاده می‌شود. این برای کنش‌های ارسال و سبک read/probe اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات سیاست حساب/تلاش دوباره همچنان از حساب انتخاب‌شده در snapshot فعال زمان اجرا می‌آیند.
</Note>

## پیشنهادی: راه‌اندازی یک فضای کاری guild

وقتی DMها کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال، نشست عامل خودش را با context خودش دریافت می‌کند. این کار برای سرورهای خصوصی که فقط شما و رباتتان در آن هستید توصیه می‌شود.

<Steps>
  <Step title="افزودن سرور خود به allowlist مربوط به guild">
    این کار به عامل شما امکان می‌دهد در هر کانالی روی سرورتان پاسخ دهد، نه فقط در DMها.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > "شناسه سرور Discord من `<server_id>` را به allowlist مربوط به guild اضافه کن"
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
    به‌صورت پیش‌فرض، عامل شما فقط وقتی در کانال‌های guild پاسخ می‌دهد که @mention شده باشد. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های guild، پاسخ‌های عادی به‌صورت پیش‌فرض خودکار ارسال می‌شوند. برای اتاق‌های مشترک همیشه‌فعال، `messages.groupChat.visibleReplies: "message_tool"` را فعال کنید تا عامل بتواند در پس‌زمینه بماند و فقط وقتی تصمیم می‌گیرد پاسخ کانال مفید است، پست کند. این حالت با مدل‌های نسل جدید و قابل‌اعتماد برای ابزار، مانند GPT 5.5، بهترین عملکرد را دارد. برای پیکربندی کامل حالت حضور خاموش، [رویدادهای اتاق محیطی](/fa/channels/ambient-room-events) را ببینید.

    اگر Discord وضعیت typing را نشان می‌دهد و لاگ‌ها مصرف token را نشان می‌دهند اما پیامی پست نمی‌شود، بررسی کنید که آیا turn به‌عنوان یک رویداد اتاق محیطی پیکربندی شده یا برای پاسخ‌های قابل‌مشاهده‌ی message-tool فعال شده است.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > "به عامل من اجازه بده روی این سرور بدون نیاز به @mention شدن پاسخ دهد"
      </Tab>
      <Tab title="پیکربندی">
        در پیکربندی guild خود `requireMention: false` را تنظیم کنید:

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

        برای الزام به ارسال‌های message-tool برای پاسخ‌های قابل‌مشاهده‌ی گروه/کانال، `messages.groupChat.visibleReplies: "message_tool"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="برنامه‌ریزی برای حافظه در کانال‌های guild">
    به‌صورت پیش‌فرض، حافظه‌ی بلندمدت (MEMORY.md) فقط در نشست‌های DM بارگذاری می‌شود. کانال‌های guild، MEMORY.md را به‌صورت خودکار بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > "وقتی در کانال‌های Discord سؤال می‌پرسم، اگر به context بلندمدت از MEMORY.md نیاز داشتی، از memory_search یا memory_get استفاده کن."
      </Tab>
      <Tab title="دستی">
        اگر در هر کانال به context مشترک نیاز دارید، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` قرار دهید (برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال روی سرور Discord خود بسازید و شروع به گفت‌وگو کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال نشست ایزوله‌ی خودش را دریافت می‌کند — بنابراین می‌توانید `#coding`، `#home`، `#research` یا هر چیزی را که با گردش کارتان سازگار است راه‌اندازی کنید.

## مدل زمان اجرا

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord به Discord برمی‌گردند.
- فرادادهٔ گیلد/کانال Discord به‌عنوان زمینهٔ نامطمئن به پرامپت مدل اضافه می‌شود، نه به‌عنوان پیشوند پاسخ قابل مشاهده برای کاربر. اگر مدلی آن پوشش را
  برگرداند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از
  زمینهٔ بازپخش آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، گفت‌وگوهای مستقیم نشست اصلی عامل (`agent:main:main`) را به اشتراک می‌گذارند.
- کانال‌های گیلد کلیدهای نشست ایزوله هستند (`agent:<agentId>:discord:channel:<channelId>`).
- DMهای گروهی به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های اسلش بومی در نشست‌های فرمان ایزوله اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، در حالی که همچنان `CommandTargetSessionKey` را به نشست گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان Cron/Heartbeat فقط‌متنی به Discord از پاسخ نهایی
  قابل مشاهده برای دستیار، یک‌بار استفاده می‌کند. رسانه و بارهای مؤلفهٔ ساختاریافته وقتی عامل چند بار قابل تحویل منتشر می‌کند
  همچنان چندپیامی باقی می‌مانند.

## کانال‌های فروم

کانال‌های فروم و رسانهٔ Discord فقط پست‌های رشته را می‌پذیرند. OpenClaw از دو روش برای ایجاد آن‌ها پشتیبانی می‌کند:

- پیامی به والد فروم (`channel:<forumId>`) بفرستید تا رشته به‌صورت خودکار ایجاد شود. عنوان رشته از نخستین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ایجاد مستقیم رشته استفاده کنید. برای کانال‌های فروم `--message-id` را ارسال نکنید.

مثال: ارسال به والد فروم برای ایجاد رشته

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: ایجاد صریح یک رشتهٔ فروم

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای فروم مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود رشته (`channel:<threadId>`) ارسال کنید.

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای مؤلفه‌های Discord v2 برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با بار `components` استفاده کنید. نتایج تعامل به‌عنوان پیام‌های ورودی عادی به عامل مسیریابی می‌شوند و تنظیمات موجود `replyToMode` در Discord را دنبال می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- ردیف‌های کنش تا ۵ دکمه یا یک منوی انتخاب واحد را مجاز می‌کنند
- انواع انتخاب: `string`, `user`, `role`, `mentionable`, `channel`

به‌طور پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌ها و فرم‌ها بتوانند تا زمان انقضا چندین بار استفاده شوند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی دکمه کلیک کند، `allowedUsers` را روی آن دکمه تنظیم کنید (شناسه‌های کاربری Discord، تگ‌ها، یا `*`). وقتی پیکربندی شود، کاربران نامطابق یک رد موقت دریافت می‌کنند.

فراخوانی‌های برگشتی مؤلفه به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند. برای تغییر عمر رجیستری فراخوانی برگشتی برای حساب پیش‌فرض Discord، `channels.discord.agentComponents.ttlMs` را تنظیم کنید، یا برای بازنویسی یک حساب در راه‌اندازی چندحسابی، `channels.discord.accounts.<accountId>.agentComponents.ttlMs` را تنظیم کنید. مقدار بر حسب میلی‌ثانیه است، باید یک عدد صحیح مثبت باشد، و حداکثر آن `86400000` (۲۴ ساعت) است. TTLهای طولانی‌تر برای گردش‌کارهای بازبینی یا تأیید که نیاز دارند دکمه‌ها قابل استفاده بمانند مفید هستند، اما همچنین پنجره‌ای را که در آن یک پیام قدیمی Discord هنوز می‌تواند کنشی را تحریک کند طولانی‌تر می‌کنند. کوتاه‌ترین TTL متناسب با گردش‌کار را ترجیح دهید، و وقتی فراخوانی‌های برگشتی کهنه غافلگیرکننده خواهند بود، پیش‌فرض را نگه دارید.

فرمان‌های اسلش `/model` و `/models` یک انتخاب‌گر مدل تعاملی با فهرست‌های کشویی ارائه‌دهنده، مدل و محیط اجرای سازگار به‌همراه یک گام Submit باز می‌کنند. `/models add` منسوخ شده است و اکنون به‌جای ثبت مدل‌ها از چت، یک پیام منسوخ‌شدن برمی‌گرداند. پاسخ انتخاب‌گر موقت است و فقط کاربری که آن را فراخوانده می‌تواند از آن استفاده کند. منوهای انتخاب Discord به ۲۵ گزینه محدود هستند، بنابراین وقتی می‌خواهید انتخاب‌گر مدل‌های کشف‌شدهٔ پویا را فقط برای ارائه‌دهندگان منتخب مانند `openai` یا `vllm` نشان دهد، ورودی‌های `provider/*` را به `agents.defaults.models` اضافه کنید.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه دهید (تک فایل)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با مرجع پیوست مطابقت داشته باشد، برای بازنویسی نام بارگذاری از `filename` استفاده کنید

فرم‌های Modal:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- انواع فیلد: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw یک دکمهٔ تحریک‌کننده را به‌صورت خودکار اضافه می‌کند

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
    - `open` (نیازمند آن است که `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست DM باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` برای جفت‌سازی راهنمایی می‌شوند).

    اولویت چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط بر حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی اولویت دارد.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی هنوز برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` آن‌ها را وقتی بتواند بدون تغییر دسترسی انجام دهد، به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب هدف DM برای تحویل:

    - `user:<id>`
    - منشن `<@id>`

    شناسه‌های عددی بدون پیشوند معمولاً وقتی پیش‌فرض کانال فعال است به‌عنوان شناسهٔ کانال حل می‌شوند، اما شناسه‌های فهرست‌شده در `allowFrom` مؤثر DM حساب، برای سازگاری به‌عنوان اهداف DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="گروه‌های دسترسی">
    مجوزدهی DMهای Discord و فرمان متنی می‌تواند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کند.

    نام‌های گروه دسترسی میان کانال‌های پیام مشترک هستند. برای یک گروه ایستا که اعضایش در نحو عادی `allowFrom` هر کانال بیان می‌شوند، از `type: "message.senders"` استفاده کنید، یا وقتی مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کنند، از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک گروه دسترسی اینجا مستند شده است: [گروه‌های دسترسی](/fa/channels/access-groups).

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

    یک کانال متنی Discord فهرست اعضای جداگانه ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستندهٔ DM عضو گیلد پیکربندی‌شده است و پس از اعمال بازنویسی‌های نقش و کانال، در حال حاضر مجوز مؤثر `ViewChannel` روی کانال پیکربندی‌شده دارد.

    مثال: اجازه دهید هرکسی که می‌تواند `#maintainers` را ببیند به بات DM بفرستد، در حالی که DMها برای همهٔ افراد دیگر بسته می‌مانند.

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

    جست‌وجوها به‌صورت بسته شکست می‌خورند. اگر Discord مقدار `Missing Access` را برگرداند، جست‌وجوی عضو شکست بخورد، یا کانال به گیلد دیگری تعلق داشته باشد، فرستندهٔ DM غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر مخاطبان کانال، **Server Members Intent** را در Discord Developer Portal برای بات فعال کنید. DMها وضعیت عضو گیلد را شامل نمی‌شوند، بنابراین OpenClaw عضو را هنگام مجوزدهی از طریق Discord REST حل می‌کند.

  </Tab>

  <Tab title="سیاست گیلد">
    رسیدگی به گیلد توسط `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط مبنای امن وقتی `channels.discord` وجود دارد، `allowlist` است.

    رفتار `allowlist`:

    - گیلد باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های نقش)؛ اگر هرکدام پیکربندی شده باشد، فرستندگان وقتی با `users` یا `roles` مطابقت داشته باشند مجاز هستند
    - تطبیق مستقیم نام/تگ به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/تگ‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها ایمن‌تر هستند؛ `openclaw security audit` هنگام استفاده از ورودی‌های نام/تگ هشدار می‌دهد
    - اگر گیلدی `channels` پیکربندی‌شده داشته باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر گیلدی بلوک `channels` نداشته باشد، همهٔ کانال‌ها در آن گیلد فهرست‌مجاز مجاز هستند

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` ایجاد نکنید، fallback زمان اجرا `groupPolicy="allowlist"` است (با هشدار در لاگ‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="منشن‌ها و DMهای گروهی">
    پیام‌های گیلد به‌طور پیش‌فرض با منشن کنترل می‌شوند.

    تشخیص منشن شامل موارد زیر است:

    - منشن صریح بات
    - الگوهای منشن پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ‌به‌بات در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از نحو متعارف منشن استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای نقش‌ها. از شکل قدیمی منشن لقب `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر گیلد/کانال پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که کاربر/نقش دیگری را منشن می‌کنند اما بات را نه، حذف می‌کند (به‌جز @everyone/@here).

    DMهای گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌ها یا slugهای کانال)

  </Tab>
</Tabs>

### مسیریابی عامل مبتنی بر نقش

از `bindings[].match.roles` برای هدایت اعضای guild در Discord به agentهای مختلف بر اساس شناسهٔ نقش استفاده کنید. bindingهای مبتنی بر نقش فقط شناسهٔ نقش را می‌پذیرند و پس از bindingهای peer یا parent-peer و پیش از bindingهای فقط guild ارزیابی می‌شوند. اگر یک binding فیلدهای match دیگری هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ فیلدهای پیکربندی‌شده باید مطابقت داشته باشند.

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

## فرمان‌های بومی و احراز هویت فرمان

- `commands.native` به‌طور پیش‌فرض `"auto"` است و برای Discord فعال می‌شود.
- بازنویسی برای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` ثبت slash-commandهای Discord و پاک‌سازی آن‌ها را هنگام راه‌اندازی رد می‌کند. فرمان‌های قبلاً ثبت‌شده ممکن است تا زمانی که آن‌ها را از برنامهٔ Discord حذف کنید، همچنان در Discord قابل مشاهده بمانند.
- احراز هویت فرمان بومی از همان allowlistها/سیاست‌های Discord مانند پردازش عادی پیام استفاده می‌کند.
- فرمان‌ها ممکن است همچنان در رابط کاربری Discord برای کاربرانی که مجاز نیستند قابل مشاهده باشند؛ اجرا همچنان احراز هویت OpenClaw را اعمال می‌کند و "not authorized" برمی‌گرداند.

برای کاتالوگ و رفتار فرمان‌ها، [Slash commands](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض slash command:

- `ephemeral: true`

## جزئیات قابلیت‌ها

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
    `first` همیشه مرجع پاسخ بومی ضمنی را برای این نوبت به نخستین پیام خروجی Discord پیوست می‌کند.
    `batched` فقط زمانی مرجع پاسخ بومی ضمنی Discord را پیوست می‌کند که
    رویداد ورودی یک دستهٔ debounce‌شده از چند پیام بوده باشد. این زمانی مفید است
    که پاسخ‌های بومی را عمدتاً برای گفت‌وگوهای مبهم و انفجاری می‌خواهید، نه برای هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در context/history نمایان می‌شوند تا agentها بتوانند پیام‌های مشخص را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش لینک‌ها">
    Discord به‌طور پیش‌فرض برای URLها embedهای غنی لینک تولید می‌کند. OpenClaw به‌طور پیش‌فرض این embedهای تولیدشده را در پیام‌های خروجی Discord سرکوب می‌کند، بنابراین URLهای ارسال‌شده توسط agent تا زمانی که خودتان فعال نکنید به‌صورت لینک ساده باقی می‌مانند:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    برای بازنویسی یک حساب، `channels.discord.accounts.<id>.suppressEmbeds` را تنظیم کنید. ارسال‌های message-tool توسط agent نیز می‌توانند برای یک پیام واحد `suppressEmbeds: false` را پاس بدهند. payloadهای صریح `embeds` در Discord با تنظیم پیش‌فرض پیش‌نمایش لینک سرکوب نمی‌شوند.

  </Accordion>

  <Accordion title="پیش‌نمایش پخش زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هم‌زمان با رسیدن متن، پاسخ‌های پیش‌نویس را stream کند. `channels.discord.streaming` مقدارهای `off` | `partial` | `block` | `progress` (پیش‌فرض) را می‌پذیرد. `progress` یک پیش‌نویس وضعیت قابل ویرایش نگه می‌دارد و آن را با پیشرفت ابزار تا تحویل نهایی به‌روزرسانی می‌کند؛ برچسب آغازگر مشترک یک خط چرخان است، بنابراین پس از ظاهر شدن کار کافی، مانند بقیه به بیرون اسکرول می‌شود. `streamMode` یک alias runtime قدیمی است. برای بازنویسی config ذخیره‌شده به کلید canonical، `openclaw doctor --fix` را اجرا کنید.

    برای غیرفعال کردن ویرایش‌های پیش‌نمایش Discord، `channels.discord.streaming.mode` را روی `off` تنظیم کنید. اگر streaming بلوکی Discord صراحتاً فعال باشد، OpenClaw برای جلوگیری از دو بار stream کردن، stream پیش‌نمایش را رد می‌کند.

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

    - `partial` با رسیدن tokenها یک پیام پیش‌نمایش واحد را ویرایش می‌کند.
    - `block` قطعه‌هایی در اندازهٔ پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، محدودشده به `textChunkLimit`).
    - نتیجه‌های نهایی رسانه، خطا و پاسخ صریح، ویرایش‌های پیش‌نمایش معلق را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.
    - ردیف‌های ابزار/پیشرفت وقتی در دسترس باشد به‌صورت emoji فشرده + عنوان + جزئیات render می‌شوند، برای مثال `🛠️ Bash: run tests` یا `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (پیش‌فرض `false`) متن commentary/preamble دستیار را در پیش‌نویس موقت پیشرفت فعال می‌کند. commentary پیش از نمایش پاک‌سازی می‌شود، گذرا می‌ماند و تحویل پاسخ نهایی را تغییر نمی‌دهد.
    - `streaming.progress.maxLineChars` بودجهٔ پیش‌نمایش پیشرفت برای هر خط را کنترل می‌کند. نثر روی مرز واژه‌ها کوتاه می‌شود؛ جزئیات فرمان و مسیر suffixهای مفید را نگه می‌دارند.
    - `streaming.preview.commandText` / `streaming.progress.commandText` جزئیات command/exec را در خطوط فشردهٔ پیشرفت کنترل می‌کند: `raw` (پیش‌فرض) یا `status` (فقط برچسب ابزار).

    متن خام command/exec را پنهان کنید و هم‌زمان خطوط فشردهٔ پیشرفت را نگه دارید:

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

    streaming پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی برمی‌گردند. وقتی streaming `block` صراحتاً فعال باشد، OpenClaw برای جلوگیری از دو بار stream کردن، stream پیش‌نمایش را رد می‌کند.

  </Accordion>

  <Accordion title="تاریخچه، context و رفتار thread">
    context تاریخچهٔ guild:

    - پیش‌فرض `channels.discord.historyLimit` مقدار `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچهٔ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار thread:

    - threadهای Discord به‌عنوان sessionهای کانال route می‌شوند و مگر اینکه بازنویسی شوند، config کانال والد را به ارث می‌برند.
    - sessionهای thread انتخاب `/model` در سطح session کانال والد را فقط به‌عنوان fallback مدل به ارث می‌برند؛ انتخاب‌های `/model` محلی thread همچنان اولویت دارند و تاریخچهٔ transcript والد کپی نمی‌شود مگر اینکه ارث‌بری transcript فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) threadهای خودکار جدید را برای seed شدن از transcript والد فعال می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های message-tool می‌توانند مقصدهای DM به شکل `user:<id>` را resolve کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام fallback فعال‌سازی مرحلهٔ پاسخ حفظ می‌شود.

    موضوع‌های کانال به‌عنوان context **غیرقابل اعتماد** تزریق می‌شوند. allowlistها مشخص می‌کنند چه کسی می‌تواند agent را trigger کند، نه یک مرز کامل redaction برای supplemental-context.

  </Accordion>

  <Accordion title="sessionهای وابسته به thread برای subagentها">
    Discord می‌تواند یک thread را به یک مقصد session bind کند تا پیام‌های بعدی در همان thread همچنان به همان session route شوند (از جمله sessionهای subagent).

    فرمان‌ها:

    - `/focus <target>` اتصال thread فعلی/جدید به یک مقصد subagent/session
    - `/unfocus` حذف binding thread فعلی
    - `/agents` نمایش runهای فعال و وضعیت binding
    - `/session idle <duration|off>` بررسی/به‌روزرسانی auto-unfocus ناشی از عدم فعالیت برای bindingهای focus‌شده
    - `/session max-age <duration|off>` بررسی/به‌روزرسانی حداکثر سن سخت برای bindingهای focus‌شده

    Config:

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
    - `spawnSessions` ساخت/اتصال خودکار threadها را برای `sessions_spawn({ thread: true })` و spawnهای thread در ACP کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` context بومی subagent را برای spawnهای وابسته به thread کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` توسط `openclaw doctor --fix` مهاجرت داده می‌شوند.
    - اگر bindingهای thread برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط با binding thread در دسترس نیستند.

    [Sub-agents](/fa/tools/subagents)، [ACP Agents](/fa/tools/acp-agents) و [Configuration Reference](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="bindingهای پایدار کانال ACP">
    برای workspaceهای ACP پایدار و «همیشه روشن»، bindingهای ACP تایپ‌شدهٔ سطح بالا را که conversationهای Discord را هدف می‌گیرند پیکربندی کنید.

    مسیر Config:

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

    - `/acp spawn codex --bind here` کانال یا thread فعلی را درجا bind می‌کند و پیام‌های آینده را روی همان session ACP نگه می‌دارد. پیام‌های thread binding کانال والد را به ارث می‌برند.
    - در یک کانال یا thread bindشده، `/new` و `/reset` همان session ACP را درجا reset می‌کنند. bindingهای موقت thread می‌توانند resolution مقصد را هنگام فعال بودن بازنویسی کنند.
    - `spawnSessions` ساخت/binding thread فرزند را از طریق `--thread auto|here` gate می‌کند.

    برای جزئیات رفتار binding، [ACP Agents](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش برای هر guild:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای system تبدیل می‌شوند و به session route‌شدهٔ Discord پیوست می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw یک emoji تأیید ارسال می‌کند.

    ترتیب resolution:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback به emoji هویت agent (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکته‌ها:

    - Discord emoji یونیکد یا نام‌های emoji سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن‌های Config">
    نوشتن‌های config آغازشده از کانال به‌طور پیش‌فرض فعال هستند.

    این روی flowهای `/config set|unset` اثر می‌گذارد (وقتی قابلیت‌های فرمان فعال باشند).

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

  <Accordion title="proxy Gateway">
    ترافیک WebSocket مربوط به gateway در Discord و lookupهای REST هنگام راه‌اندازی (application ID + resolution allowlist) را با `channels.discord.proxy` از طریق یک proxy HTTP(S) route کنید.

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

  <Accordion title="پشتیبانی PluralKit">
    resolution PluralKit را فعال کنید تا پیام‌های proxied به هویت عضو system نگاشت شوند:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // اختیاری؛ برای سیستم‌های خصوصی لازم است
      },
    },
  },
}
```

    نکات:

    - allowlistها می‌توانند از `pk:<memberId>` استفاده کنند
    - نام‌های نمایشی عضو فقط زمانی بر اساس نام/slug مطابقت داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true` باشد
    - جست‌وجوها از شناسه پیام اصلی استفاده می‌کنند و به پنجره زمانی محدود هستند
    - اگر جست‌وجو ناموفق باشد، پیام‌های proxied به‌عنوان پیام‌های bot در نظر گرفته می‌شوند و حذف می‌شوند، مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="نام‌های مستعار اشاره خروجی">
    وقتی agentها برای کاربران شناخته‌شده Discord به اشاره‌های خروجی قطعی نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها handleهای بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربری Discord هستند. handleهای ناشناخته، `@everyone`، `@here`، و اشاره‌های داخل code spanهای Markdown بدون تغییر می‌مانند.

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

  <Accordion title="پیکربندی Presence">
    به‌روزرسانی‌های Presence زمانی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت تنظیم کنید، یا وقتی Presence خودکار را فعال کنید.

    نمونه فقط وضعیت:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    نمونه فعالیت (وضعیت سفارشی نوع فعالیت پیش‌فرض است):

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

    نمونه Streaming:

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

    نگاشت نوع فعالیت:

    - 0: در حال بازی
    - 1: Streaming (نیازمند `activityUrl`)
    - 2: در حال گوش دادن
    - 3: در حال تماشا
    - 4: سفارشی (از متن فعالیت به‌عنوان حالت وضعیت استفاده می‌کند؛ emoji اختیاری است)
    - 5: در حال رقابت

    نمونه Presence خودکار (سیگنال سلامت runtime):

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

    Presence خودکار، دسترس‌پذیری runtime را به وضعیت Discord نگاشت می‌کند: سالم => آنلاین، کاهش‌یافته یا ناشناخته => idle، تمام‌شده یا در دسترس نبودن => dnd. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از جای‌نگهدار `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="تأییدها در Discord">
    Discord از مدیریت تأیید مبتنی بر دکمه در DMها پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptهای تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` بازمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    وقتی `enabled` تنظیم نشده یا `"auto"` باشد و دست‌کم یک تأییدکننده، یا از `execApprovals.approvers` یا از `commands.ownerAllowFrom`، قابل resolve باشد، Discord تأییدهای exec بومی را به‌طور خودکار فعال می‌کند. Discord تأییدکنندگان exec را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنتاج نمی‌کند. برای غیرفعال کردن صریح Discord به‌عنوان client تأیید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس مخصوص owner مانند `/diagnostics` و `/export-trajectory`، OpenClaw promptهای تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. اگر owner فراخواننده یک مسیر owner در Discord داشته باشد، ابتدا Discord DM را امتحان می‌کند؛ اگر در دسترس نباشد، به اولین مسیر owner موجود از `commands.ownerAllowFrom`، مانند Telegram، بازمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، prompt تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان resolve‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. promptهای تأیید شامل متن فرمان هستند، بنابراین تحویل کانالی را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال از کلید session قابل استخراج نباشد، OpenClaw به تحویل DM بازمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترکی را که کانال‌های گفت‌وگوی دیگر استفاده می‌کنند، render می‌کند. adapter بومی Discord عمدتاً مسیریابی DM تأییدکننده و fanout کانال را اضافه می‌کند.
    وقتی این دکمه‌ها وجود داشته باشند، UX اصلی تأیید هستند؛ OpenClaw
    فقط زمانی باید یک فرمان دستی `/approve` را درج کند که نتیجه tool بگوید
    تأییدهای گفت‌وگو در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر runtime تأیید بومی Discord فعال نباشد، OpenClaw
    prompt قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    runtime فعال باشد اما یک کارت بومی نتواند به هیچ targetای تحویل داده شود،
    OpenClaw یک اعلان fallback در همان گفت‌وگو با فرمان دقیق `/approve`
    از تأیید در انتظار ارسال می‌کند.

    auth Gateway و حل تأیید از قرارداد مشترک client Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` resolve می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## Tools و gateهای action

actionهای پیام Discord شامل پیام‌رسانی، مدیریت کانال، moderation، Presence، و actionهای metadata هستند.

نمونه‌های core:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- moderation: `timeout`، `kick`، `ban`
- Presence: `setPresence`

action `event-create` یک پارامتر اختیاری `image` (URL یا مسیر فایل محلی) را برای تنظیم تصویر کاور رویداد زمان‌بندی‌شده می‌پذیرد.

gateهای action زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض gate:

| گروه action                                                                                                                                                             | پیش‌فرض  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions، messages، threads، pins، polls، search، memberInfo، roleInfo، channelInfo، channels، voiceStatus، events، stickers، emojiUploads، stickerUploads، permissions | فعال  |
| roles                                                                                                                                                                    | غیرفعال |
| moderation                                                                                                                                                               | غیرفعال |
| Presence                                                                                                                                                                 | غیرفعال |

## رابط کاربری Components v2

OpenClaw از components v2 Discord برای تأییدهای exec و markerهای cross-context استفاده می‌کند. actionهای پیام Discord همچنین می‌توانند برای UI سفارشی `components` را بپذیرند (پیشرفته؛ نیازمند ساخت payload component از طریق tool discord)، در حالی که `embeds` قدیمی همچنان در دسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ accent استفاده‌شده توسط containerهای component Discord را تنظیم می‌کند (hex).
- برای هر account با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- `channels.discord.agentComponents.ttlMs` کنترل می‌کند callbackهای component ارسال‌شده Discord چه مدت ثبت‌شده باقی بمانند (پیش‌فرض `1800000`، حداکثر `86400000`). برای هر account با `channels.discord.accounts.<id>.agentComponents.ttlMs` تنظیم کنید.
- وقتی components v2 وجود داشته باشند، `embeds` نادیده گرفته می‌شوند.
- پیش‌نمایش‌های URL ساده به‌طور پیش‌فرض سرکوب می‌شوند. وقتی یک لینک خروجی واحد باید باز شود، `suppressEmbeds: false` را روی action پیام تنظیم کنید.

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

## Voice

Discord دو سطح voice متمایز دارد: **voice channels** بلادرنگ (گفت‌وگوهای پیوسته) و **ضمیمه‌های پیام voice** (فرمت پیش‌نمایش waveform). gateway از هر دو پشتیبانی می‌کند.

### Voice channels

چک‌لیست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی از allowlistهای role/user استفاده می‌شود، Server Members Intent را فعال کنید.
3. bot را با scopeهای `bot` و `applications.commands` دعوت کنید.
4. در voice channel هدف، Connect، Speak، Send Messages، و Read Message History را اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل sessionها از `/vc join|leave|status` استفاده کنید. این فرمان از agent پیش‌فرض account استفاده می‌کند و همان rules مربوط به allowlist و group policy را مانند سایر فرمان‌های Discord دنبال می‌کند.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

برای بررسی permissionهای مؤثر bot پیش از پیوستن، اجرا کنید:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

نمونه پیوستن خودکار:

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

- `voice.tts` فقط برای پخش صوتی `stt-tts`، `messages.tts` را بازنویسی می‌کند. حالت‌های Realtime از `voice.realtime.speakerVoice` استفاده می‌کنند.
- `voice.mode` مسیر مکالمه را کنترل می‌کند. مقدار پیش‌فرض `agent-proxy` است: یک واسط صوتی Realtime زمان‌بندی نوبت، وقفه، و پخش را مدیریت می‌کند، کار محتوایی را از طریق `openclaw_agent_consult` به عامل مسیریابی‌شده OpenClaw واگذار می‌کند، و نتیجه را مانند یک اعلان تایپ‌شده Discord از همان گوینده در نظر می‌گیرد. `stt-tts` جریان قدیمی‌تر STT دسته‌ای به‌علاوه TTS را نگه می‌دارد. `bidi` اجازه می‌دهد مدل Realtime مستقیما گفتگو کند و هم‌زمان `openclaw_agent_consult` را برای مغز OpenClaw ارائه دهد.
- `voice.agentSession` کنترل می‌کند کدام مکالمه OpenClaw نوبت‌های صوتی را دریافت کند. برای استفاده از نشست خود کانال صوتی، آن را تنظیم‌نشده بگذارید، یا `{ mode: "target", target: "channel:<text-channel-id>" }` را تنظیم کنید تا کانال صوتی مانند افزونه میکروفون/بلندگوی یک نشست موجود کانال متنی Discord مثل `#maintainers` عمل کند.
- `voice.model` مغز عامل OpenClaw را برای پاسخ‌های صوتی Discord و مشورت‌های Realtime بازنویسی می‌کند. برای ارث‌بری از مدل عامل مسیریابی‌شده، آن را تنظیم‌نشده بگذارید. این گزینه از `voice.realtime.model` جداست.
- `voice.followUsers` به ربات اجازه می‌دهد با کاربران انتخاب‌شده به صوت Discord بپیوندد، جابه‌جا شود، و خارج شود. برای قواعد رفتار و مثال‌ها، [دنبال کردن کاربران در صوت](#follow-users-in-voice) را ببینید.
- `agent-proxy` گفتار را از طریق `discord-voice` مسیریابی می‌کند؛ این مسیر مجوزدهی عادی مالک/ابزار را برای گوینده و نشست هدف حفظ می‌کند، اما ابزار `tts` عامل را پنهان می‌کند چون صوت Discord مالک پخش است. به‌طور پیش‌فرض، `agent-proxy` برای گویندگان مالک به مشورت دسترسی کامل به ابزارها در سطح مالک می‌دهد (`voice.realtime.toolPolicy: "owner"`) و به‌شدت ترجیح می‌دهد پیش از پاسخ‌های محتوایی با عامل OpenClaw مشورت کند (`voice.realtime.consultPolicy: "always"`). در آن حالت پیش‌فرض `always`، لایه Realtime پیش از پاسخ مشورت، متن پرکننده را خودکار به گفتار تبدیل نمی‌کند؛ گفتار را ضبط و رونویسی می‌کند، سپس پاسخ مسیریابی‌شده OpenClaw را پخش می‌کند. اگر چند پاسخ مشورت اجباری در حالی کامل شوند که Discord هنوز در حال پخش نخستین پاسخ است، پاسخ‌های گفتار دقیق بعدی به‌جای جایگزین کردن گفتار در میانه جمله، تا بیکار شدن پخش در صف می‌مانند.
- در حالت `stt-tts`، STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` روی رونویسی اثر نمی‌گذارد.
- در حالت‌های Realtime، `voice.realtime.provider`، `voice.realtime.model`، و `voice.realtime.speakerVoice` نشست صوتی Realtime را پیکربندی می‌کنند. برای OpenAI Realtime 2 به‌همراه مغز Codex، از `voice.realtime.model: "gpt-realtime-2"` و `voice.model: "openai/gpt-5.5"` استفاده کنید.
- حالت‌های صوتی Realtime به‌طور پیش‌فرض فایل‌های نمایه کوچک `IDENTITY.md`، `USER.md`، و `SOUL.md` را در دستورهای ارائه‌دهنده Realtime قرار می‌دهند تا نوبت‌های مستقیم سریع همان هویت، زمینه کاربر، و شخصیت عامل مسیریابی‌شده OpenClaw را حفظ کنند. برای سفارشی‌سازی، `voice.realtime.bootstrapContextFiles` را روی زیرمجموعه‌ای تنظیم کنید، یا برای غیرفعال کردن آن از `[]` استفاده کنید. فایل‌های راه‌انداز Realtime پشتیبانی‌شده به همان فایل‌های نمایه محدود هستند؛ `AGENTS.md` در زمینه عادی عامل باقی می‌ماند. زمینه نمایه تزریق‌شده برای کارهای workspace، واقعیت‌های جاری، جستجوی حافظه، یا اقدامات متکی به ابزار جایگزین `openclaw_agent_consult` نمی‌شود.
- در حالت Realtime `agent-proxy` متعلق به OpenAI، `voice.realtime.requireWakeName: true` را تنظیم کنید تا صوت Realtime در Discord تا وقتی رونویسی با نام بیدارباش شروع یا تمام نشده، ساکت بماند. نام‌های بیدارباش پیکربندی‌شده باید یک یا دو واژه باشند. اگر `voice.realtime.wakeNames` تنظیم نشده باشد، OpenClaw از `name` عامل مسیریابی‌شده به‌علاوه `OpenClaw` استفاده می‌کند و در صورت نبود آن به شناسه عامل به‌علاوه `OpenClaw` برمی‌گردد. دروازه‌گذاری با نام بیدارباش پاسخ خودکار ارائه‌دهنده Realtime را غیرفعال می‌کند، نوبت‌های پذیرفته‌شده را از مسیر مشورت عامل OpenClaw عبور می‌دهد، و وقتی یک نام بیدارباش ابتدایی از رونویسی جزئی پیش از رسیدن رونویسی نهایی تشخیص داده شود، یک تایید کوتاه گفتاری می‌دهد.
- ارائه‌دهنده Realtime متعلق به OpenAI نام‌های رویداد جاری Realtime 2 و نام‌های مستعار قدیمی سازگار با Codex را برای رویدادهای خروجی صدا و رونویسی می‌پذیرد، بنابراین snapshotهای سازگار ارائه‌دهنده می‌توانند بدون حذف صدای دستیار تغییر کنند.
- `voice.realtime.bargeIn` کنترل می‌کند آیا رویدادهای شروع گفتار در Discord پخش فعال Realtime را قطع کنند یا نه. اگر تنظیم نشده باشد، از تنظیم وقفه صوت ورودی ارائه‌دهنده Realtime پیروی می‌کند.
- `voice.realtime.minBargeInAudioEndMs` حداقل مدت پخش دستیار را پیش از آن کنترل می‌کند که یک barge-in در Realtime متعلق به OpenAI صدا را کوتاه کند. پیش‌فرض: `250`. برای وقفه فوری در اتاق‌های کم‌اکو، `0` را تنظیم کنید، یا برای چیدمان‌های بلندگوی پر اکو مقدار را بالاتر ببرید.
- برای استفاده از صدای OpenAI در پخش Discord، `voice.tts.provider: "openai"` را تنظیم کنید و یک صدای Text-to-speech را در `voice.tts.providers.openai.speakerVoice` انتخاب کنید. `cedar` در مدل فعلی TTS متعلق به OpenAI انتخاب خوبی با صدای مردانه است.
- بازنویسی‌های `systemPrompt` مخصوص هر کانال Discord روی نوبت‌های رونویسی صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونویسی صوتی وضعیت مالک را برای فرمان‌های مالک‌محور و اقدامات کانال از `allowFrom` در Discord (یا `dm.allowFrom`) استخراج می‌کنند. نمایانی ابزارهای عامل از سیاست ابزار پیکربندی‌شده برای نشست مسیریابی‌شده پیروی می‌کند.
- صوت Discord برای پیکربندی‌های فقط متنی opt-in است؛ برای فعال‌سازی فرمان‌های `/vc`، runtime صوت، و intent در Gateway به نام `GuildVoiceStates`، `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند عضویت در intent وضعیت صوت را صراحتا بازنویسی کند. برای اینکه intent از فعال‌سازی موثر صوت پیروی کند، آن را تنظیم‌نشده بگذارید.
- اگر `voice.autoJoin` برای یک guild چند ورودی داشته باشد، OpenClaw به آخرین کانال پیکربندی‌شده برای آن guild می‌پیوندد.
- `voice.allowedChannels` یک allowlist اقامت اختیاری است. برای اجازه دادن به `/vc join` در هر کانال صوتی مجاز Discord، آن را تنظیم‌نشده بگذارید. وقتی تنظیم شود، `/vc join`، پیوستن خودکار هنگام شروع، و جابه‌جایی‌های وضعیت صوت ربات به ورودی‌های فهرست‌شده `{ guildId, channelId }` محدود می‌شوند. برای رد کردن همه پیوستن‌های صوتی Discord، آن را روی یک آرایه خالی تنظیم کنید. اگر Discord ربات را بیرون از allowlist جابه‌جا کند، OpenClaw آن کانال را ترک می‌کند و وقتی هدف auto-join پیکربندی‌شده‌ای در دسترس باشد، دوباره به آن می‌پیوندد.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` مستقیما به گزینه‌های پیوستن `@discordjs/voice` پاس داده می‌شوند.
- مقدارهای پیش‌فرض `@discordjs/voice` در صورت تنظیم‌نشدن، `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- OpenClaw برای دریافت صوت Discord و پخش PCM خام Realtime از کدک همراه `libopus-wasm` استفاده می‌کند. این بسته یک build ثابت‌شده WebAssembly از libopus را عرضه می‌کند و به افزونه‌های بومی opus نیاز ندارد.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و auto-join کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw چه مدت منتظر بماند تا یک نشست صوتی قطع‌شده پیش از نابود شدن، شروع به اتصال دوباره کند. پیش‌فرض: `15000`.
- در حالت `stt-tts`، پخش صوت فقط به‌خاطر اینکه کاربر دیگری شروع به صحبت کند متوقف نمی‌شود. برای جلوگیری از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS ضبط صوت جدید را نادیده می‌گیرد؛ برای نوبت بعدی پس از پایان پخش صحبت کنید. حالت‌های Realtime شروع گفتار را به‌عنوان سیگنال‌های barge-in به ارائه‌دهنده Realtime ارسال می‌کنند.
- در حالت‌های Realtime، اکو از بلندگوها به میکروفون باز می‌تواند شبیه barge-in به نظر برسد و پخش را قطع کند. برای اتاق‌های Discord با اکوی زیاد، `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید تا OpenAI بر اثر صوت ورودی خودکار وقفه ایجاد نکند. اگر همچنان می‌خواهید رویدادهای شروع گفتار در Discord پخش فعال را قطع کنند، `voice.realtime.bargeIn: true` را اضافه کنید. پل Realtime متعلق به OpenAI کوتاه‌سازی‌های پخش کوتاه‌تر از `voice.realtime.minBargeInAudioEndMs` را به‌عنوان اکو/نویز محتمل نادیده می‌گیرد و به‌جای پاک کردن پخش Discord، آن‌ها را به‌صورت ردشده ثبت می‌کند.
- `voice.captureSilenceGraceMs` کنترل می‌کند OpenClaw پس از اینکه Discord گزارش دهد یک گوینده متوقف شده، چه مدت پیش از نهایی کردن آن بخش صوتی برای STT صبر کند. پیش‌فرض: `2000`؛ اگر Discord مکث‌های عادی را به رونویسی‌های جزئی بریده‌بریده تقسیم می‌کند، این مقدار را بالا ببرید.
- وقتی ElevenLabs ارائه‌دهنده TTS انتخاب‌شده باشد، پخش صوت Discord از TTS جریانی استفاده می‌کند و از جریان پاسخ ارائه‌دهنده شروع می‌شود. ارائه‌دهندگان بدون پشتیبانی جریانی به مسیر فایل موقت سنتزشده برمی‌گردند.
- OpenClaw همچنین خرابی‌های رمزگشایی دریافت را پایش می‌کند و پس از خرابی‌های تکراری در یک بازه کوتاه، با ترک/پیوستن دوباره به کانال صوتی خودکار بازیابی می‌کند.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت بارها `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح padding بالادستی از PR #11449 در discord.js است که issue #11419 در discord.js را بست.
- رویدادهای دریافت `The operation was aborted` زمانی مورد انتظار هستند که OpenClaw یک بخش گوینده ضبط‌شده را نهایی می‌کند؛ آن‌ها تشخیص‌های پرجزئیات هستند، نه هشدار.
- لاگ‌های پرجزئیات صوت Discord برای هر بخش گوینده پذیرفته‌شده، یک پیش‌نمایش محدود یک‌خطی از رونویسی STT دارند، بنابراین اشکال‌زدایی هر دو سمت کاربر و سمت پاسخ عامل را بدون تخلیه متن رونویسی نامحدود نشان می‌دهد.
- در حالت `agent-proxy`، fallback مشورت اجباری قطعه‌های رونویسی احتمالا ناقص مثل متن پایان‌یافته با `...` یا یک اتصال‌دهنده انتهایی مانند `and`، به‌علاوه پایان‌بندی‌های آشکارا غیرقابل‌اقدام مانند «الان برمی‌گردم» یا «خداحافظ» را رد می‌کند. وقتی این کار از یک پاسخ صف‌شده قدیمی جلوگیری کند، لاگ‌ها `forced agent consult skipped reason=...` را نشان می‌دهند.

### دنبال کردن کاربران در صوت

وقتی می‌خواهید ربات صوتی Discord به‌جای پیوستن به یک کانال ثابت هنگام شروع یا انتظار برای `/vc join`، با یک یا چند کاربر شناخته‌شده Discord بماند، از `voice.followUsers` استفاده کنید.

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

- `followUsers` شناسه‌های خام کاربر Discord و مقدارهای `discord:<id>` را می‌پذیرد. OpenClaw پیش از تطبیق رویدادهای وضعیت صوت، هر دو شکل را نرمال‌سازی می‌کند.
- وقتی `followUsers` پیکربندی شده باشد، مقدار پیش‌فرض `followUsersEnabled` برابر `true` است. برای نگه داشتن فهرست ذخیره‌شده اما توقف دنبال کردن خودکار صوت، آن را روی `false` تنظیم کنید.
- وقتی یک کاربر دنبال‌شده به یک کانال صوتی مجاز بپیوندد، OpenClaw به همان کانال می‌پیوندد. وقتی کاربر جابه‌جا شود، OpenClaw همراه او جابه‌جا می‌شود. وقتی کاربر دنبال‌شده فعال قطع شود، OpenClaw خارج می‌شود.
- اگر چند کاربر دنبال‌شده در یک guild باشند و کاربر دنبال‌شده فعال خارج شود، OpenClaw پیش از ترک guild به کانال کاربر دنبال‌شده ردیابی‌شده دیگری می‌رود. اگر چند کاربر دنبال‌شده هم‌زمان جابه‌جا شوند، آخرین رویداد وضعیت صوت مشاهده‌شده برنده می‌شود.
- `allowedChannels` همچنان اعمال می‌شود. یک کاربر دنبال‌شده در کانال غیرمجاز نادیده گرفته می‌شود، و یک نشست متعلق به follow به کاربر دنبال‌شده دیگری منتقل می‌شود یا خارج می‌شود.
- OpenClaw رویدادهای وضعیت صوت ازدست‌رفته را هنگام شروع و در یک بازه محدود همگام‌سازی می‌کند. همگام‌سازی guildهای پیکربندی‌شده را نمونه‌برداری می‌کند و تعداد جستجوهای REST را در هر اجرا محدود می‌کند، بنابراین فهرست‌های بسیار بزرگ `followUsers` ممکن است برای همگرا شدن به بیش از یک بازه نیاز داشته باشند.
- اگر Discord یا یک مدیر ربات را در حالی که در حال دنبال کردن کاربر است جابه‌جا کند، OpenClaw نشست صوتی را بازسازی می‌کند و وقتی مقصد مجاز باشد، مالکیت follow را حفظ می‌کند. اگر ربات به بیرون از `allowedChannels` منتقل شود، OpenClaw خارج می‌شود و وقتی هدف پیکربندی‌شده‌ای وجود داشته باشد، دوباره به آن می‌پیوندد.
- بازیابی دریافت DAVE ممکن است پس از خرابی‌های تکراری رمزگشایی، همان کانال را ترک کرده و دوباره به آن بپیوندد. نشست‌های متعلق به follow در آن مسیر بازیابی مالکیت follow خود را نگه می‌دارند، بنابراین قطع شدن بعدی کاربر دنبال‌شده همچنان باعث ترک کانال می‌شود.

بین حالت‌های پیوستن انتخاب کنید:

- برای چیدمان‌های شخصی یا اپراتوری که ربات باید وقتی شما در صوت هستید به‌طور خودکار در صوت باشد، از `followUsers` استفاده کنید.
- برای ربات‌های اتاق ثابت که باید حتی وقتی هیچ کاربر ردیابی‌شده‌ای در صوت نیست حاضر باشند، از `autoJoin` استفاده کنید.
- برای پیوستن‌های یک‌باره یا اتاق‌هایی که حضور صوتی خودکار در آن‌ها غافلگیرکننده است، از `/vc join` استفاده کنید.

کدک صوت Discord:

- گزارش‌های دریافت صوت نشان می‌دهند: `discord voice: opus decoder: libopus-wasm`.
- پخش بی‌درنگ، PCM استریوی خام 48 kHz را پیش از تحویل بسته‌ها به `@discordjs/voice`، با همان بسته‌ی همراه `libopus-wasm` به Opus کدگذاری می‌کند.
- پخش فایل و جریان ارائه‌دهنده با ffmpeg به PCM استریوی خام 48 kHz تبدیل می‌شود، سپس برای جریان بسته‌های Opus که به Discord ارسال می‌شود از `libopus-wasm` استفاده می‌کند.

خط لوله‌ی STT به‌همراه TTS:

- ضبط PCM از Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` مسئول STT است، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونوشت از مسیر ورودی و مسیریابی Discord عبور داده می‌شود، در حالی که LLM پاسخ با سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و متن بازگردانده‌شده را می‌خواهد، چون صوت Discord مالک پخش نهایی TTS است.
- `voice.model`، وقتی تنظیم شود، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ ارائه‌دهندگان دارای قابلیت جریان‌دهی مستقیماً پخش‌کننده را تغذیه می‌کنند، وگرنه فایل صوتی حاصل در کانال پیوسته‌شده پخش می‌شود.

نمونه‌ی نشست کانال صوتی پیش‌فرض agent-proxy:

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

بدون بلوک `voice.agentSession`، هر کانال صوتی نشست مسیریابی‌شده‌ی OpenClaw خودش را می‌گیرد. برای مثال، `/vc join channel:234567890123456789` با نشست همان کانال صوتی Discord صحبت می‌کند. مدل بی‌درنگ فقط رابط صوتی جلویی است؛ درخواست‌های اصلی به عامل OpenClaw پیکربندی‌شده سپرده می‌شوند. اگر مدل بی‌درنگ بدون فراخوانی ابزار مشاوره یک رونوشت نهایی تولید کند، OpenClaw مشاوره را به‌عنوان پشتیبان اجباری می‌کند تا حالت پیش‌فرض همچنان مثل صحبت با عامل رفتار کند.

نمونه‌ی STT به‌همراه TTS قدیمی:

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

نمونه‌ی bidi بی‌درنگ:

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

صوت به‌عنوان افزونه‌ای برای نشست کانال Discord موجود:

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

در حالت `agent-proxy`، ربات به کانال صوتی پیکربندی‌شده می‌پیوندد، اما نوبت‌های عامل OpenClaw از نشست و عامل مسیریابی‌شده‌ی معمول کانال هدف استفاده می‌کنند. نشست صوتی بی‌درنگ نتیجه‌ی بازگردانده‌شده را دوباره در کانال صوتی بیان می‌کند. عامل ناظر همچنان می‌تواند طبق سیاست ابزار خود از ابزارهای عادی پیام استفاده کند، از جمله ارسال یک پیام جداگانه‌ی Discord اگر آن اقدام درست باشد.

وقتی یک اجرای واگذارشده‌ی OpenClaw فعال است، رونوشت‌های صوتی جدید Discord پیش از شروع نوبت عامل دیگر، به‌عنوان کنترل اجرای زنده در نظر گرفته می‌شوند. عبارت‌هایی مانند «status»، «cancel that»، «use the smaller fix» یا «when you're done also check tests» به‌عنوان ورودی وضعیت، لغو، هدایت یا پیگیری برای نشست فعال طبقه‌بندی می‌شوند. نتایج وضعیت، لغو، هدایت پذیرفته‌شده و پیگیری در کانال صوتی بیان می‌شوند تا تماس‌گیرنده بداند OpenClaw درخواست را انجام داده است یا نه.

شکل‌های هدف مفید:

- `target: "channel:123456789012345678"` از طریق نشست کانال متنی Discord مسیریابی می‌کند.
- `target: "123456789012345678"` به‌عنوان هدف کانال در نظر گرفته می‌شود.
- `target: "dm:123456789012345678"` یا `target: "user:123456789012345678"` از طریق نشست پیام مستقیم آن مسیر می‌گیرد.

نمونه‌ی OpenAI Realtime با پژواک زیاد:

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

از این حالت زمانی استفاده کنید که مدل پخش خودش از Discord را از طریق میکروفون باز می‌شنود، اما همچنان می‌خواهید با صحبت کردن آن را قطع کنید. OpenClaw جلوی قطع خودکار OpenAI بر اساس صوت ورودی خام را می‌گیرد، در حالی که `bargeIn: true` اجازه می‌دهد رویدادهای شروع صحبت در Discord و صوت گوینده‌ای که از قبل فعال است، پاسخ‌های بی‌درنگ فعال را پیش از رسیدن نوبت ضبط‌شده‌ی بعدی به OpenAI لغو کنند. سیگنال‌های بسیار زودهنگام قطع با `audioEndMs` کمتر از `minBargeInAudioEndMs` به‌عنوان پژواک/نویز احتمالی در نظر گرفته و نادیده گرفته می‌شوند تا مدل در اولین فریم پخش قطع نشود.

گزارش‌های صوتی مورد انتظار:

- هنگام پیوستن: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- هنگام شروع بی‌درنگ: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- هنگام صوت گوینده: `discord voice: realtime speaker turn opened ...`، `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`، و `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- هنگام گفتار قدیمیِ ردشده: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` یا `reason=non-actionable-closing ...`
- هنگام تکمیل پاسخ بی‌درنگ: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- هنگام توقف/بازنشانی پخش: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- هنگام مشاوره‌ی بی‌درنگ: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- هنگام پاسخ عامل: `discord voice: agent turn answer ...`
- هنگام گفتار دقیق صف‌شده: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، به‌دنبال آن `discord voice: realtime exact speech dequeued reason=player-idle ...`
- هنگام تشخیص قطع صحبت: `discord voice: realtime barge-in detected source=speaker-start ...` یا `discord voice: realtime barge-in detected source=active-speaker-audio ...`، به‌دنبال آن `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- هنگام وقفه‌ی بی‌درنگ: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، به‌دنبال آن یا `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` یا `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- هنگام پژواک/نویز نادیده‌گرفته‌شده: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- هنگام غیرفعال بودن قطع صحبت: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- هنگام پخش بیکار: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

برای اشکال‌زدایی صوت قطع‌شده، گزارش‌های صوتی بی‌درنگ را مانند یک خط زمانی بخوانید:

1. `realtime audio playback started` یعنی Discord شروع به پخش صوت دستیار کرده است. پل از این نقطه شمارش تکه‌های خروجی دستیار، بایت‌های PCM Discord، بایت‌های بی‌درنگ ارائه‌دهنده و مدت صوت سنتزشده را شروع می‌کند.
2. `realtime speaker turn opened` فعال شدن یک گوینده‌ی Discord را نشان می‌دهد. اگر پخش از قبل فعال باشد و `bargeIn` فعال شده باشد، ممکن است پس از آن `barge-in detected source=speaker-start` بیاید.
3. `realtime input audio started` اولین فریم صوتی واقعی دریافت‌شده برای آن نوبت گوینده را نشان می‌دهد. `outputActive=true` یا مقدار غیرصفر `outputAudioMs` در اینجا یعنی میکروفون در حالی ورودی می‌فرستد که پخش دستیار هنوز فعال است.
4. `barge-in detected source=active-speaker-audio` یعنی OpenClaw هنگام فعال بودن پخش دستیار، صوت زنده‌ی گوینده را دیده است. این برای تمایز یک وقفه‌ی واقعی از رویداد شروع گوینده‌ی Discord بدون صوت مفید است.
5. `barge-in requested reason=...` یعنی OpenClaw از ارائه‌دهنده‌ی بی‌درنگ خواسته پاسخ فعال را لغو یا کوتاه کند. این شامل `outputAudioMs`، `outputActive` و `playbackChunks` است تا ببینید پیش از وقفه، واقعاً چه مقدار صوت دستیار پخش شده بود.
6. `realtime audio playback stopped reason=...` نقطه‌ی بازنشانی پخش محلی Discord است. دلیل نشان می‌دهد چه کسی پخش را متوقف کرده است: `barge-in`، `player-idle`، `provider-clear-audio`، `forced-agent-consult`، `stream-close` یا `session-close`.
7. `realtime speaker turn closed` نوبت ورودی ضبط‌شده را خلاصه می‌کند. `chunks=0` یا `hasAudio=false` یعنی نوبت گوینده باز شد اما هیچ صوت قابل استفاده‌ای به پل بی‌درنگ نرسید. `interruptedPlayback=true` یعنی آن نوبت ورودی با خروجی دستیار هم‌پوشانی داشت و منطق قطع صحبت را فعال کرد.

فیلدهای مفید:

- `outputAudioMs`: مدت صوت دستیار که ارائه‌دهنده‌ی بی‌درنگ پیش از خط گزارش تولید کرده است.
- `audioMs`: مدت صوت دستیار که OpenClaw پیش از توقف پخش شمارش کرده است.
- `elapsedMs`: زمان دیواری بین باز و بسته شدن جریان پخش یا نوبت گوینده.
- `discordBytes`: بایت‌های PCM استریوی 48 kHz ارسال‌شده به صوت Discord یا دریافت‌شده از آن.
- `realtimeBytes`: بایت‌های PCM با قالب ارائه‌دهنده که به ارائه‌دهنده‌ی بی‌درنگ ارسال شده یا از آن دریافت شده‌اند.
- `playbackChunks`: تکه‌های صوت دستیار که برای پاسخ فعال به Discord فرستاده شده‌اند.
- `sinceLastAudioMs`: فاصله‌ی بین آخرین فریم صوتی ضبط‌شده‌ی گوینده و بسته شدن نوبت گوینده.

الگوهای رایج:

- قطع فوری با `source=active-speaker-audio`، مقدار کم `outputAudioMs`، و همان کاربر در نزدیکی معمولاً به ورود پژواک بلندگو به میکروفون اشاره دارد. `voice.realtime.minBargeInAudioEndMs` را افزایش دهید، صدای بلندگو را کم کنید، از هدفون استفاده کنید، یا `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید.
- `source=speaker-start` به‌دنبال `speaker turn closed ... hasAudio=false` یعنی Discord شروع گوینده را گزارش کرده اما هیچ صوتی به OpenClaw نرسیده است. این می‌تواند یک رویداد گذرای صوتی Discord، رفتار نویزگیت، یا فعال شدن لحظه‌ای میکروفون توسط کلاینت باشد.
- `audio playback stopped reason=stream-close` بدون قطع صحبت نزدیک یا `provider-clear-audio` یعنی جریان پخش محلی Discord به‌طور غیرمنتظره پایان یافته است. گزارش‌های قبلی ارائه‌دهنده و پخش‌کننده‌ی Discord را بررسی کنید.
- `capture ignored during playback (barge-in disabled)` یعنی OpenClaw هنگام فعال بودن صوت دستیار، ورودی را عمداً کنار گذاشته است. اگر می‌خواهید گفتار پخش را قطع کند، `voice.realtime.bargeIn` را فعال کنید.
- `barge-in ignored ... outputActive=false` یعنی Discord یا VAD ارائه‌دهنده گفتار را گزارش کرده، اما OpenClaw هیچ پخش فعالی برای قطع کردن نداشته است. این نباید صوت را قطع کند.

اعتبارنامه‌ها برای هر مؤلفه جداگانه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، احراز هویت TTS برای `messages.tts`/`voice.tts`، و احراز هویت ارائه‌دهنده‌ی بی‌درنگ برای `voice.realtime.providers` یا پیکربندی احراز هویت عادی ارائه‌دهنده.

### پیام‌های صوتی

پیام‌های صوتی Discord پیش‌نمایش شکل موج نشان می‌دهند و به صوت OGG/Opus نیاز دارند. OpenClaw شکل موج را به‌طور خودکار تولید می‌کند، اما برای بررسی و تبدیل، به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه دهید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در همان payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="از intentهای غیرمجاز استفاده شده یا ربات هیچ پیام guildی را نمی‌بیند">

    - Message Content Intent را فعال کنید
    - وقتی به تفکیک کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، gateway را دوباره راه‌اندازی کنید

  </Accordion>

  <Accordion title="پیام‌های guild به‌طور غیرمنتظره مسدود شده‌اند">

    - `groupPolicy` را بررسی کنید
    - allowlist مربوط به guild را زیر `channels.discord.guilds` بررسی کنید
    - اگر نقشه‌ی `channels` برای guild وجود داشته باشد، فقط کانال‌های فهرست‌شده مجاز هستند
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

    - `groupPolicy="allowlist"` بدون allowlist منطبق برای guild/channel
    - `requireMention` در جای نادرست پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی کانال باشد)
    - فرستنده توسط allowlist مربوط به `users` در guild/channel مسدود شده است

  </Accordion>

  <Accordion title="نوبت‌های طولانی Discord یا پاسخ‌های تکراری">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    پیچ‌های تنظیم صف Gateway در Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener در Discord gateway را کنترل می‌کند، نه طول عمر نوبت agent

    Discord برای نوبت‌های agent صف‌شده، timeout متعلق به کانال اعمال نمی‌کند. Message listenerها بلافاصله واگذار می‌کنند، و اجراهای صف‌شده‌ی Discord ترتیب هر session را حفظ می‌کنند تا چرخه‌ی عمر session/tool/runtime کامل شود یا کار را متوقف کند.

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

  <Accordion title="هشدارهای timeout در lookup متادیتای Gateway">
    OpenClaw پیش از اتصال، متادیتای `/gateway/bot` مربوط به Discord را دریافت می‌کند. شکست‌های گذرا به URL پیش‌فرض gateway در Discord بازمی‌گردند و در لاگ‌ها rate-limit می‌شوند.

    پیچ‌های تنظیم timeout متادیتا:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback محیطی وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="راه‌اندازی‌های دوباره به‌دلیل timeout رویداد READY در Gateway">
    OpenClaw هنگام startup و پس از reconnectهای runtime منتظر رویداد `READY` در gateway مربوط به Discord می‌ماند. تنظیمات چندحساب با startup staggering ممکن است نسبت به پیش‌فرض به پنجره‌ی READY طولانی‌تری در startup نیاز داشته باشند.

    پیچ‌های تنظیم timeout برای READY:

    - startup تک‌حساب: `channels.discord.gatewayReadyTimeoutMs`
    - startup چندحساب: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback محیطی startup وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض startup: `15000` (۱۵ ثانیه)، حداکثر: `120000`
    - runtime تک‌حساب: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime چندحساب: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback محیطی runtime وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض runtime: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="ناسازگاری‌های audit مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق runtime همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را به‌طور کامل تأیید کند.

  </Accordion>

  <Accordion title="مشکلات DM و pairing">

    - DM غیرفعال است: `channels.discord.dm.enabled=false`
    - سیاست DM غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در حالت `pairing` در انتظار تأیید pairing است

  </Accordion>

  <Accordion title="حلقه‌های ربات به ربات">
    به‌طور پیش‌فرض پیام‌هایی که توسط ربات نوشته شده‌اند نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قوانین سخت‌گیرانه‌ی mention و allowlist استفاده کنید.
    ترجیح دهید `channels.discord.allowBots="mentions"` را به‌کار ببرید تا فقط پیام‌های ربات‌هایی پذیرفته شوند که به ربات mention می‌دهند.

    OpenClaw همچنین [محافظت در برابر حلقه‌ی ربات](/fa/channels/bot-loop-protection) مشترک را ارائه می‌کند. هرگاه `allowBots` اجازه دهد پیام‌های نوشته‌شده توسط ربات به dispatch برسند، Discord رویداد ورودی را به factهای `(account, channel, bot pair)` نگاشت می‌کند و guard عمومی pair پس از عبور pair از بودجه‌ی رویداد پیکربندی‌شده، آن pair را سرکوب می‌کند. این guard جلوی حلقه‌های مهارنشدنی دو رباتی را می‌گیرد که قبلاً باید با rate limitهای Discord متوقف می‌شدند؛ بر استقرارهای تک‌ربات یا پاسخ‌های یک‌باره‌ی ربات که زیر بودجه می‌مانند اثری ندارد.

    تنظیمات پیش‌فرض (وقتی `allowBots` تنظیم شده باشد فعال هستند):

    - `maxEventsPerWindow: 20` -- pair ربات می‌تواند در پنجره‌ی لغزان ۲۰ پیام ردوبدل کند
    - `windowSeconds: 60` -- طول پنجره‌ی لغزان
    - `cooldownSeconds: 60` -- پس از فعال شدن بودجه، هر پیام اضافی ربات به ربات در هر جهت به‌مدت یک دقیقه رها می‌شود

    پیش‌فرض مشترک را یک‌بار زیر `channels.defaults.botLoopProtection` پیکربندی کنید، سپس وقتی یک workflow مشروع به ظرفیت بیشتری نیاز دارد، Discord را override کنید. اولویت به این صورت است:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - پیش‌فرض‌های داخلی

    Discord از کلیدهای عمومی `maxEventsPerWindow`، `windowSeconds`، و `cooldownSeconds` استفاده می‌کند.

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

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صدای Discord موجود باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض) است
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض upstream) شروع کنید و فقط در صورت نیاز تنظیم کنید
    - لاگ‌ها را برای موارد زیر زیرنظر بگیرید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر شکست‌ها پس از rejoin خودکار ادامه پیدا کردند، لاگ‌ها را جمع‌آوری کنید و با تاریخچه‌ی دریافت DAVE در upstream در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای پرسیگنال Discord">

- startup/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- command: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- event queue: `eventQueue.listenerTimeout` (بودجه‌ی listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- reply/history: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- delivery: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (نام مستعار قدیمی: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb` (آپلودهای خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`)، `retry`
- actions: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- features: `threadBindings`, سطح‌بالای `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- tokenهای ربات را secret در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های supervised ترجیح داده می‌شود).
- کمترین مجوزهای لازم Discord را اعطا کنید.
- اگر deploy/state فرمان stale است، gateway را دوباره راه‌اندازی کنید و با `openclaw channels status --probe` دوباره بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را با gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار group chat و allowlist.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها route کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="مسیریابی چند-agent" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و کانال‌ها را به agentها نگاشت کنید.
  </Card>
  <Card title="Slash commandها" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان native.
  </Card>
</CardGroup>
