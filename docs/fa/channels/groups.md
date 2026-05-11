---
read_when:
    - تغییر رفتار گفت‌وگوی گروهی یا کنترل مبتنی بر منشن
sidebarTitle: Groups
summary: رفتار چت گروهی در سطوح مختلف (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: گروه‌ها
x-i18n:
    generated_at: "2026-05-11T20:20:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw با گفت‌وگوهای گروهی در سطح‌های مختلف به‌صورت یکسان رفتار می‌کند: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## معرفی مقدماتی (۲ دقیقه)

OpenClaw روی حساب‌های پیام‌رسانی خودتان «زندگی می‌کند». کاربر ربات جداگانه‌ای برای WhatsApp وجود ندارد. اگر **شما** در یک گروه باشید، OpenClaw می‌تواند آن گروه را ببیند و همان‌جا پاسخ دهد.

رفتار پیش‌فرض:

- گروه‌ها محدود هستند (`groupPolicy: "allowlist"`).
- پاسخ‌ها به منشن نیاز دارند، مگر اینکه صراحتا دروازه‌گذاری منشن را غیرفعال کنید.
- پاسخ‌های نهایی عادی در گروه‌ها/کانال‌ها به‌طور پیش‌فرض خصوصی هستند. خروجی قابل مشاهده در اتاق از ابزار `message` استفاده می‌کند.

ترجمه: فرستندگان allowlist‌شده می‌توانند با منشن کردن OpenClaw آن را فعال کنند.

<Note>
**خلاصه**

- **دسترسی DM** با `*.allowFrom` کنترل می‌شود.
- **دسترسی گروه** با `*.groupPolicy` + allowlist‌ها (`*.groups`، `*.groupAllowFrom`) کنترل می‌شود.
- **فعال‌سازی پاسخ** با دروازه‌گذاری منشن (`requireMention`، `/activation`) کنترل می‌شود.

</Note>

جریان سریع (برای یک پیام گروهی چه اتفاقی می‌افتد):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## پاسخ‌های قابل مشاهده

برای اتاق‌های گروهی/کانالی، مقدار پیش‌فرض OpenClaw برای `messages.groupChat.visibleReplies` برابر `"message_tool"` است.
`openclaw doctor --fix` این مقدار پیش‌فرض را در پیکربندی‌های کانال‌های پیکربندی‌شده‌ای که آن را ندارند می‌نویسد.
یعنی agent همچنان نوبت را پردازش می‌کند و می‌تواند وضعیت حافظه/نشست را به‌روزرسانی کند، اما پاسخ نهایی عادی آن به‌طور خودکار در اتاق ارسال نمی‌شود. برای صحبت کردن به‌صورت قابل مشاهده، agent از `message(action=send)` استفاده می‌کند.

این پیش‌فرض به مدل/زمان اجرایی‌ای وابسته است که ابزارها را به‌طور قابل اعتماد فراخوانی کند. اگر لاگ‌ها متن assistant را نشان دهند اما `didSendViaMessagingTool: false` باشد، مدل به‌جای فراخوانی ابزار پیام، به‌صورت خصوصی پاسخ داده است. این شکست ارسال Discord/Slack/Telegram نیست. برای نشست‌های گروهی/کانالی از مدلی استفاده کنید که در فراخوانی ابزار قابل اعتماد باشد، یا `messages.groupChat.visibleReplies: "automatic"` را تنظیم کنید تا پاسخ‌های نهایی قابل مشاهده قدیمی بازیابی شوند.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل مشاهده خودکار برمی‌گردد.
`openclaw doctor` درباره این ناهماهنگی هشدار می‌دهد.

برای گفت‌وگوهای مستقیم و هر نوبت منبع دیگر، از `messages.visibleReplies: "message_tool"` استفاده کنید تا همان رفتار پاسخ قابل مشاهده فقط از طریق ابزار را به‌صورت سراسری اعمال کنید. Harnessها هم می‌توانند این گزینه را به‌عنوان پیش‌فرضِ تنظیم‌نشده خود انتخاب کنند؛ harness مربوط به Codex این کار را برای گفت‌وگوهای مستقیم در حالت Codex انجام می‌دهد. `messages.groupChat.visibleReplies` همچنان override اختصاصی‌تر برای اتاق‌های گروهی/کانالی باقی می‌ماند.

این جایگزین الگوی قدیمی‌ای می‌شود که مدل را مجبور می‌کرد برای بیشتر نوبت‌های حالت lurk با `NO_REPLY` پاسخ دهد. در حالت فقط ابزار، انجام ندادن هیچ کار قابل مشاهده‌ای صرفا یعنی ابزار پیام فراخوانی نشود.

نشانگرهای در حال تایپ همچنان هنگام کار agent در حالت فقط ابزار ارسال می‌شوند. حالت پیش‌فرض تایپ گروه برای این نوبت‌ها از "message" به "instant" ارتقا داده می‌شود، چون ممکن است قبل از اینکه agent تصمیم بگیرد ابزار پیام را فراخوانی کند یا نه، هیچ متن پیام عادی از assistant وجود نداشته باشد. پیکربندی صریح حالت تایپ همچنان اولویت دارد.

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

Gateway پس از ذخیره فایل، پیکربندی `messages` را hot-reload می‌کند. فقط زمانی restart کنید که file watching یا reload پیکربندی در deployment غیرفعال باشد.

برای الزام اینکه خروجی قابل مشاهده در هر گفت‌وگوی منبع از ابزار پیام عبور کند:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

دستورهای slash بومی (Discord، Telegram و سطح‌های دیگری که از دستور بومی پشتیبانی می‌کنند) از `visibleReplies: "message_tool"` عبور می‌کنند و همیشه به‌صورت قابل مشاهده پاسخ می‌دهند تا UI دستور بومی کانال پاسخی را دریافت کند که انتظار دارد. این فقط برای نوبت‌های دستور بومی اعتبارسنجی‌شده اعمال می‌شود؛ دستورهای `/...` تایپ‌شده به‌صورت متن و نوبت‌های گفت‌وگوی عادی همچنان از پیش‌فرض گروه پیکربندی‌شده پیروی می‌کنند.

## مشاهده‌پذیری زمینه و allowlist‌ها

دو کنترل متفاوت در ایمنی گروه نقش دارند:

- **مجوز فعال‌سازی**: چه کسی می‌تواند agent را فعال کند (`groupPolicy`، `groups`، `groupAllowFrom`، allowlist‌های اختصاصی کانال).
- **مشاهده‌پذیری زمینه**: چه زمینه تکمیلی‌ای به مدل تزریق می‌شود (متن پاسخ، نقل‌قول‌ها، تاریخچه thread، فراداده forward‌شده).

به‌طور پیش‌فرض، OpenClaw رفتار عادی گفت‌وگو را در اولویت قرار می‌دهد و زمینه را عمدتا همان‌طور که دریافت شده نگه می‌دارد. یعنی allowlist‌ها در درجه اول تعیین می‌کنند چه کسی می‌تواند اقدام‌ها را فعال کند، نه اینکه برای هر قطعه نقل‌قول‌شده یا تاریخی یک مرز ویرایش همگانی باشند.

<AccordionGroup>
  <Accordion title="رفتار فعلی اختصاصی کانال است">
    - برخی کانال‌ها همین حالا هم در مسیرهای مشخص برای زمینه تکمیلی، فیلتر مبتنی بر فرستنده اعمال می‌کنند (برای مثال seeding thread در Slack، lookupهای reply/thread در Matrix).
    - کانال‌های دیگر هنوز زمینه quote/reply/forward را همان‌طور که دریافت شده عبور می‌دهند.

  </Accordion>
  <Accordion title="مسیر سخت‌سازی (برنامه‌ریزی‌شده)">
    - `contextVisibility: "all"` (پیش‌فرض) رفتار فعلیِ همان‌طور-دریافت‌شده را نگه می‌دارد.
    - `contextVisibility: "allowlist"` زمینه تکمیلی را به فرستندگان allowlist‌شده فیلتر می‌کند.
    - `contextVisibility: "allowlist_quote"` همان `allowlist` به‌علاوه یک استثنای صریح quote/reply است.

    تا زمانی که این مدل سخت‌سازی به‌صورت یکسان در همه کانال‌ها پیاده‌سازی شود، انتظار تفاوت بین سطح‌ها را داشته باشید.

  </Accordion>
</AccordionGroup>

![جریان پیام گروهی](/images/groups-flow.svg)

اگر می‌خواهید...

| هدف                                         | چه چیزی را تنظیم کنید                                      |
| -------------------------------------------- | ---------------------------------------------------------- |
| اجازه به همه گروه‌ها، اما پاسخ فقط روی @mentionها | `groups: { "*": { requireMention: true } }`                |
| غیرفعال کردن همه پاسخ‌های گروهی                    | `groupPolicy: "disabled"`                                  |
| فقط گروه‌های مشخص                                 | `groups: { "<group-id>": { ... } }` (بدون کلید `"*"` )     |
| فقط شما بتوانید در گروه‌ها فعال‌سازی کنید           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| استفاده دوباره از یک مجموعه فرستنده مورد اعتماد در کانال‌ها | `groupAllowFrom: ["accessGroup:operators"]`                |

برای allowlist‌های قابل استفاده مجدد فرستنده، [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.

## کلیدهای نشست

- نشست‌های گروهی از کلیدهای نشست `agent:<agentId>:<channel>:group:<id>` استفاده می‌کنند (اتاق‌ها/کانال‌ها از `agent:<agentId>:<channel>:channel:<id>` استفاده می‌کنند).
- topicهای انجمن Telegram، `:topic:<threadId>` را به شناسه گروه اضافه می‌کنند تا هر topic نشست خودش را داشته باشد.
- گفت‌وگوهای مستقیم از نشست اصلی استفاده می‌کنند (یا اگر پیکربندی شده باشد، به‌ازای هر فرستنده).
- Heartbeatها برای نشست‌های گروهی رد می‌شوند.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## الگو: DMهای شخصی + گروه‌های عمومی (یک agent)

بله، اگر ترافیک «شخصی» شما **DMها** و ترافیک «عمومی» شما **گروه‌ها** باشد، این به‌خوبی کار می‌کند.

چرا: در حالت تک-agent، DMها معمولا وارد کلید نشست **اصلی** (`agent:main:main`) می‌شوند، در حالی که گروه‌ها همیشه از کلیدهای نشست **غیراصلی** (`agent:main:<channel>:group:<id>`) استفاده می‌کنند. اگر sandboxing را با `mode: "non-main"` فعال کنید، آن نشست‌های گروهی در backend sandbox پیکربندی‌شده اجرا می‌شوند، در حالی که نشست DM اصلی شما روی host باقی می‌ماند. اگر چیزی انتخاب نکنید، Docker backend پیش‌فرض است.

این به شما یک «مغز» agent می‌دهد (workspace + حافظه مشترک)، اما دو وضعیت اجرا:

- **DMها**: ابزارهای کامل (host)
- **گروه‌ها**: sandbox + ابزارهای محدودشده

<Note>
اگر به workspaceها/personaهای واقعا جداگانه نیاز دارید («شخصی» و «عمومی» هرگز نباید مخلوط شوند)، از agent دوم + bindingها استفاده کنید. [مسیردهی چند-Agent](/fa/concepts/multi-agent) را ببینید.
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
  <Tab title="گروه‌ها فقط یک پوشه allowlist‌شده را می‌بینند">
    می‌خواهید به‌جای «بدون دسترسی به host»، «گروه‌ها فقط بتوانند پوشه X را ببینند»؟ `workspaceAccess: "none"` را نگه دارید و فقط مسیرهای allowlist‌شده را در sandbox mount کنید:

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

- برچسب‌های UI در صورت موجود بودن از `displayName` استفاده می‌کنند، با قالب `<channel>:<token>`.
- `#room` برای اتاق‌ها/کانال‌ها رزرو شده است؛ گفت‌وگوهای گروهی از `g-<slug>` استفاده می‌کنند (حروف کوچک، فاصله‌ها -> `-`، حفظ `#@+._-`).

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
| `"open"`      | گروه‌ها از allowlistها عبور می‌کنند؛ دروازه‌گذاری منشن همچنان اعمال می‌شود. |
| `"disabled"`  | همه پیام‌های گروهی را کاملا مسدود می‌کند.                    |
| `"allowlist"` | فقط گروه‌ها/اتاق‌هایی را مجاز می‌کند که با allowlist پیکربندی‌شده مطابقت داشته باشند. |

<AccordionGroup>
  <Accordion title="یادداشت‌های هر کانال">
    - `groupPolicy` از دروازه‌گذاری بر اساس اشاره جداست (که به @mentions نیاز دارد).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: از `groupAllowFrom` استفاده کنید (گزینهٔ پشتیبان: `allowFrom` صریح).
    - Signal: `groupAllowFrom` می‌تواند با شناسهٔ گروه Signal ورودی یا شماره تلفن/UUID فرستنده مطابقت داشته باشد.
    - تأییدهای جفت‌سازی پیام مستقیم (ورودی‌های ذخیرهٔ `*-allowFrom`) فقط برای دسترسی پیام مستقیم اعمال می‌شوند؛ مجوزدهی فرستندهٔ گروه همچنان به‌صورت صریح در فهرست‌های مجاز گروه باقی می‌ماند.
    - Discord: فهرست مجاز از `channels.discord.guilds.<id>.channels` استفاده می‌کند.
    - Slack: فهرست مجاز از `channels.slack.channels` استفاده می‌کند.
    - Matrix: فهرست مجاز از `channels.matrix.groups` استفاده می‌کند. شناسه‌های اتاق یا نام‌های مستعار را ترجیح دهید؛ جست‌وجوی نام اتاق‌های پیوسته‌شده بهترین‌تلاش است و نام‌های حل‌نشده در زمان اجرا نادیده گرفته می‌شوند. برای محدود کردن فرستنده‌ها از `channels.matrix.groupAllowFrom` استفاده کنید؛ فهرست‌های مجاز `users` برای هر اتاق نیز پشتیبانی می‌شوند.
    - پیام‌های مستقیم گروهی جداگانه کنترل می‌شوند (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - فهرست مجاز Telegram می‌تواند با شناسه‌های کاربر (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) یا نام‌های کاربری (`"@alice"` یا `"alice"`) مطابقت داشته باشد؛ پیشوندها به بزرگی و کوچکی حروف حساس نیستند.
    - مقدار پیش‌فرض `groupPolicy: "allowlist"` است؛ اگر فهرست مجاز گروه شما خالی باشد، پیام‌های گروه مسدود می‌شوند.
    - ایمنی زمان اجرا: وقتی یک بلوک ارائه‌دهنده کاملاً وجود ندارد (`channels.<provider>` غایب است)، سیاست گروه به‌جای به ارث بردن `channels.defaults.groupPolicy` به حالت fail-closed برمی‌گردد (معمولاً `allowlist`).

  </Accordion>
</AccordionGroup>

مدل ذهنی سریع (ترتیب ارزیابی برای پیام‌های گروه):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (باز/غیرفعال/فهرست مجاز).
  </Step>
  <Step title="فهرست‌های مجاز گروه">
    فهرست‌های مجاز گروه (`*.groups`، `*.groupAllowFrom`، فهرست مجاز مخصوص کانال).
  </Step>
  <Step title="دروازه‌گذاری بر اساس اشاره">
    دروازه‌گذاری بر اساس اشاره (`requireMention`، `/activation`).
  </Step>
</Steps>

## دروازه‌گذاری بر اساس اشاره (پیش‌فرض)

پیام‌های گروه به اشاره نیاز دارند، مگر اینکه برای هر گروه بازنویسی شده باشد. پیش‌فرض‌ها برای هر زیرسیستم زیر `*.groups."*"` قرار دارند.

پاسخ دادن به پیام ربات، وقتی کانال از فرادادهٔ پاسخ پشتیبانی می‌کند، به‌عنوان اشارهٔ ضمنی محسوب می‌شود. نقل‌قول کردن پیام ربات نیز در کانال‌هایی که فرادادهٔ نقل‌قول را ارائه می‌کنند می‌تواند به‌عنوان اشارهٔ ضمنی محسوب شود. موارد داخلی فعلی شامل Telegram، WhatsApp، Slack، Discord، Microsoft Teams و ZaloUser هستند.

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
  <Accordion title="یادداشت‌های دروازه‌گذاری بر اساس اشاره">
    - `mentionPatterns` الگوهای regex ایمن و غیرحساس به بزرگی و کوچکی حروف هستند؛ الگوهای نامعتبر و فرم‌های ناامن با تکرارهای تودرتو نادیده گرفته می‌شوند.
    - سطح‌هایی که اشاره‌های صریح ارائه می‌کنند همچنان عبور می‌کنند؛ الگوها گزینهٔ پشتیبان هستند.
    - بازنویسی برای هر عامل: `agents.list[].groupChat.mentionPatterns` (وقتی چند عامل یک گروه را به اشتراک می‌گذارند مفید است).
    - دروازه‌گذاری بر اساس اشاره فقط وقتی اعمال می‌شود که تشخیص اشاره ممکن باشد (اشاره‌های بومی یا `mentionPatterns` پیکربندی شده باشند).
    - مجاز کردن یک گروه یا فرستنده، دروازه‌گذاری بر اساس اشاره را غیرفعال نمی‌کند؛ وقتی همهٔ پیام‌ها باید اجرا شوند، `requireMention` آن گروه را روی `false` بگذارید.
    - زمینهٔ اعلان گفت‌وگوی گروهی در هر نوبت دستور پاسخ بی‌صدا حل‌شده را حمل می‌کند؛ فایل‌های workspace نباید سازوکارهای `NO_REPLY` را تکرار کنند.
    - گروه‌هایی که پاسخ‌های بی‌صدا در آن‌ها مجاز است، نوبت‌های مدل کاملاً خالی یا فقط شامل استدلال را بی‌صدا در نظر می‌گیرند، معادل `NO_REPLY`. گفت‌وگوهای مستقیم فقط وقتی همین کار را می‌کنند که پاسخ‌های مستقیم بی‌صدا صریحاً مجاز شده باشند؛ در غیر این صورت پاسخ‌های خالی همچنان نوبت‌های ناموفق عامل باقی می‌مانند.
    - پیش‌فرض‌های Discord در `channels.discord.guilds."*"` قرار دارند (قابل بازنویسی برای هر guild/channel).
    - زمینهٔ تاریخچهٔ گروه به‌صورت یکنواخت در همهٔ کانال‌ها بسته‌بندی می‌شود. گروه‌های دارای دروازه‌گذاری بر اساس اشاره، پیام‌های ردشدهٔ در انتظار را نگه می‌دارند؛ گروه‌های همیشه‌فعال نیز ممکن است وقتی کانال از آن پشتیبانی می‌کند پیام‌های پردازش‌شدهٔ اخیر اتاق را نگه دارند. برای پیش‌فرض سراسری از `messages.groupChat.historyLimit` و برای بازنویسی‌ها از `channels.<channel>.historyLimit` (یا `channels.<channel>.accounts.*.historyLimit`) استفاده کنید. برای غیرفعال کردن، آن را روی `0` بگذارید.

  </Accordion>
</AccordionGroup>

## محدودیت‌های ابزار گروه/کانال (اختیاری)

برخی پیکربندی‌های کانال از محدود کردن ابزارهایی که **داخل یک گروه/اتاق/کانال مشخص** در دسترس هستند پشتیبانی می‌کنند.

- `tools`: مجاز/رد کردن ابزارها برای کل گروه.
- `toolsBySender`: بازنویسی‌های هر فرستنده درون گروه. از پیشوندهای کلید صریح استفاده کنید: `channel:<channelId>:<senderId>`، `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>` و wildcard `"*"`. شناسه‌های کانال از شناسه‌های کانال متعارف OpenClaw استفاده می‌کنند؛ نام‌های مستعاری مانند `teams` به `msteams` نرمال می‌شوند. کلیدهای قدیمی بدون پیشوند همچنان پذیرفته می‌شوند و فقط به‌عنوان `id:` تطبیق داده می‌شوند.

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
محدودیت‌های ابزار گروه/کانال علاوه بر سیاست ابزار سراسری/عامل اعمال می‌شوند (رد کردن همچنان برنده است). برخی کانال‌ها از تودرتویی متفاوتی برای اتاق‌ها/کانال‌ها استفاده می‌کنند (برای مثال، Discord `guilds.*.channels.*`، Slack `channels.*`، Microsoft Teams `teams.*.channels.*`).
</Note>

## فهرست‌های مجاز گروه

وقتی `channels.whatsapp.groups`، `channels.telegram.groups` یا `channels.imessage.groups` پیکربندی شده باشد، کلیدها به‌عنوان فهرست مجاز گروه عمل می‌کنند. از `"*"` برای مجاز کردن همهٔ گروه‌ها استفاده کنید، در حالی که همچنان رفتار پیش‌فرض اشاره را تنظیم می‌کنید.

<Warning>
ابهام رایج: تأیید جفت‌سازی پیام مستقیم با مجوزدهی گروه یکسان نیست. برای کانال‌هایی که از جفت‌سازی پیام مستقیم پشتیبانی می‌کنند، ذخیرهٔ جفت‌سازی فقط پیام‌های مستقیم را باز می‌کند. دستورهای گروه همچنان به مجوزدهی صریح فرستندهٔ گروه از فهرست‌های مجاز پیکربندی مانند `groupAllowFrom` یا گزینهٔ پشتیبان پیکربندی مستندشده برای آن کانال نیاز دارند.
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
  <Tab title="فقط مجاز کردن گروه‌های مشخص (WhatsApp)">
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
  <Tab title="مجاز کردن همهٔ گروه‌ها ولی نیازمند اشاره">
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
  <Tab title="اجراهای فقط مالک (WhatsApp)">
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

مالک با `channels.whatsapp.allowFrom` تعیین می‌شود (یا وقتی تنظیم نشده باشد، E.164 خود ربات). دستور را به‌عنوان یک پیام مستقل بفرستید. سطح‌های دیگر در حال حاضر `/activation` را نادیده می‌گیرند.

## فیلدهای زمینه

payloadهای ورودی گروه تنظیم می‌کنند:

- `ChatType=group`
- `GroupSubject` (اگر شناخته شده باشد)
- `GroupMembers` (اگر شناخته شده باشد)
- `WasMentioned` (نتیجهٔ دروازه‌گذاری بر اساس اشاره)
- موضوعات تالار Telegram همچنین شامل `MessageThreadId` و `IsForum` هستند.

اعلان سیستم عامل در اولین نوبت یک نشست گروهی جدید، یک معرفی گروه را شامل می‌شود. این اعلان به مدل یادآوری می‌کند که مانند یک انسان پاسخ دهد، از جدول‌های Markdown پرهیز کند، خطوط خالی را به حداقل برساند و فاصله‌گذاری معمول گفت‌وگو را رعایت کند، و از تایپ دنباله‌های لفظی `\n` پرهیز کند. نام‌های گروه و برچسب‌های مشارکت‌کننده که از کانال آمده‌اند به‌صورت فرادادهٔ نامطمئن حصارکشی‌شده نمایش داده می‌شوند، نه به‌عنوان دستورهای سیستمی درون‌خطی.

## جزئیات iMessage

- هنگام مسیریابی یا مجازسازی، `chat_id:<id>` را ترجیح دهید.
- فهرست کردن گفت‌وگوها: `imsg chats --limit 20`.
- پاسخ‌های گروه همیشه به همان `chat_id` برمی‌گردند.

## اعلان‌های سیستم WhatsApp

برای قواعد متعارف اعلان سیستم WhatsApp، از جمله حل اعلان گروه و مستقیم، رفتار wildcard و معناشناسی بازنویسی حساب، [WhatsApp](/fa/channels/whatsapp#system-prompts) را ببینید.

## جزئیات WhatsApp

برای رفتار فقط مربوط به WhatsApp (تزریق تاریخچه، جزئیات مدیریت اشاره)، [پیام‌های گروه](/fa/channels/group-messages) را ببینید.

## مرتبط

- [گروه‌های پخش](/fa/channels/broadcast-groups)
- [مسیریابی کانال](/fa/channels/channel-routing)
- [پیام‌های گروه](/fa/channels/group-messages)
- [جفت‌سازی](/fa/channels/pairing)
