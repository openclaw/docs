---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی حالت سوکت/HTTP در Slack
summary: راه‌اندازی Slack و رفتار زمان اجرا (حالت Socket + URLهای درخواست HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:44:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a8e1cbfd3d99bfc24d79b56ee762d1ab399402391b241ff40698249b0828008
    source_path: channels/slack.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم و کانال‌ها از طریق یکپارچه‌سازی‌های Slack app. حالت پیش‌فرض Socket Mode است؛ HTTP Request URLs نیز پشتیبانی می‌شوند.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Slack به‌صورت پیش‌فرض در حالت جفت‌سازی هستند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستوری بومی و کاتالوگ دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های میان‌کانالی و راهنماهای عملیاتی تعمیر.
  </Card>
</CardGroup>

## انتخاب Socket Mode یا HTTP Request URLs

هر دو انتقال برای تولید آماده‌اند و از نظر پیام‌رسانی، دستورهای اسلش، App Home و تعامل‌پذیری به برابری قابلیتی می‌رسند. انتخاب را بر اساس شکل استقرار انجام دهید، نه قابلیت‌ها.

| ملاحظه                     | Socket Mode (پیش‌فرض)                                                               | HTTP Request URLs                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL عمومی Gateway           | لازم نیست                                                                            | لازم است (DNS، TLS، پراکسی معکوس یا تونل)                                                                     |
| شبکهٔ خروجی                 | WSS خروجی به `wss-primary.slack.com` باید قابل دسترسی باشد                          | بدون WS خروجی؛ فقط HTTPS ورودی                                                                                |
| توکن‌های لازم                | توکن Bot (`xoxb-...`) + توکن سطح برنامه (`xapp-...`) با `connections:write`         | توکن Bot (`xoxb-...`) + Signing Secret                                                                        |
| لپ‌تاپ توسعه / پشت فایروال  | بدون تغییر کار می‌کند                                                               | به یک تونل عمومی (ngrok، Cloudflare Tunnel، Tailscale Funnel) یا Gateway مرحله‌بندی نیاز دارد                |
| مقیاس‌پذیری افقی            | یک نشست Socket Mode برای هر برنامه روی هر میزبان؛ چند Gateway به Slack appهای جداگانه نیاز دارند | هندلر POST بی‌حالت؛ چند رپلیکای Gateway می‌توانند پشت یک بارمتعادل‌کننده یک برنامه را به اشتراک بگذارند |
| چند حساب روی یک Gateway      | پشتیبانی می‌شود؛ هر حساب WS خودش را باز می‌کند                                      | پشتیبانی می‌شود؛ هر حساب به `webhookPath` یکتا نیاز دارد (پیش‌فرض `/slack/events`) تا ثبت‌ها با هم تداخل نکنند |
| انتقال دستور اسلش           | از طریق اتصال WS تحویل می‌شود؛ `slash_commands[].url` نادیده گرفته می‌شود          | Slack به `slash_commands[].url` درخواست POST می‌فرستد؛ این فیلد برای ارسال دستور لازم است                   |
| امضای درخواست               | استفاده نمی‌شود (احراز هویت همان توکن سطح برنامه است)                              | Slack هر درخواست را امضا می‌کند؛ OpenClaw با `signingSecret` بررسی می‌کند                                  |
| بازیابی پس از قطع اتصال     | Slack SDK به‌صورت خودکار دوباره متصل می‌شود؛ تنظیم انتقال pong-timeout مربوط به gateway اعمال می‌شود | اتصال پایداری برای قطع شدن وجود ندارد؛ تلاش‌های دوباره برای هر درخواست از سمت Slack انجام می‌شوند        |

<Note>
  **Socket Mode را انتخاب کنید** برای میزبان‌های تک-Gateway، لپ‌تاپ‌های توسعه و شبکه‌های درون‌سازمانی که می‌توانند به `*.slack.com` خروجی داشته باشند اما نمی‌توانند HTTPS ورودی بپذیرند.

**HTTP Request URLs را انتخاب کنید** وقتی چند رپلیکای Gateway را پشت یک بارمتعادل‌کننده اجرا می‌کنید، وقتی WSS خروجی مسدود است اما HTTPS ورودی مجاز است، یا وقتی Webhookهای Slack را از قبل در یک پراکسی معکوس خاتمه می‌دهید.
</Note>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Socket Mode (پیش‌فرض)">
    <Steps>
      <Step title="یک Slack app جدید بسازید">
        [api.slack.com/apps](https://api.slack.com/apps/new) را باز کنید → **Create New App** → **From a manifest** → فضای کاری خود را انتخاب کنید → یکی از مانیفست‌های زیر را جای‌گذاری کنید → **Next** → **Create**.

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
          **Recommended** با مجموعهٔ کامل قابلیت‌های Plugin داخلی Slack مطابقت دارد: App Home، دستورهای اسلش، فایل‌ها، واکنش‌ها، پین‌ها، پیام‌های مستقیم گروهی، و خواندن ایموجی/گروه کاربری. وقتی سیاست فضای کاری scopeها را محدود می‌کند، **Minimal** را انتخاب کنید — این گزینه پیام‌های مستقیم، تاریخچهٔ کانال/گروه، اشاره‌ها و دستورهای اسلش را پوشش می‌دهد اما فایل‌ها، واکنش‌ها، پین‌ها، پیام مستقیم گروهی (`mpim:*`)، `emoji:read` و `usergroups:read` را حذف می‌کند. برای دلیل هر scope و گزینه‌های افزایشی مانند دستورهای اسلش اضافی، [چک‌لیست مانیفست و scope](#manifest-and-scope-checklist) را ببینید.
        </Note>

        پس از اینکه Slack برنامه را ساخت:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: `connections:write` را اضافه کنید، ذخیره کنید، مقدار `xapp-...` را کپی کنید.
        - **Install App → Install to Workspace**: توکن OAuth کاربر Bot با مقدار `xoxb-...` را کپی کنید.

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

      <Step title="Gateway را شروع کنید">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="یک Slack app جدید بسازید">
        [api.slack.com/apps](https://api.slack.com/apps/new) را باز کنید → **Create New App** → **From a manifest** → فضای کاری خود را انتخاب کنید → یکی از مانیفست‌های زیر را جای‌گذاری کنید → `https://gateway-host.example.com/slack/events` را با URL عمومی Gateway خود جایگزین کنید → **Next** → **Create**.

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
          **Recommended** با مجموعه کامل قابلیت‌های Plugin داخلی Slack مطابقت دارد؛ **Minimal** فایل‌ها، واکنش‌ها، پین‌ها، پیام مستقیم گروهی (`mpim:*`)، `emoji:read` و `usergroups:read` را برای فضاهای کاری محدود حذف می‌کند. برای دلیل هر scope، [چک‌لیست manifest و scope](#manifest-and-scope-checklist) را ببینید.
        </Note>

        <Info>
          هر سه فیلد URL (`slash_commands[].url`، `event_subscriptions.request_url` و `interactivity.request_url` / `message_menu_options_url`) همگی به همان endpoint مربوط به OpenClaw اشاره می‌کنند. شِمای manifest در Slack الزام می‌کند که این‌ها جداگانه نام‌گذاری شوند، اما OpenClaw بر اساس نوع payload مسیریابی می‌کند، بنابراین یک `webhookPath` واحد (پیش‌فرض `/slack/events`) کافی است. فرمان‌های slash بدون `slash_commands[].url` در حالت HTTP بی‌صدا هیچ کاری انجام نمی‌دهند.
        </Info>

        پس از اینکه Slack برنامه را ایجاد کرد:

        - **Basic Information → App Credentials**: برای راستی‌آزمایی درخواست، **Signing Secret** را کپی کنید.
        - **Install App → Install to Workspace**: توکن OAuth کاربر Bot با قالب `xoxb-...` را کپی کنید.

      </Step>

      <Step title="Configure OpenClaw">

        پیکربندی SecretRef توصیه‌شده:

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

OpenClaw به‌طور پیش‌فرض زمان‌انتظار pong کلاینت Slack SDK را برای Socket Mode روی ۱۵ ثانیه تنظیم می‌کند. تنظیمات transport را فقط زمانی بازنویسی کنید که به تنظیم‌های مخصوص فضای کاری یا میزبان نیاز دارید:

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

این مورد را فقط برای فضاهای کاری Socket Mode استفاده کنید که زمان‌انتظار‌های pong یا server-ping در websocket مربوط به Slack را لاگ می‌کنند یا روی میزبان‌هایی اجرا می‌شوند که با کمبود چرخه event-loop شناخته‌شده مواجه‌اند. `clientPingTimeout` زمان انتظار برای pong پس از آن است که SDK یک ping کلاینت می‌فرستد؛ `serverPingTimeout` زمان انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای برنامه همچنان وضعیت برنامه هستند، نه سیگنال‌های زنده‌بودن transport.

## چک‌لیست manifest و scope

manifest پایه برنامه Slack برای Socket Mode و URLهای درخواست HTTP یکسان است. فقط بلوک `settings` (و `url` فرمان slash) متفاوت است.

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

قابلیت‌های متفاوتی را نمایش دهید که پیش‌فرض‌های بالا را گسترش می‌دهند.

manifest پیش‌فرض، برگه **Home** در App Home مربوط به Slack را فعال می‌کند و در `app_home_opened` مشترک می‌شود. وقتی عضوی از فضای کاری برگه Home را باز می‌کند، OpenClaw یک نمای Home پیش‌فرض ایمن را با `views.publish` منتشر می‌کند؛ هیچ payload مکالمه یا پیکربندی خصوصی در آن گنجانده نمی‌شود. برگه **Messages** برای پیام‌های مستقیم Slack همچنان فعال می‌ماند.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    می‌توان به‌جای یک فرمان پیکربندی‌شده واحد، از چند [فرمان slash بومی](#commands-and-slash-behavior) با جزئیات بیشتر استفاده کرد:

    - از `/agentstatus` به‌جای `/status` استفاده کنید، چون فرمان `/status` رزرو شده است.
    - بیش از ۲۵ فرمان slash را نمی‌توان هم‌زمان در دسترس قرار داد.

    بخش فعلی `features.slash_commands` خود را با زیرمجموعه‌ای از [فرمان‌های موجود](/fa/tools/slash-commands#command-list) جایگزین کنید:

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
        از همان فهرست `slash_commands` بالا برای Socket Mode استفاده کنید، و به هر ورودی `"url": "https://gateway-host.example.com/slack/events"` اضافه کنید. نمونه:

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

        همان مقدار `url` را برای هر فرمان در فهرست تکرار کنید.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="دامنه‌های اختیاری نویسندگی (عملیات نوشتن)">
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض برنامه Slack از هویت عامل فعال (نام کاربری و آیکن سفارشی) استفاده کنند، دامنه ربات `chat:write.customize` را اضافه کنید.

    اگر از آیکن ایموجی استفاده می‌کنید، Slack انتظار نحو `:emoji_name:` را دارد.

  </Accordion>
  <Accordion title="دامنه‌های اختیاری توکن کاربر (عملیات خواندن)">
    اگر `channels.slack.userToken` را پیکربندی کنید، دامنه‌های خواندن معمول عبارت‌اند از:

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
- توکن‌های پیکربندی، جایگزین پشتیبان env می‌شوند.
- پشتیبان env با `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
- `userToken` (`xoxp-...`) فقط از پیکربندی می‌آید (بدون پشتیبان env) و به‌طور پیش‌فرض رفتار فقط‌خواندنی دارد (`userTokenReadOnly: true`).

رفتار نمایه وضعیت:

- بازرسی حساب Slack برای هر اعتبارنامه، فیلدهای `*Source` و `*Status`
  را ردیابی می‌کند (`botToken`، `appToken`، `signingSecret`، `userToken`).
- وضعیت `available`، `configured_unavailable` یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا یک منبع راز غیرخطی دیگر پیکربندی شده است، اما مسیر فرمان/زمان‌اجرای فعلی
  نتوانست مقدار واقعی را resolve کند.
- در حالت HTTP، `signingSecretStatus` گنجانده می‌شود؛ در Socket Mode،
  جفت الزامی `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای کنش‌ها/خواندن‌های فهرست، وقتی توکن کاربر پیکربندی شده باشد می‌تواند ترجیح داده شود. برای نوشتن‌ها، توکن ربات همچنان ترجیح داده می‌شود؛ نوشتن با توکن کاربر فقط وقتی مجاز است که `userTokenReadOnly: false` باشد و توکن ربات در دسترس نباشد.
</Tip>

## کنش‌ها و دروازه‌ها

کنش‌های Slack با `channels.slack.actions.*` کنترل می‌شوند.

گروه‌های کنش موجود در ابزار فعلی Slack:

| گروه       | پیش‌فرض |
| ---------- | ------- |
| messages   | فعال |
| reactions  | فعال |
| pins       | فعال |
| memberInfo | فعال |
| emojiList  | فعال |

کنش‌های فعلی پیام Slack شامل `send`، `upload-file`، `download-file`، `read`، `edit`، `delete`، `pin`، `unpin`، `list-pins`، `member-info` و `emoji-list` هستند. `download-file` شناسه‌های فایل Slack را که در جای‌نگهدارهای فایل ورودی نشان داده می‌شوند می‌پذیرد و برای تصویرها پیش‌نمایش تصویر یا برای انواع فایل دیگر فراداده فایل محلی برمی‌گرداند.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست DM">
    `channels.slack.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.slack.allowFrom` فهرست مجاز canonical برای DM است.

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
    - حساب‌های نام‌گذاری‌شده وقتی `allowFrom` خودشان تنظیم نشده باشد، `channels.slack.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌گذاری‌شده `channels.slack.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.slack.dm.policy` و `channels.slack.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    جفت‌سازی در DMها از `openclaw pairing approve slack <code>` استفاده می‌کند.

  </Tab>

  <Tab title="سیاست کانال">
    `channels.slack.groupPolicy` مدیریت کانال را کنترل می‌کند:

    - `open`
    - `allowlist`
    - `disabled`

    فهرست مجاز کانال زیر `channels.slack.channels` قرار دارد و **باید از شناسه‌های پایدار کانال Slack** (برای مثال `C12345678`) به‌عنوان کلیدهای پیکربندی استفاده کند.

    نکته زمان‌اجرا: اگر `channels.slack` کاملاً وجود نداشته باشد (راه‌اندازی فقط env)، زمان‌اجرا به `groupPolicy="allowlist"` برمی‌گردد و هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    حل نام/شناسه:

    - ورودی‌های فهرست مجاز کانال و ورودی‌های فهرست مجاز DM هنگام راه‌اندازی، وقتی دسترسی توکن اجازه دهد، resolve می‌شوند
    - ورودی‌های نام کانال resolveنشده همان‌طور که پیکربندی شده‌اند نگه داشته می‌شوند اما به‌طور پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند
    - مجوزدهی ورودی و مسیریابی کانال به‌طور پیش‌فرض ابتدا بر پایه شناسه است؛ تطبیق مستقیم نام کاربری/slug به `channels.slack.dangerouslyAllowNameMatching: true` نیاز دارد

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) زیر `groupPolicy: "allowlist"` تطبیق داده **نمی‌شوند**. جست‌وجوی کانال به‌طور پیش‌فرض ابتدا بر پایه شناسه است، پس کلید مبتنی بر نام هرگز با موفقیت مسیریابی نمی‌شود و همه پیام‌ها در آن کانال بی‌صدا مسدود می‌شوند. این با `groupPolicy: "open"` متفاوت است، جایی که کلید کانال برای مسیریابی لازم نیست و به نظر می‌رسد کلید مبتنی بر نام کار می‌کند.

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

    نادرست (به‌صورت بی‌صدا تحت `groupPolicy: "allowlist"` مسدود می‌شود):

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
    پیام‌های کانال به‌طور پیش‌فرض با شرط منشن کنترل می‌شوند.

    منابع منشن:

    - منشن صریح برنامه (`<@botId>`)
    - منشن گروه کاربری Slack (`<!subteam^S...>`) وقتی کاربر ربات عضو آن گروه کاربری باشد؛ به `usergroups:read` نیاز دارد
    - الگوهای عبارت منظم منشن (`agents.list[].groupChat.mentionPatterns`، جایگزین `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به رشته ربات (وقتی `thread.requireExplicitMention` برابر `true` باشد غیرفعال می‌شود)

    کنترل‌های هر کانال (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق حل هنگام راه‌اندازی یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (فهرست مجاز)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - قالب کلید `toolsBySender`: `id:`, `e164:`, `username:`, `name:`، یا وایلدکارت `"*"`
      (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند)

    `allowBots` برای کانال‌ها و کانال‌های خصوصی محافظه‌کارانه عمل می‌کند: پیام‌های اتاق که توسط ربات نوشته شده‌اند فقط وقتی پذیرفته می‌شوند که ربات فرستنده به‌صراحت در فهرست مجاز `users` همان اتاق آمده باشد، یا وقتی حداقل یک شناسه مالک صریح Slack از `channels.slack.allowFrom` در حال حاضر عضو اتاق باشد. وایلدکارت‌ها و مدخل‌های مالک با نام نمایشی، حضور مالک را احراز نمی‌کنند. حضور مالک از `conversations.members` در Slack استفاده می‌کند؛ مطمئن شوید برنامه دامنه خواندن متناظر با نوع اتاق را دارد (`channels:read` برای کانال‌های عمومی، `groups:read` برای کانال‌های خصوصی). اگر جست‌وجوی عضو شکست بخورد، OpenClaw پیام اتاقِ نوشته‌شده توسط ربات را کنار می‌گذارد.

  </Tab>
</Tabs>

## رشته‌بندی، نشست‌ها، و برچسب‌های پاسخ

- پیام‌های مستقیم به‌صورت `direct` مسیریابی می‌شوند؛ کانال‌ها به‌صورت `channel`؛ پیام‌های مستقیم چندنفره به‌صورت `group`.
- اتصال‌های مسیر Slack شناسه‌های خام همتا را به‌همراه قالب‌های هدف Slack مانند `channel:C12345678`، `user:U12345678`، و `<@U12345678>` می‌پذیرند.
- با `session.dmScope=main` پیش‌فرض، پیام‌های مستقیم Slack در نشست اصلی عامل ادغام می‌شوند.
- نشست‌های کانال: `agent:<agentId>:slack:channel:<channelId>`.
- پاسخ‌های رشته می‌توانند در صورت امکان پسوندهای نشست رشته (`:thread:<threadTs>`) ایجاد کنند.
- مقدار پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ مقدار پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` کنترل می‌کند هنگام شروع یک نشست رشته جدید، چه تعداد از پیام‌های موجود رشته واکشی شوند (پیش‌فرض `20`؛ برای غیرفعال کردن روی `0` تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، منشن‌های ضمنی رشته را سرکوب می‌کند تا ربات فقط به منشن‌های صریح `@bot` داخل رشته‌ها پاسخ دهد، حتی وقتی ربات قبلاً در رشته مشارکت داشته است. بدون این، پاسخ‌ها در رشته‌ای که ربات در آن مشارکت داشته، شرط `requireMention` را دور می‌زنند.

کنترل‌های رشته‌بندی پاسخ:

- `channels.slack.replyToMode`: `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: به‌ازای هر `direct|group|channel`
- جایگزین قدیمی برای گفت‌وگوهای مستقیم: `channels.slack.dm.replyToMode`

برچسب‌های پاسخ دستی پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` **همه** رشته‌بندی پاسخ را در Slack غیرفعال می‌کند، از جمله برچسب‌های صریح `[[reply_to_*]]`. این با Telegram متفاوت است، که در آن برچسب‌های صریح همچنان در حالت `"off"` رعایت می‌شوند. رشته‌های Slack پیام‌ها را از کانال پنهان می‌کنند، در حالی که پاسخ‌های Telegram به‌صورت درون‌خطی قابل مشاهده می‌مانند.
</Note>

## واکنش‌های تأیید دریافت

`ackReaction` هنگام پردازش پیام ورودی توسط OpenClaw یک ایموجی تأیید دریافت می‌فرستد.

ترتیب تعیین مقدار:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- گزینه جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

نکته‌ها:

- Slack انتظار کدهای کوتاه را دارد (برای مثال `"eyes"`).
- برای غیرفعال کردن واکنش برای حساب Slack یا به‌صورت سراسری، از `""` استفاده کنید.

## جریان‌دهی متن

`channels.slack.streaming` رفتار پیش‌نمایش زنده را کنترل می‌کند:

- `off`: جریان‌دهی پیش‌نمایش زنده را غیرفعال می‌کند.
- `partial` (پیش‌فرض): متن پیش‌نمایش را با آخرین خروجی جزئی جایگزین می‌کند.
- `block`: به‌روزرسانی‌های پیش‌نمایش قطعه‌قطعه را اضافه می‌کند.
- `progress`: هنگام تولید، متن وضعیت پیشرفت را نشان می‌دهد، سپس متن نهایی را می‌فرستد.
- `streaming.preview.toolProgress`: وقتی پیش‌نمایش پیش‌نویس فعال است، به‌روزرسانی‌های ابزار/پیشرفت را به همان پیام پیش‌نمایش ویرایش‌شده هدایت می‌کند (پیش‌فرض: `true`). برای نگه‌داشتن پیام‌های جداگانه ابزار/پیشرفت، روی `false` تنظیم کنید.
- `streaming.preview.commandText` / `streaming.progress.commandText`: برای نگه‌داشتن خطوط فشرده پیشرفت ابزار در حالی که متن خام فرمان/اجرا پنهان می‌شود، روی `status` تنظیم کنید (پیش‌فرض: `raw`).

پنهان کردن متن خام فرمان/اجرا در حالی که خطوط فشرده پیشرفت حفظ می‌شوند:

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

`channels.slack.streaming.nativeTransport` جریان‌دهی متنی بومی Slack را وقتی `channels.slack.streaming.mode` برابر `partial` باشد کنترل می‌کند (پیش‌فرض: `true`).

- برای نمایش جریان‌دهی متنی بومی و وضعیت رشته دستیار Slack، باید یک رشته پاسخ در دسترس باشد. انتخاب رشته همچنان از `replyToMode` پیروی می‌کند.
- ریشه‌های کانال، گپ گروهی، و پیام مستقیم سطح بالا همچنان می‌توانند وقتی جریان‌دهی بومی در دسترس نیست یا هیچ رشته پاسخی وجود ندارد، از پیش‌نمایش پیش‌نویس عادی استفاده کنند.
- پیام‌های مستقیم سطح بالای Slack به‌طور پیش‌فرض خارج از رشته می‌مانند، بنابراین پیش‌نمایش جریان/وضعیت بومی سبک رشته‌ای Slack را نشان نمی‌دهند؛ OpenClaw به‌جای آن یک پیش‌نمایش پیش‌نویس را در پیام مستقیم ارسال و ویرایش می‌کند.
- رسانه و محموله‌های غیرمتنی به تحویل عادی برمی‌گردند.
- خروجی‌های نهایی رسانه/خطا ویرایش‌های معلق پیش‌نمایش را لغو می‌کنند؛ خروجی‌های نهایی متن/بلوکِ واجد شرایط فقط وقتی اعمال می‌شوند که بتوانند پیش‌نمایش را درجا ویرایش کنند.
- اگر جریان‌دهی در میانه پاسخ شکست بخورد، OpenClaw برای محموله‌های باقی‌مانده به تحویل عادی برمی‌گردد.

به‌جای جریان‌دهی متنی بومی Slack از پیش‌نمایش پیش‌نویس استفاده کنید:

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

- `channels.slack.streamMode` (`replace | status_final | append`) به‌طور خودکار به `channels.slack.streaming.mode` مهاجرت داده می‌شود.
- مقدار بولی `channels.slack.streaming` به‌طور خودکار به `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` مهاجرت داده می‌شود.
- `channels.slack.nativeStreaming` قدیمی به‌طور خودکار به `channels.slack.streaming.nativeTransport` مهاجرت داده می‌شود.

## گزینه جایگزین واکنش تایپ

`typingReaction` هنگام پردازش پاسخ توسط OpenClaw، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس وقتی اجرا تمام شد آن را حذف می‌کند. این کار بیرون از پاسخ‌های رشته‌ای بیشترین کاربرد را دارد، چون آن‌ها از نشانگر وضعیت پیش‌فرض «در حال تایپ...» استفاده می‌کنند.

ترتیب تفکیک:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکته‌ها:

- Slack انتظار shortcode دارد (برای مثال `"hourglass_flowing_sand"`).
- واکنش به‌صورت best-effort انجام می‌شود و پس از تکمیل مسیر پاسخ یا شکست، پاک‌سازی به‌طور خودکار تلاش می‌شود.

## رسانه، قطعه‌بندی، و تحویل

<AccordionGroup>
  <Accordion title="Inbound attachments">
    پیوست‌های فایل Slack از URLهای خصوصی میزبانی‌شده توسط Slack دانلود می‌شوند (جریان درخواست احرازهویت‌شده با توکن) و وقتی دریافت موفق باشد و محدودیت‌های اندازه اجازه دهند، در مخزن رسانه نوشته می‌شوند. جایگزین‌های فایل شامل `fileId` مربوط به Slack هستند تا عامل‌ها بتوانند فایل اصلی را با `download-file` دریافت کنند.

    دانلودها از مهلت‌های زمانی محدود برای بیکاری و کل عملیات استفاده می‌کنند. اگر دریافت فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به جایگزین فایل fallback می‌کند.

    سقف اندازه ورودی در زمان اجرا، مگر اینکه با `channels.slack.mediaMaxMb` بازنویسی شود، به‌طور پیش‌فرض `20MB` است.

  </Accordion>

  <Accordion title="Outbound text and files">
    - قطعه‌های متن از `channels.slack.textChunkLimit` استفاده می‌کنند (پیش‌فرض 4000)
    - `channels.slack.chunkMode="newline"` تقسیم‌بندی با اولویت پاراگراف را فعال می‌کند
    - ارسال فایل از APIهای بارگذاری Slack استفاده می‌کند و می‌تواند شامل پاسخ‌های رشته‌ای (`thread_ts`) باشد
    - سقف رسانه خروجی، وقتی پیکربندی شده باشد، از `channels.slack.mediaMaxMb` پیروی می‌کند؛ در غیر این صورت ارسال‌های کانال از پیش‌فرض‌های نوع MIME در پایپ‌لاین رسانه استفاده می‌کنند

  </Accordion>

  <Accordion title="Delivery targets">
    هدف‌های صریح ترجیحی:

    - `user:<id>` برای DMها
    - `channel:<id>` برای کانال‌ها

    DMهای Slack که فقط متن/بلوک دارند می‌توانند مستقیماً به شناسه‌های کاربر ارسال شوند؛ بارگذاری فایل و ارسال‌های رشته‌ای ابتدا DM را از طریق APIهای مکالمه Slack باز می‌کنند، چون آن مسیرها به یک شناسه مکالمه مشخص نیاز دارند.

  </Accordion>
</AccordionGroup>

## فرمان‌ها و رفتار slash

فرمان‌های slash در Slack یا به‌صورت یک فرمان پیکربندی‌شده واحد ظاهر می‌شوند یا به‌صورت چند فرمان بومی. برای تغییر پیش‌فرض‌های فرمان، `channels.slack.slashCommand` را پیکربندی کنید:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

فرمان‌های بومی به [تنظیمات manifest اضافی](#additional-manifest-settings) در برنامه Slack شما نیاز دارند و در عوض با `channels.slack.commands.native: true` یا `commands.native: true` در پیکربندی‌های سراسری فعال می‌شوند.

- حالت خودکار فرمان بومی برای Slack **خاموش** است، بنابراین `commands.native: "auto"` فرمان‌های بومی Slack را فعال نمی‌کند.

```txt
/help
```

منوهای آرگومان بومی از راهبرد رندر سازگار استفاده می‌کنند که پیش از dispatch کردن مقدار گزینه انتخاب‌شده، یک modal تأیید نشان می‌دهد:

- تا 5 گزینه: بلوک‌های دکمه
- 6 تا 100 گزینه: منوی انتخاب ایستا
- بیش از 100 گزینه: انتخاب خارجی با فیلتر async گزینه‌ها وقتی handlerهای گزینه‌های interactivity در دسترس باشند
- عبور از محدودیت‌های Slack: مقدارهای گزینه کدگذاری‌شده به دکمه‌ها fallback می‌کنند

```txt
/think
```

جلسه‌های slash از کلیدهای ایزوله مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای فرمان‌ها را با `CommandTargetSessionKey` به جلسه مکالمه هدف route می‌کنند.

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

وقتی فعال باشد، عامل‌ها می‌توانند directiveهای پاسخ فقط مخصوص Slack منتشر کنند:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

این directiveها به Slack Block Kit کامپایل می‌شوند و کلیک‌ها یا انتخاب‌ها را از مسیر رویداد تعامل موجود Slack بازمی‌گردانند.

نکته‌ها:

- این UI مخصوص Slack است. کانال‌های دیگر directiveهای Slack Block Kit را به سامانه‌های دکمه خودشان ترجمه نمی‌کنند.
- مقدارهای callback تعاملی، توکن‌های opaque تولیدشده توسط OpenClaw هستند، نه مقدارهای خام نوشته‌شده توسط عامل.
- اگر بلوک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit عبور کنند، OpenClaw به‌جای ارسال payload بلوک نامعتبر، به پاسخ متنی اصلی fallback می‌کند.

## تأییدهای exec در Slack

Slack می‌تواند به‌جای fallback کردن به Web UI یا ترمینال، به‌عنوان یک کلاینت تأیید بومی با دکمه‌ها و تعامل‌های تعاملی عمل کند.

- تأییدهای exec از `channels.slack.execApprovals.*` برای route کردن بومی DM/کانال استفاده می‌کنند.
- تأییدهای Plugin همچنان می‌توانند از همان سطح دکمه بومی Slack resolve شوند، وقتی درخواست از قبل در Slack فرود آمده باشد و نوع شناسه تأیید `plugin:` باشد.
- مجوزدهی تأییدکننده همچنان enforce می‌شود: فقط کاربرانی که به‌عنوان تأییدکننده شناسایی شده‌اند می‌توانند از طریق Slack درخواست‌ها را تأیید یا رد کنند.

این از همان سطح دکمه تأیید مشترک مانند کانال‌های دیگر استفاده می‌کند. وقتی `interactivity` در تنظیمات برنامه Slack شما فعال باشد، promptهای تأیید مستقیماً در مکالمه به‌صورت دکمه‌های Block Kit رندر می‌شوند.
وقتی این دکمه‌ها حاضر باشند، UX اصلی تأیید هستند؛ OpenClaw
فقط زمانی باید یک فرمان دستی `/approve` اضافه کند که نتیجه ابزار بگوید تأییدهای چت
در دسترس نیستند یا تأیید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ وقتی ممکن باشد به `commands.ownerAllowFrom` fallback می‌کند)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`, `sessionFilter`

Slack وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک
تأییدکننده resolve شود، تأییدهای exec بومی را خودکار فعال می‌کند. برای غیرفعال کردن صریح Slack به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.
برای اجبار تأییدهای بومی وقتی تأییدکننده‌ها resolve می‌شوند، `enabled: true` را تنظیم کنید.

رفتار پیش‌فرض بدون پیکربندی صریح تأیید exec در Slack:

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

forward کردن مشترک `approvals.exec` جداست. فقط وقتی از آن استفاده کنید که promptهای تأیید exec باید همچنین
به چت‌های دیگر یا هدف‌های صریح out-of-band route شوند. forward کردن مشترک `approvals.plugin` نیز
جداست؛ دکمه‌های بومی Slack همچنان می‌توانند تأییدهای Plugin را resolve کنند، وقتی آن درخواست‌ها از قبل
در Slack فرود آمده باشند.

`/approve` در همان چت نیز در کانال‌ها و DMهای Slack که از قبل از فرمان‌ها پشتیبانی می‌کنند کار می‌کند. برای مدل کامل forward کردن تأیید، [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

## رویدادها و رفتار عملیاتی

- ویرایش‌ها/حذف‌های پیام به رویدادهای سیستمی نگاشت می‌شوند.
- پخش‌های رشته‌ای (پاسخ‌های رشته‌ای «همچنین به کانال ارسال شود») به‌عنوان پیام‌های عادی کاربر پردازش می‌شوند.
- رویدادهای افزودن/حذف واکنش به رویدادهای سیستمی نگاشت می‌شوند.
- رویدادهای پیوستن/خروج عضو، ایجاد/تغییر نام کانال، و افزودن/حذف pin به رویدادهای سیستمی نگاشت می‌شوند.
- وقتی `configWrites` فعال باشد، `channel_id_changed` می‌تواند کلیدهای پیکربندی کانال را migrate کند.
- فراداده موضوع/هدف کانال به‌عنوان زمینه نامطمئن در نظر گرفته می‌شود و می‌تواند به زمینه routing تزریق شود.
- seed کردن شروع‌کننده رشته و زمینه اولیه تاریخچه رشته، وقتی قابل اعمال باشد، با allowlistهای فرستنده پیکربندی‌شده فیلتر می‌شود.
- کنش‌های بلوک و تعامل‌های modal رویدادهای سیستمی ساختاریافته `Slack interaction: ...` را با فیلدهای payload غنی منتشر می‌کنند:
  - کنش‌های بلوک: مقدارهای انتخاب‌شده، برچسب‌ها، مقدارهای picker، و فراداده `workflow_*`
  - رویدادهای modal `view_submission` و `view_closed` با فراداده کانال route‌شده و ورودی‌های فرم

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="High-signal Slack fields">

- حالت/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- دسترسی DM: `dm.enabled`, `dmPolicy`, `allowFrom` (قدیمی: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle سازگاری: `dangerouslyAllowNameMatching` (break-glass؛ مگر در صورت نیاز خاموش نگه دارید)
- دسترسی کانال: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- رشته‌بندی/تاریخچه: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- عملیات/قابلیت‌ها: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="No replies in channels">
    به‌ترتیب بررسی کنید:

    - `groupPolicy`
    - allowlist کانال (`channels.slack.channels`) — **کلیدها باید شناسه‌های کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام زیر `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، چون routing کانال به‌طور پیش‌فرض اول بر اساس شناسه است. برای یافتن شناسه: روی کانال در Slack راست‌کلیک کنید → **Copy link** — مقدار `C...` در انتهای URL شناسه کانال است.
    - `requireMention`
    - allowlist `users` برای هر کانال

    فرمان‌های مفید:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    بررسی کنید:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (یا `channels.slack.dm.policy` قدیمی)
    - تأییدهای pairing / ورودی‌های allowlist
    - رویدادهای DM دستیار Slack: لاگ‌های verbose که به `drop message_changed` اشاره می‌کنند
      معمولاً یعنی Slack یک رویداد رشته دستیار ویرایش‌شده را بدون
      فرستنده انسانی قابل بازیابی در فراداده پیام ارسال کرده است

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    توکن‌های bot + app و فعال‌سازی Socket Mode را در تنظیمات برنامه Slack اعتبارسنجی کنید.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان دهد، حساب Slack
    پیکربندی شده است اما runtime فعلی نتوانسته مقدار پشتیبانی‌شده با SecretRef را
    resolve کند.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    اعتبارسنجی کنید:

    - signing secret
    - مسیر Webhook
    - URLهای درخواست Slack (رویدادها + Interactivity + Slash Commands)
    - `webhookPath` یکتا برای هر حساب HTTP

    اگر `signingSecretStatus: "configured_unavailable"` در snapshotهای حساب
    ظاهر شود، حساب HTTP پیکربندی شده است اما runtime فعلی نتوانسته signing secret
    پشتیبانی‌شده با SecretRef را resolve کند.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    بررسی کنید آیا منظورتان این بوده است:

    - حالت فرمان بومی (`channels.slack.commands.native: true`) با فرمان‌های slash متناظر ثبت‌شده در Slack
    - یا حالت فرمان slash واحد (`channels.slack.slashCommand.enabled: true`)

    همچنین `commands.useAccessGroups` و allowlistهای کانال/کاربر را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مرجع vision پیوست

وقتی دانلود فایل‌های Slack موفق باشد و محدودیت‌های اندازه اجازه دهند، Slack می‌تواند رسانه دانلودشده را به turn عامل پیوست کند. فایل‌های تصویر می‌توانند از مسیر درک رسانه عبور داده شوند یا مستقیماً به مدل پاسخ دارای قابلیت vision داده شوند؛ فایل‌های دیگر به‌جای اینکه به‌عنوان ورودی تصویر در نظر گرفته شوند، به‌عنوان زمینه فایل قابل دانلود نگه داشته می‌شوند.

### نوع‌های رسانه پشتیبانی‌شده

| نوع رسانه                     | منبع               | رفتار فعلی                                                                  | یادداشت‌ها                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| تصاویر JPEG / PNG / GIF / WebP | نشانی فایل Slack       | دانلود و به نوبت پیوست می‌شود تا با قابلیت‌های دارای بینایی پردازش شود                   | سقف هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض 20 MB)                 |
| فایل‌های PDF                      | نشانی فایل Slack       | دانلود می‌شود و به‌عنوان زمینه فایل برای ابزارهایی مانند `download-file` یا `pdf` در دسترس قرار می‌گیرد | ورودی Slack به‌صورت خودکار PDFها را به ورودی بینایی تصویر تبدیل نمی‌کند |
| فایل‌های دیگر                    | نشانی فایل Slack       | هرجا ممکن باشد دانلود می‌شود و به‌عنوان زمینه فایل در دسترس قرار می‌گیرد                              | فایل‌های دودویی به‌عنوان ورودی تصویر در نظر گرفته نمی‌شوند                               |
| پاسخ‌های رشته                 | فایل‌های آغازگر رشته | فایل‌های پیام ریشه می‌توانند وقتی پاسخ رسانه مستقیم ندارد، به‌عنوان زمینه بارگذاری شوند  | آغازگرهای فقط‌فایل از یک جانگهدار پیوست استفاده می‌کنند                          |
| پیام‌های چندتصویری           | چندین فایل Slack | هر فایل به‌صورت مستقل ارزیابی می‌شود                                              | پردازش Slack به هشت فایل برای هر پیام محدود است                     |

### خط لوله ورودی

وقتی یک پیام Slack همراه با پیوست‌های فایل وارد می‌شود:

1. OpenClaw فایل را از نشانی خصوصی Slack با استفاده از توکن ربات (`xoxb-...`) دانلود می‌کند.
2. در صورت موفقیت، فایل در ذخیره‌گاه رسانه نوشته می‌شود.
3. مسیرهای رسانه دانلودشده و نوع‌های محتوا به زمینه ورودی اضافه می‌شوند.
4. مسیرهای مدل/ابزار دارای قابلیت تصویر می‌توانند از پیوست‌های تصویر در آن زمینه استفاده کنند.
5. فایل‌های غیرتصویری برای ابزارهایی که می‌توانند آن‌ها را پردازش کنند، همچنان به‌صورت فراداده فایل یا ارجاع رسانه در دسترس می‌مانند.

### وراثت پیوست ریشه رشته

وقتی پیامی در یک رشته وارد می‌شود (والد `thread_ts` دارد):

- اگر خود پاسخ رسانه مستقیم نداشته باشد و پیام ریشه شامل فایل باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان زمینه آغازگر رشته بارگذاری کند.
- پیوست‌های مستقیم پاسخ بر پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و متن ندارد، با یک جانگهدار پیوست نمایش داده می‌شود تا مسیر جایگزین همچنان بتواند فایل‌های آن را شامل کند.

### پردازش چند پیوست

وقتی یک پیام Slack چندین پیوست فایل دارد:

- هر پیوست به‌صورت مستقل از طریق خط لوله رسانه پردازش می‌شود.
- ارجاع‌های رسانه دانلودشده در زمینه پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در بار رویداد پیروی می‌کند.
- شکست در دانلود یک پیوست، پیوست‌های دیگر را مسدود نمی‌کند.

### محدودیت‌های اندازه، دانلود و مدل

- **سقف اندازه**: پیش‌فرض 20 MB برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل پیکربندی است.
- **شکست‌های دانلود**: فایل‌هایی که Slack نمی‌تواند ارائه کند، نشانی‌های منقضی‌شده، فایل‌های غیرقابل‌دسترسی، فایل‌های بزرگ‌تر از سقف، و پاسخ‌های HTML احراز هویت/ورود Slack به‌جای گزارش شدن به‌عنوان قالب‌های پشتیبانی‌نشده، نادیده گرفته می‌شوند.
- **مدل بینایی**: تحلیل تصویر وقتی مدل پاسخ فعال از بینایی پشتیبانی کند از همان مدل استفاده می‌کند، یا از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel`.

### محدودیت‌های شناخته‌شده

| سناریو                               | رفتار فعلی                                                             | راهکار جایگزین                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| نشانی فایل منقضی‌شده Slack                 | فایل نادیده گرفته می‌شود؛ خطایی نشان داده نمی‌شود                                                 | فایل را دوباره در Slack بارگذاری کنید                                                |
| مدل بینایی پیکربندی نشده است            | پیوست‌های تصویر به‌عنوان ارجاع‌های رسانه ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند | `agents.defaults.imageModel` را پیکربندی کنید یا از یک مدل پاسخ دارای قابلیت بینایی استفاده کنید |
| تصاویر بسیار بزرگ (> 20 MB به‌صورت پیش‌فرض) | بر اساس سقف اندازه نادیده گرفته می‌شوند                                                         | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید                       |
| پیوست‌های فورواردشده/اشتراک‌گذاری‌شده           | متن و رسانه تصویر/فایل میزبانی‌شده در Slack در حد بهترین تلاش پردازش می‌شوند                       | مستقیماً در رشته OpenClaw دوباره به اشتراک بگذارید                                   |
| پیوست‌های PDF                        | به‌عنوان زمینه فایل/رسانه ذخیره می‌شوند، نه اینکه به‌صورت خودکار از مسیر بینایی تصویر عبور داده شوند  | برای فراداده فایل از `download-file` یا برای تحلیل PDF از ابزار `pdf` استفاده کنید   |

### مستندات مرتبط

- [خط لوله درک رسانه](/fa/nodes/media-understanding)
- [ابزار PDF](/fa/tools/pdf)
- حماسه: [#51349](https://github.com/openclaw/openclaw/issues/51349) — فعال‌سازی بینایی پیوست Slack
- آزمون‌های رگرسیون: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- راستی‌آزمایی زنده: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Slack را با Gateway جفت کنید.
  </Card>
  <Card title="Groups" icon="users" href="/fa/channels/groups">
    رفتار کانال و گروه DM.
  </Card>
  <Card title="Channel routing" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها مسیریابی کنید.
  </Card>
  <Card title="Security" icon="shield" href="/fa/gateway/security">
    مدل تهدید و مقاوم‌سازی.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fa/gateway/configuration">
    چیدمان پیکربندی و تقدم.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    فهرست فرمان‌ها و رفتار.
  </Card>
</CardGroup>
