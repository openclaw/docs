---
read_when:
    - تغییر رفتار گفتگوی گروهی یا محدودسازی با منشن
sidebarTitle: Groups
summary: رفتار چت گروهی در سطوح مختلف (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: گروه‌ها
x-i18n:
    generated_at: "2026-05-03T11:33:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fd4fcaa8335f1dc4b4b1a719d6654ab0c10530f74284269ed6205dd5f87c116
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw گفتگوهای گروهی را در همه سطوح به‌صورت یکسان مدیریت می‌کند: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## معرفی مقدماتی (۲ دقیقه)

OpenClaw روی حساب‌های پیام‌رسان خود شما «زندگی می‌کند». کاربر ربات WhatsApp جداگانه‌ای وجود ندارد. اگر **شما** در یک گروه باشید، OpenClaw می‌تواند آن گروه را ببیند و آنجا پاسخ دهد.

رفتار پیش‌فرض:

- گروه‌ها محدود هستند (`groupPolicy: "allowlist"`).
- پاسخ‌ها به منشن نیاز دارند، مگر اینکه صراحتاً کنترل منشن را غیرفعال کنید.
- پاسخ‌های نهایی عادی در گروه‌ها/کانال‌ها به‌طور پیش‌فرض خصوصی هستند. خروجی قابل مشاهده در اتاق از ابزار `message` استفاده می‌کند.

ترجمه: فرستندگان موجود در allowlist می‌توانند با منشن کردن OpenClaw آن را فعال کنند.

<Note>
**خلاصه**

- **دسترسی DM** با `*.allowFrom` کنترل می‌شود.
- **دسترسی گروهی** با `*.groupPolicy` + allowlistها (`*.groups`، `*.groupAllowFrom`) کنترل می‌شود.
- **راه‌اندازی پاسخ** با کنترل منشن (`requireMention`، `/activation`) کنترل می‌شود.

</Note>

جریان سریع (برای یک پیام گروهی چه اتفاقی می‌افتد):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## پاسخ‌های قابل مشاهده

برای اتاق‌های گروهی/کانالی، OpenClaw به‌طور پیش‌فرض از `messages.groupChat.visibleReplies: "message_tool"` استفاده می‌کند.
`openclaw doctor --fix` این پیش‌فرض را در پیکربندی‌های کانال‌های تنظیم‌شده‌ای که آن را ندارند می‌نویسد.
یعنی agent همچنان نوبت را پردازش می‌کند و می‌تواند وضعیت memory/session را به‌روزرسانی کند، اما پاسخ نهایی عادی آن به‌طور خودکار دوباره در اتاق ارسال نمی‌شود. برای صحبت قابل مشاهده، agent از `message(action=send)` استفاده می‌کند.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل مشاهده خودکار برمی‌گردد.
`openclaw doctor` درباره این ناهماهنگی هشدار می‌دهد.

برای گفتگوهای مستقیم و هر نوبت منبع دیگر، از `messages.visibleReplies: "message_tool"` استفاده کنید تا همان رفتار پاسخ قابل مشاهده فقط از طریق ابزار به‌صورت سراسری اعمال شود. Harnessها نیز می‌توانند این را به‌عنوان پیش‌فرض تنظیم‌نشده خود انتخاب کنند؛ harness مربوط به Codex این کار را برای گفتگوهای مستقیم در حالت Codex انجام می‌دهد. `messages.groupChat.visibleReplies` همچنان override مشخص‌تر برای اتاق‌های گروهی/کانالی باقی می‌ماند.

این جایگزین الگوی قدیمیِ وادار کردن مدل به پاسخ `NO_REPLY` برای بیشتر نوبت‌های حالت کمین می‌شود. در حالت فقط ابزار، انجام ندادن کاری قابل مشاهده یعنی صرفاً ابزار پیام فراخوانی نشود.

نشانگرهای تایپ همچنان هنگام کار agent در حالت فقط ابزار ارسال می‌شوند. حالت تایپ گروهی پیش‌فرض برای این نوبت‌ها از "message" به "instant" ارتقا داده می‌شود، چون ممکن است پیش از اینکه agent تصمیم بگیرد ابزار پیام را فراخوانی کند یا نه، هیچ متن پیام assistant عادی‌ای وجود نداشته باشد. پیکربندی صریح حالت تایپ همچنان اولویت دارد.

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

Gateway پس از ذخیره فایل، پیکربندی `messages` را hot-reload می‌کند. فقط زمانی restart کنید که file watching یا بارگذاری مجدد پیکربندی در استقرار غیرفعال باشد.

برای اینکه خروجی قابل مشاهده برای هر گفتگوی منبع الزاماً از ابزار پیام عبور کند:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

دستورهای slash بومی (Discord، Telegram و سایر سطوحی که از دستور بومی پشتیبانی می‌کنند) از `visibleReplies: "message_tool"` عبور می‌کنند و همیشه به‌صورت قابل مشاهده پاسخ می‌دهند تا UI دستور بومی کانال پاسخی را که انتظار دارد دریافت کند. این فقط برای نوبت‌های دستور بومی اعتبارسنجی‌شده اعمال می‌شود؛ دستورهای `/...` تایپ‌شده به‌صورت متن و نوبت‌های گفتگوی عادی همچنان از پیش‌فرض گروهی پیکربندی‌شده پیروی می‌کنند.

## دیدپذیری context و allowlistها

دو کنترل متفاوت در ایمنی گروهی دخیل هستند:

- **مجوز فعال‌سازی**: چه کسی می‌تواند agent را فعال کند (`groupPolicy`، `groups`، `groupAllowFrom`، allowlistهای ویژه هر کانال).
- **دیدپذیری context**: چه context تکمیلی‌ای به مدل تزریق می‌شود (متن پاسخ، نقل‌قول‌ها، تاریخچه thread، metadata پیام forwarded).

به‌طور پیش‌فرض، OpenClaw رفتار عادی گفتگو را در اولویت می‌گذارد و context را عمدتاً همان‌طور که دریافت شده نگه می‌دارد. یعنی allowlistها در درجه اول تعیین می‌کنند چه کسی می‌تواند actionها را فعال کند، نه اینکه برای هر قطعه نقل‌قول‌شده یا تاریخی یک مرز redaction عمومی باشند.

<AccordionGroup>
  <Accordion title="رفتار فعلی ویژه هر کانال است">
    - برخی کانال‌ها از قبل در مسیرهای مشخص، فیلتر مبتنی بر فرستنده را برای context تکمیلی اعمال می‌کنند (برای مثال seed کردن thread در Slack، و جست‌وجوهای reply/thread در Matrix).
    - کانال‌های دیگر هنوز context نقل‌قول/پاسخ/forward را همان‌طور که دریافت شده عبور می‌دهند.

  </Accordion>
  <Accordion title="مسیر hardening (برنامه‌ریزی‌شده)">
    - `contextVisibility: "all"` (پیش‌فرض) رفتار فعلیِ همان‌طور که دریافت شده را نگه می‌دارد.
    - `contextVisibility: "allowlist"` context تکمیلی را به فرستندگان موجود در allowlist محدود می‌کند.
    - `contextVisibility: "allowlist_quote"` همان `allowlist` به‌علاوه یک استثنای صریح برای quote/reply است.

    تا زمانی که این مدل hardening به‌صورت یکسان در همه کانال‌ها پیاده‌سازی شود، انتظار تفاوت بین سطوح را داشته باشید.

  </Accordion>
</AccordionGroup>

![جریان پیام گروهی](/images/groups-flow.svg)

اگر می‌خواهید...

| هدف                                         | چه چیزی تنظیم شود                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| همه گروه‌ها مجاز باشند اما فقط روی @mentionها پاسخ داده شود | `groups: { "*": { requireMention: true } }`                |
| همه پاسخ‌های گروهی غیرفعال شوند                    | `groupPolicy: "disabled"`                                  |
| فقط گروه‌های مشخص                         | `groups: { "<group-id>": { ... } }` (بدون کلید `"*"` )         |
| فقط شما بتوانید در گروه‌ها فعال‌سازی کنید               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| یک مجموعه فرستنده مورد اعتماد را در چند کانال استفاده کنید | `groupAllowFrom: ["accessGroup:operators"]`                |

برای allowlistهای فرستنده قابل استفاده مجدد، [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.

## کلیدهای session

- sessionهای گروهی از کلیدهای session با قالب `agent:<agentId>:<channel>:group:<id>` استفاده می‌کنند (اتاق‌ها/کانال‌ها از `agent:<agentId>:<channel>:channel:<id>` استفاده می‌کنند).
- موضوع‌های forum در Telegram، `:topic:<threadId>` را به شناسه گروه اضافه می‌کنند تا هر موضوع session خودش را داشته باشد.
- گفتگوهای مستقیم از session اصلی استفاده می‌کنند (یا اگر پیکربندی شده باشد، برای هر فرستنده جداگانه).
- Heartbeatها برای sessionهای گروهی رد می‌شوند.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## الگو: DMهای شخصی + گروه‌های عمومی (یک agent)

بله، اگر ترافیک «شخصی» شما **DMها** و ترافیک «عمومی» شما **گروه‌ها** باشد، این الگو خوب کار می‌کند.

دلیل: در حالت تک‌agent، DMها معمولاً وارد کلید session **اصلی** (`agent:main:main`) می‌شوند، درحالی‌که گروه‌ها همیشه از کلیدهای session **غیراصلی** (`agent:main:<channel>:group:<id>`) استفاده می‌کنند. اگر sandboxing را با `mode: "non-main"` فعال کنید، آن sessionهای گروهی در backend sandbox پیکربندی‌شده اجرا می‌شوند، درحالی‌که session اصلی DM شما روی host می‌ماند. اگر backend انتخاب نکنید، Docker پیش‌فرض است.

این به شما یک «مغز» agent می‌دهد (workspace + memory مشترک)، اما با دو وضعیت اجرایی:

- **DMها**: ابزارهای کامل (host)
- **گروه‌ها**: sandbox + ابزارهای محدودشده

<Note>
اگر به workspaceها/personaهای واقعاً جدا نیاز دارید («شخصی» و «عمومی» هرگز نباید مخلوط شوند)، از agent دوم + bindingها استفاده کنید. [مسیریابی چند-Agent](/fa/concepts/multi-agent) را ببینید.
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
  <Tab title="گروه‌ها فقط یک پوشه موجود در allowlist را می‌بینند">
    می‌خواهید «گروه‌ها فقط پوشه X را ببینند» به‌جای «بدون دسترسی host»؟ `workspaceAccess: "none"` را نگه دارید و فقط مسیرهای موجود در allowlist را در sandbox mount کنید:

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

## برچسب‌های نمایشی

- برچسب‌های UI در صورت در دسترس بودن از `displayName` استفاده می‌کنند و به‌شکل `<channel>:<token>` قالب‌بندی می‌شوند.
- `#room` برای اتاق‌ها/کانال‌ها رزرو شده است؛ گفتگوهای گروهی از `g-<slug>` استفاده می‌کنند (حروف کوچک، فاصله‌ها -> `-`، حفظ `#@+._-`).

## سیاست گروه

نحوه مدیریت پیام‌های گروه/اتاق را برای هر کانال کنترل کنید:

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
| `"open"`      | گروه‌ها allowlistها را دور می‌زنند؛ کنترل منشن همچنان اعمال می‌شود.      |
| `"disabled"`  | همه پیام‌های گروهی را کاملاً مسدود می‌کند.                           |
| `"allowlist"` | فقط گروه‌ها/اتاق‌هایی را مجاز می‌کند که با allowlist پیکربندی‌شده مطابقت دارند. |

<AccordionGroup>
  <Accordion title="نکات ویژه هر کانال">
    - `groupPolicy` جدا از کنترل منشن است (که به @mention نیاز دارد).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: از `groupAllowFrom` استفاده کنید (fallback: `allowFrom` صریح).
    - Signal: `groupAllowFrom` می‌تواند یا با شناسه گروه ورودی Signal یا با تلفن/UUID فرستنده مطابقت داشته باشد.
    - تأییدهای pair کردن DM (ورودی‌های ذخیره `*-allowFrom`) فقط برای دسترسی DM اعمال می‌شوند؛ مجوز فرستنده گروه همچنان به‌صورت صریح در allowlistهای گروه باقی می‌ماند.
    - Discord: allowlist از `channels.discord.guilds.<id>.channels` استفاده می‌کند.
    - Slack: allowlist از `channels.slack.channels` استفاده می‌کند.
    - Matrix: allowlist از `channels.matrix.groups` استفاده می‌کند. شناسه‌ها یا aliasهای اتاق ترجیح داده می‌شوند؛ lookup نام اتاق‌های join شده best-effort است و نام‌های resolve نشده در runtime نادیده گرفته می‌شوند. برای محدود کردن فرستندگان از `channels.matrix.groupAllowFrom` استفاده کنید؛ allowlistهای `users` در سطح هر اتاق نیز پشتیبانی می‌شوند.
    - DMهای گروهی جداگانه کنترل می‌شوند (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - allowlist در Telegram می‌تواند با شناسه‌های کاربری (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) یا usernameها (`"@alice"` یا `"alice"`) مطابقت داشته باشد؛ prefixها به بزرگی/کوچکی حروف حساس نیستند.
    - پیش‌فرض `groupPolicy: "allowlist"` است؛ اگر allowlist گروه شما خالی باشد، پیام‌های گروهی مسدود می‌شوند.
    - ایمنی runtime: وقتی block یک provider کاملاً وجود نداشته باشد (`channels.<provider>` غایب باشد)، سیاست گروه به‌جای ارث‌بری از `channels.defaults.groupPolicy` به حالت fail-closed برمی‌گردد (معمولاً `allowlist`).

  </Accordion>
</AccordionGroup>

مدل ذهنی سریع (ترتیب ارزیابی برای پیام‌های گروهی):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (باز/غیرفعال/فهرست مجاز).
  </Step>
  <Step title="فهرست‌های مجاز گروه">
    فهرست‌های مجاز گروه (`*.groups`، `*.groupAllowFrom`، فهرست مجاز مخصوص کانال).
  </Step>
  <Step title="کنترل منشن">
    کنترل منشن (`requireMention`، `/activation`).
  </Step>
</Steps>

## کنترل منشن (پیش‌فرض)

پیام‌های گروهی به منشن نیاز دارند، مگر اینکه برای هر گروه بازنویسی شده باشد. پیش‌فرض‌ها برای هر زیرسامانه زیر `*.groups."*"` قرار دارند.

پاسخ دادن به پیام بات، وقتی کانال از فراداده پاسخ پشتیبانی کند، به‌عنوان یک منشن ضمنی محسوب می‌شود. نقل‌قول کردن پیام بات نیز در کانال‌هایی که فراداده نقل‌قول را ارائه می‌کنند می‌تواند به‌عنوان منشن ضمنی محسوب شود. موارد داخلی فعلی شامل Telegram، WhatsApp، Slack، Discord، Microsoft Teams و ZaloUser هستند.

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
  <Accordion title="نکات کنترل منشن">
    - `mentionPatterns` الگوهای regex ایمن و بدون حساسیت به بزرگی/کوچکی حروف هستند؛ الگوهای نامعتبر و شکل‌های تکرار تودرتوی ناایمن نادیده گرفته می‌شوند.
    - سطح‌هایی که منشن‌های صریح ارائه می‌کنند همچنان عبور می‌کنند؛ الگوها نقش fallback دارند.
    - بازنویسی برای هر عامل: `agents.list[].groupChat.mentionPatterns` (وقتی چند عامل یک گروه را به اشتراک می‌گذارند مفید است).
    - کنترل منشن فقط وقتی اعمال می‌شود که تشخیص منشن ممکن باشد (منشن‌های بومی یا `mentionPatterns` پیکربندی شده باشند).
    - قرار دادن یک گروه یا فرستنده در فهرست مجاز، کنترل منشن را غیرفعال نمی‌کند؛ وقتی همه پیام‌ها باید فعال شوند، `requireMention` آن گروه را روی `false` تنظیم کنید.
    - زمینه پرامپت چت گروهی در هر نوبت دستور پاسخ بی‌صدای حل‌شده را حمل می‌کند؛ فایل‌های workspace نباید سازوکار `NO_REPLY` را تکرار کنند.
    - گروه‌هایی که پاسخ‌های بی‌صدا در آن‌ها مجاز است، نوبت‌های مدلِ تمیزِ خالی یا فقط استدلال را بی‌صدا در نظر می‌گیرند، معادل `NO_REPLY`. چت‌های مستقیم فقط وقتی همین کار را انجام می‌دهند که پاسخ‌های بی‌صدای مستقیم صراحتاً مجاز باشند؛ در غیر این صورت پاسخ‌های خالی همچنان نوبت‌های ناموفق عامل می‌مانند.
    - پیش‌فرض‌های Discord در `channels.discord.guilds."*"` قرار دارند (قابل بازنویسی برای هر guild/کانال).
    - زمینه تاریخچه گروه به‌طور یکنواخت در سراسر کانال‌ها بسته‌بندی می‌شود و **فقط در حالت pending** است (پیام‌هایی که به دلیل کنترل منشن رد شده‌اند)؛ برای پیش‌فرض سراسری از `messages.groupChat.historyLimit` و برای بازنویسی‌ها از `channels.<channel>.historyLimit` (یا `channels.<channel>.accounts.*.historyLimit`) استفاده کنید. برای غیرفعال کردن، `0` تنظیم کنید.

  </Accordion>
</AccordionGroup>

## محدودیت‌های ابزار گروه/کانال (اختیاری)

برخی پیکربندی‌های کانال از محدود کردن ابزارهایی که **داخل یک گروه/اتاق/کانال مشخص** در دسترس هستند پشتیبانی می‌کنند.

- `tools`: اجازه/رد ابزارها برای کل گروه.
- `toolsBySender`: بازنویسی‌های مخصوص هر فرستنده درون گروه. از پیشوندهای کلید صریح استفاده کنید: `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>` و wildcard `"*"`. کلیدهای قدیمی بدون پیشوند هنوز پذیرفته می‌شوند و فقط به‌عنوان `id:` مطابقت داده می‌شوند.

ترتیب حل (مشخص‌ترین مورد برنده است):

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
محدودیت‌های ابزار گروه/کانال علاوه بر سیاست ابزار سراسری/عامل اعمال می‌شوند (deny همچنان برنده است). برخی کانال‌ها برای اتاق‌ها/کانال‌ها از تودرتویی متفاوتی استفاده می‌کنند (برای مثال، Discord `guilds.*.channels.*`، Slack `channels.*`، Microsoft Teams `teams.*.channels.*`).
</Note>

## فهرست‌های مجاز گروه

وقتی `channels.whatsapp.groups`، `channels.telegram.groups` یا `channels.imessage.groups` پیکربندی شده باشد، کلیدها به‌عنوان فهرست مجاز گروه عمل می‌کنند. برای اجازه دادن به همه گروه‌ها و در عین حال تنظیم رفتار پیش‌فرض منشن، از `"*"` استفاده کنید.

<Warning>
اشتباه رایج: تأیید جفت‌سازی DM با مجوزدهی گروه یکسان نیست. برای کانال‌هایی که از جفت‌سازی DM پشتیبانی می‌کنند، ذخیره جفت‌سازی فقط DMها را باز می‌کند. دستورهای گروه همچنان به مجوز صریح فرستنده گروه از فهرست‌های مجاز پیکربندی مانند `groupAllowFrom` یا fallback پیکربندی مستندشده برای آن کانال نیاز دارند.
</Warning>

نیت‌های رایج (کپی/پیست):

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

مالکان گروه می‌توانند فعال‌سازی مخصوص هر گروه را تغییر دهند:

- `/activation mention`
- `/activation always`

مالک توسط `channels.whatsapp.allowFrom` تعیین می‌شود (یا وقتی تنظیم نشده باشد، E.164 خود بات). دستور را به‌عنوان یک پیام مستقل ارسال کنید. سطح‌های دیگر در حال حاضر `/activation` را نادیده می‌گیرند.

## فیلدهای زمینه

payloadهای ورودی گروه این‌ها را تنظیم می‌کنند:

- `ChatType=group`
- `GroupSubject` (اگر شناخته شده باشد)
- `GroupMembers` (اگر شناخته شده باشد)
- `WasMentioned` (نتیجه کنترل منشن)
- موضوعات انجمن Telegram همچنین شامل `MessageThreadId` و `IsForum` هستند.

نکات مخصوص کانال:

- BlueBubbles می‌تواند به‌صورت اختیاری شرکت‌کنندگان بی‌نام گروه macOS را از پایگاه‌داده Contacts محلی پیش از پر کردن `GroupMembers` غنی کند. این قابلیت به‌طور پیش‌فرض خاموش است و فقط پس از عبور کنترل عادی گروه اجرا می‌شود.

پرامپت سیستم عامل در اولین نوبت یک نشست گروهی جدید، یک معرفی گروهی را شامل می‌شود. این معرفی به مدل یادآوری می‌کند مانند انسان پاسخ دهد، از جدول‌های Markdown پرهیز کند، خطوط خالی را به حداقل برساند و فاصله‌گذاری عادی چت را دنبال کند، و از تایپ کردن دنباله‌های لفظی `\n` خودداری کند. نام‌های گروه و برچسب‌های شرکت‌کننده که از کانال گرفته شده‌اند، به‌صورت فراداده غیرقابل‌اعتماد fenced رندر می‌شوند، نه دستورهای سیستمی inline.

## جزئیات iMessage

- هنگام مسیریابی یا قرار دادن در فهرست مجاز، `chat_id:<id>` را ترجیح دهید.
- فهرست کردن چت‌ها: `imsg chats --limit 20`.
- پاسخ‌های گروه همیشه به همان `chat_id` برمی‌گردند.

## پرامپت‌های سیستم WhatsApp

برای قواعد canonical پرامپت سیستم WhatsApp، شامل حل پرامپت گروهی و مستقیم، رفتار wildcard و معناشناسی بازنویسی حساب، [WhatsApp](/fa/channels/whatsapp#system-prompts) را ببینید.

## جزئیات WhatsApp

برای رفتار فقط مخصوص WhatsApp (تزریق تاریخچه، جزئیات مدیریت منشن)، [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

## مرتبط

- [گروه‌های broadcast](/fa/channels/broadcast-groups)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [پیام‌های گروهی](/fa/channels/group-messages)
- [جفت‌سازی](/fa/channels/pairing)
