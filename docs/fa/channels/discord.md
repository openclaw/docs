---
read_when:
    - کار روی قابلیت‌های کانال Discord
summary: راه‌اندازی ربات Discord، کلیدهای پیکربندی، مؤلفه‌ها، صدا و عیب‌یابی
title: Discord
x-i18n:
    generated_at: "2026-07-12T09:37:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw از طریق Gateway رسمی Discord، به‌عنوان ربات به Discord متصل می‌شود. پیام‌های خصوصی و کانال‌های سرور پشتیبانی می‌شوند.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های خصوصی Discord به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="فرمان‌های اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان‌های بومی و فهرست فرمان‌ها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    جریان تشخیص و تعمیر میان‌کانالی.
  </Card>
</CardGroup>

## راه‌اندازی سریع

یک برنامه Discord همراه با ربات ایجاد کنید، ربات را به سرور خود بیفزایید و آن را با OpenClaw جفت کنید. در صورت امکان از یک سرور خصوصی استفاده کنید؛ اگر لازم است، ابتدا [یکی ایجاد کنید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**).

<Steps>
  <Step title="ایجاد برنامه و ربات Discord">
    در [Discord Developer Portal](https://discord.com/developers/applications)، روی **New Application** کلیک کنید و نامی برای آن انتخاب کنید (برای مثال «OpenClaw»).

    در نوار کناری، **Bot** را باز کنید و **Username** را روی نام عامل خود تنظیم کنید.

  </Step>

  <Step title="فعال‌سازی intentهای دارای دسترسی ویژه">
    همچنان در صفحه **Bot**، زیر **Privileged Gateway Intents** موارد زیر را فعال کنید:

    - **Message Content Intent** (الزامی)
    - **Server Members Intent** (توصیه‌شده؛ برای فهرست‌های مجاز نقش‌ها، تطبیق نام با شناسه و گروه‌های دسترسی مخاطبان کانال الزامی است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های وضعیت حضور)

  </Step>

  <Step title="کپی‌کردن توکن ربات">
    در صفحه **Bot**، روی **Reset Token** کلیک کنید و توکن را کپی کنید.

    <Note>
    برخلاف نام آن، این کار نخستین توکن شما را ایجاد می‌کند و چیزی «بازنشانی» نمی‌شود.
    </Note>

  </Step>

  <Step title="ایجاد نشانی دعوت و افزودن ربات به سرور">
    در نوار کناری، **OAuth2** را باز کنید. در **OAuth2 URL Generator**، دامنه‌های زیر را فعال کنید:

    - `bot`
    - `applications.commands`

    در بخش **Bot Permissions** که ظاهر می‌شود، دست‌کم موارد زیر را فعال کنید:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختیاری)

    این موارد، حداقل مجوزهای لازم برای کانال‌های متنی عادی هستند. اگر ربات در رشته‌ها مطلب ارسال خواهد کرد — از جمله گردش‌کارهای کانال انجمن یا رسانه که رشته‌ای را ایجاد یا ادامه می‌دهند — گزینه **Send Messages in Threads** را نیز فعال کنید.

    نشانی ایجادشده را کپی و در مرورگر باز کنید، سرور خود را انتخاب کنید و روی **Continue** کلیک کنید. اکنون ربات باید در سرور شما ظاهر شود.

  </Step>

  <Step title="فعال‌سازی Developer Mode و گردآوری شناسه‌ها">
    در برنامه Discord، Developer Mode را فعال کنید تا بتوانید شناسه‌ها را کپی کنید:

    1. **User Settings** (نماد چرخ‌دنده) → **Developer** → گزینه **Developer Mode** را روشن کنید
       *(در تلفن همراه: **App Settings** → **Advanced**)*
    2. روی **نماد سرور** خود راست‌کلیک کنید → **Copy Server ID**
    3. روی **تصویر نمایه خودتان** راست‌کلیک کنید → **Copy User ID**

    شناسه سرور و شناسه کاربر را همراه با توکن ربات نگه دارید؛ در مرحله بعد به هر سه نیاز دارید.

  </Step>

  <Step title="اجازه‌دادن به پیام‌های خصوصی اعضای سرور">
    برای کارکرد جفت‌سازی، Discord باید به ربات اجازه دهد برای شما پیام خصوصی بفرستد. روی **نماد سرور** خود راست‌کلیک کنید → **Privacy Settings** → گزینه **Direct Messages** را روشن کنید.

    اگر از پیام‌های خصوصی Discord با OpenClaw استفاده می‌کنید، این گزینه را روشن نگه دارید. اگر فقط از کانال‌های سرور استفاده می‌کنید، می‌توانید پس از جفت‌سازی آن را غیرفعال کنید.

  </Step>

  <Step title="تنظیم امن توکن ربات (آن را در گفت‌وگو ارسال نکنید)">
    توکن ربات یک راز است. پیش از ارسال پیام به عامل، آن را روی دستگاهی که OpenClaw را اجرا می‌کند تنظیم کنید:

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

    اگر OpenClaw از قبل به‌صورت سرویس پس‌زمینه اجرا می‌شود، آن را از طریق برنامه مک OpenClaw یا با متوقف‌کردن و اجرای دوباره فرایند `openclaw gateway run` راه‌اندازی مجدد کنید.
    برای نصب‌های سرویس مدیریت‌شده، فرمان `openclaw gateway install` را در پوسته‌ای اجرا کنید که `DISCORD_BOT_TOKEN` در آن تنظیم شده است، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس پس از راه‌اندازی مجدد بتواند SecretRef محیطی را برطرف کند.
    اگر میزبان شما در جست‌وجوی برنامه هنگام راه‌اندازی توسط Discord مسدود یا محدود شده است، شناسه برنامه/کارخواه را از Developer Portal تنظیم کنید تا راه‌اندازی بتواند آن فراخوانی REST را نادیده بگیرد: برای حساب پیش‌فرض از `channels.discord.applicationId` یا برای هر ربات از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="پیکربندی OpenClaw و جفت‌سازی">

    <Tabs>
      <Tab title="از عامل خود بخواهید">
        در یک کانال موجود (برای مثال Telegram) با عامل OpenClaw خود گفت‌وگو کنید و درخواست را به آن بگویید. اگر Discord نخستین کانال شما است، به‌جای آن از زبانه CLI / پیکربندی استفاده کنید.

        > «من از قبل توکن ربات Discord خود را در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با شناسه کاربر `<user_id>` و شناسه سرور `<server_id>` تکمیل کن.»
      </Tab>
      <Tab title="CLI / پیکربندی">
        پیکربندی مبتنی بر فایل:

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

        مقدار جایگزین محیطی برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید، سپس فرمان را بدون `--dry-run` دوباره اجرا کنید. رشته‌های متنی ساده `token` نیز کار می‌کنند و مقادیر SecretRef برای `channels.discord.token` در ارائه‌دهندگان env/file/exec پشتیبانی می‌شوند. به [مدیریت رازها](/fa/gateway/secrets) مراجعه کنید.

        برای چند ربات Discord، توکن و شناسه برنامه هر ربات را زیر حساب خودش نگه دارید. حساب‌ها یک `channels.discord.applicationId` سطح‌بالا را به ارث می‌برند؛ بنابراین آن را فقط زمانی در آنجا تنظیم کنید که همه حساب‌ها از شناسه برنامه یکسانی استفاده می‌کنند.

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

  <Step title="تأیید نخستین جفت‌سازی پیام خصوصی">
    پس از اجرای Gateway، در Discord به ربات خود پیام خصوصی بفرستید. ربات با یک کد جفت‌سازی پاسخ می‌دهد.

    <Tabs>
      <Tab title="از عامل خود بخواهید">
        کد جفت‌سازی را در کانال موجود خود برای عامل ارسال کنید:

        > «این کد جفت‌سازی Discord را تأیید کن: `<CODE>`»
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    کدهای جفت‌سازی پس از ۱ ساعت منقضی می‌شوند. پس از تأیید، در یک پیام خصوصی Discord با عامل خود گفت‌وگو کنید.

  </Step>
</Steps>

<Note>
رفع توکن با آگاهی از حساب انجام می‌شود. مقادیر توکن پیکربندی بر مقدار جایگزین محیطی اولویت دارند و `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به توکن ربات یکسانی منتهی شوند، OpenClaw فقط یک پایشگر Gateway را برای آن توکن راه‌اندازی می‌کند: توکنی که از پیکربندی آمده باشد بر مقدار جایگزین محیطی اولویت دارد؛ در غیر این صورت، نخستین حساب فعال برنده می‌شود و حساب تکراری با دلیل `duplicate bot token` به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار پیام/کنش‌های کانال)، `token` صریح هر فراخوانی برای همان فراخوانی استفاده می‌شود. این موضوع برای کنش‌های ارسال و خواندن/کاوش (خواندن/جست‌وجو/دریافت/رشته/سنجاق‌ها/مجوزها) صدق می‌کند. سیاست حساب و تنظیمات تلاش مجدد همچنان از حساب انتخاب‌شده در تصویر لحظه‌ای فعال زمان اجرا گرفته می‌شوند.
</Note>

## توصیه‌شده: راه‌اندازی فضای کاری سرور

پس از کارکرد پیام‌های خصوصی، می‌توانید سرور خود را به فضای کاری کاملی تبدیل کنید که در آن هر کانال، نشست عامل مستقل خود را با زمینه مخصوص خود دارد. این حالت برای سرورهای خصوصی که فقط شما و رباتتان در آن حضور دارید توصیه می‌شود.

<Steps>
  <Step title="افزودن سرور به فهرست مجاز سرورها">
    این کار به عامل اجازه می‌دهد در هر کانال سرور شما پاسخ دهد، نه فقط در پیام‌های خصوصی.

    <Tabs>
      <Tab title="از عامل خود بخواهید">
        > «شناسه سرور Discord من، `<server_id>`، را به فهرست مجاز سرورها اضافه کن»
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

  <Step title="اجازه‌دادن به پاسخ‌ها بدون @اشاره">
    به‌طور پیش‌فرض، عامل در کانال‌های سرور فقط زمانی پاسخ می‌دهد که با @ به آن اشاره شود. در یک سرور خصوصی احتمالاً می‌خواهید به همه پیام‌ها پاسخ دهد.

    در کانال‌های سرور، پاسخ‌های عادی به‌طور پیش‌فرض خودکار ارسال می‌شوند. برای اتاق‌های اشتراکی همیشه‌فعال، `messages.groupChat.visibleReplies: "message_tool"` را فعال کنید تا عامل بتواند بی‌صدا نظاره کند و فقط وقتی پاسخ در کانال را مفید تشخیص می‌دهد مطلبی ارسال کند. این قابلیت با مدل‌های نسل جدید و قابل‌اعتماد در استفاده از ابزار، مانند GPT-5.6 Sol، بهترین عملکرد را دارد. رویدادهای محیطی اتاق ساکت می‌مانند، مگر اینکه ابزار چیزی ارسال کند. برای پیکربندی کامل حالت نظاره، به [رویدادهای محیطی اتاق](/fa/channels/ambient-room-events) مراجعه کنید.

    اگر Discord وضعیت در حال تایپ را نشان می‌دهد و گزارش‌ها مصرف توکن را ثبت می‌کنند، اما پیامی ارسال نمی‌شود، بررسی کنید که آیا نوبت به‌عنوان رویداد محیطی اتاق پیکربندی شده یا پاسخ‌های قابل‌مشاهده مبتنی بر ابزار پیام برای آن فعال شده‌اند.

    <Tabs>
      <Tab title="از عامل خود بخواهید">
        > «به عامل من اجازه بده بدون نیاز به @اشاره در این سرور پاسخ دهد»
      </Tab>
      <Tab title="پیکربندی">
        در پیکربندی سرور خود، `requireMention: false` را تنظیم کنید:

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

        برای الزام ارسال از طریق ابزار پیام در پاسخ‌های قابل‌مشاهده گروه/کانال، `messages.groupChat.visibleReplies: "message_tool"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="برنامه‌ریزی برای حافظه در کانال‌های سرور">
    حافظه بلندمدت (`MEMORY.md`) فقط در نشست‌های پیام خصوصی به‌طور خودکار بارگیری می‌شود؛ کانال‌های سرور آن را بارگیری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بخواهید">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر به زمینه بلندمدت `MEMORY.md` نیاز داری، از `memory_search` یا `memory_get` استفاده کن.»
      </Tab>
      <Tab title="دستی">
        برای زمینه مشترک در همه کانال‌ها، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` قرار دهید (برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون کانال‌ها را ایجاد و گفت‌وگو را آغاز کنید. عامل نام کانال را می‌بیند و هر کانال یک نشست مجزا است — `#coding`، `#home`، `#research` یا هر ساختاری را که با گردش‌کار شما سازگار است راه‌اندازی کنید.

