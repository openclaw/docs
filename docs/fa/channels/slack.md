---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی حالت سوکت/HTTP در Slack
summary: راه‌اندازی Slack و رفتار زمان اجرا (حالت سوکت + نشانی‌های URL درخواست HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-30T16:27:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55beddb43a6b91c6853dcf053eab713322de4da5beced7c107d73e1c066fded6
    source_path: channels/slack.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم و کانال‌ها از طریق یکپارچه‌سازی‌های اپ Slack. حالت پیش‌فرض، حالت سوکت است؛ URLهای درخواست HTTP نیز پشتیبانی می‌شوند.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Slack به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="فرمان‌های اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی و کاتالوگ فرمان‌ها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی‌های میان‌کانالی و راهنماهای ترمیم.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="حالت سوکت (پیش‌فرض)">
    <Steps>
      <Step title="یک اپ Slack جدید بسازید">
        در تنظیمات اپ Slack دکمهٔ **[Create New App](https://api.slack.com/apps/new)** را فشار دهید:

        - گزینهٔ **from a manifest** را انتخاب کنید و یک workspace برای اپ خود برگزینید
        - [مانیفست نمونه](#manifest-and-scope-checklist) زیر را جای‌گذاری کنید و برای ساخت ادامه دهید
        - یک **App-Level Token** (`xapp-...`) با `connections:write` تولید کنید
        - اپ را نصب کنید و **Bot Token** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

      </Step>

      <Step title="OpenClaw را پیکربندی کنید">

        راه‌اندازی SecretRef پیشنهادی:

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

      <Step title="Gateway را شروع کنید">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="URLهای درخواست HTTP">
    <Steps>
      <Step title="یک اپ Slack جدید بسازید">
        در تنظیمات اپ Slack دکمهٔ **[Create New App](https://api.slack.com/apps/new)** را فشار دهید:

        - گزینهٔ **from a manifest** را انتخاب کنید و یک workspace برای اپ خود برگزینید
        - [مانیفست نمونه](#manifest-and-scope-checklist) را جای‌گذاری کنید و URLها را پیش از ساخت به‌روزرسانی کنید
        - **Signing Secret** را برای تأیید درخواست ذخیره کنید
        - اپ را نصب کنید و **Bot Token** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

      </Step>

      <Step title="OpenClaw را پیکربندی کنید">

        راه‌اندازی SecretRef پیشنهادی:

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
        برای HTTP چندحسابی از مسیرهای Webhook یکتا استفاده کنید

        به هر حساب یک `webhookPath` متمایز بدهید (پیش‌فرض `/slack/events`) تا ثبت‌ها با هم تداخل نداشته باشند.
        </Note>

      </Step>

      <Step title="Gateway را شروع کنید">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## تنظیم انتقال در حالت سوکت

OpenClaw به‌طور پیش‌فرض مهلت pong کلاینت SDK Slack را برای حالت سوکت روی ۱۵ ثانیه تنظیم می‌کند. تنظیمات انتقال را فقط زمانی بازنویسی کنید که به تنظیمات ویژهٔ workspace یا میزبان نیاز دارید:

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

این را فقط برای workspaceهای حالت سوکتی استفاده کنید که مهلت‌های Slack websocket pong/server-ping را ثبت می‌کنند یا روی میزبان‌هایی اجرا می‌شوند که گرسنگی event-loop شناخته‌شده دارند. `clientPingTimeout` مدت انتظار pong پس از ارسال ping کلاینت توسط SDK است؛ `serverPingTimeout` مدت انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای اپ، وضعیت برنامه باقی می‌مانند، نه سیگنال‌های زنده‌بودن انتقال.

## چک‌لیست مانیفست و scope

مانیفست پایهٔ اپ Slack برای حالت سوکت و URLهای درخواست HTTP یکسان است. فقط بلوک `settings` (و `url` فرمان اسلش) متفاوت است.

مانیفست پایه (پیش‌فرض حالت سوکت):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
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
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
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

برای **حالت URLهای درخواست HTTP**، `settings` را با نوع HTTP جایگزین کنید و به هر فرمان اسلش `url` اضافه کنید. URL عمومی لازم است:

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

### تنظیمات تکمیلی مانیفست

قابلیت‌های متفاوتی را ارائه کنید که پیش‌فرض‌های بالا را گسترش می‌دهند.

<AccordionGroup>
  <Accordion title="فرمان‌های اسلش بومی اختیاری">

    چندین [فرمان اسلش بومی](#commands-and-slash-behavior) می‌توانند به‌جای یک فرمان پیکربندی‌شدهٔ واحد با جزئیات بیشتر استفاده شوند:

    - از `/agentstatus` به‌جای `/status` استفاده کنید، چون فرمان `/status` رزرو شده است.
    - بیش از ۲۵ فرمان اسلش را نمی‌توان هم‌زمان در دسترس قرار داد.

    بخش `features.slash_commands` فعلی خود را با زیرمجموعه‌ای از [فرمان‌های موجود](/fa/tools/slash-commands#command-list) جایگزین کنید:

    <Tabs>
      <Tab title="حالت سوکت (پیش‌فرض)">

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
      <Tab title="URLهای درخواست HTTP">
        از همان فهرست `slash_commands` حالت سوکت بالا استفاده کنید، و به هر ورودی `"url": "https://gateway-host.example.com/slack/events"` اضافه کنید. نمونه:

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
  <Accordion title="scopeهای اختیاری انتساب نویسنده (عملیات نوشتن)">
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض اپ Slack از هویت عامل فعال (نام کاربری و نماد سفارشی) استفاده کنند، scope ربات `chat:write.customize` را اضافه کنید.

    اگر از نماد ایموجی استفاده می‌کنید، Slack انتظار نحو `:emoji_name:` را دارد.

  </Accordion>
  <Accordion title="scopeهای اختیاری توکن کاربر (عملیات خواندن)">
    اگر `channels.slack.userToken` را پیکربندی می‌کنید، scopeهای خواندن معمول عبارت‌اند از:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (اگر به خواندن‌های جستجوی Slack وابسته هستید)

  </Accordion>
</AccordionGroup>

## مدل توکن

- `botToken` + `appToken` برای Socket Mode الزامی هستند.
- حالت HTTP به `botToken` + `signingSecret` نیاز دارد.
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های متن ساده
  یا اشیای SecretRef را می‌پذیرند.
- توکن‌های پیکربندی، جایگزین fallback محیطی می‌شوند.
- fallback محیطی `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
- `userToken` (`xoxp-...`) فقط از طریق پیکربندی است (بدون fallback محیطی) و به‌صورت پیش‌فرض رفتار فقط‌خواندنی دارد (`userTokenReadOnly: true`).

رفتار نمای وضعیت:

- بازرسی حساب Slack، فیلدهای `*Source` و `*Status` را برای هر اعتبارنامه
  دنبال می‌کند (`botToken`، `appToken`، `signingSecret`، `userToken`).
- وضعیت یکی از `available`، `configured_unavailable` یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا منبع secret غیر درون‌خطی دیگری پیکربندی شده، اما مسیر فرمان/زمان اجرای فعلی
  نتوانسته مقدار واقعی را resolve کند.
- در حالت HTTP، `signingSecretStatus` گنجانده می‌شود؛ در Socket Mode،
  جفت الزامی `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای کنش‌ها/خواندن‌های فهرست، وقتی user token پیکربندی شده باشد می‌تواند ترجیح داده شود. برای نوشتن‌ها، bot token همچنان ترجیح داده می‌شود؛ نوشتن با user-token فقط زمانی مجاز است که `userTokenReadOnly: false` باشد و bot token در دسترس نباشد.
</Tip>

## کنش‌ها و gateها

کنش‌های Slack با `channels.slack.actions.*` کنترل می‌شوند.

گروه‌های کنش موجود در ابزار فعلی Slack:

| گروه      | پیش‌فرض |
| ---------- | ------- |
| messages   | فعال |
| reactions  | فعال |
| pins       | فعال |
| memberInfo | فعال |
| emojiList  | فعال |

کنش‌های پیام فعلی Slack شامل `send`، `upload-file`، `download-file`، `read`، `edit`، `delete`، `pin`، `unpin`، `list-pins`، `member-info` و `emoji-list` هستند. `download-file` شناسه‌های فایل Slack را که در placeholderهای فایل ورودی نشان داده می‌شوند می‌پذیرد و برای تصویرها پیش‌نمایش تصویر یا برای انواع فایل دیگر metadata فایل محلی برمی‌گرداند.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست DM">
    `channels.slack.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.slack.allowFrom` allowlist رسمی DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند این است که `channels.slack.allowFrom` شامل `"*"` باشد)
    - `disabled`

    flagهای DM:

    - `dm.enabled` (پیش‌فرض true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قدیمی)
    - `dm.groupEnabled` (DMهای گروهی به‌صورت پیش‌فرض false)
    - `dm.groupChannels` (allowlist اختیاری MPIM)

    تقدم چندحسابی:

    - `channels.slack.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان تنظیم نشده باشد، `channels.slack.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.slack.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.slack.dm.policy` و `channels.slack.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` migrate می‌کند.

    pairing در DMها از `openclaw pairing approve slack <code>` استفاده می‌کند.

  </Tab>

  <Tab title="سیاست کانال">
    `channels.slack.groupPolicy` نحوه مدیریت کانال را کنترل می‌کند:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist کانال زیر `channels.slack.channels` قرار دارد و **باید از شناسه‌های پایدار کانال Slack** (برای مثال `C12345678`) به‌عنوان کلیدهای پیکربندی استفاده کند.

    نکته زمان اجرا: اگر `channels.slack` کاملا وجود نداشته باشد (راه‌اندازی فقط با env)، زمان اجرا به `groupPolicy="allowlist"` برمی‌گردد و هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    resolve نام/شناسه:

    - ورودی‌های allowlist کانال و allowlist DM هنگام راه‌اندازی، وقتی دسترسی token اجازه دهد، resolve می‌شوند
    - ورودی‌های حل‌نشده نام کانال همان‌طور که پیکربندی شده‌اند نگه داشته می‌شوند اما به‌صورت پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند
    - authorization ورودی و مسیریابی کانال به‌صورت پیش‌فرض شناسه‌محور هستند؛ تطبیق مستقیم username/slug به `channels.slack.dangerouslyAllowNameMatching: true` نیاز دارد

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) زیر `groupPolicy: "allowlist"` match نمی‌شوند. جست‌وجوی کانال به‌صورت پیش‌فرض شناسه‌محور است، بنابراین یک کلید مبتنی بر نام هرگز با موفقیت مسیریابی نمی‌شود و همه پیام‌ها در آن کانال بی‌صدا مسدود می‌شوند. این با `groupPolicy: "open"` متفاوت است؛ در آن حالت کلید کانال برای مسیریابی لازم نیست و یک کلید مبتنی بر نام ظاهرا کار می‌کند.

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

  <Tab title="mentionها و کاربران کانال">
    پیام‌های کانال به‌صورت پیش‌فرض با mention gate می‌شوند.

    منابع mention:

    - mention صریح app (`<@botId>`)
    - الگوهای regex برای mention (`agents.list[].groupChat.mentionPatterns`، fallback `messages.groupChat.mentionPatterns`)
    - رفتار thread ضمنی reply-to-bot (وقتی `thread.requireExplicitMention` برابر `true` باشد غیرفعال است)

    کنترل‌های هر کانال (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق resolve هنگام راه‌اندازی یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - قالب کلید `toolsBySender`: `id:`، `e164:`، `username:`، `name:` یا wildcard `"*"`
      (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` map می‌شوند)

    `allowBots` برای کانال‌ها و کانال‌های خصوصی محافظه‌کارانه است: پیام‌های اتاق که توسط bot نوشته شده‌اند فقط وقتی پذیرفته می‌شوند که bot فرستنده به‌صراحت در allowlist `users` همان اتاق فهرست شده باشد، یا وقتی دست‌کم یک شناسه مالک صریح Slack از `channels.slack.allowFrom` در حال حاضر عضو اتاق باشد. wildcardها و ورودی‌های مالک با display-name حضور مالک را تامین نمی‌کنند. حضور مالک از `conversations.members` در Slack استفاده می‌کند؛ مطمئن شوید app دارای scope خواندن متناظر برای نوع اتاق است (`channels:read` برای کانال‌های عمومی، `groups:read` برای کانال‌های خصوصی). اگر جست‌وجوی عضو شکست بخورد، OpenClaw پیام اتاق نوشته‌شده توسط bot را drop می‌کند.

  </Tab>
</Tabs>

## Threading، sessionها و tagهای پاسخ

- DMها به‌صورت `direct` مسیریابی می‌شوند؛ کانال‌ها به‌صورت `channel`؛ MPIMها به‌صورت `group`.
- با مقدار پیش‌فرض `session.dmScope=main`، DMهای Slack به session اصلی agent ادغام می‌شوند.
- sessionهای کانال: `agent:<agentId>:slack:channel:<channelId>`.
- پاسخ‌های thread می‌توانند در صورت قابل‌اعمال بودن، suffixهای session thread بسازند (`:thread:<threadTs>`).
- پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` کنترل می‌کند هنگام شروع یک session thread جدید چند پیام thread موجود واکشی شود (پیش‌فرض `20`؛ برای غیرفعال‌سازی `0` تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، mentionهای ضمنی thread را سرکوب می‌کند تا bot فقط به mentionهای صریح `@bot` داخل threadها پاسخ دهد، حتی وقتی bot قبلا در thread مشارکت داشته است. بدون این، پاسخ‌ها در threadی که bot در آن مشارکت داشته، gating مربوط به `requireMention` را دور می‌زنند.

کنترل‌های reply threading:

- `channels.slack.replyToMode`: `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: برای هر `direct|group|channel`
- fallback قدیمی برای chatهای مستقیم: `channels.slack.dm.replyToMode`

tagهای پاسخ دستی پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` **همه** reply threading را در Slack غیرفعال می‌کند، از جمله tagهای صریح `[[reply_to_*]]`. این با Telegram متفاوت است؛ در Telegram، tagهای صریح همچنان در حالت `"off"` رعایت می‌شوند. threadهای Slack پیام‌ها را از کانال پنهان می‌کنند، درحالی‌که پاسخ‌های Telegram به‌صورت inline قابل مشاهده می‌مانند.
</Note>

## واکنش‌های Ack

`ackReaction` هنگامی که OpenClaw در حال پردازش یک پیام ورودی است، یک emoji تایید دریافت می‌فرستد.

ترتیب resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji هویت agent (`agents.list[].identity.emoji`، وگرنه "👀")

نکات:

- Slack انتظار shortcode دارد (برای مثال `"eyes"`).
- برای غیرفعال کردن واکنش برای حساب Slack یا به‌صورت سراسری، از `""` استفاده کنید.

## پخش جریانی متن

`channels.slack.streaming` رفتار پیش‌نمایش زنده را کنترل می‌کند:

- `off`: پخش جریانی پیش‌نمایش زنده را غیرفعال می‌کند.
- `partial` (پیش‌فرض): متن پیش‌نمایش را با آخرین خروجی جزئی جایگزین می‌کند.
- `block`: به‌روزرسانی‌های پیش‌نمایش قطعه‌قطعه را append می‌کند.
- `progress`: هنگام تولید، متن وضعیت پیشرفت را نشان می‌دهد و سپس متن نهایی را می‌فرستد.
- `streaming.preview.toolProgress`: وقتی پیش‌نمایش draft فعال است، به‌روزرسانی‌های tool/progress را به همان پیام پیش‌نمایش ویرایش‌شده مسیریابی می‌کند (پیش‌فرض: `true`). برای نگه داشتن پیام‌های جداگانه tool/progress، `false` تنظیم کنید.

`channels.slack.streaming.nativeTransport` پخش جریانی متن native Slack را وقتی `channels.slack.streaming.mode` برابر `partial` است کنترل می‌کند (پیش‌فرض: `true`).

- یک thread پاسخ باید برای نمایش پخش جریانی متن native و وضعیت thread دستیار Slack در دسترس باشد. انتخاب thread همچنان از `replyToMode` پیروی می‌کند.
- ریشه‌های channel و group-chat همچنان وقتی native streaming در دسترس نیست می‌توانند از پیش‌نمایش draft معمولی استفاده کنند.
- DMهای سطح‌بالای Slack به‌صورت پیش‌فرض خارج از thread می‌مانند، بنابراین پیش‌نمایش سبک thread را نشان نمی‌دهند؛ اگر می‌خواهید پیشرفت قابل مشاهده در آنجا داشته باشید، از پاسخ‌های thread یا `typingReaction` استفاده کنید.
- payloadهای رسانه و غیرمتنی به تحویل معمولی fallback می‌کنند.
- نتیجه‌های نهایی رسانه/خطا ویرایش‌های pending پیش‌نمایش را لغو می‌کنند؛ نتیجه‌های نهایی text/block واجد شرایط فقط وقتی flush می‌شوند که بتوانند پیش‌نمایش را درجا ویرایش کنند.
- اگر streaming در میانه پاسخ شکست بخورد، OpenClaw برای payloadهای باقی‌مانده به تحویل معمولی fallback می‌کند.

به‌جای پخش جریانی متن native Slack از پیش‌نمایش draft استفاده کنید:

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
- مقدار boolean `channels.slack.streaming` به‌صورت خودکار به `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` migrate می‌شود.
- `channels.slack.nativeStreaming` قدیمی به‌صورت خودکار به `channels.slack.streaming.nativeTransport` migrate می‌شود.

## fallback واکنش تایپ

`typingReaction` هنگامی که OpenClaw در حال پردازش یک پاسخ است، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس پس از پایان run آن را حذف می‌کند. این بیرون از پاسخ‌های thread بیشترین کاربرد را دارد؛ پاسخ‌های thread از نشانگر وضعیت پیش‌فرض "is typing..." استفاده می‌کنند.

ترتیب resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکات:

- Slack انتظار shortcode دارد (برای مثال `"hourglass_flowing_sand"`).
- واکنش best-effort است و پس از تکمیل مسیر پاسخ یا شکست، cleanup به‌صورت خودکار تلاش می‌شود.

## رسانه، قطعه‌بندی و تحویل

<AccordionGroup>
  <Accordion title="پیوست‌های ورودی">
    پیوست‌های فایل Slack از URLهای خصوصی میزبانی‌شده توسط Slack دانلود می‌شوند (جریان درخواست احرازشده با token) و وقتی fetch موفق باشد و محدودیت‌های اندازه اجازه دهند، در media store نوشته می‌شوند. placeholderهای فایل شامل `fileId` مربوط به Slack هستند تا agentها بتوانند فایل اصلی را با `download-file` واکشی کنند.

    دانلودها از timeoutهای محدود برای idle و کل زمان استفاده می‌کنند. اگر بازیابی فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به placeholder فایل fallback می‌کند.

    سقف اندازه ورودی زمان اجرا به‌صورت پیش‌فرض `20MB` است مگر اینکه با `channels.slack.mediaMaxMb` override شود.

  </Accordion>

  <Accordion title="متن و فایل‌های خروجی">
    - قطعه‌های متن از `channels.slack.textChunkLimit` استفاده می‌کنند (پیش‌فرض 4000)
    - `channels.slack.chunkMode="newline"` تقسیم‌بندی با اولویت پاراگراف را فعال می‌کند
    - ارسال فایل‌ها از APIهای بارگذاری Slack استفاده می‌کند و می‌تواند شامل پاسخ‌های رشته‌ای (`thread_ts`) باشد
    - سقف رسانهٔ خروجی، وقتی پیکربندی شده باشد، از `channels.slack.mediaMaxMb` پیروی می‌کند؛ در غیر این صورت ارسال‌های کانال از پیش‌فرض‌های نوع MIME در خط لولهٔ رسانه استفاده می‌کنند

  </Accordion>

  <Accordion title="مقصدهای تحویل">
    مقصدهای صریح ترجیحی:

    - `user:<id>` برای پیام‌های مستقیم
    - `channel:<id>` برای کانال‌ها

    پیام‌های مستقیم Slack هنگام ارسال به مقصدهای کاربر، از طریق APIهای گفت‌وگوی Slack باز می‌شوند.

  </Accordion>
</AccordionGroup>

## فرمان‌ها و رفتار اسلش

فرمان‌های اسلش در Slack یا به‌صورت یک فرمان پیکربندی‌شدهٔ واحد یا چند فرمان بومی ظاهر می‌شوند. برای تغییر پیش‌فرض‌های فرمان، `channels.slack.slashCommand` را پیکربندی کنید:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

فرمان‌های بومی به [تنظیمات manifest اضافی](#additional-manifest-settings) در برنامهٔ Slack شما نیاز دارند و در عوض با `channels.slack.commands.native: true` یا `commands.native: true` در پیکربندی‌های سراسری فعال می‌شوند.

- حالت خودکار فرمان بومی برای Slack **خاموش** است، بنابراین `commands.native: "auto"` فرمان‌های بومی Slack را فعال نمی‌کند.

```txt
/help
```

منوهای آرگومان بومی از راهبرد نمایش تطبیقی استفاده می‌کنند که پیش از ارسال مقدار گزینهٔ انتخاب‌شده، یک modal تأیید نشان می‌دهد:

- تا 5 گزینه: بلوک‌های دکمه
- 6 تا 100 گزینه: منوی انتخاب ایستا
- بیش از 100 گزینه: انتخاب خارجی با فیلترکردن ناهمگام گزینه‌ها، وقتی handlerهای گزینه‌های interactivity در دسترس باشند
- فراتر از محدودیت‌های Slack: مقدارهای گزینهٔ کدگذاری‌شده به دکمه‌ها برمی‌گردند

```txt
/think
```

نشست‌های اسلش از کلیدهای ایزوله‌ای مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای فرمان‌ها را با استفاده از `CommandTargetSessionKey` به نشست گفت‌وگوی مقصد هدایت می‌کنند.

## پاسخ‌های تعاملی

Slack می‌تواند کنترل‌های پاسخ تعاملی نوشته‌شده توسط agent را نمایش دهد، اما این قابلیت به‌صورت پیش‌فرض غیرفعال است.

فعال‌سازی سراسری آن:

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

یا فعال‌سازی آن فقط برای یک حساب Slack:

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

وقتی فعال باشد، agentها می‌توانند دستورهای پاسخ فقط مخصوص Slack صادر کنند:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

این دستورها به Slack Block Kit کامپایل می‌شوند و کلیک‌ها یا انتخاب‌ها را از مسیر رویداد تعامل موجود Slack برمی‌گردانند.

نکات:

- این UI مخصوص Slack است. کانال‌های دیگر دستورهای Slack Block Kit را به سیستم‌های دکمهٔ خودشان ترجمه نمی‌کنند.
- مقدارهای callback تعاملی توکن‌های مبهم تولیدشده توسط OpenClaw هستند، نه مقدارهای خام نوشته‌شده توسط agent.
- اگر بلوک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit فراتر بروند، OpenClaw به‌جای ارسال payload بلوک‌های نامعتبر، به پاسخ متنی اصلی برمی‌گردد.

## تأییدهای اجرا در Slack

Slack می‌تواند به‌جای بازگشت به رابط کاربری وب یا terminal، با دکمه‌ها و تعامل‌های تعاملی به‌عنوان یک کلاینت تأیید بومی عمل کند.

- تأییدهای اجرا برای مسیریابی بومی پیام مستقیم/کانال از `channels.slack.execApprovals.*` استفاده می‌کنند.
- تأییدهای Plugin همچنان می‌توانند از همان سطح دکمهٔ بومی Slack حل شوند، وقتی درخواست از قبل در Slack قرار گرفته باشد و نوع شناسهٔ تأیید `plugin:` باشد.
- مجوز تأییدکننده همچنان اعمال می‌شود: فقط کاربرانی که به‌عنوان تأییدکننده شناسایی شده‌اند می‌توانند درخواست‌ها را از طریق Slack تأیید یا رد کنند.

این از همان سطح مشترک دکمهٔ تأیید مثل کانال‌های دیگر استفاده می‌کند. وقتی `interactivity` در تنظیمات برنامهٔ Slack شما فعال باشد، promptهای تأیید مستقیماً در گفت‌وگو به‌صورت دکمه‌های Block Kit نمایش داده می‌شوند.
وقتی آن دکمه‌ها وجود دارند، UX اصلی تأیید هستند؛ OpenClaw
باید فقط وقتی یک فرمان دستی `/approve` را شامل کند که نتیجهٔ ابزار بگوید تأییدهای چت
در دسترس نیستند یا تأیید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`, `sessionFilter`

Slack وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و حداقل یک
تأییدکننده resolve شود، تأییدهای اجرای بومی را خودکار فعال می‌کند. برای غیرفعال‌کردن صریح Slack به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.
برای اجبار فعال‌شدن تأییدهای بومی وقتی تأییدکننده‌ها resolve می‌شوند، `enabled: true` را تنظیم کنید.

رفتار پیش‌فرض بدون پیکربندی صریح تأیید اجرای Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

پیکربندی صریح بومی Slack فقط زمانی لازم است که بخواهید تأییدکننده‌ها را override کنید، فیلتر اضافه کنید، یا
تحویل به چت مبدأ را انتخاب کنید:

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

هدایت مشترک `approvals.exec` جداست. فقط زمانی از آن استفاده کنید که promptهای تأیید اجرا باید به چت‌های دیگر یا مقصدهای صریح خارج از باند نیز
مسیریابی شوند. هدایت مشترک `approvals.plugin` نیز
جداست؛ دکمه‌های بومی Slack همچنان می‌توانند تأییدهای Plugin را وقتی آن درخواست‌ها از قبل در Slack قرار گرفته‌اند resolve کنند.

`/approve` در همان چت نیز در کانال‌ها و پیام‌های مستقیم Slack که از قبل از فرمان‌ها پشتیبانی می‌کنند کار می‌کند. برای مدل کامل هدایت تأیید، [تأییدهای اجرا](/fa/tools/exec-approvals) را ببینید.

## رویدادها و رفتار عملیاتی

- ویرایش/حذف پیام‌ها به رویدادهای سیستمی نگاشت می‌شوند.
- پخش‌های رشته‌ای (پاسخ‌های رشته‌ای «همچنین به کانال ارسال کن») به‌عنوان پیام‌های عادی کاربر پردازش می‌شوند.
- رویدادهای افزودن/حذف واکنش به رویدادهای سیستمی نگاشت می‌شوند.
- رویدادهای پیوستن/ترک عضو، ایجاد/تغییرنام کانال، و افزودن/حذف pin به رویدادهای سیستمی نگاشت می‌شوند.
- وقتی `configWrites` فعال باشد، `channel_id_changed` می‌تواند کلیدهای پیکربندی کانال را مهاجرت دهد.
- فرادادهٔ موضوع/هدف کانال به‌عنوان context غیرقابل‌اعتماد در نظر گرفته می‌شود و می‌تواند به context مسیریابی تزریق شود.
- آغازگر رشته و کاشت context تاریخچهٔ اولیهٔ رشته، در صورت کاربرد، بر اساس allowlistهای فرستندهٔ پیکربندی‌شده فیلتر می‌شوند.
- کنش‌های بلوک و تعامل‌های modal رویدادهای سیستمی ساخت‌یافتهٔ `Slack interaction: ...` را با فیلدهای payload غنی منتشر می‌کنند:
  - کنش‌های بلوک: مقدارهای انتخاب‌شده، برچسب‌ها، مقدارهای picker، و فرادادهٔ `workflow_*`
  - رویدادهای modal `view_submission` و `view_closed` با فرادادهٔ کانال مسیریابی‌شده و ورودی‌های فرم

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="فیلدهای پربازده Slack">

- حالت/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- دسترسی پیام مستقیم: `dm.enabled`, `dmPolicy`, `allowFrom` (قدیمی: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- کلید سازگاری: `dangerouslyAllowNameMatching` (break-glass؛ مگر در صورت نیاز خاموش نگه دارید)
- دسترسی کانال: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- رشته‌بندی/تاریخچه: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- عملیات/قابلیت‌ها: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="بدون پاسخ در کانال‌ها">
    به‌ترتیب بررسی کنید:

    - `groupPolicy`
    - allowlist کانال (`channels.slack.channels`) — **کلیدها باید شناسهٔ کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام زیر `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، چون مسیریابی کانال به‌صورت پیش‌فرض اول بر اساس شناسه است. برای یافتن شناسه: روی کانال در Slack راست‌کلیک کنید → **Copy link** — مقدار `C...` در انتهای URL شناسهٔ کانال است.
    - `requireMention`
    - allowlist کاربران هر کانال

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
    - `channels.slack.dmPolicy` (یا مقدار قدیمی `channels.slack.dm.policy`)
    - تأییدهای pairing / ورودی‌های allowlist
    - رویدادهای پیام مستقیم Slack Assistant: لاگ‌های verbose که به `drop message_changed` اشاره می‌کنند
      معمولاً یعنی Slack یک رویداد رشتهٔ Assistant ویرایش‌شده فرستاده است، بدون
      فرستندهٔ انسانی قابل بازیابی در فرادادهٔ پیام

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="حالت Socket وصل نمی‌شود">
    توکن‌های bot + app و فعال‌بودن Socket Mode را در تنظیمات برنامهٔ Slack اعتبارسنجی کنید.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان می‌دهد، حساب Slack
    پیکربندی شده است اما runtime فعلی نتوانسته مقدار پشتیبانی‌شده با SecretRef را
    resolve کند.

  </Accordion>

  <Accordion title="حالت HTTP رویداد دریافت نمی‌کند">
    اعتبارسنجی کنید:

    - signing secret
    - مسیر Webhook
    - URLهای درخواست Slack (رویدادها + Interactivity + فرمان‌های اسلش)
    - `webhookPath` یکتا برای هر حساب HTTP

    اگر `signingSecretStatus: "configured_unavailable"` در snapshotهای حساب ظاهر شود،
    حساب HTTP پیکربندی شده است اما runtime فعلی نتوانسته signing secret پشتیبانی‌شده با SecretRef را
    resolve کند.

  </Accordion>

  <Accordion title="فرمان‌های بومی/اسلش اجرا نمی‌شوند">
    بررسی کنید که منظورتان کدام بوده است:

    - حالت فرمان بومی (`channels.slack.commands.native: true`) با فرمان‌های اسلش متناظر ثبت‌شده در Slack
    - یا حالت فرمان اسلش واحد (`channels.slack.slashCommand.enabled: true`)

    همچنین `commands.useAccessGroups` و allowlistهای کانال/کاربر را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مرجع vision پیوست

Slack وقتی دانلود فایل‌های Slack موفق شود و محدودیت‌های اندازه اجازه دهند، می‌تواند رسانهٔ دانلودشده را به turn agent پیوست کند. فایل‌های تصویری می‌توانند از مسیر درک رسانه عبور داده شوند یا مستقیماً به یک مدل پاسخ سازگار با vision داده شوند؛ فایل‌های دیگر به‌جای اینکه به‌عنوان ورودی تصویر در نظر گرفته شوند، به‌عنوان context فایل قابل دانلود نگه داشته می‌شوند.

### انواع رسانهٔ پشتیبانی‌شده

| نوع رسانه                      | منبع                | رفتار فعلی                                                                         | نکات                                                                      |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| تصاویر JPEG / PNG / GIF / WebP | URL فایل Slack       | دانلود و برای پردازش سازگار با vision به turn پیوست می‌شود                       | سقف هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض 20 MB)                 |
| فایل‌های PDF                   | URL فایل Slack       | دانلود و به‌عنوان context فایل برای ابزارهایی مانند `download-file` یا `pdf` ارائه می‌شود | ورودی Slack به‌صورت خودکار PDFها را به ورودی image-vision تبدیل نمی‌کند |
| فایل‌های دیگر                  | URL فایل Slack       | در صورت امکان دانلود و به‌عنوان context فایل ارائه می‌شود                       | فایل‌های باینری به‌عنوان ورودی تصویر در نظر گرفته نمی‌شوند              |
| پاسخ‌های رشته‌ای               | فایل‌های آغازگر رشته | وقتی پاسخ رسانهٔ مستقیم ندارد، فایل‌های پیام ریشه می‌توانند به‌عنوان context hydrate شوند | آغازگرهای فقط‌فایل از placeholder پیوست استفاده می‌کنند                 |
| پیام‌های چندتصویری             | چند فایل Slack       | هر فایل مستقل ارزیابی می‌شود                                                     | پردازش Slack به هشت فایل در هر پیام محدود می‌شود                         |

### خط لولهٔ ورودی

وقتی یک پیام Slack با پیوست‌های فایل برسد:

1. OpenClaw فایل را با استفاده از توکن ربات (`xoxb-...`) از URL خصوصی Slack دانلود می‌کند.
2. در صورت موفقیت، فایل در ذخیره‌گاه رسانه نوشته می‌شود.
3. مسیرهای رسانهٔ دانلودشده و نوع‌های محتوا به زمینهٔ ورودی افزوده می‌شوند.
4. مسیرهای مدل/ابزاری که قابلیت تصویر دارند می‌توانند از پیوست‌های تصویری آن زمینه استفاده کنند.
5. فایل‌های غیرتصویری همچنان به‌صورت فرادادهٔ فایل یا ارجاع‌های رسانه برای ابزارهایی که می‌توانند آن‌ها را مدیریت کنند در دسترس می‌مانند.

### وراثت پیوست از ریشهٔ رشته‌گفت‌وگو

وقتی پیامی در یک رشته‌گفت‌وگو می‌رسد (والد `thread_ts` دارد):

- اگر خود پاسخ رسانهٔ مستقیم نداشته باشد و پیام ریشهٔ گنجانده‌شده فایل داشته باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان زمینهٔ آغازگر رشته‌گفت‌وگو بارگذاری کند.
- پیوست‌های مستقیم پاسخ بر پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و متن ندارد با یک جانگه‌دار پیوست نمایش داده می‌شود تا مسیر جایگزین همچنان بتواند فایل‌های آن را شامل شود.

### مدیریت چند پیوست

وقتی یک پیام Slack شامل چند پیوست فایل باشد:

- هر پیوست به‌طور مستقل از طریق خط لولهٔ رسانه پردازش می‌شود.
- ارجاع‌های رسانهٔ دانلودشده در زمینهٔ پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در payload رویداد پیروی می‌کند.
- شکست در دانلود یک پیوست، پیوست‌های دیگر را مسدود نمی‌کند.

### محدودیت‌های اندازه، دانلود و مدل

- **سقف اندازه**: پیش‌فرض 20 MB برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل تنظیم است.
- **شکست‌های دانلود**: فایل‌هایی که Slack نمی‌تواند ارائه کند، URLهای منقضی‌شده، فایل‌های غیرقابل‌دسترسی، فایل‌های بیش‌ازحد بزرگ، و پاسخ‌های HTML احراز هویت/ورود Slack به‌جای گزارش‌شدن به‌عنوان قالب‌های پشتیبانی‌نشده، نادیده گرفته می‌شوند.
- **مدل بینایی**: تحلیل تصویر وقتی مدل پاسخ فعال از بینایی پشتیبانی کند از همان مدل استفاده می‌کند، یا از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel`.

### محدودیت‌های شناخته‌شده

| سناریو                                  | رفتار فعلی                                                                           | راه‌حل جایگزین                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| URL فایل Slack منقضی‌شده                | فایل نادیده گرفته می‌شود؛ خطایی نمایش داده نمی‌شود                                   | فایل را دوباره در Slack بارگذاری کنید                                             |
| مدل بینایی پیکربندی نشده است            | پیوست‌های تصویری به‌عنوان ارجاع‌های رسانه ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند | `agents.defaults.imageModel` را پیکربندی کنید یا از مدل پاسخ دارای قابلیت بینایی استفاده کنید |
| تصاویر بسیار بزرگ (> 20 MB به‌صورت پیش‌فرض) | طبق سقف اندازه نادیده گرفته می‌شوند                                                  | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید                |
| پیوست‌های بازارسال‌شده/اشتراک‌گذاری‌شده | متن و رسانه‌های تصویر/فایل میزبانی‌شده در Slack به‌صورت بهترین تلاش پردازش می‌شوند  | مستقیماً در رشته‌گفت‌وگوی OpenClaw دوباره به اشتراک بگذارید                      |
| پیوست‌های PDF                           | به‌عنوان زمینهٔ فایل/رسانه ذخیره می‌شوند، نه اینکه به‌طور خودکار از مسیر بینایی تصویر عبور کنند | برای فرادادهٔ فایل از `download-file` یا برای تحلیل PDF از ابزار `pdf` استفاده کنید |

### مستندات مرتبط

- [خط لولهٔ درک رسانه](/fa/nodes/media-understanding)
- [ابزار PDF](/fa/tools/pdf)
- حماسه: [#51349](https://github.com/openclaw/openclaw/issues/51349) — فعال‌سازی بینایی پیوست‌های Slack
- آزمون‌های رگرسیون: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- راستی‌آزمایی زنده: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Slack را به Gateway جفت کنید.
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
    کاتالوگ فرمان‌ها و رفتار.
  </Card>
</CardGroup>
