---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی حالت سوکت، HTTP یا رله Slack
summary: راه‌اندازی Slack و رفتار زمان اجرا (Socket Mode، HTTP Request URLs و حالت رله)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:14:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

آمادهٔ تولید برای DMs و کانال‌ها از طریق یکپارچه‌سازی‌های اپ Slack. حالت پیش‌فرض Socket Mode است؛ HTTP Request URLs نیز پشتیبانی می‌شوند. حالت relay برای استقرارهای مدیریت‌شده‌ای در نظر گرفته شده است که در آن‌ها یک router مورد اعتماد مالک ورودی Slack است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    DMs در Slack به‌صورت پیش‌فرض از حالت جفت‌سازی استفاده می‌کند.
  </Card>
  <Card title="دستورهای Slash" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستور بومی و کاتالوگ دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    تشخیص‌های میان‌کانالی و راهنماهای عملیاتی تعمیر.
  </Card>
</CardGroup>

## انتخاب Socket Mode یا HTTP Request URLs

هر دو ترابری آمادهٔ تولید هستند و از نظر قابلیت‌های پیام‌رسانی، دستورهای slash، App Home و تعامل‌پذیری به برابری رسیده‌اند. انتخاب را بر اساس شکل استقرار انجام دهید، نه قابلیت‌ها.

| دغدغه                       | Socket Mode (پیش‌فرض)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL عمومی Gateway            | لازم نیست                                                                                                                                             | لازم است (DNS، TLS، reverse proxy یا tunnel)                                                                   |
| شبکهٔ خروجی                  | WSS خروجی به `wss-primary.slack.com` باید قابل دسترسی باشد                                                                                            | بدون WS خروجی؛ فقط HTTPS ورودی                                                                                |
| توکن‌های لازم                | توکن Bot + App-Level Token با `connections:write`                                                                                                     | توکن Bot + Signing Secret                                                                                     |
| لپ‌تاپ توسعه / پشت firewall | همان‌طور که هست کار می‌کند                                                                                                                            | به یک tunnel عمومی (ngrok، Cloudflare Tunnel، Tailscale Funnel) یا Gateway مرحله‌بندی نیاز دارد               |
| مقیاس‌پذیری افقی             | یک نشست Socket Mode برای هر app روی هر host؛ چند Gateway به appهای Slack جداگانه نیاز دارند                                                           | handler بدون state برای POST؛ چند replica از Gateway می‌توانند پشت یک load balancer یک app را به اشتراک بگذارند |
| چند حساب روی یک Gateway      | پشتیبانی می‌شود؛ هر حساب WS خودش را باز می‌کند                                                                                                       | پشتیبانی می‌شود؛ هر حساب به `webhookPath` یکتا نیاز دارد (پیش‌فرض `/slack/events`) تا registrationها تداخل نکنند |
| ترابری دستور slash           | از طریق اتصال WS تحویل داده می‌شود؛ `slash_commands[].url` نادیده گرفته می‌شود                                                                        | Slack به `slash_commands[].url` POST می‌کند؛ این فیلد برای dispatch شدن دستور لازم است                       |
| امضای درخواست                | استفاده نمی‌شود (auth همان App-Level Token است)                                                                                                       | Slack هر درخواست را امضا می‌کند؛ OpenClaw با `signingSecret` راستی‌آزمایی می‌کند                             |
| بازیابی پس از قطع اتصال      | reconnect خودکار Slack SDK فعال است؛ OpenClaw نیز نشست‌های ناموفق Socket Mode را با backoff محدود دوباره راه‌اندازی می‌کند. تنظیم ترابری pong-timeout اعمال می‌شود. | اتصال پایداری وجود ندارد که قطع شود؛ retryها برای هر درخواست از سمت Slack انجام می‌شوند                      |

<Note>
  **Socket Mode را انتخاب کنید** برای hostهای تک-Gateway، لپ‌تاپ‌های توسعه، و شبکه‌های on-prem که می‌توانند به‌صورت خروجی به `*.slack.com` برسند اما نمی‌توانند HTTPS ورودی بپذیرند.

**HTTP Request URLs را انتخاب کنید** وقتی چند replica از Gateway را پشت load balancer اجرا می‌کنید، وقتی WSS خروجی مسدود است اما HTTPS ورودی مجاز است، یا وقتی از قبل Webhookهای Slack را در یک reverse proxy terminate می‌کنید.
</Note>

### حالت Relay

حالت Relay ورودی Slack را از Gateway در OpenClaw جدا می‌کند. یک router مورد اعتماد مالک
تنها اتصال Slack Socket Mode است، یک Gateway مقصد را انتخاب می‌کند، و یک رویداد typed
را از طریق websocket احراز هویت‌شده forward می‌کند. Gateway همچنان از توکن bot خود برای
فراخوانی‌های خروجی Slack Web API استفاده می‌کند.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

URL مربوط به relay باید از `wss://` استفاده کند مگر اینکه localhost را هدف بگیرد. bearer token و
جدول route در router را بخشی از مرز مجوزدهی Slack در نظر بگیرید: رویدادهای route‌شده به‌عنوان activationهای مجاز وارد
handler عادی پیام Slack می‌شوند. یک `slack_identity` ارائه‌شده توسط router
در frame `hello` مربوط به websocket می‌تواند نام کاربری و آیکون خروجی پیش‌فرض را تنظیم کند؛ هویت صریحی
که caller ارائه کند همچنان اولویت دارد. اتصال relay با همان زمان‌بندی
backoff محدود مورد استفاده در Socket Mode دوباره وصل می‌شود و هر زمان
قطع شود، هویت ارائه‌شده توسط router را پاک می‌کند.

## نصب

پیش از پیکربندی کانال، Slack را نصب کنید:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` Plugin را ثبت و فعال می‌کند. Plugin همچنان هیچ کاری انجام نمی‌دهد تا زمانی که app در Slack و تنظیمات کانال زیر را پیکربندی کنید. برای رفتار عمومی Plugin و قواعد نصب، [Plugins](/fa/tools/plugin) را ببینید.

## راه‌اندازی سریع

<Tabs>
  <Tab title="Socket Mode (پیش‌فرض)">
    <Steps>
      <Step title="یک app جدید در Slack بسازید">
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Recommended** با مجموعهٔ کامل قابلیت‌های Plugin برای Slack مطابقت دارد: App Home، دستورهای slash، فایل‌ها، واکنش‌ها، pinها، DMs گروهی، و خواندن emoji/usergroup. وقتی سیاست workspace scopeها را محدود می‌کند، **Minimal** را انتخاب کنید — این گزینه DMs، تاریخچهٔ channel/group، mentionها و دستورهای slash را پوشش می‌دهد اما فایل‌ها، واکنش‌ها، pinها، group-DM (`mpim:*`)، `emoji:read` و `usergroups:read` را حذف می‌کند. برای منطق هر scope و گزینه‌های افزایشی مانند دستورهای slash اضافی، [چک‌لیست manifest و scope](#manifest-and-scope-checklist) را ببینید.
        </Note>

        پس از اینکه Slack app را ساخت:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: `connections:write` را اضافه کنید، ذخیره کنید، App-Level Token را کپی کنید.
        - **Install App -> Install to Workspace**: Bot User OAuth Token را کپی کنید.

      </Step>

      <Step title="پیکربندی OpenClaw">

        راه‌اندازی پیشنهادی SecretRef:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="شروع Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="نشانی‌های URL درخواست HTTP">
    <Steps>
      <Step title="ایجاد یک برنامه Slack جدید">
        [api.slack.com/apps](https://api.slack.com/apps/new) را باز کنید → **Create New App** → **From a manifest** → فضای کاری خود را انتخاب کنید → یکی از manifestهای زیر را جای‌گذاری کنید → `https://gateway-host.example.com/slack/events` را با URL عمومی Gateway خود جایگزین کنید → **Next** → **Create**.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Recommended** با مجموعه کامل قابلیت‌های Plugin مربوط به Slack مطابقت دارد؛ **Minimal** فایل‌ها، واکنش‌ها، پین‌ها، پیام مستقیم گروهی (`mpim:*`)، `emoji:read` و `usergroups:read` را برای فضاهای کاری محدودکننده حذف می‌کند. برای دلیل هر scope، [چک‌لیست manifest و scope](#manifest-and-scope-checklist) را ببینید.
        </Note>

        <Info>
          هر سه فیلد URL (`slash_commands[].url`، `event_subscriptions.request_url` و `interactivity.request_url` / `message_menu_options_url`) همگی به همان endpoint در OpenClaw اشاره می‌کنند. طرح‌واره manifest مربوط به Slack الزام می‌کند که این‌ها جداگانه نام‌گذاری شوند، اما OpenClaw بر اساس نوع payload مسیریابی می‌کند، بنابراین یک `webhookPath` واحد (پیش‌فرض `/slack/events`) کافی است. فرمان‌های slash بدون `slash_commands[].url` در حالت HTTP بی‌سروصدا هیچ کاری انجام نخواهند داد.
        </Info>

        پس از اینکه Slack برنامه را ایجاد کرد:

        - **Basic Information → App Credentials**: برای راستی‌آزمایی درخواست، **Signing Secret** را کپی کنید.
        - **Install App -> Install to Workspace**: Bot User OAuth Token را کپی کنید.

      </Step>

      <Step title="پیکربندی OpenClaw">

        راه‌اندازی پیشنهادی SecretRef:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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

      <Step title="شروع Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## تنظیم transport در Socket Mode

