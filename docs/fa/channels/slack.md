---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی از حالت سوکت/HTTP در Slack
summary: راه‌اندازی Slack و رفتار زمان اجرا (حالت سوکت + URLهای درخواست HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-29T22:29:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08024bd947ddeb00a1ab3aaa3864cf31817303bbc0523902acdc539fc662e127
    source_path: channels/slack.md
    workflow: 16
---

آماده برای تولید برای پیام‌های مستقیم و کانال‌ها از طریق یکپارچه‌سازی‌های اپ Slack. حالت پیش‌فرض Socket Mode است؛ HTTP Request URLs نیز پشتیبانی می‌شوند.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Slack به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و کاتالوگ دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی بین‌کانالی و راهنماهای تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Socket Mode (پیش‌فرض)">
    <Steps>
      <Step title="ایجاد یک اپ جدید Slack">
        در تنظیمات اپ Slack، دکمه **[Create New App](https://api.slack.com/apps/new)** را فشار دهید:

        - **from a manifest** را انتخاب کنید و یک workspace برای اپ خود برگزینید
        - [مانیفست نمونه](#manifest-and-scope-checklist) زیر را جای‌گذاری کنید و برای ایجاد ادامه دهید
        - یک **App-Level Token** (`xapp-...`) با `connections:write` تولید کنید
        - اپ را نصب کنید و **Bot Token** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

      </Step>

      <Step title="پیکربندی OpenClaw">

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

      <Step title="شروع Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="ایجاد یک اپ جدید Slack">
        در تنظیمات اپ Slack، دکمه **[Create New App](https://api.slack.com/apps/new)** را فشار دهید:

        - **from a manifest** را انتخاب کنید و یک workspace برای اپ خود برگزینید
        - [مانیفست نمونه](#manifest-and-scope-checklist) را جای‌گذاری کنید و پیش از ایجاد، URLها را به‌روزرسانی کنید
        - **Signing Secret** را برای راستی‌آزمایی درخواست ذخیره کنید
        - اپ را نصب کنید و **Bot Token** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

      </Step>

      <Step title="پیکربندی OpenClaw">

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

      <Step title="شروع Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## تنظیم انتقال Socket Mode

OpenClaw به‌طور پیش‌فرض timeout مربوط به pong کلاینت Slack SDK را برای Socket Mode روی ۱۵ ثانیه تنظیم می‌کند. تنظیمات انتقال را فقط زمانی بازنویسی کنید که به تنظیم ویژه workspace یا میزبان نیاز دارید:

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

این را فقط برای workspaceهای Socket Mode استفاده کنید که timeoutهای websocket pong/server-ping مربوط به Slack را ثبت می‌کنند یا روی میزبان‌هایی با گرسنگی شناخته‌شده event-loop اجرا می‌شوند. `clientPingTimeout` زمان انتظار برای pong پس از ارسال ping کلاینت توسط SDK است؛ `serverPingTimeout` زمان انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای اپ وضعیت برنامه هستند، نه سیگنال‌های زنده‌بودن انتقال.

## چک‌لیست مانیفست و scope

مانیفست پایه اپ Slack برای Socket Mode و HTTP Request URLs یکسان است. فقط بلوک `settings` (و `url` دستور اسلش) متفاوت است.

مانیفست پایه (پیش‌فرض Socket Mode):

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

برای حالت **HTTP Request URLs**، `settings` را با گونه HTTP جایگزین کنید و به هر دستور اسلش `url` اضافه کنید. URL عمومی لازم است:

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

### تنظیمات مانیفست اضافی

قابلیت‌های متفاوتی را ارائه کنید که پیش‌فرض‌های بالا را گسترش می‌دهند.

<AccordionGroup>
  <Accordion title="دستورهای اسلش بومی اختیاری">

    می‌توان به‌جای یک دستور پیکربندی‌شده واحد، از چندین [دستور اسلش بومی](#commands-and-slash-behavior) با جزئیات بیشتر استفاده کرد:

    - از `/agentstatus` به‌جای `/status` استفاده کنید، چون دستور `/status` رزرو شده است.
    - در هر زمان نمی‌توان بیش از ۲۵ دستور اسلش را در دسترس قرار داد.

    بخش موجود `features.slash_commands` خود را با زیرمجموعه‌ای از [دستورهای موجود](/fa/tools/slash-commands#command-list) جایگزین کنید:

    <Tabs>
      <Tab title="Socket Mode (پیش‌فرض)">

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
        از همان فهرست `slash_commands` مانند Socket Mode بالا استفاده کنید و به هر مورد `"url": "https://gateway-host.example.com/slack/events"` اضافه کنید. نمونه:

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
  <Accordion title="scopeهای اختیاری نویسندگی (عملیات نوشتن)">
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض اپ Slack از هویت عامل فعال (نام کاربری و آیکون سفارشی) استفاده کنند، scope ربات `chat:write.customize` را اضافه کنید.

    اگر از آیکون emoji استفاده می‌کنید، Slack انتظار نحو `:emoji_name:` را دارد.

  </Accordion>
  <Accordion title="scopeهای اختیاری user-token (عملیات خواندن)">
    اگر `channels.slack.userToken` را پیکربندی می‌کنید، scopeهای معمول خواندن عبارت‌اند از:

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

- `botToken` + `appToken` برای Socket Mode الزامی هستند.
- حالت HTTP به `botToken` + `signingSecret` نیاز دارد.
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های متنی ساده
  یا اشیای SecretRef را می‌پذیرند.
- توکن‌های پیکربندی جایگزین env fallback می‌شوند.
- env fallback مربوط به `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
- `userToken` (`xoxp-...`) فقط در پیکربندی تنظیم می‌شود (env fallback ندارد) و به‌طور پیش‌فرض رفتار فقط‌خواندنی دارد (`userTokenReadOnly: true`).

رفتار نمای وضعیت:

- بازرسی حساب Slack برای هر credential فیلدهای `*Source` و `*Status`
  را ردیابی می‌کند (`botToken`، `appToken`، `signingSecret`، `userToken`).
- وضعیت `available`، `configured_unavailable` یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا منبع secret غیرخطی دیگری پیکربندی شده است، اما مسیر فرمان/runtime فعلی
  نتوانسته مقدار واقعی را resolve کند.
- در حالت HTTP، `signingSecretStatus` گنجانده می‌شود؛ در Socket Mode،
  جفت الزامی `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای actionها/خواندن directory، در صورت پیکربندی، user token می‌تواند ترجیح داده شود. برای نوشتن‌ها، bot token همچنان ترجیح داده می‌شود؛ نوشتن با user-token فقط زمانی مجاز است که `userTokenReadOnly: false` باشد و bot token در دسترس نباشد.
</Tip>

## Actionها و gateها

Actionهای Slack با `channels.slack.actions.*` کنترل می‌شوند.

گروه‌های action در ابزارهای فعلی Slack:

| گروه       | پیش‌فرض |
| ---------- | ------- |
| messages   | فعال |
| reactions  | فعال |
| pins       | فعال |
| memberInfo | فعال |
| emojiList  | فعال |

Actionهای فعلی پیام Slack شامل `send`، `upload-file`، `download-file`، `read`، `edit`، `delete`، `pin`، `unpin`، `list-pins`، `member-info` و `emoji-list` هستند. `download-file` شناسه‌های فایل Slack را که در placeholderهای فایل ورودی نشان داده می‌شوند می‌پذیرد و برای تصاویر، preview تصویر یا برای انواع فایل دیگر metadata فایل محلی برمی‌گرداند.

## کنترل دسترسی و routing

<Tabs>
  <Tab title="سیاست DM">
    `channels.slack.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.slack.allowFrom` allowlist canonical برای DM است.

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

    - `channels.slack.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - حساب‌های نام‌گذاری‌شده وقتی `allowFrom` خودشان تنظیم نشده باشد، `channels.slack.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌گذاری‌شده `channels.slack.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.slack.dm.policy` و `channels.slack.dm.allowFrom` مربوط به legacy همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` منتقل می‌کند.

    Pairing در DMها از `openclaw pairing approve slack <code>` استفاده می‌کند.

  </Tab>

  <Tab title="سیاست channel">
    `channels.slack.groupPolicy` نحوه مدیریت channel را کنترل می‌کند:

    - `open`
    - `allowlist`
    - `disabled`

    allowlist مربوط به channel زیر `channels.slack.channels` قرار دارد و **باید از شناسه‌های پایدار channel در Slack** (برای مثال `C12345678`) به‌عنوان کلیدهای پیکربندی استفاده کند.

    نکته runtime: اگر `channels.slack` کاملاً وجود نداشته باشد (راه‌اندازی فقط با env)، runtime به `groupPolicy="allowlist"` fallback می‌کند و یک هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    Resolve نام/شناسه:

    - entryهای allowlist مربوط به channel و entryهای allowlist مربوط به DM هنگام startup و وقتی دسترسی token اجازه دهد resolve می‌شوند
    - entryهای resolve‌نشده با نام channel همان‌طور که پیکربندی شده‌اند نگه داشته می‌شوند، اما به‌طور پیش‌فرض برای routing نادیده گرفته می‌شوند
    - authorization ورودی و routing channel به‌طور پیش‌فرض ID-first هستند؛ تطبیق مستقیم username/slug به `channels.slack.dangerouslyAllowNameMatching: true` نیاز دارد

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) زیر `groupPolicy: "allowlist"` match نمی‌شوند. lookup مربوط به channel به‌طور پیش‌فرض ID-first است، بنابراین یک کلید مبتنی بر نام هرگز با موفقیت route نمی‌شود و همه پیام‌ها در آن channel بی‌صدا مسدود می‌شوند. این با `groupPolicy: "open"` متفاوت است؛ در آن حالت کلید channel برای routing لازم نیست و یک کلید مبتنی بر نام ظاهراً کار می‌کند.

    همیشه از شناسه channel در Slack به‌عنوان کلید استفاده کنید. برای یافتن آن: روی channel در Slack راست‌کلیک کنید → **Copy link** — شناسه (`C...`) در انتهای URL ظاهر می‌شود.

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

  <Tab title="Mentionها و کاربران channel">
    پیام‌های channel به‌طور پیش‌فرض mention-gated هستند.

    منابع mention:

    - mention صریح app (`<@botId>`)
    - الگوهای regex مربوط به mention (`agents.list[].groupChat.mentionPatterns`، fallback `messages.groupChat.mentionPatterns`)
    - رفتار thread ضمنی reply-to-bot (وقتی `thread.requireExplicitMention` برابر `true` باشد غیرفعال می‌شود)

    کنترل‌های هر channel (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق startup resolution یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - قالب کلید `toolsBySender`: `id:`، `e164:`، `username:`، `name:`، یا wildcard `"*"`
      (کلیدهای legacy بدون prefix همچنان فقط به `id:` map می‌شوند)

  </Tab>
</Tabs>

## Threading، sessionها و tagهای reply

- DMها به‌صورت `direct` route می‌شوند؛ channelها به‌صورت `channel`؛ MPIMها به‌صورت `group`.
- با مقدار پیش‌فرض `session.dmScope=main`، DMهای Slack به session اصلی agent collapse می‌شوند.
- sessionهای channel: `agent:<agentId>:slack:channel:<channelId>`.
- replyهای thread در صورت کاربرد می‌توانند suffixهای session مخصوص thread بسازند (`:thread:<threadTs>`).
- مقدار پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ مقدار پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` کنترل می‌کند هنگام شروع session جدید thread چند پیام موجود در thread fetch شوند (پیش‌فرض `20`؛ برای غیرفعال کردن روی `0` تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، mentionهای ضمنی thread را suppress می‌کند تا bot فقط به mentionهای صریح `@bot` داخل threadها پاسخ دهد، حتی وقتی bot قبلاً در thread مشارکت داشته است. بدون این، replyها در threadی که bot در آن مشارکت داشته، gate مربوط به `requireMention` را دور می‌زنند.

کنترل‌های threading برای reply:

- `channels.slack.replyToMode`: `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: برای هر `direct|group|channel`
- fallback مربوط به legacy برای chatهای مستقیم: `channels.slack.dm.replyToMode`

tagهای reply دستی پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` **همه** threadingهای reply را در Slack غیرفعال می‌کند، از جمله tagهای صریح `[[reply_to_*]]`. این با Telegram متفاوت است؛ در آنجا tagهای صریح همچنان در حالت `"off"` رعایت می‌شوند. threadهای Slack پیام‌ها را از channel پنهان می‌کنند، در حالی که replyهای Telegram به‌صورت inline قابل مشاهده می‌مانند.
</Note>

## واکنش‌های ack

`ackReaction` هنگام پردازش پیام ورودی توسط OpenClaw، یک emoji تأیید ارسال می‌کند.

ترتیب resolution:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji هویت agent (`agents.list[].identity.emoji`، در غیر این صورت "👀")

نکات:

- Slack انتظار shortcode دارد (برای مثال `"eyes"`).
- برای غیرفعال کردن reaction برای حساب Slack یا به‌صورت سراسری، از `""` استفاده کنید.

## Streaming متن

`channels.slack.streaming` رفتار preview زنده را کنترل می‌کند:

- `off`: streaming مربوط به preview زنده را غیرفعال کنید.
- `partial` (پیش‌فرض): متن preview را با آخرین خروجی partial جایگزین کنید.
- `block`: به‌روزرسانی‌های preview را به‌صورت chunk اضافه کنید.
- `progress`: هنگام تولید، متن وضعیت progress را نشان دهید، سپس متن نهایی را ارسال کنید.
- `streaming.preview.toolProgress`: وقتی draft preview فعال است، به‌روزرسانی‌های tool/progress را به همان پیام preview ویرایش‌شده route کنید (پیش‌فرض: `true`). برای نگه داشتن پیام‌های tool/progress جداگانه، روی `false` تنظیم کنید.

`channels.slack.streaming.nativeTransport` streaming متن native در Slack را وقتی `channels.slack.streaming.mode` برابر `partial` است کنترل می‌کند (پیش‌فرض: `true`).

- برای اینکه streaming متن native و وضعیت thread مربوط به assistant در Slack ظاهر شوند، باید یک reply thread در دسترس باشد. انتخاب thread همچنان از `replyToMode` پیروی می‌کند.
- rootهای channel و group-chat وقتی native streaming در دسترس نیست همچنان می‌توانند از draft preview معمول استفاده کنند.
- DMهای سطح‌بالای Slack به‌طور پیش‌فرض خارج از thread می‌مانند، بنابراین preview به سبک thread را نشان نمی‌دهند؛ اگر آنجا progress قابل مشاهده می‌خواهید، از replyهای thread یا `typingReaction` استفاده کنید.
- payloadهای media و غیرمتنی به delivery معمول fallback می‌کنند.
- finalهای media/error ویرایش‌های preview معلق را cancel می‌کنند؛ finalهای واجد شرایط text/block فقط وقتی flush می‌شوند که بتوانند preview را درجا ویرایش کنند.
- اگر streaming در میانه reply شکست بخورد، OpenClaw برای payloadهای باقی‌مانده به delivery معمول fallback می‌کند.

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

- `channels.slack.streamMode` (`replace | status_final | append`) به‌طور خودکار به `channels.slack.streaming.mode` migrate می‌شود.
- مقدار boolean مربوط به `channels.slack.streaming` به‌طور خودکار به `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` migrate می‌شود.
- `channels.slack.nativeStreaming` مربوط به legacy به‌طور خودکار به `channels.slack.streaming.nativeTransport` migrate می‌شود.

## Fallback واکنش typing

`typingReaction` هنگام پردازش reply توسط OpenClaw، یک reaction موقت به پیام ورودی Slack اضافه می‌کند و سپس وقتی run تمام شد آن را حذف می‌کند. این بیشتر خارج از replyهای thread مفید است؛ replyهای thread از نشانگر وضعیت پیش‌فرض "is typing..." استفاده می‌کنند.

ترتیب resolution:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکات:

- Slack انتظار shortcode دارد (برای مثال `"hourglass_flowing_sand"`).
- reaction best-effort است و پس از تکمیل reply یا مسیر failure، cleanup به‌طور خودکار تلاش می‌شود.

## Media، chunking و delivery

<AccordionGroup>
  <Accordion title="پیوست‌های ورودی">
    پیوست‌های فایل Slack از URLهای private میزبانی‌شده توسط Slack دانلود می‌شوند (جریان درخواست token-authenticated) و وقتی fetch موفق باشد و محدودیت‌های اندازه اجازه دهند، در media store نوشته می‌شوند. placeholderهای فایل شامل `fileId` در Slack هستند تا agentها بتوانند فایل اصلی را با `download-file` fetch کنند.

    دانلودها از timeoutهای idle و total محدود استفاده می‌کنند. اگر retrieval فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به placeholder فایل fallback می‌کند.

    سقف اندازه ورودی runtime به‌طور پیش‌فرض `20MB` است مگر اینکه با `channels.slack.mediaMaxMb` override شود.

  </Accordion>

  <Accordion title="متن و فایل‌های خروجی">
    - chunkهای متن از `channels.slack.textChunkLimit` استفاده می‌کنند (پیش‌فرض 4000)
    - `channels.slack.chunkMode="newline"` splitting پاراگراف‌محور را فعال می‌کند
    - ارسال‌های فایل از APIهای upload در Slack استفاده می‌کنند و می‌توانند replyهای thread (`thread_ts`) را شامل شوند
    - سقف media خروجی وقتی پیکربندی شده باشد از `channels.slack.mediaMaxMb` پیروی می‌کند؛ در غیر این صورت ارسال‌های channel از پیش‌فرض‌های MIME-kind در media pipeline استفاده می‌کنند

  </Accordion>

  <Accordion title="هدف‌های delivery">
    هدف‌های صریح ترجیحی:

    - `user:<id>` برای DMها
    - `channel:<id>` برای channelها

    DMهای Slack هنگام ارسال به هدف‌های user از طریق APIهای conversation در Slack باز می‌شوند.

  </Accordion>
</AccordionGroup>

## Commandها و رفتار slash

Commandهای slash در Slack یا به‌صورت یک command پیکربندی‌شده واحد ظاهر می‌شوند یا چند command native. برای تغییر پیش‌فرض‌های command، `channels.slack.slashCommand` را پیکربندی کنید:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

دستورهای بومی به [تنظیمات اضافی manifest](#additional-manifest-settings) در برنامه Slack شما نیاز دارند و در عوض با `channels.slack.commands.native: true` یا `commands.native: true` در پیکربندی‌های سراسری فعال می‌شوند.

- حالت خودکار دستور بومی برای Slack **خاموش** است، بنابراین `commands.native: "auto"` دستورهای بومی Slack را فعال نمی‌کند.

```txt
/help
```

منوهای آرگومان بومی از راهبرد رندر تطبیقی استفاده می‌کنند که پیش از ارسال مقدار گزینه انتخاب‌شده، یک مودال تأیید نشان می‌دهد:

- تا ۵ گزینه: بلوک‌های دکمه
- ۶ تا ۱۰۰ گزینه: منوی انتخاب ایستا
- بیش از ۱۰۰ گزینه: انتخاب خارجی با فیلتر ناهمگام گزینه‌ها، وقتی هندلرهای گزینه‌های تعاملی در دسترس باشند
- فراتر از محدودیت‌های Slack: مقدارهای گزینه کدگذاری‌شده به دکمه‌ها برمی‌گردند

```txt
/think
```

نشست‌های slash از کلیدهای ایزوله مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای دستورها را با استفاده از `CommandTargetSessionKey` به نشست مکالمه هدف مسیریابی می‌کنند.

## پاسخ‌های تعاملی

Slack می‌تواند کنترل‌های پاسخ تعاملی نوشته‌شده توسط عامل را رندر کند، اما این قابلیت به‌طور پیش‌فرض غیرفعال است.

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

وقتی فعال باشد، عامل‌ها می‌توانند دستورالعمل‌های پاسخ مخصوص Slack صادر کنند:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

این دستورالعمل‌ها به Slack Block Kit کامپایل می‌شوند و کلیک‌ها یا انتخاب‌ها را از مسیر رویداد تعامل موجود Slack بازمی‌گردانند.

نکته‌ها:

- این UI مخصوص Slack است. کانال‌های دیگر دستورالعمل‌های Slack Block Kit را به سامانه‌های دکمه خودشان ترجمه نمی‌کنند.
- مقدارهای callback تعاملی، توکن‌های مات تولیدشده توسط OpenClaw هستند، نه مقدارهای خام نوشته‌شده توسط عامل.
- اگر بلوک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit فراتر بروند، OpenClaw به‌جای ارسال payload نامعتبر بلوک‌ها، به پاسخ متنی اصلی برمی‌گردد.

## تأییدهای exec در Slack

Slack می‌تواند به‌جای بازگشت به Web UI یا ترمینال، به‌عنوان یک کلاینت تأیید بومی با دکمه‌ها و تعامل‌های تعاملی عمل کند.

- تأییدهای exec از `channels.slack.execApprovals.*` برای مسیریابی بومی DM/کانال استفاده می‌کنند.
- تأییدهای Plugin همچنان می‌توانند از همان سطح دکمه بومی Slack حل شوند، وقتی درخواست از قبل در Slack فرود آمده باشد و نوع شناسه تأیید `plugin:` باشد.
- مجوزدهی تأییدکننده همچنان اعمال می‌شود: فقط کاربرانی که به‌عنوان تأییدکننده شناسایی شده‌اند می‌توانند درخواست‌ها را از طریق Slack تأیید یا رد کنند.

این از همان سطح دکمه تأیید مشترک مانند کانال‌های دیگر استفاده می‌کند. وقتی `interactivity` در تنظیمات برنامه Slack شما فعال باشد، اعلان‌های تأیید مستقیماً در مکالمه به‌صورت دکمه‌های Block Kit رندر می‌شوند.
وقتی این دکمه‌ها حاضر باشند، UX اصلی تأیید هستند؛ OpenClaw
فقط زمانی باید دستور دستی `/approve` را اضافه کند که نتیجه ابزار بگوید تأییدهای chat
در دسترس نیستند یا تأیید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`, `sessionFilter`

Slack وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک
تأییدکننده resolve شود، تأییدهای exec بومی را به‌طور خودکار فعال می‌کند. برای غیرفعال‌کردن صریح Slack به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.
برای اجباری‌کردن تأییدهای بومی وقتی تأییدکننده‌ها resolve می‌شوند، `enabled: true` را تنظیم کنید.

رفتار پیش‌فرض بدون پیکربندی صریح تأیید exec در Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

پیکربندی صریح بومی Slack فقط وقتی لازم است که بخواهید تأییدکننده‌ها را override کنید، فیلتر اضافه کنید، یا
تحویل به chat مبدأ را انتخاب کنید:

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

ارسال مشترک `approvals.exec` جدا است. فقط وقتی از آن استفاده کنید که اعلان‌های تأیید exec باید همچنین
به chatهای دیگر یا هدف‌های out-of-band صریح مسیریابی شوند. ارسال مشترک `approvals.plugin` نیز
جدا است؛ دکمه‌های بومی Slack همچنان می‌توانند تأییدهای Plugin را حل کنند، وقتی آن درخواست‌ها از قبل
در Slack فرود آمده باشند.

`/approve` در همان chat نیز در کانال‌های Slack و DMهایی که از قبل از دستورها پشتیبانی می‌کنند کار می‌کند. برای مدل کامل ارسال تأیید، [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

## رویدادها و رفتار عملیاتی

- ویرایش‌ها/حذف‌های پیام به رویدادهای سیستمی نگاشت می‌شوند.
- پخش‌های thread (پاسخ‌های thread با «همچنین به کانال بفرست») به‌عنوان پیام‌های معمول کاربر پردازش می‌شوند.
- رویدادهای افزودن/حذف واکنش به رویدادهای سیستمی نگاشت می‌شوند.
- رویدادهای پیوستن/ترک عضو، ایجاد/تغییرنام کانال، و افزودن/حذف pin به رویدادهای سیستمی نگاشت می‌شوند.
- `channel_id_changed` می‌تواند وقتی `configWrites` فعال است کلیدهای پیکربندی کانال را migrate کند.
- فراداده موضوع/هدف کانال به‌عنوان زمینه نامطمئن در نظر گرفته می‌شود و می‌تواند به زمینه مسیریابی تزریق شود.
- starter thread و seeding زمینه تاریخچه اولیه thread، در صورت کاربرد، بر اساس allowlistهای فرستنده پیکربندی‌شده فیلتر می‌شوند.
- کنش‌های بلوک و تعامل‌های مودال رویدادهای سیستمی ساختاریافته `Slack interaction: ...` را با فیلدهای payload غنی منتشر می‌کنند:
  - کنش‌های بلوک: مقدارهای انتخاب‌شده، برچسب‌ها، مقدارهای picker، و فراداده `workflow_*`
  - رویدادهای مودال `view_submission` و `view_closed` با فراداده کانال مسیریابی‌شده و ورودی‌های فرم

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="فیلدهای پربازده Slack">

- حالت/احراز هویت: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- دسترسی DM: `dm.enabled`, `dmPolicy`, `allowFrom` (میراثی: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- تغییر وضعیت سازگاری: `dangerouslyAllowNameMatching` (گزینه اضطراری؛ مگر در صورت نیاز خاموش نگه دارید)
- دسترسی کانال: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- thread کردن/تاریخچه: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- عملیات/قابلیت‌ها: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="هیچ پاسخی در کانال‌ها نیست">
    به‌ترتیب بررسی کنید:

    - `groupPolicy`
    - allowlist کانال (`channels.slack.channels`) — **کلیدها باید شناسه‌های کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام در `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، چون مسیریابی کانال به‌طور پیش‌فرض ابتدا بر اساس ID است. برای یافتن ID: در Slack روی کانال راست‌کلیک کنید → **Copy link** — مقدار `C...` در انتهای URL همان ID کانال است.
    - `requireMention`
    - allowlist `users` برای هر کانال

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
    - `channels.slack.dmPolicy` (یا نسخه میراثی `channels.slack.dm.policy`)
    - تأییدهای pairing / ورودی‌های allowlist
    - رویدادهای DM دستیار Slack: لاگ‌های verbose که به `drop message_changed` اشاره می‌کنند
      معمولاً یعنی Slack یک رویداد thread دستیار ویرایش‌شده را بدون
      فرستنده انسانی قابل‌بازیابی در فراداده پیام فرستاده است

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode وصل نمی‌شود">
    توکن‌های bot و app و فعال‌بودن Socket Mode را در تنظیمات برنامه Slack اعتبارسنجی کنید.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان دهد، حساب Slack
    پیکربندی شده است اما runtime فعلی نتوانسته مقدار پشتیبانی‌شده با SecretRef را resolve کند.

  </Accordion>

  <Accordion title="حالت HTTP رویدادها را دریافت نمی‌کند">
    اعتبارسنجی کنید:

    - secret امضا
    - مسیر Webhook
    - URLهای درخواست Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` یکتا برای هر حساب HTTP

    اگر `signingSecretStatus: "configured_unavailable"` در snapshotهای حساب ظاهر شود،
    حساب HTTP پیکربندی شده است اما runtime فعلی نتوانسته secret امضای پشتیبانی‌شده با SecretRef را
    resolve کند.

  </Accordion>

  <Accordion title="دستورهای native/slash اجرا نمی‌شوند">
    بررسی کنید که قصد شما کدام بوده است:

    - حالت دستور بومی (`channels.slack.commands.native: true`) با دستورهای slash متناظر ثبت‌شده در Slack
    - یا حالت تک‌دستور slash (`channels.slack.slashCommand.enabled: true`)

    همچنین `commands.useAccessGroups` و allowlistهای کانال/کاربر را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مرجع vision پیوست

Slack می‌تواند وقتی دانلود فایل‌های Slack موفق باشد و محدودیت‌های اندازه اجازه دهند، رسانه دانلودشده را به نوبت عامل پیوست کند. فایل‌های تصویر می‌توانند از مسیر درک رسانه عبور کنند یا مستقیماً به مدل پاسخ vision-capable داده شوند؛ فایل‌های دیگر به‌جای اینکه به‌عنوان ورودی تصویر در نظر گرفته شوند، به‌صورت زمینه فایل قابل‌دانلود نگه داشته می‌شوند.

### انواع رسانه پشتیبانی‌شده

| نوع رسانه                      | منبع                 | رفتار فعلی                                                                         | نکته‌ها                                                                   |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| تصاویر JPEG / PNG / GIF / WebP | URL فایل Slack       | دانلود شده و برای پردازش vision-capable به نوبت پیوست می‌شود                     | سقف هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض ۲۰ MB)                 |
| فایل‌های PDF                   | URL فایل Slack       | دانلود شده و به‌عنوان زمینه فایل برای ابزارهایی مانند `download-file` یا `pdf` ارائه می‌شود | ورودی Slack به‌طور خودکار PDFها را به ورودی image-vision تبدیل نمی‌کند |
| فایل‌های دیگر                  | URL فایل Slack       | در صورت امکان دانلود شده و به‌عنوان زمینه فایل ارائه می‌شود                      | فایل‌های باینری به‌عنوان ورودی تصویر در نظر گرفته نمی‌شوند              |
| پاسخ‌های thread                | فایل‌های starter thread | وقتی پاسخ رسانه مستقیم ندارد، فایل‌های پیام ریشه می‌توانند به‌عنوان زمینه hydrate شوند | starterهای فقط‌فایل از placeholder پیوست استفاده می‌کنند                |
| پیام‌های چندتصویری             | چند فایل Slack       | هر فایل به‌طور مستقل ارزیابی می‌شود                                               | پردازش Slack به هشت فایل برای هر پیام محدود است                         |

### pipeline ورودی

وقتی یک پیام Slack با پیوست‌های فایل می‌رسد:

1. OpenClaw فایل را از URL خصوصی Slack با استفاده از توکن bot (`xoxb-...`) دانلود می‌کند.
2. فایل در صورت موفقیت در media store نوشته می‌شود.
3. مسیرهای رسانه دانلودشده و نوع‌های محتوا به زمینه ورودی اضافه می‌شوند.
4. مسیرهای مدل/ابزار دارای قابلیت تصویر می‌توانند از پیوست‌های تصویر آن زمینه استفاده کنند.
5. فایل‌های غیرتصویری به‌عنوان فراداده فایل یا ارجاع‌های رسانه برای ابزارهایی که می‌توانند آن‌ها را مدیریت کنند، در دسترس می‌مانند.

### وراثت پیوست ریشه thread

وقتی پیامی در یک thread می‌رسد (دارای والد `thread_ts` است):

- اگر خود پاسخ رسانه مستقیم نداشته باشد و پیام ریشه واردشده فایل داشته باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان زمینه starter thread hydrate کند.
- پیوست‌های مستقیم پاسخ بر پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و متن ندارد با یک placeholder پیوست نمایش داده می‌شود تا fallback همچنان بتواند فایل‌های آن را شامل شود.

### مدیریت چند پیوست

وقتی یک پیام Slack واحد شامل چند پیوست فایل باشد:

- هر پیوست به‌طور مستقل از طریق مسیر پردازش رسانه پردازش می‌شود.
- ارجاع‌های رسانه‌ای دانلودشده در زمینهٔ پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در محمولهٔ رویداد پیروی می‌کند.
- خرابی در دانلود یک پیوست، پیوست‌های دیگر را مسدود نمی‌کند.

### محدودیت‌های اندازه، دانلود، و مدل

- **سقف اندازه**: پیش‌فرض 20 MB برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل پیکربندی است.
- **خرابی‌های دانلود**: فایل‌هایی که Slack نمی‌تواند ارائه کند، URLهای منقضی‌شده، فایل‌های غیرقابل‌دسترسی، فایل‌های بیش‌ازحد بزرگ، و پاسخ‌های HTML احراز هویت/ورود Slack به‌جای اینکه به‌عنوان قالب‌های پشتیبانی‌نشده گزارش شوند، نادیده گرفته می‌شوند.
- **مدل بینایی**: تحلیل تصویر از مدل پاسخ فعال استفاده می‌کند اگر از بینایی پشتیبانی کند، یا از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel`.

### محدودیت‌های شناخته‌شده

| سناریو                               | رفتار فعلی                                                             | راهکار جایگزین                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL فایل Slack منقضی‌شده                 | فایل نادیده گرفته می‌شود؛ خطایی نشان داده نمی‌شود                                                 | فایل را دوباره در Slack بارگذاری کنید                                                |
| مدل بینایی پیکربندی نشده است            | پیوست‌های تصویری به‌عنوان ارجاع‌های رسانه‌ای ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند | `agents.defaults.imageModel` را پیکربندی کنید یا از یک مدل پاسخ دارای قابلیت بینایی استفاده کنید |
| تصاویر بسیار بزرگ (> 20 MB به‌طور پیش‌فرض) | طبق سقف اندازه نادیده گرفته می‌شوند                                                         | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید                       |
| پیوست‌های فورواردشده/اشتراک‌گذاری‌شده           | متن و رسانه‌های تصویر/فایل میزبانی‌شده در Slack به‌صورت بهترین تلاش پردازش می‌شوند                       | مستقیماً در رشتهٔ OpenClaw دوباره به اشتراک بگذارید                                   |
| پیوست‌های PDF                        | به‌عنوان زمینهٔ فایل/رسانه ذخیره می‌شوند، نه اینکه به‌طور خودکار از مسیر بینایی تصویر عبور داده شوند  | برای فرادادهٔ فایل از `download-file` یا برای تحلیل PDF از ابزار `pdf` استفاده کنید   |

### مستندات مرتبط

- [مسیر پردازش فهم رسانه](/fa/nodes/media-understanding)
- [ابزار PDF](/fa/tools/pdf)
- حماسه: [#51349](https://github.com/openclaw/openclaw/issues/51349) — فعال‌سازی بینایی پیوست Slack
- آزمون‌های رگرسیون: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- راستی‌آزمایی زنده: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Slack را با Gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار کانال و پیام خصوصی گروهی.
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
