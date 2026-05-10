---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'مسیریابی چندعاملی: عامل‌های ایزوله، حساب‌های کانال و اتصال‌ها'
title: مسیریابی چندعاملی
x-i18n:
    generated_at: "2026-05-10T19:36:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fd194cbe0938cc6ef6dd9b9803d2b1fe6f3e0777f4df7c407c692fd9f743c59
    source_path: concepts/multi-agent.md
    workflow: 16
---

چند عامل _ایزوله_ را اجرا کنید — هرکدام با workspace، دایرکتوری state (`agentDir`) و تاریخچه session خودش — به‌همراه چند حساب channel (مثلاً دو WhatsApp) در یک Gateway در حال اجرا. پیام‌های ورودی از طریق bindingها به عامل درست مسیریابی می‌شوند.

یک **عامل** در اینجا دامنه کاملِ مربوط به هر persona است: فایل‌های workspace، auth profileها، model registry و session store. `agentDir` دایرکتوری state روی دیسک است که این پیکربندیِ مربوط به هر عامل را در `~/.openclaw/agents/<agentId>/` نگه می‌دارد. یک **binding** یک حساب channel (مثلاً یک workspace در Slack یا یک شماره WhatsApp) را به یکی از آن عامل‌ها نگاشت می‌کند.

## «یک عامل» چیست؟

یک **عامل** یک مغز کاملاً دامنه‌بندی‌شده است که موارد خودش را دارد:

- **Workspace** (فایل‌ها، AGENTS.md/SOUL.md/USER.md، یادداشت‌های local، قوانین persona).
- **دایرکتوری state** (`agentDir`) برای auth profileها، model registry و پیکربندی مربوط به هر عامل.
- **Session store** (تاریخچه chat + state مسیریابی) زیر `~/.openclaw/agents/<agentId>/sessions`.

Auth profileها **مربوط به هر عامل** هستند. هر عامل از مسیر خودش می‌خواند:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` اینجا هم مسیر امن‌تر برای یادآوری میان-session است: یک نمای محدود و پاک‌سازی‌شده برمی‌گرداند، نه dump خام transcript. یادآوری assistant، thinking tagها، scaffoldingهای `<relevant-memories>`، payloadهای XML فراخوانی tool به‌صورت متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>` و بلوک‌های فراخوانی tool کوتاه‌شده)، scaffoldingهای تنزل‌یافته فراخوانی tool، tokenهای کنترلی مدل ASCII/full-width نشت‌کرده، و XML فراخوانی tool ناقص MiniMax را پیش از redaction/truncation حذف می‌کند.
</Note>

<Warning>
هرگز `agentDir` را بین عامل‌ها دوباره استفاده نکنید (باعث برخورد auth/session می‌شود). عامل‌ها
وقتی profile محلی ندارند می‌توانند auth profileهای عامل پیش‌فرض/اصلی را بخوانند، اما OpenClaw tokenهای refresh مربوط به OAuth را در store عامل ثانویه clone نمی‌کند. اگر یک حساب OAuth مستقل می‌خواهید، از همان عامل sign in کنید؛ اگر credentialها را دستی copy می‌کنید، فقط profileهای static قابل‌حمل
`api_key` یا `token` را copy کنید.
</Warning>

