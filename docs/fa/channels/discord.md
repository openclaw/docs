---
read_when:
    - کار روی قابلیت‌های کانال Discord
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی بات Discord
title: Discord
x-i18n:
    generated_at: "2026-05-03T21:27:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a38cb3c8e25c1f3d6b7ddfc35a0445dc264be74d74b08d0051528b462b743a3
    source_path: channels/discord.md
    workflow: 16
---

آماده برای پیام‌های مستقیم و کانال‌های گیلد از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Discord به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار بومی دستورها و فهرست دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های میان‌کانالی و روند ترمیم.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید با یک ربات بسازید، ربات را به سرور خود اضافه کنید، و آن را با OpenClaw جفت کنید. توصیه می‌کنیم ربات خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز سرور ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="ایجاد برنامه و ربات Discord">
    به [پرتال توسعه‌دهندگان Discord](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را روی هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="فعال‌سازی اینتنت‌های ممتاز">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **اینتنت محتوای پیام** (الزامی)
    - **اینتنت اعضای سرور** (توصیه‌شده؛ برای فهرست‌های مجاز نقش و تطبیق نام با شناسه الزامی است)
    - **اینتنت حضور** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="کپی کردن توکن ربات">
    در صفحه **Bot** دوباره به بالا برگردید و روی **Reset Token** کلیک کنید.

    <Note>
    برخلاف نام آن، این کار اولین توکن شما را تولید می‌کند — چیزی واقعاً «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی کنید و جایی ذخیره کنید. این **توکن ربات** شماست و به‌زودی به آن نیاز خواهید داشت.

  </Step>

  <Step title="تولید URL دعوت و افزودن ربات به سرور">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست تولید می‌کنید تا ربات را به سرور خود اضافه کنید.

    به پایین تا **سازنده URL OAuth2** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    یک بخش **مجوزهای ربات** در پایین ظاهر می‌شود. دست‌کم این موارد را فعال کنید:

    **مجوزهای عمومی**
      - مشاهده کانال‌ها
    **مجوزهای متن**
      - ارسال پیام‌ها
      - خواندن تاریخچه پیام
      - جاسازی پیوندها
      - پیوست کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعه پایه برای کانال‌های متنی معمولی است. اگر قصد دارید در رشته‌های Discord پست بگذارید، از جمله جریان‌های کاری کانال‌های انجمن یا رسانه که رشته‌ای ایجاد یا ادامه می‌دهند، **ارسال پیام در رشته‌ها** را هم فعال کنید.
    URL تولیدشده در پایین را کپی کنید، آن را در مرورگر خود جای‌گذاری کنید، سرور خود را انتخاب کنید، و برای اتصال روی **Continue** کلیک کنید. اکنون باید ربات خود را در سرور Discord ببینید.

  </Step>

  <Step title="فعال‌سازی حالت توسعه‌دهنده و جمع‌آوری شناسه‌ها">
    در برنامه Discord، باید حالت توسعه‌دهنده را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **تنظیمات کاربر** (آیکون چرخ‌دنده کنار آواتار شما) کلیک کنید → **پیشرفته** → **حالت توسعه‌دهنده** را فعال کنید
    2. روی **آیکون سرور** خود در نوار کناری راست‌کلیک کنید → **کپی شناسه سرور**
    3. روی **آواتار خودتان** راست‌کلیک کنید → **کپی شناسه کاربر**

    **شناسه سرور** و **شناسه کاربر** خود را کنار توکن ربات ذخیره کنید — در گام بعد هر سه را به OpenClaw ارسال خواهید کرد.

  </Step>

  <Step title="اجازه دادن به پیام‌های مستقیم از اعضای سرور">
    برای اینکه جفت‌سازی کار کند، Discord باید به ربات شما اجازه دهد به شما پیام مستقیم بدهد. روی **آیکون سرور** خود راست‌کلیک کنید → **تنظیمات حریم خصوصی** → **پیام‌های مستقیم** را فعال کنید.

    این به اعضای سرور (از جمله ربات‌ها) اجازه می‌دهد به شما پیام مستقیم بفرستند. اگر می‌خواهید از پیام‌های مستقیم Discord با OpenClaw استفاده کنید، این گزینه را فعال نگه دارید. اگر فقط قصد دارید از کانال‌های گیلد استفاده کنید، می‌توانید پس از جفت‌سازی پیام‌های مستقیم را غیرفعال کنید.

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

    اگر OpenClaw از قبل به‌عنوان سرویس پس‌زمینه در حال اجراست، آن را از طریق برنامه Mac مربوط به OpenClaw یا با متوقف کردن و راه‌اندازی دوباره فرایند `openclaw gateway run` بازراه‌اندازی کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از شلی اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس پس از بازراه‌اندازی بتواند SecretRef محیط را حل کند.
    اگر میزبان شما توسط جست‌وجوی برنامه هنگام شروع Discord مسدود یا محدودیت‌نرخ شده است، شناسه برنامه/کلاینت Discord را از پرتال توسعه‌دهندگان تنظیم کنید تا راه‌اندازی بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند ربات Discord را اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="پیکربندی OpenClaw و جفت‌سازی">

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        در هر کانال موجود (مثلاً Telegram) با عامل OpenClaw خود چت کنید و به آن بگویید. اگر Discord اولین کانال شماست، به‌جای آن از زبانه CLI / پیکربندی استفاده کنید.

        > «من از قبل توکن ربات Discord خود را در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با شناسه کاربر `<user_id>` و شناسه سرور `<server_id>` کامل کنید.»
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

        گزینه پشتیبان محیط برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپت‌شده یا راه‌دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس بدون `--dry-run` دوباره اجرا کنید. مقادیر متن ساده `token` پشتیبانی می‌شوند. مقادیر SecretRef نیز برای `channels.discord.token` در ارائه‌دهندگان env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند ربات Discord، توکن ربات و شناسه برنامه هر ربات را زیر حساب خودش نگه دارید. یک `channels.discord.applicationId` سطح بالا توسط حساب‌ها به ارث برده می‌شود، بنابراین آن را فقط زمانی آنجا تنظیم کنید که همه حساب‌ها باید از همان شناسه برنامه استفاده کنند.

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
        کد جفت‌سازی را در کانال موجود خود برای عاملتان بفرستید:

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

    اکنون باید بتوانید در Discord از طریق پیام مستقیم با عامل خود چت کنید.

  </Step>
</Steps>

<Note>
حل توکن نسبت به حساب آگاه است. مقادیر توکن در پیکربندی بر گزینه پشتیبان محیط اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به همان توکن ربات حل شوند، OpenClaw فقط یک پایشگر Gateway برای آن توکن شروع می‌کند. توکنی که از پیکربندی آمده است بر گزینه پشتیبان محیط پیش‌فرض اولویت دارد؛ در غیر این صورت اولین حساب فعال برنده می‌شود و حساب تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار پیام/اقدام‌های کانال)، یک `token` صریح برای هر فراخوانی استفاده می‌شود. این برای اقدام‌های ارسال و سبک خواندن/کاوش اعمال می‌شود (برای مثال خواندن/جست‌وجو/واکشی/رشته/پین‌ها/مجوزها). تنظیمات سیاست حساب/تلاش دوباره همچنان از حساب انتخاب‌شده در اسنپ‌شات فعال زمان اجرا می‌آیند.
</Note>

