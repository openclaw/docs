---
read_when:
    - کار روی قابلیت‌های کانال Discord
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی بات Discord
title: Discord
x-i18n:
    generated_at: "2026-05-04T02:21:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: df4e045e39f8977f779fe409abf41dad0d950c92f1230c51ff356343513df812
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های مستقیم و کانال‌های سرور از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Discord به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستور بومی و کاتالوگ دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی بین‌کانالی و جریان تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید همراه با یک ربات بسازید، ربات را به سرور خود اضافه کنید و آن را با OpenClaw جفت کنید. توصیه می‌کنیم رباتتان را به سرور خصوصی خودتان اضافه کنید. اگر هنوز یکی ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="ایجاد یک برنامه و ربات Discord">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را روی هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="فعال‌سازی intentهای ممتاز">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **Message Content Intent** (لازم)
    - **Server Members Intent** (توصیه‌شده؛ برای فهرست‌های مجاز نقش و تطبیق نام با شناسه لازم است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="کپی کردن توکن ربات">
    در صفحه **Bot** دوباره به بالا بروید و روی **Reset Token** کلیک کنید.

    <Note>
    با وجود این نام، این کار نخستین توکن شما را تولید می‌کند — چیزی «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی کنید و جایی ذخیره کنید. این **Bot Token** شماست و به‌زودی به آن نیاز خواهید داشت.

  </Step>

  <Step title="تولید URL دعوت و افزودن ربات به سرور">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست برای افزودن ربات به سرورتان تولید خواهید کرد.

    به پایین تا **OAuth2 URL Generator** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    بخشی با عنوان **Bot Permissions** در پایین ظاهر می‌شود. حداقل این موارد را فعال کنید:

    **مجوزهای عمومی**
      - مشاهده کانال‌ها
    **مجوزهای متنی**
      - ارسال پیام‌ها
      - خواندن تاریخچه پیام‌ها
      - جاسازی پیوندها
      - پیوست کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعه پایه برای کانال‌های متنی عادی است. اگر قصد دارید در رشته‌های Discord پست بگذارید، از جمله جریان‌های کاری کانال انجمن یا رسانه که یک رشته ایجاد می‌کنند یا ادامه می‌دهند، **Send Messages in Threads** را نیز فعال کنید.
    URL تولیدشده در پایین را کپی کنید، در مرورگر خود جای‌گذاری کنید، سرورتان را انتخاب کنید و برای اتصال روی **Continue** کلیک کنید. اکنون باید ربات خود را در سرور Discord ببینید.

  </Step>

  <Step title="فعال‌سازی Developer Mode و جمع‌آوری شناسه‌ها">
    در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **User Settings** (نماد چرخ‌دنده کنار آواتار خود) کلیک کنید → **Advanced** → **Developer Mode** را روشن کنید
    2. در نوار کناری روی **server icon** خود راست‌کلیک کنید → **Copy Server ID**
    3. روی **own avatar** خود راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را در کنار Bot Token ذخیره کنید — در مرحله بعد هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="اجازه دادن به پیام‌های مستقیم از اعضای سرور">
    برای کار کردن جفت‌سازی، Discord باید به ربات شما اجازه دهد به شما پیام مستقیم بدهد. روی **server icon** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار به اعضای سرور (از جمله ربات‌ها) اجازه می‌دهد به شما پیام مستقیم بدهند. اگر می‌خواهید از پیام‌های مستقیم Discord با OpenClaw استفاده کنید، این گزینه را فعال نگه دارید. اگر فقط قصد دارید از کانال‌های سرور استفاده کنید، می‌توانید پس از جفت‌سازی پیام‌های مستقیم را غیرفعال کنید.

  </Step>

  <Step title="تنظیم امن توکن ربات (آن را در چت ارسال نکنید)">
    توکن ربات Discord شما یک راز است (مانند گذرواژه). پیش از پیام دادن به عامل خود، آن را روی دستگاهی که OpenClaw را اجرا می‌کند تنظیم کنید.

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

    اگر OpenClaw از قبل به‌عنوان سرویس پس‌زمینه در حال اجراست، آن را از طریق برنامه Mac مربوط به OpenClaw یا با توقف و راه‌اندازی دوباره فرایند `openclaw gateway run` بازراه‌اندازی کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از پوسته‌ای اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس پس از بازراه‌اندازی بتواند env SecretRef را resolve کند.
    اگر میزبان شما توسط جست‌وجوی برنامه هنگام راه‌اندازی Discord مسدود یا rate-limit شده است، شناسه برنامه/کلاینت Discord را از Developer Portal تنظیم کنید تا راه‌اندازی بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند ربات Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="پیکربندی OpenClaw و جفت‌سازی">

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        در هر کانال موجود (مثلاً Telegram) با عامل OpenClaw خود چت کنید و به آن بگویید. اگر Discord نخستین کانال شماست، به‌جای آن از زبانه CLI / پیکربندی استفاده کنید.

        > «توکن ربات Discord خود را از قبل در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با User ID `<user_id>` و Server ID `<server_id>` تکمیل کن.»
      </Tab>
      <Tab title="CLI / پیکربندی">
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

        fallback محیطی برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه‌دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس بدون `--dry-run` دوباره اجرا کنید. مقادیر متنی ساده `token` پشتیبانی می‌شوند. مقادیر SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند ربات Discord، هر توکن ربات و شناسه برنامه را زیر حساب خودش نگه دارید. `channels.discord.applicationId` سطح بالا توسط حساب‌ها به ارث برده می‌شود، بنابراین فقط زمانی آن را آنجا تنظیم کنید که همه حساب‌ها باید از همان شناسه برنامه استفاده کنند.

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

  <Step title="تأیید نخستین جفت‌سازی پیام مستقیم">
    صبر کنید تا Gateway در حال اجرا باشد، سپس در Discord به ربات خود پیام مستقیم بدهید. ربات با یک کد جفت‌سازی پاسخ می‌دهد.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        کد جفت‌سازی را در کانال موجود خود به عاملتان بفرستید:

        > «این کد جفت‌سازی Discord را تأیید کن: `<CODE>`»
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    کدهای جفت‌سازی پس از 1 ساعت منقضی می‌شوند.

    اکنون باید بتوانید در Discord از طریق پیام مستقیم با عامل خود چت کنید.

  </Step>
</Steps>

<Note>
حل توکن نسبت به حساب آگاه است. مقادیر توکن پیکربندی بر fallback محیطی اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به یک توکن ربات یکسان resolve شوند، OpenClaw فقط یک پایشگر Gateway برای آن توکن راه‌اندازی می‌کند. توکنی که از پیکربندی آمده باشد بر fallback محیطی پیش‌فرض اولویت دارد؛ در غیر این صورت نخستین حساب فعال برنده می‌شود و حساب تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار پیام/اقدام‌های کانال)، یک `token` صریح برای هر فراخوانی برای همان فراخوانی استفاده می‌شود. این برای اقدام‌های ارسال و خواندن/پروب‌مانند اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات سیاست حساب/تلاش مجدد همچنان از حساب انتخاب‌شده در snapshot زمان اجرای فعال می‌آیند.
</Note>

