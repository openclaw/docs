---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی حالت سوکت/HTTP در Slack
summary: راه‌اندازی و رفتار زمان اجرای Slack (حالت سوکت + URLهای درخواست HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-02T11:36:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60e06b138e1579156ccd07bb6db1a25009be970d072ba500b61810c5b78fd01d
    source_path: channels/slack.md
    workflow: 16
---

آماده تولید برای پیام‌های مستقیم و کانال‌ها از طریق یکپارچه‌سازی‌های اپ Slack. حالت پیش‌فرض Socket Mode است؛ URLهای درخواست HTTP نیز پشتیبانی می‌شوند.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Slack به‌صورت پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی و فهرست فرمان‌ها.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و راهنماهای عملیاتی تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        در تنظیمات اپ Slack، دکمه **[Create New App](https://api.slack.com/apps/new)** را فشار دهید:

        - گزینه **from a manifest** را انتخاب کنید و یک workspace برای اپ خود برگزینید
        - [نمونه manifest](#manifest-and-scope-checklist) زیر را جای‌گذاری کنید و برای ایجاد ادامه دهید
        - یک **App-Level Token** (`xapp-...`) با `connections:write` تولید کنید
        - اپ را نصب کنید و **Bot Token** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

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
        در تنظیمات اپ Slack، دکمه **[Create New App](https://api.slack.com/apps/new)** را فشار دهید:

        - گزینه **from a manifest** را انتخاب کنید و یک workspace برای اپ خود برگزینید
        - [نمونه manifest](#manifest-and-scope-checklist) را جای‌گذاری کنید و URLها را پیش از ایجاد به‌روزرسانی کنید
        - **Signing Secret** را برای راستی‌آزمایی درخواست ذخیره کنید
        - اپ را نصب کنید و **Bot Token** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

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
        برای HTTP چندحسابی از مسیرهای webhook یکتا استفاده کنید

        به هر حساب یک `webhookPath` متمایز (پیش‌فرض `/slack/events`) بدهید تا ثبت‌ها با هم تداخل نداشته باشند.
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

OpenClaw به‌صورت پیش‌فرض timeout پونگ کلاینت Slack SDK را برای Socket Mode روی ۱۵ ثانیه تنظیم می‌کند. فقط زمانی تنظیمات انتقال را بازنویسی کنید که به تنظیمات خاص workspace یا میزبان نیاز دارید:

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

این را فقط برای workspaceهای Socket Mode استفاده کنید که timeoutهای پونگ websocket یا server-ping مربوط به Slack را ثبت می‌کنند، یا روی میزبان‌هایی اجرا می‌شوند که کمبود زمان event loop شناخته‌شده دارند. `clientPingTimeout` مدت انتظار پونگ پس از ارسال ping کلاینت توسط SDK است؛ `serverPingTimeout` مدت انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای اپ همچنان وضعیت برنامه هستند، نه سیگنال‌های زنده‌بودن انتقال.

## چک‌لیست manifest و scope

manifest پایه اپ Slack برای Socket Mode و URLهای درخواست HTTP یکسان است. فقط بلوک `settings` (و `url` فرمان slash) متفاوت است.

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

برای **حالت URLهای درخواست HTTP**، `settings` را با گونه HTTP جایگزین کنید و به هر فرمان slash مقدار `url` اضافه کنید. URL عمومی لازم است:

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
        /* same as Socket Mode */
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

قابلیت‌های متفاوتی را ارائه کنید که پیش‌فرض‌های بالا را گسترش می‌دهند.

manifest پیش‌فرض، تب **Home** در Slack App Home را فعال می‌کند و در `app_home_opened` مشترک می‌شود. وقتی عضوی از workspace تب Home را باز می‌کند، OpenClaw با `views.publish` یک نمای Home پیش‌فرض امن منتشر می‌کند؛ هیچ payload مکالمه یا پیکربندی خصوصی‌ای در آن گنجانده نمی‌شود. تب **Messages** برای پیام‌های مستقیم Slack فعال می‌ماند.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    می‌توان از چندین [فرمان slash بومی](#commands-and-slash-behavior) به‌جای یک فرمان پیکربندی‌شده واحد، با جزئیات بیشتر استفاده کرد:

    - از `/agentstatus` به‌جای `/status` استفاده کنید، چون فرمان `/status` رزرو شده است.
    - در هر لحظه نمی‌توان بیش از ۲۵ فرمان slash را در دسترس قرار داد.

    بخش `features.slash_commands` موجود خود را با زیرمجموعه‌ای از [فرمان‌های موجود](/fa/tools/slash-commands#command-list) جایگزین کنید:

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
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
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        از همان فهرست `slash_commands` در Socket Mode بالا استفاده کنید و به هر ورودی `"url": "https://gateway-host.example.com/slack/events"` اضافه کنید. مثال:

```json
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
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض اپ Slack از هویت agent فعال (نام کاربری و آیکن سفارشی) استفاده کنند، scope ربات `chat:write.customize` را اضافه کنید.

    اگر از آیکن emoji استفاده می‌کنید، Slack انتظار نحو `:emoji_name:` را دارد.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    اگر `channels.slack.userToken` را پیکربندی کنید، scopeهای خواندن معمول عبارت‌اند از:

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

- `botToken` + `appToken` برای Socket Mode لازم هستند.
- حالت HTTP به `botToken` + `signingSecret` نیاز دارد.
- `botToken`،‏ `appToken`،‏ `signingSecret` و `userToken` رشته‌های متن ساده
  یا اشیای SecretRef را می‌پذیرند.
- توکن‌های پیکربندی، جایگزین مقدار fallback محیط می‌شوند.
- مقدار fallback محیطی `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` فقط روی حساب پیش‌فرض اعمال می‌شود.
- `userToken` (`xoxp-...`) فقط از پیکربندی می‌آید (بدون fallback محیطی) و به‌طور پیش‌فرض رفتار فقط‌خواندنی دارد (`userTokenReadOnly: true`).

رفتار snapshot وضعیت:

- بازرسی حساب Slack فیلدهای `*Source` و `*Status` را برای هر credential
  ردیابی می‌کند (`botToken`،‏ `appToken`،‏ `signingSecret`،‏ `userToken`).
- وضعیت `available`،‏ `configured_unavailable` یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا منبع secret غیرخطی دیگری پیکربندی شده، اما مسیر فرمان/runtime فعلی
  نتوانسته مقدار واقعی را resolve کند.
- در حالت HTTP،‏ `signingSecretStatus` شامل می‌شود؛ در Socket Mode،
  جفت لازم `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای actionها/خواندن‌های directory، وقتی user token پیکربندی شده باشد می‌تواند ترجیح داده شود. برای نوشتن‌ها، bot token همچنان ترجیح داده می‌شود؛ نوشتن‌های user-token فقط وقتی مجازند که `userTokenReadOnly: false` باشد و bot token در دسترس نباشد.
</Tip>

## Actionها و gateها

Actionهای Slack با `channels.slack.actions.*` کنترل می‌شوند.

گروه‌های action موجود در ابزارهای فعلی Slack:

| گروه       | پیش‌فرض |
| ---------- | ------- |
| messages   | فعال |
| reactions  | فعال |
| pins       | فعال |
| memberInfo | فعال |
| emojiList  | فعال |

Actionهای پیام Slack فعلی شامل `send`،‏ `upload-file`،‏ `download-file`،‏ `read`،‏ `edit`،‏ `delete`،‏ `pin`،‏ `unpin`،‏ `list-pins`،‏ `member-info` و `emoji-list` هستند. `download-file` شناسه‌های فایل Slack را که در placeholderهای فایل ورودی نشان داده می‌شوند می‌پذیرد و برای تصویرها preview تصویر یا برای انواع دیگر فایل metadata فایل محلی برمی‌گرداند.

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
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (DMهای گروهی به‌طور پیش‌فرض false)
    - `dm.groupChannels` (allowlist اختیاری MPIM)

    تقدم چندحسابی:

    - `channels.slack.accounts.default.allowFrom` فقط روی حساب `default` اعمال می‌شود.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان تنظیم نشده باشد، `channels.slack.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.slack.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.slack.dm.policy` و `channels.slack.dm.allowFrom` legacy همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    Pairing در DMها از `openclaw pairing approve slack <code>` استفاده می‌کند.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` نحوه مدیریت کانال را کنترل می‌کند:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist کانال زیر `channels.slack.channels` قرار دارد و **باید از شناسه‌های پایدار کانال Slack** (برای مثال `C12345678`) به‌عنوان کلیدهای پیکربندی استفاده کند.

    نکته runtime: اگر `channels.slack` کاملا وجود نداشته باشد (راه‌اندازی فقط با محیط)، runtime به `groupPolicy="allowlist"` برمی‌گردد و یک هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    Resolve نام/شناسه:

    - ورودی‌های allowlist کانال و ورودی‌های allowlist مربوط به DM هنگام startup، وقتی دسترسی token اجازه دهد، resolve می‌شوند
    - ورودی‌های نام کانال resolveنشده همان‌طور که پیکربندی شده‌اند نگه داشته می‌شوند، اما به‌طور پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند
    - مجوزدهی ورودی و مسیریابی کانال به‌طور پیش‌فرض اولویت را به ID می‌دهند؛ تطبیق مستقیم username/slug به `channels.slack.dangerouslyAllowNameMatching: true` نیاز دارد

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) زیر `groupPolicy: "allowlist"` مطابقت نمی‌کنند. جست‌وجوی کانال به‌طور پیش‌فرض ID-first است، بنابراین یک کلید مبتنی بر نام هرگز با موفقیت مسیریابی نمی‌شود و همه پیام‌های آن کانال بی‌صدا مسدود می‌شوند. این با `groupPolicy: "open"` فرق دارد؛ در آن حالت کلید کانال برای مسیریابی لازم نیست و یک کلید مبتنی بر نام به نظر کار می‌کند.

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

    نادرست (زیر `groupPolicy: "allowlist"` بی‌صدا مسدود می‌شود):

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
    پیام‌های کانال به‌طور پیش‌فرض با mention gate می‌شوند.

    منابع mention:

    - mention صریح app (`<@botId>`)
    - mention گروه کاربری Slack (`<!subteam^S...>`) وقتی bot user عضو آن گروه کاربری باشد؛ به `usergroups:read` نیاز دارد
    - الگوهای regex برای mention (`agents.list[].groupChat.mentionPatterns`، fallback `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به thread ربات (وقتی `thread.requireExplicitMention` برابر `true` باشد غیرفعال می‌شود)

    کنترل‌های هر کانال (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق resolve هنگام startup یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - قالب کلید `toolsBySender`:‏ `id:`،‏ `e164:`،‏ `username:`،‏ `name:` یا wildcard `"*"`
      (کلیدهای legacy بدون پیشوند همچنان فقط به `id:` map می‌شوند)

    `allowBots` برای کانال‌ها و کانال‌های خصوصی محافظه‌کارانه است: پیام‌های room که توسط ربات نوشته شده‌اند فقط وقتی پذیرفته می‌شوند که ربات فرستنده صریحا در allowlist `users` همان room فهرست شده باشد، یا وقتی حداقل یک شناسه مالک صریح Slack از `channels.slack.allowFrom` در حال حاضر عضو room باشد. wildcardها و ورودی‌های مالک با display-name حضور مالک را تأمین نمی‌کنند. حضور مالک از `conversations.members` در Slack استفاده می‌کند؛ مطمئن شوید app برای نوع room مربوطه scope خواندن متناظر را دارد (`channels:read` برای کانال‌های عمومی، `groups:read` برای کانال‌های خصوصی). اگر جست‌وجوی member شکست بخورد، OpenClaw پیام room نوشته‌شده توسط ربات را drop می‌کند.

  </Tab>
</Tabs>

## Threading، sessionها و tagهای پاسخ

- DMها به‌صورت `direct` مسیریابی می‌شوند؛ کانال‌ها به‌صورت `channel`؛ MPIMها به‌صورت `group`.
- bindingهای route در Slack شناسه‌های خام peer به‌علاوه فرم‌های هدف Slack مانند `channel:C12345678`،‏ `user:U12345678` و `<@U12345678>` را می‌پذیرند.
- با `session.dmScope=main` پیش‌فرض، DMهای Slack به session اصلی agent collapse می‌شوند.
- Sessionهای کانال: `agent:<agentId>:slack:channel:<channelId>`.
- پاسخ‌های thread می‌توانند در صورت کاربرد suffixهای session مربوط به thread بسازند (`:thread:<threadTs>`).
- پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` کنترل می‌کند هنگام شروع یک session جدید thread چند پیام موجود thread fetch شود (پیش‌فرض `20`؛ برای غیرفعال‌سازی `0` تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، mentionهای ضمنی thread را سرکوب می‌کند تا ربات فقط به mentionهای صریح `@bot` داخل threadها پاسخ دهد، حتی وقتی ربات قبلا در thread شرکت کرده باشد. بدون این، پاسخ‌ها در threadی که ربات در آن شرکت کرده، gate مربوط به `requireMention` را دور می‌زنند.

کنترل‌های threading پاسخ:

- `channels.slack.replyToMode`:‏ `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: برای هر `direct|group|channel`
- fallback legacy برای چت‌های مستقیم: `channels.slack.dm.replyToMode`

tagهای دستی پاسخ پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` **همه** threading پاسخ در Slack را غیرفعال می‌کند، از جمله tagهای صریح `[[reply_to_*]]`. این با Telegram فرق دارد، که در آن tagهای صریح همچنان در حالت `"off"` رعایت می‌شوند. Threadهای Slack پیام‌ها را از کانال پنهان می‌کنند، در حالی که پاسخ‌های Telegram به‌صورت inline قابل مشاهده می‌مانند.
</Note>

## واکنش‌های ack

`ackReaction` در زمانی که OpenClaw در حال پردازش یک پیام ورودی است، یک emoji تأیید می‌فرستد.

ترتیب resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji هویت agent (`agents.list[].identity.emoji`، وگرنه "👀")

نکته‌ها:

- Slack انتظار shortcode دارد (برای مثال `"eyes"`).
- برای غیرفعال‌سازی واکنش برای حساب Slack یا به‌صورت global از `""` استفاده کنید.

## Streaming متن

`channels.slack.streaming` رفتار preview زنده را کنترل می‌کند:

- `off`: streaming preview زنده را غیرفعال می‌کند.
- `partial` (پیش‌فرض): متن preview را با آخرین خروجی partial جایگزین می‌کند.
- `block`: به‌روزرسانی‌های chunked preview را append می‌کند.
- `progress`: هنگام generate شدن، متن وضعیت progress را نشان می‌دهد، سپس متن نهایی را می‌فرستد.
- `streaming.preview.toolProgress`: وقتی draft preview فعال است، به‌روزرسانی‌های tool/progress را به همان پیام preview ویرایش‌شده route می‌کند (پیش‌فرض: `true`). برای نگه داشتن پیام‌های tool/progress جداگانه، `false` تنظیم کنید.

`channels.slack.streaming.nativeTransport`، streaming متن native در Slack را وقتی `channels.slack.streaming.mode` برابر `partial` است کنترل می‌کند (پیش‌فرض: `true`).

- برای اینکه streaming متن native و وضعیت thread دستیار Slack ظاهر شود، باید یک thread پاسخ در دسترس باشد. انتخاب thread همچنان از `replyToMode` پیروی می‌کند.
- ریشه‌های کانال و group-chat همچنان وقتی native streaming در دسترس نباشد می‌توانند از draft preview معمولی استفاده کنند.
- DMهای سطح بالای Slack به‌طور پیش‌فرض خارج از thread می‌مانند، بنابراین preview به سبک thread را نشان نمی‌دهند؛ اگر می‌خواهید آنجا progress قابل مشاهده داشته باشید، از پاسخ‌های thread یا `typingReaction` استفاده کنید.
- payloadهای رسانه‌ای و غیرمتنی به تحویل معمولی fallback می‌کنند.
- finalهای media/error ویرایش‌های preview در انتظار را cancel می‌کنند؛ finalهای text/block واجد شرایط فقط وقتی flush می‌شوند که بتوانند preview را درجا ویرایش کنند.
- اگر streaming در میانه پاسخ شکست بخورد، OpenClaw برای payloadهای باقی‌مانده به تحویل معمولی fallback می‌کند.

به‌جای streaming متن native در Slack از draft preview استفاده کنید:

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

کلیدهای legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) به‌صورت خودکار به `channels.slack.streaming.mode` مهاجرت داده می‌شود.
- مقدار boolean `channels.slack.streaming` به‌صورت خودکار به `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` مهاجرت داده می‌شود.
- `channels.slack.nativeStreaming` legacy به‌صورت خودکار به `channels.slack.streaming.nativeTransport` مهاجرت داده می‌شود.

## Fallback واکنش typing

`typingReaction` تا وقتی OpenClaw در حال پردازش پاسخ است یک واکنش موقت به پیام ورودی Slack اضافه می‌کند، سپس وقتی run تمام شد آن را حذف می‌کند. این بیرون از پاسخ‌های thread که از نشانگر وضعیت پیش‌فرض "is typing..." استفاده می‌کنند، بیشترین کاربرد را دارد.

ترتیب resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکته‌ها:

- Slack انتظار shortcode دارد (برای مثال `"hourglass_flowing_sand"`).
- واکنش best-effort است و پس از کامل شدن مسیر پاسخ یا شکست، cleanup به‌طور خودکار تلاش می‌شود.

## رسانه، chunking و تحویل

<AccordionGroup>
  <Accordion title="پیوست‌های ورودی">
    پیوست‌های فایل Slack از URLهای خصوصی میزبانی‌شده در Slack دانلود می‌شوند (جریان درخواست احرازهویت‌شده با توکن) و وقتی دریافت موفق باشد و محدودیت‌های اندازه اجازه دهند، در ذخیره‌گاه رسانه نوشته می‌شوند. جایگزین‌های فایل شامل `fileId` مربوط به Slack هستند تا عامل‌ها بتوانند فایل اصلی را با `download-file` دریافت کنند.

    دانلودها از زمان‌پایان‌های محدود برای بیکاری و کل زمان استفاده می‌کنند. اگر دریافت فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به جایگزین فایل برمی‌گردد.

    سقف اندازه ورودی در زمان اجرا به‌صورت پیش‌فرض `20MB` است، مگر اینکه با `channels.slack.mediaMaxMb` بازنویسی شود.

  </Accordion>

  <Accordion title="متن و فایل‌های خروجی">
    - قطعه‌های متن از `channels.slack.textChunkLimit` استفاده می‌کنند (پیش‌فرض 4000)
    - `channels.slack.chunkMode="newline"` تقسیم‌بندی با اولویت پاراگراف را فعال می‌کند
    - ارسال فایل‌ها از APIهای بارگذاری Slack استفاده می‌کند و می‌تواند شامل پاسخ‌های رشته‌ای (`thread_ts`) باشد
    - سقف رسانه خروجی، وقتی پیکربندی شده باشد، از `channels.slack.mediaMaxMb` پیروی می‌کند؛ در غیر این صورت، ارسال‌های کانال از پیش‌فرض‌های نوع MIME در خط لوله رسانه استفاده می‌کنند

  </Accordion>

  <Accordion title="مقصدهای تحویل">
    مقصدهای صریح ترجیحی:

    - `user:<id>` برای پیام‌های مستقیم
    - `channel:<id>` برای کانال‌ها

    پیام‌های مستقیم Slack که فقط متن/بلوک دارند می‌توانند مستقیماً به شناسه‌های کاربر ارسال شوند؛ بارگذاری فایل‌ها و ارسال‌های رشته‌ای ابتدا پیام مستقیم را از طریق APIهای مکالمه Slack باز می‌کنند، چون این مسیرها به یک شناسه مکالمه مشخص نیاز دارند.

  </Accordion>
</AccordionGroup>

## فرمان‌ها و رفتار slash

فرمان‌های slash در Slack یا به‌صورت یک فرمان پیکربندی‌شده واحد یا چند فرمان بومی ظاهر می‌شوند. برای تغییر پیش‌فرض‌های فرمان، `channels.slack.slashCommand` را پیکربندی کنید:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

فرمان‌های بومی به [تنظیمات مانیفست اضافی](#additional-manifest-settings) در برنامه Slack شما نیاز دارند و به‌جای آن با `channels.slack.commands.native: true` یا `commands.native: true` در پیکربندی‌های سراسری فعال می‌شوند.

- حالت خودکار فرمان بومی برای Slack **خاموش** است، بنابراین `commands.native: "auto"` فرمان‌های بومی Slack را فعال نمی‌کند.

```txt
/help
```

منوهای آرگومان بومی از یک راهبرد نمایش تطبیقی استفاده می‌کنند که پیش از ارسال مقدار گزینه انتخاب‌شده، یک پنجره تأیید نشان می‌دهد:

- تا 5 گزینه: بلوک‌های دکمه
- 6 تا 100 گزینه: منوی انتخاب ایستا
- بیش از 100 گزینه: انتخاب خارجی با فیلتر کردن ناهمگام گزینه‌ها، وقتی کنترل‌کننده‌های گزینه‌های تعامل‌پذیری در دسترس باشند
- محدودیت‌های Slack که از آن‌ها فراتر رفته شده است: مقدارهای گزینه کدگذاری‌شده به دکمه‌ها برمی‌گردند

```txt
/think
```

نشست‌های slash از کلیدهای جداشده‌ای مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای فرمان‌ها را با استفاده از `CommandTargetSessionKey` به نشست مکالمه مقصد مسیریابی می‌کنند.

## پاسخ‌های تعاملی

Slack می‌تواند کنترل‌های پاسخ تعاملی نوشته‌شده توسط عامل را نمایش دهد، اما این قابلیت به‌صورت پیش‌فرض غیرفعال است.

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

وقتی فعال باشد، عامل‌ها می‌توانند دستورالعمل‌های پاسخ فقط مخصوص Slack منتشر کنند:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

این دستورالعمل‌ها به Slack Block Kit کامپایل می‌شوند و کلیک‌ها یا انتخاب‌ها را از طریق مسیر رویداد تعامل Slack موجود برمی‌گردانند.

نکته‌ها:

- این یک رابط کاربری مخصوص Slack است. کانال‌های دیگر دستورالعمل‌های Slack Block Kit را به سامانه‌های دکمه‌ای خودشان ترجمه نمی‌کنند.
- مقدارهای بازگشتی تعاملی، توکن‌های مبهم تولیدشده توسط OpenClaw هستند، نه مقدارهای خام نوشته‌شده توسط عامل.
- اگر بلوک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit فراتر بروند، OpenClaw به‌جای ارسال یک بار داده بلوک نامعتبر، به پاسخ متنی اصلی برمی‌گردد.

## تأییدهای exec در Slack

Slack می‌تواند به‌جای برگشتن به رابط وب یا ترمینال، با دکمه‌ها و تعامل‌های تعاملی به‌عنوان یک سرویس‌گیرنده تأیید بومی عمل کند.

- تأییدهای exec از `channels.slack.execApprovals.*` برای مسیریابی بومی پیام مستقیم/کانال استفاده می‌کنند.
- تأییدهای Plugin همچنان می‌توانند از طریق همان سطح دکمه بومی Slack حل شوند، وقتی درخواست از قبل در Slack قرار گرفته باشد و نوع شناسه تأیید `plugin:` باشد.
- مجوز تأییدکننده همچنان اعمال می‌شود: فقط کاربرانی که به‌عنوان تأییدکننده شناسایی شده‌اند می‌توانند از طریق Slack درخواست‌ها را تأیید یا رد کنند.

این از همان سطح دکمه تأیید مشترک با کانال‌های دیگر استفاده می‌کند. وقتی `interactivity` در تنظیمات برنامه Slack شما فعال باشد، اعلان‌های تأیید مستقیماً در مکالمه به‌صورت دکمه‌های Block Kit نمایش داده می‌شوند.
وقتی آن دکمه‌ها وجود دارند، تجربه کاربری اصلی تأیید هستند؛ OpenClaw
باید فقط زمانی یک فرمان دستی `/approve` اضافه کند که نتیجه ابزار بگوید تأییدهای
چت در دسترس نیستند یا تأیید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ وقتی ممکن باشد به `commands.ownerAllowFrom` برمی‌گردد)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`, `sessionFilter`

Slack وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک
تأییدکننده حل شود، تأییدهای exec بومی را به‌طور خودکار فعال می‌کند. برای غیرفعال کردن صریح Slack به‌عنوان سرویس‌گیرنده تأیید بومی، `enabled: false` را تنظیم کنید.
برای اجبار فعال‌سازی تأییدهای بومی وقتی تأییدکننده‌ها حل می‌شوند، `enabled: true` را تنظیم کنید.

رفتار پیش‌فرض بدون پیکربندی صریح تأیید exec در Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

پیکربندی صریح بومی Slack فقط زمانی لازم است که بخواهید تأییدکننده‌ها را بازنویسی کنید، فیلتر اضافه کنید، یا
تحویل به چت مبدأ را فعال کنید:

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

بازارسال مشترک `approvals.exec` جدا است. فقط زمانی از آن استفاده کنید که اعلان‌های تأیید exec باید همچنین
به چت‌های دیگر یا مقصدهای صریح خارج از باند مسیریابی شوند. بازارسال مشترک `approvals.plugin` نیز
جدا است؛ دکمه‌های بومی Slack همچنان می‌توانند تأییدهای plugin را حل کنند، وقتی آن درخواست‌ها از قبل
در Slack قرار گرفته باشند.

`/approve` در همان چت نیز در کانال‌ها و پیام‌های مستقیم Slack که از قبل از فرمان‌ها پشتیبانی می‌کنند کار می‌کند. برای مدل کامل بازارسال تأیید، [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

## رویدادها و رفتار عملیاتی

- ویرایش‌ها/حذف‌های پیام به رویدادهای سامانه نگاشت می‌شوند.
- پخش‌های رشته‌ای (پاسخ‌های رشته‌ای «همچنین به کانال ارسال شود») به‌عنوان پیام‌های عادی کاربر پردازش می‌شوند.
- رویدادهای افزودن/حذف واکنش به رویدادهای سامانه نگاشت می‌شوند.
- رویدادهای پیوستن/ترک عضو، ایجاد/تغییرنام کانال، و افزودن/حذف سنجاق به رویدادهای سامانه نگاشت می‌شوند.
- وقتی `configWrites` فعال باشد، `channel_id_changed` می‌تواند کلیدهای پیکربندی کانال را مهاجرت دهد.
- فراداده موضوع/هدف کانال به‌عنوان زمینه نامطمئن در نظر گرفته می‌شود و می‌تواند به زمینه مسیریابی تزریق شود.
- آغازگر رشته و بذرگذاری زمینه تاریخچه اولیه رشته، وقتی قابل اعمال باشد، با فهرست‌های مجاز فرستنده پیکربندی‌شده فیلتر می‌شوند.
- کنش‌های بلوک و تعامل‌های modal رویدادهای سامانه ساختاریافته `Slack interaction: ...` را با فیلدهای غنی بار داده منتشر می‌کنند:
  - کنش‌های بلوک: مقدارهای انتخاب‌شده، برچسب‌ها، مقدارهای انتخابگر، و فراداده `workflow_*`
  - رویدادهای modal `view_submission` و `view_closed` با فراداده کانال مسیریابی‌شده و ورودی‌های فرم

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="فیلدهای مهم Slack">

- حالت/احراز هویت: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- دسترسی پیام مستقیم: `dm.enabled`, `dmPolicy`, `allowFrom` (قدیمی: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- تغییر وضعیت سازگاری: `dangerouslyAllowNameMatching` (اضطراری؛ مگر در صورت نیاز خاموش نگه دارید)
- دسترسی کانال: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- رشته‌بندی/تاریخچه: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- عملیات/قابلیت‌ها: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="در کانال‌ها پاسخی دریافت نمی‌شود">
    به‌ترتیب بررسی کنید:

    - `groupPolicy`
    - فهرست مجاز کانال (`channels.slack.channels`) — **کلیدها باید شناسه کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام زیر `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، چون مسیریابی کانال به‌صورت پیش‌فرض ابتدا بر پایه شناسه است. برای یافتن شناسه: روی کانال در Slack راست‌کلیک کنید → **Copy link** — مقدار `C...` در انتهای URL شناسه کانال است.
    - `requireMention`
    - فهرست مجاز `users` برای هر کانال

    فرمان‌های مفید:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="پیام‌های مستقیم نادیده گرفته می‌شوند">
    بررسی کنید:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (یا `channels.slack.dm.policy` قدیمی)
    - تأییدهای جفت‌سازی / ورودی‌های فهرست مجاز
    - رویدادهای پیام مستقیم Slack Assistant: گزارش‌های مفصل با ذکر `drop message_changed`
      معمولاً یعنی Slack یک رویداد رشته Assistant ویرایش‌شده را بدون
      فرستنده انسانی قابل بازیابی در فراداده پیام ارسال کرده است

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="حالت Socket وصل نمی‌شود">
    توکن‌های bot + app و فعال بودن Socket Mode را در تنظیمات برنامه Slack اعتبارسنجی کنید.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان دهد، حساب Slack
    پیکربندی شده است اما زمان اجرای فعلی نتوانسته مقدار پشتیبانی‌شده با SecretRef را
    حل کند.

  </Accordion>

  <Accordion title="حالت HTTP رویدادها را دریافت نمی‌کند">
    اعتبارسنجی کنید:

    - راز امضا
    - مسیر Webhook
    - URLهای درخواست Slack (رویدادها + تعامل‌پذیری + فرمان‌های slash)
    - `webhookPath` یکتا برای هر حساب HTTP

    اگر `signingSecretStatus: "configured_unavailable"` در snapshotهای حساب
    ظاهر شود، حساب HTTP پیکربندی شده است اما زمان اجرای فعلی نتوانسته
    راز امضای پشتیبانی‌شده با SecretRef را حل کند.

  </Accordion>

  <Accordion title="فرمان‌های بومی/slash اجرا نمی‌شوند">
    بررسی کنید آیا قصد شما این بوده است:

    - حالت فرمان بومی (`channels.slack.commands.native: true`) با فرمان‌های slash مطابق که در Slack ثبت شده‌اند
    - یا حالت فرمان slash واحد (`channels.slack.slashCommand.enabled: true`)

    همچنین `commands.useAccessGroups` و فهرست‌های مجاز کانال/کاربر را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مرجع بینایی پیوست

Slack وقتی دانلود فایل‌های Slack موفق باشد و محدودیت‌های اندازه اجازه دهند، می‌تواند رسانه دانلودشده را به نوبت عامل پیوست کند. فایل‌های تصویری می‌توانند از مسیر درک رسانه عبور داده شوند یا مستقیماً به یک مدل پاسخ‌گوی دارای قابلیت بینایی داده شوند؛ فایل‌های دیگر به‌عنوان زمینه فایل قابل دانلود نگه داشته می‌شوند، نه اینکه به‌عنوان ورودی تصویر در نظر گرفته شوند.

### انواع رسانه پشتیبانی‌شده

| نوع رسانه | منبع | رفتار فعلی | یادداشت‌ها |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| تصاویر JPEG / PNG / GIF / WebP | URL فایل Slack | دانلود می‌شود و برای پردازش سازگار با بینایی به نوبت پیوست می‌شود | سقف هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض 20 MB) |
| فایل‌های PDF | URL فایل Slack | دانلود می‌شود و به‌عنوان بافت فایل برای ابزارهایی مانند `download-file` یا `pdf` در دسترس قرار می‌گیرد | ورودی Slack به‌طور خودکار PDFها را به ورودی بینایی تصویری تبدیل نمی‌کند |
| فایل‌های دیگر | URL فایل Slack | در صورت امکان دانلود می‌شود و به‌عنوان بافت فایل در دسترس قرار می‌گیرد | فایل‌های دودویی به‌عنوان ورودی تصویر در نظر گرفته نمی‌شوند |
| پاسخ‌های رشته | فایل‌های آغازگر رشته | وقتی پاسخ رسانه مستقیم ندارد، فایل‌های پیام ریشه می‌توانند به‌عنوان بافت بارگذاری شوند | آغازگرهای فقط‌فایل از جای‌نگهدار پیوست استفاده می‌کنند |
| پیام‌های چندتصویری | چندین فایل Slack | هر فایل به‌صورت مستقل ارزیابی می‌شود | پردازش Slack به هشت فایل برای هر پیام محدود است |

### خط لوله ورودی

وقتی یک پیام Slack با پیوست‌های فایل می‌رسد:

1. OpenClaw فایل را از URL خصوصی Slack با استفاده از توکن بات (`xoxb-...`) دانلود می‌کند.
2. در صورت موفقیت، فایل در مخزن رسانه نوشته می‌شود.
3. مسیرهای رسانه دانلودشده و نوع‌های محتوا به بافت ورودی اضافه می‌شوند.
4. مسیرهای مدل/ابزار سازگار با تصویر می‌توانند از پیوست‌های تصویر موجود در آن بافت استفاده کنند.
5. فایل‌های غیرتصویری برای ابزارهایی که می‌توانند آن‌ها را پردازش کنند، همچنان به‌عنوان فراداده فایل یا ارجاع رسانه در دسترس می‌مانند.

### ارث‌بری پیوست ریشه رشته

وقتی پیامی در یک رشته می‌رسد (والد `thread_ts` دارد):

- اگر خود پاسخ رسانه مستقیم نداشته باشد و پیام ریشه شامل فایل باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان بافت آغازگر رشته بارگذاری کند.
- پیوست‌های مستقیم پاسخ بر پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و متن ندارد، با یک جای‌نگهدار پیوست نمایش داده می‌شود تا مسیر جایگزین همچنان بتواند فایل‌های آن را شامل شود.

### پردازش چندپیوستی

وقتی یک پیام Slack شامل چندین پیوست فایل باشد:

- هر پیوست به‌صورت مستقل از طریق خط لوله رسانه پردازش می‌شود.
- ارجاع‌های رسانه دانلودشده در بافت پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در بار داده رویداد پیروی می‌کند.
- شکست دانلود یک پیوست، پیوست‌های دیگر را مسدود نمی‌کند.

### محدودیت‌های اندازه، دانلود، و مدل

- **سقف اندازه**: پیش‌فرض 20 MB برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل تنظیم است.
- **شکست‌های دانلود**: فایل‌هایی که Slack نمی‌تواند ارائه کند، URLهای منقضی‌شده، فایل‌های غیرقابل‌دسترسی، فایل‌های بیش از اندازه، و پاسخ‌های HTML احراز هویت/ورود Slack به‌جای گزارش شدن به‌عنوان قالب‌های پشتیبانی‌نشده، نادیده گرفته می‌شوند.
- **مدل بینایی**: تحلیل تصویر وقتی مدل پاسخ فعال از بینایی پشتیبانی کند از همان استفاده می‌کند، یا از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel`.

### محدودیت‌های شناخته‌شده

| سناریو | رفتار فعلی | راهکار جایگزین |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL منقضی‌شده فایل Slack | فایل نادیده گرفته می‌شود؛ خطایی نمایش داده نمی‌شود | فایل را دوباره در Slack بارگذاری کنید |
| مدل بینایی پیکربندی نشده است | پیوست‌های تصویر به‌عنوان ارجاع رسانه ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند | `agents.defaults.imageModel` را پیکربندی کنید یا از مدل پاسخ سازگار با بینایی استفاده کنید |
| تصاویر بسیار بزرگ (> 20 MB به‌صورت پیش‌فرض) | بر اساس سقف اندازه نادیده گرفته می‌شود | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید |
| پیوست‌های بازارسال‌شده/اشتراک‌گذاری‌شده | متن و رسانه تصویر/فایل میزبانی‌شده در Slack به‌صورت بهترین تلاش پردازش می‌شوند | مستقیماً در رشته OpenClaw دوباره به اشتراک بگذارید |
| پیوست‌های PDF | به‌عنوان بافت فایل/رسانه ذخیره می‌شود، نه اینکه به‌طور خودکار از مسیر بینایی تصویر عبور داده شود | برای فراداده فایل از `download-file` یا برای تحلیل PDF از ابزار `pdf` استفاده کنید |

### مستندات مرتبط

- [خط لوله درک رسانه](/fa/nodes/media-understanding)
- [ابزار PDF](/fa/tools/pdf)
- اپیک: [#51349](https://github.com/openclaw/openclaw/issues/51349) — فعال‌سازی بینایی پیوست Slack
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
    چیدمان پیکربندی و اولویت‌بندی.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    فهرست فرمان‌ها و رفتار.
  </Card>
</CardGroup>