## توصیه‌شده: راه‌اندازی فضای کاری گیلد

وقتی پیام‌های مستقیم کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال نشست عامل خودش را با زمینه خودش دارد. این برای سرورهای خصوصی که فقط شما و رباتتان در آن هستید توصیه می‌شود.

<Steps>
  <Step title="افزودن سرور به فهرست مجاز گیلد">
    این به عامل شما اجازه می‌دهد در هر کانالی روی سرورتان پاسخ دهد، نه فقط پیام‌های مستقیم.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «شناسه سرور Discord من `<server_id>` را به فهرست مجاز گیلد اضافه کن»
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

  <Step title="اجازه دادن به پاسخ‌ها بدون اشاره با @">
    به‌طور پیش‌فرض، عامل شما فقط وقتی در کانال‌های گیلد پاسخ می‌دهد که با @ به آن اشاره شود. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های گیلد، پاسخ‌های نهایی معمول دستیار به‌طور پیش‌فرض خصوصی می‌مانند. خروجی قابل مشاهده Discord باید صراحتاً با ابزار `message` ارسال شود، بنابراین عامل می‌تواند به‌طور پیش‌فرض در حالت مشاهده باقی بماند و فقط وقتی تصمیم می‌گیرد پاسخ کانالی مفید است پست بگذارد.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «به عامل من اجازه بده روی این سرور بدون نیاز به اشاره با @ پاسخ دهد»
      </Tab>
      <Tab title="پیکربندی">
        `requireMention: false` را در پیکربندی گیلد خود تنظیم کنید:

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

  <Step title="برنامه‌ریزی برای حافظه در کانال‌های گیلد">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در نشست‌های پیام مستقیم بارگذاری می‌شود. کانال‌های گیلد MEMORY.md را به‌صورت خودکار بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر به زمینه بلندمدت از MEMORY.md نیاز داری از memory_search یا memory_get استفاده کن.»
      </Tab>
      <Tab title="دستی">
        اگر در هر کانال به زمینه مشترک نیاز دارید، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` قرار دهید (برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و در صورت نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال روی سرور Discord خود بسازید و شروع به چت کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال نشست ایزوله خودش را دارد — بنابراین می‌توانید `#coding`، `#home`، `#research` یا هر چیزی که با گردش‌کار شما جور است راه‌اندازی کنید.

