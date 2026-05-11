---
read_when:
    - کار روی ویژگی‌های کانال Discord
summary: وضعیت پشتیبانی، قابلیت‌ها و پیکربندی ربات Discord
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

آماده برای DMها و کانال‌های guild از طریق Gateway رسمی Discord.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    DMهای Discord به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و فهرست دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی و جریان تعمیر میان‌کانالی.
  </Card>
</CardGroup>

## راه‌اندازی سریع

باید یک برنامه جدید با یک بات ایجاد کنید، بات را به سرور خود اضافه کنید، و آن را با OpenClaw جفت کنید. توصیه می‌کنیم بات خود را به سرور خصوصی خودتان اضافه کنید. اگر هنوز یکی ندارید، [ابتدا یکی بسازید](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (گزینه **Create My Own > For me and my friends** را انتخاب کنید).

<Steps>
  <Step title="ایجاد یک برنامه و بات Discord">
    به [Discord Developer Portal](https://discord.com/developers/applications) بروید و روی **New Application** کلیک کنید. نامی مثل «OpenClaw» برای آن بگذارید.

    در نوار کناری روی **Bot** کلیک کنید. **Username** را روی هر نامی که برای عامل OpenClaw خود به کار می‌برید تنظیم کنید.

  </Step>

  <Step title="فعال‌سازی intentهای دارای امتیاز">
    همچنان در صفحه **Bot**، به پایین تا **Privileged Gateway Intents** بروید و این موارد را فعال کنید:

    - **Message Content Intent** (الزامی)
    - **Server Members Intent** (توصیه‌شده؛ برای فهرست‌های مجاز نقش و تطبیق نام با شناسه الزامی است)
    - **Presence Intent** (اختیاری؛ فقط برای به‌روزرسانی‌های وضعیت حضور لازم است)

  </Step>

  <Step title="کپی کردن توکن بات">
    در صفحه **Bot** دوباره به بالا برگردید و روی **Reset Token** کلیک کنید.

    <Note>
    برخلاف نامش، این کار اولین توکن شما را ایجاد می‌کند — چیزی «بازنشانی» نمی‌شود.
    </Note>

    توکن را کپی کنید و در جایی ذخیره کنید. این **Bot Token** شماست و به‌زودی به آن نیاز خواهید داشت.

  </Step>

  <Step title="ساخت URL دعوت و افزودن بات به سرور">
    در نوار کناری روی **OAuth2** کلیک کنید. یک URL دعوت با مجوزهای درست برای افزودن بات به سرور خود می‌سازید.

    به پایین تا **OAuth2 URL Generator** بروید و این موارد را فعال کنید:

    - `bot`
    - `applications.commands`

    بخش **Bot Permissions** در پایین ظاهر می‌شود. حداقل این موارد را فعال کنید:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختیاری)

    این مجموعه پایه برای کانال‌های متنی عادی است. اگر قصد دارید در threadهای Discord پست بگذارید، از جمله workflowهای کانال‌های forum یا media که thread ایجاد می‌کنند یا ادامه می‌دهند، **Send Messages in Threads** را نیز فعال کنید.
    URL تولیدشده در پایین را کپی کنید، در مرورگر خود جای‌گذاری کنید، سرور خود را انتخاب کنید، و برای اتصال روی **Continue** کلیک کنید. اکنون باید بات خود را در سرور Discord ببینید.

  </Step>

  <Step title="فعال‌سازی Developer Mode و جمع‌آوری شناسه‌ها">
    دوباره در برنامه Discord، باید Developer Mode را فعال کنید تا بتوانید شناسه‌های داخلی را کپی کنید.

    1. روی **User Settings** (آیکون چرخ‌دنده کنار آواتارتان) کلیک کنید → **Advanced** → **Developer Mode** را روشن کنید
    2. در نوار کناری روی **آیکون سرور** خود راست‌کلیک کنید → **Copy Server ID**
    3. روی **آواتار خودتان** راست‌کلیک کنید → **Copy User ID**

    **Server ID** و **User ID** خود را کنار Bot Token ذخیره کنید — در مرحله بعد هر سه را به OpenClaw می‌فرستید.

  </Step>

  <Step title="اجازه دادن به DMها از اعضای سرور">
    برای اینکه جفت‌سازی کار کند، Discord باید به بات شما اجازه دهد برای شما DM بفرستد. روی **آیکون سرور** خود راست‌کلیک کنید → **Privacy Settings** → **Direct Messages** را روشن کنید.

    این کار به اعضای سرور (از جمله بات‌ها) اجازه می‌دهد برای شما DM بفرستند. اگر می‌خواهید از DMهای Discord با OpenClaw استفاده کنید، این گزینه را فعال نگه دارید. اگر فقط قصد دارید از کانال‌های guild استفاده کنید، می‌توانید بعد از جفت‌سازی DMها را غیرفعال کنید.

  </Step>

  <Step title="تنظیم امن توکن بات (آن را در چت نفرستید)">
    توکن بات Discord شما یک راز است (مثل گذرواژه). پیش از پیام دادن به عامل خود، آن را روی ماشینی که OpenClaw را اجرا می‌کند تنظیم کنید.

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
    برای نصب‌های سرویس مدیریت‌شده، `openclaw gateway install` را از پوسته‌ای اجرا کنید که `DISCORD_BOT_TOKEN` در آن وجود دارد، یا متغیر را در `~/.openclaw/.env` ذخیره کنید تا سرویس بتواند پس از بازراه‌اندازی SecretRef محیط را resolve کند.
    اگر میزبان شما توسط جست‌وجوی برنامه هنگام راه‌اندازی Discord مسدود شده یا rate-limit شده است، شناسه برنامه/کلاینت Discord را از Developer Portal تنظیم کنید تا راه‌اندازی بتواند آن فراخوانی REST را رد کند. برای حساب پیش‌فرض از `channels.discord.applicationId` استفاده کنید، یا وقتی چند بات Discord اجرا می‌کنید از `channels.discord.accounts.<accountId>.applicationId` استفاده کنید.

  </Step>

  <Step title="پیکربندی OpenClaw و جفت‌سازی">

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        با عامل OpenClaw خود در هر کانال موجود (مثلاً Telegram) چت کنید و به او بگویید. اگر Discord اولین کانال شماست، به‌جای آن از تب CLI / config استفاده کنید.

        > «من قبلاً توکن بات Discord خودم را در پیکربندی تنظیم کرده‌ام. لطفاً راه‌اندازی Discord را با User ID `<user_id>` و Server ID `<server_id>` کامل کن.»
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

        برای راه‌اندازی اسکریپتی یا راه دور، همان بلوک JSON5 را با `openclaw config patch --file ./discord.patch.json5 --dry-run` بنویسید و سپس بدون `--dry-run` دوباره اجرا کنید. مقادیر `token` به‌صورت متن ساده پشتیبانی می‌شوند. مقادیر SecretRef نیز برای `channels.discord.token` در providerهای env/file/exec پشتیبانی می‌شوند. [مدیریت رازها](/fa/gateway/secrets) را ببینید.

        برای چند بات Discord، توکن و شناسه برنامه هر بات را زیر حساب خودش نگه دارید. `channels.discord.applicationId` سطح بالا توسط حساب‌ها به ارث برده می‌شود، بنابراین فقط وقتی آن را در آنجا تنظیم کنید که همه حساب‌ها باید از یک شناسه برنامه یکسان استفاده کنند.

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

  <Step title="تأیید اولین جفت‌سازی DM">
    صبر کنید تا gateway در حال اجرا باشد، سپس در Discord به بات خود DM بدهید. بات با یک کد جفت‌سازی پاسخ می‌دهد.

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

    اکنون باید بتوانید از طریق DM در Discord با عامل خود چت کنید.

  </Step>
</Steps>

<Note>
resolve کردن توکن از حساب آگاه است. مقادیر توکن پیکربندی بر fallback محیط اولویت دارند. `DISCORD_BOT_TOKEN` فقط برای حساب پیش‌فرض استفاده می‌شود.
اگر دو حساب فعال Discord به یک توکن بات resolve شوند، OpenClaw فقط یک monitor مربوط به Gateway را برای آن توکن راه‌اندازی می‌کند. توکن منبع‌گرفته از پیکربندی بر fallback محیط پیش‌فرض اولویت دارد؛ در غیر این صورت اولین حساب فعال برنده می‌شود و حساب تکراری به‌عنوان غیرفعال گزارش می‌شود.
برای فراخوانی‌های outbound پیشرفته (ابزار پیام/اقدام‌های کانال)، یک `token` صریح برای هر فراخوانی در همان فراخوانی استفاده می‌شود. این موضوع برای اقدام‌های send و سبک read/probe اعمال می‌شود (برای مثال read/search/fetch/thread/pins/permissions). تنظیمات policy/retry حساب همچنان از حساب انتخاب‌شده در snapshot runtime فعال می‌آیند.
</Note>

## توصیه‌شده: راه‌اندازی یک فضای کاری guild

پس از کار کردن DMها، می‌توانید سرور Discord خود را به‌عنوان یک فضای کاری کامل راه‌اندازی کنید که در آن هر کانال session عامل مخصوص خود را با context خودش دریافت می‌کند. این کار برای سرورهای خصوصی که فقط شما و باتتان در آن هستید توصیه می‌شود.

<Steps>
  <Step title="افزودن سرور به فهرست مجاز guild">
    این کار به عامل شما امکان می‌دهد در هر کانال روی سرورتان پاسخ دهد، نه فقط در DMها.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «Discord Server ID من یعنی `<server_id>` را به فهرست مجاز guild اضافه کن»
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
    به‌طور پیش‌فرض، عامل شما فقط وقتی در کانال‌های guild پاسخ می‌دهد که @mention شده باشد. برای یک سرور خصوصی، احتمالاً می‌خواهید به هر پیام پاسخ دهد.

    در کانال‌های guild، پاسخ‌های نهایی عادی دستیار به‌طور پیش‌فرض خصوصی می‌مانند. خروجی قابل‌مشاهده Discord باید صراحتاً با ابزار `message` فرستاده شود، بنابراین عامل می‌تواند به‌طور پیش‌فرض کمین کند و فقط وقتی تصمیم می‌گیرد پاسخ کانال مفید است پست بگذارد.

    این یعنی مدل انتخاب‌شده باید با اطمینان ابزارها را فراخوانی کند. اگر Discord وضعیت تایپ کردن را نشان می‌دهد و لاگ‌ها مصرف توکن را نشان می‌دهند اما پیامی پست نمی‌شود، لاگ session را برای متن دستیار با `didSendViaMessagingTool: false` بررسی کنید. این یعنی مدل به‌جای فراخوانی `message(action=send)` یک پاسخ نهایی خصوصی تولید کرده است. به یک مدل قوی‌تر در فراخوانی ابزار تغییر دهید، یا از پیکربندی زیر برای بازگرداندن پاسخ‌های نهایی خودکار قدیمی استفاده کنید.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «به عامل من اجازه بده بدون اینکه لازم باشد @mention شود، روی این سرور پاسخ دهد»
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

        برای بازگرداندن پاسخ‌های نهایی خودکار قدیمی برای اتاق‌های گروهی/کانالی، `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید.

      </Tab>
    </Tabs>

  </Step>

  <Step title="برنامه‌ریزی برای حافظه در کانال‌های guild">
    به‌طور پیش‌فرض، حافظه بلندمدت (MEMORY.md) فقط در sessionهای DM بارگذاری می‌شود. کانال‌های guild به‌صورت خودکار MEMORY.md را بارگذاری نمی‌کنند.

    <Tabs>
      <Tab title="از عامل خود بپرسید">
        > «وقتی در کانال‌های Discord سؤال می‌پرسم، اگر به context بلندمدت از MEMORY.md نیاز داشتی از memory_search یا memory_get استفاده کن.»
      </Tab>
      <Tab title="دستی">
        اگر در هر کانال به context مشترک نیاز دارید، دستورالعمل‌های پایدار را در `AGENTS.md` یا `USER.md` بگذارید (آن‌ها برای هر session تزریق می‌شوند). یادداشت‌های بلندمدت را در `MEMORY.md` نگه دارید و هنگام نیاز با ابزارهای memory به آن‌ها دسترسی پیدا کنید.
      </Tab>
    </Tabs>

  </Step>
</Steps>

اکنون چند کانال در سرور Discord خود ایجاد کنید و چت کردن را شروع کنید. عامل شما می‌تواند نام کانال را ببیند، و هر کانال session جداگانه خودش را دریافت می‌کند — بنابراین می‌توانید `#coding`، `#home`، `#research` یا هر چیزی را که با workflow شما سازگار است راه‌اندازی کنید.

## مدل runtime

- Gateway مالک اتصال Discord است.
- مسیریابی پاسخ قطعی است: پاسخ‌های ورودی Discord به Discord برمی‌گردند.
- فرادادهٔ guild/channel در Discord به‌عنوان زمینهٔ نامطمئن به اعلان مدل اضافه می‌شود، نه به‌عنوان پیشوند پاسخ قابل مشاهده برای کاربر. اگر مدلی آن پوشش را دوباره کپی کند، OpenClaw فرادادهٔ کپی‌شده را از پاسخ‌های خروجی و از زمینهٔ بازپخش‌های آینده حذف می‌کند.
- به‌طور پیش‌فرض (`session.dmScope=main`)، گفت‌وگوهای مستقیم نشست اصلی عامل را به‌اشتراک می‌گذارند (`agent:main:main`).
- کانال‌های Guild کلیدهای نشست ایزوله هستند (`agent:<agentId>:discord:channel:<channelId>`).
- Group DMها به‌طور پیش‌فرض نادیده گرفته می‌شوند (`channels.discord.dm.groupEnabled=false`).
- فرمان‌های اسلش بومی در نشست‌های فرمان ایزوله اجرا می‌شوند (`agent:<agentId>:discord:slash:<userId>`)، در حالی که همچنان `CommandTargetSessionKey` را به نشست گفت‌وگوی مسیریابی‌شده حمل می‌کنند.
- تحویل اعلان‌های Cron/Heartbeat فقط‌متنی به Discord، پاسخ نهایی قابل مشاهده برای دستیار را یک‌بار استفاده می‌کند. رسانه و payloadهای مؤلفهٔ ساختاریافته وقتی عامل چند payload قابل تحویل منتشر کند، همچنان چندپیامی می‌مانند.

## کانال‌های انجمن

کانال‌های انجمن و رسانه در Discord فقط پست‌های thread را می‌پذیرند. OpenClaw از دو روش برای ایجاد آن‌ها پشتیبانی می‌کند:

- پیامی به والد انجمن (`channel:<forumId>`) بفرستید تا یک thread به‌طور خودکار ایجاد شود. عنوان thread از اولین خط غیرخالی پیام شما استفاده می‌کند.
- از `openclaw message thread create` برای ایجاد مستقیم یک thread استفاده کنید. برای کانال‌های انجمن `--message-id` را ارسال نکنید.

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

والدهای انجمن مؤلفه‌های Discord را نمی‌پذیرند. اگر به مؤلفه‌ها نیاز دارید، به خود thread بفرستید (`channel:<threadId>`).

## مؤلفه‌های تعاملی

OpenClaw از کانتینرهای مؤلفه‌های v2 در Discord برای پیام‌های عامل پشتیبانی می‌کند. از ابزار پیام با payload `components` استفاده کنید. نتایج تعامل مانند پیام‌های ورودی عادی به عامل مسیریابی می‌شوند و تنظیمات موجود Discord برای `replyToMode` را دنبال می‌کنند.

بلوک‌های پشتیبانی‌شده:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- ردیف‌های کنش تا ۵ دکمه یا یک منوی انتخاب تکی را مجاز می‌کنند
- نوع‌های انتخاب: `string`، `user`، `role`، `mentionable`، `channel`

به‌طور پیش‌فرض، مؤلفه‌ها یک‌بارمصرف هستند. برای اینکه دکمه‌ها، انتخاب‌ها و فرم‌ها تا زمان انقضا بتوانند چندین‌بار استفاده شوند، `components.reusable=true` را تنظیم کنید.

برای محدود کردن اینکه چه کسی می‌تواند روی دکمه کلیک کند، `allowedUsers` را روی آن دکمه تنظیم کنید (شناسه‌های کاربر Discord، برچسب‌ها، یا `*`). وقتی پیکربندی شود، کاربران نامطابق یک رد موقت دریافت می‌کنند.

/model` و `/models` یک انتخاب‌گر تعاملی مدل را باز می‌کنند که dropdownهای ارائه‌دهنده، مدل و runtime سازگار به‌همراه یک مرحلهٔ Submit دارد. `/models add` منسوخ شده و اکنون به‌جای ثبت مدل‌ها از گفت‌وگو، پیام منسوخ‌بودن برمی‌گرداند. پاسخ انتخاب‌گر موقت است و فقط کاربری که آن را فراخوانده می‌تواند از آن استفاده کند. منوهای انتخاب Discord به ۲۵ گزینه محدودند، پس وقتی می‌خواهید انتخاب‌گر مدل‌های کشف‌شدهٔ پویا را فقط برای ارائه‌دهندگان انتخاب‌شده‌ای مانند `openai-codex` یا `vllm` نشان دهد، ورودی‌های `provider/*` را به `agents.defaults.models` اضافه کنید.

پیوست‌های فایل:

- بلوک‌های `file` باید به یک مرجع پیوست اشاره کنند (`attachment://<filename>`)
- پیوست را از طریق `media`/`path`/`filePath` ارائه کنید (یک فایل)؛ برای چندین فایل از `media-gallery` استفاده کنید
- وقتی نام آپلود باید با مرجع پیوست مطابق باشد، از `filename` برای بازنویسی نام استفاده کنید

فرم‌های modal:

- `components.modal` را با حداکثر ۵ فیلد اضافه کنید
- نوع‌های فیلد: `text`، `checkbox`، `radio`، `select`، `role-select`، `user-select`
- OpenClaw به‌طور خودکار یک دکمهٔ trigger اضافه می‌کند

مثال:
__OC_I18N_900009__
## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.discord.allowFrom` فهرست مجاز canonical برای DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.discord.allowFrom` شامل `"*"` باشد)
    - `disabled`

    اگر سیاست DM باز نباشد، کاربران ناشناس مسدود می‌شوند (یا در حالت `pairing` برای جفت‌سازی راهنمایی می‌شوند).

    اولویت چندحسابی:

    - `channels.discord.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - برای یک حساب، `allowFrom` بر `dm.allowFrom` قدیمی اولویت دارد.
    - حساب‌های نام‌گذاری‌شده وقتی `allowFrom` خودشان و `dm.allowFrom` قدیمی تنظیم نشده باشند، `channels.discord.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌گذاری‌شده `channels.discord.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.discord.dm.policy` و `channels.discord.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    قالب هدف DM برای تحویل:

    - `user:<id>`
    - اشارهٔ `<@id>`

    شناسه‌های عددی بدون پیشوند معمولاً وقتی یک پیش‌فرض کانال فعال باشد، به‌عنوان شناسهٔ کانال resolve می‌شوند، اما شناسه‌هایی که در `allowFrom` مؤثر DM حساب فهرست شده‌اند، برای سازگاری به‌عنوان هدف‌های DM کاربر در نظر گرفته می‌شوند.

  </Tab>

  <Tab title="Access groups">
    DMهای Discord و مجوزدهی فرمان متنی می‌توانند از ورودی‌های پویای `accessGroup:<name>` در `channels.discord.allowFrom` استفاده کنند.

    نام‌های گروه دسترسی بین کانال‌های پیام مشترک هستند. برای یک گروه ایستا که اعضای آن در syntax عادی `allowFrom` هر کانال بیان می‌شوند از `type: "message.senders"` استفاده کنید، یا وقتی مخاطبان فعلی `ViewChannel` یک کانال Discord باید عضویت را به‌صورت پویا تعریف کنند، از `type: "discord.channelAudience"` استفاده کنید. رفتار مشترک گروه دسترسی اینجا مستند شده است: [گروه‌های دسترسی](/channels/access-groups).
__OC_I18N_900010__
    یک کانال متنی Discord فهرست اعضای جداگانه‌ای ندارد. `type: "discord.channelAudience"` عضویت را این‌طور مدل می‌کند: فرستندهٔ DM عضو guild پیکربندی‌شده است و پس از اعمال roleها و overwriteهای کانال، در حال حاضر مجوز مؤثر `ViewChannel` را روی کانال پیکربندی‌شده دارد.

    مثال: به هر کسی که می‌تواند `#maintainers` را ببیند اجازه دهید به bot پیام DM بدهد، در حالی که DMها برای همهٔ افراد دیگر بسته می‌مانند.
__OC_I18N_900011__
    می‌توانید ورودی‌های پویا و ایستا را ترکیب کنید:
__OC_I18N_900012__
    lookupها بسته شکست می‌خورند. اگر Discord مقدار `Missing Access` برگرداند، lookup عضو شکست بخورد، یا کانال متعلق به guild دیگری باشد، فرستندهٔ DM غیرمجاز در نظر گرفته می‌شود.

    هنگام استفاده از گروه‌های دسترسی مبتنی بر مخاطبان کانال، **Server Members Intent** را در Discord Developer Portal برای bot فعال کنید. DMها وضعیت عضو guild را شامل نمی‌شوند، بنابراین OpenClaw عضو را هنگام مجوزدهی از طریق REST در Discord resolve می‌کند.

  </Tab>

  <Tab title="Guild policy">
    مدیریت Guild با `channels.discord.groupPolicy` کنترل می‌شود:

    - `open`
    - `allowlist`
    - `disabled`

    مبنای امن وقتی `channels.discord` وجود دارد، `allowlist` است.

    رفتار `allowlist`:

    - guild باید با `channels.discord.guilds` مطابق باشد (`id` ترجیح داده می‌شود، slug پذیرفته می‌شود)
    - فهرست‌های مجاز اختیاری فرستنده: `users` (شناسه‌های پایدار توصیه می‌شود) و `roles` (فقط شناسه‌های role)؛ اگر هرکدام پیکربندی شود، فرستندگان وقتی با `users` یا `roles` مطابق باشند مجاز هستند
    - تطبیق مستقیم نام/برچسب به‌طور پیش‌فرض غیرفعال است؛ `channels.discord.dangerouslyAllowNameMatching: true` را فقط به‌عنوان حالت سازگاری اضطراری فعال کنید
    - نام‌ها/برچسب‌ها برای `users` پشتیبانی می‌شوند، اما شناسه‌ها امن‌تر هستند؛ `openclaw security audit` هنگام استفاده از ورودی‌های نام/برچسب هشدار می‌دهد
    - اگر یک guild دارای `channels` پیکربندی‌شده باشد، کانال‌های فهرست‌نشده رد می‌شوند
    - اگر یک guild بلوک `channels` نداشته باشد، همهٔ کانال‌ها در آن guild مجازشده پذیرفته می‌شوند

    مثال:
__OC_I18N_900013__
    اگر فقط `DISCORD_BOT_TOKEN` را تنظیم کنید و بلوک `channels.discord` نسازید، fallback زمان اجرا `groupPolicy="allowlist"` است (با یک هشدار در logها)، حتی اگر `channels.defaults.groupPolicy` مقدار `open` باشد.

  </Tab>

  <Tab title="Mentions and group DMs">
    پیام‌های Guild به‌طور پیش‌فرض با الزام به mention کنترل می‌شوند.

    تشخیص mention شامل موارد زیر است:

    - mention صریح bot
    - الگوهای mention پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، fallback `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی reply-to-bot در موارد پشتیبانی‌شده

    هنگام نوشتن پیام‌های خروجی Discord، از syntax canonical mention استفاده کنید: `<@USER_ID>` برای کاربران، `<#CHANNEL_ID>` برای کانال‌ها، و `<@&ROLE_ID>` برای roleها. از شکل قدیمی mention نام مستعار `<@!USER_ID>` استفاده نکنید.

    `requireMention` برای هر guild/channel پیکربندی می‌شود (`channels.discord.guilds...`).
    `ignoreOtherMentions` به‌صورت اختیاری پیام‌هایی را که کاربر/role دیگری را mention می‌کنند اما bot را mention نمی‌کنند حذف می‌کند (به‌جز @everyone/@here).

    Group DMها:

    - پیش‌فرض: نادیده گرفته می‌شوند (`dm.groupEnabled=false`)
    - فهرست مجاز اختیاری از طریق `dm.groupChannels` (شناسه‌های کانال یا slugها)

  </Tab>
</Tabs>

### مسیریابی عامل مبتنی بر role

از `bindings[].match.roles` برای مسیریابی اعضای guild در Discord به عامل‌های متفاوت بر اساس شناسهٔ role استفاده کنید. bindingهای مبتنی بر role فقط شناسه‌های role را می‌پذیرند و پس از bindingهای peer یا parent-peer و پیش از bindingهای فقط-guild ارزیابی می‌شوند. اگر یک binding فیلدهای match دیگری هم تنظیم کند (برای مثال `peer` + `guildId` + `roles`)، همهٔ فیلدهای پیکربندی‌شده باید مطابق باشند.
__OC_I18N_900014__
## فرمان‌های بومی و احراز هویت فرمان

- مقدار پیش‌فرض `commands.native` برابر `"auto"` است و برای Discord فعال است.
- بازنویسی به‌ازای هر کانال: `channels.discord.commands.native`.
- `commands.native=false` ثبت و پاک‌سازی فرمان‌های اسلش Discord را هنگام راه‌اندازی رد می‌کند. فرمان‌هایی که پیش‌تر ثبت شده‌اند ممکن است تا زمانی که آن‌ها را از برنامه Discord حذف کنید، همچنان در Discord قابل مشاهده بمانند.
- احراز هویت فرمان‌های بومی از همان فهرست‌های مجاز/سیاست‌های Discord استفاده می‌کند که پردازش عادی پیام استفاده می‌کند.
- فرمان‌ها ممکن است همچنان در رابط کاربری Discord برای کاربرانی که مجاز نیستند قابل مشاهده باشند؛ اجرا همچنان احراز هویت OpenClaw را اعمال می‌کند و "not authorized" برمی‌گرداند.

برای کاتالوگ فرمان‌ها و رفتار، [فرمان‌های اسلش](/tools/slash-commands) را ببینید.

تنظیمات پیش‌فرض فرمان اسلش:

- `ephemeral: true`

## جزئیات ویژگی

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord از برچسب‌های پاسخ در خروجی عامل پشتیبانی می‌کند:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    با `channels.discord.replyToMode` کنترل می‌شود:

    - `off` (پیش‌فرض)
    - `first`
    - `all`
    - `batched`

    نکته: `off` رشته‌سازی پاسخ ضمنی را غیرفعال می‌کند. برچسب‌های صریح `[[reply_to_*]]` همچنان رعایت می‌شوند.
    `first` همیشه مرجع پاسخ بومی ضمنی را به نخستین پیام خروجی Discord برای آن نوبت پیوست می‌کند.
    `batched` مرجع پاسخ بومی ضمنی Discord را فقط زمانی پیوست می‌کند که
    نوبت ورودی یک دسته چندپیامی debounce‌شده بوده باشد. این برای زمانی مفید است
    که پاسخ‌های بومی را عمدتا برای گفت‌وگوهای انفجاری و مبهم می‌خواهید، نه برای هر
    نوبت تک‌پیامی.

    شناسه‌های پیام در زمینه/تاریخچه نمایان می‌شوند تا عامل‌ها بتوانند پیام‌های مشخصی را هدف بگیرند.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw می‌تواند با ارسال یک پیام موقت و ویرایش آن هنگام رسیدن متن، پاسخ‌های پیش‌نویس را stream کند. `channels.discord.streaming` مقدارهای `off` | `partial` | `block` | `progress` (پیش‌فرض) را می‌پذیرد. `progress` یک پیش‌نویس وضعیت قابل ویرایش را نگه می‌دارد و تا تحویل نهایی آن را با پیشرفت ابزار به‌روزرسانی می‌کند؛ برچسب آغازگر مشترک یک خط چرخشی است، پس وقتی کار کافی ظاهر شود مانند باقی محتوا از دید خارج می‌شود. `streamMode` یک نام مستعار runtime قدیمی است. برای بازنویسی پیکربندی ذخیره‌شده به کلید canonical، `openclaw doctor --fix` را اجرا کنید.

    برای غیرفعال کردن ویرایش‌های پیش‌نمایش Discord، `channels.discord.streaming.mode` را روی `off` بگذارید. اگر streaming بلوکی Discord صراحتا فعال باشد، OpenClaw برای جلوگیری از streaming دوگانه، stream پیش‌نمایش را رد می‌کند.
__OC_I18N_900015__
    - `partial` هنگام رسیدن توکن‌ها، یک پیام پیش‌نمایش واحد را ویرایش می‌کند.
    - `block` تکه‌هایی در اندازه پیش‌نویس منتشر می‌کند (برای تنظیم اندازه و نقاط شکست، از `draftChunk` استفاده کنید؛ به `textChunkLimit` محدود می‌شود).
    - نهایی‌های رسانه، خطا، و پاسخ صریح، ویرایش‌های پیش‌نمایش معلق را لغو می‌کنند.
    - `streaming.preview.toolProgress` (پیش‌فرض `true`) کنترل می‌کند که آیا به‌روزرسانی‌های ابزار/پیشرفت از پیام پیش‌نمایش دوباره استفاده کنند یا نه.
    - ردیف‌های ابزار/پیشرفت، وقتی موجود باشند، به‌صورت emoji فشرده + عنوان + جزئیات نمایش داده می‌شوند، برای مثال `🛠️ Bash: run tests` یا `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` جزئیات فرمان/اجرا را در خطوط پیشرفت فشرده کنترل می‌کند: `raw` (پیش‌فرض) یا `status` (فقط برچسب ابزار).

    متن خام فرمان/اجرا را پنهان کنید و در عین حال خطوط پیشرفت فشرده را نگه دارید:
__OC_I18N_900016__
    streaming پیش‌نمایش فقط متنی است؛ پاسخ‌های رسانه‌ای به تحویل عادی fallback می‌کنند. وقتی streaming از نوع `block` صراحتا فعال باشد، OpenClaw برای جلوگیری از streaming دوگانه، stream پیش‌نمایش را رد می‌کند.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    زمینه تاریخچه guild:

    - پیش‌فرض `channels.discord.historyLimit` مقدار `20` است
    - fallback: `messages.groupChat.historyLimit`
    - `0` غیرفعال می‌کند

    کنترل‌های تاریخچه DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    رفتار thread:

    - threadهای Discord به‌عنوان sessionهای کانال route می‌شوند و مگر اینکه override شوند، پیکربندی کانال والد را به ارث می‌برند.
    - sessionهای thread انتخاب `/model` در سطح session کانال والد را فقط به‌عنوان fallback مدل به ارث می‌برند؛ انتخاب‌های thread-local مربوط به `/model` همچنان تقدم دارند و تاریخچه transcript والد کپی نمی‌شود مگر اینکه وراثت transcript فعال باشد.
    - `channels.discord.thread.inheritParent` (پیش‌فرض `false`) threadهای خودکار جدید را وارد seed شدن از transcript والد می‌کند. overrideهای هر حساب زیر `channels.discord.accounts.<id>.thread.inheritParent` قرار دارند.
    - واکنش‌های ابزار پیام می‌توانند هدف‌های DM از نوع `user:<id>` را resolve کنند.
    - `guilds.<guild>.channels.<channel>.requireMention: false` در fallback فعال‌سازی مرحله پاسخ حفظ می‌شود.

    موضوع‌های کانال به‌عنوان زمینه **غیرقابل اعتماد** تزریق می‌شوند. فهرست‌های مجاز مشخص می‌کنند چه کسی می‌تواند عامل را trigger کند، نه اینکه یک مرز کامل redaction برای زمینه تکمیلی باشند.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord می‌تواند یک thread را به یک هدف session bind کند تا پیام‌های بعدی در آن thread همچنان به همان session route شوند (از جمله sessionهای subagent).

    فرمان‌ها:

    - `/focus <target>` thread فعلی/جدید را به یک هدف subagent/session bind می‌کند
    - `/unfocus` binding thread فعلی را حذف می‌کند
    - `/agents` اجراهای فعال و وضعیت binding را نشان می‌دهد
    - `/session idle <duration|off>` auto-unfocus ناشی از عدم فعالیت را برای bindingهای focused بررسی/به‌روزرسانی می‌کند
    - `/session max-age <duration|off>` حداکثر سن سخت را برای bindingهای focused بررسی/به‌روزرسانی می‌کند

    پیکربندی:
__OC_I18N_900017__
    نکته‌ها:

    - `session.threadBindings.*` پیش‌فرض‌های سراسری را تنظیم می‌کند.
    - `channels.discord.threadBindings.*` رفتار Discord را override می‌کند.
    - `spawnSessions` ایجاد/bind خودکار threadها را برای `sessions_spawn({ thread: true })` و spawnهای thread در ACP کنترل می‌کند. پیش‌فرض: `true`.
    - `defaultSpawnContext` زمینه subagent بومی را برای spawnهای thread-bound کنترل می‌کند. پیش‌فرض: `"fork"`.
    - کلیدهای منسوخ `spawnSubagentSessions`/`spawnAcpSessions` توسط `openclaw doctor --fix` migrate می‌شوند.
    - اگر bindingهای thread برای یک حساب غیرفعال باشند، `/focus` و عملیات مرتبط با binding thread در دسترس نیستند.

    [Sub-agents](/tools/subagents)، [عامل‌های ACP](/tools/acp-agents)، و [مرجع پیکربندی](/gateway/configuration-reference) را ببینید.

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    برای workspaceهای پایدار و "always-on" در ACP، bindingهای ACP تایپ‌شده سطح بالا را پیکربندی کنید که مکالمات Discord را هدف می‌گیرند.

    مسیر پیکربندی:

    - `bindings[]` با `type: "acp"` و `match.channel: "discord"`

    مثال:
__OC_I18N_900018__
    نکته‌ها:

    - `/acp spawn codex --bind here` کانال یا thread فعلی را در همان‌جا bind می‌کند و پیام‌های آینده را روی همان session ACP نگه می‌دارد. پیام‌های thread، binding کانال والد را به ارث می‌برند.
    - در یک کانال یا thread bindشده، `/new` و `/reset` همان session ACP را در همان‌جا reset می‌کنند. bindingهای موقت thread می‌توانند تا زمانی که فعال‌اند، resolution هدف را override کنند.
    - `spawnSessions` ایجاد/binding thread فرزند را از طریق `--thread auto|here` gate می‌کند.

    برای جزئیات رفتار binding، [عامل‌های ACP](/tools/acp-agents) را ببینید.

  </Accordion>

  <Accordion title="Reaction notifications">
    حالت notification واکنش به‌ازای هر guild:

    - `off`
    - `own` (پیش‌فرض)
    - `all`
    - `allowlist` (از `guilds.<id>.users` استفاده می‌کند)

    رویدادهای واکنش به رویدادهای system تبدیل می‌شوند و به session route‌شده Discord پیوست می‌شوند.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` هنگام پردازش پیام ورودی توسط OpenClaw، یک emoji تأیید می‌فرستد.

    ترتیب resolution:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

    نکته‌ها:

    - Discord emoji یونیکد یا نام‌های emoji سفارشی را می‌پذیرد.
    - برای غیرفعال کردن واکنش برای یک کانال یا حساب، از `""` استفاده کنید.

  </Accordion>

  <Accordion title="Config writes">
    نوشتن پیکربندی آغازشده از کانال به‌طور پیش‌فرض فعال است.

    این روی جریان‌های `/config set|unset` اثر می‌گذارد (وقتی ویژگی‌های فرمان فعال باشند).

    غیرفعال‌سازی:
__OC_I18N_900019__
  </Accordion>

  <Accordion title="Gateway proxy">
    ترافیک WebSocket مربوط به Gateway در Discord و lookupهای REST هنگام راه‌اندازی (شناسه برنامه + resolution فهرست مجاز) را با `channels.discord.proxy` از طریق یک proxy HTTP(S) route کنید.
__OC_I18N_900020__
    override به‌ازای هر حساب:
__OC_I18N_900021__
  </Accordion>

  <Accordion title="PluralKit support">
    resolution مربوط به PluralKit را فعال کنید تا پیام‌های proxied به هویت عضو system نگاشت شوند:
__OC_I18N_900022__
    نکته‌ها:

    - فهرست‌های مجاز می‌توانند از `pk:<memberId>` استفاده کنند
    - نام‌های نمایشی عضو فقط وقتی `channels.discord.dangerouslyAllowNameMatching: true` باشد، با name/slug تطبیق داده می‌شوند
    - lookupها از شناسه پیام اصلی استفاده می‌کنند و با پنجره زمانی محدود می‌شوند
    - اگر lookup شکست بخورد، پیام‌های proxied به‌عنوان پیام bot در نظر گرفته می‌شوند و حذف می‌شوند مگر اینکه `allowBots=true` باشد

  </Accordion>

  <Accordion title="Outbound mention aliases">
    وقتی عامل‌ها برای کاربران شناخته‌شده Discord به mentionهای خروجی قطعی نیاز دارند، از `mentionAliases` استفاده کنید. کلیدها handleهای بدون `@` ابتدایی هستند؛ مقدارها شناسه‌های کاربر Discord هستند. handleهای ناشناخته، `@everyone`، `@here`، و mentionهای داخل code spanهای Markdown بدون تغییر می‌مانند.
__OC_I18N_900023__
  </Accordion>

  <Accordion title="Presence configuration">
    وقتی یک فیلد status یا activity را تنظیم می‌کنید، یا وقتی auto presence را فعال می‌کنید، به‌روزرسانی‌های presence اعمال می‌شوند.

    مثال فقط status:
__OC_I18N_900024__
    مثال activity (custom status نوع activity پیش‌فرض است):
__OC_I18N_900025__
    مثال streaming:
__OC_I18N_900026__
    نگاشت نوع activity:

    - 0: در حال بازی
    - 1: در حال Streaming (به `activityUrl` نیاز دارد)
    - 2: در حال گوش دادن
    - 3: در حال تماشا
    - 4: سفارشی (از متن فعالیت به‌عنوان وضعیت استفاده می‌کند؛ emoji اختیاری است)
    - 5: در حال رقابت

    نمونه حضور خودکار (سیگنال سلامت زمان اجرا):
__OC_I18N_900027__
    حضور خودکار، دسترس‌پذیری زمان اجرا را به وضعیت Discord نگاشت می‌کند: سالم => آنلاین، تنزل‌یافته یا ناشناخته => بیکار، تمام‌شده یا دردسترس‌نبودن => dnd. بازنویسی‌های متنی اختیاری:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (از جای‌نگهدار `{reason}` پشتیبانی می‌کند)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord از مدیریت تأیید مبتنی بر دکمه در پیام‌های مستقیم پشتیبانی می‌کند و می‌تواند به‌صورت اختیاری اعلان‌های تأیید را در کانال مبدأ ارسال کند.

    مسیر پیکربندی:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` بازمی‌گردد)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک تأییدکننده قابل تشخیص باشد، چه از `execApprovals.approvers` و چه از `commands.ownerAllowFrom`، Discord تأییدهای بومی exec را به‌طور خودکار فعال می‌کند. Discord تأییدکنندگان exec را از `allowFrom` کانال، `dm.allowFrom` قدیمی، یا `defaultTo` پیام مستقیم استنتاج نمی‌کند. برای غیرفعال‌کردن صریح Discord به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.

    برای فرمان‌های گروهی حساس و فقط مالک، مانند `/diagnostics` و `/export-trajectory`، OpenClaw اعلان‌های تأیید و نتایج نهایی را به‌صورت خصوصی ارسال می‌کند. وقتی مالک فراخواننده مسیر مالک Discord داشته باشد، ابتدا پیام مستقیم Discord را امتحان می‌کند؛ اگر دردسترس نباشد، به نخستین مسیر مالک دردسترس از `commands.ownerAllowFrom`، مانند Telegram، بازمی‌گردد.

    وقتی `target` برابر `channel` یا `both` باشد، اعلان تأیید در کانال قابل مشاهده است. فقط تأییدکنندگان تشخیص‌داده‌شده می‌توانند از دکمه‌ها استفاده کنند؛ کاربران دیگر یک رد موقتی دریافت می‌کنند. اعلان‌های تأیید شامل متن فرمان هستند، بنابراین تحویل کانالی را فقط در کانال‌های مورد اعتماد فعال کنید. اگر شناسه کانال از کلید نشست قابل استخراج نباشد، OpenClaw به تحویل از طریق پیام مستقیم بازمی‌گردد.

    Discord همچنین دکمه‌های تأیید مشترکی را که کانال‌های گفت‌وگوی دیگر استفاده می‌کنند نمایش می‌دهد. آداپتر بومی Discord عمدتاً مسیریابی پیام مستقیم تأییدکننده و پخش به کانال را اضافه می‌کند.
    وقتی آن دکمه‌ها وجود دارند، تجربه کاربری اصلی تأیید هستند؛ OpenClaw
    فقط زمانی باید فرمان دستی `/approve` را درج کند که نتیجه ابزار بگوید
    تأییدهای گفت‌وگو دردسترس نیستند یا تأیید دستی تنها مسیر است.
    اگر زمان‌اجرای تأیید بومی Discord فعال نباشد، OpenClaw اعلان
    قطعی محلی `/approve <id> <decision>` را قابل مشاهده نگه می‌دارد. اگر
    زمان اجرا فعال باشد اما یک کارت بومی به هیچ مقصدی قابل تحویل نباشد،
    OpenClaw یک اعلان جایگزین در همان گفت‌وگو با فرمان دقیق `/approve`
    از تأیید در انتظار ارسال می‌کند.

    احراز هویت Gateway و حل تأیید از قرارداد مشترک کلاینت Gateway پیروی می‌کنند (شناسه‌های `plugin:` از طریق `plugin.approval.resolve` حل می‌شوند؛ شناسه‌های دیگر از طریق `exec.approval.resolve`). تأییدها به‌طور پیش‌فرض پس از ۳۰ دقیقه منقضی می‌شوند.

    [تأییدهای Exec](/tools/exec-approvals) را ببینید.

  </Accordion>
</AccordionGroup>

## ابزارها و دروازه‌های اقدام

اقدام‌های پیام Discord شامل پیام‌رسانی، مدیریت کانال، نظارت، حضور، و اقدام‌های فراداده هستند.

نمونه‌های اصلی:

- پیام‌رسانی: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- واکنش‌ها: `react`، `reactions`، `emojiList`
- نظارت: `timeout`، `kick`، `ban`
- حضور: `setPresence`

اقدام `event-create` یک پارامتر اختیاری `image` (URL یا مسیر فایل محلی) می‌پذیرد تا تصویر جلد رویداد زمان‌بندی‌شده را تنظیم کند.

دروازه‌های اقدام زیر `channels.discord.actions.*` قرار دارند.

رفتار پیش‌فرض دروازه:

| گروه اقدام                                                                                                                                                              | پیش‌فرض  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions، messages، threads، pins، polls، search، memberInfo، roleInfo، channelInfo، channels، voiceStatus، events، stickers، emojiUploads، stickerUploads، permissions | فعال     |
| roles                                                                                                                                                                    | غیرفعال |
| moderation                                                                                                                                                               | غیرفعال |
| presence                                                                                                                                                                 | غیرفعال |

## رابط کاربری Components v2

OpenClaw برای تأییدهای exec و نشانگرهای میان‌بافتاری از Discord components v2 استفاده می‌کند. اقدام‌های پیام Discord همچنین می‌توانند برای رابط کاربری سفارشی `components` بپذیرند (پیشرفته؛ نیازمند ساخت payload مؤلفه از طریق ابزار discord)، درحالی‌که `embeds` قدیمی همچنان دردسترس هستند اما توصیه نمی‌شوند.

- `channels.discord.ui.components.accentColor` رنگ تاکیدی استفاده‌شده توسط کانتینرهای مؤلفه Discord را تنظیم می‌کند (hex).
- برای هر حساب با `channels.discord.accounts.<id>.ui.components.accentColor` تنظیم کنید.
- وقتی components v2 وجود داشته باشد، `embeds` نادیده گرفته می‌شود.

نمونه:
__OC_I18N_900028__
## صدا

Discord دو سطح صوتی متمایز دارد: **کانال‌های صوتی** بی‌درنگ (مکالمه‌های پیوسته) و **پیوست‌های پیام صوتی** (قالب پیش‌نمایش موجی). Gateway از هر دو پشتیبانی می‌کند.

### کانال‌های صوتی

فهرست راه‌اندازی:

1. Message Content Intent را در Discord Developer Portal فعال کنید.
2. وقتی فهرست‌های مجاز نقش/کاربر استفاده می‌شوند، Server Members Intent را فعال کنید.
3. بات را با دامنه‌های `bot` و `applications.commands` دعوت کنید.
4. در کانال صوتی مقصد، مجوزهای Connect، Speak، Send Messages، و Read Message History را اعطا کنید.
5. فرمان‌های بومی (`commands.native` یا `channels.discord.commands.native`) را فعال کنید.
6. `channels.discord.voice` را پیکربندی کنید.

برای کنترل نشست‌ها از `/vc join|leave|status` استفاده کنید. این فرمان از عامل پیش‌فرض حساب استفاده می‌کند و از همان قوانین فهرست مجاز و خط‌مشی گروهی سایر فرمان‌های Discord پیروی می‌کند.
__OC_I18N_900029__
برای بررسی مجوزهای مؤثر بات پیش از پیوستن، اجرا کنید:
__OC_I18N_900030__
نمونه پیوستن خودکار:
__OC_I18N_900031__
نکته‌ها:

- `voice.tts` فقط برای پخش صوتی `stt-tts`، `messages.tts` را بازنویسی می‌کند. حالت‌های بلادرنگ از `voice.realtime.voice` استفاده می‌کنند.
- `voice.mode` مسیر مکالمه را کنترل می‌کند. مقدار پیش‌فرض `agent-proxy` است: یک پیشانی صوتی بلادرنگ زمان‌بندی نوبت، وقفه و پخش را مدیریت می‌کند، کارهای محتوایی را از طریق `openclaw_agent_consult` به عامل OpenClaw مسیریابی‌شده واگذار می‌کند، و نتیجه را مانند یک درخواست تایپ‌شده Discord از همان گوینده در نظر می‌گیرد. `stt-tts` جریان قدیمی‌تر STT دسته‌ای به‌همراه TTS را نگه می‌دارد. `bidi` به مدل بلادرنگ اجازه می‌دهد مستقیما مکالمه کند، در حالی که `openclaw_agent_consult` را برای مغز OpenClaw در دسترس می‌گذارد.
- `voice.agentSession` کنترل می‌کند کدام مکالمه OpenClaw نوبت‌های صوتی را دریافت کند. آن را تنظیم‌نشده بگذارید تا از نشست خود کانال صوتی استفاده شود، یا `{ mode: "target", target: "channel:<text-channel-id>" }` را تنظیم کنید تا کانال صوتی به‌عنوان افزونه میکروفون/بلندگوی یک نشست موجود کانال متنی Discord مانند `#maintainers` عمل کند.
- `voice.model` مغز عامل OpenClaw را برای پاسخ‌های صوتی Discord و مشورت‌های بلادرنگ بازنویسی می‌کند. آن را تنظیم‌نشده بگذارید تا مدل عامل مسیریابی‌شده به ارث برسد. این گزینه از `voice.realtime.model` جدا است.
- `agent-proxy` گفتار را از طریق `discord-voice` مسیریابی می‌کند؛ این مسیر مجوزدهی عادی مالک/ابزار را برای گوینده و نشست هدف حفظ می‌کند، اما ابزار `tts` عامل را پنهان می‌کند، چون صوت Discord مالک پخش است. به‌صورت پیش‌فرض، `agent-proxy` برای گویندگان مالک، دسترسی ابزار کامل معادل مالک را به مشورت می‌دهد (`voice.realtime.toolPolicy: "owner"`) و قویا ترجیح می‌دهد پیش از پاسخ‌های محتوایی با عامل OpenClaw مشورت کند (`voice.realtime.consultPolicy: "always"`). در آن حالت پیش‌فرض `always`، لایه بلادرنگ پیش از پاسخ مشورت، متن پرکننده را به‌صورت خودکار نمی‌خواند؛ گفتار را ضبط و رونویسی می‌کند، سپس پاسخ مسیریابی‌شده OpenClaw را می‌خواند. اگر چند پاسخ مشورت اجباری در حالی تمام شوند که Discord هنوز در حال پخش پاسخ اول است، پاسخ‌های گفتار دقیق بعدی تا زمان بیکار شدن پخش در صف می‌مانند و گفتار را در میانه جمله جایگزین نمی‌کنند.
- در حالت `stt-tts`، STT از `tools.media.audio` استفاده می‌کند؛ `voice.model` روی رونویسی اثری ندارد.
- در حالت‌های بلادرنگ، `voice.realtime.provider`، `voice.realtime.model` و `voice.realtime.voice` نشست صوتی بلادرنگ را پیکربندی می‌کنند. برای OpenAI Realtime 2 همراه با مغز Codex، از `voice.realtime.model: "gpt-realtime-2"` و `voice.model: "openai-codex/gpt-5.5"` استفاده کنید.
- ارائه‌دهنده بلادرنگ OpenAI نام‌های رویداد فعلی Realtime 2 و نام‌های مستعار قدیمی سازگار با Codex را برای رویدادهای صوت خروجی و رونویسی می‌پذیرد، بنابراین snapshotهای سازگار ارائه‌دهنده می‌توانند بدون از دست رفتن صدای دستیار تغییر کنند.
- `voice.realtime.bargeIn` کنترل می‌کند آیا رویدادهای شروع صحبت گوینده در Discord پخش بلادرنگ فعال را قطع کنند یا نه. اگر تنظیم نشده باشد، از تنظیم وقفه صوت ورودی ارائه‌دهنده بلادرنگ پیروی می‌کند.
- `voice.realtime.minBargeInAudioEndMs` حداقل مدت پخش دستیار پیش از آن را کنترل می‌کند که یک barge-in بلادرنگ OpenAI صدا را کوتاه کند. پیش‌فرض: `250`. برای وقفه فوری در اتاق‌های کم‌اکو مقدار `0` را تنظیم کنید، یا برای چیدمان‌های بلندگوی پر‌اکو آن را افزایش دهید.
- برای صدای OpenAI روی پخش Discord، `voice.tts.provider: "openai"` را تنظیم کنید و یک صدای Text-to-speech را زیر `voice.tts.openai.voice` یا `voice.tts.providers.openai.voice` انتخاب کنید. `cedar` روی مدل فعلی TTS OpenAI گزینه خوبی با صدای مردانه است.
- بازنویسی‌های `systemPrompt` مخصوص هر کانال Discord روی نوبت‌های رونویسی صوتی آن کانال صوتی اعمال می‌شوند.
- نوبت‌های رونویسی صوتی وضعیت مالک را از `allowFrom` در Discord (یا `dm.allowFrom`) به‌دست می‌آورند؛ گویندگان غیرمالک نمی‌توانند به ابزارهای فقط مالک دسترسی داشته باشند (برای مثال `gateway` و `cron`).
- صدای Discord برای پیکربندی‌های فقط متنی اختیاری است؛ برای فعال کردن فرمان‌های `/vc`، زمان اجرای صوتی و intent مربوط به Gateway با نام `GuildVoiceStates`، مقدار `channels.discord.voice.enabled=true` را تنظیم کنید (یا یک بلوک موجود `channels.discord.voice` را نگه دارید).
- `channels.discord.intents.voiceStates` می‌تواند اشتراک intent وضعیت صوتی را صریحا بازنویسی کند. آن را تنظیم‌نشده بگذارید تا intent از فعال‌سازی موثر صوتی پیروی کند.
- اگر `voice.autoJoin` چند ورودی برای همان guild داشته باشد، OpenClaw به آخرین کانال پیکربندی‌شده برای آن guild می‌پیوندد.
- `voice.allowedChannels` یک فهرست مجاز اقامت اختیاری است. آن را تنظیم‌نشده بگذارید تا `/vc join` بتواند وارد هر کانال صوتی مجاز Discord شود. وقتی تنظیم شود، `/vc join`، پیوستن خودکار هنگام راه‌اندازی و جابه‌جایی‌های وضعیت صوتی ربات به ورودی‌های فهرست‌شده `{ guildId, channelId }` محدود می‌شوند. برای رد کردن همه پیوستن‌های صوتی Discord، آن را روی آرایه خالی تنظیم کنید. اگر Discord ربات را به بیرون از فهرست مجاز منتقل کند، OpenClaw آن کانال را ترک می‌کند و وقتی هدف پیوستن خودکار پیکربندی‌شده‌ای موجود باشد، دوباره به آن می‌پیوندد.
- `voice.daveEncryption` و `voice.decryptionFailureTolerance` مستقیما به گزینه‌های join در `@discordjs/voice` منتقل می‌شوند.
- اگر تنظیم نشده باشند، پیش‌فرض‌های `@discordjs/voice` برابر `daveEncryption=true` و `decryptionFailureTolerance=24` هستند.
- OpenClaw برای دریافت صدای Discord به‌صورت پیش‌فرض از رمزگشای pure-JS با نام `opusscript` استفاده می‌کند. بسته بومی اختیاری `@discordjs/opus` توسط سیاست نصب pnpm این مخزن نادیده گرفته می‌شود تا نصب‌های عادی، مسیرهای Docker و آزمون‌های نامرتبط یک افزونه بومی را کامپایل نکنند. میزبان‌های اختصاصی عملکرد صوتی می‌توانند پس از نصب افزونه بومی، با `OPENCLAW_DISCORD_OPUS_DECODER=native` آن را فعال کنند.
- `voice.connectTimeoutMs` انتظار اولیه Ready در `@discordjs/voice` را برای تلاش‌های `/vc join` و پیوستن خودکار کنترل می‌کند. پیش‌فرض: `30000`.
- `voice.reconnectGraceMs` کنترل می‌کند OpenClaw چه مدت منتظر بماند تا یک نشست صوتی قطع‌شده شروع به اتصال دوباره کند، پیش از آنکه آن را از بین ببرد. پیش‌فرض: `15000`.
- در حالت `stt-tts`، پخش صوتی فقط به این دلیل که کاربر دیگری شروع به صحبت می‌کند متوقف نمی‌شود. برای جلوگیری از حلقه‌های بازخورد، OpenClaw هنگام پخش TTS ضبط صوت جدید را نادیده می‌گیرد؛ برای نوبت بعدی پس از پایان پخش صحبت کنید. حالت‌های بلادرنگ شروع صحبت گوینده را به‌عنوان سیگنال‌های barge-in به ارائه‌دهنده بلادرنگ ارسال می‌کنند.
- در حالت‌های بلادرنگ، اکوی بلندگوها به میکروفون باز می‌تواند شبیه barge-in به نظر برسد و پخش را قطع کند. برای اتاق‌های Discord پر‌اکو، `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید تا OpenAI روی صوت ورودی به‌صورت خودکار وقفه ایجاد نکند. اگر همچنان می‌خواهید رویدادهای شروع صحبت گوینده در Discord پخش فعال را قطع کنند، `voice.realtime.bargeIn: true` را اضافه کنید. پل بلادرنگ OpenAI کوتاه‌سازی‌های پخش کوتاه‌تر از `voice.realtime.minBargeInAudioEndMs` را به‌عنوان اکوی/نویز محتمل نادیده می‌گیرد و به‌جای پاک کردن پخش Discord، آن‌ها را به‌عنوان skipped ثبت می‌کند.
- `voice.captureSilenceGraceMs` کنترل می‌کند OpenClaw پس از آنکه Discord گزارش می‌دهد گوینده صحبت را متوقف کرده است، چه مدت منتظر بماند پیش از نهایی کردن آن قطعه صوتی برای STT. پیش‌فرض: `2500`؛ اگر Discord مکث‌های عادی را به رونویسی‌های تکه‌تکه و ناپیوسته تقسیم می‌کند، این مقدار را افزایش دهید.
- وقتی ElevenLabs ارائه‌دهنده TTS انتخاب‌شده باشد، پخش صوتی Discord از TTS جریانی استفاده می‌کند و از جریان پاسخ ارائه‌دهنده شروع می‌شود. ارائه‌دهندگانی که پشتیبانی جریانی ندارند به مسیر فایل موقت سنتز‌شده برمی‌گردند.
- OpenClaw همچنین خطاهای رمزگشایی دریافت را زیر نظر می‌گیرد و پس از خطاهای تکراری در یک پنجره کوتاه، با ترک کردن و پیوستن دوباره به کانال صوتی، به‌صورت خودکار بازیابی می‌کند.
- اگر پس از به‌روزرسانی، لاگ‌های دریافت به‌طور مکرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` را نشان می‌دهند، یک گزارش وابستگی و لاگ‌ها را جمع‌آوری کنید. خط همراه `@discordjs/voice` شامل اصلاح padding بالادستی از PR #11449 در discord.js است که issue #11419 در discord.js را بست.
- رویدادهای دریافت `The operation was aborted` زمانی که OpenClaw یک قطعه ضبط‌شده از گوینده را نهایی می‌کند مورد انتظار هستند؛ این‌ها تشخیص‌های پرجزئیات‌اند، نه هشدار.
- لاگ‌های پرجزئیات صدای Discord برای هر قطعه پذیرفته‌شده از گوینده، یک پیش‌نمایش تک‌خطی محدود از رونویسی STT دارند، بنابراین اشکال‌زدایی بدون تخلیه متن نامحدود رونویسی، هم سمت کاربر و هم سمت پاسخ عامل را نشان می‌دهد.
- در حالت `agent-proxy`، fallback مشورت اجباری قطعه‌های رونویسی احتمالا ناقص را رد می‌کند، مانند متنی که به `...` یا یک اتصال‌دهنده پایانی مثل `and` ختم می‌شود، به‌علاوه پایان‌بندی‌های آشکارا غیرقابل‌اقدام مانند “be right back” یا “bye”. وقتی این کار مانع یک پاسخ صف‌شده قدیمی شود، لاگ‌ها `forced agent consult skipped reason=...` را نشان می‌دهند.

راه‌اندازی opus بومی برای checkoutهای سورس:
__OC_I18N_900032__
وقتی افزونه بومی ازپیش‌ساخته macOS arm64 بالادستی را می‌خواهید، برای Gateway از Node 22 استفاده کنید. اگر از زمان اجرای Node دیگری استفاده می‌کنید، نصب‌کننده اختیاری ممکن است به یک toolchain ساخت از سورس محلی `node-gyp` نیاز داشته باشد.

پس از نصب افزونه بومی، Gateway را با این دستور شروع کنید:
__OC_I18N_900033__
لاگ‌های پرجزئیات صوتی باید `discord voice: opus decoder: @discordjs/opus` را نشان دهند. بدون فعال‌سازی env، یا اگر افزونه بومی وجود نداشته باشد یا روی میزبان بارگذاری نشود، OpenClaw مقدار `discord voice: opus decoder: opusscript` را لاگ می‌کند و دریافت صوت را از طریق fallback pure-JS ادامه می‌دهد.

پایپ‌لاین STT به‌همراه TTS:

- ضبط PCM در Discord به یک فایل موقت WAV تبدیل می‌شود.
- `tools.media.audio`، STT را مدیریت می‌کند، برای مثال `openai/gpt-4o-mini-transcribe`.
- رونویسی از طریق ورودی و مسیریابی Discord فرستاده می‌شود، در حالی که LLM پاسخ با سیاست خروجی صوتی اجرا می‌شود که ابزار `tts` عامل را پنهان می‌کند و متن بازگشتی می‌خواهد، چون صوت Discord مالک پخش نهایی TTS است.
- وقتی `voice.model` تنظیم شده باشد، فقط LLM پاسخ را برای این نوبت کانال صوتی بازنویسی می‌کند.
- `voice.tts` روی `messages.tts` ادغام می‌شود؛ ارائه‌دهندگان با قابلیت جریان مستقیما پخش‌کننده را تغذیه می‌کنند، در غیر این صورت فایل صوتی حاصل در کانال پیوسته‌شده پخش می‌شود.

نمونه نشست پیش‌فرض کانال صوتی agent-proxy:
__OC_I18N_900034__
بدون بلوک `voice.agentSession`، هر کانال صوتی نشست مسیریابی‌شده OpenClaw خودش را می‌گیرد. برای مثال، `/vc join channel:234567890123456789` با نشست مربوط به آن کانال صوتی Discord صحبت می‌کند. مدل بلادرنگ فقط پیشانی صوتی است؛ درخواست‌های محتوایی به عامل پیکربندی‌شده OpenClaw سپرده می‌شوند. اگر مدل بلادرنگ بدون فراخوانی ابزار مشورت یک رونویسی نهایی تولید کند، OpenClaw مشورت را به‌عنوان fallback اجباری می‌کند تا رفتار پیش‌فرض همچنان مانند صحبت کردن با عامل باشد.

نمونه قدیمی STT به‌همراه TTS:
__OC_I18N_900035__
نمونه bidi بلادرنگ:
__OC_I18N_900036__
صوت به‌عنوان افزونه نشست یک کانال موجود Discord:
__OC_I18N_900037__
در حالت `agent-proxy`، ربات به کانال صوتی پیکربندی‌شده می‌پیوندد، اما نوبت‌های عامل OpenClaw از نشست و عامل مسیریابی‌شده عادی کانال هدف استفاده می‌کنند. نشست صوتی بلادرنگ نتیجه بازگشتی را دوباره در کانال صوتی می‌خواند. عامل ناظر همچنان می‌تواند طبق سیاست ابزار خود از ابزارهای پیام عادی استفاده کند، از جمله ارسال یک پیام جداگانه Discord اگر اقدام درست همین باشد.

شکل‌های مفید هدف:

- `target: "channel:123456789012345678"` از طریق نشست یک کانال متنی Discord مسیریابی می‌کند.
- `target: "123456789012345678"` به‌عنوان هدف کانال در نظر گرفته می‌شود.
- `target: "dm:123456789012345678"` یا `target: "user:123456789012345678"` از طریق آن نشست پیام مستقیم مسیریابی می‌کند.

نمونه OpenAI Realtime برای محیط‌های پر‌اکو:
__OC_I18N_900038__
از این زمانی استفاده کنید که مدل پخش صدای خودش در Discord را از طریق میکروفون باز می‌شنود، اما همچنان می‌خواهید با صحبت کردن آن را قطع کنید. OpenClaw جلوی قطع خودکار OpenAI بر اساس صدای ورودی خام را می‌گیرد، در حالی که `bargeIn: true` به رویدادهای شروع صحبت گوینده در Discord و صدای گوینده‌ای که از قبل فعال است اجازه می‌دهد پاسخ‌های بی‌درنگ فعال را پیش از آنکه نوبت ضبط‌شده بعدی به OpenAI برسد، لغو کنند. سیگنال‌های بسیار زودهنگام ورود بین صحبت با `audioEndMs` کمتر از `minBargeInAudioEndMs` به‌عنوان پژواک/نویز محتمل در نظر گرفته و نادیده گرفته می‌شوند تا مدل در اولین فریم پخش قطع نشود.

لاگ‌های صوتی مورد انتظار:

- هنگام پیوستن: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- هنگام شروع بی‌درنگ: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- هنگام صدای گوینده: `discord voice: realtime speaker turn opened ...`، `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`، و `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- هنگام گفتار قدیمی ردشده: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` یا `reason=non-actionable-closing ...`
- هنگام تکمیل پاسخ بی‌درنگ: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- هنگام توقف/بازنشانی پخش: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- هنگام مشورت بی‌درنگ: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- هنگام پاسخ عامل: `discord voice: agent turn answer ...`
- هنگام گفتار دقیق صف‌شده: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، به‌دنبال آن `discord voice: realtime exact speech dequeued reason=player-idle ...`
- هنگام تشخیص ورود بین صحبت: `discord voice: realtime barge-in detected source=speaker-start ...` یا `discord voice: realtime barge-in detected source=active-speaker-audio ...`، به‌دنبال آن `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- هنگام وقفه بی‌درنگ: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، به‌دنبال آن یا `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` یا `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- هنگام پژواک/نویز نادیده‌گرفته‌شده: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- هنگام ورود بین صحبت غیرفعال: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- هنگام پخش بیکار: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

برای اشکال‌زدایی صدای قطع‌شده، لاگ‌های صدای بی‌درنگ را به‌صورت یک خط زمانی بخوانید:

1. `realtime audio playback started` یعنی Discord شروع به پخش صدای دستیار کرده است. پل از این نقطه شمارش قطعه‌های خروجی دستیار، بایت‌های PCM مربوط به Discord، بایت‌های بی‌درنگ ارائه‌دهنده، و مدت صدای ساخته‌شده را آغاز می‌کند.
2. `realtime speaker turn opened` فعال شدن یک گوینده در Discord را نشان می‌دهد. اگر پخش از قبل فعال باشد و `bargeIn` فعال شده باشد، این می‌تواند با `barge-in detected source=speaker-start` دنبال شود.
3. `realtime input audio started` اولین فریم صوتی واقعی دریافتی برای آن نوبت گوینده را نشان می‌دهد. `outputActive=true` یا `outputAudioMs` غیرصفر در اینجا یعنی میکروفون در حالی ورودی می‌فرستد که پخش دستیار هنوز فعال است.
4. `barge-in detected source=active-speaker-audio` یعنی OpenClaw هنگام فعال بودن پخش دستیار، صدای زنده گوینده را دیده است. این برای تمایز یک وقفه واقعی از رویداد شروع گوینده در Discord که صدای مفیدی ندارد، کاربردی است.
5. `barge-in requested reason=...` یعنی OpenClaw از ارائه‌دهنده بی‌درنگ خواسته پاسخ فعال را لغو یا کوتاه کند. شامل `outputAudioMs`، `outputActive`، و `playbackChunks` است تا ببینید پیش از وقفه واقعاً چه مقدار صدای دستیار پخش شده بود.
6. `realtime audio playback stopped reason=...` نقطه بازنشانی پخش محلی Discord است. دلیل نشان می‌دهد چه چیزی پخش را متوقف کرده است: `barge-in`، `player-idle`، `provider-clear-audio`، `forced-agent-consult`، `stream-close`، یا `session-close`.
7. `realtime speaker turn closed` نوبت ورودی ضبط‌شده را خلاصه می‌کند. `chunks=0` یا `hasAudio=false` یعنی نوبت گوینده باز شده اما هیچ صدای قابل استفاده‌ای به پل بی‌درنگ نرسیده است. `interruptedPlayback=true` یعنی آن نوبت ورودی با خروجی دستیار هم‌پوشانی داشته و منطق ورود بین صحبت را فعال کرده است.

فیلدهای مفید:

- `outputAudioMs`: مدت صدای دستیار که ارائه‌دهنده بی‌درنگ پیش از خط لاگ تولید کرده است.
- `audioMs`: مدت صدای دستیار که OpenClaw پیش از توقف پخش شمارش کرده است.
- `elapsedMs`: زمان ساعت دیواری بین باز و بسته شدن جریان پخش یا نوبت گوینده.
- `discordBytes`: بایت‌های PCM استریوی 48 کیلوهرتز که به صدای Discord ارسال شده یا از آن دریافت شده‌اند.
- `realtimeBytes`: بایت‌های PCM با قالب ارائه‌دهنده که به ارائه‌دهنده بی‌درنگ ارسال شده یا از آن دریافت شده‌اند.
- `playbackChunks`: قطعه‌های صدای دستیار که برای پاسخ فعال به Discord فرستاده شده‌اند.
- `sinceLastAudioMs`: فاصله بین آخرین فریم صدای گوینده ضبط‌شده و بسته شدن نوبت گوینده.

الگوهای رایج:

- قطع فوری با `source=active-speaker-audio`، `outputAudioMs` کوچک، و همان کاربر در نزدیکی معمولاً نشان می‌دهد پژواک بلندگو وارد میکروفون شده است. `voice.realtime.minBargeInAudioEndMs` را افزایش دهید، صدای بلندگو را کم کنید، از هدفون استفاده کنید، یا `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` را تنظیم کنید.
- `source=speaker-start` که با `speaker turn closed ... hasAudio=false` دنبال می‌شود یعنی Discord شروع یک گوینده را گزارش کرده اما هیچ صدایی به OpenClaw نرسیده است. این می‌تواند یک رویداد گذرای صدای Discord، رفتار گیت نویز، یا فعال شدن کوتاه میکروفون توسط یک کلاینت باشد.
- `audio playback stopped reason=stream-close` بدون ورود بین صحبت نزدیک یا `provider-clear-audio` یعنی جریان پخش محلی Discord به‌طور غیرمنتظره پایان یافته است. لاگ‌های قبلی ارائه‌دهنده و پخش‌کننده Discord را بررسی کنید.
- `capture ignored during playback (barge-in disabled)` یعنی OpenClaw عمداً هنگام فعال بودن صدای دستیار، ورودی را کنار گذاشته است. اگر می‌خواهید گفتار پخش را قطع کند، `voice.realtime.bargeIn` را فعال کنید.
- `barge-in ignored ... outputActive=false` یعنی Discord یا VAD ارائه‌دهنده گفتار را گزارش کرده، اما OpenClaw هیچ پخش فعالی برای قطع کردن نداشته است. این نباید صدا را قطع کند.

اعتبارنامه‌ها برای هر مؤلفه جداگانه حل می‌شوند: احراز هویت مسیر LLM برای `voice.model`، احراز هویت STT برای `tools.media.audio`، احراز هویت TTS برای `messages.tts`/`voice.tts`، و احراز هویت ارائه‌دهنده بی‌درنگ برای `voice.realtime.providers` یا پیکربندی احراز هویت عادی آن ارائه‌دهنده.

### پیام‌های صوتی

پیام‌های صوتی Discord پیش‌نمایش شکل موج نشان می‌دهند و به صدای OGG/Opus نیاز دارند. OpenClaw شکل موج را به‌طور خودکار تولید می‌کند، اما برای بررسی و تبدیل، به `ffmpeg` و `ffprobe` روی میزبان Gateway نیاز دارد.

- یک **مسیر فایل محلی** ارائه دهید (URLها رد می‌شوند).
- محتوای متنی را حذف کنید (Discord متن + پیام صوتی را در یک بار payload رد می‌کند).
- هر قالب صوتی پذیرفته می‌شود؛ OpenClaw در صورت نیاز آن را به OGG/Opus تبدیل می‌کند.
__OC_I18N_900039__
## عیب‌یابی

<AccordionGroup>
  <Accordion title="از intentهای غیرمجاز استفاده شده یا بات هیچ پیام سروری را نمی‌بیند">

    - Message Content Intent را فعال کنید
    - وقتی به حل کاربر/عضو وابسته‌اید، Server Members Intent را فعال کنید
    - پس از تغییر intentها، Gateway را بازراه‌اندازی کنید

  </Accordion>

  <Accordion title="پیام‌های سرور به‌طور غیرمنتظره مسدود شده‌اند">

    - `groupPolicy` را بررسی کنید
    - allowlist سرور را زیر `channels.discord.guilds` بررسی کنید
    - اگر نگاشت `channels` سرور وجود داشته باشد، فقط کانال‌های فهرست‌شده مجاز هستند
    - رفتار `requireMention` و الگوهای mention را بررسی کنید

    بررسی‌های مفید:
__OC_I18N_900040__
  </Accordion>

  <Accordion title="نیاز به mention false است اما هنوز مسدود می‌شود">
    علت‌های رایج:

    - `groupPolicy="allowlist"` بدون allowlist مطابق برای سرور/کانال
    - `requireMention` در جای اشتباه پیکربندی شده است (باید زیر `channels.discord.guilds` یا مدخل کانال باشد)
    - فرستنده توسط allowlist `users` سرور/کانال مسدود شده است

  </Accordion>

  <Accordion title="نوبت‌های طولانی Discord یا پاسخ‌های تکراری">

    لاگ‌های معمول:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    تنظیمات صف Gateway مربوط به Discord:

    - تک‌حساب: `channels.discord.eventQueue.listenerTimeout`
    - چندحساب: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - این فقط کار listener در Gateway مربوط به Discord را کنترل می‌کند، نه طول عمر نوبت عامل

    Discord برای نوبت‌های عامل صف‌شده، timeout متعلق به کانال اعمال نمی‌کند. شنونده‌های پیام بلافاصله واگذار می‌کنند، و اجراهای صف‌شده Discord ترتیب هر نشست را تا زمانی که چرخه عمر نشست/ابزار/زمان اجرا کامل شود یا کار را متوقف کند، حفظ می‌کنند.
__OC_I18N_900041__
  </Accordion>

  <Accordion title="هشدارهای timeout در جست‌وجوی فراداده Gateway">
    OpenClaw پیش از اتصال، فراداده `/gateway/bot` مربوط به Discord را دریافت می‌کند. خرابی‌های گذرا به URL پیش‌فرض Gateway مربوط به Discord برمی‌گردند و در لاگ‌ها با محدودیت نرخ ثبت می‌شوند.

    تنظیمات timeout فراداده:

    - تک‌حساب: `channels.discord.gatewayInfoTimeoutMs`
    - چندحساب: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback محیطی وقتی پیکربندی تنظیم نشده باشد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - پیش‌فرض: `30000` (30 ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="بازراه‌اندازی‌های ناشی از timeout در READY مربوط به Gateway">
    OpenClaw هنگام راه‌اندازی و پس از اتصال‌های مجدد زمان اجرا، منتظر رویداد `READY` در Gateway مربوط به Discord می‌ماند. راه‌اندازی‌های چندحساب با شروع پلکانی ممکن است به پنجره READY طولانی‌تری نسبت به پیش‌فرض نیاز داشته باشند.

    تنظیمات timeout مربوط به READY:

    - راه‌اندازی تک‌حساب: `channels.discord.gatewayReadyTimeoutMs`
    - راه‌اندازی چندحساب: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback محیطی راه‌اندازی وقتی پیکربندی تنظیم نشده باشد: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - پیش‌فرض راه‌اندازی: `15000` (15 ثانیه)، حداکثر: `120000`
    - زمان اجرای تک‌حساب: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - زمان اجرای چندحساب: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback محیطی زمان اجرا وقتی پیکربندی تنظیم نشده باشد: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - پیش‌فرض زمان اجرا: `30000` (30 ثانیه)، حداکثر: `120000`

  </Accordion>

  <Accordion title="ناهماهنگی‌های ممیزی مجوزها">
    بررسی‌های مجوز `channels status --probe` فقط برای شناسه‌های عددی کانال کار می‌کنند.

    اگر از کلیدهای slug استفاده کنید، تطبیق زمان اجرا همچنان می‌تواند کار کند، اما probe نمی‌تواند مجوزها را به‌طور کامل تأیید کند.

  </Accordion>

  <Accordion title="مشکلات DM و جفت‌سازی">

    - DM غیرفعال است: `channels.discord.dm.enabled=false`
    - خط‌مشی DM غیرفعال است: `channels.discord.dmPolicy="disabled"` (قدیمی: `channels.discord.dm.policy`)
    - در حالت `pairing` در انتظار تأیید جفت‌سازی است

  </Accordion>

  <Accordion title="حلقه‌های بات به بات">
    به‌طور پیش‌فرض، پیام‌هایی که توسط بات نوشته شده‌اند نادیده گرفته می‌شوند.

    اگر `channels.discord.allowBots=true` را تنظیم می‌کنید، برای جلوگیری از رفتار حلقه‌ای از قواعد سخت‌گیرانهٔ منشن و فهرست مجاز استفاده کنید.
    ترجیحاً از `channels.discord.allowBots="mentions"` استفاده کنید تا فقط پیام‌های رباتی پذیرفته شوند که ربات را منشن می‌کنند.
__OC_I18N_900042__
  </Accordion>

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - OpenClaw را به‌روز نگه دارید (`openclaw update`) تا منطق بازیابی دریافت صدای Discord موجود باشد
    - تأیید کنید `channels.discord.voice.daveEncryption=true` (پیش‌فرض) است
    - از `channels.discord.voice.decryptionFailureTolerance=24` (پیش‌فرض بالادستی) شروع کنید و فقط در صورت نیاز آن را تنظیم کنید
    - لاگ‌ها را برای موارد زیر بررسی کنید:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - اگر پس از پیوستن دوبارهٔ خودکار خطاها ادامه داشتند، لاگ‌ها را گردآوری کنید و با تاریخچهٔ دریافت DAVE بالادستی در [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449) مقایسه کنید

  </Accordion>
</AccordionGroup>

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Discord](/gateway/config-channels#discord).

<Accordion title="فیلدهای پربازده Discord">

- راه‌اندازی/احراز هویت: `enabled`, `token`, `accounts.*`, `allowBots`
- سیاست: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- فرمان: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- صف رویداد: `eventQueue.listenerTimeout` (بودجهٔ شنونده)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- پاسخ/تاریخچه: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- پخش جریانی: `streaming` (نام مستعار قدیمی: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- رسانه/تلاش مجدد: `mediaMaxMb` (بارگذاری‌های خروجی Discord را محدود می‌کند، پیش‌فرض `100MB`)، `retry`
- کنش‌ها: `actions.*`
- حضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- قابلیت‌ها: `threadBindings`، `bindings[]` در سطح بالا (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## ایمنی و عملیات

- توکن‌های ربات را به‌عنوان اسرار در نظر بگیرید (`DISCORD_BOT_TOKEN` در محیط‌های تحت نظارت ترجیح دارد).
- حداقل مجوزهای لازم Discord را اعطا کنید.
- اگر استقرار/وضعیت فرمان قدیمی است، Gateway را بازراه‌اندازی کنید و دوباره با `openclaw channels status --probe` بررسی کنید.

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