## مدل زمان اجرا

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ ورودی Discord به Discord بازمی‌گردد.
- فراداده سرور/کانال Discord به‌عنوان زمینه نامطمئن به درخواست مدل افزوده می‌شود، نه به‌عنوان پیشوند قابل‌مشاهده برای کاربر در پاسخ. اگر مدلی آن پوشش را در پاسخ کپی کند، OpenClaw فراداده کپی‌شده را از پاسخ‌های خروجی و زمینه بازپخش آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، گفت‌وگوهای مستقیم نشست اصلی عامل (`agent:main:main`) را به اشتراک می‌گذارند.
- کانال‌های سرور کلیدهای نشست مجزا دارند (`agent:<agentId>:discord:channel:<channelId>`).
- پیام‌های خصوصی گروهی به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های اسلش بومی در نشست‌های فرمان مجزا (`agent:<agentId>:discord:slash:<userId>`) اجرا می‌شوند، درحالی‌که همچنان `CommandTargetSessionKey` را به نشست گفت‌وگوی مسیریابی‌شده منتقل می‌کنند.
- تحویل اعلان متنی Cron/Heartbeat به Discord به پاسخ نهایی قابل‌مشاهده دستیار فروکاسته می‌شود و فقط یک بار ارسال می‌شود. وقتی عامل چند محموله قابل‌تحویل تولید کند، محموله‌های رسانه‌ای و مؤلفه‌های ساختاریافته همچنان به‌صورت چندپیامی باقی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانه Discord فقط نوشته‌های رشته‌ای را می‌پذیرند. OpenClaw از دو روش برای ایجاد آن‌ها پشتیبانی می‌کند:

- برای ایجاد خودکار یک رشته، پیامی به والد انجمن (`channel:<forumId>`) ارسال کنید. عنوان رشته نخستین خط غیرخالی پیام است (که تا محدودیت ۱۰۰ نویسه‌ای Discord برای نام رشته کوتاه می‌شود).
- برای ایجاد مستقیم یک رشته، از `openclaw message thread create` استفاده کنید. برای کانال‌های انجمن، `--message-id` را ارسال نکنید.

برای ایجاد رشته، به والد انجمن ارسال کنید:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

یک رشته انجمن را به‌صورت صریح ایجاد کنید:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، پیام را به خود رشته (`channel:<threadId>`) ارسال کنید.

## مؤلفه‌های تعاملی

OpenClaw از محفظه‌های مؤلفه نسخه ۲ Discord برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با یک بار داده `components` استفاده کنید. نتایج تعامل به‌صورت پیام‌های ورودی عادی به عامل بازگردانده می‌شوند و از تنظیمات موجود `replyToMode` در Discord پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- ردیف‌های کنش حداکثر ۵ دکمه یا یک منوی انتخاب را می‌پذیرند
- انواع انتخاب: `string`، `user`، `role`، `mentionable`، `channel`

مؤلفه‌ها به‌طور پیش‌فرض یک‌بارمصرف هستند. برای اینکه دکمه‌ها، گزینه‌های انتخاب و فرم‌ها تا زمان انقضا چندین بار قابل استفاده باشند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن افرادی که می‌توانند روی یک دکمه کلیک کنند، `allowedUsers` را روی آن دکمه تنظیم کنید (شناسه‌های کاربری Discord، برچسب‌ها یا `*`). کاربران نامنطبق یک پیام رد موقت دریافت می‌کنند.

فراخوانی‌های برگشتی مؤلفه به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند. برای تغییر طول عمر دفتر ثبت فراخوانی‌های برگشتی حساب پیش‌فرض، `channels.discord.agentComponents.ttlMs` و برای هر حساب، `channels.discord.accounts.<accountId>.agentComponents.ttlMs` را تنظیم کنید. مقدار برحسب میلی‌ثانیه است، باید یک عدد صحیح مثبت باشد و حداکثر آن `86400000` (۲۴ ساعت) است. TTLهای طولانی‌تر برای گردش‌کارهای بازبینی/تأیید که باید دکمه‌ها برای مدت بیشتری قابل استفاده بمانند مناسب‌اند، اما بازه‌ای را که طی آن یک پیام قدیمی Discord همچنان می‌تواند کنشی را فعال کند افزایش می‌دهند. کوتاه‌ترین TTL متناسب را ترجیح دهید و هنگامی که فراخوانی‌های برگشتی منقضی‌شده می‌توانند غیرمنتظره باشند، مقدار پیش‌فرض را حفظ کنید.

فرمان‌های اسلش `/model` و `/models` یک انتخاب‌گر تعاملی مدل را با فهرست‌های کشویی ارائه‌دهنده، مدل و محیط اجرای سازگار، به‌همراه مرحله Submit باز می‌کنند. `/models add` منسوخ شده است و به‌جای ثبت مدل‌ها از گفت‌وگو، پیام منسوخ‌شدن را برمی‌گرداند. پاسخ انتخاب‌گر موقت است و فقط کاربری که آن را فراخوانده می‌تواند از آن استفاده کند. منوهای انتخاب Discord به ۲۵ گزینه محدود هستند؛ بنابراین وقتی می‌خواهید انتخاب‌گر مدل‌های کشف‌شده پویا را فقط برای ارائه‌دهندگان منتخب مانند `openai` یا `vllm` نمایش دهد، ورودی‌های `provider/*` را به `agents.defaults.models` اضافه کنید.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست (`attachment://<filename>`) اشاره کنند
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (یک فایل)؛ برای چند فایل از `media-gallery` استفاده کنید
- هنگامی که نام بارگذاری باید با مرجع پیوست مطابقت داشته باشد، برای بازنویسی آن از `filename` استفاده کنید

فرم‌های پنجره‌ای:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- انواع فیلد: `text`، `checkbox`، `radio`، `select`، `role-select`، `user-select`
- OpenClaw به‌طور خودکار یک دکمه فعال‌ساز اضافه می‌کند

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
  <Tab title="سیاست پیام خصوصی">
    `channels.discord.dmPolicy` دسترسی پیام خصوصی را کنترل می‌کند. `channels.discord.allowFrom` فهرست مجاز متعارف پیام خصوصی است.

    - `pairing` (پیش‌فرض)
    - `allowlist` (حداقل به یک فرستنده `allowFrom` نیاز دارد)
    - `open` (لازم است `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست پیام خصوصی باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` از آن‌ها خواسته می‌شود جفت‌سازی کنند).

    تقدم چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی تقدم دارد.
    - حساب‌های نام‌دار هنگامی که `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` در صورتی که بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب مقصد پیام خصوصی برای تحویل:

    - `user:<id>`
    - اشاره `<@id>`

    وقتی یک کانال پیش‌فرض فعال باشد، شناسه‌های عددی ساده معمولاً به‌عنوان شناسه کانال تفسیر می‌شوند؛ اما برای سازگاری، شناسه‌های فهرست‌شده در `allowFrom` مؤثر پیام خصوصی حساب به‌عنوان مقصدهای پیام خصوصی کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="گروه‌های دسترسی">
    پیام‌های خصوصی Discord و مجوزدهی فرمان متنی می‌توانند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کنند.

    نام‌های گروه دسترسی میان کانال‌های پیام مشترک‌اند. برای گروهی ایستا که اعضایش با نحو معمول `allowFrom` هر کانال بیان می‌شوند، از `type: "message.senders"` استفاده کنید؛ یا هنگامی که مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعیین کنند، از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک گروه دسترسی: [گروه‌های دسترسی](/fa/channels/access-groups).

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

    یک کانال متنی Discord فهرست اعضای جداگانه‌ای ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستنده پیام خصوصی عضو انجمن پیکربندی‌شده است و پس از اعمال بازنویسی‌های نقش و کانال، در حال حاضر مجوز مؤثر `ViewChannel` را روی کانال پیکربندی‌شده دارد.

    مثال: به هر کسی که می‌تواند `#maintainers` را ببیند اجازه دهید به ربات پیام خصوصی بفرستد، در حالی که پیام‌های خصوصی برای دیگران بسته می‌مانند.

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

    جست‌وجوها در صورت خطا دسترسی را می‌بندند. اگر Discord مقدار `Missing Access` را برگرداند، جست‌وجوی عضو ناموفق باشد یا کانال به انجمن دیگری تعلق داشته باشد، فرستنده پیام خصوصی غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر مخاطبان کانال، **Server Members Intent** را در Discord Developer Portal فعال کنید. پیام‌های خصوصی شامل وضعیت عضویت انجمن نیستند؛ بنابراین OpenClaw هنگام مجوزدهی، عضو را از طریق REST در Discord شناسایی می‌کند.

  </Tab>

  <Tab title="سیاست انجمن">
    مدیریت انجمن توسط `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    هنگامی که `channels.discord` وجود دارد، خط پایه امن `allowlist` است.

    رفتار `allowlist`:

    - انجمن باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح داده می‌شود، نامک نیز پذیرفته است)
    - فهرست‌های مجاز اختیاری فرستندگان: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه نقش)؛ اگر هرکدام پیکربندی شده باشند، فرستندگانی مجازند که با `users` یا `roles` مطابقت داشته باشند
    - تطبیق مستقیم نام/برچسب به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/برچسب‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌ترند؛ هنگام استفاده از ورودی‌های نام/برچسب، `openclaw security audit` هشدار می‌دهد
    - اگر یک انجمن `channels` را پیکربندی کرده باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک انجمن بلوک `channels` نداشته باشد، همه کانال‌های آن انجمن مجازشده پذیرفته می‌شوند

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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    کلید قدیمی `allow` در سطح هر کانال توسط `openclaw doctor --fix` به `enabled` مهاجرت داده می‌شود.

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` را نسازید، رفتار جایگزین زمان اجرا `groupPolicy="allowlist"` است (همراه با هشدار در گزارش‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="اشاره‌ها و پیام‌های خصوصی گروهی">
    پیام‌های انجمن به‌طور پیش‌فرض نیازمند اشاره هستند.

    تشخیص اشاره شامل موارد زیر است:

    - اشاره صریح به ربات
    - الگوهای اشاره پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، با جایگزین `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ‌به‌ربات در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از نحو متعارف اشاره استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها و `<@&ROLE_ID>` برای نقش‌ها. از قالب قدیمی اشاره با نام مستعار `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر انجمن/کانال (`channels.discord.guilds...`) پیکربندی می‌شود.
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که به کاربر/نقش دیگری اشاره می‌کنند اما به ربات اشاره نمی‌کنند، کنار می‌گذارد (به‌جز @everyone/@here).

    پیام‌های خصوصی گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌ها یا نامک‌های کانال)

  </Tab>