## مدل زمان اجرا

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord به Discord برمی‌گردند.
- فرادادهٔ guild/channel در Discord به‌عنوان زمینهٔ غیرقابل‌اعتماد به پرامپت مدل افزوده می‌شود،
  نه به‌عنوان پیشوند پاسخ قابل‌مشاهده برای کاربر. اگر مدلی آن پوشش را
  برگرداند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از
  زمینهٔ بازپخش آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، چت‌های مستقیم نشست اصلی عامل را به اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های Guild کلیدهای نشست جداگانه هستند (`agent:<agentId>:discord:channel:<channelId>`).
- Group DMها به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های slash بومی در نشست‌های فرمان جداگانه اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، در حالی که همچنان `CommandTargetSessionKey` را به نشست گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان‌های متنی cron/heartbeat به Discord، پاسخ نهایی
  قابل‌مشاهده برای دستیار را یک‌بار استفاده می‌کند. رسانه‌ها و payloadهای مؤلفهٔ ساختاریافته
  وقتی عامل چند payload قابل‌تحویل منتشر کند همچنان چندپیامی می‌مانند.

## کانال‌های فروم

کانال‌های فروم و رسانهٔ Discord فقط پست‌های thread را می‌پذیرند. OpenClaw از دو راه برای ایجاد آن‌ها پشتیبانی می‌کند:

- پیامی به والد فروم (`channel:<forumId>`) بفرستید تا یک thread به‌صورت خودکار ایجاد شود. عنوان thread از اولین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ایجاد مستقیم thread استفاده کنید. برای کانال‌های فروم `--message-id` را ارسال نکنید.

مثال: ارسال به والد فروم برای ایجاد thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: ایجاد صریح thread فروم

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای فروم مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود thread ارسال کنید (`channel:<threadId>`).

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای مؤلفهٔ Discord v2 برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با payloadِ `components` استفاده کنید. نتایج تعامل به‌عنوان پیام‌های ورودی عادی به عامل مسیریابی می‌شوند و از تنظیمات موجود `replyToMode` در Discord پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- ردیف‌های کنش تا ۵ دکمه یا یک منوی انتخاب تکی را مجاز می‌دانند
- انواع انتخاب: `string`, `user`, `role`, `mentionable`, `channel`

به‌طور پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌گرها و فرم‌ها تا زمان انقضا چندین بار قابل‌استفاده باشند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی دکمه کلیک کند، `allowedUsers` را روی آن دکمه تنظیم کنید (شناسه‌های کاربر Discord، تگ‌ها، یا `*`). وقتی پیکربندی شود، کاربران نامنطبق یک رد موقتی دریافت می‌کنند.

