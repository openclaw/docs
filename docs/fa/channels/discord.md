---
read_when:
    - کار روی قابلیت‌های کانال Discord
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Discord
title: Discord
x-i18n:
    generated_at: "2026-04-30T09:34:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f31af2801e7faf6456d4452a5f43b0e42a067b86b7e562c308fa450a847356
    source_path: channels/discord.md
    workflow: 16
---

برای پیام‌های مستقیم و کانال‌های سرور از طریق Gateway رسمی Discord آماده است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Discord به‌طور پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار بومی دستورها و کاتالوگ دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های بین‌کانالی و روند تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه تازه همراه با یک ربات بسازید، ربات را به سرور خود اضافه کنید، و آن را به OpenClaw جفت کنید. توصیه می‌کنیم ربات خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز سروری ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **ساخت سرور خودم > برای من و دوستانم** را انتخاب کنید).

<Steps>
  <Step title="ساخت یک برنامه و ربات Discord">
    به [پرتال توسعه‌دهندگان Discord](https://discord.com/developers/applications) بروید و روی **برنامه جدید** کلیک کنید. نامی مانند «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **ربات** کلیک کنید. **نام کاربری** را روی هر نامی که برای عامل OpenClaw خود استفاده می‌کنید تنظیم کنید.

  </Step>

  <Step title="فعال‌سازی اینتنت‌های ممتاز">
    همچنان در صفحه **ربات**، به پایین تا **اینتنت‌های ممتاز Gateway** پیمایش کنید و این موارد را فعال کنید:

    - **اینتنت محتوای پیام** (الزامی)
    - **اینتنت اعضای سرور** (توصیه‌شده؛ برای فهرست‌های مجاز نقش و تطبیق نام به شناسه الزامی است)
    - **اینتنت حضور** (اختیاری؛ فقط برای به‌روزرسانی‌های حضور لازم است)

  </Step>

  <Step title="کپی کردن توکن ربات">
    در صفحه **ربات** دوباره به بالا برگردید و روی **بازنشانی توکن** کلیک کنید.

    <Note>
    با وجود این نام، این کار اولین توکن شما را تولید می‌کند؛ چیزی «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی و جایی ذخیره کنید. این **توکن ربات** شماست و به‌زودی به آن نیاز خواهید داشت.

  </Step>

  <Step title="تولید نشانی دعوت و افزودن ربات به سرور">
    در نوار کناری روی **OAuth2** کلیک کنید. یک نشانی دعوت با مجوزهای درست تولید می‌کنید تا ربات به سرور شما اضافه شود.

    به پایین تا **تولیدکننده نشانی OAuth2** پیمایش کنید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    بخشی با عنوان **مجوزهای ربات** در پایین ظاهر می‌شود. دست‌کم این موارد را فعال کنید:

    **مجوزهای عمومی**
      - مشاهده کانال‌ها
    **مجوزهای متنی**
      - ارسال پیام‌ها
      - خواندن تاریخچه پیام‌ها
      - جاسازی پیوندها
      - پیوست کردن فایل‌ها
      - افزودن واکنش‌ها (اختیاری)

    این مجموعه پایه برای کانال‌های متنی معمولی است. اگر قصد دارید در رشته‌های Discord پست بگذارید، از جمله روندهای کاری کانال انجمن یا رسانه که رشته‌ای ایجاد یا ادامه می‌دهند، **ارسال پیام‌ها در رشته‌ها** را نیز فعال کنید.
    نشانی تولیدشده در پایین را کپی کنید، آن را در مرورگر خود جای‌گذاری کنید، سرور خود را انتخاب کنید، و برای اتصال روی **ادامه** کلیک کنید. اکنون باید ربات خود را در سرور Discord ببینید.

  </Step>

  <Step title="فعال‌سازی حالت توسعه‌دهنده و جمع‌آوری شناسه‌ها">
    در برنامه Discord، باید حالت توسعه‌دهنده را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **تنظیمات کاربر** (نماد چرخ‌دنده کنار تصویر نمایه) کلیک کنید → **پیشرفته** → **حالت توسعه‌دهنده** را روشن کنید
    2. در نوار کناری روی **نماد سرور** خود راست‌کلیک کنید → **کپی شناسه سرور**
    3. روی **تصویر نمایه خودتان** راست‌کلیک کنید → **کپی شناسه کاربر**

    **شناسه سرور** و **شناسه کاربر** خود را کنار توکن ربات ذخیره کنید؛ در گام بعدی هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="اجازه دادن به پیام‌های مستقیم از اعضای سرور">
    برای اینکه جفت‌سازی کار کند، Discord باید اجازه دهد رباتتان به شما پیام مستقیم بدهد. روی **نماد سرور** خود راست‌کلیک کنید → **تنظیمات حریم خصوصی** → **پیام‌های مستقیم** را روشن کنید.

    این کار به اعضای سرور (از جمله ربات‌ها) اجازه می‌دهد برای شما پیام مستقیم بفرستند. اگر می‌خواهید از پیام‌های مستقیم Discord با OpenClaw استفاده کنید، این گزینه را فعال نگه دارید. اگر فقط قصد دارید از کانال‌های سرور استفاده کنید، می‌توانید پس از جفت‌سازی پیام‌های مستقیم را غیرفعال کنید.

  </Step>

  <Step title="تنظیم امن توکن ربات (آن را در گفتگو نفرستید)">
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

    اگر OpenClaw از قبل به‌عنوان سرویس پس‌زمینه اجرا می‌شود، آن را از طریق برنامه Mac OpenClaw یا با توقف و راه‌اندازی دوباره فرایند `openclaw gateway run` بازراه‌اندازی کنید.
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از شلی اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید، تا سرویس بتواند پس از بازراه‌اندازی SecretRef محیط را resolve کند.
    اگر میزبان شما توسط جست‌وجوی برنامه هنگام راه‌اندازی Discord مسدود یا دچار محدودیت نرخ شده است، شناسه برنامه/کلاینت Discord را از پرتال توسعه‌دهندگان تنظیم کنید تا راه‌اندازی بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند ربات Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="پیکربندی OpenClaw و جفت‌سازی">

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        با عامل OpenClaw خود در هر کانال موجودی (مثلاً Telegram) گفتگو کنید و به او بگویید. اگر Discord اولین کانال شماست، به‌جای آن از زبانه CLI / پیکربندی استفاده کنید.

        > "من قبلاً توکن ربات Discord خود را در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با شناسه کاربر `<user_id>` و شناسه سرور `<server_id>` کامل کن."
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

        جایگزین محیط برای حساب پیش‌فرض:

```bash
DISCORD_BOT_TOKEN=...
```

        برای راه‌اندازی اسکریپتی یا راه دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس دوباره بدون `--dry-run` اجرا کنید. مقادیر متن ساده `token` پشتیبانی می‌شوند. مقادیر SecretRef نیز برای `channels.discord.token` در ارائه‌دهندگان محیط/فایل/اجرا پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند ربات Discord، توکن هر ربات و شناسه برنامه آن را زیر حساب خودش نگه دارید. یک `channels.discord.applicationId` سطح بالا توسط حساب‌ها به ارث برده می‌شود، پس فقط وقتی آن را آنجا تنظیم کنید که همه حساب‌ها باید از همان شناسه برنامه استفاده کنند.

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
    صبر کنید تا Gateway اجرا شود، سپس به ربات خود در Discord پیام مستقیم بدهید. ربات با یک کد جفت‌سازی پاسخ می‌دهد.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        کد جفت‌سازی را در کانال موجود خود برای عامل بفرستید:

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

    اکنون باید بتوانید در Discord از طریق پیام مستقیم با عامل خود گفتگو کنید.

  </Step>
</Steps>

<Note>
تفکیک توکن حساب‌محور است. مقادیر توکن در پیکربندی بر جایگزین محیط اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به یک توکن ربات یکسان منتهی شوند، OpenClaw فقط یک پایشگر Gateway برای آن توکن راه‌اندازی می‌کند. توکنی که از پیکربندی آمده باشد بر جایگزین پیش‌فرض محیط اولویت دارد؛ در غیر این صورت اولین حساب فعال برنده می‌شود و حساب تکراری غیرفعال گزارش می‌شود.
برای فراخوانی‌های خروجی پیشرفته (ابزار پیام/اقدام‌های کانال)، از `token` صریح در هر فراخوانی برای همان فراخوانی استفاده می‌شود. این موضوع برای اقدام‌های سبک ارسال و خواندن/کاوش صدق می‌کند (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات سیاست و تلاش دوباره حساب همچنان از حساب انتخاب‌شده در نمای لحظه‌ای فعال زمان اجرا می‌آیند.
</Note>

## توصیه‌شده: راه‌اندازی یک فضای کاری سرور

پس از اینکه پیام‌های مستقیم کار کردند، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال نشست عامل خودش را با زمینه خودش دریافت می‌کند. این کار برای سرورهای خصوصی‌ای توصیه می‌شود که فقط شما و رباتتان در آن هستید.

<Steps>
  <Step title="افزودن سرور خود به فهرست مجاز سرورها">
    این کار به عامل شما امکان می‌دهد در هر کانالی از سرورتان پاسخ دهد، نه فقط در پیام‌های مستقیم.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > "شناسه سرور Discord من، `<server_id>`، را به فهرست مجاز سرورها اضافه کن"
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

  <Step title="اجازه پاسخ‌ها بدون اشاره با @">
    به‌طور پیش‌فرض، عامل شما فقط وقتی در کانال‌های سرور پاسخ می‌دهد که با @ از آن نام برده شود. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های سرور، پاسخ‌های نهایی معمول دستیار به‌طور پیش‌فرض خصوصی می‌مانند. خروجی قابل مشاهده Discord باید به‌صراحت با ابزار `message` ارسال شود، تا عامل بتواند به‌طور پیش‌فرض بی‌صدا بماند و فقط وقتی تصمیم می‌گیرد پاسخ کانالی مفید است، ارسال کند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > "اجازه بده عامل من در این سرور بدون نیاز به اشاره با @ پاسخ بدهد"
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

        برای بازیابی پاسخ‌های نهایی خودکار قدیمی برای اتاق‌های گروهی/کانالی، `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="برنامه‌ریزی برای حافظه در کانال‌های سرور">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در نشست‌های پیام مستقیم بارگذاری می‌شود. کانال‌های سرور MEMORY.md را به‌صورت خودکار بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > "وقتی در کانال‌های Discord سؤال می‌پرسم، اگر به زمینه بلندمدت از MEMORY.md نیاز داشتی، از memory_search یا memory_get استفاده کن."
      </Tab>
      <Tab title="دستی">
        اگر در هر کانال به زمینه مشترک نیاز دارید، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` بگذارید (آن‌ها برای هر نشست تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و هنگام نیاز با ابزارهای حافظه به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

حالا چند کانال در سرور Discord خود بسازید و گفتگو را شروع کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال نشست جداگانه خودش را می‌گیرد؛ بنابراین می‌توانید `#coding`، `#home`، `#research`، یا هر چیزی را که با روند کاری شما جور است راه‌اندازی کنید.

## مدل زمان اجرا

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord دوباره به Discord برمی‌گردند.
- فرادادهٔ guild/channel در Discord به‌عنوان زمینهٔ نامطمئن به پرامپت مدل افزوده می‌شود، نه به‌عنوان پیشوند پاسخ قابل مشاهده برای کاربر. اگر مدلی آن پوشش را دوباره کپی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از زمینهٔ بازپخش آینده حذف می‌کند.
- به‌صورت پیش‌فرض (`session.dmScope=main`)، گفت‌وگوهای مستقیم نشست اصلی عامل را به‌اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های Guild کلیدهای نشست ایزوله هستند (`agent:<agentId>:discord:channel:<channelId>`).
- Group DMها به‌صورت پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های slash بومی در نشست‌های فرمان ایزوله اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، در حالی که همچنان `CommandTargetSessionKey` را به نشست گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان Cron/Heartbeat فقط متنی به Discord، پاسخ نهایی قابل مشاهده برای دستیار را یک‌بار استفاده می‌کند. بارهای رسانه‌ای و مؤلفه‌های ساختاریافته وقتی عامل چند بار قابل تحویل تولید کند، همچنان چندپیامی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانهٔ Discord فقط پست‌های thread را می‌پذیرند. OpenClaw از دو روش برای ساخت آن‌ها پشتیبانی می‌کند:

- یک پیام به والد انجمن (`channel:<forumId>`) بفرستید تا به‌صورت خودکار یک thread ساخته شود. عنوان thread از نخستین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ساخت مستقیم یک thread استفاده کنید. برای کانال‌های انجمن `--message-id` را ارسال نکنید.

نمونه: ارسال به والد انجمن برای ساخت یک thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

نمونه: ساخت صریح یک thread انجمن

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، آن‌ها را به خود thread بفرستید (`channel:<threadId>`).

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای مؤلفه‌های v2 در Discord برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با بار `components` استفاده کنید. نتایج تعامل به‌عنوان پیام‌های ورودی عادی به عامل مسیریابی می‌شوند و از تنظیمات موجود Discord برای `replyToMode` پیروی می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- ردیف‌های کنش تا ۵ دکمه یا یک منوی انتخاب تکی را مجاز می‌دانند
- نوع‌های انتخاب: `string`, `user`, `role`, `mentionable`, `channel`

به‌صورت پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. `components.reusable=true` را تنظیم کنید تا دکمه‌ها، انتخاب‌گرها و فرم‌ها بتوانند چند بار تا زمان انقضا استفاده شوند.

برای محدود کردن اینکه چه کسی می‌تواند روی یک دکمه کلیک کند، `allowedUsers` را روی آن دکمه تنظیم کنید (شناسه‌های کاربر Discord، برچسب‌ها، یا `*`). وقتی پیکربندی شود، کاربران نامطابق یک رد ephemeral دریافت می‌کنند.

فرمان‌های slash `/model` و `/models` یک انتخاب‌گر مدل تعاملی با فهرست‌های کشویی ارائه‌دهنده، مدل و runtime سازگار، به‌همراه مرحلهٔ Submit باز می‌کنند. `/models add` منسوخ شده است و اکنون به‌جای ثبت مدل‌ها از چت، یک پیام منسوخ‌بودن برمی‌گرداند. پاسخ انتخاب‌گر ephemeral است و فقط کاربر فراخواننده می‌تواند از آن استفاده کند.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (تک فایل)؛ برای چند فایل از `media-gallery` استفاده کنید
- وقتی نام بارگذاری باید با مرجع پیوست منطبق باشد، برای بازنویسی نام بارگذاری از `filename` استفاده کنید

فرم‌های modal:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- نوع‌های فیلد: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw به‌صورت خودکار یک دکمهٔ trigger اضافه می‌کند

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
  <Tab title="DM policy">
    `channels.discord.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.discord.allowFrom` فهرست مجاز canonical برای DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر خط‌مشی DM باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` برای جفت‌سازی راهنمایی می‌شوند).

    تقدم چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط روی حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` نسبت به `dm.allowFrom` قدیمی تقدم دارد.
    - حساب‌های نام‌گذاری‌شده وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌گذاری‌شده `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب مقصد DM برای تحویل:

    - `user:<id>`
    - اشارهٔ `<@id>`

    شناسه‌های عددی خام معمولاً وقتی یک پیش‌فرض کانال فعال باشد به‌عنوان شناسهٔ کانال resolve می‌شوند، اما شناسه‌های فهرست‌شده در `allowFrom` مؤثر DM حساب، برای سازگاری به‌عنوان مقصدهای DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="Guild policy">
    مدیریت Guild توسط `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    خط پایهٔ امن وقتی `channels.discord` وجود داشته باشد `allowlist` است.

    رفتار `allowlist`:

    - guild باید با `channels.discord.guilds` مطابقت داشته باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شوند) و `roles` (فقط شناسه‌های role)؛ اگر هرکدام پیکربندی شده باشد، فرستندگان وقتی با `users` یا `roles` مطابقت داشته باشند مجازند
    - تطبیق مستقیم نام/برچسب به‌صورت پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/برچسب‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌ترند؛ `openclaw security audit` هنگام استفاده از ورودی‌های نام/برچسب هشدار می‌دهد
    - اگر یک guild دارای `channels` پیکربندی‌شده باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک guild بلوک `channels` نداشته باشد، همهٔ کانال‌ها در آن guild فهرست‌مجازشده مجاز هستند

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

    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` نسازید، fallback زمان اجرا `groupPolicy="allowlist"` است (با هشدار در لاگ‌ها)، حتی اگر `channels.defaults.groupPolicy` برابر `open` باشد.

  </Tab>

  <Tab title="Mentions and group DMs">
    پیام‌های Guild به‌صورت پیش‌فرض با mention دروازه‌گذاری می‌شوند.

    تشخیص mention شامل موارد زیر است:

    - اشارهٔ صریح به ربات
    - الگوهای mention پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback به `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ‌دادن به ربات در موارد پشتیبانی‌شده

    `requireMention` برای هر guild/channel پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که به کاربر/role دیگری اشاره می‌کنند اما به ربات نه، حذف می‌کند (به‌جز @everyone/@here).

    Group DMها:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌های کانال یا slugها)

  </Tab>
</Tabs>

### مسیریابی عامل مبتنی بر role

از `bindings[].match.roles` برای مسیریابی اعضای guild در Discord به عامل‌های متفاوت بر اساس شناسهٔ role استفاده کنید. bindingهای مبتنی بر role فقط شناسه‌های role را می‌پذیرند و پس از bindingهای peer یا parent-peer و پیش از bindingهای فقط guild ارزیابی می‌شوند. اگر یک binding فیلدهای match دیگری را نیز تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ فیلدهای پیکربندی‌شده باید مطابقت داشته باشند.

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

- `commands.native` به‌صورت پیش‌فرض `"auto"` است و برای Discord فعال می‌شود.
- بازنویسی برای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` فرمان‌های بومی Discord را که قبلاً ثبت شده‌اند صراحتاً پاک می‌کند.
- احراز مجوز فرمان بومی از همان فهرست‌های مجاز/خط‌مشی‌های Discord مانند مدیریت پیام عادی استفاده می‌کند.
- فرمان‌ها ممکن است همچنان در UI Discord برای کاربرانی که مجاز نیستند قابل مشاهده باشند؛ اجرا همچنان احراز مجوز OpenClaw را اعمال می‌کند و «مجاز نیست» برمی‌گرداند.

برای کاتالوگ و رفتار فرمان، [فرمان‌های Slash](/fa/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض فرمان slash:

- `ephemeral: true`

## جزئیات قابلیت

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord از برچسب‌های پاسخ در خروجی عامل پشتیبانی می‌کند:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    توسط `channels.discord.replyToMode` کنترل می‌شود:

    - `off` (پیش‌فرض)
    - `first`
    - `all`
    - `batched`

    نکته: `off` thread کردن پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه مرجع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای آن نوبت پیوست می‌کند.
    `batched` فقط وقتی مرجع پاسخ بومی ضمنی Discord را پیوست می‌کند که نوبت ورودی یک دستهٔ debounce‌شده از چند پیام بوده باشد. این زمانی مفید است که پاسخ‌های بومی را عمدتاً برای چت‌های جهشی مبهم می‌خواهید، نه هر نوبت تک‌پیامی.

    شناسه‌های پیام در context/history ارائه می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هم‌زمان با رسیدن متن، پاسخ‌های پیش‌نویس را stream کند. `channels.discord.streaming` مقدارهای `off` (پیش‌فرض) | `partial` | `block` | `progress` را می‌پذیرد. `progress` در Discord به `partial` نگاشت می‌شود؛ `streamMode` یک alias قدیمی است و به‌صورت خودکار مهاجرت می‌شود.

    پیش‌فرض `off` می‌ماند، چون ویرایش‌های پیش‌نمایش Discord وقتی چند ربات یا Gateway یک حساب را به‌اشتراک می‌گذارند، سریعاً به محدودیت نرخ برخورد می‌کنند.

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

    - `partial` با رسیدن tokenها یک پیام پیش‌نمایش تکی را ویرایش می‌کند.
    - `block` قطعه‌هایی در اندازهٔ پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست از `draftChunk` استفاده کنید، با clamp شدن به `textChunkLimit`).
    - رسانه، خطا و finalهای دارای پاسخ صریح، ویرایش‌های پیش‌نمایش در انتظار را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.

    stream پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی برمی‌گردند. وقتی stream نوع `block` صراحتاً فعال باشد، OpenClaw برای جلوگیری از stream دوگانه، stream پیش‌نمایش را رد می‌کند.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    زمینهٔ تاریخچهٔ Guild:

    - پیش‌فرض `channels.discord.historyLimit` برابر `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچهٔ DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار رشته:

    - رشته‌های Discord به‌عنوان نشست‌های کانال مسیریابی می‌شوند و پیکربندی کانال والد را به ارث می‌برند مگر اینکه بازنویسی شده باشد.
    - نشست‌های رشته، انتخاب `/model` در سطح نشستِ کانال والد را فقط به‌عنوان گزینهٔ پشتیبان مدل به ارث می‌برند؛ انتخاب‌های `/model` محلیِ رشته همچنان اولویت دارند و تاریخچهٔ رونوشت والد کپی نمی‌شود مگر اینکه وراثت رونوشت فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) رشته‌های خودکار جدید را برای مقداردهی اولیه از رونوشت والد فعال می‌کند. بازنویسی‌های هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند مقصدهای پیام مستقیم `user:<id>` را resolve کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` هنگام fallback فعال‌سازی مرحلهٔ پاسخ حفظ می‌شود.

    موضوعات کانال به‌عنوان زمینهٔ **غیرقابل اعتماد** تزریق می‌شوند. فهرست‌های مجاز تعیین می‌کنند چه کسی می‌تواند عامل را تحریک کند، نه یک مرز کامل حذف زمینهٔ تکمیلی.

  </Accordion>

  <Accordion title="نشست‌های وابسته به رشته برای زیرعامل‌ها">
    Discord می‌تواند یک رشته را به یک مقصد نشست متصل کند تا پیام‌های بعدی در آن رشته همچنان به همان نشست مسیریابی شوند (از جمله نشست‌های زیرعامل).

    فرمان‌ها:

    - `/focus <target>` رشتهٔ فعلی/جدید را به مقصد زیرعامل/نشست متصل می‌کند
    - `/unfocus` اتصال رشتهٔ فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت اتصال را نشان می‌دهد
    - `/session idle <duration|off>` عدم‌فعالیتِ unfocus خودکار برای اتصال‌های متمرکز را بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر عمر سخت برای اتصال‌های متمرکز را بررسی/به‌روزرسانی می‌کند

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    نکته‌ها:

    - `session.threadBindings.*` پیش‌فرض‌های سراسری را تنظیم می‌کند.
    - `channels.discord.threadBindings.*` رفتار Discord را بازنویسی می‌کند.
    - `spawnSubagentSessions` باید true باشد تا رشته‌ها برای `sessions_spawn({ thread: true })` به‌صورت خودکار ایجاد/متصل شوند.
    - `spawnAcpSessions` باید true باشد تا رشته‌ها برای ACP (`/acp spawn ... --thread ...` یا `sessions_spawn({ runtime: "acp", thread: true })`) به‌صورت خودکار ایجاد/متصل شوند.
    - اگر اتصال‌های رشته برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط با اتصال رشته در دسترس نیستند.

    [زیرعامل‌ها](/fa/tools/subagents)، [عامل‌های ACP](/fa/tools/acp-agents)، و [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="اتصال‌های پایدار کانال ACP">
    برای فضاهای کاری ACP پایدار و «همیشه روشن»، اتصال‌های تایپ‌شدهٔ سطح بالا را پیکربندی کنید که مکالمات Discord را هدف می‌گیرند.

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

    - `/acp spawn codex --bind here` کانال یا رشتهٔ فعلی را در همان‌جا متصل می‌کند و پیام‌های آینده را روی همان نشست ACP نگه می‌دارد. پیام‌های رشته اتصال کانال والد را به ارث می‌برند.
    - در یک کانال یا رشتهٔ متصل، `/new` و `/reset` همان نشست ACP را در همان‌جا بازنشانی می‌کنند. اتصال‌های موقت رشته می‌توانند هنگام فعال بودن، resolve مقصد را بازنویسی کنند.
    - `spawnAcpSessions` فقط زمانی لازم است که OpenClaw نیاز داشته باشد یک رشتهٔ فرزند را از طریق `--thread auto|here` ایجاد/متصل کند.

    برای جزئیات رفتار اتصال، [عامل‌های ACP](/fa/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="اعلان‌های واکنش">
    حالت اعلان واکنش برای هر guild:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای سیستمی تبدیل می‌شوند و به نشست Discord مسیریابی‌شده پیوست می‌شوند.

  </Accordion>

  <Accordion title="واکنش‌های تأیید دریافت">
    `ackReaction` هنگام پردازش یک پیام ورودی توسط OpenClaw، یک ایموجی تأیید دریافت ارسال می‌کند.

    ترتیب resolve:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

    نکته‌ها:

    - Discord ایموجی یونیکد یا نام‌های ایموجی سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب از `""` استفاده کنید.

  </Accordion>

  <Accordion title="نوشتن‌های پیکربندی">
    نوشتن‌های پیکربندی آغازشده از کانال به‌صورت پیش‌فرض فعال هستند.

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
    ترافیک WebSocket مربوط به Gateway در Discord و جست‌وجوهای REST هنگام راه‌اندازی (شناسهٔ برنامه + resolve فهرست مجاز) را با `channels.discord.proxy` از طریق یک پروکسی HTTP(S) مسیریابی کنید.

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
    resolve PluralKit را فعال کنید تا پیام‌های پراکسی‌شده به هویت عضو سیستم نگاشت شوند:

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
    - نام‌های نمایشی اعضا فقط وقتی با نام/slug تطبیق داده می‌شوند که `channels.discord.dangerouslyAllowNameMatching: true` باشد
    - جست‌وجوها از شناسهٔ پیام اصلی استفاده می‌کنند و به پنجرهٔ زمانی محدود هستند
    - اگر جست‌وجو شکست بخورد، پیام‌های پراکسی‌شده به‌عنوان پیام‌های ربات در نظر گرفته می‌شوند و حذف می‌شوند مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="پیکربندی حضور">
    به‌روزرسانی‌های حضور زمانی اعمال می‌شوند که یک فیلد وضعیت یا فعالیت تنظیم کنید، یا وقتی حضور خودکار را فعال کنید.

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

    مثال Streaming:

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
    - 1: Streaming (به `activityUrl` نیاز دارد)
    - 2: در حال گوش دادن
    - 3: در حال تماشا
    - 4: سفارشی (از متن فعالیت به‌عنوان وضعیت استفاده می‌کند؛ ایموجی اختیاری است)
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

    حضور خودکار، دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => آنلاین، تنزل‌یافته یا ناشناخته => idle، تمام‌شده یا در دسترس نبودن => dnd. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از placeholder `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="تأییدها در Discord">
    Discord از رسیدگی به تأیید مبتنی بر دکمه در پیام‌های مستقیم پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری promptهای تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` fallback می‌کند)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    وقتی `enabled` تنظیم نشده یا `"auto"` باشد و حداقل یک تأییدکننده بتواند resolve شود، Discord تأییدهای اجرای native را به‌صورت خودکار فعال می‌کند؛ چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`. Discord تأییدکنندگان اجرا را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنباط نمی‌کند. برای غیرفعال کردن صریح Discord به‌عنوان مشتری native تأیید، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط مالک مانند `/diagnostics` و `/export-trajectory`، OpenClaw promptهای تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. وقتی مالک فراخواننده مسیر مالک Discord داشته باشد ابتدا پیام مستقیم Discord را امتحان می‌کند؛ اگر در دسترس نباشد، به اولین مسیر مالک موجود از `commands.ownerAllowFrom`، مانند Telegram، fallback می‌کند.

    وقتی `target` برابر `channel` یا `both` باشد، prompt تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان resolve‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقت دریافت می‌کنند. promptهای تأیید شامل متن فرمان هستند، بنابراین تحویل در کانال را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسهٔ کانال از کلید نشست قابل استخراج نباشد، OpenClaw به تحویل پیام مستقیم fallback می‌کند.

    Discord همچنین دکمه‌های تأیید مشترک استفاده‌شده توسط کانال‌های چت دیگر را رندر می‌کند. آداپتور native Discord عمدتاً مسیریابی پیام مستقیم تأییدکننده و fanout کانال را اضافه می‌کند.
    وقتی آن دکمه‌ها وجود داشته باشند، تجربهٔ کاربری اصلی تأیید هستند؛ OpenClaw
    فقط زمانی باید یک فرمان دستی `/approve` را شامل کند که نتیجهٔ ابزار بگوید
    تأییدهای چت در دسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان اجرای تأیید native Discord فعال نباشد، OpenClaw
    prompt قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان اجرا فعال باشد اما یک کارت native به هیچ مقصدی قابل تحویل نباشد،
    OpenClaw یک اعلان fallback در همان چت با فرمان دقیق `/approve`
    از تأیید در انتظار ارسال می‌کند.

    احراز هویت Gateway و resolve تأیید از قرارداد مشترک مشتری Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` resolve می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌صورت پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای اجرا](/fa/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و gateهای اقدام

اقدام‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، moderation، حضور، و اقدام‌های فراداده هستند.

مثال‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- moderation: `timeout`، `kick`، `ban`
- حضور: `setPresence`

اقدام `event-create` یک پارامتر اختیاری `image` (URL یا مسیر فایل محلی) می‌پذیرد تا تصویر کاور رویداد زمان‌بندی‌شده را تنظیم کند.

gateهای اقدام زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض gate:

| گروه اقدام                                                                                                                                                             | پیش‌فرض  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | فعال  |
| roles                                                                                                                                                                    | غیرفعال |
| moderation                                                                                                                                                               | غیرفعال |
| presence                                                                                                                                                                 | غیرفعال |

## رابط کاربری Components v2

OpenClaw از Discord components v2 برای تأییدهای اجرا و نشانگرهای میان‌زمینه‌ای استفاده می‌کند. اقدام‌های پیام Discord همچنین می‌توانند `components` را برای رابط کاربری سفارشی بپذیرند (پیشرفته؛ نیازمند ساخت payload کامپوننت از طریق ابزار discord)، در حالی که `embeds` قدیمی همچنان در دسترس‌اند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تأکید استفاده‌شده توسط کانتینرهای کامپوننت Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- وقتی components v2 وجود داشته باشد، `embeds` نادیده گرفته می‌شود.

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

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بلادرنگ (گفت‌وگوهای پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موج صوتی). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

فهرست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی فهرست‌های مجاز نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. ربات را با scopeهای `bot` و `applications.commands` دعوت کنید.
4. مجوزهای Connect، Speak، Send Messages، و Read Message History را در کانال صوتی هدف اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و از همان قوانین فهرست مجاز و سیاست گروهی سایر فرمان‌های Discord پیروی می‌کند.

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
- STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` بر رونویسی اثر نمی‌گذارد.
- نوبت‌های رونویسی صوتی وضعیت مالک را از `allowFrom` در Discord (یا `dm.allowFrom`) استخراج می‌کنند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای فقط‌مالک دسترسی داشته باشند (برای مثال `gateway` و `cron`).
- صدا به‌صورت پیش‌فرض فعال است؛ برای غیرفعال کردن runtime صدا و intent مربوط به Gateway با نام `GuildVoiceStates`، مقدار `channels.discord.voice.enabled=false` را تنظیم کنید.
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را به‌صورت صریح بازنویسی کند. برای اینکه intent از `voice.enabled` پیروی کند، آن را تنظیم‌نشده بگذارید.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` به گزینه‌های پیوستن `@discordjs/voice` منتقل می‌شوند.
- اگر تنظیم نشوند، پیش‌فرض‌های `@discordjs/voice` برابر با `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را پایش می‌کند و پس از تکرار خطاها در یک بازه کوتاه، با ترک و پیوستن دوباره به کانال صوتی، خودکار بازیابی می‌کند.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت به‌طور مکرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح padding بالادستی از PR #11449 در discord.js است که issue #11419 در discord.js را بست.

