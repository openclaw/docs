---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'مسیریابی چندعاملی: عامل‌های ایزوله، حساب‌های کانال، و پیوندها'
title: مسیریابی چندعاملی
x-i18n:
    generated_at: "2026-04-29T22:44:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

چندین عامل _ایزوله_ را اجرا کنید — هرکدام با فضای کاری، دایرکتوری وضعیت (`agentDir`) و تاریخچه نشست خودش — به‌همراه چندین حساب کانال (مثلا دو WhatsApp) در یک Gateway در حال اجرا. پیام‌های ورودی از طریق اتصال‌ها به عامل درست هدایت می‌شوند.

در اینجا **عامل** محدوده کامل هر پرسونا است: فایل‌های فضای کاری، پروفایل‌های احراز هویت، رجیستری مدل، و ذخیره‌گاه نشست. `agentDir` دایرکتوری وضعیت روی دیسک است که این پیکربندی مختص هر عامل را در `~/.openclaw/agents/<agentId>/` نگه می‌دارد. یک **اتصال** یک حساب کانال (مثلا یک فضای کاری Slack یا یک شماره WhatsApp) را به یکی از آن عامل‌ها نگاشت می‌کند.

## «یک عامل» چیست؟

یک **عامل** مغزی با محدوده کامل است که موارد زیر را به‌صورت مستقل دارد:

- **فضای کاری** (فایل‌ها، AGENTS.md/SOUL.md/USER.md، یادداشت‌های محلی، قواعد پرسونا).
- **دایرکتوری وضعیت** (`agentDir`) برای پروفایل‌های احراز هویت، رجیستری مدل، و پیکربندی مختص هر عامل.
- **ذخیره‌گاه نشست** (تاریخچه گفتگو + وضعیت مسیریابی) زیر `~/.openclaw/agents/<agentId>/sessions`.