فرمان‌های slashِ `/model` و `/models` یک انتخاب‌گر مدل تعاملی با فهرست‌های کشویی provider، مدل، و runtime سازگار، به‌همراه مرحلهٔ Submit باز می‌کنند. `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از چت، پیام منسوخ‌شدن برمی‌گرداند. پاسخ انتخاب‌گر موقتی است و فقط کاربری که آن را فراخوانده می‌تواند از آن استفاده کند.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (فایل تکی)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با مرجع پیوست مطابقت داشته باشد، برای بازنویسی نام بارگذاری از `filename` استفاده کنید

فرم‌های modal:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- انواع فیلد: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw به‌صورت خودکار یک دکمهٔ trigger اضافه می‌کند

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
    `channels.discord.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.discord.allowFrom` فهرست مجاز canonical برای DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست DM باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` برای pairing راهنمایی می‌شوند).

    اولویت چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی اولویت دارد.
    - حساب‌های نام‌گذاری‌شده وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌گذاری‌شده `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب هدف DM برای تحویل:

    - `user:<id>`
    - mention به‌شکل `<@id>`

    شناسه‌های عددی خام معمولاً وقتی یک پیش‌فرض کانال فعال باشد به‌عنوان شناسهٔ کانال resolve می‌شوند، اما شناسه‌های فهرست‌شده در `allowFrom` مؤثر DM حساب، برای سازگاری به‌عنوان اهداف user DM در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="DM access groups">
    DMهای Discord می‌توانند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کنند.

    نام‌های گروه دسترسی میان کانال‌های پیام مشترک هستند. برای یک گروه ایستا که اعضای آن در سینتکس عادی `allowFrom` هر کانال بیان می‌شوند، از `type: "message.senders"` استفاده کنید، یا وقتی مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کنند، از `type: "discord.channelAudience"` استفاده کنید. رفتار گروه دسترسی مشترک اینجا مستند شده است: [گروه‌های دسترسی](/fa/channels/access-groups).

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

    یک کانال متنی Discord فهرست اعضای جداگانه ندارد. `type: "discord.channelAudience"` عضویت را این‌گونه مدل می‌کند: فرستندهٔ DM عضو guild پیکربندی‌شده است و در حال حاضر پس از اعمال roleها و بازنویسی‌های کانال، مجوز مؤثر `ViewChannel` را روی کانال پیکربندی‌شده دارد.

    مثال: به هر کسی که می‌تواند `#maintainers` را ببیند اجازه دهید به ربات DM بدهد، در حالی که DMها برای همهٔ افراد دیگر بسته می‌مانند.

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

    جست‌وجوها در حالت شکست بسته می‌شوند. اگر Discord خطای `Missing Access` برگرداند، جست‌وجوی عضو شکست بخورد، یا کانال متعلق به guild دیگری باشد، فرستندهٔ DM غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر مخاطبان کانال، **Server Members Intent** را برای ربات در Discord Developer Portal فعال کنید. DMها وضعیت عضو guild را شامل نمی‌شوند، بنابراین OpenClaw عضو را هنگام authorization از طریق Discord REST resolve می‌کند.

  </Tab>

  <Tab title="Guild policy">
    مدیریت Guild با `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    baseline امن وقتی `channels.discord` وجود دارد `allowlist` است.

    رفتار `allowlist`:

    - guild باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های role)؛ اگر هرکدام پیکربندی شده باشد، فرستنده‌ها وقتی با `users` یا `roles` مطابقت داشته باشند مجاز هستند
    - تطبیق مستقیم نام/تگ به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری break-glass فعال کنید
    - نام‌ها/تگ‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌تر هستند؛ `openclaw security audit` هنگام استفاده از ورودی‌های نام/تگ هشدار می‌دهد
    - اگر یک guild دارای `channels` پیکربندی‌شده باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک guild بلوک `channels` نداشته باشد، همهٔ کانال‌های آن guild در فهرست مجاز، مجاز هستند

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` ایجاد نکنید، fallback زمان اجرا `groupPolicy="allowlist"` خواهد بود (با هشداری در لاگ‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="Mentions and group DMs">
    پیام‌های Guild به‌طور پیش‌فرض با mention کنترل می‌شوند.

    تشخیص mention شامل موارد زیر است:

    - mention صریح ربات
    - الگوهای mention پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallbackِ `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی reply-to-bot در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از سینتکس canonical mention استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای roleها. از فرم mention قدیمی nickname یعنی `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر guild/channel پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که کاربر/role دیگری را mention می‌کنند اما ربات را mention نمی‌کنند، حذف می‌کند (به‌جز @everyone/@here).

    Group DMها:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌های کانال یا slugها)

  </Tab>
</Tabs>

### مسیریابی عامل مبتنی بر role

از `bindings[].match.roles` برای مسیریابی اعضای guild در Discord به عامل‌های مختلف بر اساس شناسهٔ role استفاده کنید. bindingهای مبتنی بر role فقط شناسه‌های role را می‌پذیرند و پس از bindingهای peer یا parent-peer و پیش از bindingهای فقط-guild ارزیابی می‌شوند. اگر یک binding فیلدهای match دیگری هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ فیلدهای پیکربندی‌شده باید مطابقت داشته باشند.

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