</Tabs>

### مسیریابی عامل مبتنی بر نقش

برای مسیریابی اعضای انجمن Discord به عامل‌های مختلف بر اساس شناسه نقش، از `bindings[].match.roles` استفاده کنید. اتصال‌های مبتنی بر نقش فقط شناسه نقش را می‌پذیرند و پس از اتصال‌های همتا یا والد-همتا و پیش از اتصال‌های صرفاً مبتنی بر انجمن ارزیابی می‌شوند. اگر یک اتصال فیلدهای تطبیق دیگری نیز تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همه فیلدهای پیکربندی‌شده باید مطابقت داشته باشند.

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

## فرمان‌های بومی و مجوزدهی فرمان

- مقدار پیش‌فرض `commands.native` برابر با `"auto"` است و برای Discord فعال است.
- بازنویسی به‌ازای هر کانال: `channels.discord.commands.native`.
- تنظیم `commands.native=false` ثبت و پاک‌سازی فرمان‌های اسلش Discord را هنگام راه‌اندازی نادیده می‌گیرد. فرمان‌هایی که پیش‌تر ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف نکنید، همچنان در Discord قابل مشاهده باشند.
- احراز هویت فرمان‌های بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که برای مدیریت پیام‌های عادی به کار می‌روند.
- ممکن است فرمان‌ها همچنان برای کاربران غیرمجاز در رابط کاربری Discord قابل مشاهده باشند؛ هنگام اجرا، احراز هویت OpenClaw اعمال می‌شود و پاسخ «مجاز نیستید» ارسال می‌گردد.
- تنظیمات پیش‌فرض فرمان اسلش: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

برای فهرست فرمان‌ها و نحوه رفتار آن‌ها، به [فرمان‌های اسلش](/fa/tools/slash-commands) مراجعه کنید.

## جزئیات قابلیت‌ها