پروفایل‌های احراز هویت **مختص هر عامل** هستند. هر عامل از مسیر خودش می‌خواند:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` در اینجا نیز مسیر امن‌تر یادآوری میان‌نشستی است: نمایی محدود و پاک‌سازی‌شده برمی‌گرداند، نه تخلیه خام رونوشت. یادآوری دستیار برچسب‌های تفکر، داربست `<relevant-memories>`، بارهای XML فراخوانی ابزار به‌صورت متن ساده (شامل `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>` و بلوک‌های فراخوانی ابزار کوتاه‌شده)، داربست فراخوانی ابزار تنزل‌یافته، توکن‌های کنترلی مدل ASCII/تمام‌عرض نشت‌کرده، و XML فراخوانی ابزار MiniMax بدشکل را پیش از پوشاندن/کوتاه‌سازی حذف می‌کند.
</Note>

<Warning>
هرگز `agentDir` را بین عامل‌ها دوباره استفاده نکنید (باعث برخوردهای احراز هویت/نشست می‌شود). عامل‌ها
می‌توانند وقتی پروفایل محلی ندارند، پروفایل‌های احراز هویت عامل پیش‌فرض/اصلی را بخوانند،
اما OpenClaw توکن‌های تازه‌سازی OAuth را در ذخیره‌گاه عامل
ثانویه شبیه‌سازی نمی‌کند. اگر یک حساب OAuth مستقل می‌خواهید، از
همان عامل وارد شوید؛ اگر اعتبارنامه‌ها را دستی کپی می‌کنید، فقط پروفایل‌های ایستای قابل‌حمل
`api_key` یا `token` را کپی کنید.
</Warning>

Skills از فضای کاری هر عامل به‌علاوه ریشه‌های مشترک مانند `~/.openclaw/skills` بارگذاری می‌شوند، سپس در صورت پیکربندی، با فهرست مجاز Skills مؤثر عامل فیلتر می‌شوند. از `agents.defaults.skills` برای خط پایه مشترک و از `agents.list[].skills` برای جایگزینی مختص هر عامل استفاده کنید. [Skills: مختص هر عامل در برابر مشترک](/fa/tools/skills#per-agent-vs-shared-skills) و [Skills: فهرست‌های مجاز Skills عامل](/fa/tools/skills#agent-skill-allowlists) را ببینید.

Gateway می‌تواند **یک عامل** (پیش‌فرض) یا **عامل‌های متعدد** را کنار هم میزبانی کند.

<Note>
**یادداشت فضای کاری:** فضای کاری هر عامل **cwd پیش‌فرض** است، نه یک سندباکس سخت. مسیرهای نسبی داخل فضای کاری حل می‌شوند، اما مسیرهای مطلق می‌توانند به مکان‌های دیگر میزبان برسند مگر اینکه سندباکسینگ فعال شده باشد. [سندباکسینگ](/fa/gateway/sandboxing) را ببینید.
</Note>

## مسیرها (نقشه سریع)

- پیکربندی: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- دایرکتوری وضعیت: `~/.openclaw` (یا `OPENCLAW_STATE_DIR`)
- فضای کاری: `~/.openclaw/workspace` (یا `~/.openclaw/workspace-<agentId>`)
- دایرکتوری عامل: `~/.openclaw/agents/<agentId>/agent` (یا `agents.list[].agentDir`)
- نشست‌ها: `~/.openclaw/agents/<agentId>/sessions`

### حالت تک‌عاملی (پیش‌فرض)

اگر کاری نکنید، OpenClaw یک عامل واحد را اجرا می‌کند:

- `agentId` به‌صورت پیش‌فرض **`main`** است.
- نشست‌ها با `agent:main:<mainKey>` کلیدگذاری می‌شوند.
- فضای کاری به‌صورت پیش‌فرض `~/.openclaw/workspace` است (یا وقتی `OPENCLAW_PROFILE` تنظیم شده باشد `~/.openclaw/workspace-<profile>`).
- وضعیت به‌صورت پیش‌فرض `~/.openclaw/agents/main/agent` است.

## کمک‌کننده عامل

از جادوگر عامل برای افزودن یک عامل ایزوله جدید استفاده کنید:

```bash
openclaw agents add work
```

سپس برای مسیریابی پیام‌های ورودی، `bindings` را اضافه کنید (یا بگذارید جادوگر این کار را انجام دهد).

با این دستور بررسی کنید:

```bash
openclaw agents list --bindings
```

## شروع سریع

<Steps>
  <Step title="ایجاد فضای کاری هر عامل">
    از جادوگر استفاده کنید یا فضاهای کاری را دستی بسازید:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    هر عامل فضای کاری خودش را با `SOUL.md`، `AGENTS.md`، و در صورت نیاز `USER.md` دریافت می‌کند، به‌علاوه یک `agentDir` اختصاصی و ذخیره‌گاه نشست زیر `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="ایجاد حساب‌های کانال">
    برای هر عامل، روی کانال‌های دلخواه خود یک حساب بسازید:

    - Discord: برای هر عامل یک ربات، Message Content Intent را فعال کنید، هر توکن را کپی کنید.
    - Telegram: برای هر عامل از طریق BotFather یک ربات، هر توکن را کپی کنید.
    - WhatsApp: هر شماره تلفن را برای هر حساب پیوند دهید.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    راهنماهای کانال را ببینید: [Discord](/fa/channels/discord)، [Telegram](/fa/channels/telegram)، [WhatsApp](/fa/channels/whatsapp).

  </Step>
  <Step title="افزودن عامل‌ها، حساب‌ها و اتصال‌ها">
    عامل‌ها را زیر `agents.list`، حساب‌های کانال را زیر `channels.<channel>.accounts` اضافه کنید و با `bindings` آن‌ها را وصل کنید (نمونه‌ها در ادامه).
  </Step>
  <Step title="راه‌اندازی دوباره و بررسی">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## چندین عامل = چندین نفر، چندین شخصیت

با **چندین عامل**، هر `agentId` به یک **پرسونای کاملا ایزوله** تبدیل می‌شود:

- **شماره تلفن‌ها/حساب‌های متفاوت** (برای هر `accountId` کانال).
- **شخصیت‌های متفاوت** (فایل‌های فضای کاری مختص هر عامل مانند `AGENTS.md` و `SOUL.md`).
- **احراز هویت + نشست‌های جداگانه** (بدون تداخل، مگر اینکه صراحتا فعال شود).

این امکان می‌دهد **چندین نفر** یک سرور Gateway را به‌اشتراک بگذارند، در حالی که «مغزهای» AI و داده‌هایشان ایزوله باقی می‌ماند.

## جستجوی حافظه QMD میان‌عاملی

اگر یک عامل باید رونوشت‌های نشست QMD عامل دیگری را جستجو کند، مجموعه‌های اضافی را زیر `agents.list[].memorySearch.qmd.extraCollections` اضافه کنید. فقط وقتی از `agents.defaults.memorySearch.qmd.extraCollections` استفاده کنید که همه عامل‌ها باید همان مجموعه‌های رونوشت مشترک را به ارث ببرند.

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

