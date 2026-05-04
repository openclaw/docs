---
read_when:
    - تغییر رفتار چت گروهی یا محدودسازی بر اساس منشن
sidebarTitle: Groups
summary: رفتار چت گروهی در سطوح مختلف (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: گروه‌ها
x-i18n:
    generated_at: "2026-05-04T02:21:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: dea506c011a5d8f6155b2f56aacb236482cb8c5b7457001cb2171fd45932443d
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw با گپ‌های گروهی در همهٔ سطوح به‌شکل یکسان رفتار می‌کند: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## معرفی مبتدی (۲ دقیقه)

OpenClaw روی حساب‌های پیام‌رسانی خود شما «زندگی می‌کند». کاربر ربات جداگانه‌ای برای WhatsApp وجود ندارد. اگر **شما** در یک گروه باشید، OpenClaw می‌تواند آن گروه را ببیند و همان‌جا پاسخ بدهد.

رفتار پیش‌فرض:

- گروه‌ها محدود هستند (`groupPolicy: "allowlist"`).
- پاسخ‌ها به mention نیاز دارند، مگر اینکه به‌صورت صریح قفل mention را غیرفعال کنید.
- پاسخ‌های نهایی معمول در گروه‌ها/کانال‌ها به‌صورت پیش‌فرض خصوصی هستند. خروجی قابل مشاهده در اتاق از ابزار `message` استفاده می‌کند.

ترجمه: فرستنده‌های موجود در allowlist می‌توانند با mention کردن OpenClaw آن را فعال کنند.

<Note>
**خلاصه**

- **دسترسی DM** با `*.allowFrom` کنترل می‌شود.
- **دسترسی گروه** با `*.groupPolicy` + allowlistها (`*.groups`، `*.groupAllowFrom`) کنترل می‌شود.
- **فعال‌سازی پاسخ** با قفل mention (`requireMention`، `/activation`) کنترل می‌شود.

</Note>

جریان سریع (برای یک پیام گروهی چه اتفاقی می‌افتد):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## پاسخ‌های قابل مشاهده

برای اتاق‌های گروهی/کانالی، مقدار پیش‌فرض OpenClaw برابر `messages.groupChat.visibleReplies: "message_tool"` است.
`openclaw doctor --fix` این مقدار پیش‌فرض را در پیکربندی‌های کانال‌های تنظیم‌شده‌ای که آن را ندارند می‌نویسد.
یعنی عامل همچنان turn را پردازش می‌کند و می‌تواند وضعیت حافظه/نشست را به‌روزرسانی کند، اما پاسخ نهایی معمول آن به‌صورت خودکار در اتاق ارسال نمی‌شود. برای صحبت کردن به‌صورت قابل مشاهده، عامل از `message(action=send)` استفاده می‌کند.

این مقدار پیش‌فرض به مدل/زمان‌اجرایی وابسته است که ابزارها را به‌شکل قابل اعتماد فراخوانی کند. اگر لاگ‌ها متن دستیار را نشان می‌دهند اما `didSendViaMessagingTool: false` است، مدل به‌جای فراخوانی ابزار پیام، به‌صورت خصوصی پاسخ داده است. این یک خطای ارسال Discord/Slack/Telegram نیست. برای نشست‌های گروهی/کانالی از مدلی استفاده کنید که در فراخوانی ابزار قابل اعتماد باشد، یا `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا پاسخ‌های نهایی قابل مشاهدهٔ قدیمی بازگردند.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل مشاهدهٔ خودکار برمی‌گردد.
`openclaw doctor` دربارهٔ این ناسازگاری هشدار می‌دهد.

برای گپ‌های مستقیم و هر turn منبع دیگر، از `messages.visibleReplies: "message_tool"` استفاده کنید تا همین رفتار پاسخ قابل مشاهدهٔ فقط-ابزار به‌صورت سراسری اعمال شود. harnessها هم می‌توانند این را به‌عنوان مقدار پیش‌فرض تنظیم‌نشدهٔ خود انتخاب کنند؛ harness کدکس این کار را برای گپ‌های مستقیم در حالت کدکس انجام می‌دهد. `messages.groupChat.visibleReplies` همچنان override مشخص‌تر برای اتاق‌های گروهی/کانالی است.

این جایگزین الگوی قدیمیِ مجبور کردن مدل به پاسخ `NO_REPLY` برای بیشتر turnهای حالت کمین می‌شود. در حالت فقط-ابزار، انجام ندادن هیچ کار قابل مشاهده‌ای صرفاً یعنی فراخوانی نکردن ابزار پیام.

نشانگرهای تایپ همچنان هنگام کار عامل در حالت فقط-ابزار ارسال می‌شوند. حالت پیش‌فرض تایپ گروه برای این turnها از "message" به "instant" ارتقا داده می‌شود، چون ممکن است هرگز متن پیام معمول دستیار قبل از تصمیم عامل دربارهٔ فراخوانی ابزار پیام وجود نداشته باشد. پیکربندی صریح حالت تایپ همچنان اولویت دارد.

برای بازگرداندن پاسخ‌های نهایی خودکار قدیمی برای اتاق‌های گروهی/کانالی:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway پس از ذخیره شدن فایل، پیکربندی `messages` را hot-reload می‌کند. فقط زمانی restart کنید که file watching یا config reload در استقرار غیرفعال باشد.

برای الزام خروجی قابل مشاهده به عبور از ابزار پیام برای هر گپ منبع:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

دستورهای اسلش بومی (Discord، Telegram و سایر سطوحی که پشتیبانی بومی از دستور دارند) از `visibleReplies: "message_tool"` عبور می‌کنند و همیشه به‌صورت قابل مشاهده پاسخ می‌دهند تا رابط دستور بومی کانال پاسخی را بگیرد که انتظار دارد. این فقط برای turnهای معتبرِ دستور بومی اعمال می‌شود؛ دستورهای `/...` تایپ‌شده به‌صورت متن و turnهای معمول گپ همچنان از پیش‌فرض گروه پیکربندی‌شده پیروی می‌کنند.

## نمایانی context و allowlistها

در ایمنی گروه دو کنترل متفاوت دخیل‌اند:

- **مجوز فعال‌سازی**: چه کسی می‌تواند عامل را فعال کند (`groupPolicy`، `groups`، `groupAllowFrom`، allowlistهای مخصوص کانال).
- **نمایانی context**: چه context تکمیلی به مدل تزریق می‌شود (متن پاسخ، نقل‌قول‌ها، تاریخچهٔ thread، فرادادهٔ forwarded).

به‌صورت پیش‌فرض، OpenClaw رفتار معمول گپ را در اولویت می‌گذارد و context را عمدتاً همان‌طور که دریافت شده نگه می‌دارد. یعنی allowlistها در درجهٔ اول تعیین می‌کنند چه کسی می‌تواند اقدام‌ها را فعال کند، نه اینکه مرز حذف اطلاعات جهانی برای هر قطعهٔ نقل‌قول‌شده یا تاریخی باشند.

<AccordionGroup>
  <Accordion title="رفتار فعلی مخصوص هر کانال است">
    - بعضی کانال‌ها از قبل برای context تکمیلی در مسیرهای مشخص فیلتر مبتنی بر فرستنده اعمال می‌کنند (برای مثال seeding ترد Slack، lookupهای پاسخ/ترد Matrix).
    - کانال‌های دیگر هنوز context نقل‌قول/پاسخ/forward را همان‌طور که دریافت شده عبور می‌دهند.

  </Accordion>
  <Accordion title="مسیر سخت‌سازی (برنامه‌ریزی‌شده)">
    - `contextVisibility: "all"` (پیش‌فرض) رفتار فعلیِ همان‌طور-دریافت‌شده را نگه می‌دارد.
    - `contextVisibility: "allowlist"` context تکمیلی را به فرستنده‌های موجود در allowlist محدود می‌کند.
    - `contextVisibility: "allowlist_quote"` همان `allowlist` به‌علاوهٔ یک استثنای صریح نقل‌قول/پاسخ است.

    تا زمانی که این مدل سخت‌سازی به‌شکل یکسان در همهٔ کانال‌ها پیاده‌سازی شود، انتظار تفاوت بین سطوح را داشته باشید.

  </Accordion>
</AccordionGroup>

![جریان پیام گروهی](/images/groups-flow.svg)

اگر می‌خواهید...

| هدف                                         | چه چیزی را تنظیم کنید                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| همهٔ گروه‌ها مجاز باشند اما فقط روی @mentions پاسخ داده شود | `groups: { "*": { requireMention: true } }`                |
| همهٔ پاسخ‌های گروهی غیرفعال شوند                    | `groupPolicy: "disabled"`                                  |
| فقط گروه‌های مشخص                         | `groups: { "<group-id>": { ... } }` (بدون کلید `"*"` )         |
| فقط شما بتوانید در گروه‌ها فعال کنید               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| یک مجموعهٔ فرستندهٔ مورد اعتماد را بین کانال‌ها بازاستفاده کنید | `groupAllowFrom: ["accessGroup:operators"]`                |

برای allowlistهای فرستندهٔ قابل بازاستفاده، [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.

## کلیدهای نشست

- نشست‌های گروهی از کلیدهای نشست `agent:<agentId>:<channel>:group:<id>` استفاده می‌کنند (اتاق‌ها/کانال‌ها از `agent:<agentId>:<channel>:channel:<id>` استفاده می‌کنند).
- topicهای forum در Telegram، `:topic:<threadId>` را به شناسهٔ گروه اضافه می‌کنند تا هر topic نشست خودش را داشته باشد.
- گپ‌های مستقیم از نشست اصلی استفاده می‌کنند (یا اگر پیکربندی شده باشد، به‌ازای هر فرستنده).
- Heartbeatها برای نشست‌های گروهی رد می‌شوند.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## الگو: DMهای شخصی + گروه‌های عمومی (یک عامل)

بله — اگر ترافیک «شخصی» شما **DMها** و ترافیک «عمومی» شما **گروه‌ها** باشد، این به‌خوبی کار می‌کند.

چرا: در حالت تک‌عاملی، DMها معمولاً وارد کلید نشست **اصلی** (`agent:main:main`) می‌شوند، در حالی که گروه‌ها همیشه از کلیدهای نشست **غیراصلی** (`agent:main:<channel>:group:<id>`) استفاده می‌کنند. اگر sandboxing را با `mode: "non-main"` فعال کنید، آن نشست‌های گروهی در backend جعبهٔ شنی پیکربندی‌شده اجرا می‌شوند، در حالی که نشست DM اصلی شما روی میزبان باقی می‌ماند. اگر backendی انتخاب نکنید، Docker پیش‌فرض است.

این به شما یک «مغز» عامل می‌دهد (فضای کاری + حافظهٔ مشترک)، اما دو حالت اجرا:

- **DMها**: ابزارهای کامل (میزبان)
- **گروه‌ها**: جعبهٔ شنی + ابزارهای محدود

<Note>
اگر به فضاهای کاری/شخصیت‌های واقعاً جدا نیاز دارید («شخصی» و «عمومی» هرگز نباید مخلوط شوند)، از عامل دوم + bindingها استفاده کنید. [مسیریابی چندعاملی](/fa/concepts/multi-agent) را ببینید.
</Note>

<Tabs>
  <Tab title="DMها روی میزبان، گروه‌ها در جعبهٔ شنی">
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
  <Tab title="گروه‌ها فقط یک پوشهٔ allowlisted را می‌بینند">
    به‌جای «بدون دسترسی به میزبان»، می‌خواهید «گروه‌ها فقط پوشهٔ X را ببینند»؟ `workspaceAccess: "none"` را نگه دارید و فقط مسیرهای allowlisted را در جعبهٔ شنی mount کنید:

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
- اشکال‌زدایی اینکه چرا یک ابزار مسدود شده است: [جعبهٔ شنی در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated)
- جزئیات bind mountها: [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts)

## برچسب‌های نمایشی

- برچسب‌های UI وقتی `displayName` در دسترس باشد از آن استفاده می‌کنند، با قالب `<channel>:<token>`.
- `#room` برای اتاق‌ها/کانال‌ها رزرو شده است؛ گپ‌های گروهی از `g-<slug>` استفاده می‌کنند (حروف کوچک، فاصله‌ها -> `-`، حفظ `#@+._-`).

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

| سیاست        | رفتار                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | گروه‌ها از allowlistها عبور می‌کنند؛ قفل mention همچنان اعمال می‌شود.      |
| `"disabled"`  | همهٔ پیام‌های گروهی را به‌طور کامل مسدود می‌کند.                           |
| `"allowlist"` | فقط گروه‌ها/اتاق‌هایی را مجاز می‌کند که با allowlist پیکربندی‌شده مطابق باشند. |

<AccordionGroup>
  <Accordion title="نکات هر کانال">
    - `groupPolicy` از کنترل مبتنی بر منشن جدا است (که به @mentions نیاز دارد).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: از `groupAllowFrom` استفاده کنید (جایگزین: `allowFrom` صریح).
    - Signal: `groupAllowFrom` می‌تواند یا با شناسه گروه ورودی Signal یا با تلفن/UUID فرستنده مطابقت داشته باشد.
    - تأییدهای جفت‌سازی پیام مستقیم (ورودی‌های ذخیره `*-allowFrom`) فقط برای دسترسی پیام مستقیم اعمال می‌شوند؛ مجوز فرستنده گروه همچنان به‌طور صریح در فهرست‌های مجاز گروه باقی می‌ماند.
    - Discord: فهرست مجاز از `channels.discord.guilds.<id>.channels` استفاده می‌کند.
    - Slack: فهرست مجاز از `channels.slack.channels` استفاده می‌کند.
    - Matrix: فهرست مجاز از `channels.matrix.groups` استفاده می‌کند. شناسه‌ها یا نام‌های مستعار اتاق را ترجیح دهید؛ جست‌وجوی نام اتاق‌های پیوسته‌شده بهترین تلاش است، و نام‌های حل‌نشده در زمان اجرا نادیده گرفته می‌شوند. برای محدود کردن فرستنده‌ها از `channels.matrix.groupAllowFrom` استفاده کنید؛ فهرست‌های مجاز `users` برای هر اتاق نیز پشتیبانی می‌شوند.
    - پیام‌های مستقیم گروهی جداگانه کنترل می‌شوند (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - فهرست مجاز Telegram می‌تواند با شناسه‌های کاربر (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) یا نام‌های کاربری (`"@alice"` یا `"alice"`) مطابقت داشته باشد؛ پیشوندها به بزرگی و کوچکی حروف حساس نیستند.
    - مقدار پیش‌فرض `groupPolicy: "allowlist"` است؛ اگر فهرست مجاز گروه شما خالی باشد، پیام‌های گروه مسدود می‌شوند.
    - ایمنی زمان اجرا: وقتی یک بلوک ارائه‌دهنده کاملاً وجود ندارد (`channels.<provider>` غایب است)، سیاست گروه به‌جای ارث‌بری از `channels.defaults.groupPolicy` به یک حالت بسته در برابر خطا برمی‌گردد (معمولاً `allowlist`).

  </Accordion>
</AccordionGroup>

مدل ذهنی سریع (ترتیب ارزیابی برای پیام‌های گروه):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="فهرست‌های مجاز گروه">
    فهرست‌های مجاز گروه (`*.groups`، `*.groupAllowFrom`، فهرست مجاز مخصوص کانال).
  </Step>
  <Step title="کنترل مبتنی بر منشن">
    کنترل مبتنی بر منشن (`requireMention`، `/activation`).
  </Step>
</Steps>

## کنترل مبتنی بر منشن (پیش‌فرض)

پیام‌های گروه، مگر اینکه برای هر گروه بازنویسی شوند، به یک منشن نیاز دارند. مقادیر پیش‌فرض برای هر زیرسامانه زیر `*.groups."*"` قرار دارند.

پاسخ دادن به پیام ربات، وقتی کانال از فراداده پاسخ پشتیبانی کند، به‌عنوان منشن ضمنی حساب می‌شود. نقل‌قول کردن پیام ربات نیز می‌تواند در کانال‌هایی که فراداده نقل‌قول را ارائه می‌کنند، به‌عنوان منشن ضمنی حساب شود. موارد داخلی فعلی شامل Telegram، WhatsApp، Slack، Discord، Microsoft Teams و ZaloUser هستند.

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
  <Accordion title="نکات کنترل مبتنی بر منشن">
    - `mentionPatterns` الگوهای regex ایمن و غیرحساس به بزرگی و کوچکی حروف هستند؛ الگوهای نامعتبر و شکل‌های تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
    - سطح‌هایی که منشن‌های صریح ارائه می‌کنند همچنان عبور می‌کنند؛ الگوها گزینه جایگزین هستند.
    - بازنویسی برای هر عامل: `agents.list[].groupChat.mentionPatterns` (وقتی چند عامل یک گروه را به اشتراک می‌گذارند مفید است).
    - کنترل مبتنی بر منشن فقط وقتی اعمال می‌شود که تشخیص منشن ممکن باشد (منشن‌های بومی یا `mentionPatterns` پیکربندی شده باشند).
    - قرار دادن یک گروه یا فرستنده در فهرست مجاز، کنترل مبتنی بر منشن را غیرفعال نمی‌کند؛ وقتی همه پیام‌ها باید فعال‌سازی کنند، `requireMention` آن گروه را روی `false` تنظیم کنید.
    - زمینه پرامپت چت گروهی در هر نوبت دستور حل‌شده پاسخ بی‌صدا را حمل می‌کند؛ فایل‌های فضای کاری نباید سازوکارهای `NO_REPLY` را تکرار کنند.
    - گروه‌هایی که پاسخ‌های بی‌صدا در آن‌ها مجاز است، نوبت‌های مدلِ خالی تمیز یا فقط استدلال را بی‌صدا تلقی می‌کنند، معادل `NO_REPLY`. چت‌های مستقیم فقط وقتی همین کار را می‌کنند که پاسخ‌های بی‌صدای مستقیم صریحاً مجاز باشند؛ در غیر این صورت پاسخ‌های خالی همچنان نوبت‌های ناموفق عامل باقی می‌مانند.
    - پیش‌فرض‌های Discord در `channels.discord.guilds."*"` قرار دارند (برای هر guild/channel قابل بازنویسی هستند).
    - زمینه تاریخچه گروه در همه کانال‌ها به‌صورت یکنواخت بسته‌بندی می‌شود و **فقط در انتظار** است (پیام‌هایی که به‌دلیل کنترل مبتنی بر منشن رد شده‌اند)؛ برای پیش‌فرض سراسری از `messages.groupChat.historyLimit` و برای بازنویسی‌ها از `channels.<channel>.historyLimit` (یا `channels.<channel>.accounts.*.historyLimit`) استفاده کنید. برای غیرفعال‌سازی، `0` را تنظیم کنید.

  </Accordion>
</AccordionGroup>

## محدودیت‌های ابزار گروه/کانال (اختیاری)

برخی پیکربندی‌های کانال از محدود کردن ابزارهایی که **داخل یک گروه/اتاق/کانال مشخص** در دسترس هستند پشتیبانی می‌کنند.

- `tools`: اجازه/رد ابزارها برای کل گروه.
- `toolsBySender`: بازنویسی‌های هر فرستنده داخل گروه. از پیشوندهای کلید صریح استفاده کنید: `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>`، و wildcard `"*"`. کلیدهای قدیمی بدون پیشوند همچنان پذیرفته می‌شوند و فقط به‌عنوان `id:` مطابقت داده می‌شوند.

ترتیب حل (خاص‌ترین مورد برنده است):

<Steps>
  <Step title="Group toolsBySender">
    تطابق `toolsBySender` گروه/کانال.
  </Step>
  <Step title="ابزارهای گروه">
    `tools` گروه/کانال.
  </Step>
  <Step title="Default toolsBySender">
    تطابق `toolsBySender` پیش‌فرض (`"*"`).
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
محدودیت‌های ابزار گروه/کانال علاوه بر سیاست ابزار سراسری/عامل اعمال می‌شوند (رد همچنان برنده است). برخی کانال‌ها برای اتاق‌ها/کانال‌ها تودرتوسازی متفاوتی استفاده می‌کنند (مثلاً Discord `guilds.*.channels.*`، Slack `channels.*`، Microsoft Teams `teams.*.channels.*`).
</Note>

## فهرست‌های مجاز گروه

وقتی `channels.whatsapp.groups`، `channels.telegram.groups`، یا `channels.imessage.groups` پیکربندی شده باشد، کلیدها به‌عنوان فهرست مجاز گروه عمل می‌کنند. از `"*"` برای مجاز کردن همه گروه‌ها در حالی که همچنان رفتار پیش‌فرض منشن را تنظیم می‌کنید استفاده کنید.

<Warning>
ابهام رایج: تأیید جفت‌سازی پیام مستقیم با مجوز گروه یکی نیست. برای کانال‌هایی که از جفت‌سازی پیام مستقیم پشتیبانی می‌کنند، ذخیره جفت‌سازی فقط پیام‌های مستقیم را باز می‌کند. فرمان‌های گروه همچنان به مجوز صریح فرستنده گروه از فهرست‌های مجاز پیکربندی مانند `groupAllowFrom` یا جایگزین پیکربندی مستندشده برای آن کانال نیاز دارند.
</Warning>

نیت‌های رایج (کپی/جای‌گذاری):

<Tabs>
  <Tab title="غیرفعال کردن همه پاسخ‌های گروه">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="اجازه فقط به گروه‌های مشخص (WhatsApp)">
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
  <Tab title="اجازه به همه گروه‌ها اما الزام منشن">
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
  <Tab title="فعال‌سازی فقط توسط مالک (WhatsApp)">
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

مالک با `channels.whatsapp.allowFrom` تعیین می‌شود (یا E.164 خود ربات وقتی تنظیم نشده باشد). فرمان را به‌عنوان یک پیام مستقل بفرستید. سطح‌های دیگر فعلاً `/activation` را نادیده می‌گیرند.

## فیلدهای زمینه

بارهای ورودی گروه تنظیم می‌کنند:

- `ChatType=group`
- `GroupSubject` (اگر شناخته‌شده باشد)
- `GroupMembers` (اگر شناخته‌شده باشد)
- `WasMentioned` (نتیجه کنترل مبتنی بر منشن)
- موضوعات انجمن Telegram همچنین شامل `MessageThreadId` و `IsForum` هستند.

نکات مخصوص کانال:

- BlueBubbles می‌تواند به‌صورت اختیاری شرکت‌کنندگان بی‌نام گروه macOS را پیش از پر کردن `GroupMembers` از پایگاه‌داده Contacts محلی غنی کند. این به‌طور پیش‌فرض خاموش است و فقط پس از عبور کنترل‌های عادی گروه اجرا می‌شود.

پرامپت سیستم عامل در اولین نوبت یک جلسه گروهی جدید، یک مقدمه گروهی شامل می‌کند. این مقدمه به مدل یادآوری می‌کند مانند انسان پاسخ دهد، از جدول‌های Markdown پرهیز کند، خطوط خالی را به حداقل برساند و فاصله‌گذاری عادی چت را دنبال کند، و از تایپ دنباله‌های لفظی `\n` خودداری کند. نام‌های گروه و برچسب‌های شرکت‌کننده که از کانال می‌آیند به‌صورت فراداده غیرقابل‌اعتماد حصارگذاری‌شده رندر می‌شوند، نه دستورهای سیستمی درون‌خطی.

## جزئیات iMessage

- هنگام مسیریابی یا فهرست مجاز، `chat_id:<id>` را ترجیح دهید.
- فهرست کردن چت‌ها: `imsg chats --limit 20`.
- پاسخ‌های گروه همیشه به همان `chat_id` برمی‌گردند.

## پرامپت‌های سیستم WhatsApp

برای قوانین مرجع پرامپت سیستم WhatsApp، شامل حل پرامپت گروه و مستقیم، رفتار wildcard، و معنای بازنویسی حساب، [WhatsApp](/fa/channels/whatsapp#system-prompts) را ببینید.

## جزئیات WhatsApp

برای رفتار مخصوص WhatsApp (تزریق تاریخچه، جزئیات مدیریت منشن)، [پیام‌های گروه](/fa/channels/group-messages) را ببینید.

## مرتبط

- [گروه‌های پخش](/fa/channels/broadcast-groups)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [پیام‌های گروه](/fa/channels/group-messages)
- [جفت‌سازی](/fa/channels/pairing)