خط لوله کانال صوتی:

- ضبط PCM از Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio` کار STT را انجام می‌دهد، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونویسی از مسیر عادی ورود و مسیریابی Discord ارسال می‌شود.
- `voice.model`، وقتی تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ صوت حاصل در کانال پیوسته پخش می‌شود.

اعتبارنامه‌ها برای هر کامپوننت جداگانه resolve می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، و احراز هویت TTS برای `messages.tts`/`voice.tts`.

### پیام‌های صوتی

پیام‌های صوتی Discord پیش‌نمایش موج صوتی نشان می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw موج صوتی را به‌صورت خودکار تولید می‌کند، اما برای بررسی و تبدیل به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه کنید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در یک payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="از intentهای غیرمجاز استفاده شده یا ربات هیچ پیام guild را نمی‌بیند">

    - Message Content Intent را فعال کنید
    - وقتی به resolve کردن کاربر/عضو وابسته هستید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، gateway را دوباره راه‌اندازی کنید

  </Accordion>

  <Accordion title="پیام‌های guild به‌طور غیرمنتظره مسدود شده‌اند">

    - `groupPolicy` را بررسی کنید
    - فهرست مجاز guild را زیر `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` برای guild وجود دارد، فقط کانال‌های فهرست‌شده مجاز هستند
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
    - `requireMention` در جای نادرست پیکربندی شده است (باید زیر `channels.discord.guilds` یا ورودی channel باشد)
    - فرستنده توسط فهرست مجاز `users` در guild/channel مسدود شده است

  </Accordion>

  <Accordion title="نوبت‌های طولانی Discord یا پاسخ‌های تکراری">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    تنظیمات صف Gateway در Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener در Gateway مربوط به Discord را کنترل می‌کند، نه طول عمر نوبت عامل

    Discord زمان‌پایان تحت مالکیت channel را روی نوبت‌های عاملِ صف‌شده اعمال نمی‌کند. listenerهای پیام بلافاصله تحویل می‌دهند، و اجراهای صف‌شده Discord ترتیب هر نشست را تا تکمیل چرخه عمر session/tool/runtime یا لغو کار حفظ می‌کنند.

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

  <Accordion title="هشدارهای زمان‌پایان lookup فراداده Gateway">
    OpenClaw پیش از اتصال، فراداده `/gateway/bot` در Discord را واکشی می‌کند. خطاهای گذرا به URL پیش‌فرض Gateway در Discord بازمی‌گردند و در لاگ‌ها rate-limit می‌شوند.

    تنظیمات زمان‌پایان فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback محیطی وقتی config تنظیم نشده است: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (۳۰ ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="ناهمخوانی‌های ممیزی مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی channel کار می‌کنند.

    اگر از کلیدهای slug استفاده می‌کنید، تطبیق runtime همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را به‌طور کامل راستی‌آزمایی کند.

  </Accordion>

  <Accordion title="مشکلات DM و جفت‌سازی">

    - DM غیرفعال است: `channels.discord.dm.enabled=false`
    - سیاست DM غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در حالت `pairing` در انتظار تأیید جفت‌سازی است

  </Accordion>

  <Accordion title="حلقه‌های ربات به ربات">
    به‌صورت پیش‌فرض، پیام‌های نوشته‌شده توسط ربات نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قوانین سخت‌گیرانه mention و فهرست مجاز استفاده کنید.
    ترجیحاً از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های رباتی پذیرفته شوند که ربات را mention می‌کنند.

  </Accordion>

  <Accordion title="افت STT صوتی با DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صدای Discord موجود باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` است (پیش‌فرض)
    - از `channels.discord.voice.decryptionFailureTolerance=24` شروع کنید (پیش‌فرض بالادستی) و فقط در صورت نیاز تنظیم کنید
    - لاگ‌ها را برای این موارد پایش کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر خطاها پس از پیوستن دوباره خودکار ادامه پیدا کردند، لاگ‌ها را جمع‌آوری کنید و با تاریخچه دریافت DAVE بالادستی در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/fa/gateway/config-channels#discord).

<Accordion title="فیلدهای پرسیگنال Discord">

- راه‌اندازی/احراز هویت: `enabled`, `token`, `accounts.*`, `allowBots`
- سیاست: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- فرمان: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجه listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- فراداده Gateway: `gatewayInfoTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (نام مستعار قدیمی: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش دوباره: `mediaMaxMb` (آپلودهای خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`)، `retry`
- اقدام‌ها: `actions.*`
- حضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- ویژگی‌ها: `threadBindings`, سطح بالا `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- توکن‌های ربات را به‌عنوان secrets در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های تحت نظارت ترجیح داده می‌شود).
- مجوزهای Discord را با کمترین دسترسی لازم اعطا کنید.
- اگر deploy/state فرمان کهنه است، gateway را دوباره راه‌اندازی کنید و با `openclaw channels status --probe` دوباره بررسی کنید.

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
    اصناف و کانال‌ها را به عامل‌ها نگاشت کنید.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی.
  </Card>
</CardGroup>
