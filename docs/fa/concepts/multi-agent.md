---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'مسیریابی چندعاملی: عامل‌های ایزوله، حساب‌های کانال، و پیوندها'
title: مسیریابی چندعاملی
x-i18n:
    generated_at: "2026-06-27T17:35:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

چند عامل _ایزوله_ را اجرا کنید — هرکدام با فضای کاری، دایرکتوری وضعیت (`agentDir`) و تاریخچه نشست خودش — به‌همراه چند حساب کانال (مثلاً دو WhatsApp) در یک Gateway در حال اجرا. پیام‌های ورودی از طریق اتصال‌ها به عامل درست مسیریابی می‌شوند.

در اینجا **عامل** دامنه کامل هر پرسونا است: فایل‌های فضای کاری، پروفایل‌های احراز هویت، رجیستری مدل و ذخیره‌گاه نشست. `agentDir` دایرکتوری وضعیت روی دیسک است که این پیکربندی مخصوص هر عامل را در `~/.openclaw/agents/<agentId>/` نگه می‌دارد. یک **اتصال** یک حساب کانال (مثلاً یک فضای کاری Slack یا یک شماره WhatsApp) را به یکی از آن عامل‌ها نگاشت می‌کند.

## «یک عامل» چیست؟

یک **عامل** مغزی کاملاً دامنه‌بندی‌شده است با موارد اختصاصی خودش:

- **فضای کاری** (فایل‌ها، AGENTS.md/SOUL.md/USER.md، یادداشت‌های محلی، قوانین پرسونا).
- **دایرکتوری وضعیت** (`agentDir`) برای پروفایل‌های احراز هویت، رجیستری مدل و پیکربندی مخصوص عامل.
- **ذخیره‌گاه نشست** (تاریخچه گفت‌وگو + وضعیت مسیریابی) زیر `~/.openclaw/agents/<agentId>/sessions`.