- `commands.native` به‌طور پیش‌فرض `"auto"` است و برای Discord فعال است.
- بازنویسی برای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` ثبت فرمان‌های اسلش Discord و پاک‌سازی آن‌ها هنگام راه‌اندازی را رد می‌کند. فرمان‌هایی که قبلا ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف کنید، همچنان در Discord قابل مشاهده بمانند.
- احراز هویت فرمان بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که پردازش معمول پیام استفاده می‌کند.
- فرمان‌ها ممکن است همچنان در رابط کاربری Discord برای کاربرانی که مجاز نیستند قابل مشاهده باشند؛ اجرا همچنان احراز هویت OpenClaw را اعمال می‌کند و «مجاز نیست» برمی‌گرداند.

برای فهرست فرمان‌ها و رفتار آن‌ها، [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

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

    نکته: `off` رشته‌سازی ضمنی پاسخ را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه ارجاع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای آن نوبت متصل می‌کند.
    `batched` فقط زمانی ارجاع پاسخ بومی ضمنی Discord را متصل می‌کند که
    نوبت ورودی یک دسته تاخیردار از چند پیام بوده باشد. این زمانی مفید است
    که می‌خواهید پاسخ‌های بومی عمدتا برای گفت‌وگوهای پرشتاب و مبهم باشند، نه برای هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در زمینه/تاریخچه ارائه می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="پیش‌نمایش جریان زنده">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هنگام رسیدن متن، پاسخ‌های پیش‌نویس را به‌صورت جریانی ارسال کند. `channels.discord.streaming` مقدار `off` (پیش‌فرض) | `partial` | `block` | `progress` را می‌گیرد. `progress` یک پیش‌نویس وضعیت قابل ویرایش را نگه می‌دارد و آن را با پیشرفت ابزار تا تحویل نهایی به‌روزرسانی می‌کند؛ `streamMode` یک نام مستعار قدیمی است و به‌صورت خودکار مهاجرت داده می‌شود.

    مقدار پیش‌فرض `off` باقی می‌ماند، چون ویرایش‌های پیش‌نمایش Discord وقتی چند ربات یا Gateway یک حساب را به اشتراک می‌گذارند، خیلی سریع به محدودیت نرخ برخورد می‌کنند.

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

    - `partial` با رسیدن توکن‌ها، یک پیام پیش‌نمایش واحد را ویرایش می‌کند.
    - `block` قطعه‌هایی در اندازه پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، با محدودسازی به `textChunkLimit`).
    - نهایی‌های رسانه‌ای، خطا و پاسخ صریح، ویرایش‌های در انتظار پیش‌نمایش را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.

    جریان پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل معمولی بازمی‌گردند. وقتی جریان `block` صراحتا فعال شده باشد، OpenClaw برای جلوگیری از جریان‌دهی دوبل، جریان پیش‌نمایش را رد می‌کند.

  </Accordion>

  <Accordion title="تاریخچه، زمینه و رفتار رشته">
    زمینه تاریخچه Guild:

    - پیش‌فرض `channels.discord.historyLimit` برابر `20`
    - جایگزین: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچه DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار رشته:

    - رشته‌های Discord به‌صورت نشست‌های کانال مسیریابی می‌شوند و پیکربندی کانال والد را به ارث می‌برند مگر اینکه بازنویسی شده باشد.
    - نشست‌های رشته، انتخاب `/model` در سطح نشست کانال والد را فقط به‌عنوان جایگزین مدل به ارث می‌برند؛ انتخاب‌های `/model` محلی رشته همچنان اولویت دارند و تاریخچه رونوشت والد کپی نمی‌شود مگر اینکه وراثت رونوشت فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) رشته‌های خودکار جدید را برای مقداردهی اولیه از رونوشت والد فعال می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند مقصدهای DM از نوع `user:<id>` را حل کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام جایگزین فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوعات کانال به‌عنوان زمینه **غیرقابل اعتماد** تزریق می‌شوند. فهرست‌های مجاز کنترل می‌کنند چه کسی می‌تواند عامل را تحریک کند، نه اینکه مرز کامل پالایش زمینه تکمیلی باشند.

  </Accordion>

  <Accordion title="نشست‌های مقید به رشته برای زیرعامل‌ها">
    Discord می‌تواند یک رشته را به یک مقصد نشست مقید کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست (از جمله نشست‌های زیرعامل) مسیریابی شوند.

    فرمان‌ها:

    - `/focus <target>` رشته فعلی/جدید را به مقصد یک زیرعامل/نشست مقید می‌کند
    - `/unfocus` قید رشته فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت قید را نشان می‌دهد
    - `/session idle <duration|off>` عدم تمرکز خودکار پس از عدم فعالیت را برای قیدهای متمرکز بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر عمر سخت را برای قیدهای متمرکز بررسی/به‌روزرسانی می‌کند

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
    - `spawnSessions` ایجاد/قید خودکار رشته‌ها را برای `sessions_spawn({ thread: true })` و ایجاد رشته ACP کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` زمینه بومی زیرعامل را برای ایجادهای مقید به رشته کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` با `openclaw doctor --fix` مهاجرت داده می‌شوند.
    - اگر قیدهای رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط با قید رشته در دسترس نیستند.

    [زیرعامل‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="قیدهای پایدار کانال ACP">
    برای فضاهای کاری ACP پایدار و «همیشه روشن»، قیدهای ACP نوع‌دار سطح بالا را که مکالمات Discord را هدف می‌گیرند پیکربندی کنید.

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

    - `/acp spawn codex --bind here` کانال یا رشته فعلی را در همان‌جا مقید می‌کند و پیام‌های آینده را در همان نشست ACP نگه می‌دارد. پیام‌های رشته، قید کانال والد را به ارث می‌برند.
    - در یک کانال یا رشته مقید، `/new` و `/reset` همان نشست ACP را در همان‌جا بازنشانی می‌کنند. قیدهای موقت رشته می‌توانند تا زمانی که فعال هستند حل مقصد را بازنویسی کنند.
    - `spawnSessions` ایجاد/قید رشته فرزند را از طریق `--thread auto|here` کنترل می‌کند.

    برای جزئیات رفتار قید، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش برای هر Guild:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستمی تبدیل می‌شوند و به نشست Discord مسیریابی‌شده پیوست می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تایید دریافت">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw یک ایموجی تایید دریافت ارسال می‌کند.

    ترتیب حل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Discord ایموجی یونیکد یا نام‌های ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن‌های پیکربندی">
    نوشتن‌های پیکربندی آغازشده از کانال به‌طور پیش‌فرض فعال هستند.

    این روی جریان‌های `/config set|unset` اثر می‌گذارد (وقتی قابلیت‌های فرمان فعال باشند).

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

  <Accordion title="پراکسی Gateway">
    ترافیک WebSocket در Gateway مربوط به Discord و جست‌وجوهای REST هنگام راه‌اندازی (شناسه برنامه + حل فهرست مجاز) را با `channels.discord.proxy` از طریق یک پراکسی HTTP(S) مسیریابی کنید.

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
    حل PluralKit را فعال کنید تا پیام‌های پراکسی‌شده به هویت عضو سیستم نگاشت شوند:

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
    - نام‌های نمایشی عضو فقط زمانی با نام/slug تطبیق داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true`
    - جست‌وجوها از شناسه پیام اصلی استفاده می‌کنند و به بازه زمانی محدود هستند
    - اگر جست‌وجو شکست بخورد، پیام‌های پراکسی‌شده به‌عنوان پیام‌های ربات در نظر گرفته می‌شوند و حذف می‌شوند، مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="نام‌های مستعار منشن خروجی">
    وقتی عامل‌ها برای کاربران شناخته‌شده Discord به منشن‌های خروجی قطعی نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها هندل‌هایی بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربر Discord هستند. هندل‌های ناشناخته، `@everyone`، `@here` و منشن‌های داخل code spanهای Markdown بدون تغییر باقی می‌مانند.

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
    به‌روزرسانی‌های حضور زمانی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت را تنظیم کنید، یا وقتی حضور خودکار را فعال کنید.

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

    مثال جریان:

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
    - 1: در حال پخش جریانی (به `activityUrl` نیاز دارد)
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

    حضور خودکار، دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => آنلاین، کاهش‌یافته یا ناشناخته => بیکار، تمام‌شده یا در دسترس نبودن => مزاحم نشوید. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از placeholder `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="تاییدیه‌ها در Discord">
    Discord از پردازش تاییدیه مبتنی بر دکمه در DMها پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری درخواست‌های تایید را در کانال مبدا ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک تأییدکننده قابل تشخیص باشد، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، Discord تأییدهای اجرای بومی را به‌صورت خودکار فعال می‌کند. Discord تأییدکنندگان اجرا را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنباط نمی‌کند. برای غیرفعال‌کردن صریح Discord به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط ویژه مالک مانند `/diagnostics` و `/export-trajectory`، OpenClaw درخواست‌های تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. ابتدا وقتی مالک فراخواننده مسیر مالک Discord داشته باشد، DM در Discord را امتحان می‌کند؛ اگر در دسترس نباشد، به نخستین مسیر مالک موجود از `commands.ownerAllowFrom`، مانند Telegram، برمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، درخواست تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان تشخیص‌داده‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. درخواست‌های تأیید شامل متن فرمان هستند، بنابراین تحویل کانالی را فقط در کانال‌های مورداعتماد فعال کنید. اگر شناسه کانال از کلید نشست قابل استخراج نباشد، OpenClaw به تحویل DM برمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترکی را که کانال‌های گفت‌وگوی دیگر استفاده می‌کنند نمایش می‌دهد. آداپتور بومی Discord عمدتاً مسیریابی DM تأییدکننده و انتشار کانالی را اضافه می‌کند.
    وقتی این دکمه‌ها وجود داشته باشند، UX اصلی تأیید هستند؛ OpenClaw
    فقط زمانی باید فرمان دستی `/approve` را اضافه کند که نتیجه ابزار بگوید
    تأییدهای گفت‌وگو در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر runtime تأیید بومی Discord فعال نباشد، OpenClaw درخواست
    قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    runtime فعال باشد اما کارت بومی به هیچ هدفی قابل تحویل نباشد،
    OpenClaw یک اعلان جایگزین در همان گفت‌وگو با فرمان دقیق `/approve`
    از تأیید در انتظار ارسال می‌کند.

    احراز هویت Gateway و حل تأیید از قرارداد مشترک کلاینت Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای اجرا](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و دروازه‌های اقدام

اقدام‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، تعدیل، حضور و اقدام‌های فراداده هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- تعدیل: `timeout`، `kick`، `ban`
- حضور: `setPresence`

اقدام `event-create` یک پارامتر اختیاری `image` (URL یا مسیر فایل محلی) می‌پذیرد تا تصویر جلد رویداد زمان‌بندی‌شده را تنظیم کند.

دروازه‌های اقدام زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض دروازه:

| گروه اقدام                                                                                                                                                              | پیش‌فرض  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | فعال     |
| roles                                                                                                                                                                    | غیرفعال |
| moderation                                                                                                                                                               | غیرفعال |
| presence                                                                                                                                                                 | غیرفعال |

## UI کامپوننت‌های v2

OpenClaw برای تأییدهای اجرا و نشانگرهای میان‌بافتی از کامپوننت‌های v2 در Discord استفاده می‌کند. اقدام‌های پیام Discord همچنین می‌توانند برای UI سفارشی `components` بپذیرند (پیشرفته؛ نیازمند ساخت payload کامپوننت از طریق ابزار discord)، در حالی که `embeds` قدیمی همچنان در دسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تأکیدی استفاده‌شده توسط ظرف‌های کامپوننت Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- وقتی کامپوننت‌های v2 وجود داشته باشند، `embeds` نادیده گرفته می‌شوند.

مثال:

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

Discord دو سطح صدای متمایز دارد: **کانال‌های صوتی** بی‌درنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش شکل موج). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

چک‌لیست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی از فهرست‌های مجاز نقش/کاربر استفاده می‌شود، Server Members Intent را فعال کنید.
3. ربات را با scopeهای `bot` و `applications.commands` دعوت کنید.
4. در کانال صوتی هدف، Connect، Speak، Send Messages و Read Message History را اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و همان قواعد فهرست مجاز و سیاست گروهی سایر فرمان‌های Discord را دنبال می‌کند.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

مثال پیوستن خودکار:

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

- `voice.tts` فقط برای پخش صوتی، `messages.tts` را بازنویسی می‌کند.
- `voice.model` فقط LLM استفاده‌شده برای پاسخ‌های کانال صوتی Discord را بازنویسی می‌کند. برای به‌ارث‌بردن مدل عامل مسیریابی‌شده، آن را تنظیم‌نشده بگذارید.
- STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` روی رونویسی اثر نمی‌گذارد.
- بازنویسی‌های `systemPrompt` مختص هر کانال Discord برای نوبت‌های رونوشت صوتی همان کانال صوتی اعمال می‌شوند.
- نوبت‌های رونوشت صوتی وضعیت مالک را از `allowFrom` در Discord (یا `dm.allowFrom`) استخراج می‌کنند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای فقط ویژه مالک (برای مثال `gateway` و `cron`) دسترسی داشته باشند.
- صدای Discord برای پیکربندی‌های فقط متنی اختیاری است؛ برای فعال‌کردن فرمان‌های `/vc`، runtime صدا و intent Gateway به نام `GuildVoiceStates`، `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را صریحاً بازنویسی کند. برای اینکه intent از فعال‌سازی مؤثر صدا پیروی کند، آن را تنظیم‌نشده بگذارید.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های join در `@discordjs/voice` منتقل می‌شوند.
- پیش‌فرض‌های `@discordjs/voice` در صورت تنظیم‌نبودن، `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و پیوستن خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw چه مدت منتظر می‌ماند تا یک نشست صوتی قطع‌شده پیش از نابودشدن، شروع به اتصال مجدد کند. پیش‌فرض: `15000`.
- OpenClaw همچنین خطاهای decrypt دریافت را پایش می‌کند و پس از خطاهای تکراری در یک بازه کوتاه، با خروج از کانال صوتی و پیوستن دوباره به آن، به‌صورت خودکار بازیابی می‌کند.
- اگر پس از به‌روزرسانی، گزارش‌های دریافت به‌طور مکرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و گزارش‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح padding بالادستی از PR #11449 در discord.js است که issue #11419 در discord.js را بست.

