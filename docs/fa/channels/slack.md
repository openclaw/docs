---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی حالت سوکت/HTTP در Slack
summary: راه‌اندازی Slack و رفتار زمان اجرا (حالت سوکت + URLهای درخواست HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-03T11:33:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85473159dcbd395144e5c37da140164023ac117406ba517d557fcf0989042448
    source_path: channels/slack.md
    workflow: 16
---

آماده برای تولید برای DMها و کانال‌ها از طریق یکپارچه‌سازی‌های اپ Slack. حالت پیش‌فرض Socket Mode است؛ URLهای درخواست HTTP نیز پشتیبانی می‌شوند.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    DMهای Slack به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی و فهرست فرمان‌ها.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی بین‌کانالی و راهنماهای عملیاتی تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        در تنظیمات اپ Slack، دکمه **[Create New App](https://api.slack.com/apps/new)** را بزنید:

        - **from a manifest** را انتخاب کنید و یک workspace برای اپ خود برگزینید
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
        در تنظیمات اپ Slack، دکمه **[Create New App](https://api.slack.com/apps/new)** را بزنید:

        - **from a manifest** را انتخاب کنید و یک workspace برای اپ خود برگزینید
        - [نمونه manifest](#manifest-and-scope-checklist) را جای‌گذاری کنید و پیش از ایجاد، URLها را به‌روزرسانی کنید
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

OpenClaw به‌طور پیش‌فرض برای Socket Mode، مهلت pong کلاینت Slack SDK را روی ۱۵ ثانیه تنظیم می‌کند. تنظیمات انتقال را فقط زمانی بازنویسی کنید که به تنظیم دقیق ویژه workspace یا میزبان نیاز دارید:

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

این را فقط برای workspaceهای Socket Mode استفاده کنید که مهلت‌های Slack websocket pong/server-ping را ثبت می‌کنند یا روی میزبان‌هایی اجرا می‌شوند که گرسنگی event-loop شناخته‌شده دارند. `clientPingTimeout` زمان انتظار pong پس از ارسال client ping توسط SDK است؛ `serverPingTimeout` زمان انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای اپ همچنان وضعیت برنامه هستند، نه سیگنال‌های زنده‌بودن انتقال.

## چک‌لیست manifest و scope

manifest پایه اپ Slack برای Socket Mode و URLهای درخواست HTTP یکسان است. فقط بلوک `settings` (و `url` فرمان slash) تفاوت دارد.

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

### تنظیمات تکمیلی manifest

قابلیت‌های متفاوتی را ارائه می‌کند که پیش‌فرض‌های بالا را گسترش می‌دهند.

manifest پیش‌فرض، زبانه **Home** در Slack App Home را فعال می‌کند و در `app_home_opened` مشترک می‌شود. وقتی عضوی از workspace زبانه Home را باز می‌کند، OpenClaw با `views.publish` یک نمای Home پیش‌فرض امن منتشر می‌کند؛ هیچ payload گفت‌وگو یا پیکربندی خصوصی در آن گنجانده نمی‌شود. زبانه **Messages** برای DMهای Slack فعال می‌ماند.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    چند [فرمان slash بومی](#commands-and-slash-behavior) را می‌توان با ظرافت به‌جای یک فرمان پیکربندی‌شده واحد استفاده کرد:

    - از `/agentstatus` به‌جای `/status` استفاده کنید، چون فرمان `/status` رزرو شده است.
    - بیش از ۲۵ فرمان slash نمی‌تواند هم‌زمان در دسترس قرار گیرد.

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
        از همان فهرست `slash_commands` بالا مانند Socket Mode استفاده کنید و به هر ورودی `"url": "https://gateway-host.example.com/slack/events"` اضافه کنید. مثال:

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
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض اپ Slack از هویت عامل فعال (نام کاربری و آیکون سفارشی) استفاده کنند، scope ربات `chat:write.customize` را اضافه کنید.

    اگر از آیکون ایموجی استفاده می‌کنید، Slack انتظار قالب `:emoji_name:` را دارد.

  </Accordion>
  <Accordion title="دامنه‌های اختیاری توکن کاربر (عملیات خواندن)">
    اگر `channels.slack.userToken` را پیکربندی کنید، دامنه‌های معمول خواندن عبارت‌اند از:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (اگر به خواندن جست‌وجوی Slack وابسته هستید)

  </Accordion>
</AccordionGroup>

## مدل توکن

- `botToken` + `appToken` برای Socket Mode لازم هستند.
- حالت HTTP به `botToken` + `signingSecret` نیاز دارد.
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های متن ساده
  یا شیءهای SecretRef را می‌پذیرند.
- توکن‌های پیکربندی، جایگزین پیش‌فرض env می‌شوند.
- پیش‌فرض env با `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
- `userToken` (`xoxp-...`) فقط از طریق پیکربندی تنظیم می‌شود (بدون پیش‌فرض env) و رفتار پیش‌فرض آن فقط خواندنی است (`userTokenReadOnly: true`).

رفتار نمای وضعیت:

- بررسی حساب Slack فیلدهای `*Source` و `*Status` را برای هر اعتبارنامه
  ردیابی می‌کند (`botToken`، `appToken`، `signingSecret`، `userToken`).
- وضعیت `available`، `configured_unavailable` یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا منبع محرمانه غیرخطی دیگری پیکربندی شده، اما مسیر فرمان/زمان اجرای فعلی
  نتوانسته مقدار واقعی را حل کند.
- در حالت HTTP، `signingSecretStatus` گنجانده می‌شود؛ در Socket Mode،
  جفت لازم `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای کنش‌ها/خواندن‌های فهرست، وقتی توکن کاربر پیکربندی شده باشد می‌تواند ترجیح داده شود. برای نوشتن‌ها، توکن ربات همچنان ترجیح داده می‌شود؛ نوشتن با توکن کاربر فقط وقتی مجاز است که `userTokenReadOnly: false` باشد و توکن ربات در دسترس نباشد.
</Tip>

## کنش‌ها و دروازه‌ها

کنش‌های Slack با `channels.slack.actions.*` کنترل می‌شوند.

گروه‌های کنش موجود در ابزارهای فعلی Slack:

| گروه      | پیش‌فرض |
| ---------- | ------- |
| پیام‌ها   | فعال |
| واکنش‌ها  | فعال |
| پین‌ها       | فعال |
| اطلاعات عضو | فعال |
| فهرست ایموجی  | فعال |

کنش‌های فعلی پیام Slack شامل `send`، `upload-file`، `download-file`، `read`، `edit`، `delete`، `pin`، `unpin`، `list-pins`، `member-info` و `emoji-list` هستند. `download-file` شناسه‌های فایل Slack را که در جای‌نگهدارهای فایل ورودی نشان داده می‌شوند می‌پذیرد و برای تصاویر پیش‌نمایش تصویر یا برای انواع فایل دیگر فراداده فایل محلی برمی‌گرداند.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست DM">
    `channels.slack.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.slack.allowFrom` فهرست مجاز اصلی DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.slack.allowFrom` شامل `"*"` باشد)
    - `disabled`

    پرچم‌های DM:

    - `dm.enabled` (پیش‌فرض true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قدیمی)
    - `dm.groupEnabled` (DMهای گروهی به‌طور پیش‌فرض false)
    - `dm.groupChannels` (فهرست مجاز اختیاری MPIM)

    تقدم چندحسابی:

    - `channels.slack.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان تنظیم نشده باشد، `channels.slack.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.slack.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.slack.dm.policy` و `channels.slack.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    جفت‌سازی در DMها از `openclaw pairing approve slack <code>` استفاده می‌کند.

  </Tab>

  <Tab title="سیاست کانال">
    `channels.slack.groupPolicy` مدیریت کانال را کنترل می‌کند:

    - `open`
    - `allowlist`
    - `disabled`

    فهرست مجاز کانال زیر `channels.slack.channels` قرار دارد و **باید از شناسه‌های پایدار کانال Slack** (برای مثال `C12345678`) به‌عنوان کلیدهای پیکربندی استفاده کند.

    نکته زمان اجرا: اگر `channels.slack` کاملاً وجود نداشته باشد (تنظیم فقط با env)، زمان اجرا به `groupPolicy="allowlist"` برمی‌گردد و هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    حل نام/شناسه:

    - مدخل‌های فهرست مجاز کانال و مدخل‌های فهرست مجاز DM هنگام راه‌اندازی، وقتی دسترسی توکن اجازه دهد، حل می‌شوند
    - مدخل‌های حل‌نشده نام کانال همان‌طور که پیکربندی شده‌اند نگه داشته می‌شوند، اما به‌طور پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند
    - مجوزدهی ورودی و مسیریابی کانال به‌طور پیش‌فرض ابتدا بر پایه شناسه است؛ تطبیق مستقیم نام کاربری/اسلاگ به `channels.slack.dangerouslyAllowNameMatching: true` نیاز دارد

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) تحت `groupPolicy: "allowlist"` تطبیق **نمی‌شوند**. جست‌وجوی کانال به‌طور پیش‌فرض ابتدا بر پایه شناسه است، بنابراین یک کلید مبتنی بر نام هرگز با موفقیت مسیریابی نمی‌شود و همه پیام‌های آن کانال بی‌صدا مسدود می‌شوند. این با `groupPolicy: "open"` متفاوت است، که در آن کلید کانال برای مسیریابی لازم نیست و به نظر می‌رسد یک کلید مبتنی بر نام کار می‌کند.

    همیشه از شناسه کانال Slack به‌عنوان کلید استفاده کنید. برای پیدا کردن آن: روی کانال در Slack راست‌کلیک کنید → **Copy link** — شناسه (`C...`) در انتهای URL ظاهر می‌شود.

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

    نادرست (تحت `groupPolicy: "allowlist"` بی‌صدا مسدود می‌شود):

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

  <Tab title="منشن‌ها و کاربران کانال">
    پیام‌های کانال به‌طور پیش‌فرض با منشن محدود می‌شوند.

    منابع منشن:

    - منشن صریح برنامه (`<@botId>`)
    - منشن گروه کاربری Slack (`<!subteam^S...>`) وقتی کاربر ربات عضو آن گروه کاربری باشد؛ به `usergroups:read` نیاز دارد
    - الگوهای regex منشن (`agents.list[].groupChat.mentionPatterns`، پیش‌فرض جایگزین `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به نخ ربات (وقتی `thread.requireExplicitMention` برابر `true` باشد غیرفعال است)

    کنترل‌های هر کانال (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق حل هنگام راه‌اندازی یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (فهرست مجاز)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - قالب کلید `toolsBySender`: `id:`، `e164:`، `username:`، `name:` یا wildcard `"*"`
      (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند)

    `allowBots` برای کانال‌ها و کانال‌های خصوصی محافظه‌کار است: پیام‌های اتاق که توسط ربات نوشته شده‌اند فقط وقتی پذیرفته می‌شوند که ربات فرستنده صراحتاً در فهرست مجاز `users` آن اتاق آمده باشد، یا وقتی دست‌کم یک شناسه صریح مالک Slack از `channels.slack.allowFrom` در حال حاضر عضو اتاق باشد. wildcardها و مدخل‌های مالک بر پایه نام نمایشی، حضور مالک را برآورده نمی‌کنند. حضور مالک از `conversations.members` در Slack استفاده می‌کند؛ مطمئن شوید برنامه دامنه خواندن متناسب با نوع اتاق را دارد (`channels:read` برای کانال‌های عمومی، `groups:read` برای کانال‌های خصوصی). اگر جست‌وجوی عضو شکست بخورد، OpenClaw پیام اتاق نوشته‌شده توسط ربات را حذف می‌کند.

  </Tab>
</Tabs>

## نخ‌ها، نشست‌ها و برچسب‌های پاسخ

- DMها به‌صورت `direct` مسیریابی می‌شوند؛ کانال‌ها به‌صورت `channel`؛ MPIMها به‌صورت `group`.
- اتصال‌های مسیر Slack شناسه‌های خام همتا و همچنین قالب‌های مقصد Slack مانند `channel:C12345678`، `user:U12345678` و `<@U12345678>` را می‌پذیرند.
- با مقدار پیش‌فرض `session.dmScope=main`، DMهای Slack در نشست اصلی عامل ادغام می‌شوند.
- نشست‌های کانال: `agent:<agentId>:slack:channel:<channelId>`.
- پاسخ‌های نخ وقتی کاربرد داشته باشد می‌توانند پسوندهای نشست نخ (`:thread:<threadTs>`) ایجاد کنند.
- مقدار پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ مقدار پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` کنترل می‌کند هنگام شروع یک نشست نخ جدید، چند پیام موجود نخ دریافت شود (پیش‌فرض `20`؛ برای غیرفعال کردن `0` تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، منشن‌های ضمنی نخ را سرکوب می‌کند تا ربات فقط به منشن‌های صریح `@bot` داخل نخ‌ها پاسخ دهد، حتی وقتی ربات قبلاً در نخ مشارکت کرده باشد. بدون این، پاسخ‌ها در نخی که ربات در آن مشارکت داشته از دروازه `requireMention` عبور می‌کنند.

کنترل‌های نخ‌بندی پاسخ:

- `channels.slack.replyToMode`: `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: برای هر `direct|group|channel`
- پیش‌فرض جایگزین قدیمی برای گفت‌وگوهای مستقیم: `channels.slack.dm.replyToMode`

برچسب‌های دستی پاسخ پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` **همه** نخ‌بندی پاسخ در Slack، از جمله برچسب‌های صریح `[[reply_to_*]]` را غیرفعال می‌کند. این با Telegram متفاوت است، که در آن برچسب‌های صریح همچنان در حالت `"off"` رعایت می‌شوند. نخ‌های Slack پیام‌ها را از کانال پنهان می‌کنند، در حالی که پاسخ‌های Telegram در همان خط قابل مشاهده می‌مانند.
</Note>

## واکنش‌های تأیید

`ackReaction` هنگام پردازش پیام ورودی توسط OpenClaw، یک ایموجی تأیید می‌فرستد.

ترتیب حل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- پیش‌فرض جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

نکته‌ها:

- Slack انتظار shortcode دارد (برای مثال `"eyes"`).
- از `""` برای غیرفعال کردن واکنش برای حساب Slack یا به‌صورت سراسری استفاده کنید.

## پخش متنی

`channels.slack.streaming` رفتار پیش‌نمایش زنده را کنترل می‌کند:

- `off`: پخش پیش‌نمایش زنده را غیرفعال می‌کند.
- `partial` (پیش‌فرض): متن پیش‌نمایش را با آخرین خروجی جزئی جایگزین می‌کند.
- `block`: به‌روزرسانی‌های پیش‌نمایش تکه‌تکه را اضافه می‌کند.
- `progress`: هنگام تولید، متن وضعیت پیشرفت را نشان می‌دهد، سپس متن نهایی را می‌فرستد.
- `streaming.preview.toolProgress`: وقتی پیش‌نمایش پیش‌نویس فعال است، به‌روزرسانی‌های ابزار/پیشرفت را به همان پیام پیش‌نمایش ویرایش‌شده هدایت می‌کند (پیش‌فرض: `true`). برای نگه داشتن پیام‌های جداگانه ابزار/پیشرفت، `false` تنظیم کنید.

`channels.slack.streaming.nativeTransport` پخش متنی بومی Slack را وقتی `channels.slack.streaming.mode` برابر `partial` باشد کنترل می‌کند (پیش‌فرض: `true`).

- برای نمایش پخش متنی بومی و وضعیت نخ دستیار Slack، باید یک نخ پاسخ در دسترس باشد. انتخاب نخ همچنان از `replyToMode` پیروی می‌کند.
- ریشه‌های کانال، گفت‌وگوی گروهی و DM سطح‌بالا همچنان می‌توانند وقتی پخش بومی در دسترس نیست یا هیچ نخ پاسخی وجود ندارد، از پیش‌نمایش پیش‌نویس معمولی استفاده کنند.
- DMهای سطح‌بالای Slack به‌طور پیش‌فرض خارج از نخ می‌مانند، بنابراین پیش‌نمایش پخش/وضعیت بومی به سبک نخ Slack را نشان نمی‌دهند؛ OpenClaw در عوض یک پیش‌نمایش پیش‌نویس را در DM ارسال و ویرایش می‌کند.
- رسانه و payloadهای غیرمتنی به تحویل عادی برمی‌گردند.
- نهایی‌های رسانه/خطا ویرایش‌های پیش‌نمایش در انتظار را لغو می‌کنند؛ نهایی‌های متنی/بلوک واجد شرایط فقط وقتی تخلیه می‌شوند که بتوانند پیش‌نمایش را درجا ویرایش کنند.
- اگر پخش در میانه پاسخ شکست بخورد، OpenClaw برای payloadهای باقی‌مانده به تحویل عادی برمی‌گردد.

استفاده از پیش‌نمایش پیش‌نویس به‌جای پخش متنی بومی Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) به‌طور خودکار به `channels.slack.streaming.mode` مهاجرت می‌شود.
- مقدار بولی `channels.slack.streaming` به‌طور خودکار به `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` مهاجرت می‌شود.
- `channels.slack.nativeStreaming` قدیمی به‌طور خودکار به `channels.slack.streaming.nativeTransport` مهاجرت می‌شود.

## پیش‌فرض جایگزین واکنش تایپ

`typingReaction` هنگام پردازش پاسخ توسط OpenClaw، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس وقتی اجرا تمام شد آن را حذف می‌کند. این بیرون از پاسخ‌های نخ بیشترین کاربرد را دارد؛ پاسخ‌های نخ از نشانگر وضعیت پیش‌فرض "is typing..." استفاده می‌کنند.

ترتیب حل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکته‌ها:

- Slack انتظار shortcode دارد (برای مثال `"hourglass_flowing_sand"`).
- واکنش بر پایه بهترین تلاش انجام می‌شود و پس از تکمیل مسیر پاسخ یا شکست، پاک‌سازی به‌طور خودکار تلاش می‌شود.

## رسانه، تکه‌بندی و تحویل

<AccordionGroup>
  <Accordion title="پیوست‌های ورودی">
    پیوست‌های فایل Slack از URLهای خصوصی میزبانی‌شده توسط Slack دانلود می‌شوند (جریان درخواست احراز هویت‌شده با توکن) و وقتی واکشی موفق باشد و محدودیت‌های اندازه اجازه دهند، در مخزن رسانه نوشته می‌شوند. جای‌نگهدارهای فایل شامل `fileId` مربوط به Slack هستند تا عامل‌ها بتوانند فایل اصلی را با `download-file` واکشی کنند.

    دانلودها از مهلت‌های زمانی محدود برای بی‌کاری و کل زمان استفاده می‌کنند. اگر بازیابی فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به جای‌نگهدار فایل برمی‌گردد.

    سقف اندازه ورودی در زمان اجرا به‌صورت پیش‌فرض `20MB` است، مگر اینکه با `channels.slack.mediaMaxMb` بازنویسی شود.

  </Accordion>

  <Accordion title="متن و فایل‌های خروجی">
    - قطعه‌های متن از `channels.slack.textChunkLimit` استفاده می‌کنند (پیش‌فرض 4000)
    - `channels.slack.chunkMode="newline"` تقسیم‌بندی با اولویت پاراگراف را فعال می‌کند
    - ارسال فایل از APIهای بارگذاری Slack استفاده می‌کند و می‌تواند شامل پاسخ‌های رشته‌ای (`thread_ts`) باشد
    - سقف رسانه خروجی، وقتی پیکربندی شده باشد، از `channels.slack.mediaMaxMb` پیروی می‌کند؛ در غیر این صورت ارسال‌های کانال از پیش‌فرض‌های نوع MIME در خط لوله رسانه استفاده می‌کنند

  </Accordion>

  <Accordion title="مقصدهای تحویل">
    مقصدهای صریح ترجیحی:

    - `user:<id>` برای پیام‌های مستقیم
    - `channel:<id>` برای کانال‌ها

    پیام‌های مستقیم Slack که فقط متن/بلوک دارند می‌توانند مستقیما به شناسه‌های کاربر ارسال شوند؛ بارگذاری فایل و ارسال‌های رشته‌ای ابتدا پیام مستقیم را از طریق APIهای گفت‌وگوی Slack باز می‌کنند، چون این مسیرها به یک شناسه گفت‌وگوی مشخص نیاز دارند.

  </Accordion>
</AccordionGroup>

## فرمان‌ها و رفتار اسلش

فرمان‌های اسلش در Slack یا به‌صورت یک فرمان پیکربندی‌شده واحد ظاهر می‌شوند یا چند فرمان بومی. برای تغییر پیش‌فرض‌های فرمان، `channels.slack.slashCommand` را پیکربندی کنید:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

فرمان‌های بومی به [تنظیمات مانیفست اضافی](#additional-manifest-settings) در برنامه Slack شما نیاز دارند و در عوض با `channels.slack.commands.native: true` یا `commands.native: true` در پیکربندی‌های سراسری فعال می‌شوند.

- حالت خودکار فرمان بومی برای Slack **خاموش** است، بنابراین `commands.native: "auto"` فرمان‌های بومی Slack را فعال نمی‌کند.

```txt
/help
```

منوهای آرگومان بومی از یک راهبرد رندرینگ تطبیقی استفاده می‌کنند که پیش از ارسال مقدار گزینه انتخاب‌شده، یک مودال تایید نشان می‌دهد:

- تا 5 گزینه: بلوک‌های دکمه
- 6 تا 100 گزینه: منوی انتخاب ایستا
- بیش از 100 گزینه: انتخاب خارجی با فیلتر گزینه ناهمگام وقتی کنترل‌کننده‌های گزینه‌های تعاملی در دسترس باشند
- محدودیت‌های عبورشده Slack: مقدارهای گزینه کدگذاری‌شده به دکمه‌ها برمی‌گردند

```txt
/think
```

نشست‌های اسلش از کلیدهای ایزوله‌ای مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای فرمان‌ها را با استفاده از `CommandTargetSessionKey` به نشست گفت‌وگوی مقصد هدایت می‌کنند.

## پاسخ‌های تعاملی

Slack می‌تواند کنترل‌های پاسخ تعاملی نوشته‌شده توسط عامل را رندر کند، اما این قابلیت به‌صورت پیش‌فرض غیرفعال است.

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

وقتی فعال باشد، عامل‌ها می‌توانند دستورالعمل‌های پاسخ ویژه Slack تولید کنند:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

این دستورالعمل‌ها به Slack Block Kit کامپایل می‌شوند و کلیک‌ها یا انتخاب‌ها را از مسیر رویداد تعامل موجود Slack برمی‌گردانند.

نکته‌ها:

- این رابط کاربری ویژه Slack است. کانال‌های دیگر دستورالعمل‌های Slack Block Kit را به سامانه‌های دکمه‌ای خودشان ترجمه نمی‌کنند.
- مقدارهای callback تعاملی، توکن‌های مات تولیدشده توسط OpenClaw هستند، نه مقدارهای خام نوشته‌شده توسط عامل.
- اگر بلوک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit عبور کنند، OpenClaw به‌جای ارسال payload نامعتبر بلوک‌ها، به پاسخ متنی اصلی برمی‌گردد.

## تاییدیه‌های Exec در Slack

Slack می‌تواند به‌جای برگشت به رابط وب یا ترمینال، با دکمه‌ها و تعامل‌های تعاملی به‌عنوان سرویس‌گیرنده تایید بومی عمل کند.

- تاییدیه‌های Exec برای مسیریابی بومی پیام مستقیم/کانال از `channels.slack.execApprovals.*` استفاده می‌کنند.
- تاییدیه‌های Plugin همچنان می‌توانند از طریق همان سطح دکمه بومی Slack حل شوند، وقتی درخواست از قبل وارد Slack شده باشد و نوع شناسه تایید `plugin:` باشد.
- مجوز تاییدکننده همچنان اعمال می‌شود: فقط کاربرانی که به‌عنوان تاییدکننده شناسایی شده‌اند می‌توانند درخواست‌ها را از طریق Slack تایید یا رد کنند.

این از همان سطح دکمه تایید مشترک با کانال‌های دیگر استفاده می‌کند. وقتی `interactivity` در تنظیمات برنامه Slack شما فعال باشد، اعلان‌های تایید مستقیما در گفت‌وگو به‌صورت دکمه‌های Block Kit رندر می‌شوند.
وقتی این دکمه‌ها وجود دارند، تجربه کاربری اصلی تایید همان‌ها هستند؛ OpenClaw
فقط زمانی باید فرمان دستی `/approve` را اضافه کند که نتیجه ابزار بگوید تاییدهای چت
در دسترس نیستند یا تایید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`, `sessionFilter`

Slack وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک
تاییدکننده حل شود، تاییدیه‌های Exec بومی را خودکار فعال می‌کند. برای غیرفعال کردن صریح Slack به‌عنوان سرویس‌گیرنده تایید بومی، `enabled: false` را تنظیم کنید.
برای اجبار فعال بودن تاییدهای بومی وقتی تاییدکننده‌ها حل می‌شوند، `enabled: true` را تنظیم کنید.

رفتار پیش‌فرض بدون پیکربندی صریح تایید Exec در Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

پیکربندی صریح بومی Slack فقط وقتی لازم است که بخواهید تاییدکننده‌ها را بازنویسی کنید، فیلتر اضافه کنید، یا
تحویل به چت مبدا را فعال کنید:

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

ارسال مشترک `approvals.exec` جداگانه است. فقط زمانی از آن استفاده کنید که اعلان‌های تایید Exec باید همچنین
به چت‌های دیگر یا مقصدهای صریح خارج از باند هدایت شوند. ارسال مشترک `approvals.plugin` نیز
جداگانه است؛ دکمه‌های بومی Slack همچنان می‌توانند تاییدیه‌های Plugin را حل کنند، وقتی آن درخواست‌ها از قبل
وارد Slack شده باشند.

`/approve` در همان چت نیز در کانال‌های Slack و پیام‌های مستقیمی که از قبل از فرمان‌ها پشتیبانی می‌کنند کار می‌کند. برای مدل کامل ارسال تایید، [تاییدیه‌های Exec](/fa/tools/exec-approvals) را ببینید.

## رویدادها و رفتار عملیاتی

- ویرایش‌ها/حذف‌های پیام به رویدادهای سامانه نگاشت می‌شوند.
- پخش‌های رشته‌ای ("Also send to channel" در پاسخ‌های رشته‌ای) به‌عنوان پیام‌های کاربر معمولی پردازش می‌شوند.
- رویدادهای افزودن/حذف واکنش به رویدادهای سامانه نگاشت می‌شوند.
- رویدادهای پیوستن/ترک عضو، ایجاد/تغییر نام کانال، و افزودن/حذف پین به رویدادهای سامانه نگاشت می‌شوند.
- وقتی `configWrites` فعال باشد، `channel_id_changed` می‌تواند کلیدهای پیکربندی کانال را مهاجرت دهد.
- فراداده موضوع/هدف کانال به‌عنوان زمینه نامطمئن در نظر گرفته می‌شود و می‌تواند به زمینه مسیریابی تزریق شود.
- آغازگر رشته و مقداردهی اولیه زمینه تاریخچه رشته، در صورت کاربرد، با allowlistهای فرستنده پیکربندی‌شده فیلتر می‌شوند.
- کنش‌های بلوک و تعامل‌های مودال، رویدادهای ساختاریافته سامانه با قالب `Slack interaction: ...` و فیلدهای payload غنی تولید می‌کنند:
  - کنش‌های بلوک: مقدارهای انتخاب‌شده، برچسب‌ها، مقدارهای انتخابگر، و فراداده `workflow_*`
  - رویدادهای مودال `view_submission` و `view_closed` با فراداده کانال مسیریابی‌شده و ورودی‌های فرم

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="فیلدهای پراهمیت Slack">

- حالت/احراز هویت: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- دسترسی پیام مستقیم: `dm.enabled`, `dmPolicy`, `allowFrom` (قدیمی: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- کلید تغییر سازگاری: `dangerouslyAllowNameMatching` (شکستن اضطراری محدودیت؛ مگر در صورت نیاز خاموش نگه دارید)
- دسترسی کانال: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- رشته‌بندی/تاریخچه: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- عملیات/قابلیت‌ها: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="پاسخی در کانال‌ها نیست">
    به‌ترتیب بررسی کنید:

    - `groupPolicy`
    - allowlist کانال (`channels.slack.channels`) — **کلیدها باید شناسه کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام در `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، چون مسیریابی کانال به‌صورت پیش‌فرض اولویت را به شناسه می‌دهد. برای پیدا کردن شناسه: روی کانال در Slack راست‌کلیک کنید → **Copy link** — مقدار `C...` در انتهای URL همان شناسه کانال است.
    - `requireMention`
    - allowlist کاربران برای هر کانال

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
    - `channels.slack.dmPolicy` (یا شکل قدیمی `channels.slack.dm.policy`)
    - تاییدیه‌های جفت‌سازی / ورودی‌های allowlist
    - رویدادهای پیام مستقیم Slack Assistant: لاگ‌های پرجزئیات که به `drop message_changed` اشاره می‌کنند
      معمولا یعنی Slack یک رویداد ویرایش‌شده در رشته Assistant فرستاده است که در فراداده پیام
      فرستنده انسانی قابل بازیابی ندارد

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode وصل نمی‌شود">
    توکن‌های ربات + برنامه و فعال بودن Socket Mode را در تنظیمات برنامه Slack اعتبارسنجی کنید.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان دهد، حساب Slack
    پیکربندی شده است اما زمان اجرای فعلی نتوانسته مقدار پشتیبانی‌شده با SecretRef را
    حل کند.

  </Accordion>

  <Accordion title="حالت HTTP رویدادها را دریافت نمی‌کند">
    اعتبارسنجی کنید:

    - راز امضا
    - مسیر Webhook
    - URLهای درخواست Slack (رویدادها + تعامل‌پذیری + فرمان‌های اسلش)
    - `webhookPath` یکتا برای هر حساب HTTP

    اگر `signingSecretStatus: "configured_unavailable"` در snapshotهای حساب
    ظاهر شود، حساب HTTP پیکربندی شده است اما زمان اجرای فعلی نتوانسته
    راز امضای پشتیبانی‌شده با SecretRef را حل کند.

  </Accordion>

  <Accordion title="فرمان‌های بومی/اسلش اجرا نمی‌شوند">
    بررسی کنید قصد شما کدام مورد بوده است:

    - حالت فرمان بومی (`channels.slack.commands.native: true`) با فرمان‌های اسلش متناظر ثبت‌شده در Slack
    - یا حالت فرمان اسلش واحد (`channels.slack.slashCommand.enabled: true`)

    همچنین `commands.useAccessGroups` و allowlistهای کانال/کاربر را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مرجع بینایی پیوست

Slack می‌تواند وقتی دانلودهای فایل Slack موفق باشند و محدودیت‌های اندازه اجازه دهند، رسانه دانلودشده را به نوبت عامل پیوست کند. فایل‌های تصویر می‌توانند از مسیر درک رسانه عبور کنند یا مستقیما به یک مدل پاسخ‌دهی دارای قابلیت بینایی داده شوند؛ فایل‌های دیگر به‌جای اینکه به‌عنوان ورودی تصویر تلقی شوند، به‌عنوان زمینه فایل قابل دانلود نگه داشته می‌شوند.

### نوع‌های رسانه پشتیبانی‌شده

| نوع رسانه                     | منبع               | رفتار کنونی                                                                  | یادداشت‌ها                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| تصاویر JPEG / PNG / GIF / WebP | URL فایل Slack       | دانلود می‌شود و برای پردازش دارای قابلیت بینایی به نوبت پیوست می‌شود                   | سقف هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض 20 MB)                 |
| فایل‌های PDF                      | URL فایل Slack       | دانلود می‌شود و به‌عنوان بافت فایل برای ابزارهایی مانند `download-file` یا `pdf` در دسترس قرار می‌گیرد | ورودی Slack به‌طور خودکار PDFها را به ورودی بینایی تصویر تبدیل نمی‌کند |
| فایل‌های دیگر                    | URL فایل Slack       | در صورت امکان دانلود می‌شود و به‌عنوان بافت فایل در دسترس قرار می‌گیرد                              | فایل‌های دودویی به‌عنوان ورودی تصویر در نظر گرفته نمی‌شوند                               |
| پاسخ‌های رشته گفتگو                 | فایل‌های آغازگر رشته گفتگو | وقتی پاسخ رسانه مستقیم ندارد، فایل‌های پیام ریشه می‌توانند به‌عنوان بافت هیدراته شوند  | آغازگرهای فقط-فایل از جای‌نگهدار پیوست استفاده می‌کنند                          |
| پیام‌های چندتصویری           | چندین فایل Slack | هر فایل به‌صورت مستقل ارزیابی می‌شود                                              | پردازش Slack به هشت فایل برای هر پیام محدود است                     |

### خط لوله ورودی

وقتی پیام Slack دارای پیوست فایل می‌رسد:

1. OpenClaw فایل را از URL خصوصی Slack با استفاده از توکن بات (`xoxb-...`) دانلود می‌کند.
2. در صورت موفقیت، فایل در ذخیره‌گاه رسانه نوشته می‌شود.
3. مسیرهای رسانه دانلودشده و نوع‌های محتوا به بافت ورودی اضافه می‌شوند.
4. مسیرهای مدل/ابزار دارای قابلیت تصویر می‌توانند از پیوست‌های تصویری موجود در آن بافت استفاده کنند.
5. فایل‌های غیرتصویری برای ابزارهایی که می‌توانند آن‌ها را پردازش کنند، همچنان به‌عنوان فراداده فایل یا ارجاع رسانه در دسترس می‌مانند.

### وراثت پیوست ریشه رشته گفتگو

وقتی پیامی در یک رشته گفتگو می‌رسد (دارای والد `thread_ts` است):

- اگر خود پاسخ رسانه مستقیم نداشته باشد و پیام ریشه شامل فایل باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان بافت آغازگر رشته گفتگو هیدراته کند.
- پیوست‌های مستقیم پاسخ بر پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و متن ندارد، با جای‌نگهدار پیوست نمایش داده می‌شود تا fallback همچنان بتواند فایل‌های آن را شامل کند.

### پردازش چندپیوستی

وقتی یک پیام Slack شامل چند پیوست فایل باشد:

- هر پیوست به‌صورت مستقل از طریق خط لوله رسانه پردازش می‌شود.
- ارجاع‌های رسانه دانلودشده در بافت پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در payload رویداد پیروی می‌کند.
- شکست دانلود یک پیوست، پیوست‌های دیگر را مسدود نمی‌کند.

### محدودیت‌های اندازه، دانلود و مدل

- **سقف اندازه**: پیش‌فرض 20 MB برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل پیکربندی است.
- **شکست‌های دانلود**: فایل‌هایی که Slack نمی‌تواند ارائه کند، URLهای منقضی‌شده، فایل‌های غیرقابل‌دسترسی، فایل‌های بیش‌ازحد بزرگ، و پاسخ‌های HTML احراز هویت/ورود Slack به‌جای گزارش شدن به‌عنوان قالب‌های پشتیبانی‌نشده، نادیده گرفته می‌شوند.
- **مدل بینایی**: تحلیل تصویر از مدل پاسخ فعال استفاده می‌کند، اگر از بینایی پشتیبانی کند؛ در غیر این صورت از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel` استفاده می‌کند.

### محدودیت‌های شناخته‌شده

| سناریو                               | رفتار کنونی                                                             | راهکار جایگزین                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL منقضی‌شده فایل Slack                 | فایل نادیده گرفته می‌شود؛ خطایی نمایش داده نمی‌شود                                                 | فایل را دوباره در Slack بارگذاری کنید                                                |
| مدل بینایی پیکربندی نشده است            | پیوست‌های تصویری به‌عنوان ارجاع‌های رسانه ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند | `agents.defaults.imageModel` را پیکربندی کنید یا از مدل پاسخ دارای قابلیت بینایی استفاده کنید |
| تصاویر بسیار بزرگ (> 20 MB به‌صورت پیش‌فرض) | بر اساس سقف اندازه نادیده گرفته می‌شود                                                         | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید                       |
| پیوست‌های فوروارد/اشتراک‌گذاری‌شده           | متن و رسانه تصویر/فایل میزبانی‌شده در Slack به‌صورت best-effort پردازش می‌شوند                       | مستقیما در رشته گفتگوی OpenClaw دوباره به‌اشتراک بگذارید                                   |
| پیوست‌های PDF                        | به‌عنوان بافت فایل/رسانه ذخیره می‌شوند، نه اینکه به‌طور خودکار از مسیر بینایی تصویر عبور کنند  | برای فراداده فایل از `download-file` یا برای تحلیل PDF از ابزار `pdf` استفاده کنید   |

### مستندات مرتبط

- [خط لوله درک رسانه](/fa/nodes/media-understanding)
- [ابزار PDF](/fa/tools/pdf)
- اپیک: [#51349](https://github.com/openclaw/openclaw/issues/51349) — فعال‌سازی بینایی پیوست‌های Slack
- آزمون‌های رگرسیون: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- راستی‌آزمایی زنده: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Slack را به Gateway جفت کنید.
  </Card>
  <Card title="Groups" icon="users" href="/fa/channels/groups">
    رفتار کانال و DM گروهی.
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
    کاتالوگ و رفتار فرمان.
  </Card>
</CardGroup>
