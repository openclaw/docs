---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی حالت socket/HTTP در Slack
summary: راه‌اندازی Slack و رفتار زمان اجرا (حالت سوکت + نشانی‌های URL درخواست HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-10T19:25:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbebdd96c28aed547179d89ac5ea86e4c6b3b420aaceff5e7aa491317697db1e
    source_path: channels/slack.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم و کانال‌ها از طریق یکپارچه‌سازی‌های برنامهٔ Slack. حالت پیش‌فرض Socket Mode است؛ HTTP Request URLs نیز پشتیبانی می‌شوند.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Slack به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و کاتالوگ دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های بین‌کانالی و راهنماهای تعمیر.
  </Card>
</CardGroup>

## انتخاب Socket Mode یا HTTP Request URLs

هر دو روش انتقال آمادهٔ تولید هستند و برای پیام‌رسانی، دستورهای اسلش، App Home و تعامل‌پذیری به برابری قابلیت می‌رسند. انتخاب را بر اساس شکل استقرار انجام دهید، نه قابلیت‌ها.

| دغدغه                       | Socket Mode (پیش‌فرض)                                                               | HTTP Request URLs                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL عمومی Gateway           | لازم نیست                                                                            | لازم است (DNS، TLS، پراکسی معکوس یا تونل)                                                                      |
| شبکهٔ خروجی                 | WSS خروجی به `wss-primary.slack.com` باید در دسترس باشد                              | بدون WS خروجی؛ فقط HTTPS ورودی                                                                                 |
| توکن‌های موردنیاز           | توکن ربات (`xoxb-...`) + App-Level Token (`xapp-...`) با `connections:write`         | توکن ربات (`xoxb-...`) + Signing Secret                                                                        |
| لپ‌تاپ توسعه / پشت دیوارهٔ آتش | همان‌طور که هست کار می‌کند                                                           | به یک تونل عمومی (ngrok، Cloudflare Tunnel، Tailscale Funnel) یا Gateway آزمایشی نیاز دارد                     |
| مقیاس‌پذیری افقی            | یک نشست Socket Mode برای هر برنامه روی هر میزبان؛ چند Gateway به برنامه‌های جداگانهٔ Slack نیاز دارند | کنترل‌کنندهٔ POST بدون حالت؛ چند replica از Gateway می‌توانند پشت یک load balancer یک برنامه را به اشتراک بگذارند |
| چند حساب روی یک Gateway     | پشتیبانی می‌شود؛ هر حساب WS خودش را باز می‌کند                                       | پشتیبانی می‌شود؛ هر حساب به `webhookPath` یکتا نیاز دارد (پیش‌فرض `/slack/events`) تا ثبت‌ها با هم تداخل نداشته باشند |
| انتقال دستور اسلش           | از طریق اتصال WS تحویل داده می‌شود؛ `slash_commands[].url` نادیده گرفته می‌شود       | Slack به `slash_commands[].url` درخواست POST می‌فرستد؛ این فیلد برای dispatch شدن دستور لازم است               |
| امضای درخواست               | استفاده نمی‌شود (احراز هویت با App-Level Token است)                                  | Slack هر درخواست را امضا می‌کند؛ OpenClaw با `signingSecret` اعتبارسنجی می‌کند                                |
| بازیابی پس از قطع اتصال     | Slack SDK به‌صورت خودکار دوباره وصل می‌شود؛ تنظیمات انتقال pong-timeout در Gateway اعمال می‌شود | اتصال پایدار برای قطع شدن وجود ندارد؛ تلاش‌های مجدد برای هر درخواست از سمت Slack انجام می‌شوند                 |

<Note>
  **Socket Mode را انتخاب کنید** برای میزبان‌های تک-Gateway، لپ‌تاپ‌های توسعه، و شبکه‌های on-prem که می‌توانند به‌صورت خروجی به `*.slack.com` دسترسی داشته باشند اما نمی‌توانند HTTPS ورودی بپذیرند.

**HTTP Request URLs را انتخاب کنید** وقتی چند replica از Gateway را پشت یک load balancer اجرا می‌کنید، وقتی WSS خروجی مسدود است اما HTTPS ورودی مجاز است، یا وقتی از قبل webhookهای Slack را در یک پراکسی معکوس terminate می‌کنید.
</Note>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Socket Mode (پیش‌فرض)">
    <Steps>
      <Step title="ایجاد یک برنامهٔ جدید Slack">
        [api.slack.com/apps](https://api.slack.com/apps/new) را باز کنید → **Create New App** → **From a manifest** → فضای کاری خود را انتخاب کنید → یکی از manifestهای زیر را paste کنید → **Next** → **Create**.

        <CodeGroup>

```json توصیه‌شده
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

```json حداقلی
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
          **توصیه‌شده** با مجموعهٔ کامل قابلیت‌های Plugin همراه Slack مطابقت دارد: App Home، دستورهای اسلش، فایل‌ها، واکنش‌ها، pinها، پیام‌های مستقیم گروهی، و خواندن emoji/usergroup. وقتی سیاست فضای کاری scopeها را محدود می‌کند **حداقلی** را انتخاب کنید — این گزینه پیام‌های مستقیم، تاریخچهٔ کانال/گروه، mentionها، و دستورهای اسلش را پوشش می‌دهد اما فایل‌ها، واکنش‌ها، pinها، پیام مستقیم گروهی (`mpim:*`)، `emoji:read`، و `usergroups:read` را حذف می‌کند. برای منطق هر scope و گزینه‌های افزایشی مانند دستورهای اسلش بیشتر، [چک‌لیست manifest و scope](#manifest-and-scope-checklist) را ببینید.
        </Note>

        پس از اینکه Slack برنامه را ایجاد کرد:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: `connections:write` را اضافه کنید، ذخیره کنید، مقدار `xapp-...` را کپی کنید.
        - **Install App → Install to Workspace**: توکن `xoxb-...` Bot User OAuth Token را کپی کنید.

      </Step>

      <Step title="پیکربندی OpenClaw">

        راه‌اندازی توصیه‌شدهٔ SecretRef:

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

      <Step title="شروع Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="ایجاد یک برنامهٔ جدید Slack">
        [api.slack.com/apps](https://api.slack.com/apps/new) را باز کنید → **Create New App** → **From a manifest** → فضای کاری خود را انتخاب کنید → یکی از manifestهای زیر را paste کنید → `https://gateway-host.example.com/slack/events` را با URL عمومی Gateway خود جایگزین کنید → **Next** → **Create**.

        <CodeGroup>

```json توصیه‌شده
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
          **Recommended** با مجموعهٔ کامل قابلیت‌های Plugin بسته‌بندی‌شدهٔ Slack مطابقت دارد؛ **Minimal** برای workspaceهای محدودکننده، فایل‌ها، واکنش‌ها، سنجاق‌ها، DM گروهی (`mpim:*`)، `emoji:read` و `usergroups:read` را حذف می‌کند. برای دلیل هر scope، [چک‌لیست manifest و scope](#manifest-and-scope-checklist) را ببینید.
        </Note>

        <Info>
          هر سه فیلد URL (`slash_commands[].url`،‏ `event_subscriptions.request_url` و `interactivity.request_url` / `message_menu_options_url`) همگی به همان endpoint در OpenClaw اشاره می‌کنند. schema مربوط به manifest در Slack لازم دارد که این موارد جداگانه نام‌گذاری شوند، اما OpenClaw بر اساس نوع payload مسیر‌دهی می‌کند، بنابراین یک `webhookPath` واحد (پیش‌فرض `/slack/events`) کافی است. slash commandهای بدون `slash_commands[].url` در حالت HTTP بی‌صدا هیچ کاری انجام نمی‌دهند.
        </Info>

        پس از اینکه Slack برنامه را ایجاد کرد:

        - **Basic Information → App Credentials**: مقدار **Signing Secret** را برای اعتبارسنجی درخواست کپی کنید.
        - **Install App → Install to Workspace**: توکن Bot User OAuth با قالب `xoxb-...` را کپی کنید.

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

        به هر حساب یک `webhookPath` متمایز (پیش‌فرض `/slack/events`) بدهید تا ثبت‌ها با هم تداخل نکنند.
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

OpenClaw به‌طور پیش‌فرض مهلت زمانی pong کلاینت Slack SDK را برای Socket Mode روی ۱۵ ثانیه تنظیم می‌کند. تنظیمات انتقال را فقط زمانی بازنویسی کنید که به تنظیمات ویژهٔ workspace یا host نیاز دارید:

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

این را فقط برای workspaceهای Socket Mode استفاده کنید که timeoutهای pong یا server-ping وب‌سوکت Slack را ثبت می‌کنند یا روی hostهایی اجرا می‌شوند که گرسنگی event-loop شناخته‌شده دارند. `clientPingTimeout` مدت انتظار برای pong پس از ارسال client ping توسط SDK است؛ `serverPingTimeout` مدت انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای برنامه همچنان وضعیت برنامه هستند، نه سیگنال‌های زنده‌بودن انتقال.

## چک‌لیست manifest و scope

manifest پایهٔ برنامهٔ Slack برای Socket Mode و HTTP Request URLs یکسان است. فقط بلوک `settings` (و `url` در slash command) متفاوت است.

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

برای حالت **HTTP Request URLs**،‏ `settings` را با گونهٔ HTTP جایگزین کنید و به هر slash command مقدار `url` اضافه کنید. URL عمومی لازم است:

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

manifest پیش‌فرض، برگهٔ **Home** در Slack App Home را فعال می‌کند و در `app_home_opened` مشترک می‌شود. وقتی یکی از اعضای workspace برگهٔ Home را باز می‌کند، OpenClaw با `views.publish` یک نمای Home پیش‌فرض امن منتشر می‌کند؛ هیچ payload مکالمه یا پیکربندی خصوصی در آن گنجانده نمی‌شود. برگهٔ **Messages** برای DMهای Slack فعال می‌ماند.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    می‌توان به‌جای یک فرمان پیکربندی‌شدهٔ واحد، از چند [slash command بومی](#commands-and-slash-behavior) با این جزئیات استفاده کرد:

    - از `/agentstatus` به‌جای `/status` استفاده کنید، زیرا فرمان `/status` رزرو شده است.
    - بیش از ۲۵ slash command نمی‌تواند هم‌زمان در دسترس باشد.

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
        از همان فهرست `slash_commands` بالا برای Socket Mode استفاده کنید و به هر ورودی `"url": "https://gateway-host.example.com/slack/events"` اضافه کنید. نمونه:

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

        آن مقدار `url` را روی همهٔ فرمان‌های فهرست تکرار کنید.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="حوزه‌های اختیاری نویسندگی (عملیات نوشتن)">
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض برنامه Slack از هویت عامل فعال (نام کاربری و نماد سفارشی) استفاده کنند، حوزه bot با نام `chat:write.customize` را اضافه کنید.

    اگر از نماد ایموجی استفاده می‌کنید، Slack انتظار نحو `:emoji_name:` را دارد.

  </Accordion>
  <Accordion title="حوزه‌های اختیاری توکن کاربر (عملیات خواندن)">
    اگر `channels.slack.userToken` را پیکربندی کنید، حوزه‌های خواندن معمول عبارت‌اند از:

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
  یا اشیای SecretRef را می‌پذیرند.
- توکن‌های پیکربندی، جایگزین مقدار پشتیبان env می‌شوند.
- مقدار پشتیبان env با نام `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
- `userToken` (`xoxp-...`) فقط از پیکربندی می‌آید (بدون مقدار پشتیبان env) و به‌طور پیش‌فرض رفتار فقط‌خواندنی دارد (`userTokenReadOnly: true`).

رفتار نمای فوری وضعیت:

- بازرسی حساب Slack، فیلدهای `*Source` و `*Status` را برای هر اعتبارنامه
  دنبال می‌کند (`botToken`، `appToken`، `signingSecret`، `userToken`).
- وضعیت یکی از `available`، `configured_unavailable` یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا منبع محرمانه غیرخطی دیگری پیکربندی شده است، اما مسیر فرمان/زمان اجرای فعلی
  نتوانسته مقدار واقعی را حل کند.
- در حالت HTTP، `signingSecretStatus` درج می‌شود؛ در Socket Mode،
  جفت لازم `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای کنش‌ها/خواندن‌های دایرکتوری، وقتی توکن کاربر پیکربندی شده باشد می‌توان آن را ترجیح داد. برای نوشتن‌ها، توکن bot همچنان ترجیح داده می‌شود؛ نوشتن با توکن کاربر فقط وقتی مجاز است که `userTokenReadOnly: false` باشد و توکن bot در دسترس نباشد.
</Tip>

## کنش‌ها و دروازه‌ها

کنش‌های Slack با `channels.slack.actions.*` کنترل می‌شوند.

گروه‌های کنش موجود در ابزار فعلی Slack:

| گروه      | پیش‌فرض |
| ---------- | ------- |
| پیام‌ها   | فعال |
| واکنش‌ها  | فعال |
| سنجاق‌ها       | فعال |
| اطلاعات عضو | فعال |
| فهرست ایموجی  | فعال |

کنش‌های فعلی پیام Slack شامل `send`، `upload-file`، `download-file`، `read`، `edit`، `delete`، `pin`، `unpin`، `list-pins`، `member-info` و `emoji-list` هستند. `download-file` شناسه‌های فایل Slack را که در جای‌نگهدارهای فایل ورودی نمایش داده می‌شوند می‌پذیرد و برای تصاویر پیش‌نمایش تصویر یا برای انواع فایل دیگر فراداده فایل محلی برمی‌گرداند.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست DM">
    `channels.slack.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.slack.allowFrom` فهرست مجاز رسمی DM است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیاز دارد `channels.slack.allowFrom` شامل `"*"` باشد)
    - `disabled`

    پرچم‌های DM:

    - `dm.enabled` (پیش‌فرض true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قدیمی)
    - `dm.groupEnabled` (DMهای گروهی پیش‌فرض false)
    - `dm.groupChannels` (فهرست مجاز اختیاری MPIM)

    تقدم چندحسابی:

    - `channels.slack.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - حساب‌های نام‌دار وقتی `allowFrom` خودشان تنظیم نشده باشد، `channels.slack.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌دار `channels.slack.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.slack.dm.policy` و `channels.slack.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    جفت‌سازی در DMها از `openclaw pairing approve slack <code>` استفاده می‌کند.

  </Tab>

  <Tab title="سیاست کانال">
    `channels.slack.groupPolicy` نحوه مدیریت کانال را کنترل می‌کند:

    - `open`
    - `allowlist`
    - `disabled`

    فهرست مجاز کانال زیر `channels.slack.channels` قرار دارد و **باید از شناسه‌های پایدار کانال Slack** (برای مثال `C12345678`) به‌عنوان کلیدهای پیکربندی استفاده کند.

    نکته زمان اجرا: اگر `channels.slack` کاملاً وجود نداشته باشد (راه‌اندازی فقط با env)، زمان اجرا به `groupPolicy="allowlist"` برمی‌گردد و هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    حل نام/شناسه:

    - ورودی‌های فهرست مجاز کانال و ورودی‌های فهرست مجاز DM هنگام راه‌اندازی، وقتی دسترسی توکن اجازه دهد، حل می‌شوند
    - ورودی‌های نام کانال حل‌نشده همان‌طور که پیکربندی شده‌اند نگه داشته می‌شوند، اما به‌طور پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند
    - مجوزدهی ورودی و مسیریابی کانال به‌طور پیش‌فرض ابتدا بر اساس شناسه انجام می‌شوند؛ تطبیق مستقیم نام کاربری/slug نیازمند `channels.slack.dangerouslyAllowNameMatching: true` است

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) زیر `groupPolicy: "allowlist"` تطبیق داده نمی‌شوند. جست‌وجوی کانال به‌طور پیش‌فرض ابتدا بر اساس شناسه است، پس یک کلید مبتنی بر نام هرگز با موفقیت مسیریابی نمی‌شود و همه پیام‌های آن کانال بی‌صدا مسدود خواهند شد. این با `groupPolicy: "open"` متفاوت است؛ در آن حالت کلید کانال برای مسیریابی لازم نیست و یک کلید مبتنی بر نام ظاهراً کار می‌کند.

    همیشه از شناسه کانال Slack به‌عنوان کلید استفاده کنید. برای یافتن آن: روی کانال در Slack راست‌کلیک کنید ← **Copy link** — شناسه (`C...`) در انتهای URL ظاهر می‌شود.

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

  <Tab title="اشاره‌ها و کاربران کانال">
    پیام‌های کانال به‌طور پیش‌فرض با اشاره دروازه‌گذاری می‌شوند.

    منابع اشاره:

    - اشاره صریح به برنامه (`<@botId>`)
    - اشاره گروه کاربری Slack (`<!subteam^S...>`) وقتی کاربر bot عضو آن گروه کاربری باشد؛ نیازمند `usergroups:read`
    - الگوهای regex اشاره (`agents.list[].groupChat.mentionPatterns`، مقدار پشتیبان `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به رشته bot (وقتی `thread.requireExplicitMention` برابر `true` باشد غیرفعال است)

    کنترل‌های هر کانال (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق حل هنگام راه‌اندازی یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (فهرست مجاز)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - قالب کلید `toolsBySender`: `id:`، `e164:`، `username:`، `name:`، یا wildcard `"*"`
      (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند)

    `allowBots` برای کانال‌ها و کانال‌های خصوصی محافظه‌کارانه است: پیام‌های اتاق که توسط bot نوشته شده‌اند فقط وقتی پذیرفته می‌شوند که bot فرستنده به‌صراحت در فهرست مجاز `users` آن اتاق آمده باشد، یا وقتی حداقل یک شناسه صریح مالک Slack از `channels.slack.allowFrom` در حال حاضر عضو اتاق باشد. wildcardها و ورودی‌های مالک با نام نمایشی، حضور مالک را برآورده نمی‌کنند. حضور مالک از `conversations.members` در Slack استفاده می‌کند؛ مطمئن شوید برنامه حوزه خواندن مطابق با نوع اتاق را دارد (`channels:read` برای کانال‌های عمومی، `groups:read` برای کانال‌های خصوصی). اگر جست‌وجوی عضو شکست بخورد، OpenClaw پیام اتاق نوشته‌شده توسط bot را کنار می‌گذارد.

  </Tab>
</Tabs>

## رشته‌ها، نشست‌ها و برچسب‌های پاسخ

- DMها به‌صورت `direct` مسیریابی می‌شوند؛ کانال‌ها به‌صورت `channel`؛ MPIMها به‌صورت `group`.
- اتصال‌های مسیر Slack شناسه‌های خام همتا به‌علاوه شکل‌های هدف Slack مانند `channel:C12345678`، `user:U12345678` و `<@U12345678>` را می‌پذیرند.
- با مقدار پیش‌فرض `session.dmScope=main`، DMهای Slack در نشست اصلی عامل ادغام می‌شوند.
- نشست‌های کانال: `agent:<agentId>:slack:channel:<channelId>`.
- پاسخ‌های رشته‌ای می‌توانند در صورت کاربرد پسوندهای نشست رشته (`:thread:<threadTs>`) ایجاد کنند.
- در کانال‌هایی که OpenClaw پیام‌های سطح بالا را بدون نیاز به اشاره صریح مدیریت می‌کند، `replyToMode` غیر `off` هر ریشه مدیریت‌شده را به `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` مسیریابی می‌کند تا رشته قابل مشاهده Slack از همان نوبت اول به یک نشست OpenClaw نگاشت شود.
- مقدار پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ مقدار پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` کنترل می‌کند هنگام شروع یک نشست رشته جدید چند پیام رشته موجود واکشی شود (پیش‌فرض `20`؛ برای غیرفعال‌سازی روی `0` تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، اشاره‌های ضمنی رشته را سرکوب می‌کند تا bot فقط به اشاره‌های صریح `@bot` داخل رشته‌ها پاسخ دهد، حتی وقتی bot قبلاً در رشته مشارکت داشته است. بدون این گزینه، پاسخ‌ها در رشته‌ای که bot در آن مشارکت داشته، دروازه‌گذاری `requireMention` را دور می‌زنند.

کنترل‌های رشته‌سازی پاسخ:

- `channels.slack.replyToMode`: `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: برای هر `direct|group|channel`
- مقدار پشتیبان قدیمی برای گفت‌وگوهای مستقیم: `channels.slack.dm.replyToMode`

برچسب‌های پاسخ دستی پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

برای پاسخ‌های رشته‌ای صریح Slack از ابزار `message`، `replyBroadcast: true` را با `action: "send"` و `threadId` یا `replyTo` تنظیم کنید تا از Slack بخواهید پاسخ رشته را به کانال والد نیز پخش کند. این به پرچم `reply_broadcast` در `chat.postMessage` Slack نگاشت می‌شود و فقط برای ارسال‌های متن یا Block Kit پشتیبانی می‌شود، نه بارگذاری‌های رسانه.

وقتی فراخوانی ابزار `message` داخل یک رشته Slack اجرا می‌شود و همان کانال را هدف می‌گیرد، OpenClaw معمولاً طبق `replyToMode` رشته فعلی Slack را به ارث می‌برد. برای اجبار به پیام جدید در کانال والد، `topLevel: true` را روی `action: "send"` یا `action: "upload-file"` تنظیم کنید. `threadId: null` نیز به‌عنوان همان انصراف از سطح رشته پذیرفته می‌شود.

<Note>
`replyToMode="off"` **همه** رشته‌سازی پاسخ در Slack را غیرفعال می‌کند، از جمله برچسب‌های صریح `[[reply_to_*]]`. این با Telegram متفاوت است؛ در Telegram برچسب‌های صریح همچنان در حالت `"off"` رعایت می‌شوند. رشته‌های Slack پیام‌ها را از کانال پنهان می‌کنند، در حالی که پاسخ‌های Telegram به‌صورت درون‌خطی قابل مشاهده می‌مانند.
</Note>

## واکنش‌های تأیید

`ackReaction` هنگام پردازش پیام ورودی توسط OpenClaw یک ایموجی تأیید ارسال می‌کند.

ترتیب حل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- مقدار پشتیبان ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت "👀")

نکته‌ها:

- Slack انتظار کدهای کوتاه را دارد (برای مثال `"eyes"`).
- برای غیرفعال‌سازی واکنش برای حساب Slack یا به‌صورت سراسری، از `""` استفاده کنید.

## جریان‌دهی متن

`channels.slack.streaming` رفتار پیش‌نمایش زنده را کنترل می‌کند:

- `off`: جریان‌دهی پیش‌نمایش زنده را غیرفعال می‌کند.
- `partial` (پیش‌فرض): متن پیش‌نمایش را با آخرین خروجی جزئی جایگزین می‌کند.
- `block`: به‌روزرسانی‌های پیش‌نمایش قطعه‌قطعه را اضافه می‌کند.
- `progress`: هنگام تولید، متن وضعیت پیشرفت را نشان می‌دهد و سپس متن نهایی را ارسال می‌کند.
- `streaming.preview.toolProgress`: وقتی پیش‌نمایش پیش‌نویس فعال است، به‌روزرسانی‌های ابزار/پیشرفت را به همان پیام پیش‌نمایش ویرایش‌شده مسیریابی می‌کند (پیش‌فرض: `true`). برای نگه داشتن پیام‌های جداگانه ابزار/پیشرفت، روی `false` تنظیم کنید.
- `streaming.preview.commandText` / `streaming.progress.commandText`: برای نگه داشتن خط‌های فشرده پیشرفت ابزار در حالی که متن خام فرمان/exec پنهان می‌شود، روی `status` تنظیم کنید (پیش‌فرض: `raw`).

پنهان کردن متن خام فرمان/exec در حالی که خط‌های فشرده پیشرفت نگه داشته می‌شوند:

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

`channels.slack.streaming.nativeTransport` جریان‌دهی متن بومی Slack را وقتی `channels.slack.streaming.mode` برابر `partial` باشد کنترل می‌کند (پیش‌فرض: `true`).

- برای نمایش جریان‌دهی متنی بومی و وضعیت رشته دستیار Slack، باید یک رشته پاسخ در دسترس باشد. انتخاب رشته همچنان از `replyToMode` پیروی می‌کند.
- ریشه‌های کانال، چت گروهی، و DM سطح‌بالا همچنان می‌توانند وقتی جریان‌دهی بومی در دسترس نیست یا رشته پاسخی وجود ندارد، از پیش‌نمایش پیش‌نویس معمول استفاده کنند.
- DMهای سطح‌بالای Slack به‌طور پیش‌فرض خارج از رشته می‌مانند، بنابراین پیش‌نمایش جریان/وضعیت بومی سبک‌رشته‌ای Slack را نشان نمی‌دهند؛ در عوض OpenClaw یک پیش‌نمایش پیش‌نویس را در DM ارسال و ویرایش می‌کند.
- رسانه و بارهای غیرمتنی به تحویل معمول بازمی‌گردند.
- خروجی‌های نهایی رسانه/خطا ویرایش‌های پیش‌نمایش در انتظار را لغو می‌کنند؛ خروجی‌های نهایی متن/بلوک واجد شرایط فقط وقتی تخلیه می‌شوند که بتوانند پیش‌نمایش را در همان‌جا ویرایش کنند.
- اگر جریان‌دهی در میانه پاسخ شکست بخورد، OpenClaw برای بارهای باقی‌مانده به تحویل معمول بازمی‌گردد.

استفاده از پیش‌نمایش پیش‌نویس به‌جای جریان‌دهی متنی بومی Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) یک نام مستعار زمان اجرای قدیمی برای `channels.slack.streaming.mode` است.
- مقدار بولی `channels.slack.streaming` یک نام مستعار زمان اجرای قدیمی برای `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` است.
- `channels.slack.nativeStreaming` قدیمی یک نام مستعار زمان اجرا برای `channels.slack.streaming.nativeTransport` است.
- برای بازنویسی پیکربندی پایدارشده جریان‌دهی Slack به کلیدهای canonical، `openclaw doctor --fix` را اجرا کنید.

## جایگزین واکنش تایپ

`typingReaction` هنگام پردازش پاسخ توسط OpenClaw، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس وقتی اجرا تمام شد آن را حذف می‌کند. این گزینه بیرون از پاسخ‌های رشته‌ای بیشترین کاربرد را دارد؛ پاسخ‌های رشته‌ای از یک نشانگر وضعیت پیش‌فرض «در حال تایپ است...» استفاده می‌کنند.

ترتیب تفکیک:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکات:

- Slack انتظار shortcode دارد (برای مثال `"hourglass_flowing_sand"`).
- واکنش به‌صورت best-effort انجام می‌شود و پس از کامل شدن مسیر پاسخ یا شکست، پاک‌سازی به‌طور خودکار تلاش می‌شود.

## رسانه، بخش‌بندی، و تحویل

<AccordionGroup>
  <Accordion title="پیوست‌های ورودی">
    پیوست‌های فایل Slack از URLهای خصوصی میزبانی‌شده توسط Slack دانلود می‌شوند (جریان درخواست احراز هویت‌شده با توکن) و وقتی واکشی موفق باشد و محدودیت‌های اندازه اجازه دهند، در مخزن رسانه نوشته می‌شوند. جایگزین‌های فایل شامل `fileId` مربوط به Slack هستند تا عامل‌ها بتوانند فایل اصلی را با `download-file` واکشی کنند.

    دانلودها از timeoutهای محدود برای بیکاری و زمان کل استفاده می‌کنند. اگر بازیابی فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به جایگزین فایل بازمی‌گردد.

    سقف اندازه ورودی زمان اجرا به‌طور پیش‌فرض `20MB` است، مگر اینکه با `channels.slack.mediaMaxMb` بازنویسی شود.

  </Accordion>

  <Accordion title="متن و فایل‌های خروجی">
    - بخش‌های متن از `channels.slack.textChunkLimit` استفاده می‌کنند (پیش‌فرض 4000)
    - `channels.slack.chunkMode="newline"` بخش‌بندی با اولویت پاراگراف را فعال می‌کند
    - ارسال فایل‌ها از APIهای آپلود Slack استفاده می‌کند و می‌تواند شامل پاسخ‌های رشته‌ای (`thread_ts`) باشد
    - سقف رسانه خروجی، وقتی پیکربندی شده باشد، از `channels.slack.mediaMaxMb` پیروی می‌کند؛ در غیر این صورت ارسال‌های کانال از پیش‌فرض‌های نوع MIME در خط لوله رسانه استفاده می‌کنند

  </Accordion>

  <Accordion title="مقصدهای تحویل">
    مقصدهای صریح ترجیحی:

    - `user:<id>` برای DMها
    - `channel:<id>` برای کانال‌ها

    DMهای Slack که فقط متن/بلوک دارند می‌توانند مستقیما به شناسه‌های کاربر ارسال شوند؛ آپلود فایل و ارسال‌های رشته‌ای ابتدا DM را از طریق APIهای گفت‌وگوی Slack باز می‌کنند، چون این مسیرها به یک شناسه گفت‌وگوی مشخص نیاز دارند.

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

فرمان‌های بومی به [تنظیمات manifest اضافی](#additional-manifest-settings) در برنامه Slack شما نیاز دارند و در عوض با `channels.slack.commands.native: true` یا `commands.native: true` در پیکربندی‌های سراسری فعال می‌شوند.

- حالت خودکار فرمان بومی برای Slack **خاموش** است، بنابراین `commands.native: "auto"` فرمان‌های بومی Slack را فعال نمی‌کند.

```txt
/help
```

منوهای آرگومان بومی از یک راهبرد رندر تطبیقی استفاده می‌کنند که پیش از dispatch کردن مقدار گزینه انتخاب‌شده، یک modal تأیید نشان می‌دهد:

- تا 5 گزینه: بلوک‌های دکمه
- 6 تا 100 گزینه: منوی انتخاب ایستا
- بیش از 100 گزینه: انتخاب خارجی با فیلتر کردن ناهمگام گزینه‌ها وقتی handlerهای گزینه‌های interactivity در دسترس باشند
- محدودیت‌های Slack فراتر رفته‌اند: مقدارهای گزینه کدگذاری‌شده به دکمه‌ها بازمی‌گردند

```txt
/think
```

جلسه‌های slash از کلیدهای ایزوله مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای فرمان‌ها را با استفاده از `CommandTargetSessionKey` به جلسه گفت‌وگوی هدف مسیریابی می‌کنند.

## پاسخ‌های تعاملی

Slack می‌تواند کنترل‌های پاسخ تعاملی نوشته‌شده توسط عامل را رندر کند، اما این ویژگی به‌طور پیش‌فرض غیرفعال است.

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

وقتی فعال باشد، عامل‌ها می‌توانند دستورالعمل‌های پاسخ فقط مخصوص Slack صادر کنند:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

این دستورالعمل‌ها به Slack Block Kit تبدیل می‌شوند و کلیک‌ها یا انتخاب‌ها را از مسیر رویداد تعامل موجود Slack برمی‌گردانند.

نکته‌ها:

- این یک رابط کاربری مخصوص Slack است. کانال‌های دیگر دستورالعمل‌های Slack Block Kit را به سامانه‌های دکمه‌ای خودشان ترجمه نمی‌کنند.
- مقدارهای فراخوانی تعاملی، توکن‌های مات تولیدشده توسط OpenClaw هستند، نه مقدارهای خام نوشته‌شده توسط عامل.
- اگر بلاک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit فراتر بروند، OpenClaw به‌جای ارسال یک payload بلاک نامعتبر، به پاسخ متنی اصلی برمی‌گردد.

## تأییدهای اجرا در Slack

Slack می‌تواند به‌جای بازگشت به رابط کاربری وب یا ترمینال، با دکمه‌ها و تعامل‌های تعاملی به‌عنوان کلاینت تأیید بومی عمل کند.

- تأییدهای اجرا از `channels.slack.execApprovals.*` برای مسیریابی بومی پیام مستقیم/کانال استفاده می‌کنند.
- تأییدهای Plugin همچنان می‌توانند از طریق همان سطح دکمه بومی Slack حل شوند، وقتی درخواست از قبل در Slack فرود آمده باشد و نوع شناسه تأیید `plugin:` باشد.
- مجوزدهی تأییدکننده همچنان اعمال می‌شود: فقط کاربرانی که به‌عنوان تأییدکننده شناسایی شده‌اند می‌توانند درخواست‌ها را از طریق Slack تأیید یا رد کنند.

این از همان سطح دکمه تأیید مشترک مانند کانال‌های دیگر استفاده می‌کند. وقتی `interactivity` در تنظیمات برنامه Slack شما فعال باشد، درخواست‌های تأیید مستقیماً در گفت‌وگو به‌صورت دکمه‌های Block Kit نمایش داده می‌شوند.
وقتی این دکمه‌ها وجود داشته باشند، تجربه کاربری اصلی تأیید همان‌ها هستند؛ OpenClaw
فقط وقتی باید فرمان دستی `/approve` را درج کند که نتیجه ابزار بگوید تأییدهای چت
در دسترس نیستند یا تأیید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`, `sessionFilter`

وقتی `enabled` تنظیم نشده یا `"auto"` باشد و دست‌کم یک تأییدکننده
حل شود، Slack تأییدهای اجرای بومی را به‌طور خودکار فعال می‌کند. برای غیرفعال کردن صریح Slack به‌عنوان کلاینت تأیید بومی، `enabled: false` را تنظیم کنید.
برای اجباری کردن تأییدهای بومی وقتی تأییدکننده‌ها حل می‌شوند، `enabled: true` را تنظیم کنید.

رفتار پیش‌فرض بدون پیکربندی صریح تأیید اجرای Slack:

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

ارسال مشترک `approvals.exec` جداگانه است. فقط وقتی از آن استفاده کنید که درخواست‌های تأیید اجرا باید همچنین
به چت‌های دیگر یا مقصدهای صریح خارج از مسیر اصلی هدایت شوند. ارسال مشترک `approvals.plugin` نیز
جداگانه است؛ دکمه‌های بومی Slack همچنان می‌توانند تأییدهای Plugin را حل کنند، وقتی آن درخواست‌ها از قبل
در Slack فرود آمده باشند.

`/approve` در همان چت نیز در کانال‌ها و پیام‌های مستقیم Slack که از قبل از فرمان‌ها پشتیبانی می‌کنند کار می‌کند. برای مدل کامل ارسال تأیید، [تأییدهای اجرا](/fa/tools/exec-approvals) را ببینید.

## رویدادها و رفتار عملیاتی

- ویرایش‌ها/حذف‌های پیام به رویدادهای سامانه نگاشت می‌شوند.
- پخش‌های رشته‌ای (پاسخ‌های رشته‌ای «همچنین به کانال ارسال شود») به‌عنوان پیام‌های عادی کاربر پردازش می‌شوند.
- رویدادهای افزودن/حذف واکنش به رویدادهای سامانه نگاشت می‌شوند.
- رویدادهای پیوستن/ترک عضو، ایجاد/تغییر نام کانال، و افزودن/حذف سنجاق به رویدادهای سامانه نگاشت می‌شوند.
- وقتی `configWrites` فعال باشد، `channel_id_changed` می‌تواند کلیدهای پیکربندی کانال را منتقل کند.
- فراداده موضوع/هدف کانال به‌عنوان زمینه غیرقابل‌اعتماد در نظر گرفته می‌شود و می‌تواند به زمینه مسیریابی تزریق شود.
- آغازگر رشته و بذرگذاری اولیه زمینه تاریخچه رشته، در صورت کاربرد، با فهرست‌های مجاز فرستنده پیکربندی‌شده فیلتر می‌شوند.
- کنش‌های بلاک و تعامل‌های modal رویدادهای سامانه ساخت‌یافته `Slack interaction: ...` را با فیلدهای payload غنی منتشر می‌کنند:
  - کنش‌های بلاک: مقدارهای انتخاب‌شده، برچسب‌ها، مقدارهای انتخابگر، و فراداده `workflow_*`
  - رویدادهای modal `view_submission` و `view_closed` همراه با فراداده کانال مسیریابی‌شده و ورودی‌های فرم

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="فیلدهای پرسیگنال Slack">

- حالت/احراز هویت: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- دسترسی پیام مستقیم: `dm.enabled`, `dmPolicy`, `allowFrom` (قدیمی: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- سوییچ سازگاری: `dangerouslyAllowNameMatching` (شکستن اضطراری؛ مگر در صورت نیاز خاموش نگه دارید)
- دسترسی کانال: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- رشته‌بندی/تاریخچه: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- پیش‌نمایش‌ها: `unfurlLinks`, `unfurlMedia` برای کنترل پیش‌نمایش پیوند/رسانه در `chat.postMessage`
- عملیات/ویژگی‌ها: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="پاسخی در کانال‌ها نیست">
    به‌ترتیب بررسی کنید:

    - `groupPolicy`
    - فهرست مجاز کانال (`channels.slack.channels`) — **کلیدها باید شناسه کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام در `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، چون مسیریابی کانال به‌طور پیش‌فرض ابتدا بر پایه شناسه است. برای یافتن شناسه: روی کانال در Slack راست‌کلیک کنید → **Copy link** — مقدار `C...` در انتهای URL شناسه کانال است.
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
    - `channels.slack.dmPolicy` (یا گزینه قدیمی `channels.slack.dm.policy`)
    - تأییدهای جفت‌سازی / ورودی‌های فهرست مجاز
    - رویدادهای پیام مستقیم Slack Assistant: لاگ‌های مفصل که به `drop message_changed` اشاره می‌کنند
      معمولاً یعنی Slack یک رویداد رشته Assistant ویرایش‌شده بدون فرستنده انسانی
      قابل‌بازیابی در فراداده پیام ارسال کرده است

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="حالت سوکت وصل نمی‌شود">
    توکن‌های ربات + برنامه و فعال‌سازی حالت سوکت را در تنظیمات برنامه Slack اعتبارسنجی کنید.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان دهد، حساب Slack
    پیکربندی شده است اما runtime فعلی نتوانسته مقدار مبتنی بر SecretRef را
    حل کند.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    اعتبارسنجی کنید:

    - راز امضا
    - مسیر webhook
    - URLهای درخواست Slack (رویدادها + تعامل‌پذیری + دستورات اسلش)
    - `webhookPath` یکتای هر حساب HTTP

    اگر `signingSecretStatus: "configured_unavailable"` در snapshotهای حساب
    ظاهر شود، حساب HTTP پیکربندی شده است اما runtime فعلی نتوانسته است
    راز امضای مبتنی بر SecretRef را resolve کند.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    بررسی کنید که کدام مورد را مدنظر داشته‌اید:

    - حالت دستور native (`channels.slack.commands.native: true`) با دستورات اسلش متناظر که در Slack ثبت شده‌اند
    - یا حالت تک‌دستور اسلش (`channels.slack.slashCommand.enabled: true`)

    همچنین `commands.useAccessGroups` و allowlistهای کانال/کاربر را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مرجع بینایی پیوست

وقتی دانلود فایل‌های Slack موفق باشد و محدودیت‌های اندازه اجازه دهند، Slack می‌تواند رسانه دانلودشده را به نوبت agent پیوست کند. فایل‌های تصویری می‌توانند از مسیر درک رسانه عبور داده شوند یا مستقیماً به یک مدل پاسخ‌گوی دارای قابلیت بینایی داده شوند؛ فایل‌های دیگر به‌جای اینکه به‌عنوان ورودی تصویر در نظر گرفته شوند، به‌صورت زمینه فایل قابل دانلود نگه داشته می‌شوند.

### نوع‌های رسانه پشتیبانی‌شده

| نوع رسانه                     | منبع               | رفتار فعلی                                                                  | یادداشت‌ها                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| تصاویر JPEG / PNG / GIF / WebP | URL فایل Slack       | دانلود می‌شوند و برای پردازش دارای قابلیت بینایی به نوبت پیوست می‌شوند                   | سقف هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض 20 MB)                 |
| فایل‌های PDF                      | URL فایل Slack       | دانلود می‌شوند و به‌عنوان زمینه فایل برای ابزارهایی مانند `download-file` یا `pdf` در دسترس قرار می‌گیرند | ورودی Slack به‌طور خودکار PDFها را به ورودی بینایی تصویر تبدیل نمی‌کند |
| فایل‌های دیگر                    | URL فایل Slack       | در صورت امکان دانلود می‌شوند و به‌عنوان زمینه فایل در دسترس قرار می‌گیرند                              | فایل‌های باینری به‌عنوان ورودی تصویر در نظر گرفته نمی‌شوند                               |
| پاسخ‌های thread                 | فایل‌های آغازگر thread | وقتی پاسخ رسانه مستقیم ندارد، فایل‌های پیام ریشه می‌توانند به‌عنوان زمینه hydrate شوند  | آغازگرهای فقط‌فایل از یک جای‌نگهدار پیوست استفاده می‌کنند                          |
| پیام‌های چندتصویری           | چندین فایل Slack | هر فایل به‌طور مستقل ارزیابی می‌شود                                              | پردازش Slack به هشت فایل در هر پیام محدود است                     |

### pipeline ورودی

وقتی یک پیام Slack با پیوست‌های فایل می‌رسد:

1. OpenClaw فایل را از URL خصوصی Slack با استفاده از توکن bot (`xoxb-...`) دانلود می‌کند.
2. در صورت موفقیت، فایل در media store نوشته می‌شود.
3. مسیرهای رسانه دانلودشده و نوع‌های محتوا به زمینه ورودی افزوده می‌شوند.
4. مسیرهای مدل/ابزار دارای قابلیت تصویر می‌توانند از پیوست‌های تصویر موجود در آن زمینه استفاده کنند.
5. فایل‌های غیرتصویری برای ابزارهایی که می‌توانند آن‌ها را پردازش کنند، به‌صورت metadata فایل یا ارجاع‌های رسانه در دسترس می‌مانند.

### ارث‌بری پیوست از ریشه thread

وقتی پیامی در یک thread می‌رسد (دارای والد `thread_ts` است):

- اگر خود پاسخ رسانه مستقیم نداشته باشد و پیام ریشه شامل فایل باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان زمینه آغازگر thread hydrate کند.
- پیوست‌های مستقیم پاسخ بر پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و متن ندارد، با یک جای‌نگهدار پیوست نمایش داده می‌شود تا fallback همچنان بتواند فایل‌های آن را شامل کند.

### پردازش چندپیوستی

وقتی یک پیام Slack شامل چند پیوست فایل باشد:

- هر پیوست به‌طور مستقل از طریق pipeline رسانه پردازش می‌شود.
- ارجاع‌های رسانه دانلودشده در زمینه پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در payload رویداد پیروی می‌کند.
- شکست در دانلود یک پیوست، سایر پیوست‌ها را مسدود نمی‌کند.

### محدودیت‌های اندازه، دانلود و مدل

- **سقف اندازه**: پیش‌فرض 20 MB برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل پیکربندی است.
- **شکست‌های دانلود**: فایل‌هایی که Slack نمی‌تواند ارائه کند، URLهای منقضی، فایل‌های غیرقابل دسترس، فایل‌های بیش‌ازحد بزرگ، و پاسخ‌های HTML احراز هویت/ورود Slack به‌جای گزارش شدن به‌عنوان قالب‌های پشتیبانی‌نشده، رد می‌شوند.
- **مدل بینایی**: تحلیل تصویر زمانی از مدل پاسخ‌گوی فعال استفاده می‌کند که از بینایی پشتیبانی کند، یا از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel`.

### محدودیت‌های شناخته‌شده

| سناریو                               | رفتار فعلی                                                             | راه‌حل جایگزین                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL فایل Slack منقضی شده                 | فایل رد می‌شود؛ خطایی نمایش داده نمی‌شود                                                 | فایل را دوباره در Slack بارگذاری کنید                                                |
| مدل بینایی پیکربندی نشده            | پیوست‌های تصویر به‌عنوان ارجاع‌های رسانه ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند | `agents.defaults.imageModel` را پیکربندی کنید یا از یک مدل پاسخ‌گوی دارای قابلیت بینایی استفاده کنید |
| تصاویر بسیار بزرگ (> 20 MB به‌طور پیش‌فرض) | بر اساس سقف اندازه رد می‌شوند                                                         | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید                       |
| پیوست‌های فوروارد/اشتراک‌گذاری‌شده           | متن و رسانه تصویر/فایل میزبانی‌شده در Slack به‌صورت best-effort پردازش می‌شوند                       | مستقیماً در thread OpenClaw دوباره به اشتراک بگذارید                                   |
| پیوست‌های PDF                        | به‌عنوان زمینه فایل/رسانه ذخیره می‌شوند، نه اینکه به‌طور خودکار از مسیر بینایی تصویر عبور کنند  | برای metadata فایل از `download-file` یا برای تحلیل PDF از ابزار `pdf` استفاده کنید   |

### مستندات مرتبط

- [pipeline درک رسانه](/fa/nodes/media-understanding)
- [ابزار PDF](/fa/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — فعال‌سازی بینایی پیوست Slack
- تست‌های رگرسیون: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- راستی‌آزمایی زنده: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## مرتبط

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    یک کاربر Slack را با Gateway جفت کنید.
  </Card>
  <Card title="Groups" icon="users" href="/fa/channels/groups">
    رفتار کانال و DM گروهی.
  </Card>
  <Card title="Channel routing" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها route کنید.
  </Card>
  <Card title="Security" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="Configuration" icon="sliders" href="/fa/gateway/configuration">
    چیدمان پیکربندی و تقدم.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/fa/tools/slash-commands">
    کاتالوگ و رفتار دستور.
  </Card>
</CardGroup>