مسیر مجموعه اضافی می‌تواند بین عامل‌ها مشترک باشد، اما وقتی مسیر خارج از فضای کاری عامل است، نام مجموعه صریح باقی می‌ماند. مسیرهای داخل فضای کاری همچنان در محدوده عامل می‌مانند تا هر عامل مجموعه جستجوی رونوشت خودش را نگه دارد.

## یک شماره WhatsApp، چندین نفر (تفکیک پیام مستقیم)

می‌توانید **پیام‌های مستقیم WhatsApp متفاوت** را به عامل‌های متفاوت هدایت کنید، در حالی که همچنان روی **یک حساب WhatsApp** می‌مانید. بر اساس فرستنده E.164 (مانند `+15551234567`) با `peer.kind: "direct"` مطابقت دهید. پاسخ‌ها همچنان از همان شماره WhatsApp می‌آیند (بدون هویت فرستنده مختص هر عامل).

<Note>
گفتگوهای مستقیم به **کلید نشست اصلی** عامل فروکاسته می‌شوند، بنابراین ایزولاسیون واقعی به **یک عامل برای هر نفر** نیاز دارد.
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

یادداشت‌ها:

- کنترل دسترسی پیام مستقیم **به‌صورت سراسری برای هر حساب WhatsApp** است (جفت‌سازی/فهرست مجاز)، نه برای هر عامل.
- برای گروه‌های مشترک، گروه را به یک عامل متصل کنید یا از [گروه‌های پخش](/fa/channels/broadcast-groups) استفاده کنید.

## قواعد مسیریابی (پیام‌ها چگونه یک عامل را انتخاب می‌کنند)

اتصال‌ها **قطعی** هستند و **خاص‌ترین مورد برنده است**:

<Steps>
  <Step title="مطابقت peer">
    شناسه دقیق پیام مستقیم/گروه/کانال.
  </Step>
  <Step title="مطابقت parentPeer">
    وراثت رشته گفتگو.
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
  <Step title="مطابقت accountId برای یک کانال">
    جایگزین برای هر حساب.
  </Step>
  <Step title="مطابقت در سطح کانال">
    `accountId: "*"`.
  </Step>
  <Step title="عامل پیش‌فرض">
    بازگشت به `agents.list[].default`، وگرنه نخستین ورودی فهرست، پیش‌فرض: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="شکستن تساوی و معناشناسی AND">
    - اگر چند اتصال در یک سطح مطابقت داشته باشند، نخستین مورد در ترتیب پیکربندی برنده است.
    - اگر یک اتصال چند فیلد مطابقت را تنظیم کند (برای مثال `peer` + `guildId`)، همه فیلدهای مشخص‌شده الزامی هستند (معناشناسی `AND`).

  </Accordion>
  <Accordion title="جزئیات محدوده حساب">
    - اتصالی که `accountId` را حذف کند، فقط با حساب پیش‌فرض مطابقت دارد.
    - از `accountId: "*"` برای یک جایگزین سراسری کانال در همه حساب‌ها استفاده کنید.
    - اگر بعدا همان اتصال را برای همان عامل با یک شناسه حساب صریح اضافه کنید، OpenClaw اتصال موجود فقط-کانال را به‌جای تکثیر، به اتصال دارای محدوده حساب ارتقا می‌دهد.

  </Accordion>
</AccordionGroup>

## چندین حساب / شماره تلفن

کانال‌هایی که از **چندین حساب** پشتیبانی می‌کنند (مثلا WhatsApp)، از `accountId` برای شناسایی هر ورود استفاده می‌کنند. هر `accountId` می‌تواند به عامل متفاوتی هدایت شود، بنابراین یک سرور می‌تواند بدون مخلوط‌کردن نشست‌ها چندین شماره تلفن را میزبانی کند.

اگر وقتی `accountId` حذف شده است یک حساب پیش‌فرض سراسری کانال می‌خواهید، `channels.<channel>.defaultAccount` را تنظیم کنید (اختیاری). وقتی تنظیم نشده باشد، OpenClaw در صورت وجود به `default` برمی‌گردد، وگرنه نخستین شناسه حساب پیکربندی‌شده (مرتب‌شده) را استفاده می‌کند.

کانال‌های رایجی که از این الگو پشتیبانی می‌کنند شامل موارد زیر هستند:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## مفاهیم