خط لوله کانال صوتی:

- ضبط PCM در Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` کار STT را انجام می‌دهد، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونوشت از طریق ورود و مسیریابی Discord ارسال می‌شود، در حالی که LLM پاسخ با سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و متن بازگردانده‌شده را درخواست می‌کند، زیرا صدای Discord مالک پخش نهایی TTS است.
- `voice.model`، وقتی تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ صدای حاصل در کانال پیوسته پخش می‌شود.

اعتبارنامه‌ها برای هر کامپوننت جداگانه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، و احراز هویت TTS برای `messages.tts`/`voice.tts`.

### پیام‌های صوتی

پیام‌های صوتی Discord یک پیش‌نمایش شکل موج نشان می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw شکل موج را به‌صورت خودکار تولید می‌کند، اما برای بازرسی و تبدیل، به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در همان payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="از intentهای غیرمجاز استفاده شده یا ربات هیچ پیام guildی نمی‌بیند">

    - Message Content Intent را فعال کنید
    - وقتی به حل کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، Gateway را راه‌اندازی مجدد کنید

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

  <Accordion title="Require mention false است اما همچنان مسدود می‌شود">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون فهرست مجاز guild/channel مطابق
    - `requireMention` در جای اشتباه پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی کانال باشد)
    - فرستنده توسط فهرست مجاز `users` در guild/channel مسدود شده است

  </Accordion>

  <Accordion title="نوبت‌های طولانی Discord یا پاسخ‌های تکراری">

    گزارش‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    گزینه‌های صف Gateway در Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener در Gateway مربوط به Discord را کنترل می‌کند، نه طول عمر نوبت عامل

    Discord برای نوبت‌های عامل صف‌شده timeout متعلق به کانال اعمال نمی‌کند. listenerهای پیام فوراً واگذار می‌کنند، و اجراهای Discord در صف، ترتیب هر نشست را تا زمانی که چرخه عمر نشست/ابزار/runtime کامل شود یا کار را abort کند، حفظ می‌کنند.

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

  <Accordion title="هشدارهای timeout جست‌وجوی فراداده Gateway">
    OpenClaw پیش از اتصال، فراداده `/gateway/bot` در Discord را دریافت می‌کند. خطاهای گذرا به URL پیش‌فرض Gateway در Discord برمی‌گردند و در گزارش‌ها rate-limit می‌شوند.

    گزینه‌های timeout فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback محیطی وقتی پیکربندی تنظیم نشده باشد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، بیشینه: `120000`

  </Accordion>

  <Accordion title="راه‌اندازی‌های مجدد به‌دلیل مهلت زمانی READY در Gateway">
    OpenClaw هنگام راه‌اندازی و پس از اتصال‌های مجدد در زمان اجرا، منتظر رویداد `READY` مربوط به gateway در Discord می‌ماند. راه‌اندازی‌های چندحسابی با فاصله‌گذاری هنگام شروع ممکن است به پنجره READY طولانی‌تری نسبت به مقدار پیش‌فرض نیاز داشته باشند.

    تنظیمات مهلت زمانی READY:

    - راه‌اندازی تک‌حسابی: `channels.discord.gatewayReadyTimeoutMs`
    - راه‌اندازی چندحسابی: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - مقدار جایگزین env هنگام تنظیم‌نشدن پیکربندی: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض راه‌اندازی: `15000` (۱۵ ثانیه)، حداکثر: `120000`
    - زمان اجرا تک‌حسابی: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - زمان اجرا چندحسابی: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - مقدار جایگزین env هنگام تنظیم‌نشدن پیکربندی: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض زمان اجرا: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="ناهمخوانی‌های ممیزی مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق در زمان اجرا همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را به‌طور کامل راستی‌آزمایی کند.

  </Accordion>

  <Accordion title="مشکلات DM و جفت‌سازی">

    - DM غیرفعال: `channels.discord.dm.enabled=false`
    - سیاست DM غیرفعال: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در انتظار تأیید جفت‌سازی در حالت `pairing`

  </Accordion>

  <Accordion title="حلقه‌های بات به بات">
    به‌طور پیش‌فرض پیام‌های نوشته‌شده توسط بات نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قواعد سخت‌گیرانه mention و allowlist استفاده کنید.
    بهتر است از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های باتی پذیرفته شوند که از بات نام می‌برند.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
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

  <Accordion title="افت Voice STT با DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صوت Discord موجود باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` باشد (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض upstream) شروع کنید و فقط در صورت نیاز تنظیم کنید
    - در لاگ‌ها به این موارد توجه کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر خطاها پس از پیوستن مجدد خودکار ادامه داشتند، لاگ‌ها را جمع‌آوری کنید و با تاریخچه دریافت DAVE در upstream در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای مهم Discord">

- راه‌اندازی/احراز هویت: `enabled`, `token`, `accounts.*`, `allowBots`
- سیاست: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- فرمان: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجه listener)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- جریان‌سازی: `streaming` (نام مستعار قدیمی: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش مجدد: `mediaMaxMb` (بارگذاری‌های خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`)، `retry`
- کنش‌ها: `actions.*`
- presence: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- قابلیت‌ها: `threadBindings`, سطح بالای `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- توکن‌های بات را به‌عنوان راز در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های تحت نظارت ترجیح داده می‌شود).
- حداقل مجوزهای لازم Discord را اعطا کنید.
- اگر وضعیت deploy/state فرمان قدیمی است، gateway را راه‌اندازی مجدد کنید و با `openclaw channels status --probe` دوباره بررسی کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Discord را با gateway جفت کنید.
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
  <Card title="مسیریابی چندعامله" icon="sitemap" href="/fa/concepts/multi-agent">
    guildها و کانال‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="فرمان‌های Slash" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی.
  </Card>
</CardGroup>