Skills از workspace هر عامل به‌علاوه rootهای مشترک مانند `~/.openclaw/skills` بارگذاری می‌شوند، سپس در صورت پیکربندی، با allowlist مؤثر Skills عامل filter می‌شوند. از `agents.defaults.skills` برای baseline مشترک و از `agents.list[].skills` برای جایگزینیِ مربوط به هر عامل استفاده کنید. [Skills: per-agent vs shared](/fa/tools/skills#per-agent-vs-shared-skills) و [Skills: agent skill allowlists](/fa/tools/skills#agent-skill-allowlists) را ببینید.

Gateway می‌تواند **یک عامل** (پیش‌فرض) یا **چند عامل** را کنار هم host کند.

<Note>
**یادداشت workspace:** workspace هر عامل **cwd پیش‌فرض** است، نه sandbox سخت‌گیرانه. مسیرهای نسبی داخل workspace resolve می‌شوند، اما مسیرهای مطلق می‌توانند به locationهای دیگر host دسترسی پیدا کنند مگر اینکه sandboxing فعال باشد. [Sandboxing](/fa/gateway/sandboxing) را ببینید.
</Note>

## مسیرها (نقشه سریع)

- Config: `~/.openclaw/openclaw.json` (یا `OPENCLAW_CONFIG_PATH`)
- State dir: `~/.openclaw` (یا `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (یا `~/.openclaw/workspace-<agentId>`)
- Agent dir: `~/.openclaw/agents/<agentId>/agent` (یا `agents.list[].agentDir`)
- Sessions: `~/.openclaw/agents/<agentId>/sessions`

### حالت تک‌عاملی (پیش‌فرض)

اگر کاری نکنید، OpenClaw یک عامل واحد اجرا می‌کند:

- مقدار پیش‌فرض `agentId` برابر **`main`** است.
- Sessionها با قالب `agent:main:<mainKey>` کلیدگذاری می‌شوند.
- مقدار پیش‌فرض workspace برابر `~/.openclaw/workspace` است (یا وقتی `OPENCLAW_PROFILE` تنظیم شده باشد، `~/.openclaw/workspace-<profile>`).
- مقدار پیش‌فرض state برابر `~/.openclaw/agents/main/agent` است.

## Helper عامل

برای افزودن یک عامل ایزوله جدید از wizard عامل استفاده کنید:

```bash
openclaw agents add work
```

سپس برای مسیریابی پیام‌های ورودی، `bindings` را اضافه کنید (یا اجازه دهید wizard این کار را انجام دهد).

با دستور زیر بررسی کنید:

```bash
openclaw agents list --bindings
```

## شروع سریع

<Steps>
  <Step title="Create each agent workspace">
    از wizard استفاده کنید یا workspaceها را دستی بسازید:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    هر عامل workspace خودش را با `SOUL.md`، `AGENTS.md` و `USER.md` اختیاری دریافت می‌کند، به‌همراه یک `agentDir` اختصاصی و session store زیر `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Create channel accounts">
    برای هر عامل، روی channelهای دلخواه خود یک حساب بسازید:

    - Discord: برای هر عامل یک bot، Message Content Intent را فعال کنید، هر token را copy کنید.
    - Telegram: برای هر عامل یک bot از طریق BotFather، هر token را copy کنید.
    - WhatsApp: هر شماره تلفن را برای هر حساب link کنید.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    راهنماهای channel را ببینید: [Discord](/fa/channels/discord)، [Telegram](/fa/channels/telegram)، [WhatsApp](/fa/channels/whatsapp).

  </Step>
  <Step title="Add agents, accounts, and bindings">
    عامل‌ها را زیر `agents.list`، حساب‌های channel را زیر `channels.<channel>.accounts` اضافه کنید و آن‌ها را با `bindings` به هم وصل کنید (نمونه‌ها پایین آمده‌اند).
  </Step>
  <Step title="Restart and verify">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## چند عامل = چند نفر، چند شخصیت

با **چند عامل**، هر `agentId` به یک **persona کاملاً ایزوله** تبدیل می‌شود:

- **شماره‌های تلفن/حساب‌های متفاوت** (برای هر channel با `accountId`).
- **شخصیت‌های متفاوت** (فایل‌های workspace مربوط به هر عامل مانند `AGENTS.md` و `SOUL.md`).
- **Auth + sessionهای جداگانه** (بدون cross-talk مگر اینکه صراحتاً فعال شده باشد).

این امکان می‌دهد **چند نفر** یک server واحد Gateway را share کنند، درحالی‌که «مغزها» و داده‌های AI آن‌ها ایزوله می‌ماند.

## جستجوی حافظه QMD میان عامل‌ها

اگر یک عامل باید transcriptهای session QMD عامل دیگری را جستجو کند، collectionهای اضافی را زیر `agents.list[].memorySearch.qmd.extraCollections` اضافه کنید. فقط وقتی از `agents.defaults.memorySearch.qmd.extraCollections` استفاده کنید که همه عامل‌ها باید همان collectionهای transcript مشترک را inherit کنند.

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

مسیر collection اضافی می‌تواند بین عامل‌ها shared باشد، اما وقتی مسیر بیرون از workspace عامل است، نام collection صریح باقی می‌ماند. مسیرهای داخل workspace همچنان دامنه‌بندی‌شده به عامل می‌مانند تا هر عامل مجموعه جستجوی transcript خودش را نگه دارد.

## یک شماره WhatsApp، چند نفر (تقسیم DM)

می‌توانید **DMهای متفاوت WhatsApp** را به عامل‌های متفاوت مسیریابی کنید، درحالی‌که همچنان روی **یک حساب WhatsApp** هستید. با `peer.kind: "direct"` روی sender E.164 (مانند `+15551234567`) match کنید. پاسخ‌ها همچنان از همان شماره WhatsApp می‌آیند (بدون هویت sender جدا برای هر عامل).

<Note>
چت‌های مستقیم به **کلید session اصلی** عامل collapse می‌شوند، بنابراین ایزولاسیون واقعی به **یک عامل برای هر نفر** نیاز دارد.
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

- کنترل دسترسی DM **برای هر حساب WhatsApp به‌صورت global** است (pairing/allowlist)، نه برای هر عامل.
- برای گروه‌های shared، گروه را به یک عامل bind کنید یا از [گروه‌های broadcast](/fa/channels/broadcast-groups) استفاده کنید.

## قوانین مسیریابی (پیام‌ها چگونه یک عامل را انتخاب می‌کنند)

Bindingها **deterministic** هستند و **خاص‌ترین مورد برنده می‌شود**:

<Steps>
  <Step title="peer match">
    شناسه دقیق DM/group/channel.
  </Step>
  <Step title="parentPeer match">
    ارث‌بری thread.
  </Step>
  <Step title="guildId + roles">
    مسیریابی role در Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="accountId match for a channel">
    fallback مربوط به هر حساب.
  </Step>
  <Step title="Channel-level match">
    `accountId: "*"`.
  </Step>
  <Step title="Default agent">
    fallback به `agents.list[].default`، در غیر این صورت اولین entry فهرست، پیش‌فرض: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Tie-breaking and AND semantics">
    - اگر چند binding در همان tier match شوند، اولین مورد در ترتیب config برنده می‌شود.
    - اگر یک binding چند field برای match تنظیم کند (برای مثال `peer` + `guildId`)، همه fieldهای مشخص‌شده لازم هستند (semantics از نوع `AND`).

  </Accordion>
  <Accordion title="Account-scope detail">
    - bindingای که `accountId` را حذف کند فقط با حساب پیش‌فرض match می‌شود.
    - برای fallback سراسری channel در تمام حساب‌ها از `accountId: "*"` استفاده کنید.
    - اگر بعداً همان binding را برای همان عامل با یک account id صریح اضافه کنید، OpenClaw به‌جای duplicate کردن، binding موجودِ فقط-channel را به حالت account-scoped ارتقا می‌دهد.

  </Accordion>
</AccordionGroup>

## چند حساب / شماره تلفن

Channelهایی که از **چند حساب** پشتیبانی می‌کنند (مثلاً WhatsApp) از `accountId` برای شناسایی هر login استفاده می‌کنند. هر `accountId` می‌تواند به عامل متفاوتی مسیریابی شود، پس یک server می‌تواند چند شماره تلفن را بدون ترکیب sessionها host کند.

اگر وقتی `accountId` حذف شده است یک حساب پیش‌فرضِ channel-wide می‌خواهید، `channels.<channel>.defaultAccount` را تنظیم کنید (اختیاری). وقتی تنظیم نشده باشد، OpenClaw در صورت وجود به `default` fallback می‌کند، وگرنه به اولین configured account id (مرتب‌شده).

Channelهای رایجی که از این الگو پشتیبانی می‌کنند شامل این‌ها هستند:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## مفاهیم

- `agentId`: یک «مغز» (workspace، auth مربوط به هر عامل، session store مربوط به هر عامل).
- `accountId`: یک نمونه حساب channel (مثلاً حساب WhatsApp با نام `"personal"` در برابر `"biz"`).
- `binding`: پیام‌های ورودی را بر اساس `(channel, accountId, peer)` و به‌صورت اختیاری شناسه‌های guild/team به یک `agentId` مسیریابی می‌کند.
- چت‌های مستقیم به `agent:<agentId>:<mainKey>` collapse می‌شوند («main» مربوط به هر عامل؛ `session.mainKey`).

## نمونه‌های platform

<AccordionGroup>
  <Accordion title="Discord bots per agent">
    هر حساب bot در Discord به یک `accountId` یکتا map می‌شود. هر حساب را به یک عامل bind کنید و allowlistها را برای هر bot نگه دارید.

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
  <Accordion title="botهای Telegram برای هر agent">
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

    - با BotFather برای هر agent یک bot بسازید و هر توکن را کپی کنید.
    - توکن‌ها در `channels.telegram.accounts.<id>.botToken` قرار می‌گیرند (حساب پیش‌فرض می‌تواند از `TELEGRAM_BOT_TOKEN` استفاده کند).

  </Accordion>
  <Accordion title="شماره‌های WhatsApp برای هر agent">
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
  <Tab title="کار روزانه با WhatsApp + کار عمیق با Telegram">
    بر اساس کانال جدا کنید: WhatsApp را به یک agent سریع روزمره و Telegram را به یک agent Opus مسیریابی کنید.

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
    - برای مسیریابی یک DM/گروه مشخص به Opus و نگه‌داشتن بقیه روی chat، یک binding با `match.peer` برای آن peer اضافه کنید؛ تطبیق‌های peer همیشه بر قواعد سراسری کانال مقدم هستند.

  </Tab>
  <Tab title="همان کانال، یک peer به Opus">
    WhatsApp را روی agent سریع نگه دارید، اما یک DM را به Opus مسیریابی کنید:

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

    bindingهای peer همیشه مقدم هستند، بنابراین آن‌ها را بالاتر از قاعده سراسری کانال نگه دارید.

  </Tab>
  <Tab title="agent خانوادگی متصل به یک گروه WhatsApp">
    یک agent اختصاصی خانوادگی را با کنترل mention و سیاست ابزار محدودتر به یک گروه WhatsApp متصل کنید:

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

    - فهرست‌های allow/deny ابزار، **ابزارها** هستند، نه Skills. اگر یک skill نیاز دارد یک فایل اجرایی را اجرا کند، مطمئن شوید `exec` مجاز است و فایل اجرایی در sandbox وجود دارد.
    - برای کنترل سخت‌گیرانه‌تر، `agents.list[].groupChat.mentionPatterns` را تنظیم کنید و allowlistهای گروه را برای کانال فعال نگه دارید.

  </Tab>
</Tabs>

## پیکربندی sandbox و ابزار برای هر agent

هر agent می‌تواند sandbox و محدودیت‌های ابزار خودش را داشته باشد:

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
`setupCommand` زیر `sandbox.docker` قرار می‌گیرد و یک بار هنگام ایجاد کانتینر اجرا می‌شود. وقتی scope نهایی `"shared"` باشد، overrideهای `sandbox.docker.*` برای هر agent نادیده گرفته می‌شوند.
</Note>

**مزایا:**

- **جداسازی امنیتی**: ابزارها را برای agentهای غیرقابل اعتماد محدود کنید.
- **کنترل منابع**: agentهای مشخص را sandbox کنید و بقیه را روی میزبان نگه دارید.
- **سیاست‌های انعطاف‌پذیر**: مجوزهای متفاوت برای هر agent.

<Note>
`tools.elevated` **سراسری** و مبتنی بر فرستنده است؛ برای هر agent قابل پیکربندی نیست. اگر به مرزبندی برای هر agent نیاز دارید، از `agents.list[].tools` برای منع `exec` استفاده کنید. برای هدف‌گیری گروه، از `agents.list[].groupChat.mentionPatterns` استفاده کنید تا @mentionها به‌طور دقیق به agent موردنظر نگاشت شوند.
</Note>

برای نمونه‌های دقیق، [sandbox و ابزارهای چند-agent](/fa/tools/multi-agent-sandbox-tools) را ببینید.

## مرتبط

- [agentهای ACP](/fa/tools/acp-agents) — اجرای harnessهای کدنویسی خارجی
- [مسیریابی کانال](/fa/channels/channel-routing) — پیام‌ها چگونه به agentها مسیریابی می‌شوند
- [Presence](/fa/concepts/presence) — presence و دسترس‌پذیری agent
- [Session](/fa/concepts/session) — جداسازی و مسیریابی session
- [Sub-agentها](/fa/tools/subagents) — ایجاد اجراهای agent پس‌زمینه