پروفایل‌های احراز هویت **مخصوص هر عامل** هستند. هر عامل از مسیر اختصاصی خودش می‌خواند:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` اینجا هم مسیر امن‌تر برای یادآوری بین‌نشستی است: یک نمای محدود و پاک‌سازی‌شده برمی‌گرداند، نه تخلیه خام متن نشست. یادآوری دستیار برچسب‌های تفکر، قالب‌بندی `<relevant-memories>`، payloadهای XML فراخوانی ابزار به‌صورت متن ساده (شامل `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>` و بلوک‌های کوتاه‌شده فراخوانی ابزار)، قالب‌بندی تنزل‌یافته فراخوانی ابزار، توکن‌های کنترلی مدل نشت‌کرده ASCII/تمام‌عرض، و XML فراخوانی ابزار MiniMax نامعتبر را پیش از ویرایش/کوتاه‌سازی حذف می‌کند.
</Note>

<Warning>
هرگز `agentDir` را بین عامل‌ها دوباره استفاده نکنید (باعث تداخل احراز هویت/نشست می‌شود). عامل‌ها
وقتی پروفایل محلی ندارند، می‌توانند به پروفایل‌های احراز هویت عامل پیش‌فرض/اصلی رجوع کنند،
اما OpenClaw توکن‌های بازآوری OAuth را در ذخیره‌گاه عامل
ثانویه کپی نمی‌کند. اگر یک حساب OAuth مستقل می‌خواهید، از
همان عامل وارد شوید؛ اگر اعتبارنامه‌ها را دستی کپی می‌کنید، فقط پروفایل‌های ایستای قابل‌حمل
`api_key` یا `token` را کپی کنید.
</Warning>

Skills از فضای کاری هر عامل به‌علاوه ریشه‌های مشترکی مانند `~/.openclaw/skills` بارگذاری می‌شوند، سپس در صورت پیکربندی، با فهرست مجاز مؤثر Skills عامل فیلتر می‌شوند. برای خط پایه مشترک از `agents.defaults.skills` و برای جایگزینی مخصوص هر عامل از `agents.list[].skills` استفاده کنید. [Skills: مخصوص عامل در برابر مشترک](/fa/tools/skills#per-agent-vs-shared-skills) و [Skills: فهرست‌های مجاز Skills عامل](/fa/tools/skills#agent-allowlists) را ببینید.

Gateway می‌تواند **یک عامل** (پیش‌فرض) یا **عامل‌های متعدد** را کنار هم میزبانی کند.

<Note>
**نکته فضای کاری:** فضای کاری هر عامل **cwd پیش‌فرض** است، نه یک سندباکس سخت. مسیرهای نسبی داخل فضای کاری resolve می‌شوند، اما مسیرهای مطلق می‌توانند به مکان‌های دیگر میزبان دسترسی پیدا کنند مگر اینکه سندباکس فعال باشد. [سندباکس کردن](/fa/gateway/sandboxing) را ببینید.
</Note>

## مسیرها (نقشه سریع)

- پیکربندی: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- دایرکتوری وضعیت: `~/.openclaw` (یا `OPENCLAW_STATE_DIR`)
- فضای کاری: `~/.openclaw/workspace` (یا `~/.openclaw/workspace-<agentId>`)
- دایرکتوری عامل: `~/.openclaw/agents/<agentId>/agent` (یا `agents.list[].agentDir`)
- نشست‌ها: `~/.openclaw/agents/<agentId>/sessions`

### حالت تک‌عاملی (پیش‌فرض)

اگر کاری نکنید، OpenClaw یک عامل واحد اجرا می‌کند:

- مقدار پیش‌فرض `agentId` برابر **`main`** است.
- نشست‌ها با `agent:main:<mainKey>` کلیدگذاری می‌شوند.
- مقدار پیش‌فرض فضای کاری `~/.openclaw/workspace` است (یا وقتی `OPENCLAW_PROFILE` تنظیم شده باشد، `~/.openclaw/workspace-<profile>`).
- مقدار پیش‌فرض وضعیت `~/.openclaw/agents/main/agent` است.

## راهنمای عامل

برای افزودن یک عامل ایزوله جدید از ویزارد عامل استفاده کنید:

```bash
openclaw agents add work
```

سپس برای مسیریابی پیام‌های ورودی، `bindings` اضافه کنید (یا اجازه دهید ویزارد این کار را انجام دهد).

با این دستور بررسی کنید:

```bash
openclaw agents list --bindings
```

## شروع سریع

<Steps>
  <Step title="فضای کاری هر عامل را ایجاد کنید">
    از ویزارد استفاده کنید یا فضاهای کاری را دستی بسازید:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    هر عامل فضای کاری خودش را با `SOUL.md`، `AGENTS.md` و `USER.md` اختیاری دریافت می‌کند، به‌همراه یک `agentDir` اختصاصی و ذخیره‌گاه نشست زیر `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="حساب‌های کانال را ایجاد کنید">
    برای هر عامل، روی کانال‌های ترجیحی خود یک حساب بسازید:

    - Discord: برای هر عامل یک ربات، Message Content Intent را فعال کنید، هر توکن را کپی کنید.
    - Telegram: برای هر عامل یک ربات از طریق BotFather، هر توکن را کپی کنید.
    - WhatsApp: هر شماره تلفن را برای هر حساب لینک کنید.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    راهنماهای کانال را ببینید: [Discord](/fa/channels/discord)، [Telegram](/fa/channels/telegram)، [WhatsApp](/fa/channels/whatsapp).

  </Step>
  <Step title="عامل‌ها، حساب‌ها و اتصال‌ها را اضافه کنید">
    عامل‌ها را زیر `agents.list`، حساب‌های کانال را زیر `channels.<channel>.accounts` اضافه کنید و آن‌ها را با `bindings` وصل کنید (نمونه‌ها در ادامه آمده‌اند).
  </Step>
  <Step title="راه‌اندازی مجدد و بررسی">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## عامل‌های متعدد = افراد متعدد، شخصیت‌های متعدد

با **عامل‌های متعدد**، هر `agentId` به یک **پرسونای کاملاً ایزوله** تبدیل می‌شود:

- **شماره‌های تلفن/حساب‌های متفاوت** (برای هر کانال `accountId`).
- **شخصیت‌های متفاوت** (فایل‌های فضای کاری مخصوص عامل مانند `AGENTS.md` و `SOUL.md`).
- **احراز هویت + نشست‌های جداگانه** (بدون تداخل، مگر اینکه صراحتاً فعال شده باشد).

این امکان می‌دهد **افراد متعدد** یک سرور Gateway را به‌اشتراک بگذارند، در حالی که «مغزها» و داده‌های هوش مصنوعی آن‌ها ایزوله می‌ماند.

## جست‌وجوی حافظه QMD بین عامل‌ها

اگر یک عامل باید رونوشت‌های نشست QMD عامل دیگری را جست‌وجو کند، مجموعه‌های اضافی را زیر `agents.list[].memorySearch.qmd.extraCollections` اضافه کنید. فقط زمانی از `agents.defaults.memorySearch.qmd.extraCollections` استفاده کنید که همه عامل‌ها باید همان مجموعه‌های رونوشت مشترک را به ارث ببرند.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

