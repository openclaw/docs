---
read_when:
    - تغییر رفتار گفت‌وگوی گروهی یا محدودسازی بر اساس منشن
sidebarTitle: Groups
summary: رفتار گفت‌وگوی گروهی در سطوح مختلف (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: گروه‌ها
x-i18n:
    generated_at: "2026-04-30T16:27:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw چت‌های گروهی را در همهٔ سطوح به‌صورت یکسان مدیریت می‌کند: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## مقدمهٔ مبتدیان (۲ دقیقه)

OpenClaw روی حساب‌های پیام‌رسانی خودتان «زندگی می‌کند». کاربر بات جداگانه‌ای برای WhatsApp وجود ندارد. اگر **شما** در یک گروه باشید، OpenClaw می‌تواند آن گروه را ببیند و همان‌جا پاسخ دهد.

رفتار پیش‌فرض:

- گروه‌ها محدود هستند (`groupPolicy: "allowlist"`).
- پاسخ‌ها به منشن نیاز دارند، مگر اینکه gate منشن را صریحاً غیرفعال کنید.
- پاسخ‌های نهایی عادی در گروه‌ها/کانال‌ها به‌طور پیش‌فرض خصوصی هستند. خروجی قابل‌مشاهدهٔ اتاق از ابزار `message` استفاده می‌کند.

ترجمه: فرستندگان allowlist‌شده می‌توانند با منشن کردن OpenClaw آن را فعال کنند.

<Note>
**خلاصه**

- **دسترسی DM** با `*.allowFrom` کنترل می‌شود.
- **دسترسی گروه** با `*.groupPolicy` + allowlistها (`*.groups`، `*.groupAllowFrom`) کنترل می‌شود.
- **فعال‌سازی پاسخ** با gate منشن (`requireMention`، `/activation`) کنترل می‌شود.

</Note>

جریان سریع (برای یک پیام گروهی چه اتفاقی می‌افتد):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## پاسخ‌های قابل‌مشاهده

برای اتاق‌های گروه/کانال، OpenClaw به‌طور پیش‌فرض از `messages.groupChat.visibleReplies: "message_tool"` استفاده می‌کند.
یعنی agent همچنان turn را پردازش می‌کند و می‌تواند وضعیت memory/session را به‌روزرسانی کند، اما پاسخ نهایی عادی آن به‌صورت خودکار در اتاق منتشر نمی‌شود. برای صحبت کردن به‌شکل قابل‌مشاهده، agent از `message(action=send)` استفاده می‌کند.

برای چت‌های مستقیم و هر turn منبع دیگر، از `messages.visibleReplies: "message_tool"` استفاده کنید تا همین رفتار پاسخ قابل‌مشاهدهٔ فقط‌ابزاری به‌صورت سراسری اعمال شود. `messages.groupChat.visibleReplies` همچنان override اختصاصی‌تر برای اتاق‌های گروه/کانال باقی می‌ماند.

این جایگزین الگوی قدیمی مجبور کردن مدل به پاسخ `NO_REPLY` برای بیشتر turnهای حالت کمین می‌شود. در حالت فقط‌ابزاری، انجام ندادن هیچ کار قابل‌مشاهده‌ای فقط یعنی ابزار message فراخوانی نشود.

در حالت فقط‌ابزاری، هنگام کار کردن agent همچنان نشانگرهای تایپ ارسال می‌شوند. حالت پیش‌فرض تایپ گروه برای این turnها از "message" به "instant" ارتقا داده می‌شود، چون ممکن است پیش از اینکه agent تصمیم بگیرد آیا ابزار message را فراخوانی کند یا نه، هرگز متن پیام عادی assistant وجود نداشته باشد. پیکربندی صریح حالت تایپ همچنان اولویت دارد.

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

Gateway پس از ذخیره شدن فایل، پیکربندی `messages` را hot-reload می‌کند. فقط زمانی restart کنید
که file watching یا reload پیکربندی در deployment غیرفعال باشد.

برای اینکه خروجی قابل‌مشاهده در هر چت منبعی از ابزار message عبور کند:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

دستورهای slash بومی (Discord، Telegram و سطوح دیگر با پشتیبانی از دستور بومی) `visibleReplies: "message_tool"` را دور می‌زنند و همیشه به‌شکل قابل‌مشاهده پاسخ می‌دهند تا UI دستور بومی کانال پاسخی را که انتظار دارد دریافت کند. این فقط برای turnهای دستور بومی اعتبارسنجی‌شده اعمال می‌شود؛ دستورهای `/...` تایپ‌شده به‌صورت متن و turnهای چت عادی همچنان از پیش‌فرض گروه پیکربندی‌شده پیروی می‌کنند.

## دیدپذیری context و allowlistها

دو کنترل متفاوت در ایمنی گروه دخیل هستند:

- **مجوز trigger**: چه کسی می‌تواند agent را trigger کند (`groupPolicy`، `groups`، `groupAllowFrom`، allowlistهای اختصاصی کانال).
- **دیدپذیری context**: چه context تکمیلی به مدل تزریق می‌شود (متن پاسخ، نقل‌قول‌ها، تاریخچهٔ thread، metadata فورواردشده).

به‌طور پیش‌فرض، OpenClaw رفتار عادی چت را در اولویت می‌گذارد و context را عمدتاً همان‌طور که دریافت شده نگه می‌دارد. یعنی allowlistها در درجهٔ اول تعیین می‌کنند چه کسی می‌تواند actions را trigger کند، نه اینکه مرز redaction همگانی برای هر قطعهٔ نقل‌شده یا تاریخی باشند.

<AccordionGroup>
  <Accordion title="رفتار فعلی اختصاصیِ کانال است">
    - برخی کانال‌ها از قبل در مسیرهای خاص، فیلتر sender-based را برای context تکمیلی اعمال می‌کنند (برای مثال seeding thread در Slack، lookupهای reply/thread در Matrix).
    - کانال‌های دیگر همچنان context نقل‌قول/پاسخ/فوروارد را همان‌طور که دریافت شده عبور می‌دهند.

  </Accordion>
  <Accordion title="مسیر سخت‌سازی (برنامه‌ریزی‌شده)">
    - `contextVisibility: "all"` (پیش‌فرض) رفتار فعلیِ همان‌طور-دریافت‌شده را حفظ می‌کند.
    - `contextVisibility: "allowlist"` context تکمیلی را به فرستندگان allowlist‌شده فیلتر می‌کند.
    - `contextVisibility: "allowlist_quote"` همان `allowlist` به‌همراه یک استثنای صریح برای نقل‌قول/پاسخ است.

    تا زمانی که این مدل سخت‌سازی به‌صورت سازگار در همهٔ کانال‌ها پیاده‌سازی شود، انتظار تفاوت بین سطوح را داشته باشید.

  </Accordion>
</AccordionGroup>

![جریان پیام گروهی](/images/groups-flow.svg)

اگر می‌خواهید...

| هدف                                         | چه چیزی تنظیم شود                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| همهٔ گروه‌ها مجاز باشند اما فقط روی @mentions پاسخ داده شود | `groups: { "*": { requireMention: true } }`                |
| همهٔ پاسخ‌های گروهی غیرفعال شوند                    | `groupPolicy: "disabled"`                                  |
| فقط گروه‌های مشخص                         | `groups: { "<group-id>": { ... } }` (بدون کلید `"*"` )         |
| فقط شما بتوانید در گروه‌ها trigger کنید               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## کلیدهای session

- sessionهای گروه از کلیدهای session با قالب `agent:<agentId>:<channel>:group:<id>` استفاده می‌کنند (اتاق‌ها/کانال‌ها از `agent:<agentId>:<channel>:channel:<id>` استفاده می‌کنند).
- topicهای forum در Telegram، `:topic:<threadId>` را به group id اضافه می‌کنند تا هر topic session خودش را داشته باشد.
- چت‌های مستقیم از session اصلی استفاده می‌کنند (یا اگر پیکربندی شده باشد، به‌ازای هر فرستنده).
- Heartbeatها برای sessionهای گروه نادیده گرفته می‌شوند.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## الگو: DMهای شخصی + گروه‌های عمومی (یک agent)

بله — اگر ترافیک «شخصی» شما **DMها** و ترافیک «عمومی» شما **گروه‌ها** باشد، این به‌خوبی کار می‌کند.

چرا: در حالت تک‌agent، DMها معمولاً وارد کلید session **اصلی** (`agent:main:main`) می‌شوند، در حالی‌که گروه‌ها همیشه از کلیدهای session **غیراصلی** (`agent:main:<channel>:group:<id>`) استفاده می‌کنند. اگر sandboxing را با `mode: "non-main"` فعال کنید، آن sessionهای گروه در sandbox backend پیکربندی‌شده اجرا می‌شوند، در حالی که session اصلی DM شما روی host باقی می‌ماند. اگر backend انتخاب نکنید، Docker backend پیش‌فرض است.

این به شما یک «مغز» agent می‌دهد (workspace + memory مشترک)، اما با دو وضعیت اجرا:

- **DMها**: ابزارهای کامل (host)
- **گروه‌ها**: sandbox + ابزارهای محدود

<Note>
اگر به workspaceها/personaهای واقعاً جدا نیاز دارید («شخصی» و «عمومی» هرگز نباید با هم مخلوط شوند)، از agent دوم + bindings استفاده کنید. [Multi-Agent Routing](/fa/concepts/multi-agent) را ببینید.
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
  <Tab title="گروه‌ها فقط یک پوشهٔ allowlist‌شده را می‌بینند">
    به‌جای «بدون دسترسی host»، می‌خواهید «گروه‌ها فقط پوشهٔ X را ببینند»؟ `workspaceAccess: "none"` را نگه دارید و فقط مسیرهای allowlist‌شده را در sandbox mount کنید:

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
- عیب‌یابی اینکه چرا یک ابزار مسدود شده است: [Sandbox در برابر Tool Policy در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated)
- جزئیات bind mountها: [Sandboxing](/fa/gateway/sandboxing#custom-bind-mounts)

## برچسب‌های نمایش

- برچسب‌های UI، وقتی `displayName` موجود باشد، از آن استفاده می‌کنند و به‌شکل `<channel>:<token>` قالب‌بندی می‌شوند.
- `#room` برای اتاق‌ها/کانال‌ها رزرو شده است؛ چت‌های گروهی از `g-<slug>` استفاده می‌کنند (حروف کوچک، فاصله‌ها -> `-`، حفظ `#@+._-`).

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
| `"open"`      | گروه‌ها allowlistها را دور می‌زنند؛ mention-gating همچنان اعمال می‌شود.      |
| `"disabled"`  | همهٔ پیام‌های گروهی را کاملاً مسدود می‌کند.                           |
| `"allowlist"` | فقط گروه‌ها/اتاق‌هایی را مجاز می‌کند که با allowlist پیکربندی‌شده مطابقت دارند. |

<AccordionGroup>
  <Accordion title="نکته‌های هر کانال">
    - `groupPolicy` از mention-gating (که به @mentions نیاز دارد) جداست.
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: از `groupAllowFrom` استفاده کنید (fallback: `allowFrom` صریح).
    - Signal: `groupAllowFrom` می‌تواند هم با inbound Signal group id و هم با تلفن/UUID فرستنده مطابقت داشته باشد.
    - تأییدهای pairing در DM (ورودی‌های store مربوط به `*-allowFrom`) فقط برای دسترسی DM اعمال می‌شوند؛ مجوز فرستندهٔ گروه برای allowlistهای گروه صریح باقی می‌ماند.
    - Discord: allowlist از `channels.discord.guilds.<id>.channels` استفاده می‌کند.
    - Slack: allowlist از `channels.slack.channels` استفاده می‌کند.
    - Matrix: allowlist از `channels.matrix.groups` استفاده می‌کند. room IDها یا aliasها را ترجیح دهید؛ lookup نام اتاق‌های joined به‌صورت best-effort است و نام‌های resolveنشده در runtime نادیده گرفته می‌شوند. برای محدود کردن فرستندگان از `channels.matrix.groupAllowFrom` استفاده کنید؛ allowlistهای `users` به‌ازای هر اتاق نیز پشتیبانی می‌شوند.
    - DMهای گروهی جداگانه کنترل می‌شوند (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - allowlist در Telegram می‌تواند با user IDها (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) یا usernameها (`"@alice"` یا `"alice"`) مطابقت داشته باشد؛ prefixها به بزرگی/کوچکی حروف حساس نیستند.
    - پیش‌فرض `groupPolicy: "allowlist"` است؛ اگر allowlist گروه شما خالی باشد، پیام‌های گروهی مسدود می‌شوند.
    - ایمنی runtime: وقتی یک provider block کاملاً وجود ندارد (`channels.<provider>` غایب است)، سیاست گروه به‌جای ارث‌بری از `channels.defaults.groupPolicy` به حالت fail-closed برمی‌گردد (معمولاً `allowlist`).

  </Accordion>
</AccordionGroup>

مدل ذهنی سریع (ترتیب ارزیابی برای پیام‌های گروهی):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Allowlistهای گروه">
    allowlistهای گروه (`*.groups`، `*.groupAllowFrom`، allowlist اختصاصی کانال).
  </Step>
  <Step title="Mention gating">
    Mention gating (`requireMention`، `/activation`).
  </Step>
</Steps>

## Mention gating (پیش‌فرض)

پیام‌های گروهی به منشن نیاز دارند، مگر اینکه به‌ازای هر گروه override شده باشد. پیش‌فرض‌ها برای هر subsystem زیر `*.groups."*"` قرار دارند.

پاسخ دادن به پیام ربات، زمانی که کانال از فرادادهٔ پاسخ پشتیبانی کند، به‌عنوان اشارهٔ ضمنی محسوب می‌شود. نقل‌قول کردن پیام ربات نیز در کانال‌هایی که فرادادهٔ نقل‌قول را ارائه می‌کنند می‌تواند به‌عنوان اشارهٔ ضمنی محسوب شود. موارد داخلی فعلی شامل Telegram، WhatsApp، Slack، Discord، Microsoft Teams و ZaloUser هستند.

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
  <Accordion title="Mention gating notes">
    - `mentionPatterns` الگوهای regex ایمن و بدون حساسیت به حروف کوچک و بزرگ هستند؛ الگوهای نامعتبر و شکل‌های تکرار تودرتوی ناامن نادیده گرفته می‌شوند.
    - سطح‌هایی که اشاره‌های صریح ارائه می‌کنند همچنان عبور می‌کنند؛ الگوها نقش پشتیبان دارند.
    - بازنویسی برای هر عامل: `agents.list[].groupChat.mentionPatterns` (زمانی مفید است که چند عامل یک گروه را به‌اشتراک می‌گذارند).
    - دروازه‌گذاری اشاره فقط زمانی اعمال می‌شود که تشخیص اشاره ممکن باشد (اشاره‌های بومی یا `mentionPatterns` پیکربندی شده باشند).
    - قرار دادن یک گروه یا فرستنده در فهرست مجاز، دروازه‌گذاری اشاره را غیرفعال نمی‌کند؛ وقتی همهٔ پیام‌ها باید فعال‌سازی کنند، `requireMention` آن گروه را روی `false` تنظیم کنید.
    - زمینهٔ اعلان گفت‌وگوی گروهی در هر نوبت دستور پاسخ بی‌صدای حل‌شده را حمل می‌کند؛ فایل‌های workspace نباید سازوکار `NO_REPLY` را تکرار کنند.
    - گروه‌هایی که در آن‌ها پاسخ‌های بی‌صدا مجاز است، نوبت‌های مدل خالی تمیز یا فقط شامل استدلال را بی‌صدا تلقی می‌کنند، معادل `NO_REPLY`. گفت‌وگوهای مستقیم فقط زمانی همین کار را می‌کنند که پاسخ‌های مستقیم بی‌صدا صریحا مجاز شده باشند؛ در غیر این صورت پاسخ‌های خالی همچنان نوبت‌های ناموفق عامل باقی می‌مانند.
    - پیش‌فرض‌های Discord در `channels.discord.guilds."*"` قرار دارند (برای هر guild/channel قابل بازنویسی).
    - زمینهٔ تاریخچهٔ گروه در همهٔ کانال‌ها به‌شکل یکنواخت بسته‌بندی می‌شود و **فقط معلق** است (پیام‌هایی که به‌دلیل دروازه‌گذاری اشاره رد شده‌اند)؛ برای پیش‌فرض سراسری از `messages.groupChat.historyLimit` و برای بازنویسی‌ها از `channels.<channel>.historyLimit` (یا `channels.<channel>.accounts.*.historyLimit`) استفاده کنید. برای غیرفعال کردن، `0` تنظیم کنید.

  </Accordion>
</AccordionGroup>

## محدودیت‌های ابزار گروه/کانال (اختیاری)

برخی پیکربندی‌های کانال از محدود کردن ابزارهای در دسترس **داخل یک گروه/اتاق/کانال مشخص** پشتیبانی می‌کنند.

- `tools`: اجازه/رد کردن ابزارها برای کل گروه.
- `toolsBySender`: بازنویسی‌های هر فرستنده درون گروه. از پیشوندهای کلید صریح استفاده کنید: `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>`، و wildcard `"*"`. کلیدهای قدیمی بدون پیشوند همچنان پذیرفته می‌شوند و فقط به‌عنوان `id:` تطبیق داده می‌شوند.

ترتیب حل‌وفصل (خاص‌ترین مورد برنده است):

<Steps>
  <Step title="Group toolsBySender">
    `toolsBySender` گروه/کانال تطبیق می‌خورد.
  </Step>
  <Step title="Group tools">
    `tools` گروه/کانال.
  </Step>
  <Step title="Default toolsBySender">
    تطبیق `toolsBySender` پیش‌فرض (`"*"`).
  </Step>
  <Step title="Default tools">
    `tools` پیش‌فرض (`"*"`).
  </Step>
</Steps>

نمونه (Telegram):

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
محدودیت‌های ابزار گروه/کانال علاوه بر خط‌مشی ابزار سراسری/عامل اعمال می‌شوند (رد کردن همچنان برنده است). برخی کانال‌ها از تودرتویی متفاوتی برای اتاق‌ها/کانال‌ها استفاده می‌کنند (مثلا Discord `guilds.*.channels.*`، Slack `channels.*`، Microsoft Teams `teams.*.channels.*`).
</Note>

## فهرست‌های مجاز گروه

وقتی `channels.whatsapp.groups`، `channels.telegram.groups`، یا `channels.imessage.groups` پیکربندی شده باشد، کلیدها مانند فهرست مجاز گروه عمل می‌کنند. از `"*"` برای مجاز کردن همهٔ گروه‌ها استفاده کنید و هم‌زمان رفتار پیش‌فرض اشاره را تنظیم کنید.

<Warning>
ابهام رایج: تایید جفت‌سازی DM با مجوز گروه یکسان نیست. برای کانال‌هایی که از جفت‌سازی DM پشتیبانی می‌کنند، ذخیره‌گاه جفت‌سازی فقط DMها را باز می‌کند. فرمان‌های گروه همچنان به مجوز صریح فرستندهٔ گروه از فهرست‌های مجاز پیکربندی مانند `groupAllowFrom` یا پشتیبان پیکربندی مستند همان کانال نیاز دارند.
</Warning>

نیت‌های رایج (کپی/پیست):

<Tabs>
  <Tab title="Disable all group replies">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Allow only specific groups (WhatsApp)">
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
  <Tab title="Allow all groups but require mention">
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
  <Tab title="Owner-only triggers (WhatsApp)">
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

مالک با `channels.whatsapp.allowFrom` تعیین می‌شود (یا E.164 خود ربات وقتی تنظیم نشده باشد). فرمان را به‌صورت یک پیام مستقل ارسال کنید. سطح‌های دیگر در حال حاضر `/activation` را نادیده می‌گیرند.

## فیلدهای زمینه

payloadهای ورودی گروه تنظیم می‌کنند:

- `ChatType=group`
- `GroupSubject` (اگر شناخته شده باشد)
- `GroupMembers` (اگر شناخته شده باشد)
- `WasMentioned` (نتیجهٔ دروازه‌گذاری اشاره)
- موضوعات تالار Telegram همچنین شامل `MessageThreadId` و `IsForum` هستند.

یادداشت‌های ویژهٔ کانال:

- BlueBubbles می‌تواند به‌صورت اختیاری، پیش از پر کردن `GroupMembers`، شرکت‌کنندگان بی‌نام گروه macOS را از پایگاه‌دادهٔ Contacts محلی غنی‌سازی کند. این قابلیت به‌صورت پیش‌فرض خاموش است و فقط پس از عبور دروازه‌گذاری عادی گروه اجرا می‌شود.

اعلان سیستمی عامل در اولین نوبت یک نشست گروهی جدید، یک مقدمهٔ گروهی دارد. این مقدمه به مدل یادآوری می‌کند مثل انسان پاسخ دهد، از جدول‌های Markdown پرهیز کند، خط‌های خالی را به حداقل برساند و فاصله‌گذاری عادی گفت‌وگو را رعایت کند، و از تایپ دنباله‌های لفظی `\n` خودداری کند. نام‌های گروه و برچسب‌های شرکت‌کنندگان که از کانال می‌آیند به‌صورت فرادادهٔ نامطمئن حصارگذاری‌شده رندر می‌شوند، نه دستورهای سیستمی درون‌خطی.

## جزئیات iMessage

- هنگام مسیریابی یا قرار دادن در فهرست مجاز، `chat_id:<id>` را ترجیح دهید.
- فهرست گفت‌وگوها: `imsg chats --limit 20`.
- پاسخ‌های گروه همیشه به همان `chat_id` برمی‌گردند.

## اعلان‌های سیستمی WhatsApp

برای قواعد مرجع اعلان سیستمی WhatsApp، از جمله حل اعلان گروهی و مستقیم، رفتار wildcard، و معناشناسی بازنویسی حساب، به [WhatsApp](/fa/channels/whatsapp#system-prompts) مراجعه کنید.

## جزئیات WhatsApp

برای رفتار مختص WhatsApp (تزریق تاریخچه، جزئیات مدیریت اشاره) به [پیام‌های گروهی](/fa/channels/group-messages) مراجعه کنید.

## مرتبط

- [گروه‌های پخش](/fa/channels/broadcast-groups)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [پیام‌های گروهی](/fa/channels/group-messages)
- [جفت‌سازی](/fa/channels/pairing)
