---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی حالت سوکت/HTTP در Slack
summary: راه‌اندازی Slack و رفتار زمان اجرا (حالت Socket + نشانی‌های URL درخواست HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-04T02:22:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2be45f03511a64373b1f4316c59800eeeef8baccb4c00454b49999258b2e546b
    source_path: channels/slack.md
    workflow: 16
---

آماده برای تولید در DMها و کانال‌ها از طریق یکپارچه‌سازی‌های برنامه Slack. حالت پیش‌فرض Socket Mode است؛ HTTP Request URLs نیز پشتیبانی می‌شوند.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    DMهای Slack به‌طور پیش‌فرض در حالت همگام‌سازی هستند.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی و کاتالوگ فرمان‌ها.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های میان‌کانالی و دستورالعمل‌های تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        در تنظیمات برنامه Slack دکمه **[Create New App](https://api.slack.com/apps/new)** را فشار دهید:

        - گزینه **from a manifest** را انتخاب کنید و یک workspace برای برنامه خود برگزینید
        - [نمونه manifest](#manifest-and-scope-checklist) زیر را جای‌گذاری کنید و برای ایجاد ادامه دهید
        - یک **App-Level Token** (`xapp-...`) با `connections:write` ایجاد کنید
        - برنامه را نصب کنید و **Bot Token** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

      </Step>

      <Step title="Configure OpenClaw">

        راه‌اندازی پیشنهادی SecretRef:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        جایگزین env (فقط حساب پیش‌فرض):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        در تنظیمات برنامه Slack دکمه **[Create New App](https://api.slack.com/apps/new)** را فشار دهید:

        - گزینه **from a manifest** را انتخاب کنید و یک workspace برای برنامه خود برگزینید
        - [نمونه manifest](#manifest-and-scope-checklist) را جای‌گذاری کنید و پیش از ایجاد، URLها را به‌روزرسانی کنید
        - **Signing Secret** را برای راستی‌آزمایی درخواست ذخیره کنید
        - برنامه را نصب کنید و **Bot Token** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

      </Step>

      <Step title="Configure OpenClaw">

        راه‌اندازی پیشنهادی SecretRef:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        برای HTTP چندحسابی، مسیرهای Webhook یکتا استفاده کنید

        به هر حساب یک `webhookPath` متمایز بدهید (پیش‌فرض `/slack/events`) تا ثبت‌ها با هم تداخل نداشته باشند.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## تنظیم انتقال Socket Mode

OpenClaw به‌طور پیش‌فرض برای Socket Mode، زمان‌انتظار pong کلاینت SDK مربوط به Slack را روی ۱۵ ثانیه تنظیم می‌کند. تنظیمات انتقال را فقط وقتی بازنویسی کنید که به تنظیمات اختصاصی workspace یا میزبان نیاز دارید:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

این را فقط برای workspaceهای Socket Mode استفاده کنید که زمان‌انتظار‌های Slack websocket pong/server-ping را ثبت می‌کنند یا روی میزبان‌هایی با کمبود شناخته‌شده چرخه رویداد اجرا می‌شوند. `clientPingTimeout` مدت انتظار برای pong پس از ارسال client ping توسط SDK است؛ `serverPingTimeout` مدت انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای برنامه، وضعیت برنامه باقی می‌مانند، نه سیگنال‌های زنده‌بودن انتقال.

## فهرست کنترل manifest و scope

manifest پایه برنامه Slack برای Socket Mode و HTTP Request URLs یکسان است. فقط بلوک `settings` (و `url` فرمان slash) تفاوت دارد.

manifest پایه (پیش‌فرض Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

برای حالت **HTTP Request URLs**، `settings` را با گونه HTTP جایگزین کنید و به هر فرمان slash مقدار `url` اضافه کنید. URL عمومی لازم است:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### تنظیمات اضافی manifest

قابلیت‌های متفاوتی را آشکار کنید که پیش‌فرض‌های بالا را گسترش می‌دهند.

manifest پیش‌فرض، زبانه **Home** در Slack App Home را فعال می‌کند و در `app_home_opened` مشترک می‌شود. وقتی عضوی از workspace زبانه Home را باز می‌کند، OpenClaw با `views.publish` یک نمای Home پیش‌فرض امن منتشر می‌کند؛ هیچ payload مکالمه یا پیکربندی خصوصی گنجانده نمی‌شود. زبانه **Messages** برای DMهای Slack فعال می‌ماند.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    می‌توان به‌جای یک فرمان پیکربندی‌شده واحد، با ظرافت از چند [فرمان slash بومی](#commands-and-slash-behavior) استفاده کرد:

    - از `/agentstatus` به‌جای `/status` استفاده کنید، چون فرمان `/status` رزرو شده است.
    - هم‌زمان بیش از ۲۵ فرمان slash را نمی‌توان در دسترس قرار داد.

    بخش موجود `features.slash_commands` خود را با زیرمجموعه‌ای از [فرمان‌های موجود](/fa/tools/slash-commands#command-list) جایگزین کنید:

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Reset the current session"
    },
    {
      "command": "/compact",
      "description": "Compact the session context",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Stop the current run"
    },
    {
      "command": "/session",
      "description": "Manage thread-binding expiry",
      "usage_hint": "idle <duration|off> or max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Set the thinking level",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Toggle verbose output",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Show or set fast mode",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Toggle reasoning visibility",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Toggle elevated mode",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Show or set exec defaults",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/model",
      "description": "Show or set the model",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "List providers/models",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Show the short help summary"
    },
    {
      "command": "/commands",
      "description": "Show the generated command catalog"
    },
    {
      "command": "/tools",
      "description": "Show what the current agent can use right now",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Show runtime status, including provider usage/quota when available"
    },
    {
      "command": "/tasks",
      "description": "List active/recent background tasks for the current session"
    },
    {
      "command": "/context",
      "description": "Explain how context is assembled",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Show your sender identity"
    },
    {
      "command": "/skill",
      "description": "Run a skill by name",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        از همان فهرست `slash_commands` بالا برای Socket Mode استفاده کنید، و به هر مدخل `"url": "https://gateway-host.example.com/slack/events"` اضافه کنید. نمونه:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Start a new session",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Show the short help summary",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        آن مقدار `url` را روی هر فرمان در فهرست تکرار کنید.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض برنامه Slack از هویت agent فعال (نام کاربری و آیکون سفارشی) استفاده کنند، scope ربات `chat:write.customize` را اضافه کنید.

    اگر از آیکون ایموجی استفاده می‌کنید، Slack انتظار دستور زبان `:emoji_name:` را دارد.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    اگر `channels.slack.userToken` را پیکربندی می‌کنید، scopeهای خواندن معمول عبارت‌اند از:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (اگر به خواندن‌های جست‌وجوی Slack وابسته هستید)

  </Accordion>
</AccordionGroup>

## مدل توکن

- `botToken` + `appToken` برای Socket Mode الزامی هستند.
- حالت HTTP به `botToken` + `signingSecret` نیاز دارد.
- `botToken`، `appToken`، `signingSecret`، و `userToken` رشته‌های متن ساده
  یا شیءهای SecretRef را می‌پذیرند.
- توکن‌های پیکربندی fallback متغیرهای محیطی را override می‌کنند.
- fallback متغیرهای محیطی `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
- `userToken` (`xoxp-...`) فقط از پیکربندی می‌آید (بدون fallback متغیر محیطی) و رفتار پیش‌فرض آن فقط‌خواندنی است (`userTokenReadOnly: true`).

رفتار snapshot وضعیت:

- بازرسی حساب Slack فیلدهای `*Source` و `*Status`
  را برای هر credential پیگیری می‌کند (`botToken`، `appToken`، `signingSecret`، `userToken`).
- وضعیت `available`، `configured_unavailable`، یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا منبع secret غیر inline دیگری پیکربندی شده است، اما مسیر فرمان/runtime فعلی
  نتوانسته مقدار واقعی را resolve کند.
- در حالت HTTP، `signingSecretStatus` درج می‌شود؛ در Socket Mode،
  جفت الزامی `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای actionها/خواندن‌های directory، وقتی user token پیکربندی شده باشد، می‌تواند ترجیح داده شود. برای نوشتن‌ها، bot token همچنان ترجیح داده می‌شود؛ نوشتن با user-token فقط وقتی مجاز است که `userTokenReadOnly: false` باشد و bot token در دسترس نباشد.
</Tip>

## actionها و gateها

actionهای Slack با `channels.slack.actions.*` کنترل می‌شوند.

گروه‌های action موجود در ابزارهای فعلی Slack:

| گروه      | پیش‌فرض |
| ---------- | ------- |
| messages   | فعال |
| reactions  | فعال |
| pins       | فعال |
| memberInfo | فعال |
| emojiList  | فعال |

actionهای پیام فعلی Slack شامل `send`، `upload-file`، `download-file`، `read`، `edit`، `delete`، `pin`، `unpin`، `list-pins`، `member-info`، و `emoji-list` هستند. `download-file` شناسه‌های فایل Slack نشان‌داده‌شده در placeholderهای فایل ورودی را می‌پذیرد و برای تصویرها preview تصویر یا برای انواع فایل دیگر metadata فایل محلی برمی‌گرداند.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.slack.allowFrom` allowlist رسمی DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.slack.allowFrom` شامل `"*"` باشد)
    - `disabled`

    flagهای DM:

    - `dm.enabled` (پیش‌فرض true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قدیمی)
    - `dm.groupEnabled` (DMهای گروهی به‌طور پیش‌فرض false)
    - `dm.groupChannels` (allowlist اختیاری MPIM)

    اولویت چندحسابی:

    - `channels.slack.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان unset باشد، `channels.slack.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.slack.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.slack.dm.policy` و `channels.slack.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` migrate می‌کند.

    Pairing در DMها از `openclaw pairing approve slack <code>` استفاده می‌کند.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` نحوه رسیدگی به کانال را کنترل می‌کند:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist کانال زیر `channels.slack.channels` قرار دارد و **باید از شناسه‌های پایدار کانال Slack** (برای نمونه `C12345678`) به‌عنوان کلیدهای پیکربندی استفاده کند.

    نکته runtime: اگر `channels.slack` کاملاً وجود نداشته باشد (راه‌اندازی فقط با env)، runtime به `groupPolicy="allowlist"` fallback می‌کند و warning ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    resolve نام/شناسه:

    - entryهای allowlist کانال و entryهای allowlist مربوط به DM هنگام startup و وقتی دسترسی token اجازه دهد resolve می‌شوند
    - entryهای resolveنشده نام کانال همان‌طور که پیکربندی شده‌اند نگه داشته می‌شوند، اما به‌طور پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند
    - authorization ورودی و مسیریابی کانال به‌طور پیش‌فرض ID-first هستند؛ تطبیق مستقیم username/slug به `channels.slack.dangerouslyAllowNameMatching: true` نیاز دارد

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) زیر `groupPolicy: "allowlist"` مطابقت **نمی‌کنند**. lookup کانال به‌طور پیش‌فرض ID-first است، بنابراین کلید مبتنی بر نام هرگز با موفقیت route نمی‌شود و همه پیام‌های آن کانال بی‌صدا block می‌شوند. این با `groupPolicy: "open"` فرق دارد؛ در آن حالت کلید کانال برای مسیریابی لازم نیست و کلید مبتنی بر نام ظاهراً کار می‌کند.

    همیشه از شناسه کانال Slack به‌عنوان کلید استفاده کنید. برای پیدا کردن آن: در Slack روی کانال راست‌کلیک کنید → **Copy link** — شناسه (`C...`) در انتهای URL ظاهر می‌شود.

    درست:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    نادرست (زیر `groupPolicy: "allowlist"` بی‌صدا block می‌شود):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    پیام‌های کانال به‌طور پیش‌فرض با mention gated می‌شوند.

    منابع mention:

    - mention صریح app (`<@botId>`)
    - mention گروه کاربری Slack (`<!subteam^S...>`) وقتی کاربر ربات عضو آن گروه کاربری باشد؛ به `usergroups:read` نیاز دارد
    - الگوهای regex برای mention (`agents.list[].groupChat.mentionPatterns`، fallback با `messages.groupChat.mentionPatterns`)
    - رفتار thread ضمنی reply-to-bot (وقتی `thread.requireExplicitMention` برابر `true` باشد غیرفعال می‌شود)

    کنترل‌های هر کانال (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق resolve در startup یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - قالب کلید `toolsBySender`: `id:`، `e164:`، `username:`، `name:`، یا wildcard `"*"`
      (کلیدهای قدیمی بدون prefix همچنان فقط به `id:` map می‌شوند)

    `allowBots` برای کانال‌ها و کانال‌های خصوصی محافظه‌کارانه است: پیام‌های room که توسط bot نوشته شده‌اند فقط وقتی پذیرفته می‌شوند که bot فرستنده صراحتاً در allowlist `users` همان room فهرست شده باشد، یا وقتی دست‌کم یک شناسه صریح مالک Slack از `channels.slack.allowFrom` در حال حاضر عضو room باشد. wildcardها و entryهای مالک با display-name حضور مالک را برآورده نمی‌کنند. حضور مالک از `conversations.members` Slack استفاده می‌کند؛ مطمئن شوید app scope خواندن مطابق با نوع room را دارد (`channels:read` برای کانال‌های عمومی، `groups:read` برای کانال‌های خصوصی). اگر member lookup شکست بخورد، OpenClaw پیام room نوشته‌شده توسط bot را drop می‌کند.

  </Tab>
</Tabs>

## threadها، sessionها، و tagهای پاسخ

- DMها به‌صورت `direct` route می‌شوند؛ کانال‌ها به‌صورت `channel`؛ MPIMها به‌صورت `group`.
- bindingهای route در Slack شناسه‌های خام peer به‌علاوه شکل‌های هدف Slack مانند `channel:C12345678`، `user:U12345678`، و `<@U12345678>` را می‌پذیرند.
- با `session.dmScope=main` پیش‌فرض، DMهای Slack به session اصلی agent collapse می‌شوند.
- sessionهای کانال: `agent:<agentId>:slack:channel:<channelId>`.
- پاسخ‌های thread می‌توانند در صورت کاربرد، suffixهای session thread بسازند (`:thread:<threadTs>`).
- مقدار پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ مقدار پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` کنترل می‌کند هنگام شروع session جدید thread چند پیام موجود از thread fetch شود (پیش‌فرض `20`؛ برای غیرفعال‌سازی `0` تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، mentionهای ضمنی thread را suppress می‌کند تا bot فقط به mentionهای صریح `@bot` داخل threadها پاسخ دهد، حتی وقتی bot قبلاً در thread مشارکت کرده باشد. بدون این، پاسخ‌ها در threadی که bot در آن مشارکت کرده است gate مربوط به `requireMention` را bypass می‌کنند.

کنترل‌های thread پاسخ:

- `channels.slack.replyToMode`: `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: برای هر `direct|group|channel`
- fallback قدیمی برای چت‌های مستقیم: `channels.slack.dm.replyToMode`

tagهای پاسخ دستی پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` **همه** thread کردن پاسخ در Slack را غیرفعال می‌کند، از جمله tagهای صریح `[[reply_to_*]]`. این با Telegram متفاوت است؛ در آنجا tagهای صریح همچنان در حالت `"off"` رعایت می‌شوند. threadهای Slack پیام‌ها را از کانال پنهان می‌کنند، در حالی که پاسخ‌های Telegram به‌صورت inline قابل مشاهده می‌مانند.
</Note>

## واکنش‌های Ack

`ackReaction` هنگام پردازش پیام ورودی توسط OpenClaw، یک ایموجی acknowledgement می‌فرستد.

ترتیب resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback ایموجی هویت agent (`agents.list[].identity.emoji`، وگرنه "👀")

نکته‌ها:

- Slack انتظار shortcode دارد (برای نمونه `"eyes"`).
- برای غیرفعال‌سازی واکنش برای حساب Slack یا به‌صورت global از `""` استفاده کنید.

## streaming متن

`channels.slack.streaming` رفتار preview زنده را کنترل می‌کند:

- `off`: streaming preview زنده را غیرفعال می‌کند.
- `partial` (پیش‌فرض): متن preview را با آخرین خروجی partial جایگزین می‌کند.
- `block`: به‌روزرسانی‌های preview تکه‌تکه‌شده را append می‌کند.
- `progress`: هنگام تولید، متن وضعیت progress را نشان می‌دهد، سپس متن نهایی را می‌فرستد.
- `streaming.preview.toolProgress`: وقتی draft preview فعال است، به‌روزرسانی‌های tool/progress را به همان پیام preview ویرایش‌شده route می‌کند (پیش‌فرض: `true`). برای نگه‌داشتن پیام‌های tool/progress جداگانه، `false` تنظیم کنید.

`channels.slack.streaming.nativeTransport` وقتی `channels.slack.streaming.mode` برابر `partial` باشد، streaming متن native در Slack را کنترل می‌کند (پیش‌فرض: `true`).

- برای نمایش streaming متن native و وضعیت thread دستیار Slack، یک thread پاسخ باید در دسترس باشد. انتخاب thread همچنان از `replyToMode` پیروی می‌کند.
- کانال، group-chat، و ریشه‌های DM سطح بالا همچنان می‌توانند وقتی native streaming در دسترس نیست یا thread پاسخی وجود ندارد از draft preview عادی استفاده کنند.
- DMهای سطح بالای Slack به‌طور پیش‌فرض خارج از thread می‌مانند، بنابراین preview native stream/status به سبک thread Slack را نشان نمی‌دهند؛ OpenClaw به‌جای آن یک draft preview در DM post و edit می‌کند.
- payloadهای رسانه‌ای و غیرمتنی به delivery عادی fallback می‌کنند.
- finalهای رسانه/خطا ویرایش‌های pending preview را cancel می‌کنند؛ finalهای واجد شرایط متن/block فقط وقتی flush می‌شوند که بتوانند preview را درجا edit کنند.
- اگر streaming در میانه پاسخ شکست بخورد، OpenClaw برای payloadهای باقی‌مانده به delivery عادی fallback می‌کند.

استفاده از draft preview به‌جای streaming متن native در Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

کلیدهای قدیمی:

- `channels.slack.streamMode` (`replace | status_final | append`) به‌صورت خودکار به `channels.slack.streaming.mode` migrate می‌شود.
- boolean `channels.slack.streaming` به‌صورت خودکار به `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` migrate می‌شود.
- `channels.slack.nativeStreaming` قدیمی به‌صورت خودکار به `channels.slack.streaming.nativeTransport` migrate می‌شود.

## fallback واکنش typing

`typingReaction` هنگام پردازش پاسخ توسط OpenClaw، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و وقتی run پایان می‌یابد آن را حذف می‌کند. این بیرون از پاسخ‌های thread بیشترین کاربرد را دارد؛ پاسخ‌های thread از نشانگر وضعیت پیش‌فرض "is typing..." استفاده می‌کنند.

ترتیب resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکته‌ها:

- Slack انتظار shortcodeها را دارد (برای مثال `"hourglass_flowing_sand"`).
- واکنش به‌صورت best-effort انجام می‌شود و پس از تکمیل مسیر پاسخ یا شکست، پاک‌سازی به‌طور خودکار تلاش می‌شود.

## رسانه، بخش‌بندی و تحویل

<AccordionGroup>
  <Accordion title="پیوست‌های ورودی">
    پیوست‌های فایل Slack از URLهای خصوصی میزبانی‌شده توسط Slack دانلود می‌شوند (جریان درخواست احراز هویت‌شده با توکن) و وقتی واکشی موفق باشد و محدودیت‌های اندازه اجازه دهند، در مخزن رسانه نوشته می‌شوند. جای‌نگهدارهای فایل شامل `fileId` مربوط به Slack هستند تا عامل‌ها بتوانند فایل اصلی را با `download-file` واکشی کنند.

    دانلودها از timeoutهای idle و کل محدودشده استفاده می‌کنند. اگر بازیابی فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به جای‌نگهدار فایل fallback می‌کند.

    سقف اندازه ورودی runtime به‌طور پیش‌فرض `20MB` است، مگر اینکه با `channels.slack.mediaMaxMb` بازنویسی شود.

  </Accordion>

  <Accordion title="متن و فایل‌های خروجی">
    - بخش‌های متن از `channels.slack.textChunkLimit` استفاده می‌کنند (پیش‌فرض 4000)
    - `channels.slack.chunkMode="newline"` تقسیم‌بندی با اولویت پاراگراف را فعال می‌کند
    - ارسال فایل از APIهای آپلود Slack استفاده می‌کند و می‌تواند شامل پاسخ‌های thread (`thread_ts`) باشد
    - سقف رسانه خروجی، وقتی پیکربندی شده باشد، از `channels.slack.mediaMaxMb` پیروی می‌کند؛ در غیر این صورت ارسال‌های کانال از پیش‌فرض‌های نوع MIME در pipeline رسانه استفاده می‌کنند

  </Accordion>

  <Accordion title="مقصدهای تحویل">
    مقصدهای صریح ترجیحی:

    - `user:<id>` برای DMها
    - `channel:<id>` برای کانال‌ها

    DMهای Slack که فقط متن/بلاک دارند می‌توانند مستقیماً به شناسه‌های کاربر post شوند؛ آپلود فایل و ارسال‌های thread ابتدا DM را از طریق APIهای مکالمه Slack باز می‌کنند، زیرا این مسیرها به یک شناسه مکالمه مشخص نیاز دارند.

  </Accordion>
</AccordionGroup>

## دستورها و رفتار slash

دستورهای slash در Slack یا به‌صورت یک دستور پیکربندی‌شده واحد ظاهر می‌شوند یا چند دستور native. برای تغییر پیش‌فرض‌های دستور، `channels.slack.slashCommand` را پیکربندی کنید:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

دستورهای native به [تنظیمات manifest اضافی](#additional-manifest-settings) در برنامه Slack شما نیاز دارند و در عوض با `channels.slack.commands.native: true` یا `commands.native: true` در پیکربندی‌های سراسری فعال می‌شوند.

- حالت خودکار دستور native برای Slack **خاموش** است، بنابراین `commands.native: "auto"` دستورهای native Slack را فعال نمی‌کند.

```txt
/help
```

منوهای آرگومان native از راهبرد رندر تطبیقی استفاده می‌کنند که پیش از dispatch کردن مقدار گزینه انتخاب‌شده، یک modal تأیید نشان می‌دهد:

- تا 5 گزینه: بلاک‌های دکمه
- 6 تا 100 گزینه: منوی انتخاب static
- بیش از 100 گزینه: انتخاب external با فیلترسازی گزینه async وقتی handlerهای گزینه‌های interactivity در دسترس باشند
- عبور از محدودیت‌های Slack: مقادیر گزینه encoded به دکمه‌ها fallback می‌کنند

```txt
/think
```

نشست‌های slash از کلیدهای ایزوله مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای دستورها را با استفاده از `CommandTargetSessionKey` به نشست مکالمه هدف route می‌کنند.

## پاسخ‌های تعاملی

Slack می‌تواند کنترل‌های پاسخ تعاملی نوشته‌شده توسط عامل را رندر کند، اما این قابلیت به‌طور پیش‌فرض غیرفعال است.

آن را به‌صورت سراسری فعال کنید:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

یا آن را فقط برای یک حساب Slack فعال کنید:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

وقتی فعال باشد، عامل‌ها می‌توانند directiveهای پاسخ فقط مخصوص Slack تولید کنند:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

این directiveها به Slack Block Kit کامپایل می‌شوند و clickها یا انتخاب‌ها را از مسیر event تعامل Slack موجود دوباره route می‌کنند.

یادداشت‌ها:

- این UI مخصوص Slack است. کانال‌های دیگر directiveهای Slack Block Kit را به سامانه‌های دکمه خودشان ترجمه نمی‌کنند.
- مقادیر callback تعاملی، توکن‌های opaque تولیدشده توسط OpenClaw هستند، نه مقادیر خام نوشته‌شده توسط عامل.
- اگر بلاک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit عبور کنند، OpenClaw به‌جای ارسال payload بلاک‌های نامعتبر، به پاسخ متنی اصلی fallback می‌کند.

## تأییدهای exec در Slack

Slack می‌تواند به‌جای fallback کردن به Web UI یا ترمینال، به‌عنوان یک client تأیید native با دکمه‌ها و تعامل‌های تعاملی عمل کند.

- تأییدهای exec از `channels.slack.execApprovals.*` برای route کردن native در DM/کانال استفاده می‌کنند.
- تأییدهای Plugin همچنان می‌توانند از طریق همان سطح دکمه native Slack resolve شوند، وقتی درخواست از قبل در Slack فرود آمده باشد و نوع شناسه تأیید `plugin:` باشد.
- مجوزدهی تأییدکننده همچنان اعمال می‌شود: فقط کاربرانی که به‌عنوان تأییدکننده شناسایی شده‌اند می‌توانند از طریق Slack درخواست‌ها را تأیید یا رد کنند.

این از همان سطح دکمه تأیید مشترک مانند کانال‌های دیگر استفاده می‌کند. وقتی `interactivity` در تنظیمات برنامه Slack شما فعال باشد، promptهای تأیید مستقیماً در مکالمه به‌صورت دکمه‌های Block Kit رندر می‌شوند.
وقتی آن دکمه‌ها وجود دارند، UX اصلی تأیید هستند؛ OpenClaw
فقط باید زمانی یک دستور دستی `/approve` اضافه کند که نتیجه ابزار بگوید تأییدهای chat
در دسترس نیستند یا تأیید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ وقتی ممکن باشد به `commands.ownerAllowFrom` fallback می‌کند)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`, `sessionFilter`

وقتی `enabled` تنظیم نشده یا `"auto"` باشد و دست‌کم یک
تأییدکننده resolve شود، Slack تأییدهای exec native را به‌طور خودکار فعال می‌کند. برای غیرفعال کردن صریح Slack به‌عنوان client تأیید native، `enabled: false` را تنظیم کنید.
برای اجبار به روشن بودن تأییدهای native وقتی تأییدکننده‌ها resolve می‌شوند، `enabled: true` را تنظیم کنید.

رفتار پیش‌فرض بدون پیکربندی صریح تأیید exec Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

پیکربندی صریح native برای Slack فقط زمانی لازم است که بخواهید تأییدکننده‌ها را بازنویسی کنید، فیلتر اضافه کنید، یا
به تحویل در chat مبدأ opt in کنید:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

forward کردن مشترک `approvals.exec` جداست. فقط زمانی از آن استفاده کنید که promptهای تأیید exec باید همچنین
به chatهای دیگر یا مقصدهای out-of-band صریح route شوند. forward کردن مشترک `approvals.plugin` نیز
جداست؛ دکمه‌های native Slack همچنان می‌توانند تأییدهای Plugin را resolve کنند، وقتی آن درخواست‌ها از قبل
در Slack فرود آمده باشند.

`/approve` در همان chat نیز در کانال‌ها و DMهای Slack که از قبل از دستورها پشتیبانی می‌کنند کار می‌کند. برای مدل کامل forward کردن تأیید، [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

## eventها و رفتار عملیاتی

- ویرایش/حذف پیام‌ها به eventهای سامانه map می‌شوند.
- broadcastهای thread (پاسخ‌های thread با گزینه «همچنین به کانال ارسال شود») به‌عنوان پیام‌های عادی کاربر پردازش می‌شوند.
- eventهای افزودن/حذف واکنش به eventهای سامانه map می‌شوند.
- eventهای پیوستن/خروج عضو، ایجاد/تغییرنام کانال، و افزودن/حذف pin به eventهای سامانه map می‌شوند.
- `channel_id_changed` می‌تواند وقتی `configWrites` فعال باشد، کلیدهای پیکربندی کانال را migrate کند.
- فراداده topic/purpose کانال به‌عنوان context غیرقابل اعتماد تلقی می‌شود و می‌تواند به context routing تزریق شود.
- آغازگر thread و seeding context تاریخچه اولیه thread، در صورت کاربرد، با allowlistهای فرستنده پیکربندی‌شده فیلتر می‌شوند.
- کنش‌های بلاک و تعامل‌های modal، eventهای ساختاریافته سامانه با قالب `Slack interaction: ...` و fieldهای payload غنی تولید می‌کنند:
  - کنش‌های بلاک: مقادیر انتخاب‌شده، برچسب‌ها، مقادیر picker و فراداده `workflow_*`
  - eventهای modal `view_submission` و `view_closed` با فراداده کانال routeشده و ورودی‌های فرم

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="فیلدهای مهم Slack">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- دسترسی DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle سازگاری: `dangerouslyAllowNameMatching` (break-glass؛ مگر در صورت نیاز خاموش نگه دارید)
- دسترسی کانال: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- thread/history: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- عملیات/قابلیت‌ها: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="پاسخی در کانال‌ها وجود ندارد">
    به‌ترتیب بررسی کنید:

    - `groupPolicy`
    - allowlist کانال (`channels.slack.channels`) — **کلیدها باید شناسه کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام تحت `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، زیرا routing کانال به‌طور پیش‌فرض ابتدا بر اساس شناسه است. برای یافتن شناسه: روی کانال در Slack راست‌کلیک کنید → **Copy link** — مقدار `C...` در انتهای URL شناسه کانال است.
    - `requireMention`
    - allowlist کاربران برای هر کانال

    دستورهای مفید:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="پیام‌های DM نادیده گرفته می‌شوند">
    بررسی کنید:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (یا legacy `channels.slack.dm.policy`)
    - تأییدهای pairing / ورودی‌های allowlist
    - eventهای DM دستیار Slack: لاگ‌های verbose که به `drop message_changed` اشاره می‌کنند
      معمولاً یعنی Slack یک event ویرایش‌شده thread دستیار را بدون
      فرستنده انسانی قابل بازیابی در فراداده پیام ارسال کرده است

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode وصل نمی‌شود">
    توکن‌های bot و app و فعال‌سازی Socket Mode را در تنظیمات برنامه Slack اعتبارسنجی کنید.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان می‌دهد، حساب Slack
    پیکربندی شده است اما runtime فعلی نتوانسته مقدار پشتوانه‌شده با SecretRef را
    resolve کند.

  </Accordion>

  <Accordion title="HTTP mode eventها را دریافت نمی‌کند">
    اعتبارسنجی کنید:

    - signing secret
    - مسیر Webhook
    - URLهای درخواست Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` یکتا برای هر حساب HTTP

    اگر `signingSecretStatus: "configured_unavailable"` در snapshotهای حساب
    ظاهر شود، حساب HTTP پیکربندی شده است اما runtime فعلی نتوانسته signing secret پشتوانه‌شده با SecretRef را
    resolve کند.

  </Accordion>

  <Accordion title="دستورهای native/slash اجرا نمی‌شوند">
    بررسی کنید که کدام را مدنظر داشتید:

    - حالت دستور native (`channels.slack.commands.native: true`) با دستورهای slash متناظر ثبت‌شده در Slack
    - یا حالت تک دستور slash (`channels.slack.slashCommand.enabled: true`)

    همچنین `commands.useAccessGroups` و allowlistهای کانال/کاربر را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مرجع vision پیوست‌ها

Slack می‌تواند وقتی دانلود فایل‌های Slack موفق باشد و محدودیت‌های اندازه اجازه دهند، رسانه دانلودشده را به turn عامل پیوست کند. فایل‌های تصویری می‌توانند از مسیر درک رسانه عبور داده شوند یا مستقیماً به یک مدل پاسخ vision-capable داده شوند؛ فایل‌های دیگر به‌جای اینکه به‌عنوان ورودی تصویر تلقی شوند، به‌صورت context فایل قابل دانلود نگه داشته می‌شوند.

### انواع رسانه پشتیبانی‌شده

| نوع رسانه                     | منبع               | رفتار فعلی                                                                  | یادداشت‌ها                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| تصاویر JPEG / PNG / GIF / WebP | URL فایل Slack       | دانلود و برای پردازش با قابلیت بینایی به نوبت پیوست می‌شود                   | سقف هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض ۲۰ MB)                 |
| فایل‌های PDF                      | URL فایل Slack       | دانلود و به‌عنوان زمینهٔ فایل برای ابزارهایی مانند `download-file` یا `pdf` ارائه می‌شود | ورودی Slack به‌طور خودکار PDFها را به ورودی بینایی تصویری تبدیل نمی‌کند |
| فایل‌های دیگر                    | URL فایل Slack       | در صورت امکان دانلود و به‌عنوان زمینهٔ فایل ارائه می‌شود                              | فایل‌های باینری به‌عنوان ورودی تصویر در نظر گرفته نمی‌شوند                               |
| پاسخ‌های رشته                 | فایل‌های شروع‌کنندهٔ رشته | وقتی پاسخ رسانهٔ مستقیم ندارد، فایل‌های پیام ریشه می‌توانند به‌عنوان زمینه آماده‌سازی شوند  | شروع‌کننده‌های فقط‌فایل از جای‌نگهدار پیوست استفاده می‌کنند                          |
| پیام‌های چندتصویری           | چند فایل Slack | هر فایل به‌طور مستقل ارزیابی می‌شود                                              | پردازش Slack به هشت فایل برای هر پیام محدود است                     |

### خط لولهٔ ورودی

وقتی یک پیام Slack همراه با پیوست‌های فایل می‌رسد:

1. OpenClaw فایل را از URL خصوصی Slack با استفاده از توکن ربات (`xoxb-...`) دانلود می‌کند.
2. در صورت موفقیت، فایل در ذخیره‌گاه رسانه نوشته می‌شود.
3. مسیرهای رسانهٔ دانلودشده و نوع‌های محتوا به زمینهٔ ورودی افزوده می‌شوند.
4. مسیرهای مدل/ابزار دارای قابلیت تصویر می‌توانند از پیوست‌های تصویری آن زمینه استفاده کنند.
5. فایل‌های غیرتصویری همچنان به‌صورت فرادادهٔ فایل یا ارجاع‌های رسانه برای ابزارهایی که می‌توانند آن‌ها را پردازش کنند در دسترس می‌مانند.

### ارث‌بری پیوست از ریشهٔ رشته

وقتی پیامی در یک رشته می‌رسد (دارای والد `thread_ts` است):

- اگر خود پاسخ رسانهٔ مستقیم نداشته باشد و پیام ریشهٔ شامل‌شده فایل داشته باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان زمینهٔ شروع‌کنندهٔ رشته آماده‌سازی کند.
- پیوست‌های مستقیم پاسخ بر پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و متن ندارد، با یک جای‌نگهدار پیوست نمایش داده می‌شود تا مسیر جایگزین همچنان بتواند فایل‌های آن را شامل کند.

### پردازش چندپیوستی

وقتی یک پیام Slack شامل چند پیوست فایل باشد:

- هر پیوست به‌طور مستقل از خط لولهٔ رسانه پردازش می‌شود.
- ارجاع‌های رسانهٔ دانلودشده در زمینهٔ پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در payload رویداد پیروی می‌کند.
- شکست در دانلود یک پیوست، پیوست‌های دیگر را مسدود نمی‌کند.

### محدودیت‌های اندازه، دانلود و مدل

- **سقف اندازه**: پیش‌فرض ۲۰ MB برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل پیکربندی است.
- **شکست‌های دانلود**: فایل‌هایی که Slack نمی‌تواند ارائه کند، URLهای منقضی‌شده، فایل‌های غیرقابل‌دسترسی، فایل‌های بیش‌ازحد بزرگ، و پاسخ‌های HTML ورود/احراز هویت Slack به‌جای گزارش شدن به‌عنوان قالب‌های پشتیبانی‌نشده نادیده گرفته می‌شوند.
- **مدل بینایی**: تحلیل تصویر از مدل پاسخ فعال استفاده می‌کند، اگر از بینایی پشتیبانی کند؛ در غیر این صورت از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel` استفاده می‌شود.

### محدودیت‌های شناخته‌شده

| سناریو                               | رفتار فعلی                                                             | راهکار جایگزین                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL منقضی‌شدهٔ فایل Slack                 | فایل نادیده گرفته می‌شود؛ خطایی نشان داده نمی‌شود                                                 | فایل را دوباره در Slack بارگذاری کنید                                                |
| مدل بینایی پیکربندی نشده است            | پیوست‌های تصویری به‌عنوان ارجاع‌های رسانه ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند | `agents.defaults.imageModel` را پیکربندی کنید یا از مدل پاسخ دارای قابلیت بینایی استفاده کنید |
| تصاویر بسیار بزرگ (بیش از ۲۰ MB به‌طور پیش‌فرض) | طبق سقف اندازه نادیده گرفته می‌شوند                                                         | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید                       |
| پیوست‌های بازفرستاده/اشتراک‌گذاری‌شده           | متن و رسانهٔ تصویر/فایل میزبانی‌شده در Slack به‌صورت بهترین تلاش پردازش می‌شوند                       | مستقیماً در رشتهٔ OpenClaw دوباره به اشتراک بگذارید                                   |
| پیوست‌های PDF                        | به‌عنوان زمینهٔ فایل/رسانه ذخیره می‌شوند، نه اینکه به‌طور خودکار از مسیر بینایی تصویر عبور داده شوند  | برای فرادادهٔ فایل از `download-file` یا برای تحلیل PDF از ابزار `pdf` استفاده کنید   |

### مستندات مرتبط

- [خط لولهٔ درک رسانه](/fa/nodes/media-understanding)
- [ابزار PDF](/fa/tools/pdf)
- اپیک: [#51349](https://github.com/openclaw/openclaw/issues/51349) — فعال‌سازی بینایی برای پیوست‌های Slack
- آزمون‌های رگرسیون: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- راستی‌آزمایی زنده: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Slack را با Gateway جفت کنید.
  </Card>
  <Card title="Groups" icon="users" href="/fa/channels/groups">
    رفتار کانال و پیام مستقیم گروهی.
  </Card>
  <Card title="Channel routing" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="Security" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fa/gateway/configuration">
    چیدمان پیکربندی و تقدم.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    فهرست فرمان‌ها و رفتار.
  </Card>
</CardGroup>