مسیر مجموعه اضافی می‌تواند بین عامل‌ها مشترک باشد، اما وقتی مسیر بیرون از فضای کاری عامل است، نام مجموعه صریح باقی می‌ماند. مسیرهای داخل فضای کاری همچنان دامنه‌بندی‌شده به عامل می‌مانند تا هر عامل مجموعه جست‌وجوی رونوشت خودش را حفظ کند.

## یک شماره WhatsApp، چند نفر (تفکیک پیام مستقیم)

می‌توانید **پیام‌های مستقیم WhatsApp متفاوت** را به عامل‌های متفاوت مسیریابی کنید و همچنان روی **یک حساب WhatsApp** بمانید. با `peer.kind: "direct"` بر اساس فرستنده E.164 (مانند `+15551234567`) تطبیق دهید. پاسخ‌ها همچنان از همان شماره WhatsApp ارسال می‌شوند (بدون هویت فرستنده مخصوص هر عامل).

<Note>
گفت‌وگوهای مستقیم به **کلید نشست اصلی** عامل فروکاسته می‌شوند، بنابراین ایزوله‌سازی واقعی به **یک عامل برای هر نفر** نیاز دارد.
</Note>

نمونه:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

نکته‌ها:

- کنترل دسترسی پیام مستقیم **برای هر حساب WhatsApp سراسری** است (جفت‌سازی/فهرست مجاز)، نه مخصوص هر عامل.
- برای گروه‌های مشترک، گروه را به یک عامل متصل کنید یا از [گروه‌های پخش](/fa/channels/broadcast-groups) استفاده کنید.

## قوانین مسیریابی (پیام‌ها چگونه یک عامل را انتخاب می‌کنند)

اتصال‌ها **قطعی** هستند و **مشخص‌ترین مورد برنده است**:

<Steps>
  <Step title="تطبیق peer">
    شناسه دقیق پیام مستقیم/گروه/کانال.
  </Step>
  <Step title="تطبیق parentPeer">
    وراثت رشته گفت‌وگو.
  </Step>
  <Step title="guildId + نقش‌ها">
    مسیریابی نقش Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="تطبیق accountId برای یک کانال">
    fallback مخصوص حساب.
  </Step>
  <Step title="تطبیق در سطح کانال">
    `accountId: "*"`.
  </Step>
  <Step title="عامل پیش‌فرض">
    fallback به `agents.list[].default`، در غیر این صورت نخستین ورودی فهرست، پیش‌فرض: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="شکستن تساوی و معنای AND">
    - اگر چند اتصال در یک سطح یکسان تطبیق پیدا کنند، نخستین مورد در ترتیب پیکربندی برنده می‌شود.
    - اگر یک اتصال چند فیلد تطبیق تنظیم کند (برای مثال `peer` + `guildId`)، همه فیلدهای مشخص‌شده لازم هستند (معنای `AND`).

  </Accordion>
  <Accordion title="جزئیات دامنه حساب">
    - اتصالی که `accountId` را حذف می‌کند، فقط با حساب پیش‌فرض تطبیق پیدا می‌کند. با همه حساب‌ها تطبیق پیدا نمی‌کند.
    - برای fallback در سراسر کانال روی همه حساب‌ها از `accountId: "*"` استفاده کنید.
    - برای تطبیق یک حساب از `accountId: "<name>"` استفاده کنید.
    - اگر بعداً همان اتصال را برای همان عامل با شناسه حساب صریح اضافه کنید، OpenClaw اتصال موجودِ فقط-کانال را به‌جای تکرار کردن، به اتصال دامنه‌بندی‌شده به حساب ارتقا می‌دهد.

  </Accordion>
</AccordionGroup>

## چند حساب / شماره تلفن

کانال‌هایی که از **چند حساب** پشتیبانی می‌کنند (مثلاً WhatsApp) از `accountId` برای شناسایی هر ورود استفاده می‌کنند. هر `accountId` می‌تواند به عامل متفاوتی مسیریابی شود، بنابراین یک سرور می‌تواند چند شماره تلفن را بدون مخلوط کردن نشست‌ها میزبانی کند.

اگر وقتی `accountId` حذف شده است یک حساب پیش‌فرض در سطح کانال می‌خواهید، `channels.<channel>.defaultAccount` را تنظیم کنید (اختیاری). وقتی تنظیم نشده باشد، OpenClaw اگر `default` موجود باشد به آن fallback می‌کند، وگرنه نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده) را انتخاب می‌کند.

