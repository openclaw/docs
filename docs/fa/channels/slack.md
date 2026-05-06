---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی حالت سوکت/HTTP در Slack
summary: راه‌اندازی Slack و رفتار زمان اجرا (حالت سوکت + URLهای درخواست HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-06T17:52:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3afcedca5004c18949206eee2b2620d07a02c76ef663bea80f29ec2591f737b
    source_path: channels/slack.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم و کانال‌ها از طریق یکپارچه‌سازی‌های برنامهٔ Slack. حالت پیش‌فرض Socket Mode است؛ URLهای درخواست HTTP نیز پشتیبانی می‌شوند.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Slack به‌صورت پیش‌فرض روی حالت جفت‌سازی هستند.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    رفتار فرمان بومی و فهرست فرمان‌ها.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های میان‌کانالی و راهنماهای ترمیم.
  </Card>
</CardGroup>

## انتخاب Socket Mode یا URLهای درخواست HTTP

هر دو روش انتقال آمادهٔ تولید هستند و برای پیام‌رسانی، فرمان‌های اسلش، App Home و تعامل‌پذیری از نظر قابلیت‌ها هم‌ترازند. انتخاب را بر اساس شکل استقرار انجام دهید، نه قابلیت‌ها.

| دغدغه                      | Socket Mode (پیش‌فرض)                                                                | URLهای درخواست HTTP                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL عمومی Gateway           | لازم نیست                                                                         | لازم است (DNS، TLS، پروکسی معکوس یا تونل)                                                                   |
| شبکهٔ خروجی             | WSS خروجی به `wss-primary.slack.com` باید در دسترس باشد                            | بدون WS خروجی؛ فقط HTTPS ورودی                                                                             |
| توکن‌های موردنیاز                | توکن بات (`xoxb-...`) + توکن سطح برنامه (`xapp-...`) با `connections:write`       | توکن بات (`xoxb-...`) + راز امضا                                                                        |
| لپ‌تاپ توسعه / پشت فایروال | بدون تغییر کار می‌کند                                                                          | به تونل عمومی (ngrok، Cloudflare Tunnel، Tailscale Funnel) یا Gateway مرحله‌بندی نیاز دارد                          |
| مقیاس‌پذیری افقی           | یک نشست Socket Mode برای هر برنامه روی هر میزبان؛ چند Gateway به برنامه‌های Slack جداگانه نیاز دارند | هندلر POST بدون وضعیت؛ چند replica از Gateway می‌توانند پشت یک load balancer یک برنامه را به اشتراک بگذارند                     |
| چند حساب روی یک Gateway | پشتیبانی می‌شود؛ هر حساب WS خودش را باز می‌کند                                             | پشتیبانی می‌شود؛ هر حساب به `webhookPath` یکتای خودش نیاز دارد (پیش‌فرض `/slack/events`) تا ثبت‌ها با هم برخورد نکنند |
| انتقال فرمان اسلش      | از طریق اتصال WS تحویل می‌شود؛ `slash_commands[].url` نادیده گرفته می‌شود                  | Slack به `slash_commands[].url` درخواست POST می‌فرستد؛ این فیلد برای dispatch شدن فرمان لازم است                           |
| امضای درخواست              | استفاده نمی‌شود (احراز هویت همان توکن سطح برنامه است)                                               | Slack هر درخواست را امضا می‌کند؛ OpenClaw آن را با `signingSecret` تأیید می‌کند                                              |
| بازیابی هنگام قطع اتصال  | Slack SDK به‌صورت خودکار دوباره وصل می‌شود؛ تنظیمات انتقال pong-timeout در Gateway اعمال می‌شود       | اتصال پایداری برای قطع شدن وجود ندارد؛ تلاش‌های مجدد از سمت Slack برای هر درخواست انجام می‌شوند                                           |

<Note>
  **Socket Mode را انتخاب کنید** برای میزبان‌های تک-Gateway، لپ‌تاپ‌های توسعه، و شبکه‌های درون‌سازمانی که می‌توانند به‌صورت خروجی به `*.slack.com` دسترسی داشته باشند اما نمی‌توانند HTTPS ورودی بپذیرند.

**URLهای درخواست HTTP را انتخاب کنید** وقتی چند replica از Gateway را پشت یک load balancer اجرا می‌کنید، وقتی WSS خروجی مسدود است اما HTTPS ورودی مجاز است، یا وقتی همین حالا Webhookهای Slack را در یک پروکسی معکوس terminate می‌کنید.
</Note>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        [api.slack.com/apps](https://api.slack.com/apps/new) را باز کنید → **Create New App** → **From a manifest** → workspace خود را انتخاب کنید → یکی از manifestهای زیر را paste کنید → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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

```json Minimal
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** با مجموعه قابلیت‌های کامل Plugin داخلی Slack هم‌خوان است: App Home، فرمان‌های اسلش، فایل‌ها، واکنش‌ها، سنجاق‌ها، پیام‌های مستقیم گروهی، و خواندن emoji/usergroup. وقتی سیاست workspace محدوده‌های دسترسی را محدود می‌کند، **Minimal** را انتخاب کنید — این گزینه پیام‌های مستقیم، تاریخچهٔ کانال/گروه، mentionها و فرمان‌های اسلش را پوشش می‌دهد اما فایل‌ها، واکنش‌ها، سنجاق‌ها، پیام مستقیم گروهی (`mpim:*`)، `emoji:read` و `usergroups:read` را حذف می‌کند. برای دلیل هر محدودهٔ دسترسی و گزینه‌های افزایشی مانند فرمان‌های اسلش اضافی، [چک‌لیست manifest و محدودهٔ دسترسی](#manifest-and-scope-checklist) را ببینید.
        </Note>

        پس از اینکه Slack برنامه را ایجاد کرد:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: `connections:write` را اضافه کنید، ذخیره کنید، مقدار `xapp-...` را کپی کنید.
        - **Install App → Install to Workspace**: توکن OAuth کاربر بات `xoxb-...` را کپی کنید.

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

        fallback محیطی (فقط حساب پیش‌فرض):

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
        [api.slack.com/apps](https://api.slack.com/apps/new) را باز کنید → **Create New App** → **From a manifest** → workspace خود را انتخاب کنید → یکی از manifestهای زیر را paste کنید → `https://gateway-host.example.com/slack/events` را با URL عمومی Gateway خود جایگزین کنید → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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

```json Minimal
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
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **Recommended** با مجموعه کامل قابلیت‌های Plugin داخلی Slack مطابقت دارد؛ **Minimal** فایل‌ها، واکنش‌ها، پین‌ها، پیام مستقیم گروهی (`mpim:*`)، `emoji:read` و `usergroups:read` را برای فضاهای کاری محدودکننده حذف می‌کند. برای دلیل هر scope، [چک‌لیست manifest و scope](#manifest-and-scope-checklist) را ببینید.
        </Note>

        <Info>
          هر سه فیلد URL (`slash_commands[].url`، `event_subscriptions.request_url` و `interactivity.request_url` / `message_menu_options_url`) همگی به یک endpoint در OpenClaw اشاره می‌کنند. schema مربوط به manifest در Slack لازم دارد که آن‌ها جداگانه نام‌گذاری شوند، اما OpenClaw بر اساس نوع payload مسیریابی می‌کند، بنابراین یک `webhookPath` واحد (پیش‌فرض `/slack/events`) کافی است. فرمان‌های slash بدون `slash_commands[].url` در حالت HTTP بی‌صدا هیچ کاری انجام نمی‌دهند.
        </Info>

        پس از اینکه Slack برنامه را ایجاد کرد:

        - **Basic Information → App Credentials**: برای اعتبارسنجی درخواست، **Signing Secret** را کپی کنید.
        - **Install App → Install to Workspace**: توکن OAuth کاربر Bot با قالب `xoxb-...` را کپی کنید.

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
        برای HTTP چندحسابی از مسیرهای Webhook یکتا استفاده کنید

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

## تنظیم transport در Socket Mode

OpenClaw به‌صورت پیش‌فرض، timeout مربوط به pong در کلاینت Slack SDK را برای Socket Mode روی ۱۵ ثانیه تنظیم می‌کند. فقط زمانی تنظیمات transport را override کنید که به تنظیمات مخصوص فضای کاری یا میزبان نیاز دارید:

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

این مورد را فقط برای فضاهای کاری Socket Mode استفاده کنید که timeoutهای مربوط به Slack websocket pong/server-ping را ثبت می‌کنند یا روی میزبان‌هایی اجرا می‌شوند که دچار گرسنگی شناخته‌شده event-loop هستند. `clientPingTimeout` مدت انتظار برای pong پس از ارسال client ping توسط SDK است؛ `serverPingTimeout` مدت انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای برنامه همچنان state برنامه هستند، نه سیگنال‌های زنده‌بودن transport.

## چک‌لیست manifest و scope

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

برای **حالت HTTP Request URLs**، `settings` را با گونه HTTP جایگزین کنید و به هر فرمان slash مقدار `url` اضافه کنید. URL عمومی لازم است:

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

قابلیت‌های متفاوتی را که پیش‌فرض‌های بالا را گسترش می‌دهند، ارائه کنید.

manifest پیش‌فرض، تب **Home** در Slack App Home را فعال می‌کند و در `app_home_opened` مشترک می‌شود. وقتی عضوی از فضای کاری تب Home را باز می‌کند، OpenClaw با `views.publish` یک نمای Home پیش‌فرض امن منتشر می‌کند؛ هیچ payload مکالمه یا پیکربندی خصوصی در آن گنجانده نمی‌شود. تب **Messages** برای پیام‌های مستقیم Slack فعال باقی می‌ماند.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    می‌توان به‌جای یک فرمان پیکربندی‌شده واحد، از چند [فرمان slash بومی](#commands-and-slash-behavior) با جزئیات بیشتر استفاده کرد:

    - به‌جای `/status` از `/agentstatus` استفاده کنید، چون فرمان `/status` رزرو شده است.
    - هم‌زمان نمی‌توان بیش از ۲۵ فرمان slash را در دسترس قرار داد.

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
        از همان فهرست `slash_commands` در Socket Mode بالا استفاده کنید و به هر ورودی `"url": "https://gateway-host.example.com/slack/events"` اضافه کنید. نمونه:

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

        آن مقدار `url` را برای همه فرمان‌های فهرست تکرار کنید.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="دامنه‌های اختیاری انتساب نویسنده (عملیات نوشتن)">
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض برنامه Slack از هویت عامل فعال (نام کاربری و نماد سفارشی) استفاده کنند، دامنه ربات `chat:write.customize` را اضافه کنید.

    اگر از نماد ایموجی استفاده می‌کنید، Slack انتظار قالب `:emoji_name:` را دارد.

  </Accordion>
  <Accordion title="دامنه‌های اختیاری توکن کاربر (عملیات خواندن)">
    اگر `channels.slack.userToken` را پیکربندی می‌کنید، دامنه‌های خواندن معمول عبارت‌اند از:

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
- `botToken`، `appToken`، `signingSecret` و `userToken` رشته‌های متن ساده
  یا اشیای SecretRef را می‌پذیرند.
- توکن‌های پیکربندی، fallback محیط را بازنویسی می‌کنند.
- fallback محیطی `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
- `userToken` (`xoxp-...`) فقط از پیکربندی می‌آید (fallback محیطی ندارد) و پیش‌فرض آن رفتار فقط‌خواندنی است (`userTokenReadOnly: true`).

رفتار نماگرفت وضعیت:

- بازرسی حساب Slack برای هر اعتبارنامه، فیلدهای `*Source` و `*Status`
  را ردیابی می‌کند (`botToken`، `appToken`، `signingSecret`، `userToken`).
- وضعیت `available`، `configured_unavailable` یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا منبع راز غیر درون‌خطی دیگری پیکربندی شده است، اما مسیر فرمان/زمان اجرای فعلی
  نتوانست مقدار واقعی را resolve کند.
- در حالت HTTP، `signingSecretStatus` گنجانده می‌شود؛ در Socket Mode،
  جفت الزامی `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای خواندن‌های action/directory، وقتی توکن کاربر پیکربندی شده باشد می‌توان آن را ترجیح داد. برای نوشتن‌ها، توکن ربات همچنان ترجیح داده می‌شود؛ نوشتن با توکن کاربر فقط وقتی مجاز است که `userTokenReadOnly: false` باشد و توکن ربات در دسترس نباشد.
</Tip>

## کنش‌ها و گیت‌ها

کنش‌های Slack با `channels.slack.actions.*` کنترل می‌شوند.

گروه‌های کنش در ابزارهای فعلی Slack:

| گروه       | پیش‌فرض |
| ---------- | ------- |
| پیام‌ها    | فعال |
| واکنش‌ها   | فعال |
| سنجاق‌ها   | فعال |
| اطلاعات عضو | فعال |
| فهرست ایموجی | فعال |

کنش‌های پیام فعلی Slack شامل `send`، `upload-file`، `download-file`، `read`، `edit`، `delete`، `pin`، `unpin`، `list-pins`، `member-info` و `emoji-list` هستند. `download-file` شناسه‌های فایل Slack را که در نگه‌دارنده‌های جای فایل ورودی نمایش داده می‌شوند می‌پذیرد و برای تصاویر، پیش‌نمایش تصویر یا برای انواع فایل دیگر، فراداده فایل محلی برمی‌گرداند.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست DM">
    `channels.slack.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.slack.allowFrom` allowlist رسمی DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.slack.allowFrom` شامل `"*"` باشد)
    - `disabled`

    پرچم‌های DM:

    - `dm.enabled` (پیش‌فرض true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قدیمی)
    - `dm.groupEnabled` (DMهای گروهی به‌طور پیش‌فرض false)
    - `dm.groupChannels` (allowlist اختیاری MPIM)

    اولویت چندحسابی:

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

    allowlist کانال زیر `channels.slack.channels` قرار دارد و **باید از شناسه‌های پایدار کانال Slack** (برای مثال `C12345678`) به‌عنوان کلیدهای پیکربندی استفاده کند.

    نکته زمان اجرا: اگر `channels.slack` کاملا وجود نداشته باشد (راه‌اندازی فقط با محیط)، زمان اجرا به `groupPolicy="allowlist"` fallback می‌کند و یک هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    resolve نام/شناسه:

    - ورودی‌های allowlist کانال و allowlist DM هنگام راه‌اندازی، وقتی دسترسی توکن اجازه دهد، resolve می‌شوند
    - ورودی‌های resolve‌نشده نام کانال همان‌طور که پیکربندی شده‌اند نگه داشته می‌شوند، اما به‌طور پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند
    - مجوزدهی ورودی و مسیریابی کانال به‌طور پیش‌فرض ID-first هستند؛ تطبیق مستقیم نام کاربری/slug به `channels.slack.dangerouslyAllowNameMatching: true` نیاز دارد

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) زیر `groupPolicy: "allowlist"` تطبیق نمی‌خورند. جست‌وجوی کانال به‌طور پیش‌فرض ID-first است، بنابراین کلید مبتنی بر نام هرگز با موفقیت مسیریابی نمی‌شود و همه پیام‌ها در آن کانال بی‌صدا مسدود می‌شوند. این با `groupPolicy: "open"` متفاوت است؛ در آن حالت کلید کانال برای مسیریابی لازم نیست و به نظر می‌رسد کلید مبتنی بر نام کار می‌کند.

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

  <Tab title="منشن‌ها و کاربران کانال">
    پیام‌های کانال به‌طور پیش‌فرض با منشن gate می‌شوند.

    منابع منشن:

    - منشن صریح برنامه (`<@botId>`)
    - منشن گروه کاربری Slack (`<!subteam^S...>`) وقتی کاربر ربات عضو آن گروه کاربری باشد؛ به `usergroups:read` نیاز دارد
    - الگوهای regex منشن (`agents.list[].groupChat.mentionPatterns`، fallback `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به رشته ربات (وقتی `thread.requireExplicitMention` برابر `true` باشد غیرفعال است)

    کنترل‌های هر کانال (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق resolve راه‌اندازی یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - قالب کلید `toolsBySender`: `id:`، `e164:`، `username:`، `name:`، یا wildcard `"*"`
      (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند)

    `allowBots` برای کانال‌ها و کانال‌های خصوصی محافظه‌کارانه است: پیام‌های اتاق که توسط ربات نوشته شده‌اند فقط وقتی پذیرفته می‌شوند که ربات فرستنده صریحا در allowlist `users` همان اتاق فهرست شده باشد، یا وقتی دست‌کم یک شناسه صریح مالک Slack از `channels.slack.allowFrom` در حال حاضر عضو اتاق باشد. wildcardها و ورودی‌های مالک با نام نمایشی حضور مالک را برآورده نمی‌کنند. حضور مالک از `conversations.members` Slack استفاده می‌کند؛ مطمئن شوید برنامه دامنه خواندن منطبق برای نوع اتاق را دارد (`channels:read` برای کانال‌های عمومی، `groups:read` برای کانال‌های خصوصی). اگر جست‌وجوی عضو شکست بخورد، OpenClaw پیام اتاق نوشته‌شده توسط ربات را drop می‌کند.

  </Tab>
</Tabs>

## رشته‌ها، نشست‌ها، و برچسب‌های پاسخ

- DMها به‌صورت `direct` مسیریابی می‌شوند؛ کانال‌ها به‌صورت `channel`؛ MPIMها به‌صورت `group`.
- اتصال‌های مسیر Slack شناسه‌های خام peer و همچنین فرم‌های هدف Slack مانند `channel:C12345678`، `user:U12345678` و `<@U12345678>` را می‌پذیرند.
- با `session.dmScope=main` پیش‌فرض، DMهای Slack به نشست اصلی عامل collapse می‌شوند.
- نشست‌های کانال: `agent:<agentId>:slack:channel:<channelId>`.
- پاسخ‌های رشته می‌توانند در صورت کاربرد، پسوندهای نشست رشته (`:thread:<threadTs>`) بسازند.
- پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` کنترل می‌کند هنگام شروع یک نشست رشته جدید، چند پیام موجود رشته دریافت شود (پیش‌فرض `20`؛ برای غیرفعال‌سازی `0` تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، منشن‌های ضمنی رشته را سرکوب می‌کند تا ربات فقط به منشن‌های صریح `@bot` درون رشته‌ها پاسخ دهد، حتی وقتی ربات قبلا در رشته مشارکت داشته است. بدون این، پاسخ‌ها در رشته‌ای که ربات در آن مشارکت داشته است، gating `requireMention` را دور می‌زنند.

کنترل‌های رشته‌بندی پاسخ:

- `channels.slack.replyToMode`: `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: برای هر `direct|group|channel`
- fallback قدیمی برای چت‌های مستقیم: `channels.slack.dm.replyToMode`

برچسب‌های پاسخ دستی پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` **همه** رشته‌بندی پاسخ در Slack را غیرفعال می‌کند، از جمله برچسب‌های صریح `[[reply_to_*]]`. این با Telegram متفاوت است؛ در آنجا برچسب‌های صریح همچنان در حالت `"off"` رعایت می‌شوند. رشته‌های Slack پیام‌ها را از کانال پنهان می‌کنند، در حالی که پاسخ‌های Telegram به‌صورت درون‌خطی قابل مشاهده می‌مانند.
</Note>

## واکنش‌های تایید

`ackReaction` در حالی که OpenClaw در حال پردازش پیام ورودی است، یک ایموجی تایید می‌فرستد.

ترتیب resolve:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

نکته‌ها:

- Slack انتظار shortcode دارد (برای مثال `"eyes"`).
- برای غیرفعال کردن واکنش برای حساب Slack یا به‌صورت سراسری، از `""` استفاده کنید.

## استریم متن

`channels.slack.streaming` رفتار پیش‌نمایش زنده را کنترل می‌کند:

- `off`: استریم پیش‌نمایش زنده را غیرفعال کنید.
- `partial` (پیش‌فرض): متن پیش‌نمایش را با آخرین خروجی جزئی جایگزین کنید.
- `block`: به‌روزرسانی‌های پیش‌نمایش تکه‌تکه را append کنید.
- `progress`: هنگام تولید، متن وضعیت پیشرفت را نشان دهید، سپس متن نهایی را ارسال کنید.
- `streaming.preview.toolProgress`: وقتی پیش‌نمایش draft فعال است، به‌روزرسانی‌های ابزار/پیشرفت را به همان پیام پیش‌نمایش ویرایش‌شده مسیریابی کنید (پیش‌فرض: `true`). برای نگه داشتن پیام‌های جداگانه ابزار/پیشرفت، `false` تنظیم کنید.
- `streaming.preview.commandText` / `streaming.progress.commandText`: برای نگه داشتن خط‌های فشرده پیشرفت ابزار در حالی که متن خام فرمان/exec پنهان می‌شود، روی `status` تنظیم کنید (پیش‌فرض: `raw`).

پنهان کردن متن خام فرمان/exec در حالی که خط‌های فشرده پیشرفت حفظ می‌شوند:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` استریم متن بومی Slack را وقتی `channels.slack.streaming.mode` برابر `partial` باشد کنترل می‌کند (پیش‌فرض: `true`).

- برای ظاهر شدن استریم متن بومی و وضعیت رشته دستیار Slack، یک رشته پاسخ باید در دسترس باشد. انتخاب رشته همچنان از `replyToMode` پیروی می‌کند.
- ریشه‌های کانال، چت گروهی، و DM سطح بالا همچنان می‌توانند وقتی استریم بومی در دسترس نیست یا هیچ رشته پاسخی وجود ندارد، از پیش‌نمایش draft معمول استفاده کنند.
- DMهای سطح بالای Slack به‌طور پیش‌فرض خارج از رشته می‌مانند، بنابراین پیش‌نمایش استریم/وضعیت بومی به سبک رشته Slack را نشان نمی‌دهند؛ OpenClaw به‌جای آن یک پیش‌نمایش draft را در DM پست و ویرایش می‌کند.
- رسانه و payloadهای غیرمتنی به تحویل معمول fallback می‌کنند.
- پایان‌های رسانه/خطا، ویرایش‌های معلق پیش‌نمایش را لغو می‌کنند؛ پایان‌های متن/block واجد شرایط فقط وقتی flush می‌شوند که بتوانند پیش‌نمایش را در همان‌جا ویرایش کنند.
- اگر استریم در میانه پاسخ شکست بخورد، OpenClaw برای payloadهای باقی‌مانده به تحویل معمول fallback می‌کند.

استفاده از پیش‌نمایش draft به‌جای استریم متن بومی Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) یک نام مستعار قدیمی زمان اجرا برای `channels.slack.streaming.mode` است.
- بولی `channels.slack.streaming` یک نام مستعار قدیمی زمان اجرا برای `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` است.
- `channels.slack.nativeStreaming` قدیمی یک نام مستعار زمان اجرا برای `channels.slack.streaming.nativeTransport` است.
- برای بازنویسی پیکربندی پایدارشده جریان‌دهی Slack به کلیدهای استاندارد، `openclaw doctor --fix` را اجرا کنید.

## واکنش تایپ به‌عنوان جایگزین

`typingReaction` هنگام پردازش پاسخ توسط OpenClaw، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و پس از پایان اجرا آن را حذف می‌کند. این گزینه بیرون از پاسخ‌های رشته‌ای بیشترین کاربرد را دارد؛ پاسخ‌های رشته‌ای از نشانگر وضعیت پیش‌فرض «در حال تایپ...» استفاده می‌کنند.

ترتیب وضوح:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکته‌ها:

- Slack انتظار shortcode دارد، برای مثال `"hourglass_flowing_sand"`.
- واکنش به‌صورت best-effort انجام می‌شود و پس از تکمیل مسیر پاسخ یا شکست، پاک‌سازی به‌طور خودکار تلاش می‌شود.

## رسانه، قطعه‌بندی و تحویل

<AccordionGroup>
  <Accordion title="پیوست‌های ورودی">
    پیوست‌های فایل Slack از URLهای خصوصی میزبانی‌شده توسط Slack دانلود می‌شوند (جریان درخواست احرازهویت‌شده با توکن) و وقتی دریافت موفق باشد و محدودیت‌های اندازه اجازه دهند، در ذخیره‌گاه رسانه نوشته می‌شوند. جای‌نگهدارهای فایل شامل `fileId` مربوط به Slack هستند تا عامل‌ها بتوانند فایل اصلی را با `download-file` دریافت کنند.

    دانلودها از مهلت‌های زمانی محدود برای بیکاری و کل زمان استفاده می‌کنند. اگر بازیابی فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به جای‌نگهدار فایل برمی‌گردد.

    سقف اندازه ورودی زمان اجرا به‌طور پیش‌فرض `20MB` است، مگر اینکه با `channels.slack.mediaMaxMb` بازنویسی شود.

  </Accordion>

  <Accordion title="متن و فایل‌های خروجی">
    - قطعه‌های متن از `channels.slack.textChunkLimit` استفاده می‌کنند (پیش‌فرض 4000)
    - `channels.slack.chunkMode="newline"` تقسیم‌بندی با اولویت پاراگراف را فعال می‌کند
    - ارسال فایل‌ها از APIهای بارگذاری Slack استفاده می‌کند و می‌تواند شامل پاسخ‌های رشته‌ای (`thread_ts`) باشد
    - سقف رسانه خروجی، وقتی پیکربندی شده باشد، از `channels.slack.mediaMaxMb` پیروی می‌کند؛ در غیر این صورت، ارسال‌های کانال از پیش‌فرض‌های نوع MIME در مسیر رسانه استفاده می‌کنند

  </Accordion>

  <Accordion title="مقصدهای تحویل">
    مقصدهای صریح ترجیحی:

    - `user:<id>` برای پیام‌های مستقیم
    - `channel:<id>` برای کانال‌ها

    پیام‌های مستقیم Slack که فقط متن/بلوک دارند می‌توانند مستقیما به شناسه‌های کاربر ارسال شوند؛ بارگذاری فایل و ارسال‌های رشته‌ای ابتدا پیام مستقیم را از طریق APIهای گفت‌وگوی Slack باز می‌کنند، چون این مسیرها به یک شناسه گفت‌وگوی مشخص نیاز دارند.

  </Accordion>
</AccordionGroup>

## دستورها و رفتار slash

دستورهای slash در Slack به‌صورت یک دستور پیکربندی‌شده واحد یا چند دستور بومی ظاهر می‌شوند. برای تغییر پیش‌فرض‌های دستور، `channels.slack.slashCommand` را پیکربندی کنید:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

دستورهای بومی به [تنظیمات manifest اضافی](#additional-manifest-settings) در برنامه Slack شما نیاز دارند و در عوض با `channels.slack.commands.native: true` یا `commands.native: true` در پیکربندی‌های سراسری فعال می‌شوند.

- حالت خودکار دستور بومی برای Slack **خاموش** است، بنابراین `commands.native: "auto"` دستورهای بومی Slack را فعال نمی‌کند.

```txt
/help
```

منوهای آرگومان بومی از یک راهبرد رندر تطبیقی استفاده می‌کنند که پیش از ارسال مقدار گزینه انتخاب‌شده، یک modal تأیید نشان می‌دهد:

- تا 5 گزینه: بلوک‌های دکمه
- 6 تا 100 گزینه: منوی انتخاب ایستا
- بیش از 100 گزینه: انتخاب خارجی با فیلتر ناهمگام گزینه‌ها، وقتی handlerهای گزینه‌های تعاملی در دسترس باشند
- محدودیت‌های Slack رد شده: مقدارهای گزینه کدگذاری‌شده به دکمه‌ها برمی‌گردند

```txt
/think
```

نشست‌های slash از کلیدهای ایزوله مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای دستورها را با استفاده از `CommandTargetSessionKey` به نشست گفت‌وگوی هدف مسیریابی می‌کنند.

## پاسخ‌های تعاملی

Slack می‌تواند کنترل‌های پاسخ تعاملی نوشته‌شده توسط عامل را رندر کند، اما این قابلیت به‌طور پیش‌فرض غیرفعال است.

فعال‌سازی سراسری:

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

این دستورالعمل‌ها به Slack Block Kit کامپایل می‌شوند و کلیک‌ها یا انتخاب‌ها را از مسیر رویداد تعامل موجود Slack بازمی‌گردانند.

نکته‌ها:

- این UI مخصوص Slack است. کانال‌های دیگر دستورالعمل‌های Slack Block Kit را به سیستم‌های دکمه خود تبدیل نمی‌کنند.
- مقدارهای callback تعاملی، توکن‌های opaque تولیدشده توسط OpenClaw هستند، نه مقدارهای خام نوشته‌شده توسط عامل.
- اگر بلوک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit فراتر بروند، OpenClaw به‌جای ارسال payload نامعتبر blocks، به پاسخ متنی اصلی برمی‌گردد.

## تأییدهای Exec در Slack

Slack می‌تواند به‌جای برگشت به UI وب یا ترمینال، با دکمه‌ها و تعامل‌های تعاملی به‌عنوان کلاینت تأیید بومی عمل کند.

- تأییدهای Exec از `channels.slack.execApprovals.*` برای مسیریابی بومی پیام مستقیم/کانال استفاده می‌کنند.
- تأییدهای Plugin همچنان می‌توانند از طریق همان سطح دکمه بومی Slack حل شوند، وقتی درخواست از قبل در Slack وارد شده باشد و نوع شناسه تأیید `plugin:` باشد.
- مجوز تأییدکننده همچنان اعمال می‌شود: فقط کاربرانی که به‌عنوان تأییدکننده شناسایی شده‌اند می‌توانند از طریق Slack درخواست‌ها را تأیید یا رد کنند.

این از همان سطح دکمه تأیید مشترک کانال‌های دیگر استفاده می‌کند. وقتی `interactivity` در تنظیمات برنامه Slack شما فعال باشد، اعلان‌های تأیید به‌صورت دکمه‌های Block Kit مستقیما در گفت‌وگو رندر می‌شوند.
وقتی این دکمه‌ها حاضر باشند، تجربه کاربری اصلی تأیید همان‌ها هستند؛ OpenClaw
فقط زمانی باید یک دستور دستی `/approve` را شامل کند که نتیجه ابزار بگوید تأییدهای چت
در دسترس نیستند یا تأیید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`, `sessionFilter`

Slack وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک
تأییدکننده resolve شود، تأییدهای Exec بومی را خودکار فعال می‌کند. برای غیرفعال‌سازی صریح Slack به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.
برای اجبار فعال‌سازی تأییدهای بومی وقتی تأییدکننده‌ها resolve می‌شوند، `enabled: true` را تنظیم کنید.

رفتار پیش‌فرض بدون پیکربندی صریح تأیید Exec در Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

پیکربندی صریح بومی Slack فقط وقتی لازم است که بخواهید تأییدکننده‌ها را بازنویسی کنید، فیلتر اضافه کنید، یا
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

ارسال مجدد مشترک `approvals.exec` جداست. فقط زمانی از آن استفاده کنید که اعلان‌های تأیید Exec باید همچنین
به چت‌های دیگر یا مقصدهای صریح خارج از باند مسیریابی شوند. ارسال مجدد مشترک `approvals.plugin` نیز
جداست؛ دکمه‌های بومی Slack همچنان می‌توانند تأییدهای Plugin را وقتی آن درخواست‌ها از قبل
در Slack وارد شده‌اند resolve کنند.

`/approve` در همان چت نیز در کانال‌ها و پیام‌های مستقیم Slack که از قبل از دستورها پشتیبانی می‌کنند کار می‌کند. برای مدل کامل ارسال مجدد تأیید، [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

## رویدادها و رفتار عملیاتی

- ویرایش/حذف پیام‌ها به رویدادهای سیستمی نگاشت می‌شوند.
- پخش‌های رشته‌ای (پاسخ‌های رشته‌ای «همچنین به کانال ارسال کن») به‌عنوان پیام‌های عادی کاربر پردازش می‌شوند.
- رویدادهای افزودن/حذف واکنش به رویدادهای سیستمی نگاشت می‌شوند.
- رویدادهای پیوستن/ترک عضو، ایجاد/تغییرنام کانال، و افزودن/حذف pin به رویدادهای سیستمی نگاشت می‌شوند.
- وقتی `configWrites` فعال باشد، `channel_id_changed` می‌تواند کلیدهای پیکربندی کانال را مهاجرت دهد.
- فراداده موضوع/هدف کانال به‌عنوان زمینه غیرقابل اعتماد در نظر گرفته می‌شود و می‌تواند به زمینه مسیریابی تزریق شود.
- آغازگر رشته و seed کردن زمینه تاریخچه اولیه رشته، در صورت کاربرد، با allowlistهای فرستنده پیکربندی‌شده فیلتر می‌شوند.
- اکشن‌های بلوک و تعامل‌های modal رویدادهای سیستمی ساختاریافته `Slack interaction: ...` را با فیلدهای payload غنی منتشر می‌کنند:
  - اکشن‌های بلوک: مقدارهای انتخاب‌شده، labelها، مقدارهای picker، و فراداده `workflow_*`
  - رویدادهای modal `view_submission` و `view_closed` با فراداده کانال مسیریابی‌شده و ورودی‌های فرم

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="فیلدهای مهم Slack">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- دسترسی پیام مستقیم: `dm.enabled`, `dmPolicy`, `allowFrom` (قدیمی: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle سازگاری: `dangerouslyAllowNameMatching` (break-glass؛ مگر در صورت نیاز خاموش نگه دارید)
- دسترسی کانال: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- رشته‌بندی/تاریخچه: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/features: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="هیچ پاسخی در کانال‌ها دریافت نمی‌شود">
    به‌ترتیب بررسی کنید:

    - `groupPolicy`
    - allowlist کانال (`channels.slack.channels`) — **کلیدها باید شناسه کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام تحت `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، چون مسیریابی کانال به‌طور پیش‌فرض ابتدا بر پایه شناسه است. برای پیدا کردن شناسه: در Slack روی کانال راست‌کلیک کنید → **Copy link** — مقدار `C...` در انتهای URL شناسه کانال است.
    - `requireMention`
    - allowlist کاربران در هر کانال

    دستورهای مفید:

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
    - تأییدهای pairing / ورودی‌های allowlist
    - رویدادهای پیام مستقیم Slack Assistant: logهای verbose که به `drop message_changed` اشاره می‌کنند
      معمولا یعنی Slack یک رویداد رشته Assistant ویرایش‌شده را بدون
      فرستنده انسانی قابل بازیابی در فراداده پیام ارسال کرده است

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode وصل نمی‌شود">
    توکن‌های bot + app و فعال بودن Socket Mode را در تنظیمات برنامه Slack اعتبارسنجی کنید.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان دهد، حساب Slack
    پیکربندی شده است اما زمان اجرای فعلی نتوانسته مقدار پشتیبانی‌شده با SecretRef را
    resolve کند.

  </Accordion>

  <Accordion title="HTTP mode رویدادها را دریافت نمی‌کند">
    اعتبارسنجی کنید:

    - signing secret
    - مسیر Webhook
    - URLهای درخواست Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` یکتا برای هر حساب HTTP

    اگر `signingSecretStatus: "configured_unavailable"` در snapshotهای حساب
    ظاهر شود، حساب HTTP پیکربندی شده است اما زمان اجرای فعلی نتوانسته
    signing secret پشتیبانی‌شده با SecretRef را resolve کند.

  </Accordion>

  <Accordion title="دستورهای Native/slash اجرا نمی‌شوند">
    بررسی کنید کدام‌یک را در نظر داشته‌اید:

    - حالت دستور بومی (`channels.slack.commands.native: true`) با دستورهای slash مطابق که در Slack ثبت شده‌اند
    - یا حالت دستور slash واحد (`channels.slack.slashCommand.enabled: true`)

    همچنین `commands.useAccessGroups` و allowlistهای کانال/کاربر را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مرجع vision پیوست

Slack می‌تواند رسانه‌های دانلودشده را وقتی دانلود فایل‌های Slack موفق باشد و محدودیت‌های اندازه اجازه دهد، به نوبت عامل پیوست کند. فایل‌های تصویری می‌توانند از مسیر درک رسانه عبور داده شوند یا مستقیماً به یک مدل پاسخ دارای قابلیت بینایی داده شوند؛ فایل‌های دیگر به‌عنوان زمینهٔ فایل قابل دانلود نگه داشته می‌شوند، نه اینکه به‌عنوان ورودی تصویر تلقی شوند.

### انواع رسانهٔ پشتیبانی‌شده

| نوع رسانه                      | منبع                 | رفتار فعلی                                                                         | نکات                                                                      |
| ------------------------------ | -------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| تصاویر JPEG / PNG / GIF / WebP | نشانی فایل Slack     | دانلود می‌شوند و برای پردازش دارای قابلیت بینایی به نوبت پیوست می‌شوند             | سقف هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض 20 مگابایت)            |
| فایل‌های PDF                   | نشانی فایل Slack     | دانلود می‌شوند و به‌عنوان زمینهٔ فایل برای ابزارهایی مانند `download-file` یا `pdf` در دسترس قرار می‌گیرند | ورودی Slack به‌طور خودکار PDFها را به ورودی بینایی تصویر تبدیل نمی‌کند |
| فایل‌های دیگر                  | نشانی فایل Slack     | در صورت امکان دانلود می‌شوند و به‌عنوان زمینهٔ فایل در دسترس قرار می‌گیرند         | فایل‌های دودویی به‌عنوان ورودی تصویر تلقی نمی‌شوند                       |
| پاسخ‌های رشته گفتگو            | فایل‌های شروع‌کنندهٔ رشته گفتگو | فایل‌های پیام ریشه می‌توانند وقتی پاسخ رسانهٔ مستقیم ندارد، به‌عنوان زمینه بازیابی شوند | شروع‌کننده‌های فقط‌فایل از یک جای‌نگهدار پیوست استفاده می‌کنند          |
| پیام‌های چندتصویری             | چندین فایل Slack     | هر فایل به‌صورت مستقل ارزیابی می‌شود                                               | پردازش Slack به هشت فایل در هر پیام محدود است                            |

### خط لولهٔ ورودی

وقتی یک پیام Slack همراه با پیوست‌های فایل می‌رسد:

1. OpenClaw فایل را با استفاده از توکن ربات (`xoxb-...`) از نشانی خصوصی Slack دانلود می‌کند.
2. در صورت موفقیت، فایل در ذخیره‌گاه رسانه نوشته می‌شود.
3. مسیرهای رسانهٔ دانلودشده و انواع محتوا به زمینهٔ ورودی افزوده می‌شوند.
4. مسیرهای مدل/ابزار دارای قابلیت تصویر می‌توانند از پیوست‌های تصویر موجود در آن زمینه استفاده کنند.
5. فایل‌های غیرتصویری به‌عنوان فرادادهٔ فایل یا ارجاع‌های رسانه برای ابزارهایی که می‌توانند آن‌ها را مدیریت کنند، در دسترس می‌مانند.

### ارث‌بری پیوست از ریشهٔ رشته گفتگو

وقتی پیامی در یک رشته گفتگو می‌رسد (یک والد `thread_ts` دارد):

- اگر خود پاسخ رسانهٔ مستقیم نداشته باشد و پیام ریشهٔ شامل‌شده فایل داشته باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان زمینهٔ شروع‌کنندهٔ رشته گفتگو بازیابی کند.
- پیوست‌های مستقیم پاسخ بر پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و متن ندارد، با یک جای‌نگهدار پیوست نمایش داده می‌شود تا مسیر جایگزین همچنان بتواند فایل‌های آن را شامل کند.

### مدیریت چندپیوستی

وقتی یک پیام Slack واحد چندین پیوست فایل دارد:

- هر پیوست به‌صورت مستقل از طریق خط لولهٔ رسانه پردازش می‌شود.
- ارجاع‌های رسانهٔ دانلودشده در زمینهٔ پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در بار دادهٔ رویداد پیروی می‌کند.
- شکست در دانلود یک پیوست، پیوست‌های دیگر را مسدود نمی‌کند.

### محدودیت‌های اندازه، دانلود و مدل

- **سقف اندازه**: پیش‌فرض 20 مگابایت برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل پیکربندی است.
- **شکست‌های دانلود**: فایل‌هایی که Slack نمی‌تواند ارائه کند، نشانی‌های منقضی‌شده، فایل‌های غیرقابل دسترسی، فایل‌های بیش‌ازحد بزرگ، و پاسخ‌های HTML احراز هویت/ورود Slack به‌جای گزارش‌شدن به‌عنوان قالب‌های پشتیبانی‌نشده، نادیده گرفته می‌شوند.
- **مدل بینایی**: تحلیل تصویر وقتی مدل پاسخ فعال از بینایی پشتیبانی کند از همان مدل استفاده می‌کند، یا از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel`.

### محدودیت‌های شناخته‌شده

| سناریو                                | رفتار فعلی                                                                       | راهکار جایگزین                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| نشانی فایل Slack منقضی‌شده            | فایل نادیده گرفته می‌شود؛ خطایی نمایش داده نمی‌شود                              | فایل را دوباره در Slack بارگذاری کنید                                        |
| مدل بینایی پیکربندی نشده است          | پیوست‌های تصویر به‌عنوان ارجاع‌های رسانه ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند | `agents.defaults.imageModel` را پیکربندی کنید یا از یک مدل پاسخ دارای قابلیت بینایی استفاده کنید |
| تصاویر بسیار بزرگ (> 20 مگابایت به‌طور پیش‌فرض) | براساس سقف اندازه نادیده گرفته می‌شوند                                           | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید           |
| پیوست‌های ارسال‌شده/اشتراک‌گذاری‌شده | متن و رسانهٔ تصویر/فایل میزبانی‌شده در Slack به‌صورت best-effort پردازش می‌شوند | مستقیماً در رشته گفتگوی OpenClaw دوباره به اشتراک بگذارید                   |
| پیوست‌های PDF                         | به‌عنوان زمینهٔ فایل/رسانه ذخیره می‌شوند، نه اینکه به‌طور خودکار از مسیر بینایی تصویر عبور داده شوند | برای فرادادهٔ فایل از `download-file` یا برای تحلیل PDF از ابزار `pdf` استفاده کنید |

### مستندات مرتبط

- [خط لولهٔ درک رسانه](/fa/nodes/media-understanding)
- [ابزار PDF](/fa/tools/pdf)
- اپیک: [#51349](https://github.com/openclaw/openclaw/issues/51349) — فعال‌سازی بینایی پیوست‌های Slack
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
    فهرست دستورها و رفتار.
  </Card>
</CardGroup>