- `agentId`: یک «مغز» (فضای کاری، احراز هویت مختص هر عامل، ذخیره‌گاه نشست مختص هر عامل).
- `accountId`: یک نمونه حساب کانال (مثلا حساب WhatsApp با نام `"personal"` در برابر `"biz"`).
- `binding`: پیام‌های ورودی را بر اساس `(channel, accountId, peer)` و به‌صورت اختیاری شناسه‌های guild/team به یک `agentId` هدایت می‌کند.
- گفتگوهای مستقیم به `agent:<agentId>:<mainKey>` فروکاسته می‌شوند («اصلی» مختص هر عامل؛ `session.mainKey`).

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
    - توکن‌ها در `channels.discord.accounts.<id>.token` قرار دارند (حساب پیش‌فرض می‌تواند از `DISCORD_BOT_TOKEN` استفاده کند).

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
    - توکن‌ها در `channels.telegram.accounts.<id>.botToken` قرار دارند (حساب پیش‌فرض می‌تواند از `TELEGRAM_BOT_TOKEN` استفاده کند).

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
    پیش از راه‌اندازی Gateway، هر حساب را پیوند دهید:

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
    بر اساس کانال جدا کنید: WhatsApp را به یک عامل سریع روزمره و Telegram را به یک عامل Opus مسیریابی کنید.

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
        { agentId: "chat", match: { channel: "whatsapp" } },
        { agentId: "opus", match: { channel: "telegram" } },
      ],
    }
    ```

    نکته‌ها:

    - اگر برای یک کانال چند حساب دارید، `accountId` را به binding اضافه کنید (برای مثال `{ channel: "whatsapp", accountId: "personal" }`).
    - برای مسیریابی یک DM/گروه به Opus و نگه داشتن بقیه روی chat، برای آن peer یک binding از نوع `match.peer` اضافه کنید؛ تطبیق‌های peer همیشه بر قانون‌های سراسری کانال مقدم‌اند.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
    WhatsApp را روی عامل سریع نگه دارید، اما یک DM را به Opus مسیریابی کنید:

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
          match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp" } },
      ],
    }
    ```

    bindingهای peer همیشه مقدم‌اند، پس آن‌ها را بالاتر از قانون سراسری کانال نگه دارید.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    یک عامل خانوادگی اختصاصی را با دروازه‌گذاری mention و سیاست ابزار محدودتر، به یک گروه WhatsApp واحد متصل کنید:

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

    - فهرست‌های اجازه/رد ابزار، **ابزارها** هستند، نه skills. اگر یک skill نیاز دارد یک باینری را اجرا کند، مطمئن شوید `exec` مجاز است و باینری در sandbox وجود دارد.
    - برای دروازه‌گذاری سخت‌گیرانه‌تر، `agents.list[].groupChat.mentionPatterns` را تنظیم کنید و allowlistهای گروه را برای کانال فعال نگه دارید.

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
`setupCommand` زیر `sandbox.docker` قرار دارد و یک بار هنگام ایجاد container اجرا می‌شود. overrideهای `sandbox.docker.*` برای هر عامل وقتی scope نهایی `"shared"` باشد نادیده گرفته می‌شوند.
</Note>

**مزایا:**

- **جداسازی امنیتی**: ابزارها را برای عامل‌های نامطمئن محدود کنید.
- **کنترل منابع**: عامل‌های مشخصی را sandbox کنید و بقیه را روی میزبان نگه دارید.
- **سیاست‌های انعطاف‌پذیر**: مجوزهای متفاوت برای هر عامل.

<Note>
`tools.elevated` **سراسری** و مبتنی بر فرستنده است؛ برای هر عامل قابل پیکربندی نیست. اگر به مرزبندی برای هر عامل نیاز دارید، از `agents.list[].tools` برای رد کردن `exec` استفاده کنید. برای هدف‌گیری گروه، از `agents.list[].groupChat.mentionPatterns` استفاده کنید تا @mentionها به‌صورت تمیز به عامل موردنظر نگاشت شوند.
</Note>

برای مثال‌های دقیق، [sandbox و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) را ببینید.

## مرتبط

- [عامل‌های ACP](/fa/tools/acp-agents) — اجرای harnessهای کدنویسی خارجی
- [مسیریابی کانال](/fa/channels/channel-routing) — پیام‌ها چگونه به عامل‌ها مسیریابی می‌شوند
- [حضور](/fa/concepts/presence) — حضور و دردسترس‌بودن عامل
- [Session](/fa/concepts/session) — جداسازی و مسیریابی session
- [زیرعامل‌ها](/fa/tools/subagents) — ایجاد اجراهای عامل پس‌زمینه
