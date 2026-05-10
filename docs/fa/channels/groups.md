---
read_when:
    - تغییر رفتار چت گروهی یا محدودسازی بر اساس منشن
sidebarTitle: Groups
summary: رفتار چت گروهی در سطح‌های مختلف (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: گروه‌ها
x-i18n:
    generated_at: "2026-05-10T19:21:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a040df975829cd35f45577522ea2813fd98fd8babbb42663e502cedde088d89
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw چت‌های گروهی را در همهٔ سطح‌ها به‌صورت یکسان مدیریت می‌کند: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## معرفی مقدماتی (۲ دقیقه)

OpenClaw روی حساب‌های پیام‌رسانی خودتان «زندگی می‌کند». کاربر بات جداگانه‌ای برای WhatsApp وجود ندارد. اگر **شما** در یک گروه باشید، OpenClaw می‌تواند آن گروه را ببیند و همان‌جا پاسخ دهد.

رفتار پیش‌فرض:

- گروه‌ها محدود هستند (`groupPolicy: "allowlist"`).
- پاسخ‌ها به یک اشاره نیاز دارند، مگر اینکه gating مبتنی بر اشاره را صراحتاً غیرفعال کنید.
- پاسخ‌های نهایی عادی در گروه‌ها/کانال‌ها به‌طور پیش‌فرض خصوصی هستند. خروجی قابل‌مشاهده در اتاق از ابزار `message` استفاده می‌کند.

ترجمهٔ عملی: فرستنده‌های موجود در allowlist می‌توانند با اشاره کردن به OpenClaw آن را فعال کنند.

<Note>
**خلاصه**

- **دسترسی DM** با `*.allowFrom` کنترل می‌شود.
- **دسترسی گروهی** با `*.groupPolicy` + allowlistها (`*.groups`، `*.groupAllowFrom`) کنترل می‌شود.
- **فعال‌سازی پاسخ** با gating مبتنی بر اشاره (`requireMention`، `/activation`) کنترل می‌شود.

</Note>

جریان سریع (چه اتفاقی برای یک پیام گروهی می‌افتد):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## پاسخ‌های قابل‌مشاهده

برای اتاق‌های گروهی/کانالی، مقدار پیش‌فرض OpenClaw برای `messages.groupChat.visibleReplies` برابر `"message_tool"` است.
`openclaw doctor --fix` این مقدار پیش‌فرض را در پیکربندی کانال‌های تنظیم‌شده‌ای که آن را ندارند می‌نویسد.
یعنی عامل همچنان نوبت را پردازش می‌کند و می‌تواند وضعیت memory/session را به‌روزرسانی کند، اما پاسخ نهایی عادی آن به‌طور خودکار دوباره در اتاق ارسال نمی‌شود. برای صحبت کردن به‌صورت قابل‌مشاهده، عامل از `message(action=send)` استفاده می‌کند.

این پیش‌فرض به model/runtimeای وابسته است که ابزارها را با قابلیت اطمینان فراخوانی کند. اگر لاگ‌ها متن assistant را نشان می‌دهند اما `didSendViaMessagingTool: false` است، مدل به‌جای فراخوانی ابزار message به‌صورت خصوصی پاسخ داده است. این یک خطای ارسال Discord/Slack/Telegram نیست. برای نشست‌های گروهی/کانالی از مدلی با فراخوانی ابزار قابل‌اعتماد استفاده کنید، یا `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا پاسخ‌های نهایی قابل‌مشاهدهٔ قدیمی بازیابی شوند.

اگر ابزار message تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌سروصدای پاسخ، به پاسخ‌های قابل‌مشاهدهٔ خودکار برمی‌گردد.
`openclaw doctor` دربارهٔ این ناهماهنگی هشدار می‌دهد.

برای چت‌های مستقیم و هر نوبت منبع دیگری، از `messages.visibleReplies: "message_tool"` استفاده کنید تا همان رفتار پاسخ قابل‌مشاهدهٔ فقط-ابزار به‌صورت سراسری اعمال شود. Harnessها نیز می‌توانند این را به‌عنوان پیش‌فرض تنظیم‌نشدهٔ خود انتخاب کنند؛ harness Codex این کار را برای چت‌های مستقیم در حالت Codex انجام می‌دهد. `messages.groupChat.visibleReplies` همچنان override اختصاصی‌تر برای اتاق‌های گروهی/کانالی باقی می‌ماند.

این جایگزین الگوی قدیمی مجبور کردن مدل به پاسخ `NO_REPLY` برای بیشتر نوبت‌های حالت lurk می‌شود. در حالت فقط-ابزار، انجام ندادن کار قابل‌مشاهده صرفاً یعنی ابزار message فراخوانی نشود.

نشانگرهای تایپ همچنان در حالی که عامل در حالت فقط-ابزار کار می‌کند ارسال می‌شوند. حالت تایپ پیش‌فرض گروه برای این نوبت‌ها از "message" به "instant" ارتقا داده می‌شود، چون ممکن است پیش از اینکه عامل تصمیم بگیرد آیا ابزار message را فراخوانی کند یا نه، هرگز متن پیام عادی assistant وجود نداشته باشد. پیکربندی صریح حالت تایپ همچنان اولویت دارد.

برای بازیابی پاسخ‌های نهایی خودکار قدیمی برای اتاق‌های گروهی/کانالی:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway پس از ذخیره شدن فایل، پیکربندی `messages` را hot-reload می‌کند. فقط زمانی restart کنید که file watching یا بارگذاری مجدد پیکربندی در deployment غیرفعال باشد.

برای الزام خروجی قابل‌مشاهده به عبور از ابزار message برای هر چت منبع:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

دستورهای اسلش بومی (Discord، Telegram و سطح‌های دیگر با پشتیبانی از دستور بومی) از `visibleReplies: "message_tool"` عبور می‌کنند و همیشه به‌صورت قابل‌مشاهده پاسخ می‌دهند تا رابط دستور بومی کانال پاسخی را که انتظار دارد دریافت کند. این فقط برای نوبت‌های دستور بومی اعتبارسنجی‌شده اعمال می‌شود؛ دستورهای `/...` که به‌صورت متنی تایپ شده‌اند و نوبت‌های چت عادی همچنان از پیش‌فرض گروهی پیکربندی‌شده پیروی می‌کنند.

## مشاهده‌پذیری زمینه و allowlistها

دو کنترل متفاوت در ایمنی گروه دخیل هستند:

- **مجوز فعال‌سازی**: چه کسی می‌تواند عامل را فعال کند (`groupPolicy`، `groups`، `groupAllowFrom`، allowlistهای اختصاصی کانال).
- **مشاهده‌پذیری زمینه**: چه زمینهٔ تکمیلی به مدل تزریق می‌شود (متن پاسخ، نقل‌قول‌ها، تاریخچهٔ thread، فرادادهٔ forwarded).

به‌طور پیش‌فرض، OpenClaw رفتار عادی چت را در اولویت می‌گذارد و زمینه را عمدتاً همان‌طور که دریافت شده نگه می‌دارد. یعنی allowlistها در درجهٔ اول تعیین می‌کنند چه کسی می‌تواند actionها را فعال کند، نه اینکه برای هر قطعهٔ نقل‌شده یا تاریخی یک مرز حذف اطلاعات سراسری باشند.

<AccordionGroup>
  <Accordion title="رفتار فعلی مختص کانال است">
    - برخی کانال‌ها همین حالا در مسیرهای مشخصی filtering مبتنی بر فرستنده را برای زمینهٔ تکمیلی اعمال می‌کنند (برای مثال Slack thread seeding، Matrix reply/thread lookups).
    - کانال‌های دیگر همچنان زمینهٔ quote/reply/forward را همان‌طور که دریافت شده عبور می‌دهند.

  </Accordion>
  <Accordion title="مسیر سخت‌سازی (برنامه‌ریزی‌شده)">
    - `contextVisibility: "all"` (پیش‌فرض) رفتار فعلیِ همان‌طور-دریافت‌شده را نگه می‌دارد.
    - `contextVisibility: "allowlist"` زمینهٔ تکمیلی را به فرستنده‌های موجود در allowlist محدود می‌کند.
    - `contextVisibility: "allowlist_quote"` همان `allowlist` به‌علاوهٔ یک استثنای صریح quote/reply است.

    تا زمانی که این مدل سخت‌سازی به‌صورت یکپارچه در همهٔ کانال‌ها پیاده‌سازی نشده است، انتظار تفاوت بین سطح‌ها را داشته باشید.

  </Accordion>
</AccordionGroup>

![جریان پیام گروهی](/images/groups-flow.svg)

اگر می‌خواهید...

| هدف                                         | چه چیزی را تنظیم کنید                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| اجازه دادن به همهٔ گروه‌ها اما پاسخ فقط هنگام @mention | `groups: { "*": { requireMention: true } }`                |
| غیرفعال کردن همهٔ پاسخ‌های گروهی                    | `groupPolicy: "disabled"`                                  |
| فقط گروه‌های مشخص                         | `groups: { "<group-id>": { ... } }` (بدون کلید `"*"` )         |
| فقط شما بتوانید در گروه‌ها فعال‌سازی کنید               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| استفادهٔ مجدد از یک مجموعه فرستندهٔ مورداعتماد در چند کانال | `groupAllowFrom: ["accessGroup:operators"]`                |

برای allowlistهای قابل‌استفادهٔ مجدد فرستنده، [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.

## کلیدهای نشست

- نشست‌های گروهی از کلیدهای نشست `agent:<agentId>:<channel>:group:<id>` استفاده می‌کنند (اتاق‌ها/کانال‌ها از `agent:<agentId>:<channel>:channel:<id>` استفاده می‌کنند).
- موضوع‌های forum در Telegram، `:topic:<threadId>` را به شناسهٔ گروه اضافه می‌کنند تا هر موضوع نشست خودش را داشته باشد.
- چت‌های مستقیم از نشست اصلی استفاده می‌کنند (یا اگر پیکربندی شده باشد، به‌ازای هر فرستنده).
- Heartbeatها برای نشست‌های گروهی رد می‌شوند.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## الگو: DMهای شخصی + گروه‌های عمومی (یک عامل)

بله — اگر ترافیک «شخصی» شما **DMها** و ترافیک «عمومی» شما **گروه‌ها** باشد، این به‌خوبی کار می‌کند.

دلیل: در حالت تک‌عامل، DMها معمولاً به کلید نشست **اصلی** (`agent:main:main`) می‌رسند، در حالی که گروه‌ها همیشه از کلیدهای نشست **غیراصلی** (`agent:main:<channel>:group:<id>`) استفاده می‌کنند. اگر sandboxing را با `mode: "non-main"` فعال کنید، آن نشست‌های گروهی در sandbox backend پیکربندی‌شده اجرا می‌شوند، در حالی که نشست DM اصلی شما روی میزبان باقی می‌ماند. اگر backendای انتخاب نکنید، Docker پیش‌فرض است.

این به شما یک «مغز» عامل واحد می‌دهد (workspace + memory مشترک)، اما دو وضعیت اجرایی:

- **DMها**: ابزارهای کامل (host)
- **گروه‌ها**: sandbox + ابزارهای محدود

<Note>
اگر به workspaceها/personaهای واقعاً جداگانه نیاز دارید («شخصی» و «عمومی» هرگز نباید با هم مخلوط شوند)، از یک عامل دوم + bindings استفاده کنید. [Multi-Agent Routing](/fa/concepts/multi-agent) را ببینید.
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
  <Tab title="گروه‌ها فقط یک پوشهٔ allowlist شده را می‌بینند">
    اگر به‌جای «بدون دسترسی به host» می‌خواهید «گروه‌ها فقط پوشهٔ X را ببینند»، `workspaceAccess: "none"` را نگه دارید و فقط مسیرهای allowlist شده را در sandbox mount کنید:

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
- عیب‌یابی اینکه چرا یک ابزار مسدود شده است: [Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated)
- جزئیات bind mountها: [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts)

## برچسب‌های نمایش

- برچسب‌های UI در صورت وجود از `displayName` استفاده می‌کنند، با قالب `<channel>:<token>`.
- `#room` برای اتاق‌ها/کانال‌ها رزرو شده است؛ چت‌های گروهی از `g-<slug>` استفاده می‌کنند (حروف کوچک، فاصله‌ها -> `-`، `#@+._-` را نگه دارید).

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
| `"open"`      | گروه‌ها از allowlistها عبور می‌کنند؛ mention-gating همچنان اعمال می‌شود.      |
| `"disabled"`  | همهٔ پیام‌های گروهی را کاملاً مسدود می‌کند.                           |
| `"allowlist"` | فقط گروه‌ها/اتاق‌هایی را مجاز می‌کند که با allowlist پیکربندی‌شده مطابقت دارند. |

<AccordionGroup>
  <Accordion title="یادداشت‌های هر کانال">
    - `groupPolicy` از دروازه‌گذاری با اشاره جداست (که به @mentions نیاز دارد).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: از `groupAllowFrom` استفاده کنید (جایگزین: `allowFrom` صریح).
    - Signal: `groupAllowFrom` می‌تواند با شناسهٔ گروه ورودی Signal یا تلفن/UUID فرستنده مطابقت داشته باشد.
    - تأییدهای جفت‌سازی پیام مستقیم (ورودی‌های ذخیره‌سازی `*-allowFrom`) فقط برای دسترسی پیام مستقیم اعمال می‌شوند؛ مجوزدهی فرستندهٔ گروه برای فهرست‌های مجاز گروه صریح می‌ماند.
    - Discord: فهرست مجاز از `channels.discord.guilds.<id>.channels` استفاده می‌کند.
    - Slack: فهرست مجاز از `channels.slack.channels` استفاده می‌کند.
    - Matrix: فهرست مجاز از `channels.matrix.groups` استفاده می‌کند. شناسه‌ها یا aliasهای اتاق را ترجیح دهید؛ جست‌وجوی نام اتاق‌های پیوسته‌شده best-effort است و نام‌های حل‌نشده هنگام اجرا نادیده گرفته می‌شوند. برای محدود کردن فرستندگان از `channels.matrix.groupAllowFrom` استفاده کنید؛ فهرست‌های مجاز `users` برای هر اتاق نیز پشتیبانی می‌شوند.
    - پیام‌های مستقیم گروهی جداگانه کنترل می‌شوند (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - فهرست مجاز Telegram می‌تواند با شناسه‌های کاربر (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) یا نام‌های کاربری (`"@alice"` یا `"alice"`) مطابقت داشته باشد؛ پیشوندها به بزرگی و کوچکی حروف حساس نیستند.
    - پیش‌فرض `groupPolicy: "allowlist"` است؛ اگر فهرست مجاز گروه شما خالی باشد، پیام‌های گروه مسدود می‌شوند.
    - ایمنی زمان اجرا: وقتی بلوک ارائه‌دهنده کاملاً غایب است (`channels.<provider>` وجود ندارد)، سیاست گروه به‌جای به‌ارث‌بردن `channels.defaults.groupPolicy` به حالت fail-closed بازمی‌گردد (معمولاً `allowlist`).

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
  <Step title="دروازه‌گذاری با اشاره">
    دروازه‌گذاری با اشاره (`requireMention`، `/activation`).
  </Step>
</Steps>

## دروازه‌گذاری با اشاره (پیش‌فرض)

پیام‌های گروه به یک اشاره نیاز دارند، مگر اینکه برای هر گروه بازنویسی شده باشد. پیش‌فرض‌ها برای هر زیرسامانه در `*.groups."*"` قرار دارند.

پاسخ دادن به پیام ربات، وقتی کانال از فرادادهٔ پاسخ پشتیبانی کند، به‌عنوان اشارهٔ ضمنی محسوب می‌شود. نقل‌قول کردن پیام ربات نیز در کانال‌هایی که فرادادهٔ نقل‌قول را ارائه می‌دهند می‌تواند به‌عنوان اشارهٔ ضمنی محسوب شود. موارد داخلی فعلی شامل Telegram، WhatsApp، Slack، Discord، Microsoft Teams و ZaloUser هستند.

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
  <Accordion title="یادداشت‌های دروازه‌گذاری با اشاره">
    - `mentionPatterns` الگوهای regex ایمن و غیرحساس به بزرگی و کوچکی حروف هستند؛ الگوهای نامعتبر و شکل‌های ناامن با تکرارهای تو در تو نادیده گرفته می‌شوند.
    - سطح‌هایی که اشاره‌های صریح ارائه می‌کنند همچنان عبور می‌کنند؛ الگوها جایگزین پشتیبان هستند.
    - بازنویسی برای هر عامل: `agents.list[].groupChat.mentionPatterns` (مفید وقتی چند عامل یک گروه را به‌اشتراک می‌گذارند).
    - دروازه‌گذاری با اشاره فقط وقتی اعمال می‌شود که تشخیص اشاره ممکن باشد (اشاره‌های بومی یا `mentionPatterns` پیکربندی شده باشند).
    - افزودن یک گروه یا فرستنده به فهرست مجاز، دروازه‌گذاری با اشاره را غیرفعال نمی‌کند؛ وقتی همهٔ پیام‌ها باید فعال شوند، `requireMention` آن گروه را روی `false` تنظیم کنید.
    - زمینهٔ اعلان گفت‌وگوی گروهی در هر نوبت دستورالعمل پاسخ بی‌صدای حل‌شده را حمل می‌کند؛ فایل‌های فضای کاری نباید سازوکارهای `NO_REPLY` را تکرار کنند.
    - گروه‌هایی که پاسخ‌های بی‌صدا در آن‌ها مجاز است، نوبت‌های مدلِ کاملاً خالی یا فقط استدلالی را بی‌صدا تلقی می‌کنند، معادل `NO_REPLY`. گفت‌وگوهای مستقیم فقط وقتی همین کار را می‌کنند که پاسخ‌های مستقیم بی‌صدا صریحاً مجاز باشند؛ در غیر این صورت پاسخ‌های خالی همچنان نوبت‌های ناموفق عامل می‌مانند.
    - پیش‌فرض‌های Discord در `channels.discord.guilds."*"` قرار دارند (قابل بازنویسی برای هر guild/channel).
    - زمینهٔ تاریخچهٔ گروه در همهٔ کانال‌ها به‌صورت یکنواخت بسته‌بندی می‌شود. گروه‌های دروازه‌گذاری‌شده با اشاره پیام‌های ردشدهٔ معلق را نگه می‌دارند؛ گروه‌های همیشه‌فعال نیز ممکن است وقتی کانال پشتیبانی کند، پیام‌های اخیر پردازش‌شدهٔ اتاق را نگه دارند. برای پیش‌فرض سراسری از `messages.groupChat.historyLimit` و برای بازنویسی‌ها از `channels.<channel>.historyLimit` (یا `channels.<channel>.accounts.*.historyLimit`) استفاده کنید. برای غیرفعال کردن، `0` تنظیم کنید.

  </Accordion>
</AccordionGroup>

## محدودیت‌های ابزار گروه/کانال (اختیاری)

برخی پیکربندی‌های کانال از محدود کردن ابزارهایی که **داخل یک گروه/اتاق/کانال مشخص** در دسترس هستند پشتیبانی می‌کنند.

- `tools`: اجازه/رد ابزارها برای کل گروه.
- `toolsBySender`: بازنویسی‌های هر فرستنده درون گروه. از پیشوندهای کلید صریح استفاده کنید: `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>`، و wildcard `"*"`. کلیدهای قدیمی بدون پیشوند همچنان پذیرفته می‌شوند و فقط به‌عنوان `id:` مطابقت داده می‌شوند.

ترتیب حل (مشخص‌ترین مورد برنده می‌شود):

<Steps>
  <Step title="toolsBySender گروه">
    تطبیق `toolsBySender` گروه/کانال.
  </Step>
  <Step title="tools گروه">
    `tools` گروه/کانال.
  </Step>
  <Step title="toolsBySender پیش‌فرض">
    تطبیق `toolsBySender` پیش‌فرض (`"*"`).
  </Step>
  <Step title="tools پیش‌فرض">
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
محدودیت‌های ابزار گروه/کانال علاوه بر سیاست ابزار سراسری/عامل اعمال می‌شوند (رد کردن همچنان برنده است). برخی کانال‌ها از تودرتویی متفاوتی برای اتاق‌ها/کانال‌ها استفاده می‌کنند (مثلاً Discord `guilds.*.channels.*`، Slack `channels.*`، Microsoft Teams `teams.*.channels.*`).
</Note>

## فهرست‌های مجاز گروه

وقتی `channels.whatsapp.groups`، `channels.telegram.groups` یا `channels.imessage.groups` پیکربندی شده باشد، کلیدها به‌عنوان فهرست مجاز گروه عمل می‌کنند. برای اجازه دادن به همهٔ گروه‌ها و همچنان تنظیم رفتار پیش‌فرض اشاره، از `"*"` استفاده کنید.

<Warning>
ابهام رایج: تأیید جفت‌سازی پیام مستقیم با مجوزدهی گروه یکی نیست. برای کانال‌هایی که از جفت‌سازی پیام مستقیم پشتیبانی می‌کنند، ذخیره‌سازی جفت‌سازی فقط پیام‌های مستقیم را باز می‌کند. فرمان‌های گروه همچنان به مجوزدهی صریح فرستندهٔ گروه از فهرست‌های مجاز پیکربندی مانند `groupAllowFrom` یا جایگزین پیکربندی مستندشده برای آن کانال نیاز دارند.
</Warning>

نیت‌های رایج (کپی/جای‌گذاری):

<Tabs>
  <Tab title="غیرفعال کردن همهٔ پاسخ‌های گروه">
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
  <Tab title="اجازه به همهٔ گروه‌ها اما نیازمند اشاره">
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

مالک با `channels.whatsapp.allowFrom` تعیین می‌شود (یا E.164 خود ربات وقتی تنظیم نشده باشد). فرمان را به‌صورت یک پیام مستقل بفرستید. سطح‌های دیگر در حال حاضر `/activation` را نادیده می‌گیرند.

## فیلدهای زمینه

payloadهای ورودی گروه تنظیم می‌کنند:

- `ChatType=group`
- `GroupSubject` (اگر شناخته شده باشد)
- `GroupMembers` (اگر شناخته شده باشد)
- `WasMentioned` (نتیجهٔ دروازه‌گذاری با اشاره)
- موضوعات انجمن Telegram همچنین شامل `MessageThreadId` و `IsForum` هستند.

اعلان سیستمی عامل در نخستین نوبت یک نشست گروهی جدید، یک مقدمهٔ گروهی را شامل می‌شود. این مقدمه به مدل یادآوری می‌کند مانند انسان پاسخ دهد، از جدول‌های Markdown پرهیز کند، خطوط خالی را به حداقل برساند و فاصله‌گذاری معمول گفت‌وگو را رعایت کند، و از تایپ دنباله‌های لفظی `\n` خودداری کند. نام‌های گروه و برچسب‌های شرکت‌کننده که از کانال آمده‌اند، به‌عنوان فرادادهٔ نامطمئن حصارگذاری‌شده نمایش داده می‌شوند، نه دستورالعمل‌های سیستمی درون‌خطی.

## جزئیات iMessage

- هنگام مسیریابی یا افزودن به فهرست مجاز، `chat_id:<id>` را ترجیح دهید.
- فهرست گفت‌وگوها: `imsg chats --limit 20`.
- پاسخ‌های گروه همیشه به همان `chat_id` بازمی‌گردند.

## اعلان‌های سیستمی WhatsApp

برای قواعد canonical اعلان سیستمی WhatsApp، از جمله حل اعلان گروه و مستقیم، رفتار wildcard، و معناشناسی بازنویسی حساب، [WhatsApp](/fa/channels/whatsapp#system-prompts) را ببینید.

## جزئیات WhatsApp

برای رفتارهای فقط WhatsApp (تزریق تاریخچه، جزئیات مدیریت اشاره)، [پیام‌های گروه](/fa/channels/group-messages) را ببینید.

## مرتبط

- [گروه‌های پخش](/fa/channels/broadcast-groups)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [پیام‌های گروه](/fa/channels/group-messages)
- [جفت‌سازی](/fa/channels/pairing)