OpenClaw به‌طور پیش‌فرض در Socket Mode، مهلت زمانی pong کلاینت Slack SDK را روی ۱۵ ثانیه تنظیم می‌کند. تنظیمات transport را فقط زمانی بازنویسی کنید که به تنظیم اختصاصی برای فضای کاری یا میزبان نیاز دارید:

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

این را فقط برای فضاهای کاری Socket Mode استفاده کنید که timeoutهای مربوط به Slack websocket pong/server-ping را ثبت می‌کنند یا روی میزبان‌هایی با کمبود شناخته‌شده در event loop اجرا می‌شوند. `clientPingTimeout` زمان انتظار برای pong پس از آن است که SDK یک client ping می‌فرستد؛ `serverPingTimeout` زمان انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای برنامه وضعیت برنامه محسوب می‌شوند، نه سیگنال‌های زنده‌بودن transport.

نکته‌ها:

- `socketMode` در حالت URL درخواست HTTP نادیده گرفته می‌شود.
- تنظیمات پایه `channels.slack.socketMode` برای همه حساب‌های Slack اعمال می‌شوند مگر اینکه بازنویسی شوند. بازنویسی‌های هر حساب از `channels.slack.accounts.<accountId>.socketMode` استفاده می‌کنند؛ چون این یک بازنویسی شیء است، هر فیلد تنظیم socket را که برای آن حساب می‌خواهید وارد کنید.
- فقط `clientPingTimeout` یک پیش‌فرض OpenClaw دارد (`15000`). `serverPingTimeout` و `pingPongLoggingEnabled` فقط زمانی که پیکربندی شده باشند به Slack SDK پاس داده می‌شوند.
- backoff راه‌اندازی مجدد Socket Mode حدود ۲ ثانیه شروع می‌شود و حدود ۳۰ ثانیه سقف می‌خورد. خطاهای قابل بازیابیِ شروع، انتظار برای شروع و قطع اتصال تا زمانی که کانال متوقف شود دوباره تلاش می‌شوند. خطاهای دائمی حساب و اعتبارنامه مانند احراز هویت نامعتبر، توکن‌های لغوشده یا scopeهای مفقود، به‌جای تلاش دوباره بی‌پایان سریعاً شکست می‌خورند.

## چک‌لیست manifest و scope

manifest پایه برنامه Slack برای Socket Mode و URLهای درخواست HTTP یکسان است. فقط بلوک `settings` (و `url` فرمان slash) تفاوت دارد.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

برای **حالت URLهای درخواست HTTP**، `settings` را با گونه HTTP جایگزین کنید و به هر فرمان slash یک `url` اضافه کنید. URL عمومی لازم است:

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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

