---
read_when:
    - تغییر رفتار گفت‌وگوی گروهی یا محدودسازی بر اساس منشن
sidebarTitle: Groups
summary: رفتار چت گروهی در رابط‌های مختلف (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: گروه‌ها
x-i18n:
    generated_at: "2026-05-01T11:42:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8580f98ab03c89770688102da776627d8ce18b7bd34c4a687009fd4aabb6213
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw گفتگوهای گروهی را در همهٔ سطوح به‌صورت یکسان مدیریت می‌کند: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## معرفی مقدماتی (۲ دقیقه)

OpenClaw روی حساب‌های پیام‌رسان خودتان «زندگی می‌کند». کاربر bot جداگانه‌ای برای WhatsApp وجود ندارد. اگر **شما** در یک گروه باشید، OpenClaw می‌تواند آن گروه را ببیند و در همان‌جا پاسخ دهد.

رفتار پیش‌فرض:

- گروه‌ها محدود هستند (`groupPolicy: "allowlist"`).
- پاسخ‌ها به mention نیاز دارند، مگر اینکه دروازهٔ mention را صراحتاً غیرفعال کنید.
- پاسخ‌های نهایی معمولی در گروه‌ها/کانال‌ها به‌صورت پیش‌فرض خصوصی هستند. خروجی قابل‌مشاهده در اتاق از ابزار `message` استفاده می‌کند.

ترجمهٔ عملی: فرستنده‌های موجود در فهرست مجاز می‌توانند با mention کردن OpenClaw آن را فعال کنند.

<Note>
**خلاصه**

- **دسترسی DM** با `*.allowFrom` کنترل می‌شود.
- **دسترسی گروهی** با `*.groupPolicy` + فهرست‌های مجاز (`*.groups`، `*.groupAllowFrom`) کنترل می‌شود.
- **فعال‌سازی پاسخ** با دروازهٔ mention (`requireMention`، `/activation`) کنترل می‌شود.

</Note>

جریان سریع (برای یک پیام گروهی چه اتفاقی می‌افتد):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## پاسخ‌های قابل‌مشاهده

برای اتاق‌های گروه/کانال، OpenClaw به‌صورت پیش‌فرض از `messages.groupChat.visibleReplies: "message_tool"` استفاده می‌کند.
یعنی عامل همچنان نوبت را پردازش می‌کند و می‌تواند وضعیت حافظه/نشست را به‌روزرسانی کند، اما پاسخ نهایی معمولی آن به‌طور خودکار در اتاق ارسال نمی‌شود. برای صحبت کردن به‌صورت قابل‌مشاهده، عامل از `message(action=send)` استفاده می‌کند.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل‌مشاهدهٔ خودکار بازمی‌گردد.
`openclaw doctor` دربارهٔ این ناهماهنگی هشدار می‌دهد.

برای گفتگوهای مستقیم و هر نوبت منبع دیگر، از `messages.visibleReplies: "message_tool"` استفاده کنید تا همان رفتار پاسخ قابل‌مشاهدهٔ فقط-ابزاری به‌صورت سراسری اعمال شود. `messages.groupChat.visibleReplies` همچنان override مشخص‌تر برای اتاق‌های گروه/کانال باقی می‌ماند.

این جایگزین الگوی قدیمی مجبور کردن مدل به پاسخ `NO_REPLY` برای بیشتر نوبت‌های حالت کمین می‌شود. در حالت فقط-ابزار، انجام ندادن هیچ کار قابل‌مشاهده‌ای صرفاً یعنی ابزار پیام فراخوانی نشده است.

نشانگرهای تایپ همچنان هنگام کار عامل در حالت فقط-ابزار ارسال می‌شوند. حالت تایپ گروهی پیش‌فرض برای این نوبت‌ها از "message" به "instant" ارتقا داده می‌شود، چون ممکن است پیش از تصمیم عامل برای فراخوانی ابزار پیام، هرگز متن پیام دستیار معمولی وجود نداشته باشد. پیکربندی صریح حالت تایپ همچنان اولویت دارد.

برای بازگرداندن پاسخ‌های نهایی خودکار قدیمی برای اتاق‌های گروه/کانال:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway پس از ذخیره شدن فایل، پیکربندی `messages` را hot-reload می‌کند. فقط زمانی restart کنید که file watching یا بارگذاری دوبارهٔ پیکربندی در deployment غیرفعال باشد.

برای اینکه خروجی قابل‌مشاهده در هر گفتگوی منبعی الزاماً از طریق ابزار پیام عبور کند:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

دستورهای slash بومی (Discord، Telegram و سطح‌های دیگر با پشتیبانی دستور بومی) از `visibleReplies: "message_tool"` عبور می‌کنند و همیشه به‌صورت قابل‌مشاهده پاسخ می‌دهند تا UI دستور بومی کانال پاسخی را که انتظار دارد دریافت کند. این فقط برای نوبت‌های دستور بومی اعتبارسنجی‌شده اعمال می‌شود؛ دستورهای `/...` تایپ‌شده به‌صورت متن و نوبت‌های گفتگوی عادی همچنان از پیش‌فرض گروهی پیکربندی‌شده پیروی می‌کنند.

## دیده‌شدن زمینه و فهرست‌های مجاز

دو کنترل متفاوت در ایمنی گروه نقش دارند:

- **مجوز فعال‌سازی**: چه کسی می‌تواند عامل را فعال کند (`groupPolicy`، `groups`، `groupAllowFrom`، فهرست‌های مجاز مخصوص کانال).
- **دیده‌شدن زمینه**: چه زمینهٔ تکمیلی به مدل تزریق می‌شود (متن پاسخ، نقل‌قول‌ها، تاریخچهٔ thread، فرادادهٔ forward شده).

به‌صورت پیش‌فرض، OpenClaw رفتار عادی گفتگو را در اولویت قرار می‌دهد و زمینه را عمدتاً همان‌طور که دریافت شده نگه می‌دارد. یعنی فهرست‌های مجاز عمدتاً تعیین می‌کنند چه کسی می‌تواند اقدام‌ها را فعال کند، نه اینکه یک مرز redaction جهانی برای هر قطعهٔ نقل‌شده یا تاریخی باشند.

<AccordionGroup>
  <Accordion title="رفتار فعلی وابسته به کانال است">
    - بعضی کانال‌ها از قبل در مسیرهای مشخص، filtering مبتنی بر فرستنده را برای زمینهٔ تکمیلی اعمال می‌کنند (برای مثال Slack thread seeding، جست‌وجوهای پاسخ/thread در Matrix).
    - کانال‌های دیگر همچنان زمینهٔ quote/reply/forward را همان‌طور که دریافت شده عبور می‌دهند.

  </Accordion>
  <Accordion title="مسیر سخت‌سازی (برنامه‌ریزی‌شده)">
    - `contextVisibility: "all"` (پیش‌فرض) رفتار فعلیِ همان‌طور-دریافت‌شده را حفظ می‌کند.
    - `contextVisibility: "allowlist"` زمینهٔ تکمیلی را به فرستنده‌های موجود در فهرست مجاز محدود می‌کند.
    - `contextVisibility: "allowlist_quote"` همان `allowlist` به‌علاوهٔ یک استثنای صریح برای quote/reply است.

    تا زمانی که این مدل سخت‌سازی به‌صورت یکپارچه در همهٔ کانال‌ها پیاده‌سازی شود، انتظار تفاوت بین سطح‌ها را داشته باشید.

  </Accordion>
</AccordionGroup>

![جریان پیام گروهی](/images/groups-flow.svg)

اگر می‌خواهید...

| هدف                                         | چه چیزی تنظیم شود                                          |
| -------------------------------------------- | ---------------------------------------------------------- |
| همهٔ گروه‌ها مجاز باشند، اما فقط روی @mentions پاسخ داده شود | `groups: { "*": { requireMention: true } }`                |
| همهٔ پاسخ‌های گروهی غیرفعال شوند            | `groupPolicy: "disabled"`                                  |
| فقط گروه‌های مشخص                           | `groups: { "<group-id>": { ... } }` (بدون کلید `"*"` )     |
| فقط شما بتوانید در گروه‌ها فعال‌سازی کنید   | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## کلیدهای نشست

- نشست‌های گروهی از کلیدهای نشست `agent:<agentId>:<channel>:group:<id>` استفاده می‌کنند (اتاق‌ها/کانال‌ها از `agent:<agentId>:<channel>:channel:<id>` استفاده می‌کنند).
- topicهای forum در Telegram، `:topic:<threadId>` را به شناسهٔ گروه اضافه می‌کنند تا هر topic نشست خودش را داشته باشد.
- گفتگوهای مستقیم از نشست اصلی استفاده می‌کنند (یا اگر پیکربندی شده باشد، به‌ازای هر فرستنده).
- Heartbeatها برای نشست‌های گروهی رد می‌شوند.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## الگو: DMهای شخصی + گروه‌های عمومی (یک عامل)

بله — اگر ترافیک «شخصی» شما **DMها** و ترافیک «عمومی» شما **گروه‌ها** باشد، این به‌خوبی کار می‌کند.

دلیل: در حالت تک‌عامل، DMها معمولاً در کلید نشست **اصلی** (`agent:main:main`) قرار می‌گیرند، در حالی که گروه‌ها همیشه از کلیدهای نشست **غیراصلی** (`agent:main:<channel>:group:<id>`) استفاده می‌کنند. اگر sandboxing را با `mode: "non-main"` فعال کنید، آن نشست‌های گروهی در backend sandbox پیکربندی‌شده اجرا می‌شوند، در حالی که نشست DM اصلی شما روی host باقی می‌ماند. اگر backendی انتخاب نکنید، Docker پیش‌فرض است.

این به شما یک «مغز» عامل می‌دهد (workspace + حافظهٔ مشترک)، اما با دو وضعیت اجرایی:

- **DMها**: ابزارهای کامل (host)
- **گروه‌ها**: sandbox + ابزارهای محدودشده

<Note>
اگر به workspaceها/personaهای واقعاً جدا نیاز دارید («شخصی» و «عمومی» هرگز نباید مخلوط شوند)، از عامل دوم + bindingها استفاده کنید. ببینید [مسیریابی چندعاملی](/fa/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMها روی host، گروه‌ها sandbox شده">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="گروه‌ها فقط یک پوشهٔ موجود در فهرست مجاز را می‌بینند">
    به‌جای «بدون دسترسی host»، می‌خواهید «گروه‌ها فقط پوشهٔ X را ببینند»؟ `workspaceAccess: "none"` را نگه دارید و فقط مسیرهای موجود در فهرست مجاز را داخل sandbox mount کنید:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:mode
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

مرتبط:

- کلیدهای پیکربندی و پیش‌فرض‌ها: [پیکربندی Gateway](/fa/gateway/config-agents#agentsdefaultssandbox)
- اشکال‌زدایی اینکه چرا یک ابزار مسدود شده است: [Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated)
- جزئیات bind mountها: [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts)

## برچسب‌های نمایش

- برچسب‌های UI وقتی `displayName` در دسترس باشد از آن استفاده می‌کنند، با قالب `<channel>:<token>`.
- `#room` برای اتاق‌ها/کانال‌ها رزرو شده است؛ گفتگوهای گروهی از `g-<slug>` استفاده می‌کنند (حروف کوچک، فاصله‌ها -> `-`، حفظ `#@+._-`).

## سیاست گروه

کنترل کنید پیام‌های گروه/اتاق در هر کانال چگونه مدیریت شوند:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| سیاست        | رفتار                                                        |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | گروه‌ها از فهرست‌های مجاز عبور می‌کنند؛ دروازهٔ mention همچنان اعمال می‌شود. |
| `"disabled"`  | همهٔ پیام‌های گروهی را به‌طور کامل مسدود می‌کند.            |
| `"allowlist"` | فقط گروه‌ها/اتاق‌هایی را مجاز می‌کند که با فهرست مجاز پیکربندی‌شده تطابق دارند. |

<AccordionGroup>
  <Accordion title="نکات هر کانال">
    - `groupPolicy` از دروازهٔ mention جداست (که به @mentions نیاز دارد).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: از `groupAllowFrom` استفاده کنید (fallback: `allowFrom` صریح).
    - Signal: `groupAllowFrom` می‌تواند با شناسهٔ گروه Signal ورودی یا تلفن/UUID فرستنده تطابق داشته باشد.
    - تأییدهای جفت‌سازی DM (ورودی‌های store مربوط به `*-allowFrom`) فقط برای دسترسی DM اعمال می‌شوند؛ مجوز فرستندهٔ گروهی همچنان صراحتاً در فهرست‌های مجاز گروه باقی می‌ماند.
    - Discord: فهرست مجاز از `channels.discord.guilds.<id>.channels` استفاده می‌کند.
    - Slack: فهرست مجاز از `channels.slack.channels` استفاده می‌کند.
    - Matrix: فهرست مجاز از `channels.matrix.groups` استفاده می‌کند. شناسه‌های اتاق یا aliasها را ترجیح دهید؛ جست‌وجوی نام اتاق‌های joined بهترین تلاش است و نام‌های حل‌نشده در زمان اجرا نادیده گرفته می‌شوند. برای محدود کردن فرستنده‌ها از `channels.matrix.groupAllowFrom` استفاده کنید؛ فهرست‌های مجاز `users` به‌ازای هر اتاق نیز پشتیبانی می‌شوند.
    - DMهای گروهی جداگانه کنترل می‌شوند (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - فهرست مجاز Telegram می‌تواند با شناسه‌های کاربر (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) یا نام‌های کاربری (`"@alice"` یا `"alice"`) تطابق داشته باشد؛ prefixها به بزرگی/کوچکی حروف حساس نیستند.
    - پیش‌فرض `groupPolicy: "allowlist"` است؛ اگر فهرست مجاز گروهی شما خالی باشد، پیام‌های گروهی مسدود می‌شوند.
    - ایمنی زمان اجرا: وقتی یک provider block کاملاً وجود ندارد (`channels.<provider>` غایب است)، سیاست گروه به‌جای ارث‌بری از `channels.defaults.groupPolicy` به حالت fail-closed بازمی‌گردد (معمولاً `allowlist`).

  </Accordion>
</AccordionGroup>

مدل ذهنی سریع (ترتیب ارزیابی برای پیام‌های گروهی):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="فهرست‌های مجاز گروه">
    فهرست‌های مجاز گروه (`*.groups`، `*.groupAllowFrom`، فهرست مجاز ویژه کانال).
  </Step>
  <Step title="کنترل اشاره">
    کنترل اشاره (`requireMention`، `/activation`).
  </Step>
</Steps>

## کنترل اشاره (پیش‌فرض)

پیام‌های گروهی به اشاره نیاز دارند، مگر اینکه برای هر گروه جداگانه بازنویسی شده باشد. پیش‌فرض‌ها برای هر زیرسامانه زیر `*.groups."*"` قرار دارند.

پاسخ دادن به پیام ربات، وقتی کانال از فراداده پاسخ پشتیبانی کند، به‌عنوان اشاره ضمنی حساب می‌شود. نقل‌قول کردن پیام ربات نیز در کانال‌هایی که فراداده نقل‌قول را ارائه می‌کنند می‌تواند به‌عنوان اشاره ضمنی حساب شود. موارد داخلی فعلی شامل Telegram، WhatsApp، Slack، Discord، Microsoft Teams و ZaloUser هستند.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="یادداشت‌های کنترل اشاره">
    - `mentionPatterns` الگوهای regex امن و بی‌حساسیت به بزرگی و کوچکی حروف هستند؛ الگوهای نامعتبر و شکل‌های تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
    - سطوحی که اشاره‌های صریح ارائه می‌کنند همچنان عبور می‌کنند؛ الگوها نقش جایگزین دارند.
    - بازنویسی برای هر عامل: `agents.list[].groupChat.mentionPatterns` (وقتی چند عامل یک گروه را به اشتراک می‌گذارند مفید است).
    - کنترل اشاره فقط وقتی اعمال می‌شود که تشخیص اشاره ممکن باشد (اشاره‌های بومی یا `mentionPatterns` پیکربندی شده باشند).
    - قرار دادن یک گروه یا فرستنده در فهرست مجاز، کنترل اشاره را غیرفعال نمی‌کند؛ وقتی همه پیام‌ها باید فعال‌سازی کنند، `requireMention` آن گروه را روی `false` تنظیم کنید.
    - زمینه پرامپت گفتگوی گروهی در هر نوبت دستور پاسخ خاموشِ حل‌شده را حمل می‌کند؛ فایل‌های فضای کاری نباید سازوکارهای `NO_REPLY` را تکرار کنند.
    - گروه‌هایی که پاسخ‌های خاموش در آن‌ها مجاز است، نوبت‌های مدلِ کاملا خالی یا فقط-استدلالی را خاموش در نظر می‌گیرند، معادل `NO_REPLY`. گفتگوهای مستقیم فقط وقتی همین کار را می‌کنند که پاسخ‌های خاموش مستقیم صراحتا مجاز باشند؛ در غیر این صورت پاسخ‌های خالی همچنان نوبت‌های ناموفق عامل باقی می‌مانند.
    - پیش‌فرض‌های Discord در `channels.discord.guilds."*"` قرار دارند (برای هر guild/channel قابل بازنویسی هستند).
    - زمینه تاریخچه گروه در همه کانال‌ها به‌صورت یکنواخت بسته‌بندی می‌شود و **فقط در انتظار** است (پیام‌هایی که به دلیل کنترل اشاره رد شده‌اند)؛ برای پیش‌فرض سراسری از `messages.groupChat.historyLimit` و برای بازنویسی‌ها از `channels.<channel>.historyLimit` (یا `channels.<channel>.accounts.*.historyLimit`) استفاده کنید. برای غیرفعال کردن، آن را روی `0` تنظیم کنید.

  </Accordion>
</AccordionGroup>

## محدودیت‌های ابزار گروه/کانال (اختیاری)

برخی پیکربندی‌های کانال از محدود کردن ابزارهایی که **داخل یک گروه/اتاق/کانال مشخص** در دسترس هستند پشتیبانی می‌کنند.

- `tools`: اجازه/رد ابزارها برای کل گروه.
- `toolsBySender`: بازنویسی‌های ویژه هر فرستنده درون گروه. از پیشوندهای کلید صریح استفاده کنید: `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>`، و wildcard `"*"`. کلیدهای قدیمی بدون پیشوند هنوز پذیرفته می‌شوند و فقط به‌عنوان `id:` تطبیق داده می‌شوند.

ترتیب حل‌وفصل (مشخص‌ترین مورد برنده می‌شود):

<Steps>
  <Step title="toolsBySender گروه">
    تطبیق `toolsBySender` گروه/کانال.
  </Step>
  <Step title="ابزارهای گروه">
    `tools` گروه/کانال.
  </Step>
  <Step title="toolsBySender پیش‌فرض">
    تطبیق `toolsBySender` پیش‌فرض (`"*"`).
  </Step>
  <Step title="ابزارهای پیش‌فرض">
    `tools` پیش‌فرض (`"*"`).
  </Step>
</Steps>

مثال (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
محدودیت‌های ابزار گروه/کانال علاوه بر سیاست ابزار سراسری/عامل اعمال می‌شوند (رد کردن همچنان برنده است). برخی کانال‌ها از تو‌در‌تویی متفاوتی برای اتاق‌ها/کانال‌ها استفاده می‌کنند (مثلا Discord `guilds.*.channels.*`، Slack `channels.*`، Microsoft Teams `teams.*.channels.*`).
</Note>

## فهرست‌های مجاز گروه

وقتی `channels.whatsapp.groups`، `channels.telegram.groups`، یا `channels.imessage.groups` پیکربندی شده باشد، کلیدها به‌عنوان فهرست مجاز گروه عمل می‌کنند. از `"*"` برای مجاز کردن همه گروه‌ها استفاده کنید، در حالی که همچنان رفتار پیش‌فرض اشاره را تنظیم می‌کنید.

<Warning>
ابهام رایج: تایید جفت‌سازی پیام مستقیم همان مجوز گروه نیست. برای کانال‌هایی که از جفت‌سازی پیام مستقیم پشتیبانی می‌کنند، مخزن جفت‌سازی فقط پیام‌های مستقیم را باز می‌کند. فرمان‌های گروه همچنان به مجوز صریح فرستنده گروه از فهرست‌های مجاز پیکربندی مانند `groupAllowFrom` یا fallback پیکربندی مستندشده برای آن کانال نیاز دارند.
</Warning>

نیت‌های رایج (کپی/جای‌گذاری):

<Tabs>
  <Tab title="غیرفعال کردن همه پاسخ‌های گروهی">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="فقط گروه‌های مشخص را مجاز کن (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="همه گروه‌ها را مجاز کن اما اشاره را الزامی کن">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="فعال‌سازهای فقط مالک (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## فعال‌سازی (فقط مالک)

مالکان گروه می‌توانند فعال‌سازی هر گروه را تغییر دهند:

- `/activation mention`
- `/activation always`

مالک با `channels.whatsapp.allowFrom` تعیین می‌شود (یا وقتی تنظیم نشده باشد، E.164 خود ربات). فرمان را به‌صورت یک پیام مستقل ارسال کنید. سطوح دیگر در حال حاضر `/activation` را نادیده می‌گیرند.

## فیلدهای زمینه

محموله‌های ورودی گروه این موارد را تنظیم می‌کنند:

- `ChatType=group`
- `GroupSubject` (اگر شناخته‌شده باشد)
- `GroupMembers` (اگر شناخته‌شده باشد)
- `WasMentioned` (نتیجه کنترل اشاره)
- موضوعات انجمن Telegram همچنین شامل `MessageThreadId` و `IsForum` هستند.

یادداشت‌های ویژه کانال:

- BlueBubbles می‌تواند به‌صورت اختیاری شرکت‌کنندگان بی‌نام گروه macOS را پیش از پر کردن `GroupMembers` از پایگاه داده Contacts محلی غنی کند. این گزینه به‌صورت پیش‌فرض خاموش است و فقط پس از عبور کنترل عادی گروه اجرا می‌شود.

پرامپت سیستم عامل در نخستین نوبت یک جلسه گروهی جدید، معرفی گروه را شامل می‌شود. این معرفی به مدل یادآوری می‌کند مانند انسان پاسخ دهد، از جدول‌های Markdown دوری کند، خطوط خالی را به حداقل برساند و فاصله‌گذاری معمول گفتگو را رعایت کند، و از تایپ دنباله‌های لفظی `\n` خودداری کند. نام‌های گروه و برچسب‌های شرکت‌کنندگان که از کانال آمده‌اند، به‌عنوان فراداده نامطمئن محصور در fenced rendering می‌شوند، نه دستورهای سیستمی درون‌خطی.

## جزئیات iMessage

- هنگام مسیریابی یا قرار دادن در فهرست مجاز، `chat_id:<id>` را ترجیح دهید.
- فهرست گفتگوها: `imsg chats --limit 20`.
- پاسخ‌های گروهی همیشه به همان `chat_id` برمی‌گردند.

## پرامپت‌های سیستم WhatsApp

برای قواعد مرجع پرامپت سیستم WhatsApp، از جمله حل‌وفصل پرامپت گروه و مستقیم، رفتار wildcard، و معنای بازنویسی حساب، [WhatsApp](/fa/channels/whatsapp#system-prompts) را ببینید.

## جزئیات WhatsApp

برای رفتار فقط مخصوص WhatsApp (تزریق تاریخچه، جزئیات مدیریت اشاره)، [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

## مرتبط

- [گروه‌های پخش](/fa/channels/broadcast-groups)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [پیام‌های گروهی](/fa/channels/group-messages)
- [جفت‌سازی](/fa/channels/pairing)