<AccordionGroup>
  <Accordion title="برچسب‌های پاسخ و پاسخ‌های بومی">
    Discord از برچسب‌های پاسخ در خروجی عامل پشتیبانی می‌کند:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    این رفتار با `channels.discord.replyToMode` کنترل می‌شود:

    - `off` (پیش‌فرض): هیچ رشته‌سازی ضمنی برای پاسخ انجام نمی‌شود؛ برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند
    - `first`: ارجاع ضمنی پاسخ بومی را به نخستین پیام خروجی Discord در آن نوبت پیوست می‌کند
    - `all`: آن را به همه پیام‌های خروجی پیوست می‌کند
    - `batched`: آن را فقط زمانی پیوست می‌کند که رویداد ورودی، یک دسته تأخیری از چند پیام بوده باشد — زمانی مفید است که پاسخ‌های بومی را عمدتاً برای گفت‌وگوهای مبهم و پُرتراکم می‌خواهید، نه برای هر نوبت تک‌پیامی

    شناسه‌های پیام در زمینه/تاریخچه نمایش داده می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش پیوندها">
    Discord به‌طور پیش‌فرض برای نشانی‌های وب، جاسازی‌های غنی پیوند تولید می‌کند. OpenClaw به‌طور پیش‌فرض این جاسازی‌های تولیدشده را در پیام‌های خروجی Discord سرکوب می‌کند؛ بنابراین نشانی‌های وب ارسال‌شده توسط عامل به‌شکل پیوند ساده باقی می‌مانند، مگر اینکه این قابلیت را فعال کنید:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    برای بازنویسی این تنظیم برای یک حساب، `channels.discord.accounts.<id>.suppressEmbeds` را تنظیم کنید. ارسال‌های ابزار پیام عامل نیز می‌توانند برای یک پیام، `suppressEmbeds: false` را ارسال کنند. محموله‌های صریح `embeds` در Discord با تنظیم پیش‌فرض پیش‌نمایش پیوند سرکوب نمی‌شوند.

  </Accordion>

  <Accordion title="پیش‌نمایش پخش زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هم‌زمان با دریافت متن، پاسخ‌های پیش‌نویس را پخش کند. `channels.discord.streaming.mode` یکی از مقادیر `off` | `partial` | `block` | `progress` را می‌پذیرد (`progress` زمانی پیش‌فرض است که هیچ کلید `streaming` یا کلید قدیمی `streamMode` تنظیم نشده باشد). `streamMode` یک نام مستعار قدیمی است؛ برای بازنویسی پیکربندی ذخیره‌شده به ساختار تودرتوی معیار `streaming`، فرمان `openclaw doctor --fix` را اجرا کنید.

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

    - `off` ویرایش پیش‌نمایش Discord را غیرفعال می‌کند.
    - `partial` هم‌زمان با دریافت توکن‌ها، یک پیام پیش‌نمایش را ویرایش می‌کند.
    - `block` قطعه‌هایی در اندازه پیش‌نویس منتشر می‌کند؛ اندازه و نقاط شکست را با `streaming.preview.chunk` (`minChars`، `maxChars`، `breakPreference`) تنظیم کنید که به `textChunkLimit` محدود می‌شوند. وقتی پخش بلوکی به‌صراحت فعال باشد، OpenClaw برای جلوگیری از پخش دوگانه، پخش پیش‌نمایش را نادیده می‌گیرد.
    - `progress` یک پیش‌نویس وضعیت قابل‌ویرایش را نگه می‌دارد و تا تحویل نهایی، آن را با پیشرفت ابزار به‌روزرسانی می‌کند؛ برچسب آغازین مشترک یک خط چرخان است، بنابراین پس از نمایش کار کافی، مانند سایر محتوا به بالا پیمایش می‌شود.
    - خروجی‌های نهایی رسانه‌ای، خطا و پاسخ صریح، ویرایش‌های در انتظار پیش‌نمایش را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) تعیین می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.
    - ردیف‌های ابزار/پیشرفت، در صورت موجود بودن، به‌شکل فشرده ایموجی + عنوان + جزئیات نمایش داده می‌شوند؛ برای نمونه `🛠️ Bash: run tests` یا `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (پیش‌فرض `false`) متن توضیحی/مقدمه دستیار را در پیش‌نویس موقت پیشرفت فعال می‌کند. متن توضیحی پیش از نمایش پاک‌سازی می‌شود، موقت باقی می‌ماند و تحویل پاسخ نهایی را تغییر نمی‌دهد.
    - `streaming.progress.maxLineChars` بودجه پیش‌نمایش پیشرفت برای هر خط را کنترل می‌کند. نثر در مرز واژه‌ها کوتاه می‌شود؛ جزئیات فرمان و مسیر، پسوندهای مفید را حفظ می‌کنند.
    - `streaming.preview.commandText` / `streaming.progress.commandText` جزئیات فرمان/اجرا را در خطوط فشرده پیشرفت کنترل می‌کند: `raw` (پیش‌فرض) یا `status` (فقط برچسب ابزار).

    برای پنهان‌کردن متن خام فرمان/اجرا و حفظ خطوط فشرده پیشرفت:

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

    پخش پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی بازمی‌گردند.

  </Accordion>

  <Accordion title="رفتار تاریخچه، زمینه و رشته">
    زمینه تاریخچه انجمن:

    - مقدار پیش‌فرض `channels.discord.historyLimit` برابر با `20` است
    - جایگزین: `messages.groupChat.historyLimit`
    - `0` آن را غیرفعال می‌کند

    کنترل‌های تاریخچه پیام خصوصی:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار رشته:

    - رشته‌های Discord به‌عنوان نشست‌های کانال مسیریابی می‌شوند و مگر اینکه بازنویسی شوند، پیکربندی کانال والد را به ارث می‌برند.
    - نشست‌های رشته، انتخاب `/model` در سطح نشست کانال والد را فقط به‌عنوان جایگزین مدل به ارث می‌برند؛ انتخاب‌های محلی `/model` در رشته اولویت دارند و تاریخچه رونوشت والد کپی نمی‌شود، مگر اینکه وراثت رونوشت فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) برای رشته‌های خودکار جدید، مقداردهی اولیه از رونوشت والد را فعال می‌کند. بازنویسی به‌ازای هر حساب: `channels.discord.accounts.<id>.thread.inheritParent`.
    - واکنش‌های ابزار پیام می‌توانند مقصدهای پیام خصوصی `user:<id>` را تشخیص دهند.
    - مقدار `guilds.<guild>.channels.<channel>.requireMention: false` هنگام بازگشت فعال‌سازی در مرحله پاسخ حفظ می‌شود.

    موضوع‌های کانال به‌عنوان زمینه **غیرقابل‌اعتماد** تزریق می‌شوند. فهرست‌های مجاز تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند، اما مرز کامل حذف اطلاعات از زمینه تکمیلی نیستند.

  </Accordion>

  <Accordion title="نشست‌های وابسته به رشته برای زیرعامل‌ها">
    Discord می‌تواند یک رشته را به مقصد نشست متصل کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست، از جمله نشست‌های زیرعامل، مسیریابی شوند.

    فرمان‌ها:

    - `/focus <target>` رشته فعلی/جدید را به مقصد زیرعامل/نشست متصل می‌کند
    - `/unfocus` اتصال رشته فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت اتصال را نمایش می‌دهد
    - `/session idle <duration|off>` خروج خودکار از تمرکز بر اثر عدم فعالیت را برای اتصال‌های متمرکز بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر عمر قطعی اتصال‌های متمرکز را بررسی/به‌روزرسانی می‌کند

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

    - `session.threadBindings.*` پیش‌فرض‌های سراسری را تنظیم می‌کند؛ `channels.discord.threadBindings.*` رفتار Discord را بازنویسی می‌کند.
    - `spawnSessions` ایجاد/اتصال خودکار رشته‌ها برای `sessions_spawn({ thread: true })` و ایجاد رشته‌های ACP را کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` زمینه بومی زیرعامل را برای ایجادهای وابسته به رشته کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` با `openclaw doctor --fix` مهاجرت داده می‌شوند.
    - اگر اتصال‌های رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط با اتصال رشته در دسترس نیستند.

    به [زیرعامل‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents) و [مرجع پیکربندی](/fa/gateway/configuration-reference) مراجعه کنید.

  </Accordion>

  <Accordion title="اتصال‌های پایدار کانال ACP">
    برای فضاهای کاری پایدار و «همیشه فعال» ACP، اتصال‌های نوع‌دار ACP در سطح بالا را با مقصد گفت‌وگوهای Discord پیکربندی کنید.

    مسیر پیکربندی: `bindings[]` با `type: "acp"` و `match.channel: "discord"`.

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

    - `/acp spawn codex --bind here` کانال یا رشته فعلی را در همان محل متصل می‌کند و پیام‌های آینده را در همان نشست ACP نگه می‌دارد. پیام‌های رشته، اتصال کانال والد را به ارث می‌برند.
    - در یک کانال یا رشته متصل، `/new` و `/reset` همان نشست ACP را در همان محل بازنشانی می‌کنند. اتصال‌های موقت رشته در زمان فعال‌بودن می‌توانند تشخیص مقصد را بازنویسی کنند.
    - `spawnSessions` ایجاد/اتصال رشته فرزند از طریق `--thread auto|here` را کنترل می‌کند.

    برای جزئیات رفتار اتصال، به [عامل‌های ACP](/fa/tools/acp-agents) مراجعه کنید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش به‌ازای هر انجمن (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستمی تبدیل و به نشست مسیریابی‌شده Discord پیوست می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید دریافت">
    `ackReaction` هنگامی که OpenClaw یک پیام ورودی را پردازش می‌کند، یک ایموجی تأیید دریافت ارسال می‌کند.

    ترتیب تشخیص:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Discord ایموجی یونیکد یا نام ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال‌کردن واکنش برای یک کانال یا حساب از `""` استفاده کنید.

    **دامنه (`messages.ackReactionScope`):**

    مقادیر: `"all"` (پیام‌های خصوصی + گروه‌ها، شامل رویدادهای محیطی اتاق)، `"direct"` (فقط پیام‌های خصوصی)، `"group-all"` (هر پیام گروهی به‌جز رویدادهای محیطی اتاق، بدون پیام خصوصی)، `"group-mentions"` (گروه‌ها هنگامی که ربات منشن شود؛ **بدون پیام خصوصی**، پیش‌فرض)، `"off"` / `"none"` (غیرفعال).

    <Note>
    دامنه پیش‌فرض (`"group-mentions"`) واکنش تأیید دریافت را در پیام‌های مستقیم یا رویدادهای محیطی اتاق فعال نمی‌کند. برای دریافت واکنش تأیید روی پیام‌های خصوصی ورودی Discord و رویدادهای آرام اتاق، `messages.ackReactionScope` را روی `"all"` تنظیم کنید.
    </Note>

  </Accordion>

  <Accordion title="نوشتن پیکربندی">
    نوشتن پیکربندی آغازشده از کانال به‌طور پیش‌فرض فعال است. این موضوع بر جریان‌های `/config set|unset` اثر می‌گذارد، مشروط بر اینکه قابلیت‌های فرمان فعال باشند.

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
    ترافیک WebSocket گیت‌وی Discord و جست‌وجوهای REST هنگام راه‌اندازی (شناسه برنامه + تشخیص فهرست مجاز) را با `channels.discord.proxy` از طریق یک پروکسی HTTP(S) مسیریابی کنید.
    پروکسی‌کردن WebSocket گیت‌وی Discord صریح است؛ اتصال‌های WebSocket متغیرهای محیطی پروکسی موجود در فرایند Gateway را به ارث نمی‌برند. هنگامی که `channels.discord.proxy` پیکربندی شده باشد، جست‌وجوهای REST هنگام راه‌اندازی از این پروکسی استفاده می‌کنند.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    بازنویسی به‌ازای هر حساب:

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
    تشخیص PluralKit را فعال کنید تا پیام‌های پروکسی‌شده به هویت عضو سیستم نگاشت شوند:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // اختیاری؛ برای سامانه‌های خصوصی لازم است
      },
    },
  },
}
```

    نکات:

    - فهرست‌های مجاز می‌توانند از `pk:<memberId>` استفاده کنند
    - نام‌های نمایشی اعضا فقط زمانی بر اساس نام/نامک تطبیق داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true` باشد
    - جست‌وجوها API مربوط به PluralKit را با شناسهٔ پیام اصلی فراخوانی می‌کنند
    - اگر جست‌وجو ناموفق باشد، پیام‌های نیابتی به‌عنوان پیام‌های ربات در نظر گرفته و حذف می‌شوند، مگر اینکه `allowBots` اجازهٔ عبور آن‌ها را بدهد

  </Accordion>

  <Accordion title="نام‌های مستعار اشارهٔ خروجی">
    هنگامی که عامل‌ها برای کاربران شناخته‌شدهٔ Discord به اشاره‌های خروجی قطعی نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها شناسه‌های کاربری بدون `@` ابتدایی هستند؛ مقادیر، شناسه‌های کاربری Discord هستند. شناسه‌های ناشناخته، `@everyone`، `@here` و اشاره‌های داخل بازه‌های کد Markdown بدون تغییر باقی می‌مانند.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
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
    به‌روزرسانی‌های حضور زمانی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت را تنظیم کنید، یا حضور خودکار را فعال کنید.

    فقط وضعیت:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    فعالیت (وقتی `activity` تنظیم شده باشد، وضعیت سفارشی نوع پیش‌فرض فعالیت است):

```json5
{
  channels: {
    discord: {
      activity: "زمان تمرکز",
      activityType: 4,
    },
  },
}
```

    پخش زنده:

```json5
{
  channels: {
    discord: {
      activity: "کدنویسی زنده",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    نگاشت نوع فعالیت:

    - 0: در حال بازی
    - 1: در حال پخش زنده (به `activityUrl` نیاز دارد؛ `activityUrl` نیز به `activityType: 1` نیاز دارد)
    - 2: در حال گوش‌دادن
    - 3: در حال تماشا
    - 4: سفارشی (متن فعالیت را به‌عنوان حالت وضعیت استفاده می‌کند؛ ایموجی اختیاری است)
    - 5: در حال رقابت

    حضور خودکار (سیگنال سلامت زمان اجرا):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "توکن تمام شده است",
      },
    },
  },
}
```

    حضور خودکار، دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => برخط، دچار افت یا ناشناخته => غیرفعال، منابع تمام‌شده یا دردسترس‌نبودن => مزاحم نشوید. مقادیر پیش‌فرض: `intervalMs` برابر با 30000 و `minUpdateIntervalMs` برابر با 15000 است (باید کوچک‌تر یا مساوی `intervalMs` باشد). جایگزین‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از جای‌نگهدار `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="تأییدها در Discord">
    Discord از مدیریت تأیید مبتنی بر دکمه در پیام‌های خصوصی پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری درخواست‌های تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` بازمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    وقتی `enabled` تنظیم نشده یا برابر `"auto"` باشد و دست‌کم یک تأییدکننده، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، قابل شناسایی باشد، Discord تأییدهای بومی اجرای دستور را به‌طور خودکار فعال می‌کند. Discord تأییدکنندگان اجرا را از `allowFrom` کانال، `dm.allowFrom` قدیمی یا `defaultTo` پیام خصوصی استنباط نمی‌کند. برای غیرفعال‌کردن صریح Discord به‌عنوان کارخواه بومی تأیید، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و مختص مالک، مانند `/diagnostics` و `/export-trajectory`، OpenClaw درخواست‌های تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. اگر مالک فراخواننده یک مسیر مالک در Discord داشته باشد، ابتدا پیام خصوصی Discord را امتحان می‌کند؛ در غیر این صورت، به نخستین مسیر مالک دردسترس از `commands.ownerAllowFrom`، مانند Telegram، بازمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، درخواست تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان شناسایی‌شده می‌توانند از دکمه‌ها استفاده کنند؛ سایر کاربران یک پیام رد موقت دریافت می‌کنند. درخواست‌های تأیید شامل متن فرمان هستند، بنابراین تحویل در کانال را فقط در کانال‌های مورد اعتماد فعال کنید. اگر نتوان شناسهٔ کانال را از کلید نشست استخراج کرد، OpenClaw به تحویل از طریق پیام خصوصی بازمی‌گردد.

    Discord دکمه‌های تأیید مشترکی را نمایش می‌دهد که سایر کانال‌های گفت‌وگو نیز استفاده می‌کنند؛ آداپتور بومی Discord عمدتاً مسیریابی پیام خصوصی تأییدکنندگان و توزیع در کانال‌ها را اضافه می‌کند. وقتی این دکمه‌ها وجود دارند، رابط اصلی تأیید هستند؛ OpenClaw فقط زمانی باید فرمان دستی `/approve` را نمایش دهد که نتیجهٔ ابزار اعلام کند تأییدهای گفت‌وگویی دردسترس نیستند یا تأیید دستی تنها مسیر است. اگر زمان اجرای تأیید بومی Discord فعال نباشد، OpenClaw درخواست قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر زمان اجرا فعال باشد اما کارت بومی به هیچ مقصدی تحویل داده نشود، OpenClaw در همان گفت‌وگو یک اعلان جایگزین حاوی فرمان دقیق `/approve` از تأیید در انتظار ارسال می‌کند.

    احراز هویت Gateway و حل‌وفصل تأیید از قرارداد مشترک کارخواه Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` و سایر شناسه‌ها از طریق `exec.approval.resolve` حل می‌شوند). تأییدها به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای اجرا](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و دروازه‌های کنش

کنش‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، نظارت، حضور و فراداده هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- نظارت: `timeout`، `kick`، `ban`
- حضور: `setPresence`

کنش `event-create` یک پارامتر اختیاری `image` (نشانی URL یا مسیر فایل محلی) را برای تنظیم تصویر روی جلد رویداد زمان‌بندی‌شده می‌پذیرد.

دروازه‌های کنش زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض دروازه‌ها:

| گروه کنش                                                                                                                                                             | پیش‌فرض  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | فعال  |
| roles                                                                                                                                                                    | غیرفعال |
| moderation                                                                                                                                                               | غیرفعال |
| presence                                                                                                                                                                 | غیرفعال |

## رابط کاربری مؤلفه‌های v2

OpenClaw برای تأییدهای اجرا و نشانگرهای میان‌زمینه‌ای از مؤلفه‌های v2 در Discord استفاده می‌کند. کنش‌های پیام Discord همچنین می‌توانند برای رابط کاربری سفارشی `components` را بپذیرند (پیشرفته؛ نیازمند ساخت بارِ مؤلفه از طریق ابزار discord است)، در حالی که `embeds` قدیمی همچنان دردسترس است اما توصیه نمی‌شود.

- `channels.discord.ui.components.accentColor` رنگ تأکیدی مورداستفاده در محفظه‌های مؤلفهٔ Discord را تنظیم می‌کند (هگزادسیمال). برای هر حساب: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` مدت زمان ثبت‌ماندن فراخوان‌های بازگشتی مؤلفه‌های ارسال‌شدهٔ Discord را کنترل می‌کند (پیش‌فرض `1800000`، حداکثر `86400000`). برای هر حساب: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- وقتی مؤلفه‌های v2 وجود داشته باشند، `embeds` نادیده گرفته می‌شوند.
- پیش‌نمایش نشانی‌های URL ساده به‌طور پیش‌فرض سرکوب می‌شود. وقتی باید یک پیوند خروجی گسترش یابد، `suppressEmbeds: false` را روی کنش پیام تنظیم کنید.

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

## صوت

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بی‌درنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش شکل موج). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

فهرست بررسی راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. هنگامی که فهرست‌های مجاز نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. ربات را با حوزه‌های `bot` و `applications.commands` دعوت کنید.
4. مجوزهای Connect، Speak، Send Messages و Read Message History را در کانال صوتی مقصد اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان قواعد فهرست مجاز و خط‌مشی گروهی سایر فرمان‌های Discord را دنبال می‌کند.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

برای بررسی مجوزهای مؤثر ربات پیش از پیوستن:

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
        model: "openai/gpt-5.6-sol",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

نکات:

- صدای Discord برای پیکربندی‌های صرفاً متنی به‌صورت اختیاری فعال می‌شود؛ برای فعال‌سازی فرمان‌های `/vc`، محیط اجرای صوتی و intent مربوط به `GuildVoiceStates` در Gateway، مقدار `channels.discord.voice.enabled=true` را تنظیم کنید (یا بلوک موجود `channels.discord.voice` را نگه دارید). گزینهٔ `channels.discord.intents.voiceStates` می‌تواند اشتراک intent را صریحاً بازنویسی کند؛ برای پیروی از وضعیت مؤثر فعال‌بودن صدا، آن را تنظیم‌نشده باقی بگذارید.
- `voice.mode` مسیر مکالمه را کنترل می‌کند. مقدار پیش‌فرض `agent-proxy` است: یک رابط صوتی بی‌درنگ زمان‌بندی نوبت‌ها، وقفه و پخش را مدیریت می‌کند، کارهای اساسی را از طریق `openclaw_agent_consult` به عامل مسیریابی‌شدهٔ OpenClaw می‌سپارد و نتیجه را مانند یک درخواست تایپ‌شدهٔ Discord از همان گوینده در نظر می‌گیرد. `stt-tts` جریان دسته‌ای قدیمی‌تر STT به‌همراه TTS را حفظ می‌کند. `bidi` به مدل بی‌درنگ اجازه می‌دهد مستقیماً مکالمه کند، درحالی‌که `openclaw_agent_consult` را برای مغز OpenClaw در دسترس قرار می‌دهد.
- `voice.agentSession` تعیین می‌کند کدام مکالمهٔ OpenClaw نوبت‌های صوتی را دریافت کند. برای استفاده از نشست خود کانال صوتی، آن را تنظیم‌نشده باقی بگذارید؛ یا آن را روی `{ mode: "target", target: "channel:<text-channel-id>" }` تنظیم کنید تا کانال صوتی به‌عنوان افزونهٔ میکروفن/بلندگوی نشست یک کانال متنی موجود Discord، مانند `#maintainers`، عمل کند.
- `voice.model` مغز عامل OpenClaw را برای پاسخ‌های صوتی Discord و مشورت‌های بی‌درنگ بازنویسی می‌کند. برای به‌ارث‌بردن مدل عامل مسیریابی‌شده، آن را تنظیم‌نشده باقی بگذارید. این گزینه از `voice.realtime.model` جدا است.
- `voice.followUsers` به ربات اجازه می‌دهد همراه کاربران انتخاب‌شده به صدای Discord بپیوندد، جابه‌جا شود و خارج شود. [دنبال‌کردن کاربران در صدا](#follow-users-in-voice) را ببینید.
- `agent-proxy` گفتار را از طریق `discord-voice` مسیریابی می‌کند؛ این مسیر مجوزدهی عادی مالک/ابزار را برای گوینده و نشست مقصد حفظ می‌کند، اما ابزار `tts` عامل را پنهان می‌کند، زیرا پخش در اختیار صدای Discord است. به‌طور پیش‌فرض، `agent-proxy` برای گویندگان مالک، دسترسی ابزاری کامل و هم‌ارز مالک را به مشورت می‌دهد (`voice.realtime.toolPolicy: "owner"`) و به‌شدت ترجیح می‌دهد پیش از پاسخ‌های اساسی با عامل OpenClaw مشورت کند (`voice.realtime.consultPolicy: "always"`). در حالت پیش‌فرض `always`، لایهٔ بی‌درنگ پیش از دریافت پاسخ مشورت، عبارات پُرکننده را به‌طور خودکار بیان نمی‌کند؛ گفتار را ضبط و رونویسی می‌کند، سپس پاسخ مسیریابی‌شدهٔ OpenClaw را می‌خواند. اگر چند پاسخ مشورت اجباری درحالی تکمیل شوند که Discord هنوز در حال پخش پاسخ نخست است، پاسخ‌های گفتاری دقیق بعدی تا بیکارشدن پخش در صف می‌مانند و گفتار را در میانهٔ جمله جایگزین نمی‌کنند.
- در حالت `stt-tts`، STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` بر رونویسی اثری ندارد.
- در حالت‌های بی‌درنگ، `voice.realtime.provider`، `voice.realtime.model` و `voice.realtime.speakerVoice` نشست صوتی بی‌درنگ را پیکربندی می‌کنند. برای OpenAI Realtime 2.1 همراه با مغز Codex، از `voice.realtime.model: "gpt-realtime-2.1"` و `voice.model: "openai/gpt-5.6-sol"` استفاده کنید.
- حالت‌های صوتی بی‌درنگ به‌طور پیش‌فرض فایل‌های نمایهٔ کوچک `IDENTITY.md`، `USER.md` و `SOUL.md` را در دستورالعمل‌های ارائه‌دهندهٔ بی‌درنگ قرار می‌دهند تا نوبت‌های مستقیم و سریع، همان هویت، مبنای کاربری و شخصیت عامل مسیریابی‌شدهٔ OpenClaw را حفظ کنند. برای سفارشی‌سازی، `voice.realtime.bootstrapContextFiles` را روی زیرمجموعه‌ای از آن‌ها تنظیم کنید یا برای غیرفعال‌کردن، آن را روی `[]` قرار دهید. فقط همین فایل‌های نمایه پشتیبانی می‌شوند؛ `AGENTS.md` در بافت عادی عامل باقی می‌ماند. بافت نمایهٔ تزریق‌شده، جایگزین `openclaw_agent_consult` برای کارهای فضای کاری، اطلاعات جاری، جست‌وجوی حافظه یا اقدام‌های متکی بر ابزار نمی‌شود.
- در حالت بی‌درنگ OpenAI با `agent-proxy`، مقدار `voice.realtime.requireWakeName: true` را تنظیم کنید تا صدای بی‌درنگ Discord تا زمانی که رونویسی با یک نام بیدارباش آغاز یا پایان نیافته است، ساکت بماند. نام‌های بیدارباش پیکربندی‌شده باید یک یا دو کلمه باشند. اگر `voice.realtime.wakeNames` تنظیم نشده باشد، OpenClaw از `name` عامل مسیریابی‌شده به‌همراه `OpenClaw` استفاده می‌کند و در صورت نبود آن، به شناسهٔ عامل به‌همراه `OpenClaw` برمی‌گردد. دروازه‌بانی نام بیدارباش، پاسخ خودکار ارائه‌دهندهٔ بی‌درنگ را غیرفعال می‌کند، نوبت‌های پذیرفته‌شده را از مسیر مشورت عامل OpenClaw عبور می‌دهد و هنگامی که پیش از رسیدن رونویسی نهایی، یک نام بیدارباش آغازین از رونویسی جزئی تشخیص داده شود، یک تأیید گفتاری کوتاه ارائه می‌کند.
- ارائه‌دهندهٔ بی‌درنگ OpenAI نام رویدادهای جاری Realtime 2 و نام‌های مستعار قدیمی سازگار با Codex را برای رویدادهای صوت خروجی و رونویسی می‌پذیرد؛ بنابراین تصویرهای لحظه‌ای سازگار ارائه‌دهنده می‌توانند بدون حذف صدای دستیار تغییر کنند.
- `voice.realtime.bargeIn` تعیین می‌کند آیا رویدادهای شروع گفتار در Discord پخش بی‌درنگ فعال را قطع کنند یا نه. اگر تنظیم نشده باشد، از تنظیم وقفهٔ صوت ورودی ارائه‌دهندهٔ بی‌درنگ پیروی می‌کند.
- `voice.realtime.minBargeInAudioEndMs` حداقل مدت پخش دستیار را پیش از آنکه ورود میان‌گفتار بی‌درنگ OpenAI صدا را قطع کند، کنترل می‌کند. پیش‌فرض: `250`. برای وقفهٔ فوری در اتاق‌های کم‌پژواک، آن را روی `0` تنظیم کنید؛ یا برای چیدمان‌های بلندگویی با پژواک زیاد، مقدار آن را افزایش دهید.
- `voice.tts` فقط برای پخش صوتی `stt-tts`، مقدار `messages.tts` را بازنویسی می‌کند؛ حالت‌های بی‌درنگ به‌جای آن از `voice.realtime.speakerVoice` استفاده می‌کنند. برای استفاده از صدای OpenAI در پخش Discord، مقدار `voice.tts.provider: "openai"` را تنظیم کرده و زیر `voice.tts.providers.openai.speakerVoice` یک صدای تبدیل متن به گفتار انتخاب کنید. در مدل فعلی TTS شرکت OpenAI، `cedar` گزینهٔ مناسبی با آوای مردانه است.
- بازنویسی‌های `systemPrompt` اختصاصی هر کانال Discord، بر نوبت‌های رونویسی صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونویسی صوتی، برای فرمان‌ها و اقدام‌های کانالی محدودشده به مالک، وضعیت مالک را از `allowFrom` در Discord (یا `dm.allowFrom`) استخراج می‌کنند. قابلیت مشاهدهٔ ابزارهای عامل از سیاست ابزار پیکربندی‌شده برای نشست مسیریابی‌شده پیروی می‌کند.
- اگر `voice.autoJoin` برای یک انجمن چند ورودی داشته باشد، OpenClaw به آخرین کانال پیکربندی‌شده برای آن انجمن می‌پیوندد.
- `voice.allowedChannels` یک فهرست مجاز اختیاری برای محل حضور است. برای اجازه‌دادن به `/vc join` جهت پیوستن به هر کانال صوتی مجاز Discord، آن را تنظیم‌نشده باقی بگذارید. هنگامی که تنظیم شود، `/vc join`، پیوستن خودکار هنگام راه‌اندازی و جابه‌جایی‌های وضعیت صوتی ربات به ورودی‌های فهرست‌شدهٔ `{ guildId, channelId }` محدود می‌شوند. برای ردکردن همهٔ پیوستن‌ها به صدای Discord، آن را روی یک آرایهٔ خالی تنظیم کنید. اگر Discord ربات را به خارج از فهرست مجاز منتقل کند، OpenClaw آن کانال را ترک می‌کند و در صورت وجود مقصد پیکربندی‌شده برای پیوستن خودکار، دوباره به آن می‌پیوندد.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` مستقیماً به گزینه‌های پیوستن `@discordjs/voice` منتقل می‌شوند؛ مقادیر پیش‌فرض بالادستی `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- OpenClaw برای دریافت صدای Discord و پخش خام PCM بی‌درنگ، از کُدک همراه `libopus-wasm` استفاده می‌کند. این بسته شامل یک ساخت سنجاق‌شدهٔ WebAssembly از libopus است و به افزونه‌های بومی opus نیاز ندارد.
- `voice.connectTimeoutMs` مدت انتظار اولیه برای وضعیت Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و پیوستن خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` تعیین می‌کند OpenClaw چه مدت منتظر بماند تا یک نشست صوتی قطع‌شده، اتصال مجدد را آغاز کند و سپس آن را از بین ببرد. پیش‌فرض: `15000`.
- در حالت `stt-tts`، پخش صوتی صرفاً به‌دلیل شروع صحبت کاربر دیگری متوقف نمی‌شود. برای جلوگیری از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS ضبط صوت جدید را نادیده می‌گیرد؛ برای نوبت بعدی، پس از پایان پخش صحبت کنید. حالت‌های بی‌درنگ، شروع گفتار را به‌عنوان سیگنال ورود میان‌گفتار به ارائه‌دهندهٔ بی‌درنگ ارسال می‌کنند.
- در حالت‌های بی‌درنگ، پژواک بلندگوها در یک میکروفن باز ممکن است مانند ورود میان‌گفتار به نظر برسد و پخش را قطع کند. برای اتاق‌های Discord با پژواک زیاد، مقدار `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید تا OpenAI در اثر صوت ورودی به‌طور خودکار وقفه ایجاد نکند. اگر همچنان می‌خواهید رویدادهای شروع گفتار Discord پخش فعال را قطع کنند، `voice.realtime.bargeIn: true` را اضافه کنید. پل بی‌درنگ OpenAI، قطع‌شدن‌های پخش کوتاه‌تر از `voice.realtime.minBargeInAudioEndMs` را که احتمالاً ناشی از پژواک/نویز هستند نادیده می‌گیرد و به‌جای پاک‌کردن پخش Discord، آن‌ها را به‌عنوان موارد ردشده ثبت می‌کند.
- `voice.captureSilenceGraceMs` تعیین می‌کند OpenClaw پس از آنکه Discord توقف گفتار یک گوینده را گزارش می‌کند، چه مدت پیش از نهایی‌کردن آن قطعهٔ صوتی برای STT منتظر بماند. پیش‌فرض: `2000`؛ اگر Discord مکث‌های عادی را به رونویسی‌های جزئی و گسسته تقسیم می‌کند، مقدار آن را افزایش دهید.
- هنگامی که ElevenLabs ارائه‌دهندهٔ انتخاب‌شدهٔ TTS باشد، پخش صوتی Discord از TTS جریانی استفاده می‌کند و از جریان پاسخ ارائه‌دهنده آغاز می‌شود. ارائه‌دهندگان فاقد پشتیبانی از جریان، به مسیر فایل موقتِ صدای تولیدشده برمی‌گردند.
- OpenClaw خطاهای رمزگشایی دریافت را زیر نظر می‌گیرد و پس از چند خطای تکراری در یک بازهٔ کوتاه، با ترک کانال صوتی و پیوستن دوباره به آن، به‌طور خودکار بازیابی می‌شود.
- اگر پس از به‌روزرسانی، گزارش‌های دریافت بارها `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و گزارش‌های رویداد را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح بالادستی حاشیه‌گذاری از PR شمارهٔ 11449 در discord.js است که مسئلهٔ شمارهٔ 11419 در discord.js را بست.
- رویدادهای دریافت `The operation was aborted` هنگامی که OpenClaw قطعهٔ ضبط‌شدهٔ یک گوینده را نهایی می‌کند، مورد انتظار هستند؛ این‌ها جزئیات تشخیصی مفصل‌اند، نه هشدار.
- گزارش‌های مفصل صدای Discord برای هر قطعهٔ پذیرفته‌شدهٔ گوینده، یک پیش‌نمایش یک‌خطی و محدود از رونویسی STT ارائه می‌دهند؛ بنابراین اشکال‌زدایی بدون تخلیهٔ متن رونویسی نامحدود، هم سمت کاربر و هم سمت پاسخ عامل را نشان می‌دهد.
- در حالت `agent-proxy`، سازوکار جایگزین مشورت اجباری قطعه‌های احتمالاً ناقص رونویسی، مانند متن پایان‌یافته با `...` یا یک پیوند پایانی مانند «و»، و همچنین پایان‌بندی‌های آشکارا غیرقابل‌اقدام مانند «الان برمی‌گردم» یا «خداحافظ» را نادیده می‌گیرد. هنگامی که این کار از یک پاسخ قدیمیِ در صف جلوگیری کند، گزارش‌ها `forced agent consult skipped reason=...` را نشان می‌دهند.

### دنبال‌کردن کاربران در صدا

هنگامی از `voice.followUsers` استفاده کنید که می‌خواهید ربات صوتی Discord به‌جای پیوستن به یک کانال ثابت هنگام راه‌اندازی یا انتظار برای `/vc join`، همراه یک یا چند کاربر شناخته‌شدهٔ Discord بماند.

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

- `followUsers` شناسه‌های خام کاربران Discord و مقادیر `discord:<id>` را می‌پذیرد. OpenClaw پیش از تطبیق رویدادهای وضعیت صوتی، هر دو قالب را نرمال‌سازی می‌کند.
- هنگامی که `followUsers` پیکربندی شده باشد، مقدار پیش‌فرض `followUsersEnabled` برابر `true` است. برای حفظ فهرست ذخیره‌شده و درعین‌حال توقف دنبال‌کردن خودکار صوتی، آن را روی `false` تنظیم کنید.
- هنگامی که یک کاربر دنبال‌شده به کانال صوتی مجاز می‌پیوندد، OpenClaw نیز به آن کانال می‌پیوندد. وقتی کاربر جابه‌جا شود، OpenClaw همراه او جابه‌جا می‌شود. وقتی کاربر دنبال‌شدهٔ فعال قطع اتصال کند، OpenClaw خارج می‌شود.
- اگر چند کاربر دنبال‌شده در یک انجمن باشند و کاربر دنبال‌شدهٔ فعال خارج شود، OpenClaw پیش از ترک انجمن به کانال یکی دیگر از کاربران دنبال‌شدهٔ ردیابی‌شده منتقل می‌شود. اگر چند کاربر دنبال‌شده هم‌زمان جابه‌جا شوند، آخرین رویداد مشاهده‌شدهٔ وضعیت صوتی اولویت دارد.
- `allowedChannels` همچنان اعمال می‌شود. کاربر دنبال‌شده در یک کانال غیرمجاز نادیده گرفته می‌شود و نشستی که مالکیت آن با قابلیت دنبال‌کردن است، به کاربر دنبال‌شدهٔ دیگری منتقل می‌شود یا خارج می‌شود.
- OpenClaw رویدادهای ازدست‌رفتهٔ وضعیت صوتی را هنگام راه‌اندازی و در بازه‌های محدود همگام‌سازی می‌کند. همگام‌سازی از انجمن‌های پیکربندی‌شده نمونه‌برداری می‌کند و تعداد جست‌وجوهای REST را در هر اجرا محدود می‌سازد؛ بنابراین ممکن است همگرایی فهرست‌های بسیار بزرگ `followUsers` بیش از یک بازه طول بکشد.
- اگر Discord یا یک مدیر ربات را هنگامی که در حال دنبال‌کردن کاربری است جابه‌جا کند، OpenClaw نشست صوتی را از نو می‌سازد و در صورت مجازبودن مقصد، مالکیت دنبال‌کردن را حفظ می‌کند. اگر ربات به خارج از `allowedChannels` منتقل شود، OpenClaw خارج می‌شود و در صورت وجود مقصد پیکربندی‌شده، دوباره به آن می‌پیوندد.
- بازیابی دریافت DAVE ممکن است پس از چند خطای رمزگشایی تکراری، همان کانال را ترک کند و دوباره به آن بپیوندد. نشست‌هایی که مالکیت آن‌ها با قابلیت دنبال‌کردن است، این مالکیت را در مسیر بازیابی حفظ می‌کنند؛ بنابراین قطع اتصال بعدی کاربر دنبال‌شده همچنان باعث ترک کانال می‌شود.

از میان حالت‌های پیوستن انتخاب کنید:

- برای چیدمان‌های شخصی یا اپراتوری که ربات باید هر زمان شما در کانال صوتی هستید به‌طور خودکار در آن حضور داشته باشد، از `followUsers` استفاده کنید.
- برای ربات‌های اتاق ثابت که حتی در نبود کاربران ردیابی‌شده در کانال صوتی نیز باید حاضر باشند، از `autoJoin` استفاده کنید.
- برای پیوستن‌های موردی یا اتاق‌هایی که حضور خودکار صوتی در آن‌ها غیرمنتظره خواهد بود، از `/vc join` استفاده کنید.

کُدک صوتی Discord:

- گزارش‌های دریافت صوتی `discord voice: opus decoder: libopus-wasm` را نشان می‌دهند.
- پخش بی‌درنگ، پیش از تحویل بسته‌ها به `@discordjs/voice`، PCM خام استریوی ۴۸ کیلوهرتز را با همان بستهٔ همراه `libopus-wasm` به Opus کدگذاری می‌کند.
- پخش فایل و جریان ارائه‌دهنده با ffmpeg به PCM خام استریوی ۴۸ کیلوهرتز تبدیل می‌شود و سپس برای جریان بسته‌های Opus ارسالی به Discord از `libopus-wasm` استفاده می‌کند.

خط لولهٔ STT به‌همراه TTS:

- صدای PCM ضبط‌شده از Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` تبدیل گفتار به متن (STT) را مدیریت می‌کند؛ برای مثال `openai/gpt-4o-mini-transcribe`.
- رونوشت از مسیر ورودی و مسیریابی Discord ارسال می‌شود، درحالی‌که LLM پاسخ با سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و درخواست بازگرداندن متن را می‌دهد، زیرا پخش نهایی تبدیل متن به گفتار (TTS) بر عهده قابلیت صوتی Discord است.
- در صورت تنظیم `voice.model`، این گزینه فقط LLM پاسخ را برای همین نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ ارائه‌دهندگان دارای قابلیت پخش جریانی، صدا را مستقیماً به پخش‌کننده می‌دهند؛ در غیر این صورت، فایل صوتی حاصل در کانال متصل‌شده پخش می‌شود.

نمونه جلسه پیش‌فرض کانال صوتی با پراکسی عامل:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

اگر بلوک `voice.agentSession` وجود نداشته باشد، هر کانال صوتی جلسه مسیریابی‌شده OpenClaw مخصوص خود را دریافت می‌کند. برای مثال، `/vc join channel:234567890123456789` با جلسه همان کانال صوتی Discord گفتگو می‌کند. مدل بلادرنگ فقط بخش ورودی صوتی است؛ درخواست‌های اصلی به عامل پیکربندی‌شده OpenClaw واگذار می‌شوند. اگر مدل بلادرنگ بدون فراخوانی ابزار مشورت، رونوشتی نهایی تولید کند، OpenClaw به‌عنوان مسیر جایگزین مشورت را اجباری می‌کند تا رفتار پیش‌فرض همچنان مانند گفتگو با عامل باشد.

نمونه قدیمی STT به‌همراه TTS:

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

نمونه بلادرنگ دوسویه:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

قابلیت صوتی به‌عنوان امتداد جلسه موجود یک کانال Discord:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

در حالت `agent-proxy`، ربات به کانال صوتی پیکربندی‌شده متصل می‌شود، اما نوبت‌های عامل OpenClaw از جلسه و عامل مسیریابی‌شده عادی کانال مقصد استفاده می‌کنند. جلسه صوتی بلادرنگ، نتیجه بازگردانده‌شده را در کانال صوتی بیان می‌کند. عامل ناظر همچنان می‌تواند مطابق سیاست ابزار خود از ابزارهای عادی پیام استفاده کند؛ ازجمله ارسال یک پیام جداگانه در Discord، اگر اقدام درست همین باشد.

هنگامی که یک اجرای واگذارشده OpenClaw فعال است، رونوشت‌های صوتی جدید Discord پیش از آغاز نوبت دیگری از عامل، به‌عنوان کنترل زنده اجرای جاری پردازش می‌شوند. عبارت‌هایی مانند «وضعیت»، «آن را لغو کن»، «از اصلاح کوچک‌تر استفاده کن» یا «وقتی تمام شد، آزمون‌ها را هم بررسی کن» به‌ترتیب به‌عنوان ورودی وضعیت، لغو، هدایت یا پیگیری برای جلسه فعال طبقه‌بندی می‌شوند. نتیجه وضعیت، لغو، هدایت پذیرفته‌شده و پیگیری در کانال صوتی بیان می‌شود تا تماس‌گیرنده بداند OpenClaw درخواست را پردازش کرده است یا نه.

شکل‌های مفید مقصد:

- `target: "channel:123456789012345678"` از طریق جلسه یک کانال متنی Discord مسیریابی می‌شود.
- `target: "123456789012345678"` به‌عنوان مقصد کانال در نظر گرفته می‌شود.
- `target: "dm:123456789012345678"` یا `target: "user:123456789012345678"` از طریق جلسه پیام مستقیم همان کاربر مسیریابی می‌شود.

نمونه OpenAI Realtime برای محیط‌های دارای پژواک زیاد:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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

از این پیکربندی زمانی استفاده کنید که مدل صدای پخش‌شده خودش در Discord را از طریق میکروفن باز می‌شنود، اما همچنان می‌خواهید با صحبت‌کردن آن را قطع کنید. OpenClaw مانع می‌شود OpenAI صرفاً با دریافت صدای ورودی خام به‌طور خودکار پاسخ را قطع کند، درحالی‌که `bargeIn: true` اجازه می‌دهد رویدادهای شروع گوینده در Discord و صدای گوینده‌ای که از قبل فعال است، پاسخ‌های بلادرنگ فعال را پیش از رسیدن نوبت ضبط‌شده بعدی به OpenAI لغو کنند. سیگنال‌های بسیار زودهنگام ورود به مکالمه که مقدار `audioEndMs` آن‌ها کمتر از `minBargeInAudioEndMs` است، به‌احتمال زیاد پژواک یا نویز تلقی و نادیده گرفته می‌شوند تا مدل در نخستین فریم پخش قطع نشود.

لاگ‌های مورد انتظار صوتی:

- هنگام اتصال: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- هنگام شروع بلادرنگ: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- هنگام صدای گوینده: `discord voice: realtime speaker turn opened ...`، `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` و `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- هنگام ردکردن گفتار کهنه: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` یا `reason=non-actionable-closing ...`
- هنگام تکمیل پاسخ بلادرنگ: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- هنگام توقف یا بازنشانی پخش: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- هنگام مشورت بلادرنگ: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- هنگام پاسخ عامل: `discord voice: agent turn answer ...`
- هنگام صف‌شدن گفتار دقیق: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...` و سپس `discord voice: realtime exact speech dequeued reason=player-idle ...`
- هنگام تشخیص ورود به مکالمه: `discord voice: realtime barge-in detected source=speaker-start ...` یا `discord voice: realtime barge-in detected source=active-speaker-audio ...` و سپس `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- هنگام وقفه بلادرنگ: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in` و سپس یکی از `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` یا `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- هنگام نادیده‌گرفتن پژواک یا نویز: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- هنگام غیرفعال‌بودن ورود به مکالمه: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- هنگام بیکار بودن پخش: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

برای اشکال‌زدایی صدای قطع‌شده، لاگ‌های صوتی بلادرنگ را به‌صورت یک خط زمانی بخوانید:

1. `realtime audio playback started` یعنی Discord پخش صدای دستیار را آغاز کرده است. از این نقطه، پل شمارش قطعه‌های خروجی دستیار، بایت‌های PCM مربوط به Discord، بایت‌های بلادرنگ ارائه‌دهنده و مدت صدای تولیدشده را آغاز می‌کند.
2. `realtime speaker turn opened` فعال‌شدن یک گوینده در Discord را نشان می‌دهد. اگر پخش از قبل فعال باشد و `bargeIn` نیز فعال شده باشد، ممکن است پس از آن `barge-in detected source=speaker-start` ثبت شود.
3. `realtime input audio started` دریافت نخستین فریم واقعی صدا برای آن نوبت گوینده را نشان می‌دهد. وجود `outputActive=true` یا مقدار غیرصفر `outputAudioMs` در اینجا یعنی میکروفن درحالی ورودی می‌فرستد که پخش دستیار همچنان فعال است.
4. `barge-in detected source=active-speaker-audio` یعنی OpenClaw هنگام فعال‌بودن پخش دستیار، صدای زنده گوینده را دیده است. این مورد برای تشخیص تفاوت میان یک وقفه واقعی و رویداد شروع گوینده Discord که صدای مفیدی ندارد، کاربرد دارد.
5. `barge-in requested reason=...` یعنی OpenClaw از ارائه‌دهنده بلادرنگ خواسته پاسخ فعال را لغو یا کوتاه کند. این لاگ شامل `outputAudioMs`، `outputActive` و `playbackChunks` است تا بتوانید ببینید پیش از وقفه واقعاً چه مقدار از صدای دستیار پخش شده بود.
6. `realtime audio playback stopped reason=...` نقطه بازنشانی پخش محلی Discord است. دلیل مشخص می‌کند چه چیزی پخش را متوقف کرده است: `barge-in`، `player-idle`، `provider-clear-audio`، `forced-agent-consult`، `stream-close` یا `session-close`.
7. `realtime speaker turn closed` خلاصه نوبت ورودی ضبط‌شده است. `chunks=0` یا `hasAudio=false` یعنی نوبت گوینده باز شده، اما هیچ صدای قابل‌استفاده‌ای به پل بلادرنگ نرسیده است. `interruptedPlayback=true` یعنی آن نوبت ورودی با خروجی دستیار هم‌پوشانی داشته و منطق ورود به مکالمه را فعال کرده است.

فیلدهای مفید:

- `outputAudioMs`: مدت صدای دستیار که ارائه‌دهنده بلادرنگ پیش از خط لاگ تولید کرده است.
- `audioMs`: مدت صدای دستیار که OpenClaw پیش از توقف پخش شمارش کرده است.
- `elapsedMs`: زمان واقعی سپری‌شده میان بازشدن و بسته‌شدن جریان پخش یا نوبت گوینده.
- `discordBytes`: بایت‌های PCM استریوی ۴۸ کیلوهرتز که به قابلیت صوتی Discord ارسال یا از آن دریافت شده‌اند.
- `realtimeBytes`: بایت‌های PCM با قالب ارائه‌دهنده که به ارائه‌دهنده بلادرنگ ارسال یا از آن دریافت شده‌اند.
- `playbackChunks`: قطعه‌های صدای دستیار که برای پاسخ فعال به Discord فرستاده شده‌اند.
- `sinceLastAudioMs`: فاصله میان آخرین فریم صدای ضبط‌شده گوینده و بسته‌شدن نوبت گوینده.

الگوهای رایج:

- قطع‌شدن فوری با `source=active-speaker-audio`، مقدار کم `outputAudioMs` و حضور همان کاربر در نزدیکی معمولاً نشان می‌دهد پژواک بلندگو وارد میکروفن شده است. مقدار `voice.realtime.minBargeInAudioEndMs` را افزایش دهید، صدای بلندگو را کم کنید، از هدفون استفاده کنید یا `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید.
- ثبت `source=speaker-start` و سپس `speaker turn closed ... hasAudio=false` یعنی Discord شروع فعالیت یک گوینده را گزارش کرده، اما هیچ صدایی به OpenClaw نرسیده است. این وضعیت می‌تواند ناشی از یک رویداد گذرای صوتی Discord، رفتار دروازه نویز یا فعال‌کردن بسیار کوتاه میکروفن توسط کارخواه باشد.
- ثبت `audio playback stopped reason=stream-close` بدون ورود به مکالمه نزدیک یا `provider-clear-audio` یعنی جریان پخش محلی Discord به‌طور غیرمنتظره پایان یافته است. لاگ‌های پیشین ارائه‌دهنده و پخش‌کننده Discord را بررسی کنید.
- `capture ignored during playback (barge-in disabled)` یعنی OpenClaw هنگام فعال‌بودن صدای دستیار، ورودی را عمداً کنار گذاشته است. اگر می‌خواهید گفتار پخش را قطع کند، `voice.realtime.bargeIn` را فعال کنید.
- `barge-in ignored ... outputActive=false` یعنی تشخیص فعالیت صوتی Discord یا ارائه‌دهنده، گفتار را گزارش کرده است، اما OpenClaw پخش فعالی برای قطع‌کردن نداشته است. این وضعیت نباید صدا را قطع کند.

اعتبارنامه‌ها برای هر مؤلفه جداگانه تعیین می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، احراز هویت TTS برای `messages.tts`/`voice.tts` و احراز هویت ارائه‌دهنده بلادرنگ برای `voice.realtime.providers` یا پیکربندی عادی احراز هویت ارائه‌دهنده.

### پیام‌های صوتی

پیام‌های صوتی Discord پیش‌نمایش شکل موج را نمایش می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw شکل موج را به‌طور خودکار تولید می‌کند، اما برای بررسی و تبدیل به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (نشانی‌های وب رد می‌شوند).
- محتوای متنی را حذف کنید (Discord وجود هم‌زمان متن و پیام صوتی در یک بار داده را رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="از intentهای غیرمجاز استفاده شده یا ربات هیچ پیام سروری را نمی‌بیند">

    - Message Content Intent را فعال کنید
    - هنگامی که به تفکیک کاربران/اعضا وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، Gateway را راه‌اندازی مجدد کنید

  </Accordion>

  <Accordion title="پیام‌های guild به‌طور غیرمنتظره مسدود می‌شوند">

    - `groupPolicy` را بررسی کنید
    - فهرست مجاز guild را در `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` برای یک guild وجود داشته باشد، فقط کانال‌های فهرست‌شده مجاز هستند
    - رفتار `requireMention` و الگوهای اشاره را بررسی کنید

    بررسی‌های مفید:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="requireMention غیرفعال است، اما همچنان مسدود می‌شود">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون فهرست مجاز منطبق برای guild/کانال
    - پیکربندی `requireMention` در محل نادرست (باید زیر `channels.discord.guilds` یا در ورودی یک کانال باشد)
    - فرستنده توسط فهرست مجاز `users` مربوط به guild/کانال مسدود شده است

  </Accordion>

  <Accordion title="نوبت‌های طولانی Discord یا پاسخ‌های تکراری">

    گزارش‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    تنظیمات صف Gateway در Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این تنظیم فقط کار شنونده Gateway در Discord را کنترل می‌کند، نه طول عمر نوبت عامل را

    Discord برای نوبت‌های در صف عامل، مهلت زمانی تحت مالکیت کانال اعمال نمی‌کند. شنونده‌های پیام بلافاصله کار را واگذار می‌کنند و اجراهای در صف Discord ترتیب هر نشست را تا زمانی که چرخه عمر نشست/ابزار/زمان اجرا کار را کامل یا لغو کند، حفظ می‌کنند.

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

  <Accordion title="هشدارهای پایان مهلت جست‌وجوی فراداده Gateway">
    OpenClaw پیش از اتصال، فراداده `/gateway/bot` مربوط به Discord را دریافت می‌کند. در خرابی‌های گذرا، از نشانی پیش‌فرض Gateway در Discord استفاده می‌شود و ثبت آن‌ها در گزارش‌ها دارای محدودیت نرخ است.

    تنظیمات مهلت فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - در صورت تنظیم‌نشدن پیکربندی، مقدار جایگزین محیطی: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="راه‌اندازی‌های مجدد بر اثر پایان مهلت READY در Gateway">
    OpenClaw هنگام راه‌اندازی و پس از اتصال مجدد زمان اجرا، منتظر رویداد `READY` مربوط به Gateway در Discord می‌ماند. پیکربندی‌های چندحساب با راه‌اندازی پلکانی ممکن است به پنجره زمانی READY طولانی‌تری نسبت به مقدار پیش‌فرض نیاز داشته باشند.

    تنظیمات مهلت READY:

    - راه‌اندازی تک‌حساب: `channels.discord.gatewayReadyTimeoutMs`
    - راه‌اندازی چندحساب: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - در صورت تنظیم‌نشدن پیکربندی، مقدار جایگزین محیطی راه‌اندازی: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض راه‌اندازی: `15000` (۱۵ ثانیه)، حداکثر: `120000`
    - زمان اجرای تک‌حساب: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - زمان اجرای چندحساب: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - در صورت تنظیم‌نشدن پیکربندی، مقدار جایگزین محیطی زمان اجرا: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض زمان اجرا: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="عدم تطابق در ممیزی مجوزها">
    بررسی مجوزهای `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کند.

    اگر از کلیدهای slug استفاده کنید، تطبیق زمان اجرا همچنان ممکن است کار کند، اما probe نمی‌تواند مجوزها را به‌طور کامل تأیید کند.

  </Accordion>

  <Accordion title="مشکلات پیام خصوصی و جفت‌سازی">

    - پیام خصوصی غیرفعال است: `channels.discord.dm.enabled=false`
    - سیاست پیام خصوصی غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در حالت `pairing` منتظر تأیید جفت‌سازی است

  </Accordion>

  <Accordion title="حلقه‌های ربات‌به‌ربات">
    به‌طور پیش‌فرض، پیام‌های ارسال‌شده توسط ربات‌ها نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قواعد سخت‌گیرانه اشاره و فهرست مجاز استفاده کنید.
    ترجیحاً از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های رباتی که به ربات اشاره می‌کنند پذیرفته شوند.

    OpenClaw همچنین همراه با [محافظت در برابر حلقه ربات](/fa/channels/bot-loop-protection) مشترک ارائه می‌شود. هرگاه `allowBots` اجازه دهد پیام‌های ارسال‌شده توسط ربات‌ها به توزیع برسند، Discord رویداد ورودی را به واقعیت‌های `(account, channel, bot pair)` نگاشت می‌کند و محافظ عمومی جفت، پس از عبور جفت از بودجه رویداد پیکربندی‌شده، آن را مهار می‌کند. این محافظ از حلقه‌های مهارنشدنی میان دو ربات جلوگیری می‌کند که پیش‌تر باید به‌وسیله محدودیت‌های نرخ Discord متوقف می‌شدند؛ این محافظ بر استقرارهای تک‌ربات یا پاسخ‌های یک‌باره ربات که زیر بودجه باقی می‌مانند اثری ندارد.

    تنظیمات پیش‌فرض (هنگامی که `allowBots` تنظیم شده باشد فعال هستند):

    - `maxEventsPerWindow: 20` -- جفت ربات می‌تواند در پنجره لغزان ۲۰ پیام مبادله کند
    - `windowSeconds: 60` -- طول پنجره لغزان
    - `cooldownSeconds: 60` -- پس از عبور از بودجه، هر پیام اضافی ربات‌به‌ربات در هر یک از دو جهت به‌مدت یک دقیقه حذف می‌شود

    پیش‌فرض مشترک را یک‌بار زیر `channels.defaults.botLoopProtection` پیکربندی کنید، سپس هنگامی که یک گردش کار معتبر به ظرفیت بیشتری نیاز دارد، آن را برای Discord بازنویسی کنید. ترتیب تقدم چنین است:

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
      // بازنویسی اختیاری در سراسر Discord. بلوک‌های حساب، فیلدهای منفرد را بازنویسی می‌کنند
      // و فیلدهای حذف‌شده را از اینجا به ارث می‌برند.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // آلفا فقط هنگامی به ربات‌های دیگر گوش می‌دهد که به آن اشاره کنند.
          allowBots: "mentions",
        },
        bravo: {
          // براوو به همه پیام‌های Discord ارسال‌شده توسط ربات‌ها گوش می‌دهد.
          allowBots: true,
          mentionAliases: {
            // به براوو اجازه می‌دهد با شناسه کاربری پیکربندی‌شده، یک اشاره Discord به آلفا بنویسد.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // پیش از مهار جفت، حداکثر پنج پیام در دقیقه مجاز باشد.
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

  <Accordion title="قطع تبدیل گفتار به متن صوتی با DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صوت Discord موجود باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` است (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض بالادستی) شروع کنید و فقط در صورت نیاز آن را تنظیم کنید
    - گزارش‌ها را برای موارد زیر زیر نظر بگیرید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر خرابی‌ها پس از پیوستن مجدد خودکار ادامه یافتند، گزارش‌ها را جمع‌آوری کنید و با سابقه دریافت DAVE در بالادست در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای مهم Discord">

- راه‌اندازی/احراز هویت: `enabled`، `token`، `applicationId`، `accounts.*`، `allowBots`
- سیاست: `groupPolicy`، `dmPolicy`، `allowFrom`، `dm.*`، `guilds.*`، `guilds.*.channels.*`
- فرمان: `commands.native`، `commands.useAccessGroups` (سراسری)، `configWrites`، `slashCommand.ephemeral`
- صف رویداد: `eventQueue.listenerTimeout` (بودجه شنونده، پیش‌فرض `120000`)، `eventQueue.maxQueueSize` (پیش‌فرض `10000`)، `eventQueue.maxConcurrency` (پیش‌فرض `50`)
- Gateway:‏ `proxy`، `gatewayInfoTimeoutMs`، `gatewayReadyTimeoutMs`، `gatewayRuntimeReadyTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`
- تحویل: `textChunkLimit` (پیش‌فرض `2000`)، `maxLinesPerMessage` (پیش‌فرض `17`)
- پخش جریانی: `streaming.mode`، `streaming.chunkMode`، `streaming.preview.*`، `streaming.progress.*`، `streaming.block.*` (کلیدهای مسطح قدیمی `streamMode`، `draftChunk`، `blockStreaming`، `blockStreamingCoalesce` و `chunkMode` توسط `openclaw doctor --fix` به `streaming.*` منتقل می‌شوند)
- رسانه/تلاش مجدد: `mediaMaxMb` (بارگذاری‌های خروجی Discord را محدود می‌کند، پیش‌فرض `100`)، `retry`
- کنش‌ها: `actions.*`
- حضور: `activity`، `status`، `activityType`، `activityUrl`، `autoPresence.*`
- رابط کاربری: `ui.components.accentColor`
- قابلیت‌ها: `threadBindings`، سطح بالای `bindings[]` ‏(`type: "acp"`)، `pluralkit`، `execApprovals`، `intents`، `agentComponents.enabled`، `agentComponents.ttlMs`، `heartbeat`، `responsePrefix`

</Accordion>

## ایمنی و عملیات

- توکن‌های ربات را محرمانه در نظر بگیرید (در محیط‌های تحت نظارت، `DISCORD_BOT_TOKEN` ترجیح داده می‌شود).
- حداقل مجوزهای لازم Discord را اعطا کنید.
- اگر استقرار/وضعیت فرمان منقضی شده است، Gateway را راه‌اندازی مجدد کنید و با `openclaw channels status --probe` دوباره بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را با Gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار گفت‌وگوی گروهی و فهرست مجاز.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و مقاوم‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و کانال‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="فرمان‌های اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی.
  </Card>
</CardGroup>