مانیفست پیش‌فرض، تب **خانه** در Slack App Home را فعال می‌کند و در `app_home_opened` مشترک می‌شود. وقتی عضوی از فضای کاری تب خانه را باز می‌کند، OpenClaw با `views.publish` یک نمای خانهٔ پیش‌فرض و ایمن منتشر می‌کند؛ هیچ payload مکالمه یا پیکربندی خصوصی‌ای در آن گنجانده نمی‌شود. تب **پیام‌ها** برای پیام‌های مستقیم Slack همچنان فعال می‌ماند. مانیفست همچنین رشته‌های دستیار Slack را با `features.assistant_view`، `assistant:write`، `assistant_thread_started` و `assistant_thread_context_changed` فعال می‌کند؛ رشته‌های دستیار به نشست‌های رشته‌ای جداگانهٔ OpenClaw هدایت می‌شوند و زمینهٔ رشته‌ای ارائه‌شده توسط Slack را برای عامل در دسترس نگه می‌دارند.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    می‌توان به‌جای یک فرمان پیکربندی‌شدهٔ واحد، از چندین [فرمان اسلش بومی](#commands-and-slash-behavior) با چند نکته استفاده کرد:

    - از `/agentstatus` به‌جای `/status` استفاده کنید، چون فرمان `/status` رزرو شده است.
    - بیش از ۲۵ فرمان اسلش را نمی‌توان هم‌زمان در دسترس قرار داد.

    بخش `features.slash_commands` موجود خود را با زیرمجموعه‌ای از [فرمان‌های در دسترس](/fa/tools/slash-commands#command-list) جایگزین کنید:

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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
        از همان فهرست `slash_commands` مانند حالت سوکت بالا استفاده کنید و به هر ورودی `"url": "https://gateway-host.example.com/slack/events"` را اضافه کنید. نمونه:

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

        آن مقدار `url` را برای هر فرمان در فهرست تکرار کنید.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض برنامهٔ Slack از هویت عامل فعال استفاده کنند (نام کاربری و آیکون سفارشی)، scope ربات `chat:write.customize` را اضافه کنید.

    اگر از آیکون ایموجی استفاده می‌کنید، Slack انتظار نحو `:emoji_name:` را دارد.

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

- `botToken` + `appToken` برای حالت سوکت الزامی هستند.
- حالت HTTP به `botToken` + `signingSecret` نیاز دارد.
- حالت relay به `botToken` به‌همراه `relay.url`، `relay.authToken` و `relay.gatewayId` نیاز دارد؛ از توکن برنامه یا امضای محرمانه استفاده نمی‌کند.
- `botToken`، `appToken`، `signingSecret`، `relay.authToken` و `userToken` رشته‌های متن ساده
  یا اشیای SecretRef را می‌پذیرند.
- توکن‌های پیکربندی، fallback متغیر محیطی را override می‌کنند.
- fallback متغیرهای محیطی `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
- `userToken` فقط از طریق پیکربندی تنظیم می‌شود (بدون fallback متغیر محیطی) و به‌طور پیش‌فرض رفتار فقط‌خواندنی دارد (`userTokenReadOnly: true`).

رفتار snapshot وضعیت:

- بازرسی حساب Slack برای هر credential، فیلدهای `*Source` و `*Status`
  را ردیابی می‌کند (`botToken`، `appToken`، `signingSecret`، `userToken`).
- وضعیت `available`، `configured_unavailable` یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا منبع محرمانهٔ غیرخطی دیگری پیکربندی شده است، اما مسیر فرمان/زمان اجرای فعلی
  نتوانسته مقدار واقعی را resolve کند.
- در حالت HTTP، `signingSecretStatus` گنجانده می‌شود؛ در حالت سوکت،
  جفت الزامی `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای کنش‌ها/خواندن‌های directory، وقتی توکن کاربر پیکربندی شده باشد، می‌تواند ترجیح داده شود. برای نوشتن‌ها، توکن ربات همچنان ترجیح دارد؛ نوشتن با توکن کاربر فقط وقتی مجاز است که `userTokenReadOnly: false` باشد و توکن ربات در دسترس نباشد.
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

کنش‌های فعلی پیام Slack شامل `send`، `upload-file`، `download-file`، `read`، `edit`، `delete`، `pin`، `unpin`، `list-pins`، `member-info` و `emoji-list` هستند. `download-file` شناسه‌های فایل Slack نمایش‌داده‌شده در placeholderهای فایل ورودی را می‌پذیرد و برای تصاویر، پیش‌نمایش تصویر، یا برای انواع فایل دیگر، metadata فایل محلی را برمی‌گرداند.

## کنترل دسترسی و مسیریابی

  <Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` دسترسی DM را کنترل می‌کند. `channels.slack.allowFrom` فهرست مجاز معیار برای DM است.

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

    - `channels.slack.accounts.default.allowFrom` فقط روی حساب `default` اعمال می‌شود.
    - حساب‌های نام‌گذاری‌شده وقتی `allowFrom` خودشان تنظیم نشده باشد، `channels.slack.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌گذاری‌شده `channels.slack.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.slack.dm.policy` و `channels.slack.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` وقتی بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    جفت‌سازی در DMها از `openclaw pairing approve slack <code>` استفاده می‌کند.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` مدیریت کانال را کنترل می‌کند:

    - `open`
    - `allowlist`
    - `disabled`

    فهرست مجاز کانال زیر `channels.slack.channels` قرار می‌گیرد و **باید از شناسه‌های پایدار کانال Slack** (برای مثال `C12345678`) به‌عنوان کلیدهای پیکربندی استفاده کند.

    نکته زمان اجرا: اگر `channels.slack` کاملاً وجود نداشته باشد (راه‌اندازی فقط با env)، زمان اجرا به `groupPolicy="allowlist"` برمی‌گردد و هشداری ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    تشخیص نام/شناسه:

    - ورودی‌های فهرست مجاز کانال و ورودی‌های فهرست مجاز DM هنگام راه‌اندازی، وقتی دسترسی توکن اجازه دهد، تشخیص داده می‌شوند
    - ورودی‌های حل‌نشده نام کانال همان‌طور که پیکربندی شده‌اند نگه داشته می‌شوند، اما به‌طور پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند
    - مجوزدهی ورودی و مسیریابی کانال به‌طور پیش‌فرض ابتدا بر اساس شناسه انجام می‌شود؛ تطبیق مستقیم نام کاربری/اسلاگ نیازمند `channels.slack.dangerouslyAllowNameMatching: true` است

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) زیر `groupPolicy: "allowlist"` تطبیق نمی‌شوند. جست‌وجوی کانال به‌طور پیش‌فرض ابتدا بر اساس شناسه انجام می‌شود، بنابراین یک کلید مبتنی بر نام هرگز با موفقیت مسیریابی نخواهد شد و همه پیام‌ها در آن کانال بی‌صدا مسدود می‌شوند. این با `groupPolicy: "open"` تفاوت دارد، جایی که کلید کانال برای مسیریابی لازم نیست و به نظر می‌رسد یک کلید مبتنی بر نام کار می‌کند.

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

  <Tab title="Mentions and channel users">
    پیام‌های کانال به‌طور پیش‌فرض با الزام mention محدود می‌شوند.

    منابع mention:

    - mention صریح برنامه (`<@botId>`)
    - mention گروه کاربری Slack (`<!subteam^S...>`) وقتی کاربر ربات عضو آن گروه کاربری باشد؛ نیازمند `usergroups:read`
    - الگوهای regex برای mention (`agents.list[].groupChat.mentionPatterns`، جایگزین `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی رشته پاسخ به ربات (وقتی `thread.requireExplicitMention` برابر `true` باشد غیرفعال است)

    کنترل‌های هر کانال (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق تشخیص هنگام راه‌اندازی یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (فهرست مجاز)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - قالب کلید `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`، یا wildcard `"*"`
      (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند)

    `allowBots` برای کانال‌ها و کانال‌های خصوصی محافظه‌کارانه است: پیام‌های اتاق که توسط بات نوشته شده‌اند فقط زمانی پذیرفته می‌شوند که بات فرستنده به‌صراحت در allowlist مربوط به `users` همان اتاق فهرست شده باشد، یا دست‌کم یک Slack owner ID صریح از `channels.slack.allowFrom` در حال حاضر عضو اتاق باشد. wildcardها و ورودی‌های مالک با display-name حضور مالک را احراز نمی‌کنند. حضور مالک از Slack `conversations.members` استفاده می‌کند؛ مطمئن شوید برنامه read scope متناظر با نوع اتاق را دارد (`channels:read` برای کانال‌های عمومی، `groups:read` برای کانال‌های خصوصی). اگر جست‌وجوی عضو شکست بخورد، OpenClaw پیام اتاق نوشته‌شده توسط بات را حذف می‌کند.

    پیام‌های پذیرفته‌شده Slack که توسط بات نوشته شده‌اند از [محافظت حلقه بات](/fa/channels/bot-loop-protection) مشترک استفاده می‌کنند. `channels.defaults.botLoopProtection` را برای بودجه پیش‌فرض پیکربندی کنید، سپس وقتی یک workspace یا کانال به حد متفاوتی نیاز دارد، با `channels.slack.botLoopProtection` یا `channels.slack.channels.<id>.botLoopProtection` بازنویسی کنید.

  </Tab>
</Tabs>

## نخ‌بندی، نشست‌ها، و برچسب‌های پاسخ

- DMها به‌صورت `direct` مسیریابی می‌شوند؛ کانال‌ها به‌صورت `channel`؛ MPIMها به‌صورت `group`.
- اتصال‌های مسیر Slack شناسه‌های خام peer و همچنین شکل‌های هدف Slack مانند `channel:C12345678`، `user:U12345678`، و `<@U12345678>` را می‌پذیرند.
- با مقدار پیش‌فرض `session.dmScope=main`، DMهای Slack در نشست اصلی عامل ادغام می‌شوند.
- نشست‌های کانال: `agent:<agentId>:slack:channel:<channelId>`.
- پیام‌های معمولی سطح‌بالای کانال روی نشست مخصوص همان کانال می‌مانند، حتی وقتی `replyToMode` غیر از `off` باشد.
- پاسخ‌های نخ Slack از `thread_ts` والد Slack برای پسوندهای نشست استفاده می‌کنند (`:thread:<threadTs>`)، حتی وقتی نخ‌بندی پاسخ خروجی با `replyToMode="off"` غیرفعال شده باشد.
- OpenClaw یک ریشه سطح‌بالای واجد شرایط کانال را در `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` آغاز می‌کند وقتی انتظار می‌رود آن ریشه یک نخ قابل مشاهده Slack را شروع کند، تا ریشه و پاسخ‌های بعدی نخ یک نشست OpenClaw مشترک داشته باشند. این برای رویدادهای `app_mention`، تطابق‌های صریح بات یا mention-pattern پیکربندی‌شده، و کانال‌های `requireMention: false` با `replyToMode` غیر از `off` اعمال می‌شود.
- مقدار پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ مقدار پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` کنترل می‌کند هنگام شروع یک نشست نخ جدید چه تعداد از پیام‌های موجود نخ واکشی شوند (پیش‌فرض `20`؛ برای غیرفعال‌سازی روی `0` تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، mentionهای ضمنی نخ را سرکوب می‌کند تا بات فقط به mentionهای صریح `@bot` داخل نخ‌ها پاسخ دهد، حتی وقتی بات قبلا در نخ مشارکت داشته است. بدون این گزینه، پاسخ‌ها در نخی که بات در آن مشارکت داشته است از دروازه `requireMention` عبور می‌کنند.

کنترل‌های نخ‌بندی پاسخ:

- `channels.slack.replyToMode`: `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: به‌ازای هر `direct|group|channel`
- fallback قدیمی برای گفت‌وگوهای مستقیم: `channels.slack.dm.replyToMode`

برچسب‌های پاسخ دستی پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

برای پاسخ‌های صریح نخ Slack از ابزار `message`، همراه با `action: "send"` و `threadId` یا `replyTo` مقدار `replyBroadcast: true` را تنظیم کنید تا از Slack بخواهد پاسخ نخ را در کانال والد نیز broadcast کند. این به پرچم `reply_broadcast` در `chat.postMessage` Slack نگاشت می‌شود و فقط برای ارسال‌های متنی یا Block Kit پشتیبانی می‌شود، نه بارگذاری‌های رسانه.

وقتی یک فراخوانی ابزار `message` داخل یک نخ Slack اجرا می‌شود و همان کانال را هدف می‌گیرد، OpenClaw معمولا نخ فعلی Slack را مطابق `replyToMode` به ارث می‌برد. برای اجبار به ایجاد یک پیام جدید در کانال والد، `topLevel: true` را روی `action: "send"` یا `action: "upload-file"` تنظیم کنید. `threadId: null` نیز به‌عنوان همان انصراف از سطح نخ پذیرفته می‌شود.

<Note>
`replyToMode="off"` نخ‌بندی پاسخ خروجی Slack را غیرفعال می‌کند، از جمله برچسب‌های صریح `[[reply_to_*]]`. این کار نشست‌های نخ ورودی Slack را مسطح نمی‌کند: پیام‌هایی که از قبل داخل یک نخ Slack ارسال شده‌اند همچنان به نشست `:thread:<threadTs>` مسیریابی می‌شوند. این با Telegram متفاوت است، جایی که برچسب‌های صریح همچنان در حالت `"off"` رعایت می‌شوند. نخ‌های Slack پیام‌ها را از کانال پنهان می‌کنند، در حالی که پاسخ‌های Telegram به‌صورت inline قابل مشاهده می‌مانند.
</Note>

## واکنش‌های تأیید

`ackReaction` در حالی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید ارسال می‌کند. `ackReactionScope` تعیین می‌کند آن ایموجی _چه زمانی_ واقعا ارسال شود.

### ایموجی (`ackReaction`)

ترتیب حل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت `"eyes"` / 👀)

نکات:

- Slack انتظار shortcode دارد (برای مثال `"eyes"`).
- برای غیرفعال‌سازی واکنش برای حساب Slack یا به‌صورت سراسری، از `""` استفاده کنید.

### دامنه (`messages.ackReactionScope`)

ارائه‌دهنده Slack دامنه را از `messages.ackReactionScope` می‌خواند (پیش‌فرض `"group-mentions"`). امروز هیچ بازنویسی در سطح حساب Slack یا کانال Slack وجود ندارد؛ مقدار برای Gateway سراسری است.

مقادیر:

- `"all"`: در DMها و گروه‌ها واکنش نشان بده.
- `"direct"`: فقط در DMها واکنش نشان بده.
- `"group-all"`: روی هر پیام گروهی واکنش نشان بده (بدون DMها).
- `"group-mentions"` (پیش‌فرض): در گروه‌ها واکنش نشان بده، اما فقط وقتی بات mention شده باشد (یا در mentionableهای گروهی که opt in کرده‌اند). **DMها مستثنی هستند.**
- `"off"` / `"none"`: هرگز واکنش نشان نده.

<Note>
دامنه پیش‌فرض (`"group-mentions"`) واکنش‌های تأیید را در پیام‌های مستقیم فعال نمی‌کند. برای دیدن `ackReaction` پیکربندی‌شده (برای مثال `"eyes"`) روی DMهای ورودی Slack، `messages.ackReactionScope` را روی `"direct"` یا `"all"` تنظیم کنید. `messages.ackReactionScope` هنگام راه‌اندازی ارائه‌دهنده Slack خوانده می‌شود، بنابراین برای اعمال تغییر به راه‌اندازی مجدد gateway نیاز است.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## پخش جریانی متن

`channels.slack.streaming` رفتار پیش‌نمایش زنده را کنترل می‌کند:

- `off`: پخش جریانی پیش‌نمایش زنده را غیرفعال کن.
- `partial` (پیش‌فرض): متن پیش‌نمایش را با آخرین خروجی جزئی جایگزین کن.
- `block`: به‌روزرسانی‌های پیش‌نمایش تکه‌تکه را پیوست کن.
- `progress`: هنگام تولید، متن وضعیت پیشرفت را نشان بده، سپس متن نهایی را ارسال کن.
- `streaming.preview.toolProgress`: وقتی پیش‌نمایش پیش‌نویس فعال است، به‌روزرسانی‌های ابزار/پیشرفت را به همان پیام پیش‌نمایش ویرایش‌شده هدایت کن (پیش‌فرض: `true`). برای نگه‌داشتن پیام‌های ابزار/پیشرفت جداگانه، روی `false` تنظیم کنید.
- `streaming.preview.commandText` / `streaming.progress.commandText`: روی `status` تنظیم کنید تا خطوط فشرده پیشرفت ابزار حفظ شوند و متن خام دستور/اجرا پنهان شود (پیش‌فرض: `raw`).

پنهان کردن متن خام دستور/اجرا در حالی که خطوط فشرده پیشرفت حفظ می‌شوند:

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

`channels.slack.streaming.nativeTransport` پخش جریانی متن بومی Slack را وقتی `channels.slack.streaming.mode` برابر `partial` است کنترل می‌کند (پیش‌فرض: `true`).

کارت‌های task پیشرفت بومی Slack برای حالت پیشرفت opt-in هستند. `channels.slack.streaming.progress.nativeTaskCards` را همراه با `channels.slack.streaming.mode="progress"` روی `true` تنظیم کنید تا هنگام اجرای کار، یک کارت plan/task بومی Slack ارسال شود، سپس همان کارت task در پایان به‌روزرسانی شود. بدون این پرچم، حالت پیشرفت رفتار قابل‌حمل پیش‌نمایش پیش‌نویس را حفظ می‌کند.

- برای نمایش پخش جریانی متن بومی و وضعیت نخ دستیار Slack باید یک نخ پاسخ در دسترس باشد. انتخاب نخ همچنان از `replyToMode` پیروی می‌کند.
- ریشه‌های کانال، گفت‌وگوی گروهی، و DM سطح‌بالا همچنان می‌توانند وقتی پخش جریانی بومی در دسترس نیست یا هیچ نخ پاسخی وجود ندارد، از پیش‌نمایش پیش‌نویس معمولی استفاده کنند.
- DMهای سطح‌بالای Slack به‌صورت پیش‌فرض خارج از نخ می‌مانند، بنابراین پیش‌نمایش جریان/وضعیت بومی به سبک نخ Slack را نشان نمی‌دهند؛ OpenClaw در عوض یک پیش‌نمایش پیش‌نویس را در DM ارسال و ویرایش می‌کند.
- رسانه و payloadهای غیرمتنی به تحویل معمولی fallback می‌کنند.
- نهایی‌های رسانه/خطا ویرایش‌های معلق پیش‌نمایش را لغو می‌کنند؛ نهایی‌های واجد شرایط متن/block فقط زمانی flush می‌شوند که بتوانند پیش‌نمایش را درجا ویرایش کنند.
- اگر پخش جریانی در میانه پاسخ شکست بخورد، OpenClaw برای payloadهای باقی‌مانده به تحویل معمولی fallback می‌کند.

استفاده از پیش‌نمایش پیش‌نویس به‌جای پخش جریانی متن بومی Slack:

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

opt in برای کارت‌های task پیشرفت بومی Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

کلیدهای قدیمی:

- `channels.slack.streamMode` (`replace | status_final | append`) یک alias قدیمی runtime برای `channels.slack.streaming.mode` است.
- بولی `channels.slack.streaming` یک alias قدیمی runtime برای `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` است.
- `channels.slack.nativeStreaming` قدیمی یک alias runtime برای `channels.slack.streaming.nativeTransport` است.
- برای بازنویسی پیکربندی پایدارشده پخش جریانی Slack به کلیدهای canonical، `openclaw doctor --fix` را اجرا کنید.

## fallback واکنش تایپ

`typingReaction` در حالی که OpenClaw در حال پردازش یک پاسخ است، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و وقتی اجرا تمام شد آن را حذف می‌کند. این بیشتر بیرون از پاسخ‌های نخ مفید است، چون پاسخ‌های نخ از نشانگر وضعیت پیش‌فرض "is typing..." استفاده می‌کنند.

ترتیب حل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکات:

- Slack انتظار shortcode دارد (برای مثال `"hourglass_flowing_sand"`).
- واکنش best-effort است و پس از تکمیل مسیر پاسخ یا شکست، پاک‌سازی به‌صورت خودکار تلاش می‌شود.

## رسانه، تکه‌بندی، و تحویل

<AccordionGroup>
  <Accordion title="Inbound attachments">
    پیوست‌های فایل Slack از URLهای خصوصی میزبانی‌شده توسط Slack دانلود می‌شوند (جریان درخواست احراز هویت‌شده با token) و وقتی واکشی موفق شود و محدودیت‌های اندازه اجازه دهند، در انبار رسانه نوشته می‌شوند. placeholderهای فایل شامل `fileId` مربوط به Slack هستند تا عامل‌ها بتوانند فایل اصلی را با `download-file` واکشی کنند.

    دانلودها از timeoutهای محدود idle و total استفاده می‌کنند. اگر بازیابی فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به placeholder فایل fallback می‌کند.

    سقف اندازه ورودی runtime به‌صورت پیش‌فرض `20MB` است مگر اینکه با `channels.slack.mediaMaxMb` بازنویسی شود.

  </Accordion>

  <Accordion title="Outbound text and files">
    - تکه‌های متن از `channels.slack.textChunkLimit` استفاده می‌کنند (پیش‌فرض 4000)
    - `channels.slack.chunkMode="newline"` تقسیم‌بندی paragraph-first را فعال می‌کند
    - ارسال‌های فایل از APIهای بارگذاری Slack استفاده می‌کنند و می‌توانند شامل پاسخ‌های نخ باشند (`thread_ts`)
    - سقف رسانه خروجی وقتی پیکربندی شده باشد از `channels.slack.mediaMaxMb` پیروی می‌کند؛ در غیر این صورت ارسال‌های کانال از پیش‌فرض‌های MIME-kind در pipeline رسانه استفاده می‌کنند

  </Accordion>

  <Accordion title="Delivery targets">
    هدف‌های صریح ترجیحی:

    - `user:<id>` برای DMها
    - `channel:<id>` برای کانال‌ها

    DMهای Slack فقط متن/block می‌توانند مستقیما به شناسه‌های کاربر ارسال کنند؛ بارگذاری‌های فایل و ارسال‌های threaded ابتدا DM را از طریق APIهای conversation Slack باز می‌کنند، چون این مسیرها به یک شناسه conversation مشخص نیاز دارند.

  </Accordion>
</AccordionGroup>

## فرمان‌ها و رفتار slash

فرمان‌های slash در Slack یا به‌صورت یک فرمان پیکربندی‌شده واحد ظاهر می‌شوند یا چند فرمان بومی. برای تغییر پیش‌فرض‌های فرمان، `channels.slack.slashCommand` را پیکربندی کنید:

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

منوهای آرگومان بومی از یک راهبرد rendering تطبیقی استفاده می‌کنند که پیش از dispatch کردن مقدار گزینه انتخاب‌شده، یک modal تأیید نشان می‌دهد:

- تا 5 گزینه: blockهای دکمه
- 6 تا 100 گزینه: منوی static select
- بیشتر از 100 گزینه: external select با فیلتر کردن async گزینه‌ها وقتی handlerهای گزینه‌های interactivity در دسترس باشند
- محدودیت‌های Slack فراتر رفته: مقدارهای گزینه encodeشده به دکمه‌ها fallback می‌کنند

```txt
/think
```

جلسه‌های اسلش از کلیدهای ایزوله‌ای مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای فرمان‌ها را با استفاده از `CommandTargetSessionKey` به جلسه گفت‌وگوی مقصد هدایت می‌کنند.

## پاسخ‌های تعاملی

Slack می‌تواند کنترل‌های پاسخ تعاملی نوشته‌شده توسط عامل را رندر کند، اما این قابلیت به‌صورت پیش‌فرض غیرفعال است.
برای خروجی عامل، CLI، و plugin جدید، دکمه‌های مشترک
`presentation` یا بلوک‌های انتخاب را ترجیح دهید. آن‌ها از همان مسیر تعامل Slack
استفاده می‌کنند و هم‌زمان در کانال‌های دیگر نیز به‌صورت تنزل‌یافته عمل می‌کنند.

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

وقتی فعال باشد، عامل‌ها همچنان می‌توانند دستورالعمل‌های پاسخ منسوخ و فقط مخصوص Slack را منتشر کنند:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

این دستورالعمل‌ها به Slack Block Kit کامپایل می‌شوند و کلیک‌ها یا انتخاب‌ها را
از مسیر رویداد تعامل موجود Slack بازمی‌گردانند. آن‌ها را برای پرامپت‌های قدیمی
و راه‌گریزهای خاص Slack نگه دارید؛ برای کنترل‌های قابل‌حمل جدید از ارائه مشترک
استفاده کنید.

APIهای کامپایلر دستورالعمل نیز برای کد تولیدکننده جدید منسوخ شده‌اند:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

برای کنترل‌های جدیدی که در Slack رندر می‌شوند، از بارهای `presentation` و
`buildSlackPresentationBlocks(...)` استفاده کنید.

یادداشت‌ها:

- این یک رابط کاربری قدیمی و خاص Slack است. کانال‌های دیگر دستورالعمل‌های Slack Block
  Kit را به سامانه‌های دکمه خود ترجمه نمی‌کنند.
- مقادیر callback تعاملی توکن‌های مبهم تولیدشده توسط OpenClaw هستند، نه مقادیر خام نوشته‌شده توسط عامل.
- اگر بلوک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit فراتر بروند، OpenClaw به‌جای ارسال بار بلوک‌های نامعتبر، به پاسخ متنی اصلی بازمی‌گردد.

### ارسال‌های مودال تحت مالکیت Plugin

Pluginهای Slack که یک handler تعاملی ثبت می‌کنند، می‌توانند رویدادهای چرخه عمر مودال
`view_submission` و `view_closed` را نیز پیش از آن‌که OpenClaw
بار را برای رویداد سیستمی قابل‌مشاهده برای عامل فشرده کند، دریافت کنند. هنگام باز کردن یک مودال Slack از یکی از این الگوهای مسیریابی استفاده کنید:

- `callback_id` را روی `openclaw:<namespace>:<payload>` تنظیم کنید.
- یا یک `callback_id` موجود را نگه دارید و `pluginInteractiveData:
"<namespace>:<payload>"` را در `private_metadata` مودال قرار دهید.

handler مقدار `ctx.interaction.kind` را به‌صورت `view_submission` یا
`view_closed`، `inputs` نرمال‌شده، و شیء خام کامل `stateValues` را از
Slack دریافت می‌کند. مسیریابی فقط با callback-id برای فراخوانی handler plugin کافی است؛ وقتی مودال باید یک رویداد سیستمی قابل‌مشاهده برای عامل نیز تولید کند، فیلدهای مسیریابی کاربر/جلسه در `private_metadata` مودال موجود را اضافه کنید. عامل یک رویداد سیستمی فشرده و ویرایش‌شده با عنوان `Slack interaction: ...` دریافت می‌کند. اگر handler مقدار
`systemEvent.summary`، `systemEvent.reference`، یا `systemEvent.data` را برگرداند، این فیلدها در آن رویداد فشرده گنجانده می‌شوند تا عامل بتواند بدون دیدن بار کامل فرم، به فضای ذخیره‌سازی تحت مالکیت plugin ارجاع دهد.

## تأییدهای بومی در Slack

Slack می‌تواند به‌جای بازگشت به رابط وب یا ترمینال، با دکمه‌ها و تعامل‌های تعاملی به‌عنوان یک کارخواه تأیید بومی عمل کند.

- تأییدهای Exec و plugin می‌توانند به‌صورت اعلان‌های Slack-native Block Kit رندر شوند.
- `channels.slack.execApprovals.*` همچنان پیکربندی فعال‌سازی کارخواه تأیید exec بومی و مسیریابی DM/کانال است.
- DMهای تأیید Exec از `channels.slack.execApprovals.approvers` یا `commands.ownerAllowFrom` استفاده می‌کنند.
- وقتی Slack به‌عنوان یک کارخواه تأیید بومی برای جلسه مبدأ فعال باشد، یا وقتی `approvals.plugin` به جلسه Slack مبدأ یا یک مقصد Slack هدایت شود، تأییدهای plugin از دکمه‌های Slack-native استفاده می‌کنند.
- DMهای تأیید Plugin از تأییدکنندگان plugin در Slack از `channels.slack.allowFrom`، `allowFrom` حساب نام‌گذاری‌شده، یا مسیر پیش‌فرض حساب استفاده می‌کنند.
- مجوز تأییدکننده همچنان اعمال می‌شود: تأییدکنندگان فقط exec نمی‌توانند درخواست‌های plugin را تأیید کنند مگر این‌که تأییدکننده plugin نیز باشند.

این از همان سطح مشترک دکمه تأیید مانند کانال‌های دیگر استفاده می‌کند. وقتی `interactivity` در تنظیمات برنامه Slack شما فعال باشد، اعلان‌های تأیید مستقیماً در گفت‌وگو به‌صورت دکمه‌های Block Kit رندر می‌شوند.
وقتی این دکمه‌ها حاضر باشند، تجربه کاربری اصلی تأیید همان‌ها هستند؛ OpenClaw
فقط زمانی باید یک فرمان دستی `/approve` اضافه کند که نتیجه ابزار بگوید تأییدهای چت
در دسترس نیستند یا تأیید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` بازمی‌گردد)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`، `sessionFilter`

Slack وقتی `enabled` تنظیم نشده یا `"auto"` باشد و دست‌کم یک
تأییدکننده exec resolve شود، تأییدهای exec بومی را به‌صورت خودکار فعال می‌کند. Slack همچنین می‌تواند تأییدهای plugin بومی را از طریق این مسیر کارخواه بومی
وقتی تأییدکنندگان plugin در Slack resolve شوند و درخواست با فیلترهای کارخواه بومی مطابقت داشته باشد، مدیریت کند. برای غیرفعال کردن صریح Slack به‌عنوان یک کارخواه تأیید بومی، `enabled: false` را تنظیم کنید. برای واداشتن تأییدهای بومی به فعال بودن وقتی تأییدکنندگان resolve می‌شوند، `enabled: true` را تنظیم کنید. غیرفعال کردن تأییدهای exec در Slack، تحویل تأیید plugin بومی در Slack را که از طریق `approvals.plugin` فعال شده است غیرفعال نمی‌کند؛ تحویل تأیید plugin به‌جای آن از تأییدکنندگان plugin در Slack استفاده می‌کند.

رفتار پیش‌فرض بدون پیکربندی صریح تأیید exec در Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

پیکربندی صریح Slack-native فقط زمانی لازم است که بخواهید تأییدکنندگان را بازنویسی کنید، فیلتر اضافه کنید، یا
تحویل در چت مبدأ را فعال کنید:

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

ارسال مشترک `approvals.exec` جداست. فقط زمانی از آن استفاده کنید که اعلان‌های تأیید exec باید به چت‌های دیگر یا مقصدهای صریح خارج از باند نیز
هدایت شوند. ارسال مشترک `approvals.plugin` نیز
جداست؛ تحویل بومی Slack فقط زمانی آن fallback را سرکوب می‌کند که Slack بتواند درخواست
تأیید plugin را به‌صورت بومی مدیریت کند.

`/approve` در همان چت نیز در کانال‌ها و DMهای Slack که از قبل از فرمان‌ها پشتیبانی می‌کنند کار می‌کند. برای مدل کامل ارسال تأیید، [تأییدهای Exec](/fa/tools/exec-approvals) را ببینید.

## رویدادها و رفتار عملیاتی

- ویرایش‌ها/حذف‌های پیام به رویدادهای سیستمی نگاشت می‌شوند.
- پخش‌های thread (پاسخ‌های thread با «Also send to channel») به‌عنوان پیام‌های عادی کاربر پردازش می‌شوند.
- رویدادهای افزودن/حذف واکنش به رویدادهای سیستمی نگاشت می‌شوند.
- رویدادهای پیوستن/ترک عضو، ایجاد/تغییر نام کانال، و افزودن/حذف سنجاق به رویدادهای سیستمی نگاشت می‌شوند.
- وقتی `configWrites` فعال باشد، `channel_id_changed` می‌تواند کلیدهای پیکربندی کانال را مهاجرت دهد.
- فراداده موضوع/هدف کانال به‌عنوان زمینه نامطمئن تلقی می‌شود و می‌تواند به زمینه مسیریابی تزریق شود.
- آغازگر thread و seed کردن زمینه تاریخچه اولیه thread، در صورت کاربرد، بر اساس allowlistهای فرستنده پیکربندی‌شده فیلتر می‌شوند.
- کنش‌های بلوک، میان‌برها، و تعامل‌های مودال رویدادهای سیستمی ساختاریافته `Slack interaction: ...` را با فیلدهای بار غنی منتشر می‌کنند:
  - کنش‌های بلوک: مقادیر انتخاب‌شده، برچسب‌ها، مقادیر picker، و فراداده `workflow_*`
  - میان‌برهای سراسری: فراداده callback و کنشگر، هدایت‌شده به جلسه مستقیم کنشگر
  - میان‌برهای پیام: callback، کنشگر، کانال، thread، و زمینه پیام انتخاب‌شده
  - رویدادهای مودال `view_submission` و `view_closed` با فراداده کانال مسیریابی‌شده و ورودی‌های فرم

میان‌برهای سراسری یا پیام را در پیکربندی برنامه Slack خود تعریف کنید و از هر شناسه callback غیرخالی استفاده کنید. OpenClaw بارهای میان‌بر مطابق را تأیید می‌کند، همان سیاست فرستنده DM/کانال را مانند دیگر تعامل‌های Slack اعمال می‌کند، و رویداد پاک‌سازی‌شده را برای جلسه عامل مسیریابی‌شده در صف می‌گذارد. شناسه‌های trigger و URLهای پاسخ از زمینه عامل ویرایش می‌شوند.

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="فیلدهای پربازده Slack">

- حالت/احراز هویت: `mode`، `botToken`، `appToken`، `signingSecret`، `webhookPath`، `accounts.*`
- دسترسی DM: `dm.enabled`، `dmPolicy`، `allowFrom` (قدیمی: `dm.policy`، `dm.allowFrom`)، `dm.groupEnabled`، `dm.groupChannels`
- toggle سازگاری: `dangerouslyAllowNameMatching` (break-glass؛ مگر در صورت نیاز خاموش نگه دارید)
- دسترسی کانال: `groupPolicy`، `channels.*`، `channels.*.users`، `channels.*.requireMention`
- thread و تاریخچه: `replyToMode`، `replyToModeByChatType`، `thread.*`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`
- تحویل: `textChunkLimit`، `chunkMode`، `mediaMaxMb`، `streaming`، `streaming.nativeTransport`، `streaming.preview.toolProgress`
- unfurlها: `unfurlLinks` (پیش‌فرض: `false`)، `unfurlMedia` برای کنترل پیش‌نمایش لینک/رسانه در `chat.postMessage`؛ برای فعال‌سازی دوباره پیش‌نمایش لینک‌ها، `unfurlLinks: true` را تنظیم کنید
- عملیات/قابلیت‌ها: `configWrites`، `commands.native`، `slashCommand.*`، `actions.*`، `userToken`، `userTokenReadOnly`

</Accordion>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="در کانال‌ها پاسخی دریافت نمی‌شود">
    به‌ترتیب بررسی کنید:

    - `groupPolicy`
    - allowlist کانال (`channels.slack.channels`) — **کلیدها باید شناسه‌های کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام تحت `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، زیرا مسیریابی کانال به‌صورت پیش‌فرض ابتدا بر اساس ID است. برای یافتن ID: در Slack روی کانال راست‌کلیک کنید → **Copy link** — مقدار `C...` در انتهای URL همان شناسه کانال است.
    - `requireMention`
    - allowlist `users` در هر کانال
    - `messages.groupChat.visibleReplies`: درخواست‌های عادی گروه/کانال به‌صورت پیش‌فرض `"automatic"` هستند. اگر `"message_tool"` را فعال کرده‌اید و لاگ‌ها متن دستیار را بدون فراخوانی `message(action=send)` نشان می‌دهند، مدل مسیر ابزار پیام قابل‌مشاهده را از دست داده است. متن نهایی در این حالت خصوصی می‌ماند؛ لاگ verbose gateway را برای فراداده بارهای سرکوب‌شده بررسی کنید، یا اگر می‌خواهید هر پاسخ نهایی عادی دستیار از مسیر قدیمی ارسال شود، آن را روی `"automatic"` تنظیم کنید.
    - `messages.groupChat.unmentionedInbound`: اگر مقدار آن `"room_event"` باشد، گفت‌وگوی مجاز کانال بدون منشن، زمینه محیطی است و مگر این‌که عامل ابزار `message` را فراخوانی کند، ساکت می‌ماند. [رویدادهای محیطی اتاق](/fa/channels/ambient-room-events) را ببینید.

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

    فرمان‌های مفید:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="پیام‌های DM نادیده گرفته می‌شوند">
    بررسی کنید:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (یا قدیمی `channels.slack.dm.policy`)
    - تأییدهای pairing / ورودی‌های allowlist (`dmPolicy: "open"` همچنان به `channels.slack.allowFrom: ["*"]` نیاز دارد)
    - DMهای گروهی از مدیریت MPIM استفاده می‌کنند؛ `channels.slack.dm.groupEnabled` را فعال کنید و، اگر پیکربندی شده است، MPIM را در `channels.slack.dm.groupChannels` اضافه کنید
    - رویدادهای DM دستیار Slack: لاگ‌های verbose که به `drop message_changed` اشاره می‌کنند
      معمولاً یعنی Slack یک رویداد thread دستیار ویرایش‌شده را بدون یک
      فرستنده انسانی قابل‌بازیابی در فراداده پیام ارسال کرده است

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode وصل نمی‌شود">
    توکن‌های bot + app و فعال‌سازی Socket Mode را در تنظیمات برنامه Slack اعتبارسنجی کنید.
    App-Level Token به `connections:write` نیاز دارد، و Bot User OAuth Token
    bot token باید به همان برنامه/فضای کاری Slack تعلق داشته باشد که app token به آن تعلق دارد.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان دهد، حساب Slack
    پیکربندی شده است اما runtime فعلی نتوانسته مقدار پشتیبانی‌شده با SecretRef را resolve کند.

    لاگ‌هایی مانند `slack socket mode failed to start; retry ...` خطاهای قابل‌بازیابی
    در شروع هستند. نبود scopeها، توکن‌های لغوشده و احراز هویت نامعتبر
    در عوض سریعاً شکست می‌خورند. لاگ `slack token mismatch ...` یعنی توکن bot و توکن app
    ظاهراً به appهای متفاوت Slack تعلق دارند؛ اعتبارنامه‌های app در Slack را اصلاح کنید.

  </Accordion>

  <Accordion title="حالت HTTP رویدادها را دریافت نمی‌کند">
    اعتبارسنجی کنید:

    - signing secret
    - مسیر webhook
    - URLهای درخواست Slack (رویدادها + تعامل‌پذیری + دستورهای Slash)
    - `webhookPath` یکتا برای هر حساب HTTP
    - URL عمومی TLS را خاتمه می‌دهد و درخواست‌ها را به مسیر Gateway فوروارد می‌کند
    - مسیر `request_url` app در Slack دقیقاً با `channels.slack.webhookPath` مطابقت دارد (پیش‌فرض `/slack/events`)

    اگر `signingSecretStatus: "configured_unavailable"` در snapshotهای حساب
    ظاهر شود، حساب HTTP پیکربندی شده است اما runtime فعلی نتوانسته است
    signing secret مبتنی بر SecretRef را resolve کند.

    لاگ تکرارشونده `slack: webhook path ... already registered` یعنی دو حساب HTTP
    از یک `webhookPath` استفاده می‌کنند؛ به هر حساب یک مسیر متمایز بدهید.

  </Accordion>

  <Accordion title="دستورهای بومی/slash اجرا نمی‌شوند">
    بررسی کنید که منظورتان کدام بوده است:

    - حالت دستور بومی (`channels.slack.commands.native: true`) با دستورهای slash مطابق که در Slack ثبت شده‌اند
    - یا حالت تک دستور slash (`channels.slack.slashCommand.enabled: true`)

    Slack دستورهای slash را به‌صورت خودکار ایجاد یا حذف نمی‌کند. `commands.native: "auto"` دستورهای بومی Slack را فعال نمی‌کند؛ از `true` استفاده کنید و دستورهای مطابق را در app مربوط به Slack ایجاد کنید. در حالت HTTP، هر دستور slash در Slack باید URL مربوط به Gateway را شامل شود. در Socket Mode، payloadهای دستور از طریق وب‌سوکت می‌رسند و Slack مقدار `slash_commands[].url` را نادیده می‌گیرد.

    همچنین `commands.useAccessGroups`، مجوزدهی DM، allowlistهای کانال،
    و allowlistهای `users` برای هر کانال را بررسی کنید. Slack برای
    فرستنده‌های مسدودشده دستور slash خطاهای موقت برمی‌گرداند، از جمله:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## مرجع vision پیوست‌ها

وقتی دانلود فایل‌های Slack موفق باشد و محدودیت‌های اندازه اجازه دهند، Slack می‌تواند رسانه دانلودشده را به نوبت agent پیوست کند. فایل‌های تصویری می‌توانند از مسیر درک رسانه عبور داده شوند یا مستقیماً به یک مدل پاسخ‌گوی دارای قابلیت vision داده شوند؛ فایل‌های دیگر به‌جای اینکه به‌عنوان ورودی تصویر در نظر گرفته شوند، به‌صورت زمینه فایل قابل دانلود نگه داشته می‌شوند.

### انواع رسانه پشتیبانی‌شده

| نوع رسانه                         | منبع                 | رفتار فعلی                                                                            | یادداشت‌ها                                                                    |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| تصاویر JPEG / PNG / GIF / WebP   | URL فایل Slack       | دانلود و برای پردازش دارای قابلیت vision به نوبت پیوست می‌شود                         | سقف برای هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض 20 MB)                 |
| فایل‌های PDF                      | URL فایل Slack       | دانلود و به‌عنوان زمینه فایل برای ابزارهایی مانند `download-file` یا `pdf` ارائه می‌شود | ورودی Slack به‌صورت خودکار PDFها را به ورودی image-vision تبدیل نمی‌کند       |
| فایل‌های دیگر                     | URL فایل Slack       | در صورت امکان دانلود و به‌عنوان زمینه فایل ارائه می‌شود                               | فایل‌های دودویی به‌عنوان ورودی تصویر در نظر گرفته نمی‌شوند                    |
| پاسخ‌های thread                   | فایل‌های آغازگر thread | وقتی پاسخ رسانه مستقیم ندارد، فایل‌های پیام ریشه می‌توانند به‌عنوان زمینه hydrate شوند | آغازگرهای فقط‌فایل از یک placeholder پیوست استفاده می‌کنند                    |
| پیام‌های چندتصویری                | چند فایل Slack       | هر فایل به‌صورت مستقل ارزیابی می‌شود                                                  | پردازش Slack به هشت فایل برای هر پیام محدود شده است                           |

### pipeline ورودی

وقتی یک پیام Slack همراه با پیوست‌های فایل می‌رسد:

1. OpenClaw فایل را با استفاده از توکن bot از URL خصوصی Slack دانلود می‌کند.
2. در صورت موفقیت، فایل در media store نوشته می‌شود.
3. مسیرهای رسانه دانلودشده و نوع‌های محتوا به زمینه ورودی اضافه می‌شوند.
4. مسیرهای مدل/ابزار دارای قابلیت تصویر می‌توانند از پیوست‌های تصویری موجود در آن زمینه استفاده کنند.
5. فایل‌های غیرتصویری به‌صورت metadata فایل یا ارجاع‌های رسانه برای ابزارهایی که می‌توانند آن‌ها را مدیریت کنند، در دسترس می‌مانند.

### ارث‌بری پیوست از ریشه thread

وقتی پیامی در یک thread می‌رسد (دارای والد `thread_ts` است):

- اگر خود پاسخ رسانه مستقیم نداشته باشد و پیام ریشه گنجانده‌شده فایل داشته باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان زمینه آغازگر thread hydrate کند.
- پیوست‌های مستقیم پاسخ نسبت به پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و متن ندارد، با یک placeholder پیوست نمایش داده می‌شود تا fallback همچنان بتواند فایل‌های آن را شامل شود.

### مدیریت چند پیوست

وقتی یک پیام Slack شامل چند پیوست فایل باشد:

- هر پیوست به‌صورت مستقل از طریق pipeline رسانه پردازش می‌شود.
- ارجاع‌های رسانه دانلودشده در زمینه پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در payload رویداد پیروی می‌کند.
- شکست در دانلود یک پیوست، پیوست‌های دیگر را مسدود نمی‌کند.

### محدودیت‌های اندازه، دانلود و مدل

- **سقف اندازه**: پیش‌فرض 20 MB برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل پیکربندی است.
- **شکست‌های دانلود**: فایل‌هایی که Slack نمی‌تواند ارائه کند، URLهای منقضی‌شده، فایل‌های غیرقابل‌دسترس، فایل‌های بیش‌ازحد بزرگ، و پاسخ‌های HTML مربوط به احراز هویت/ورود Slack به‌جای گزارش شدن به‌عنوان قالب‌های پشتیبانی‌نشده، رد می‌شوند.
- **مدل vision**: تحلیل تصویر وقتی مدل پاسخ فعال از vision پشتیبانی کند از همان مدل استفاده می‌کند، یا از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel`.

### محدودیت‌های شناخته‌شده

| سناریو                                  | رفتار فعلی                                                                            | راهکار جایگزین                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| URL فایل Slack منقضی شده                | فایل رد می‌شود؛ خطایی نمایش داده نمی‌شود                                               | فایل را دوباره در Slack بارگذاری کنید                                           |
| مدل vision پیکربندی نشده است            | پیوست‌های تصویری به‌عنوان ارجاع‌های رسانه ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند | `agents.defaults.imageModel` را پیکربندی کنید یا از یک مدل پاسخ دارای قابلیت vision استفاده کنید |
| تصاویر بسیار بزرگ (> 20 MB به‌صورت پیش‌فرض) | براساس سقف اندازه رد می‌شوند                                                           | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید              |
| پیوست‌های فوروارد/اشتراک‌گذاری‌شده      | متن و رسانه تصویر/فایل میزبانی‌شده در Slack به‌صورت best-effort پردازش می‌شوند          | مستقیماً در thread مربوط به OpenClaw دوباره اشتراک‌گذاری کنید                   |
| پیوست‌های PDF                           | به‌عنوان زمینه فایل/رسانه ذخیره می‌شوند، نه اینکه به‌صورت خودکار از image vision عبور کنند | برای metadata فایل از `download-file` یا برای تحلیل PDF از ابزار `pdf` استفاده کنید |

### مستندات مرتبط

- [pipeline درک رسانه](/fa/nodes/media-understanding)
- [ابزار PDF](/fa/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — فعال‌سازی vision پیوست Slack
- تست‌های رگرسیون: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- راستی‌آزمایی زنده: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Slack را به gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار کانال و DM گروهی.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به agentها مسیریابی کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و سخت‌سازی.
  </Card>
  <Card title="پیکربندی" icon="sliders" href="/fa/gateway/configuration">
    چیدمان config و تقدم.
  </Card>
  <Card title="دستورهای Slash" icon="terminal" href="/fa/tools/slash-commands">
    کاتالوگ و رفتار دستور.
  </Card>
</CardGroup>