## توصیه‌شده: راه‌اندازی یک فضای کاری سرور

پس از کار کردن پیام‌های مستقیم، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال نشست عامل جداگانه خودش را با زمینه خودش دریافت می‌کند. این برای سرورهای خصوصی که فقط شما و رباتتان در آن هستید توصیه می‌شود.

<Steps>
  <Step title="افزودن سرور خود به فهرست مجاز سرور">
    این کار به عامل شما امکان می‌دهد در هر کانالی در سرورتان پاسخ دهد، نه فقط در پیام‌های مستقیم.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «Discord Server ID `<server_id>` من را به فهرست مجاز سرور اضافه کن»
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
    به‌طور پیش‌فرض، عامل شما در کانال‌های سرور فقط وقتی @mention شود پاسخ می‌دهد. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های سرور، پاسخ‌های نهایی معمول دستیار به‌طور پیش‌فرض خصوصی می‌مانند. خروجی قابل مشاهده Discord باید به‌صراحت با ابزار `message` ارسال شود، بنابراین عامل می‌تواند به‌طور پیش‌فرض در سکوت بماند و فقط وقتی تصمیم می‌گیرد پاسخ کانال مفید است پست کند.

    این یعنی مدل انتخاب‌شده باید با اطمینان ابزارها را فراخوانی کند. اگر Discord در حال تایپ نشان می‌دهد و گزارش‌ها مصرف توکن را نشان می‌دهند اما پیامی پست نشده است، گزارش نشست را برای متن دستیار با `didSendViaMessagingTool: false` بررسی کنید. این یعنی مدل به‌جای فراخوانی `message(action=send)` یک پاسخ نهایی خصوصی تولید کرده است. به یک مدل قوی‌تر در فراخوانی ابزارها تغییر دهید، یا از پیکربندی زیر برای بازگرداندن پاسخ‌های نهایی خودکار قدیمی استفاده کنید.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «به عامل من اجازه بده در این سرور بدون اینکه لازم باشد @mention شود پاسخ دهد»
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

        برای بازگرداندن پاسخ‌های نهایی خودکار قدیمی برای اتاق‌های گروه/کانال، `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="برنامه‌ریزی برای حافظه در کانال‌های سرور">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در نشست‌های پیام مستقیم بارگذاری می‌شود. کانال‌های سرور MEMORY.md را به‌صورت خودکار بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر برای زمینه بلندمدت از MEMORY.md نیاز داری، از memory_search یا memory_get استفاده کن.»
      </Tab>
      <Tab title="دستی">
        اگر در هر کانال به زمینه مشترک نیاز دارید، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` بگذارید (برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال در سرور Discord خود بسازید و شروع به چت کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال نشست جداگانه ایزوله خودش را دریافت می‌کند — بنابراین می‌توانید `#coding`، `#home`، `#research` یا هر چیزی را که با جریان کاری شما سازگار است راه‌اندازی کنید.

## مدل زمان اجرا

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord دوباره به Discord برمی‌گردند.
- فراداده سرور/کانال Discord به‌عنوان زمینه غیرقابل‌اعتماد به اعلان مدل اضافه می‌شود، نه به‌عنوان پیشوند پاسخ قابل‌مشاهده برای کاربر. اگر مدلی آن پوشش را دوباره کپی کند، OpenClaw فراداده کپی‌شده را از پاسخ‌های خروجی و از زمینه بازپخش آینده حذف می‌کند.
- به‌صورت پیش‌فرض (`session.dmScope=main`)، گفت‌وگوهای مستقیم نشست اصلی عامل را به اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های سرور از کلیدهای نشست ایزوله استفاده می‌کنند (`agent:<agentId>:discord:channel:<channelId>`).
- پیام‌های مستقیم گروهی به‌صورت پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های اسلش بومی در نشست‌های فرمان ایزوله اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، در حالی که همچنان `CommandTargetSessionKey` را به نشست گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان cron/heartbeat فقط‌متنی به Discord یک‌بار از پاسخ نهایی قابل‌مشاهده برای دستیار استفاده می‌کند. payloadهای رسانه‌ای و مؤلفه‌های ساختاریافته وقتی عامل چند payload قابل‌تحویل تولید می‌کند، همچنان چندپیامی باقی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانه Discord فقط پست‌های thread را می‌پذیرند. OpenClaw از دو روش برای ایجاد آن‌ها پشتیبانی می‌کند:

- پیامی به والد انجمن (`channel:<forumId>`) بفرستید تا یک thread به‌صورت خودکار ایجاد شود. عنوان thread از اولین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ایجاد مستقیم thread استفاده کنید. برای کانال‌های انجمن، `--message-id` را ارسال نکنید.

نمونه: ارسال به والد انجمن برای ایجاد thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

نمونه: ایجاد صریح یک thread انجمن

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود thread ارسال کنید (`channel:<threadId>`).

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای مؤلفه‌های v2 Discord برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با payload به‌نام `components` استفاده کنید. نتایج تعامل به‌عنوان پیام‌های ورودی عادی دوباره به عامل مسیریابی می‌شوند و از تنظیمات موجود `replyToMode` در Discord پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- ردیف‌های کنش تا ۵ دکمه یا یک منوی انتخاب واحد را مجاز می‌کنند
- نوع‌های انتخاب: `string`, `user`, `role`, `mentionable`, `channel`

به‌صورت پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اجازه دادن به استفاده چندباره از دکمه‌ها، انتخاب‌ها و فرم‌ها تا زمان انقضای آن‌ها، `components.reusable=true` را تنظیم کنید.

برای محدود کردن کسانی که می‌توانند روی یک دکمه کلیک کنند، `allowedUsers` را روی آن دکمه تنظیم کنید (شناسه‌های کاربری Discord، برچسب‌ها، یا `*`). وقتی پیکربندی شده باشد، کاربران نامطابق یک رد موقت دریافت می‌کنند.

فرمان‌های اسلش `/model` و `/models` یک انتخابگر تعاملی مدل را با فهرست‌های کشویی ارائه‌دهنده، مدل و runtime سازگار، به‌همراه مرحله Submit باز می‌کنند. `/models add` منسوخ شده است و اکنون به‌جای ثبت مدل‌ها از چت، پیام منسوخ‌شدن برمی‌گرداند. پاسخ انتخابگر موقت است و فقط کاربر فراخواننده می‌تواند از آن استفاده کند.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (فایل واحد)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با مرجع پیوست مطابقت داشته باشد، از `filename` برای بازنویسی نام استفاده کنید

فرم‌های مودال:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- نوع‌های فیلد: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw به‌صورت خودکار یک دکمه محرک اضافه می‌کند

نمونه:

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
    `channels.discord.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.discord.allowFrom` allowlist رسمی DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند این است که `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست DM باز نباشد، کاربران ناشناخته مسدود می‌شوند (یا در حالت `pairing` برای جفت‌سازی راهنمایی می‌شوند).

    تقدم چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط روی حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی تقدم دارد.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب مقصد DM برای تحویل:

    - `user:<id>`
    - اشاره `<@id>`

    شناسه‌های عددی خام معمولاً وقتی پیش‌فرض کانال فعال است به‌عنوان شناسه‌های کانال resolve می‌شوند، اما شناسه‌هایی که در `allowFrom` مؤثر DM حساب فهرست شده‌اند، برای سازگاری به‌عنوان مقصدهای DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="گروه‌های دسترسی DM">
    DMهای Discord می‌توانند از مدخل‌های پویا `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کنند.

    نام‌های گروه دسترسی بین کانال‌های پیام مشترک هستند. برای یک گروه ایستا که اعضایش با نحو عادی `allowFrom` هر کانال بیان می‌شوند، از `type: "message.senders"` استفاده کنید، یا وقتی مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کنند، از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک گروه دسترسی اینجا مستند شده است: [گروه‌های دسترسی](/fa/channels/access-groups).

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

    یک کانال متنی Discord فهرست اعضای جداگانه‌ای ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستنده DM عضو سرور پیکربندی‌شده است و پس از اعمال بازنویسی‌های نقش و کانال، در حال حاضر مجوز مؤثر `ViewChannel` روی کانال پیکربندی‌شده دارد.

    نمونه: اجازه دهید هر کسی که می‌تواند `#maintainers` را ببیند به bot پیام مستقیم بدهد، در حالی که DMها برای بقیه بسته می‌مانند.

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

    می‌توانید مدخل‌های پویا و ایستا را ترکیب کنید:

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

    جست‌وجوها در صورت شکست بسته می‌مانند. اگر Discord مقدار `Missing Access` را برگرداند، جست‌وجوی عضو شکست بخورد، یا کانال به سرور دیگری تعلق داشته باشد، فرستنده DM غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر مخاطبان کانال، **Server Members Intent** را در Discord Developer Portal برای bot فعال کنید. DMها وضعیت عضو سرور را شامل نمی‌شوند، بنابراین OpenClaw در زمان مجوزدهی عضو را از طریق REST مربوط به Discord resolve می‌کند.

  </Tab>

  <Tab title="سیاست سرور">
    مدیریت سرور با `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط مبنای امن وقتی `channels.discord` وجود دارد، `allowlist` است.

    رفتار `allowlist`:

    - سرور باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - allowlistهای اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های نقش)؛ اگر هرکدام پیکربندی شده باشد، فرستنده‌ها وقتی با `users` یا `roles` مطابقت داشته باشند مجاز می‌شوند
    - تطبیق مستقیم نام/برچسب به‌صورت پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/برچسب‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌ترند؛ وقتی مدخل‌های نام/برچسب استفاده شوند، `openclaw security audit` هشدار می‌دهد
    - اگر یک سرور `channels` پیکربندی‌شده داشته باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک سرور بلوک `channels` نداشته باشد، همه کانال‌ها در آن سرور allowlistشده مجاز هستند

    نمونه:

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` نسازید، fallback زمان اجرا `groupPolicy="allowlist"` خواهد بود (با یک هشدار در لاگ‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="اشاره‌ها و DMهای گروهی">
    پیام‌های سرور به‌صورت پیش‌فرض با اشاره gate می‌شوند.

    تشخیص اشاره شامل این موارد است:

    - اشاره صریح به bot
    - الگوهای اشاره پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback با `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ‌به-bot در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از نحو اشاره رسمی استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای نقش‌ها. از فرم اشاره نام مستعار قدیمی `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر سرور/کانال پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که به کاربر/نقش دیگری اشاره می‌کنند اما به bot اشاره نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).

    DMهای گروهی:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - allowlist اختیاری از طریق `dm.groupChannels` (شناسه‌ها یا slugهای کانال)

  </Tab>
</Tabs>

### مسیریابی عامل بر پایه نقش

از `bindings[].match.roles` برای مسیریابی اعضای سرور Discord به عامل‌های مختلف بر اساس شناسه نقش استفاده کنید. bindingهای مبتنی بر نقش فقط شناسه‌های نقش را می‌پذیرند و پس از bindingهای peer یا parent-peer و پیش از bindingهای فقط-سرور ارزیابی می‌شوند. اگر یک binding فیلدهای تطبیق دیگری هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همه فیلدهای پیکربندی‌شده باید مطابقت داشته باشند.

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

- `commands.native` به‌طور پیش‌فرض روی `"auto"` است و برای Discord فعال می‌شود.
- بازنویسی مخصوص هر کانال: `channels.discord.commands.native`.
- `commands.native=false` ثبت و پاک‌سازی دستورهای اسلش Discord را هنگام راه‌اندازی رد می‌کند. دستورهایی که قبلاً ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف نکنید، همچنان در Discord قابل مشاهده بمانند.
- احراز هویت دستور بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که پردازش عادی پیام استفاده می‌کند.
- دستورها ممکن است همچنان در UI Discord برای کاربرانی که مجاز نیستند قابل مشاهده باشند؛ اجرا همچنان احراز هویت OpenClaw را اعمال می‌کند و "not authorized" برمی‌گرداند.

برای فهرست دستورها و رفتار، [دستورهای اسلش](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض دستور اسلش:

- `ephemeral: true`

## جزئیات ویژگی

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
    `first` همیشه ارجاع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای آن نوبت متصل می‌کند.
    `batched` فقط زمانی ارجاع پاسخ بومی ضمنی Discord را متصل می‌کند که
    نوبت ورودی یک دسته debounce‌شده از چند پیام بوده باشد. این زمانی مفید است
    که پاسخ‌های بومی را عمدتاً برای گفتگوهای جهشی و مبهم می‌خواهید، نه هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در بافت/تاریخچه نمایان می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش پخش زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هنگام رسیدن متن، پاسخ‌های پیش‌نویس را پخش کند. `channels.discord.streaming` مقادیر `off` (پیش‌فرض) | `partial` | `block` | `progress` را می‌پذیرد. `progress` یک پیش‌نویس وضعیت قابل ویرایش را نگه می‌دارد و آن را تا تحویل نهایی با پیشرفت ابزار به‌روزرسانی می‌کند؛ `streamMode` یک نام مستعار قدیمی است و به‌صورت خودکار مهاجرت داده می‌شود.

    مقدار پیش‌فرض `off` می‌ماند چون ویرایش‌های پیش‌نمایش Discord وقتی چند بات یا Gateway یک حساب را به اشتراک می‌گذارند، سریعاً به محدودیت نرخ می‌خورند.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` هنگام رسیدن توکن‌ها یک پیام پیش‌نمایش واحد را ویرایش می‌کند.
    - `block` قطعه‌هایی به اندازه پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، با محدود شدن به `textChunkLimit`).
    - رسانه، خطا، و نهایی‌های پاسخ صریح، ویرایش‌های پیش‌نمایش در انتظار را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.

    پخش پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی برمی‌گردند. وقتی پخش `block` صریحاً فعال باشد، OpenClaw برای جلوگیری از پخش دوباره، جریان پیش‌نمایش را رد می‌کند.

  </Accordion>

  <Accordion title="رفتار تاریخچه، بافت، و رشته">
    بافت تاریخچه انجمن:

    - مقدار پیش‌فرض `channels.discord.historyLimit` برابر `20`
    - جایگزین: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچه DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار رشته:

    - رشته‌های Discord به‌عنوان نشست‌های کانال مسیریابی می‌شوند و پیکربندی کانال والد را به ارث می‌برند مگر اینکه بازنویسی شده باشد.
    - نشست‌های رشته انتخاب `/model` سطح نشست کانال والد را فقط به‌عنوان جایگزین مدل به ارث می‌برند؛ انتخاب‌های `/model` محلی رشته همچنان اولویت دارند و تاریخچه رونوشت والد کپی نمی‌شود مگر اینکه ارث‌بری رونوشت فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) رشته‌های خودکار جدید را برای seed شدن از رونوشت والد فعال می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند هدف‌های DM به شکل `user:<id>` را حل کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام جایگزین فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوع‌های کانال به‌عنوان بافت **غیرقابل اعتماد** تزریق می‌شوند. فهرست‌های مجاز تعیین می‌کنند چه کسی می‌تواند عامل را فعال کند، نه یک مرز کامل پاک‌سازی بافت تکمیلی.

  </Accordion>

  <Accordion title="نشست‌های مقید به رشته برای زیربرنامه‌ها">
    Discord می‌تواند یک رشته را به هدف نشست متصل کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست مسیریابی شوند (از جمله نشست‌های زیربرنامه).

    دستورها:

    - `/focus <target>` رشته فعلی/جدید را به هدف زیربرنامه/نشست متصل می‌کند
    - `/unfocus` اتصال رشته فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت اتصال را نشان می‌دهد
    - `/session idle <duration|off>` auto-unfocus ناشی از عدم فعالیت را برای اتصال‌های متمرکز بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر عمر سخت را برای اتصال‌های متمرکز بررسی/به‌روزرسانی می‌کند

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
    - `defaultSpawnContext` بافت بومی زیربرنامه را برای ایجادهای مقید به رشته کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` با `openclaw doctor --fix` مهاجرت داده می‌شوند.
    - اگر اتصال‌های رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط با اتصال رشته در دسترس نیستند.

    [زیربرنامه‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="اتصال‌های پایدار کانال ACP">
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

    - `/acp spawn codex --bind here` کانال یا رشته فعلی را درجا متصل می‌کند و پیام‌های آینده را روی همان نشست ACP نگه می‌دارد. پیام‌های رشته اتصال کانال والد را به ارث می‌برند.
    - در یک کانال یا رشته متصل، `/new` و `/reset` همان نشست ACP را درجا بازنشانی می‌کنند. اتصال‌های موقت رشته می‌توانند در زمان فعال بودن، حل هدف را بازنویسی کنند.
    - `spawnSessions` ایجاد/اتصال رشته فرزند را از طریق `--thread auto|here` کنترل می‌کند.

    برای جزئیات رفتار اتصال، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش برای هر انجمن:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستمی تبدیل می‌شوند و به نشست Discord مسیریابی‌شده متصل می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید دریافت">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw یک ایموجی تأیید دریافت ارسال می‌کند.

    ترتیب حل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Discord ایموجی یونیکد یا نام‌های ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن پیکربندی">
    نوشتن پیکربندی آغازشده از کانال به‌طور پیش‌فرض فعال است.

    این روی جریان‌های `/config set|unset` اثر می‌گذارد (وقتی ویژگی‌های دستور فعال باشند).

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

  <Accordion title="پراکسی Gateway">
    ترافیک WebSocket مربوط به Gateway در Discord و جستجوهای REST هنگام راه‌اندازی (شناسه برنامه + حل فهرست مجاز) را با `channels.discord.proxy` از طریق یک پراکسی HTTP(S) مسیریابی کنید.

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
    حل PluralKit را فعال کنید تا پیام‌های پروکسی‌شده به هویت عضو سیستم نگاشت شوند:

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

    نکته‌ها:

    - فهرست‌های مجاز می‌توانند از `pk:<memberId>` استفاده کنند
    - نام‌های نمایشی عضو فقط وقتی با نام/slug تطبیق داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true`
    - جستجوها از شناسه پیام اصلی استفاده می‌کنند و محدود به بازه زمانی هستند
    - اگر جستجو ناموفق باشد، پیام‌های پروکسی‌شده به‌عنوان پیام بات در نظر گرفته می‌شوند و حذف می‌شوند مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="نام‌های مستعار منشن خروجی">
    وقتی عامل‌ها برای کاربران شناخته‌شده Discord به منشن‌های خروجی قطعی نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها handle بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربری Discord هستند. handleهای ناشناخته، `@everyone`، `@here`، و منشن‌های داخل code spanهای Markdown بدون تغییر می‌مانند.

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
    به‌روزرسانی‌های حضور وقتی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت تنظیم کنید، یا حضور خودکار را فعال کنید.

    مثال فقط وضعیت:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    مثال فعالیت (وضعیت سفارشی نوع فعالیت پیش‌فرض است):

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

    مثال پخش:

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
    - 1: در حال پخش (به `activityUrl` نیاز دارد)
    - 2: در حال گوش دادن
    - 3: در حال تماشا
    - 4: سفارشی (از متن فعالیت به‌عنوان حالت وضعیت استفاده می‌کند؛ ایموجی اختیاری است)
    - 5: در حال رقابت

    مثال حضور خودکار (سیگنال سلامت زمان اجرا):

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

    حضور خودکار دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => آنلاین، تنزل‌یافته یا ناشناخته => بیکار، تمام‌شده یا در دسترس نبودن => dnd. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از جای‌نگهدار `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="تأییدها در Discord">
    Discord از پردازش تأیید مبتنی بر دکمه در DMها پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری اعلان‌های تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` بازمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    Discord وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک تأییدکننده، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، قابل تشخیص باشد، تأییدهای اجرای بومی را به‌صورت خودکار فعال می‌کند. Discord تأییدکنندگان اجرا را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنتاج نمی‌کند. برای غیرفعال کردن صریح Discord به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط مخصوص مالک مانند `/diagnostics` و `/export-trajectory`، OpenClaw درخواست‌های تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. وقتی مالک فراخواننده مسیر مالک Discord داشته باشد، ابتدا Discord DM را امتحان می‌کند؛ اگر در دسترس نباشد، به نخستین مسیر مالک موجود از `commands.ownerAllowFrom`، مانند Telegram، بازمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، درخواست تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان تشخیص‌داده‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. درخواست‌های تأیید شامل متن فرمان هستند، بنابراین تحویل در کانال را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال را نتوان از کلید نشست استخراج کرد، OpenClaw به تحویل از طریق DM بازمی‌گردد.

    Discord دکمه‌های تأیید مشترکی را هم که کانال‌های گفت‌وگوی دیگر استفاده می‌کنند رندر می‌کند. آداپتر بومی Discord عمدتاً مسیریابی DM تأییدکننده و انتشار به کانال را اضافه می‌کند.
    وقتی این دکمه‌ها وجود داشته باشند، تجربه کاربری اصلی تأیید هستند؛ OpenClaw
    فقط زمانی باید فرمان دستی `/approve` را اضافه کند که نتیجه ابزار بگوید
    تأییدهای گفت‌وگو در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان‌اجرای تأیید بومی Discord فعال نباشد، OpenClaw درخواست
    محلی و قطعی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان‌اجرا فعال باشد اما کارت بومی به هیچ مقصدی قابل تحویل نباشد،
    OpenClaw یک اعلان جایگزین در همان گفت‌وگو با فرمان دقیق `/approve`
    از تأیید در انتظار ارسال می‌کند.

    احراز هویت Gateway و حل تأیید از قرارداد مشترک کلاینت Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌صورت پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای اجرا](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و دروازه‌های کنش

کنش‌های پیام Discord شامل کنش‌های پیام‌رسانی، مدیریت کانال، نظارت، حضور و فراداده هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- نظارت: `timeout`، `kick`، `ban`
- حضور: `setPresence`

کنش `event-create` یک پارامتر اختیاری `image` می‌پذیرد (URL یا مسیر فایل محلی) تا تصویر کاور رویداد زمان‌بندی‌شده را تنظیم کند.

دروازه‌های کنش زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض دروازه:

| گروه کنش                                                                                                                                                                 | پیش‌فرض   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | فعال     |
| roles                                                                                                                                                                    | غیرفعال |
| moderation                                                                                                                                                               | غیرفعال |
| presence                                                                                                                                                                 | غیرفعال |

## رابط کاربری Components v2

OpenClaw برای تأییدهای اجرا و نشانگرهای میان‌بافتی از components v2 در Discord استفاده می‌کند. کنش‌های پیام Discord همچنین می‌توانند برای رابط کاربری سفارشی `components` را بپذیرند (پیشرفته؛ نیازمند ساخت payload کامپوننت از طریق ابزار discord)، در حالی که `embeds` قدیمی همچنان در دسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تأکیدی استفاده‌شده توسط کانتینرهای کامپوننت Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- وقتی components v2 وجود داشته باشند، `embeds` نادیده گرفته می‌شوند.

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

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بلادرنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موجی). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

فهرست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی allowlistهای نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. بات را با scopeهای `bot` و `applications.commands` دعوت کنید.
4. در کانال صوتی هدف مجوزهای Connect، Speak، Send Messages و Read Message History را اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان قوانین allowlist و سیاست گروهی سایر فرمان‌های Discord را دنبال می‌کند.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

نمونه اتصال خودکار:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

نکته‌ها:

- `voice.tts` فقط برای پخش صوتی، `messages.tts` را override می‌کند.
- `voice.model` فقط LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را override می‌کند. برای ارث‌بری مدل عامل مسیریابی‌شده، آن را تنظیم‌نشده بگذارید.
- STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` بر رونویسی اثر نمی‌گذارد.
- overrideهای `systemPrompt` هر کانال Discord بر نوبت‌های رونوشت صوتی برای همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونوشت صوتی وضعیت مالک را از `allowFrom` مربوط به Discord (یا `dm.allowFrom`) استخراج می‌کنند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای فقط مخصوص مالک دسترسی داشته باشند (برای مثال `gateway` و `cron`).
- صوت Discord برای پیکربندی‌های فقط متنی اختیاری است؛ برای فعال کردن فرمان‌های `/vc`، زمان‌اجرای صوت، و intent مربوط به gateway با نام `GuildVoiceStates`، `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را صریحاً override کند. برای اینکه intent از فعال‌سازی مؤثر صوت پیروی کند، آن را تنظیم‌نشده بگذارید.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های join در `@discordjs/voice` منتقل می‌شوند.
- اگر تنظیم نشده باشند، پیش‌فرض‌های `@discordjs/voice` برابر `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای `/vc join` و تلاش‌های اتصال خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw پس از قطع یک نشست صوتی، پیش از نابود کردن آن، چه مدت برای شروع اتصال مجدد صبر کند. پیش‌فرض: `15000`.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را پایش می‌کند و پس از تکرار خطاها در یک بازه کوتاه، با ترک و ورود دوباره به کانال صوتی به‌صورت خودکار بازیابی می‌کند.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت به‌طور مکرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح padding بالادستی از PR #11449 در discord.js است که issue #11419 در discord.js را بست.

خط لوله کانال صوتی:

- ضبط PCM در Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` STT را مدیریت می‌کند، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونوشت از طریق ingress و مسیریابی Discord ارسال می‌شود، در حالی که LLM پاسخ با سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و متن برگشتی می‌خواهد، چون صوت Discord مالک پخش TTS نهایی است.
- وقتی `voice.model` تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی override می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ صوت حاصل در کانال متصل‌شده پخش می‌شود.

اعتبارنامه‌ها برای هر مؤلفه جداگانه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، و احراز هویت TTS برای `messages.tts`/`voice.tts`.

### پیام‌های صوتی

پیام‌های صوتی Discord یک پیش‌نمایش موجی نشان می‌دهند و به صوت OGG/Opus نیاز دارند. OpenClaw شکل موج را به‌صورت خودکار تولید می‌کند، اما برای بازرسی و تبدیل روی میزبان gateway به `ffmpeg` و `ffprobe` نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در همان payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="استفاده از intentهای مجازنبود‌ه یا اینکه بات هیچ پیام guild را نمی‌بیند">

    - Message Content Intent را فعال کنید
    - وقتی به حل کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، gateway را راه‌اندازی مجدد کنید

  </Accordion>

  <Accordion title="پیام‌های guild به‌طور غیرمنتظره مسدود شده‌اند">

    - `groupPolicy` را بررسی کنید
    - allowlist مربوط به guild را زیر `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` مربوط به guild وجود دارد، فقط کانال‌های فهرست‌شده مجاز هستند
    - رفتار `requireMention` و الگوهای اشاره را بررسی کنید

    بررسی‌های مفید:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false است اما همچنان مسدود می‌شود">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون allowlist منطبق برای guild/کانال
    - `requireMention` در جای اشتباه پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی کانال باشد)
    - فرستنده توسط allowlist مربوط به `users` در guild/کانال مسدود شده است

  </Accordion>

  <Accordion title="نوبت‌های طولانی Discord یا پاسخ‌های تکراری">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    تنظیمات صف gateway مربوط به Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener مربوط به gateway در Discord را کنترل می‌کند، نه طول عمر نوبت عامل

    Discord timeout مالک کانال را روی نوبت‌های عامل در صف اعمال نمی‌کند. listenerهای پیام فوراً واگذار می‌کنند، و اجراهای Discord در صف، ترتیب هر نشست را تا زمانی که چرخه‌عمر نشست/ابزار/زمان‌اجرا کامل شود یا کار را abort کند، حفظ می‌کنند.

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

  <Accordion title="هشدارهای timeout در جست‌وجوی فراداده Gateway">
    OpenClaw پیش از اتصال، فراداده `/gateway/bot` در Discord را واکشی می‌کند. خرابی‌های گذرا به URL پیش‌فرض Gateway در Discord بازمی‌گردند و در لاگ‌ها rate-limit می‌شوند.

    تنظیمات timeout فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - جایگزین env وقتی config تنظیم نشده باشد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="راه‌اندازی‌های مجدد به‌دلیل پایان مهلت READY در Gateway">
    OpenClaw هنگام راه‌اندازی و پس از اتصال‌های مجدد در زمان اجرا، منتظر رویداد `READY` در Gateway مربوط به Discord می‌ماند. پیکربندی‌های چندحسابی با راه‌اندازی مرحله‌ای ممکن است به بازه READY طولانی‌تری نسبت به مقدار پیش‌فرض نیاز داشته باشند.

    تنظیمات پایان مهلت READY:

    - تک‌حسابی هنگام راه‌اندازی: `channels.discord.gatewayReadyTimeoutMs`
    - چندحسابی هنگام راه‌اندازی: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - جایگزین محیطی هنگام راه‌اندازی وقتی پیکربندی تنظیم نشده است: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - مقدار پیش‌فرض هنگام راه‌اندازی: `15000` (۱۵ ثانیه)، حداکثر: `120000`
    - تک‌حسابی در زمان اجرا: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - چندحسابی در زمان اجرا: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - جایگزین محیطی در زمان اجرا وقتی پیکربندی تنظیم نشده است: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - مقدار پیش‌فرض در زمان اجرا: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="ناهماهنگی‌های بازرسی مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق در زمان اجرا همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را به‌طور کامل تأیید کند.

  </Accordion>

  <Accordion title="مشکلات DM و جفت‌سازی">

    - DM غیرفعال است: `channels.discord.dm.enabled=false`
    - خط‌مشی DM غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در انتظار تأیید جفت‌سازی در حالت `pairing`

  </Accordion>

  <Accordion title="حلقه‌های بات به بات">
    به‌طور پیش‌فرض پیام‌های نوشته‌شده توسط بات نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قوانین سخت‌گیرانه mention و allowlist استفاده کنید.
    بهتر است از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های بات‌هایی پذیرفته شوند که بات را mention می‌کنند.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="حذف شدن Voice STT با DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صدای Discord موجود باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض upstream) شروع کنید و فقط در صورت نیاز تنظیمش کنید
    - لاگ‌ها را برای موارد زیر بررسی کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر خطاها پس از پیوستن مجدد خودکار ادامه داشتند، لاگ‌ها را جمع‌آوری کنید و با سابقه دریافت upstream DAVE در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای مهم Discord">

- راه‌اندازی/احراز هویت: `enabled`, `token`, `accounts.*`, `allowBots`
- خط‌مشی: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- فرمان: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجه listener)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- پخش جریانی: `streaming` (نام مستعار قدیمی: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش مجدد: `mediaMaxMb` (بارگذاری‌های خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`), `retry`
- کنش‌ها: `actions.*`
- حضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- قابلیت‌ها: `threadBindings`, سطح بالای `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- توکن‌های بات را به‌عنوان راز در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های نظارت‌شده ترجیح داده می‌شود).
- حداقل مجوزهای لازم Discord را اعطا کنید.
- اگر deploy/state فرمان قدیمی است، Gateway را دوباره راه‌اندازی کنید و با `openclaw channels status --probe` دوباره بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را با Gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار گفت‌وگوی گروهی و allowlist.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="مسیریابی چندعاملی" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و کانال‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="فرمان‌های Slash" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی.
  </Card>
</CardGroup>
