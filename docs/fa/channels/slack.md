---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی حالت سوکت/HTTP در Slack
summary: راه‌اندازی Slack و رفتار زمان اجرا (حالت سوکت + URLهای درخواست HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-03T21:27:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: d902fbbad23cee9b3f0ab7d240845b7b229e2d2507c5ea1d1a0fa3baa915d80a
    source_path: channels/slack.md
    workflow: 16
---

آماده‌ی تولید برای پیام‌های مستقیم و کانال‌ها از طریق یکپارچه‌سازی‌های برنامه‌ی Slack. حالت پیش‌فرض Socket Mode است؛ HTTP Request URLs نیز پشتیبانی می‌شوند.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Slack به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی و کاتالوگ فرمان‌ها.
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
        در تنظیمات برنامه‌ی Slack دکمه‌ی **[ایجاد برنامه جدید](https://api.slack.com/apps/new)** را فشار دهید:

        - گزینه‌ی **از یک manifest** را انتخاب کنید و یک فضای کاری برای برنامه‌ی خود برگزینید
        - [manifest نمونه](#manifest-and-scope-checklist) زیر را جای‌گذاری کنید و برای ایجاد ادامه دهید
        - یک **توکن سطح برنامه** (`xapp-...`) با `connections:write` بسازید
        - برنامه را نصب کنید و **Bot Token** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

      </Step>

      <Step title="Configure OpenClaw">

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
        در تنظیمات برنامه‌ی Slack دکمه‌ی **[ایجاد برنامه جدید](https://api.slack.com/apps/new)** را فشار دهید:

        - گزینه‌ی **از یک manifest** را انتخاب کنید و یک فضای کاری برای برنامه‌ی خود برگزینید
        - [manifest نمونه](#manifest-and-scope-checklist) را جای‌گذاری کنید و URLها را پیش از ایجاد به‌روزرسانی کنید
        - **Signing Secret** را برای اعتبارسنجی درخواست ذخیره کنید
        - برنامه را نصب کنید و **Bot Token** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## تنظیم انتقال در Socket Mode

OpenClaw به‌طور پیش‌فرض برای Socket Mode زمان‌انتظار pong کلاینت Slack SDK را روی ۱۵ ثانیه تنظیم می‌کند. تنظیمات انتقال را فقط زمانی بازنویسی کنید که به تنظیمات ویژه‌ی فضای کاری یا میزبان نیاز دارید:

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

این را فقط برای فضاهای کاری Socket Mode استفاده کنید که زمان‌انتظار pong وب‌سوکت Slack یا server-ping را ثبت می‌کنند، یا روی میزبان‌هایی اجرا می‌شوند که گرسنگی حلقه‌ی رویداد در آن‌ها شناخته‌شده است. `clientPingTimeout` زمان انتظار برای pong پس از ارسال ping کلاینت توسط SDK است؛ `serverPingTimeout` زمان انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای برنامه وضعیت برنامه باقی می‌مانند، نه سیگنال‌های زنده‌بودن انتقال.

## چک‌لیست manifest و scope

manifest پایه‌ی برنامه‌ی Slack برای Socket Mode و HTTP Request URLs یکسان است. فقط بلوک `settings` (و `url` فرمان slash) تفاوت دارد.

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

برای **حالت HTTP Request URLs**، `settings` را با گونه‌ی HTTP جایگزین کنید و به هر فرمان slash مقدار `url` اضافه کنید. URL عمومی لازم است:

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

### تنظیمات manifest تکمیلی

قابلیت‌های متفاوتی را نمایش دهید که پیش‌فرض‌های بالا را گسترش می‌دهند.

manifest پیش‌فرض، زبانه‌ی **Home** در Slack App Home را فعال می‌کند و در `app_home_opened` مشترک می‌شود. وقتی عضوی از فضای کاری زبانه‌ی Home را باز می‌کند، OpenClaw یک نمای Home پیش‌فرض و امن را با `views.publish` منتشر می‌کند؛ هیچ payload مکالمه یا پیکربندی خصوصی در آن گنجانده نمی‌شود. زبانه‌ی **Messages** برای پیام‌های مستقیم Slack فعال می‌ماند.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    چندین [فرمان slash بومی](#commands-and-slash-behavior) را می‌توان به‌جای یک فرمان پیکربندی‌شده‌ی واحد، با ظرافت‌های بیشتر استفاده کرد:

    - از `/agentstatus` به‌جای `/status` استفاده کنید، چون فرمان `/status` رزرو شده است.
    - بیش از ۲۵ فرمان slash را نمی‌توان هم‌زمان در دسترس قرار داد.

    بخش فعلی `features.slash_commands` خود را با زیرمجموعه‌ای از [فرمان‌های در دسترس](/fa/tools/slash-commands#command-list) جایگزین کنید:

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
```

      </Tab>
      <Tab title="HTTP Request URLs">
        از همان فهرست `slash_commands` بالا برای Socket Mode استفاده کنید و به هر ورودی `"url": "https://gateway-host.example.com/slack/events"` اضافه کنید. نمونه:

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
  <Accordion title="دامنه‌های نویسندگی اختیاری (عملیات نوشتن)">
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض برنامه Slack، از هویت عامل فعال (نام کاربری و آیکن سفارشی) استفاده کنند، دامنه ربات `chat:write.customize` را اضافه کنید.

    اگر از آیکن ایموجی استفاده می‌کنید، Slack انتظار نحو `:emoji_name:` را دارد.

  </Accordion>
  <Accordion title="دامنه‌های اختیاری توکن کاربر (عملیات خواندن)">
    اگر `channels.slack.userToken` را پیکربندی کنید، دامنه‌های رایج خواندن عبارت‌اند از:

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
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های متن ساده
  یا اشیای SecretRef را می‌پذیرند.
- توکن‌های پیکربندی، fallback محیط را override می‌کنند.
- fallback محیطی `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
- `userToken` (`xoxp-...`) فقط در پیکربندی است (بدون fallback محیط) و به‌طور پیش‌فرض رفتار فقط‌خواندنی دارد (`userTokenReadOnly: true`).

رفتار snapshot وضعیت:

- بازرسی حساب Slack فیلدهای `*Source` و `*Status` را برای هر credential
  ردیابی می‌کند (`botToken`، `appToken`، `signingSecret`، `userToken`).
- وضعیت `available`، `configured_unavailable` یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا منبع secret غیر-inline دیگری پیکربندی شده، اما مسیر فرمان/runtime فعلی
  نتوانسته مقدار واقعی را resolve کند.
- در حالت HTTP، `signingSecretStatus` گنجانده می‌شود؛ در Socket Mode،
  جفت لازم `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای actionها/خواندن‌های directory، وقتی توکن کاربر پیکربندی شده باشد، می‌تواند ترجیح داده شود. برای نوشتن‌ها، توکن ربات همچنان ترجیح داده می‌شود؛ نوشتن‌های توکن کاربر فقط وقتی مجازند که `userTokenReadOnly: false` باشد و توکن ربات در دسترس نباشد.
</Tip>

## Actionها و gateها

actionهای Slack با `channels.slack.actions.*` کنترل می‌شوند.

گروه‌های action موجود در ابزارهای فعلی Slack:

| گروه      | پیش‌فرض |
| ---------- | ------- |
| messages   | فعال |
| reactions  | فعال |
| pins       | فعال |
| memberInfo | فعال |
| emojiList  | فعال |

actionهای پیام فعلی Slack شامل `send`، `upload-file`، `download-file`، `read`، `edit`، `delete`، `pin`، `unpin`، `list-pins`، `member-info` و `emoji-list` هستند. `download-file` شناسه‌های فایل Slack نشان‌داده‌شده در placeholderهای فایل ورودی را می‌پذیرد و برای تصاویر، preview تصویر یا برای انواع فایل دیگر، فراداده فایل محلی برمی‌گرداند.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست DM">
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

    `channels.slack.dm.policy` و `channels.slack.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    Pairing در DMها از `openclaw pairing approve slack <code>` استفاده می‌کند.

  </Tab>

  <Tab title="سیاست کانال">
    `channels.slack.groupPolicy` نحوه مدیریت کانال را کنترل می‌کند:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist کانال زیر `channels.slack.channels` قرار دارد و **باید از شناسه‌های پایدار کانال Slack** (برای مثال `C12345678`) به‌عنوان کلیدهای پیکربندی استفاده کند.

    نکته runtime: اگر `channels.slack` کاملاً وجود نداشته باشد (راه‌اندازی فقط با env)، runtime به `groupPolicy="allowlist"` برمی‌گردد و یک هشدار log می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    resolve نام/شناسه:

    - ورودی‌های allowlist کانال و ورودی‌های allowlist DM هنگام startup، وقتی دسترسی توکن اجازه دهد، resolve می‌شوند
    - ورودی‌های نام کانال resolveنشده همان‌طور که پیکربندی شده‌اند نگه داشته می‌شوند، اما به‌طور پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند
    - authorization ورودی و مسیریابی کانال به‌طور پیش‌فرض ID-first هستند؛ تطبیق مستقیم username/slug به `channels.slack.dangerouslyAllowNameMatching: true` نیاز دارد

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) زیر `groupPolicy: "allowlist"` تطبیق نمی‌یابند. جست‌وجوی کانال به‌طور پیش‌فرض ID-first است، بنابراین یک کلید مبتنی بر نام هرگز با موفقیت route نمی‌شود و همه پیام‌های آن کانال بی‌صدا block می‌شوند. این با `groupPolicy: "open"` فرق دارد، جایی که کلید کانال برای مسیریابی لازم نیست و یک کلید مبتنی بر نام ظاهراً کار می‌کند.

    همیشه از شناسه کانال Slack به‌عنوان کلید استفاده کنید. برای یافتن آن: روی کانال در Slack راست‌کلیک کنید → **Copy link** — شناسه (`C...`) در انتهای URL ظاهر می‌شود.

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

  <Tab title="Mentionها و کاربران کانال">
    پیام‌های کانال به‌طور پیش‌فرض با mention gate می‌شوند.

    منابع mention:

    - mention صریح برنامه (`<@botId>`)
    - mention گروه کاربری Slack (`<!subteam^S...>`) وقتی کاربر ربات عضو آن گروه کاربری باشد؛ به `usergroups:read` نیاز دارد
    - الگوهای regex برای mention (`agents.list[].groupChat.mentionPatterns`، fallback به `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی thread پاسخ به ربات (وقتی `thread.requireExplicitMention` برابر `true` باشد غیرفعال می‌شود)

    کنترل‌های هر کانال (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق resolve هنگام startup یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - قالب کلید `toolsBySender`: `id:`، `e164:`، `username:`، `name:` یا wildcard `"*"`
      (کلیدهای قدیمی بدون prefix همچنان فقط به `id:` نگاشت می‌شوند)

    `allowBots` برای کانال‌ها و کانال‌های خصوصی محافظه‌کارانه است: پیام‌های room که توسط ربات نوشته شده‌اند فقط وقتی پذیرفته می‌شوند که ربات فرستنده صراحتاً در allowlist `users` آن room فهرست شده باشد، یا وقتی حداقل یک شناسه صریح owner Slack از `channels.slack.allowFrom` در حال حاضر عضو room باشد. wildcardها و ورودی‌های owner با display-name حضور owner را برآورده نمی‌کنند. حضور owner از `conversations.members` در Slack استفاده می‌کند؛ مطمئن شوید برنامه scope خواندن متناظر برای نوع room را دارد (`channels:read` برای کانال‌های عمومی، `groups:read` برای کانال‌های خصوصی). اگر جست‌وجوی member شکست بخورد، OpenClaw پیام room نوشته‌شده توسط ربات را drop می‌کند.

  </Tab>
</Tabs>

## Threading، sessionها و tagهای پاسخ

- DMها به‌صورت `direct` route می‌شوند؛ کانال‌ها به‌صورت `channel`؛ MPIMها به‌صورت `group`.
- bindingهای route در Slack شناسه‌های خام peer به‌همراه فرم‌های target در Slack مانند `channel:C12345678`، `user:U12345678` و `<@U12345678>` را می‌پذیرند.
- با مقدار پیش‌فرض `session.dmScope=main`، DMهای Slack به session اصلی عامل collapse می‌شوند.
- sessionهای کانال: `agent:<agentId>:slack:channel:<channelId>`.
- پاسخ‌های thread می‌توانند در صورت کاربرد، suffixهای session thread (`:thread:<threadTs>`) ایجاد کنند.
- مقدار پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ مقدار پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` کنترل می‌کند هنگام شروع یک session thread جدید، چند پیام thread موجود fetch شوند (پیش‌فرض `20`؛ برای غیرفعال‌سازی `0` تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، mentionهای ضمنی thread را suppress می‌کند تا ربات فقط به mentionهای صریح `@bot` داخل threadها پاسخ دهد، حتی وقتی ربات قبلاً در thread مشارکت کرده باشد. بدون این، پاسخ‌ها در threadی که ربات در آن مشارکت کرده از gate مربوط به `requireMention` عبور می‌کنند.

کنترل‌های threading پاسخ:

- `channels.slack.replyToMode`: `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: برای هر `direct|group|channel`
- fallback قدیمی برای chatهای مستقیم: `channels.slack.dm.replyToMode`

tagهای دستی پاسخ پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` **همه** threading پاسخ در Slack را غیرفعال می‌کند، از جمله tagهای صریح `[[reply_to_*]]`. این با Telegram فرق دارد، جایی که tagهای صریح همچنان در حالت `"off"` رعایت می‌شوند. threadهای Slack پیام‌ها را از کانال پنهان می‌کنند، در حالی که پاسخ‌های Telegram به‌صورت inline قابل مشاهده می‌مانند.
</Note>

## واکنش‌های Ack

`ackReaction` وقتی OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی acknowledgement ارسال می‌کند.

ترتیب resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

نکات:

- Slack انتظار shortcodeها را دارد (برای مثال `"eyes"`).
- برای غیرفعال‌سازی واکنش برای حساب Slack یا به‌صورت سراسری، از `""` استفاده کنید.

## Streaming متن

`channels.slack.streaming` رفتار preview زنده را کنترل می‌کند:

- `off`: streaming preview زنده را غیرفعال می‌کند.
- `partial` (پیش‌فرض): متن preview را با آخرین خروجی partial جایگزین می‌کند.
- `block`: updateهای preview تکه‌تکه را append می‌کند.
- `progress`: هنگام تولید، متن وضعیت پیشرفت را نشان می‌دهد، سپس متن نهایی را ارسال می‌کند.
- `streaming.preview.toolProgress`: وقتی preview پیش‌نویس فعال است، updateهای tool/progress را به همان پیام preview ویرایش‌شده route می‌کند (پیش‌فرض: `true`). برای نگه داشتن پیام‌های tool/progress جداگانه، `false` تنظیم کنید.

`channels.slack.streaming.nativeTransport` streaming متن بومی Slack را وقتی `channels.slack.streaming.mode` برابر `partial` است کنترل می‌کند (پیش‌فرض: `true`).

- برای ظاهر شدن streaming متن بومی و وضعیت thread دستیار Slack، باید یک thread پاسخ در دسترس باشد. انتخاب thread همچنان از `replyToMode` پیروی می‌کند.
- کانال، group-chat و rootهای DM سطح بالا همچنان می‌توانند وقتی streaming بومی در دسترس نیست یا هیچ thread پاسخی وجود ندارد، از preview پیش‌نویس معمولی استفاده کنند.
- DMهای Slack سطح بالا به‌طور پیش‌فرض خارج از thread می‌مانند، بنابراین preview stream/status بومی به سبک thread در Slack را نشان نمی‌دهند؛ OpenClaw در عوض یک preview پیش‌نویس را در DM ارسال و ویرایش می‌کند.
- payloadهای media و غیرمتنی به delivery معمولی fallback می‌کنند.
- نتیجه‌های نهایی media/error، ویرایش‌های preview معلق را cancel می‌کنند؛ نتیجه‌های نهایی text/block واجد شرایط فقط وقتی flush می‌شوند که بتوانند preview را درجا ویرایش کنند.
- اگر streaming در میانه پاسخ شکست بخورد، OpenClaw برای payloadهای باقی‌مانده به delivery معمولی fallback می‌کند.

استفاده از preview پیش‌نویس به‌جای streaming متن بومی Slack:

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
- `channels.slack.streaming` بولی به‌طور خودکار به `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` مهاجرت می‌شود.
- `channels.slack.nativeStreaming` قدیمی به‌طور خودکار به `channels.slack.streaming.nativeTransport` مهاجرت می‌شود.

## fallback واکنش typing

`typingReaction` وقتی OpenClaw در حال پردازش یک پاسخ است، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس وقتی run تمام شد آن را حذف می‌کند. این بیشتر بیرون از پاسخ‌های thread مفید است، چون آن‌ها از نشانگر وضعیت پیش‌فرض "is typing..." استفاده می‌کنند.

ترتیب resolve:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکات:

- Slack به shortcodeها نیاز دارد (برای مثال `"hourglass_flowing_sand"`).
- واکنش به‌صورت بهترین تلاش انجام می‌شود و پس از تکمیل مسیر پاسخ یا شکست، پاک‌سازی به‌طور خودکار تلاش می‌شود.

## رسانه، قطعه‌بندی و تحویل

<AccordionGroup>
  <Accordion title="پیوست‌های ورودی">
    پیوست‌های فایل Slack از URLهای خصوصی میزبانی‌شده توسط Slack دانلود می‌شوند (جریان درخواست با احراز هویت توکن) و وقتی دریافت موفق باشد و محدودیت‌های اندازه اجازه دهند، در ذخیره‌گاه رسانه نوشته می‌شوند. جای‌نگهدارهای فایل شامل `fileId` مربوط به Slack هستند تا عامل‌ها بتوانند فایل اصلی را با `download-file` دریافت کنند.

    دانلودها از مهلت‌های زمانی محدود برای بیکاری و کل زمان استفاده می‌کنند. اگر بازیابی فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به جای‌نگهدار فایل بازمی‌گردد.

    سقف اندازه ورودی در زمان اجرا به‌طور پیش‌فرض `20MB` است، مگر اینکه با `channels.slack.mediaMaxMb` بازنویسی شود.

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

    پیام‌های مستقیم Slack فقط متنی/بلوکی می‌توانند مستقیما به شناسه‌های کاربر ارسال شوند؛ بارگذاری فایل و ارسال‌های رشته‌ای ابتدا پیام مستقیم را از طریق APIهای مکالمه Slack باز می‌کنند، چون این مسیرها به یک شناسه مکالمه مشخص نیاز دارند.

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

فرمان‌های بومی به [تنظیمات مانیفست اضافی](#additional-manifest-settings) در برنامه Slack شما نیاز دارند و به‌جای آن با `channels.slack.commands.native: true` یا `commands.native: true` در پیکربندی‌های سراسری فعال می‌شوند.

- حالت خودکار فرمان بومی برای Slack **خاموش** است، بنابراین `commands.native: "auto"` فرمان‌های بومی Slack را فعال نمی‌کند.

```txt
/help
```

منوهای آرگومان بومی از راهبرد رندر تطبیقی استفاده می‌کنند که پیش از ارسال مقدار گزینه انتخاب‌شده، یک مودال تأیید نشان می‌دهد:

- تا 5 گزینه: بلوک‌های دکمه
- 6 تا 100 گزینه: منوی انتخاب ایستا
- بیش از 100 گزینه: انتخاب خارجی با فیلتر ناهمگام گزینه‌ها وقتی کنترل‌کننده‌های گزینه‌های تعامل‌پذیری در دسترس باشند
- فراتر از محدودیت‌های Slack: مقادیر گزینه کدگذاری‌شده به دکمه‌ها بازمی‌گردند

```txt
/think
```

جلسه‌های اسلش از کلیدهای ایزوله مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای فرمان‌ها را با استفاده از `CommandTargetSessionKey` به جلسه مکالمه مقصد هدایت می‌کنند.

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

وقتی فعال باشد، عامل‌ها می‌توانند دستورهای پاسخ مخصوص Slack تولید کنند:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

این دستورها به Slack Block Kit کامپایل می‌شوند و کلیک‌ها یا انتخاب‌ها را از طریق مسیر رویداد تعامل موجود Slack برمی‌گردانند.

نکات:

- این رابط کاربری مخصوص Slack است. کانال‌های دیگر دستورهای Slack Block Kit را به سامانه‌های دکمه‌ای خودشان ترجمه نمی‌کنند.
- مقادیر callback تعاملی، توکن‌های مبهم تولیدشده توسط OpenClaw هستند، نه مقادیر خام نوشته‌شده توسط عامل.
- اگر بلوک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit فراتر بروند، OpenClaw به‌جای ارسال payload نامعتبر بلوک‌ها، به پاسخ متنی اصلی بازمی‌گردد.

## تأییدهای Exec در Slack

Slack می‌تواند به‌جای بازگشت به رابط وب یا ترمینال، با دکمه‌ها و تعاملات تعاملی به‌عنوان یک سرویس‌گیرنده تأیید بومی عمل کند.

- تأییدهای Exec از `channels.slack.execApprovals.*` برای مسیریابی بومی پیام مستقیم/کانال استفاده می‌کنند.
- تأییدهای Plugin همچنان می‌توانند از طریق همان سطح دکمه بومی Slack حل شوند، وقتی درخواست از قبل در Slack فرود آمده باشد و نوع شناسه تأیید `plugin:` باشد.
- مجوز تأییدکننده همچنان اعمال می‌شود: فقط کاربرانی که به‌عنوان تأییدکننده شناسایی شده‌اند می‌توانند از طریق Slack درخواست‌ها را تأیید یا رد کنند.

این از همان سطح دکمه تأیید مشترک با کانال‌های دیگر استفاده می‌کند. وقتی `interactivity` در تنظیمات برنامه Slack شما فعال باشد، اعلان‌های تأیید به‌صورت دکمه‌های Block Kit مستقیما در مکالمه رندر می‌شوند.
وقتی آن دکمه‌ها حاضر باشند، تجربه کاربری اصلی تأیید هستند؛ OpenClaw
فقط وقتی باید یک فرمان دستی `/approve` اضافه کند که نتیجه ابزار بگوید تأییدهای
گفتگو در دسترس نیستند یا تأیید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` بازمی‌گردد)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`, `sessionFilter`

Slack وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و حداقل یک
تأییدکننده resolve شود، تأییدهای exec بومی را به‌طور خودکار فعال می‌کند. برای غیرفعال کردن صریح Slack به‌عنوان سرویس‌گیرنده تأیید بومی، `enabled: false` را تنظیم کنید.
برای اجبار فعال شدن تأییدهای بومی وقتی تأییدکننده‌ها resolve می‌شوند، `enabled: true` را تنظیم کنید.

رفتار پیش‌فرض بدون پیکربندی صریح تأیید exec در Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

پیکربندی صریح بومی Slack فقط وقتی لازم است که بخواهید تأییدکننده‌ها را بازنویسی کنید، فیلتر اضافه کنید، یا
تحویل به گفتگوی مبدا را انتخاب کنید:

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

بازارسال مشترک `approvals.exec` جدا است. فقط وقتی از آن استفاده کنید که اعلان‌های تأیید exec باید همچنین
به گفتگوهای دیگر یا مقصدهای صریح خارج از باند مسیریابی شوند. بازارسال مشترک `approvals.plugin` نیز
جدا است؛ دکمه‌های بومی Slack همچنان می‌توانند تأییدهای Plugin را حل کنند، وقتی آن درخواست‌ها از قبل
در Slack فرود آمده باشند.

فرمان `/approve` در همان گفتگو نیز در کانال‌ها و پیام‌های مستقیم Slack که از قبل از فرمان‌ها پشتیبانی می‌کنند کار می‌کند. برای مدل کامل بازارسال تأیید، [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

## رویدادها و رفتار عملیاتی

- ویرایش‌ها/حذف‌های پیام به رویدادهای سامانه نگاشت می‌شوند.
- پخش‌های رشته‌ای (پاسخ‌های رشته‌ای «همچنین به کانال ارسال شود») به‌عنوان پیام‌های عادی کاربر پردازش می‌شوند.
- رویدادهای افزودن/حذف واکنش به رویدادهای سامانه نگاشت می‌شوند.
- رویدادهای پیوستن/خروج عضو، ایجاد/تغییرنام کانال، و افزودن/حذف سنجاق به رویدادهای سامانه نگاشت می‌شوند.
- وقتی `configWrites` فعال باشد، `channel_id_changed` می‌تواند کلیدهای پیکربندی کانال را مهاجرت دهد.
- فراداده موضوع/هدف کانال به‌عنوان زمینه نامطمئن در نظر گرفته می‌شود و می‌تواند به زمینه مسیریابی تزریق شود.
- آغازگر رشته و بذرگذاری زمینه اولیه تاریخچه رشته، در صورت کاربرد، بر اساس allowlistهای فرستنده پیکربندی‌شده فیلتر می‌شوند.
- کنش‌های بلوک و تعاملات مودال رویدادهای ساخت‌یافته سامانه با قالب `Slack interaction: ...` و فیلدهای payload غنی تولید می‌کنند:
  - کنش‌های بلوک: مقادیر انتخاب‌شده، برچسب‌ها، مقادیر انتخابگر، و فراداده `workflow_*`
  - رویدادهای `view_submission` و `view_closed` مودال همراه با فراداده کانال مسیریابی‌شده و ورودی‌های فرم

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="فیلدهای مهم Slack">

- حالت/احراز هویت: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- دسترسی پیام مستقیم: `dm.enabled`, `dmPolicy`, `allowFrom` (میراثی: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- کلید سازگاری: `dangerouslyAllowNameMatching` (شکستن محدودیت در اضطرار؛ مگر در صورت نیاز خاموش نگه دارید)
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
    - allowlist کانال (`channels.slack.channels`) — **کلیدها باید شناسه کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام در `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، چون مسیریابی کانال به‌طور پیش‌فرض ابتدا بر اساس شناسه است. برای یافتن شناسه: روی کانال در Slack راست‌کلیک کنید ← **Copy link** — مقدار `C...` در انتهای URL شناسه کانال است.
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
    - `channels.slack.dmPolicy` (یا مقدار میراثی `channels.slack.dm.policy`)
    - تأییدهای جفت‌سازی / ورودی‌های allowlist
    - رویدادهای پیام مستقیم Slack Assistant: لاگ‌های پرجزئیات که به `drop message_changed` اشاره می‌کنند
      معمولا یعنی Slack یک رویداد ویرایش‌شده رشته Assistant فرستاده است بدون اینکه
      فرستنده انسانی قابل بازیابی در فراداده پیام وجود داشته باشد

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="حالت Socket وصل نمی‌شود">
    توکن‌های bot + app و فعال‌سازی Socket Mode را در تنظیمات برنامه Slack اعتبارسنجی کنید.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان دهد، حساب Slack
    پیکربندی شده است اما runtime فعلی نتوانسته مقدار پشتیبانی‌شده با SecretRef را
    resolve کند.

  </Accordion>

  <Accordion title="حالت HTTP رویداد دریافت نمی‌کند">
    اعتبارسنجی کنید:

    - راز امضا
    - مسیر Webhook
    - URLهای درخواست Slack (رویدادها + تعامل‌پذیری + فرمان‌های اسلش)
    - `webhookPath` یکتا برای هر حساب HTTP

    اگر `signingSecretStatus: "configured_unavailable"` در snapshotهای حساب
    ظاهر شود، حساب HTTP پیکربندی شده است اما runtime فعلی نتوانسته راز امضای
    پشتیبانی‌شده با SecretRef را resolve کند.

  </Accordion>

  <Accordion title="فرمان‌های بومی/اسلش اجرا نمی‌شوند">
    بررسی کنید که منظورتان کدام بوده است:

    - حالت فرمان بومی (`channels.slack.commands.native: true`) با فرمان‌های اسلش متناظر ثبت‌شده در Slack
    - یا حالت یک فرمان اسلش (`channels.slack.slashCommand.enabled: true`)

    همچنین `commands.useAccessGroups` و allowlistهای کانال/کاربر را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مرجع بینایی پیوست

Slack وقتی دانلود فایل‌های Slack موفق باشد و محدودیت‌های اندازه اجازه دهند، می‌تواند رسانه دانلودشده را به نوبت عامل پیوست کند. فایل‌های تصویر می‌توانند از مسیر درک رسانه عبور کنند یا مستقیما به یک مدل پاسخ مجهز به بینایی داده شوند؛ فایل‌های دیگر به‌عنوان زمینه فایل قابل دانلود نگه داشته می‌شوند، نه اینکه به‌عنوان ورودی تصویر در نظر گرفته شوند.

### انواع رسانه پشتیبانی‌شده

| نوع رسانه | منبع | رفتار فعلی | یادداشت‌ها |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| تصاویر JPEG / PNG / GIF / WebP | نشانی URL فایل Slack | دانلود می‌شود و برای پردازش با قابلیت بینایی به نوبت پیوست می‌شود | سقف هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض 20 MB) |
| فایل‌های PDF | نشانی URL فایل Slack | دانلود می‌شود و به‌عنوان زمینهٔ فایل برای ابزارهایی مانند `download-file` یا `pdf` ارائه می‌شود | ورودی Slack فایل‌های PDF را به‌طور خودکار به ورودی بینایی تصویر تبدیل نمی‌کند |
| فایل‌های دیگر | نشانی URL فایل Slack | در صورت امکان دانلود می‌شود و به‌عنوان زمینهٔ فایل ارائه می‌شود | فایل‌های دودویی به‌عنوان ورودی تصویر در نظر گرفته نمی‌شوند |
| پاسخ‌های رشته | فایل‌های آغازگر رشته | وقتی پاسخ رسانهٔ مستقیم ندارد، فایل‌های پیام ریشه می‌توانند به‌عنوان زمینه آماده‌سازی شوند | آغازگرهای فقط‌فایل از جای‌نگهدار پیوست استفاده می‌کنند |
| پیام‌های چندتصویری | چند فایل Slack | هر فایل به‌طور مستقل ارزیابی می‌شود | پردازش Slack به هشت فایل در هر پیام محدود است |

### خط لولهٔ ورودی

وقتی یک پیام Slack همراه با پیوست‌های فایل می‌رسد:

1. OpenClaw فایل را از نشانی URL خصوصی Slack با استفاده از توکن ربات (`xoxb-...`) دانلود می‌کند.
2. در صورت موفقیت، فایل در ذخیره‌گاه رسانه نوشته می‌شود.
3. مسیرهای رسانهٔ دانلودشده و نوع‌های محتوا به زمینهٔ ورودی افزوده می‌شوند.
4. مسیرهای مدل/ابزار دارای قابلیت تصویر می‌توانند از پیوست‌های تصویر آن زمینه استفاده کنند.
5. فایل‌های غیرتصویری به‌صورت فرادادهٔ فایل یا ارجاع‌های رسانه برای ابزارهایی که می‌توانند آن‌ها را پردازش کنند در دسترس می‌مانند.

### وراثت پیوست از ریشهٔ رشته

وقتی پیامی در یک رشته می‌رسد (دارای والد `thread_ts` است):

- اگر خود پاسخ رسانهٔ مستقیم نداشته باشد و پیام ریشهٔ شامل‌شده فایل داشته باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان زمینهٔ آغازگر رشته آماده‌سازی کند.
- پیوست‌های مستقیم پاسخ بر پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و متن ندارد با یک جای‌نگهدار پیوست نمایش داده می‌شود تا مسیر جایگزین همچنان بتواند فایل‌های آن را شامل کند.

### پردازش چندپیوستی

وقتی یک پیام Slack شامل چند پیوست فایل باشد:

- هر پیوست به‌طور مستقل از خط لولهٔ رسانه پردازش می‌شود.
- ارجاع‌های رسانهٔ دانلودشده در زمینهٔ پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در payload رویداد پیروی می‌کند.
- شکست دانلود یک پیوست، پیوست‌های دیگر را مسدود نمی‌کند.

### محدودیت‌های اندازه، دانلود و مدل

- **سقف اندازه**: پیش‌فرض 20 MB برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل پیکربندی است.
- **شکست‌های دانلود**: فایل‌هایی که Slack نمی‌تواند ارائه کند، نشانی‌های URL منقضی‌شده، فایل‌های غیرقابل‌دسترسی، فایل‌های بیش‌ازحد بزرگ و پاسخ‌های HTML احراز هویت/ورود Slack به‌جای گزارش شدن به‌عنوان قالب‌های پشتیبانی‌نشده، نادیده گرفته می‌شوند.
- **مدل بینایی**: تحلیل تصویر از مدل پاسخ فعال استفاده می‌کند وقتی از بینایی پشتیبانی کند، یا از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel`.

### محدودیت‌های شناخته‌شده

| سناریو | رفتار فعلی | راهکار جایگزین |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| نشانی URL منقضی‌شدهٔ فایل Slack | فایل نادیده گرفته می‌شود؛ هیچ خطایی نمایش داده نمی‌شود | فایل را دوباره در Slack بارگذاری کنید |
| مدل بینایی پیکربندی نشده است | پیوست‌های تصویر به‌عنوان ارجاع‌های رسانه ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند | `agents.defaults.imageModel` را پیکربندی کنید یا از مدل پاسخ دارای قابلیت بینایی استفاده کنید |
| تصاویر بسیار بزرگ (> 20 MB به‌طور پیش‌فرض) | بر اساس سقف اندازه نادیده گرفته می‌شود | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید |
| پیوست‌های بازفرستاده‌شده/اشتراک‌گذاری‌شده | متن و رسانهٔ تصویر/فایل میزبانی‌شده در Slack به‌صورت بهترین تلاش پردازش می‌شوند | مستقیماً در رشتهٔ OpenClaw دوباره به‌اشتراک بگذارید |
| پیوست‌های PDF | به‌عنوان زمینهٔ فایل/رسانه ذخیره می‌شود، نه اینکه به‌طور خودکار از مسیر بینایی تصویر عبور داده شود | برای فرادادهٔ فایل از `download-file` یا برای تحلیل PDF از ابزار `pdf` استفاده کنید |

### مستندات مرتبط

- [خط لولهٔ درک رسانه](/fa/nodes/media-understanding)
- [ابزار PDF](/fa/tools/pdf)
- حماسه: [#51349](https://github.com/openclaw/openclaw/issues/51349) — فعال‌سازی بینایی پیوست‌های Slack
- آزمون‌های رگرسیون: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- راستی‌آزمایی زنده: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Slack را با Gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار کانال و DM گروهی.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="پیکربندی" icon="sliders" href="/fa/gateway/configuration">
    چیدمان پیکربندی و تقدم.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    کاتالوگ دستورها و رفتار.
  </Card>
</CardGroup>
