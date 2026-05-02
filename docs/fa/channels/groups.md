---
read_when:
    - تغییر رفتار گفت‌وگوی گروهی یا محدودسازی بر اساس منشن
sidebarTitle: Groups
summary: رفتار گفت‌وگوی گروهی در سطوح مختلف (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: گروه‌ها
x-i18n:
    generated_at: "2026-05-02T11:34:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cc33dbbcf5504cae5caa003b7427d99f5c1a2d7c850dedd5d1f58a2fe44fa04
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw گفت‌وگوهای گروهی را در همهٔ سطح‌ها به‌صورت یکسان مدیریت می‌کند: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## معرفی مقدماتی (۲ دقیقه)

OpenClaw روی حساب‌های پیام‌رسانی خودتان «زندگی می‌کند». کاربر ربات جداگانه‌ای در WhatsApp وجود ندارد. اگر **شما** در یک گروه باشید، OpenClaw می‌تواند آن گروه را ببیند و آنجا پاسخ بدهد.

رفتار پیش‌فرض:

- گروه‌ها محدود هستند (`groupPolicy: "allowlist"`).
- پاسخ‌ها به منشن نیاز دارند، مگر اینکه کنترل منشن را صراحتاً غیرفعال کنید.
- پاسخ‌های نهایی معمولی در گروه‌ها/کانال‌ها به‌صورت پیش‌فرض خصوصی هستند. خروجی قابل‌مشاهده در اتاق از ابزار `message` استفاده می‌کند.

ترجمهٔ عملی: فرستنده‌های مجازشده می‌توانند با منشن کردن OpenClaw آن را فعال کنند.

<Note>
**خلاصه**

- **دسترسی DM** با `*.allowFrom` کنترل می‌شود.
- **دسترسی گروه** با `*.groupPolicy` + فهرست‌های مجاز (`*.groups`، `*.groupAllowFrom`) کنترل می‌شود.
- **راه‌اندازی پاسخ** با کنترل منشن (`requireMention`، `/activation`) کنترل می‌شود.

</Note>

جریان سریع (برای یک پیام گروهی چه اتفاقی می‌افتد):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## پاسخ‌های قابل‌مشاهده

برای اتاق‌های گروهی/کانالی، پیش‌فرض OpenClaw مقدار `messages.groupChat.visibleReplies: "message_tool"` است.
یعنی عامل همچنان نوبت را پردازش می‌کند و می‌تواند وضعیت حافظه/نشست را به‌روزرسانی کند، اما پاسخ نهایی معمولی آن به‌طور خودکار دوباره در اتاق منتشر نمی‌شود. برای صحبت‌کردن به‌صورت قابل‌مشاهده، عامل از `message(action=send)` استفاده می‌کند.

اگر ابزار پیام تحت سیاست ابزار فعال در دسترس نباشد، OpenClaw به‌جای سرکوب بی‌صدای پاسخ، به پاسخ‌های قابل‌مشاهدهٔ خودکار برمی‌گردد.
`openclaw doctor` دربارهٔ این ناهماهنگی هشدار می‌دهد.

برای گفت‌وگوهای مستقیم و هر نوبت منبع دیگر، از `messages.visibleReplies: "message_tool"` استفاده کنید تا همان رفتار پاسخ قابل‌مشاهدهٔ فقط از طریق ابزار را به‌صورت سراسری اعمال کنید. مهارکننده‌ها نیز می‌توانند این را به‌عنوان پیش‌فرض تنظیم‌نشدهٔ خود انتخاب کنند؛ مهارکنندهٔ Codex این کار را برای گفت‌وگوهای مستقیم در حالت Codex انجام می‌دهد. `messages.groupChat.visibleReplies` همچنان بازنویسی مشخص‌تر برای اتاق‌های گروهی/کانالی باقی می‌ماند.

این جایگزین الگوی قدیمیِ وادار کردن مدل به پاسخ `NO_REPLY` برای بیشتر نوبت‌های حالت کمین می‌شود. در حالت فقط ابزار، انجام ندادن هیچ کار قابل‌مشاهده‌ای صرفاً یعنی فراخوانی نکردن ابزار پیام.

نشانگرهای تایپ همچنان هنگام کار عامل در حالت فقط ابزار ارسال می‌شوند. حالت پیش‌فرض تایپ گروه برای این نوبت‌ها از "message" به "instant" ارتقا داده می‌شود، چون ممکن است پیش از آنکه عامل تصمیم بگیرد ابزار پیام را فراخوانی کند یا نه، هیچ متن پیام دستیار معمولی وجود نداشته باشد. پیکربندی صریح حالت تایپ همچنان اولویت دارد.

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

Gateway پس از ذخیره‌شدن فایل، پیکربندی `messages` را به‌صورت hot-reload بارگذاری می‌کند. فقط زمانی راه‌اندازی مجدد کنید که پایش فایل یا بارگذاری مجدد پیکربندی در استقرار غیرفعال باشد.

برای الزام اینکه خروجی قابل‌مشاهده برای هر گفت‌وگوی منبع از ابزار پیام عبور کند:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

فرمان‌های اسلش بومی (Discord، Telegram و سطح‌های دیگری که از فرمان بومی پشتیبانی می‌کنند) `visibleReplies: "message_tool"` را دور می‌زنند و همیشه به‌صورت قابل‌مشاهده پاسخ می‌دهند تا UI فرمان بومی کانال پاسخی را که انتظار دارد دریافت کند. این فقط برای نوبت‌های فرمان بومی اعتبارسنجی‌شده اعمال می‌شود؛ فرمان‌های `/...` که به‌صورت متن تایپ شده‌اند و نوبت‌های گفت‌وگوی معمولی همچنان از پیش‌فرض گروه پیکربندی‌شده پیروی می‌کنند.

## دیدپذیری زمینه و فهرست‌های مجاز

دو کنترل متفاوت در ایمنی گروه دخیل هستند:

- **مجوز راه‌اندازی**: چه کسی می‌تواند عامل را راه‌اندازی کند (`groupPolicy`، `groups`، `groupAllowFrom`، فهرست‌های مجاز مخصوص کانال).
- **دیدپذیری زمینه**: چه زمینهٔ تکمیلی به مدل تزریق می‌شود (متن پاسخ، نقل‌قول‌ها، تاریخچهٔ رشته، فرادادهٔ فورواردشده).

به‌صورت پیش‌فرض، OpenClaw رفتار معمول گفت‌وگو را در اولویت قرار می‌دهد و زمینه را عمدتاً همان‌طور که دریافت شده نگه می‌دارد. یعنی فهرست‌های مجاز در درجهٔ اول تعیین می‌کنند چه کسی می‌تواند کنش‌ها را راه‌اندازی کند، نه اینکه مرز ویرایش همگانی برای هر قطعهٔ نقل‌شده یا تاریخی باشند.

<AccordionGroup>
  <Accordion title="رفتار فعلی مخصوص هر کانال است">
    - برخی کانال‌ها از قبل در مسیرهای مشخص برای زمینهٔ تکمیلی فیلترسازی مبتنی بر فرستنده اعمال می‌کنند (برای مثال بذرگذاری رشتهٔ Slack، جست‌وجوی پاسخ/رشتهٔ Matrix).
    - کانال‌های دیگر همچنان زمینهٔ نقل‌قول/پاسخ/فوروارد را همان‌طور که دریافت شده عبور می‌دهند.

  </Accordion>
  <Accordion title="مسیر مقاوم‌سازی (برنامه‌ریزی‌شده)">
    - `contextVisibility: "all"` (پیش‌فرض) رفتار فعلیِ همان‌طور-دریافت‌شده را نگه می‌دارد.
    - `contextVisibility: "allowlist"` زمینهٔ تکمیلی را به فرستنده‌های مجازشده فیلتر می‌کند.
    - `contextVisibility: "allowlist_quote"` همان `allowlist` به‌علاوهٔ یک استثنای صریح نقل‌قول/پاسخ است.

    تا زمانی که این مدل مقاوم‌سازی به‌صورت یکسان در همهٔ کانال‌ها پیاده‌سازی شود، انتظار تفاوت میان سطح‌ها را داشته باشید.

  </Accordion>
</AccordionGroup>

![جریان پیام گروهی](/images/groups-flow.svg)

اگر می‌خواهید...

| هدف                                         | چه چیزی را تنظیم کنید                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| همهٔ گروه‌ها را مجاز کنید اما فقط روی @mentions پاسخ دهید | `groups: { "*": { requireMention: true } }`                |
| همهٔ پاسخ‌های گروهی را غیرفعال کنید                    | `groupPolicy: "disabled"`                                  |
| فقط گروه‌های مشخص                         | `groups: { "<group-id>": { ... } }` (بدون کلید `"*"` )         |
| فقط شما بتوانید در گروه‌ها راه‌اندازی کنید               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| یک مجموعهٔ فرستندهٔ مورداعتماد را بین کانال‌ها بازاستفاده کنید | `groupAllowFrom: ["accessGroup:operators"]`                |

برای فهرست‌های مجاز فرستندهٔ قابل‌بازاستفاده، [گروه‌های دسترسی](/fa/channels/access-groups) را ببینید.

## کلیدهای نشست

- نشست‌های گروهی از کلیدهای نشست `agent:<agentId>:<channel>:group:<id>` استفاده می‌کنند (اتاق‌ها/کانال‌ها از `agent:<agentId>:<channel>:channel:<id>` استفاده می‌کنند).
- موضوع‌های انجمن Telegram، `:topic:<threadId>` را به شناسهٔ گروه اضافه می‌کنند تا هر موضوع نشست خودش را داشته باشد.
- گفت‌وگوهای مستقیم از نشست اصلی استفاده می‌کنند (یا اگر پیکربندی شده باشد، به‌ازای هر فرستنده).
- Heartbeatها برای نشست‌های گروهی رد می‌شوند.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## الگو: DMهای شخصی + گروه‌های عمومی (عامل واحد)

بله، اگر ترافیک «شخصی» شما **DMها** و ترافیک «عمومی» شما **گروه‌ها** باشد، این به‌خوبی کار می‌کند.

دلیل: در حالت تک‌عاملی، DMها معمولاً در کلید نشست **اصلی** (`agent:main:main`) قرار می‌گیرند، در حالی که گروه‌ها همیشه از کلیدهای نشست **غیراصلی** (`agent:main:<channel>:group:<id>`) استفاده می‌کنند. اگر sandboxing را با `mode: "non-main"` فعال کنید، آن نشست‌های گروهی در پشتیبان sandbox پیکربندی‌شده اجرا می‌شوند، در حالی که نشست اصلی DM شما روی میزبان باقی می‌ماند. اگر چیزی انتخاب نکنید، Docker پشتیبان پیش‌فرض است.

این به شما یک «مغز» عامل می‌دهد (فضای کاری + حافظهٔ مشترک)، اما دو وضعیت اجرا:

- **DMها**: ابزارهای کامل (میزبان)
- **گروه‌ها**: sandbox + ابزارهای محدودشده

<Note>
اگر به فضاهای کاری/شخصیت‌های واقعاً جداگانه نیاز دارید («شخصی» و «عمومی» هرگز نباید با هم آمیخته شوند)، از عامل دوم + اتصال‌ها استفاده کنید. [مسیریابی چندعاملی](/fa/concepts/multi-agent) را ببینید.
</Note>

<Tabs>
  <Tab title="DMها روی میزبان، گروه‌ها در sandbox">
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
  <Tab title="گروه‌ها فقط یک پوشهٔ مجازشده را می‌بینند">
    به‌جای «بدون دسترسی میزبان»، می‌خواهید «گروه‌ها فقط پوشهٔ X را ببینند»؟ `workspaceAccess: "none"` را نگه دارید و فقط مسیرهای مجازشده را در sandbox سوار کنید:

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

- برچسب‌های UI در صورت در دسترس بودن از `displayName` استفاده می‌کنند، با قالب `<channel>:<token>`.
- `#room` برای اتاق‌ها/کانال‌ها رزرو شده است؛ گفت‌وگوهای گروهی از `g-<slug>` استفاده می‌کنند (حروف کوچک، فاصله‌ها -> `-`، `#@+._-` را نگه دارید).

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
| `"open"`      | گروه‌ها فهرست‌های مجاز را دور می‌زنند؛ کنترل منشن همچنان اعمال می‌شود.      |
| `"disabled"`  | همهٔ پیام‌های گروهی را کاملاً مسدود می‌کند.                           |
| `"allowlist"` | فقط گروه‌ها/اتاق‌هایی را مجاز می‌کند که با فهرست مجاز پیکربندی‌شده مطابق باشند. |

<AccordionGroup>
  <Accordion title="نکات مخصوص هر کانال">
    - `groupPolicy` از کنترل منشن جدا است (که به @mentions نیاز دارد).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: از `groupAllowFrom` استفاده کنید (جایگزین: `allowFrom` صریح).
    - Signal: `groupAllowFrom` می‌تواند یا شناسهٔ گروه Signal ورودی یا تلفن/UUID فرستنده را مطابق کند.
    - تأییدهای جفت‌سازی DM (ورودی‌های ذخیرهٔ `*-allowFrom`) فقط برای دسترسی DM اعمال می‌شوند؛ مجوز فرستندهٔ گروه برای فهرست‌های مجاز گروه صریح باقی می‌ماند.
    - Discord: فهرست مجاز از `channels.discord.guilds.<id>.channels` استفاده می‌کند.
    - Slack: فهرست مجاز از `channels.slack.channels` استفاده می‌کند.
    - Matrix: فهرست مجاز از `channels.matrix.groups` استفاده می‌کند. شناسه‌ها یا نام‌های مستعار اتاق را ترجیح دهید؛ جست‌وجوی نام اتاق‌های پیوسته‌شده best-effort است و نام‌های حل‌نشده در زمان اجرا نادیده گرفته می‌شوند. برای محدود کردن فرستنده‌ها از `channels.matrix.groupAllowFrom` استفاده کنید؛ فهرست‌های مجاز `users` به‌ازای هر اتاق نیز پشتیبانی می‌شوند.
    - DMهای گروهی جداگانه کنترل می‌شوند (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - فهرست مجاز Telegram می‌تواند با شناسه‌های کاربر (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) یا نام‌های کاربری (`"@alice"` یا `"alice"`) مطابق شود؛ پیشوندها به بزرگی/کوچکی حروف حساس نیستند.
    - پیش‌فرض `groupPolicy: "allowlist"` است؛ اگر فهرست مجاز گروه شما خالی باشد، پیام‌های گروهی مسدود می‌شوند.
    - ایمنی زمان اجرا: وقتی یک بلوک ارائه‌دهنده کاملاً وجود ندارد (`channels.<provider>` غایب است)، سیاست گروه به‌جای ارث‌بری از `channels.defaults.groupPolicy` به حالت fail-closed برمی‌گردد (معمولاً `allowlist`).

  </Accordion>
</AccordionGroup>

مدل ذهنی سریع (ترتیب ارزیابی برای پیام‌های گروهی):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="فهرست‌های مجاز گروه">
    فهرست‌های مجاز گروه (`*.groups`، `*.groupAllowFrom`، فهرست مجاز اختصاصی کانال).
  </Step>
  <Step title="گیت‌گذاری منشن">
    گیت‌گذاری منشن (`requireMention`، `/activation`).
  </Step>
</Steps>

## گیت‌گذاری منشن (پیش‌فرض)

پیام‌های گروهی به منشن نیاز دارند، مگر اینکه برای هر گروه بازنویسی شده باشد. پیش‌فرض‌ها برای هر زیرسامانه در `*.groups."*"` قرار دارند.

پاسخ دادن به پیام بات، وقتی کانال از فراداده پاسخ پشتیبانی می‌کند، به‌عنوان منشن ضمنی حساب می‌شود. نقل‌قول کردن پیام بات نیز در کانال‌هایی که فراداده نقل‌قول را ارائه می‌کنند می‌تواند به‌عنوان منشن ضمنی حساب شود. موارد داخلی فعلی شامل Telegram، WhatsApp، Slack، Discord، Microsoft Teams و ZaloUser هستند.

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
  <Accordion title="نکات گیت‌گذاری منشن">
    - `mentionPatterns` الگوهای regex امن و غیرحساس به بزرگی و کوچکی حروف هستند؛ الگوهای نامعتبر و شکل‌های ناامنِ تکرار تودرتو نادیده گرفته می‌شوند.
    - سطح‌هایی که منشن‌های صریح ارائه می‌کنند همچنان عبور می‌کنند؛ الگوها fallback هستند.
    - بازنویسی برای هر agent: `agents.list[].groupChat.mentionPatterns` (وقتی چند agent یک گروه را مشترک استفاده می‌کنند مفید است).
    - گیت‌گذاری منشن فقط زمانی اعمال می‌شود که تشخیص منشن ممکن باشد (منشن‌های بومی یا `mentionPatterns` پیکربندی شده باشند).
    - قرار دادن یک گروه یا فرستنده در فهرست مجاز، گیت‌گذاری منشن را غیرفعال نمی‌کند؛ وقتی همه پیام‌ها باید trigger شوند، `requireMention` آن گروه را روی `false` تنظیم کنید.
    - زمینه prompt چت گروهی در هر نوبت دستور پاسخ بی‌صدای حل‌شده را حمل می‌کند؛ فایل‌های workspace نباید سازوکارهای `NO_REPLY` را تکرار کنند.
    - گروه‌هایی که پاسخ‌های بی‌صدا در آن‌ها مجاز است، نوبت‌های مدلِ کاملا خالی یا فقط استدلالی را بی‌صدا تلقی می‌کنند، معادل `NO_REPLY`. چت‌های مستقیم فقط وقتی پاسخ‌های مستقیم بی‌صدا به‌صراحت مجاز شده باشند همین کار را می‌کنند؛ در غیر این صورت پاسخ‌های خالی همچنان نوبت‌های ناموفق agent باقی می‌مانند.
    - پیش‌فرض‌های Discord در `channels.discord.guilds."*"` قرار دارند (برای هر guild/channel قابل بازنویسی هستند).
    - زمینه تاریخچه گروه در همه کانال‌ها به‌صورت یکنواخت پیچیده می‌شود و **فقط pending** است (پیام‌هایی که به‌دلیل گیت‌گذاری منشن رد شده‌اند)؛ برای پیش‌فرض سراسری از `messages.groupChat.historyLimit` و برای بازنویسی‌ها از `channels.<channel>.historyLimit` (یا `channels.<channel>.accounts.*.historyLimit`) استفاده کنید. برای غیرفعال کردن، `0` تنظیم کنید.

  </Accordion>
</AccordionGroup>

## محدودیت‌های ابزار گروه/کانال (اختیاری)

برخی پیکربندی‌های کانال از محدود کردن ابزارهای در دسترس **داخل یک گروه/اتاق/کانال مشخص** پشتیبانی می‌کنند.

- `tools`: اجازه/رد ابزارها برای کل گروه.
- `toolsBySender`: بازنویسی‌های مخصوص هر فرستنده داخل گروه. از پیشوندهای کلید صریح استفاده کنید: `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>`، و wildcard `"*"`. کلیدهای قدیمی بدون پیشوند همچنان پذیرفته می‌شوند و فقط به‌صورت `id:` match می‌شوند.

ترتیب resolution (اختصاصی‌ترین مورد برنده است):

<Steps>
  <Step title="toolsBySender گروه">
    match برای `toolsBySender` گروه/کانال.
  </Step>
  <Step title="tools گروه">
    `tools` گروه/کانال.
  </Step>
  <Step title="toolsBySender پیش‌فرض">
    match پیش‌فرض (`"*"`) برای `toolsBySender`.
  </Step>
  <Step title="tools پیش‌فرض">
    `tools` پیش‌فرض (`"*"`)
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
محدودیت‌های ابزار گروه/کانال علاوه بر خط‌مشی ابزار سراسری/agent اعمال می‌شوند (deny همچنان برنده است). برخی کانال‌ها برای اتاق‌ها/کانال‌ها از nesting متفاوتی استفاده می‌کنند (مثلا Discord `guilds.*.channels.*`، Slack `channels.*`، Microsoft Teams `teams.*.channels.*`).
</Note>

## فهرست‌های مجاز گروه

وقتی `channels.whatsapp.groups`، `channels.telegram.groups` یا `channels.imessage.groups` پیکربندی شده باشد، کلیدها به‌عنوان فهرست مجاز گروه عمل می‌کنند. از `"*"` استفاده کنید تا همه گروه‌ها مجاز باشند و همزمان رفتار پیش‌فرض منشن همچنان تنظیم شود.

<Warning>
ابهام رایج: تایید pair شدن DM با مجوز گروه یکسان نیست. برای کانال‌هایی که از pair شدن DM پشتیبانی می‌کنند، store مربوط به pairing فقط DMها را باز می‌کند. فرمان‌های گروهی همچنان به مجوز صریح فرستنده گروه از فهرست‌های مجاز پیکربندی مانند `groupAllowFrom` یا fallback مستندشده پیکربندی برای آن کانال نیاز دارند.
</Warning>

نیت‌های رایج (copy/paste):

<Tabs>
  <Tab title="غیرفعال کردن همه پاسخ‌های گروهی">
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
  <Tab title="اجازه به همه گروه‌ها، اما با الزام منشن">
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
  <Tab title="triggerهای فقط مالک (WhatsApp)">
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

مالکان گروه می‌توانند فعال‌سازی هر گروه را toggle کنند:

- `/activation mention`
- `/activation always`

مالک با `channels.whatsapp.allowFrom` تعیین می‌شود (یا E.164 خود بات وقتی تنظیم نشده باشد). فرمان را به‌صورت یک پیام مستقل ارسال کنید. سطح‌های دیگر فعلا `/activation` را نادیده می‌گیرند.

## فیلدهای زمینه

payloadهای ورودی گروه تنظیم می‌کنند:

- `ChatType=group`
- `GroupSubject` (اگر شناخته شده باشد)
- `GroupMembers` (اگر شناخته شده باشد)
- `WasMentioned` (نتیجه گیت‌گذاری منشن)
- موضوعات forum در Telegram همچنین شامل `MessageThreadId` و `IsForum` هستند.

نکات اختصاصی کانال:

- BlueBubbles می‌تواند به‌صورت اختیاری شرکت‌کنندگان بی‌نام گروه macOS را از پایگاه داده Contacts محلی غنی‌سازی کند، پیش از آنکه `GroupMembers` را پر کند. این به‌صورت پیش‌فرض خاموش است و فقط پس از عبور گیت‌گذاری عادی گروه اجرا می‌شود.

system prompt مربوط به agent در اولین نوبت یک جلسه گروهی جدید، یک معرفی گروه را شامل می‌شود. این به مدل یادآوری می‌کند که مانند انسان پاسخ دهد، از جدول‌های Markdown پرهیز کند، خط‌های خالی را به حداقل برساند و فاصله‌گذاری عادی چت را دنبال کند، و از تایپ دنباله‌های لفظی `\n` خودداری کند. نام‌های گروه و برچسب‌های شرکت‌کنندگان که از کانال آمده‌اند به‌صورت فراداده نامطمئن fenced رندر می‌شوند، نه دستورهای سیستمی inline.

## جزئیات iMessage

- هنگام routing یا allowlisting، `chat_id:<id>` را ترجیح دهید.
- فهرست کردن چت‌ها: `imsg chats --limit 20`.
- پاسخ‌های گروهی همیشه به همان `chat_id` برمی‌گردند.

## system promptهای WhatsApp

برای قواعد canonical system prompt مربوط به WhatsApp، از جمله resolution مربوط به prompt گروه و مستقیم، رفتار wildcard و معنای بازنویسی account، [WhatsApp](/fa/channels/whatsapp#system-prompts) را ببینید.

## جزئیات WhatsApp

برای رفتار مخصوص WhatsApp (تزریق تاریخچه، جزئیات مدیریت منشن)، [پیام‌های گروهی](/fa/channels/group-messages) را ببینید.

## مرتبط

- [گروه‌های پخش](/fa/channels/broadcast-groups)
- [routing کانال](/fa/channels/channel-routing)
- [پیام‌های گروهی](/fa/channels/group-messages)
- [Pairing](/fa/channels/pairing)