کانال‌های رایج پشتیبان این الگو شامل این موارد هستند:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## مفاهیم

- `agentId`: یک «مغز» (فضای کاری، احراز هویت مخصوص عامل، ذخیره‌گاه نشست مخصوص عامل).
- `accountId`: یک نمونه حساب کانال (مثلاً حساب WhatsApp با نام `"personal"` در برابر `"biz"`).
- `binding`: پیام‌های ورودی را بر اساس `(channel, accountId, peer)` و در صورت نیاز شناسه‌های guild/team به یک `agentId` مسیریابی می‌کند.
- گفت‌وگوهای مستقیم به `agent:<agentId>:<mainKey>` فروکاسته می‌شوند («اصلی» مخصوص هر عامل؛ `session.mainKey`).

## نمونه‌های پلتفرم

<AccordionGroup>
  <Accordion title="ربات‌های Discord برای هر عامل">
    هر حساب ربات Discord به یک `accountId` یکتا نگاشت می‌شود. هر حساب را به یک عامل متصل کنید و فهرست‌های مجاز را برای هر ربات جدا نگه دارید.

    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "coding", workspace: "~/.openclaw/workspace-coding" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "discord", accountId: "default" } },
        { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
      ],
      channels: {
        discord: {
          groupPolicy: "allowlist",
          accounts: {
            default: {
              token: "DISCORD_BOT_TOKEN_MAIN",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "222222222222222222": { allow: true, requireMention: false },
                  },
                },
              },
            },
            coding: {
              token: "DISCORD_BOT_TOKEN_CODING",
              guilds: {
                "123456789012345678": {
                  channels: {
                    "333333333333333333": { allow: true, requireMention: false },
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    - هر bot را به guild دعوت کنید و Message Content Intent را فعال کنید.
    - توکن‌ها در `channels.discord.accounts.<id>.token` قرار می‌گیرند (حساب پیش‌فرض می‌تواند از `DISCORD_BOT_TOKEN` استفاده کند).

  </Accordion>
  <Accordion title="Telegram bots per agent">
    ```json5
    {
      agents: {
        list: [
          { id: "main", workspace: "~/.openclaw/workspace-main" },
          { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
        ],
      },
      bindings: [
        { agentId: "main", match: { channel: "telegram", accountId: "default" } },
        { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
      ],
      channels: {
        telegram: {
          accounts: {
            default: {
              botToken: "123456:ABC...",
              dmPolicy: "pairing",
            },
            alerts: {
              botToken: "987654:XYZ...",
              dmPolicy: "allowlist",
              allowFrom: ["tg:123456789"],
            },
          },
        },
      },
    }
    ```

    - با BotFather برای هر عامل یک bot بسازید و هر توکن را کپی کنید.
    - توکن‌ها در `channels.telegram.accounts.<id>.botToken` قرار می‌گیرند (حساب پیش‌فرض می‌تواند از `TELEGRAM_BOT_TOKEN` استفاده کند).
    - برای چند bot در یک گروه Telegram، هر bot را دعوت کنید و botی را که باید پاسخ دهد mention کنید.
    - BotFather Privacy Mode را برای هر bot گروهی غیرفعال کنید، سپس bot را دوباره اضافه کنید تا Telegram تنظیم را اعمال کند.
    - گروه‌ها را با `channels.telegram.groups` مجاز کنید، یا فقط برای استقرارهای گروهی قابل اعتماد از `groupPolicy: "open"` استفاده کنید.
    - شناسه‌های کاربری فرستنده را در `groupAllowFrom` قرار دهید. شناسه‌های گروه و supergroup باید در `channels.telegram.groups` باشند، نه در `groupAllowFrom`.
    - بر اساس `accountId` bind کنید تا هر bot به عامل خودش route شود.

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
    پیش از راه‌اندازی gateway، هر حساب را link کنید:

    ```bash
    openclaw channels login --channel whatsapp --account personal
    openclaw channels login --channel whatsapp --account biz
    ```

    `~/.openclaw/openclaw.json` (JSON5):

    ```js
    {
      agents: {
        list: [
          {
            id: "home",
            default: true,
            name: "Home",
            workspace: "~/.openclaw/workspace-home",
            agentDir: "~/.openclaw/agents/home/agent",
          },
          {
            id: "work",
            name: "Work",
            workspace: "~/.openclaw/workspace-work",
            agentDir: "~/.openclaw/agents/work/agent",
          },
        ],
      },

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
      tools: {
        agentToAgent: {
          enabled: false,
          allow: ["home", "work"],
        },
      },

      channels: {
        whatsapp: {
          accounts: {
            personal: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## الگوهای رایج

<Tabs>
  <Tab title="WhatsApp daily + Telegram deep work">
    بر اساس کانال جدا کنید: WhatsApp را به یک عامل سریع روزمره و Telegram را به یک عامل Opus route کنید.

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    نکته‌ها:

    - این مثال‌ها از `accountId: "*"` استفاده می‌کنند تا اگر بعدا حساب‌هایی اضافه کردید، bindingها همچنان کار کنند.
    - برای route کردن یک DM/گروه مشخص به Opus در حالی که بقیه روی chat می‌مانند، یک binding با `match.peer` برای آن peer اضافه کنید؛ matchهای peer همیشه بر ruleهای سراسری کانال مقدم هستند.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
    WhatsApp را روی عامل سریع نگه دارید، اما یک DM را به Opus route کنید:

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Everyday",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Deep Work",
            workspace: "~/.openclaw/workspace-opus",
            model: "anthropic/claude-opus-4-6",
          },
        ],
      },
      bindings: [
        {
          agentId: "opus",
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    bindingهای peer همیشه مقدم هستند، بنابراین آن‌ها را بالاتر از rule سراسری کانال نگه دارید.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    یک عامل خانوادگی اختصاصی را با mention gating و سیاست ابزار سخت‌گیرانه‌تر به یک گروه WhatsApp bind کنید:

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "Family",
            workspace: "~/.openclaw/workspace-family",
            identity: { name: "Family Bot" },
            groupChat: {
              mentionPatterns: ["@family", "@familybot", "@Family Bot"],
            },
            sandbox: {
              mode: "all",
              scope: "agent",
            },
            tools: {
              allow: [
                "exec",
                "read",
                "sessions_list",
                "sessions_history",
                "sessions_send",
                "sessions_spawn",
                "session_status",
              ],
              deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
            },
          },
        ],
      },
      bindings: [
        {
          agentId: "family",
          match: {
            channel: "whatsapp",
            peer: { kind: "group", id: "120363999999999999@g.us" },
          },
        },
      ],
    }
    ```

    نکته‌ها:

    - فهرست‌های allow/deny ابزارها **tools** هستند، نه Skills. اگر یک Skill نیاز دارد یک binary را اجرا کند، مطمئن شوید `exec` مجاز است و binary در sandbox وجود دارد.
    - برای gating سخت‌گیرانه‌تر، `agents.list[].groupChat.mentionPatterns` را تنظیم کنید و allowlistهای گروه را برای کانال فعال نگه دارید.

  </Tab>
</Tabs>

## پیکربندی sandbox و ابزار برای هر عامل

هر عامل می‌تواند sandbox و محدودیت‌های ابزار خودش را داشته باشد:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` زیر `sandbox.docker` قرار دارد و هنگام ایجاد container یک بار اجرا می‌شود. overrideهای `sandbox.docker.*` برای هر عامل وقتی scope نهایی `"shared"` باشد نادیده گرفته می‌شوند.
</Note>

**مزایا:**

- **ایزوله‌سازی امنیتی**: ابزارها را برای عامل‌های غیرقابل اعتماد محدود کنید.
- **کنترل منابع**: عامل‌های مشخص را sandbox کنید و بقیه را روی host نگه دارید.
- **سیاست‌های انعطاف‌پذیر**: مجوزهای متفاوت برای هر عامل.

<Note>
`tools.elevated` **سراسری** و مبتنی بر فرستنده است؛ برای هر عامل قابل پیکربندی نیست. اگر به مرزهای مخصوص هر عامل نیاز دارید، از `agents.list[].tools` برای deny کردن `exec` استفاده کنید. برای هدف‌گیری گروهی، از `agents.list[].groupChat.mentionPatterns` استفاده کنید تا @mentionها به‌درستی به عامل مورد نظر map شوند.
</Note>

برای مثال‌های مفصل، [sandbox و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) را ببینید.

## مرتبط

- [عامل‌های ACP](/fa/tools/acp-agents) — اجرای harnessهای کدنویسی خارجی
- [route کردن کانال](/fa/channels/channel-routing) — پیام‌ها چگونه به عامل‌ها route می‌شوند
- [حضور](/fa/concepts/presence) — حضور و دسترس‌پذیری عامل
- [Session](/fa/concepts/session) — ایزوله‌سازی و route کردن session
- [زیرعامل‌ها](/fa/tools/subagents) — ایجاد اجراهای عامل در پس‌زمینه
