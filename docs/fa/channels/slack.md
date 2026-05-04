---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی حالت سوکت/HTTP در Slack
summary: راه‌اندازی Slack و رفتار زمان اجرا (حالت سوکت + URLهای درخواست HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-04T07:02:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4a91fc1ae5f1e03f714308be54e164ef204809e74efabed8dc75c3035c14228
    source_path: channels/slack.md
    workflow: 16
---

آمادهٔ تولید برای پیام‌های مستقیم و کانال‌ها از طریق یکپارچه‌سازی‌های اپلیکیشن Slack. حالت پیش‌فرض، حالت Socket است؛ URLهای درخواست HTTP نیز پشتیبانی می‌شوند.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Slack به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار دستورهای بومی و فهرست دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    عیب‌یابی میان‌کانالی و راهنماهای عملیاتی تعمیر.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="حالت Socket (پیش‌فرض)">
    <Steps>
      <Step title="ایجاد یک اپلیکیشن Slack جدید">
        در تنظیمات اپلیکیشن Slack دکمهٔ **[Create New App](https://api.slack.com/apps/new)** را فشار دهید:

        - گزینهٔ **from a manifest** را انتخاب کنید و یک فضای کاری برای اپلیکیشن خود برگزینید
        - [نمونهٔ manifest](#manifest-and-scope-checklist) زیر را جای‌گذاری کنید و برای ایجاد ادامه دهید
        - یک **توکن سطح اپلیکیشن** (`xapp-...`) با `connections:write` ایجاد کنید
        - اپلیکیشن را نصب کنید و **توکن Bot** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

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

  <Tab title="URLهای درخواست HTTP">
    <Steps>
      <Step title="ایجاد یک اپلیکیشن Slack جدید">
        در تنظیمات اپلیکیشن Slack دکمهٔ **[Create New App](https://api.slack.com/apps/new)** را فشار دهید:

        - گزینهٔ **from a manifest** را انتخاب کنید و یک فضای کاری برای اپلیکیشن خود برگزینید
        - [نمونهٔ manifest](#manifest-and-scope-checklist) را جای‌گذاری کنید و پیش از ایجاد، URLها را به‌روزرسانی کنید
        - **راز امضا** را برای راستی‌آزمایی درخواست ذخیره کنید
        - اپلیکیشن را نصب کنید و **توکن Bot** (`xoxb-...`) نمایش‌داده‌شده را کپی کنید

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

        به هر حساب یک `webhookPath` متمایز (پیش‌فرض `/slack/events`) بدهید تا ثبت‌ها با هم تداخل نکنند.
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

## تنظیم دقیق انتقال در حالت Socket

OpenClaw به‌طور پیش‌فرض زمان پایان انتظار pong کلاینت SDK Slack را برای حالت Socket روی ۱۵ ثانیه تنظیم می‌کند. تنظیمات انتقال را فقط زمانی بازنویسی کنید که به تنظیم دقیق مخصوص فضای کاری یا میزبان نیاز دارید:

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

این را فقط برای فضاهای کاری حالت Socket استفاده کنید که پایان زمان انتظار pong وب‌سوکت Slack یا server-ping را ثبت می‌کنند، یا روی میزبان‌هایی اجرا می‌شوند که گرسنگی حلقهٔ رویداد شناخته‌شده دارند. `clientPingTimeout` مدت انتظار برای pong پس از ارسال ping کلاینت توسط SDK است؛ `serverPingTimeout` مدت انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای اپلیکیشن همچنان وضعیت اپلیکیشن هستند، نه سیگنال‌های زنده‌بودن انتقال.

## فهرست بررسی manifest و scope

manifest پایهٔ اپلیکیشن Slack برای حالت Socket و URLهای درخواست HTTP یکسان است. فقط بلوک `settings` (و `url` دستور اسلش) متفاوت است.

manifest پایه (پیش‌فرض حالت Socket):

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

برای **حالت URLهای درخواست HTTP**، `settings` را با گونهٔ HTTP جایگزین کنید و به هر دستور اسلش `url` اضافه کنید. URL عمومی لازم است:

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

### تنظیمات تکمیلی manifest

ویژگی‌های متفاوتی را که پیش‌فرض‌های بالا را گسترش می‌دهند، ارائه کنید.

manifest پیش‌فرض، زبانهٔ **Home** در Slack App Home را فعال می‌کند و در `app_home_opened` مشترک می‌شود. وقتی یکی از اعضای فضای کاری زبانهٔ Home را باز می‌کند، OpenClaw با `views.publish` یک نمای Home پیش‌فرض امن منتشر می‌کند؛ هیچ payload مکالمه یا پیکربندی خصوصی در آن گنجانده نمی‌شود. زبانهٔ **Messages** برای پیام‌های مستقیم Slack همچنان فعال می‌ماند.

<AccordionGroup>
  <Accordion title="دستورهای اسلش بومی اختیاری">

    می‌توان به‌جای یک دستور پیکربندی‌شدهٔ واحد، از چندین [دستور اسلش بومی](#commands-and-slash-behavior) با جزئیات استفاده کرد:

    - از `/agentstatus` به‌جای `/status` استفاده کنید، چون دستور `/status` رزرو شده است.
    - نمی‌توان بیش از ۲۵ دستور اسلش را هم‌زمان در دسترس قرار داد.

    بخش `features.slash_commands` موجود خود را با زیرمجموعه‌ای از [دستورهای موجود](/fa/tools/slash-commands#command-list) جایگزین کنید:

    <Tabs>
      <Tab title="حالت Socket (پیش‌فرض)">

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
      <Tab title="URLهای درخواست HTTP">
        از همان فهرست `slash_commands` حالت Socket در بالا استفاده کنید و به هر ورودی `"url": "https://gateway-host.example.com/slack/events"` اضافه کنید. نمونه:

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

        آن مقدار `url` را برای هر دستور در فهرست تکرار کنید.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="دامنه‌های اختیاری نویسندگی (عملیات نوشتن)">
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض برنامه Slack از هویت عامل فعال (نام کاربری و نماد سفارشی) استفاده کنند، دامنه ربات `chat:write.customize` را اضافه کنید.

    اگر از نماد ایموجی استفاده می‌کنید، Slack انتظار نحو `:emoji_name:` را دارد.

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
- توکن‌های پیکربندی، جایگزین بازگشت env می‌شوند.
- بازگشت env برای `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` فقط برای حساب پیش‌فرض اعمال می‌شود.
- `userToken` (`xoxp-...`) فقط از طریق پیکربندی است (بدون بازگشت env) و به‌طور پیش‌فرض رفتار فقط‌خواندنی دارد (`userTokenReadOnly: true`).

رفتار نمایه وضعیت:

- بازرسی حساب Slack فیلدهای `*Source` و `*Status`
  را برای هر اعتبارنامه (`botToken`، `appToken`، `signingSecret`، `userToken`) رهگیری می‌کند.
- وضعیت `available`، `configured_unavailable` یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا منبع راز غیرخطی دیگری پیکربندی شده است، اما مسیر فرمان/زمان اجرای فعلی
  نتوانسته مقدار واقعی را resolve کند.
- در حالت HTTP، `signingSecretStatus` گنجانده می‌شود؛ در Socket Mode،
  جفت الزامی `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای خواندن‌های اقدامات/فهرست، وقتی توکن کاربر پیکربندی شده باشد می‌توان آن را ترجیح داد. برای نوشتن‌ها، توکن ربات همچنان ترجیح داده می‌شود؛ نوشتن با توکن کاربر فقط وقتی مجاز است که `userTokenReadOnly: false` باشد و توکن ربات در دسترس نباشد.
</Tip>

## اقدامات و گیت‌ها

اقدامات Slack با `channels.slack.actions.*` کنترل می‌شوند.

گروه‌های اقدام موجود در ابزار فعلی Slack:

| گروه       | پیش‌فرض |
| ---------- | ------- |
| messages   | فعال |
| reactions  | فعال |
| pins       | فعال |
| memberInfo | فعال |
| emojiList  | فعال |

اقدامات پیام فعلی Slack شامل `send`، `upload-file`، `download-file`، `read`، `edit`، `delete`، `pin`، `unpin`، `list-pins`، `member-info` و `emoji-list` است. `download-file` شناسه‌های فایل Slack را که در جای‌نگهدارهای فایل ورودی نشان داده می‌شوند می‌پذیرد و برای تصاویر پیش‌نمایش تصویر یا برای انواع دیگر فایل، فراداده فایل محلی را برمی‌گرداند.

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
    - `dm.groupEnabled` (DMهای گروهی به‌طور پیش‌فرض false هستند)
    - `dm.groupChannels` (فهرست مجاز MPIM اختیاری)

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

    نکته زمان اجرا: اگر `channels.slack` کاملا وجود نداشته باشد (راه‌اندازی فقط با env)، زمان اجرا به `groupPolicy="allowlist"` برمی‌گردد و یک هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    resolve نام/شناسه:

    - ورودی‌های فهرست مجاز کانال و ورودی‌های فهرست مجاز DM هنگام راه‌اندازی، وقتی دسترسی توکن اجازه دهد، resolve می‌شوند
    - ورودی‌های resolveنشده نام کانال همان‌طور که پیکربندی شده‌اند نگه داشته می‌شوند، اما به‌طور پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند
    - مجوزدهی ورودی و مسیریابی کانال به‌طور پیش‌فرض ابتدا بر پایه شناسه است؛ تطبیق مستقیم نام کاربری/slug به `channels.slack.dangerouslyAllowNameMatching: true` نیاز دارد

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) تحت `groupPolicy: "allowlist"` تطبیق **نمی‌شوند**. جست‌وجوی کانال به‌طور پیش‌فرض ابتدا بر پایه شناسه است، بنابراین یک کلید مبتنی بر نام هرگز با موفقیت مسیریابی نمی‌شود و همه پیام‌های آن کانال بی‌صدا مسدود خواهند شد. این با `groupPolicy: "open"` فرق دارد؛ در آنجا کلید کانال برای مسیریابی لازم نیست و به نظر می‌رسد یک کلید مبتنی بر نام کار می‌کند.

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

  <Tab title="Mentions and channel users">
    پیام‌های کانال به‌صورت پیش‌فرض با اشاره کنترل می‌شوند.

    منابع اشاره:

    - اشاره صریح به اپ (`<@botId>`)
    - اشاره به گروه کاربری Slack (`<!subteam^S...>`) وقتی کاربر ربات عضو آن گروه کاربری باشد؛ به `usergroups:read` نیاز دارد
    - الگوهای regex اشاره (`agents.list[].groupChat.mentionPatterns`، جایگزین `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی پاسخ به رشته ربات (وقتی `thread.requireExplicitMention` برابر `true` باشد غیرفعال می‌شود)

    کنترل‌های هر کانال (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق حل‌وفصل هنگام راه‌اندازی یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`، `toolsBySender`
    - قالب کلید `toolsBySender`: `id:`، `e164:`، `username:`، `name:`، یا wildcard `"*"`
      (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند)

    `allowBots` برای کانال‌ها و کانال‌های خصوصی محافظه‌کارانه است: پیام‌های اتاق که توسط ربات نوشته شده‌اند فقط وقتی پذیرفته می‌شوند که ربات فرستنده به‌صراحت در allowlist `users` همان اتاق فهرست شده باشد، یا وقتی دست‌کم یک شناسه مالک صریح Slack از `channels.slack.allowFrom` در حال حاضر عضو اتاق باشد. wildcardها و ورودی‌های مالک با نام نمایشی، حضور مالک را برآورده نمی‌کنند. حضور مالک از `conversations.members` در Slack استفاده می‌کند؛ مطمئن شوید اپ scope خواندن متناظر با نوع اتاق را دارد (`channels:read` برای کانال‌های عمومی، `groups:read` برای کانال‌های خصوصی). اگر جست‌وجوی عضو شکست بخورد، OpenClaw پیام اتاق نوشته‌شده توسط ربات را حذف می‌کند.

  </Tab>
</Tabs>

## رشته‌ها، نشست‌ها، و برچسب‌های پاسخ

- DMها به‌صورت `direct` مسیر‌دهی می‌شوند؛ کانال‌ها به‌صورت `channel`؛ MPIMها به‌صورت `group`.
- اتصال‌های مسیر Slack شناسه‌های خام طرف مقابل به‌علاوه فرم‌های مقصد Slack مانند `channel:C12345678`، `user:U12345678`، و `<@U12345678>` را می‌پذیرند.
- با مقدار پیش‌فرض `session.dmScope=main`، DMهای Slack در نشست اصلی عامل ادغام می‌شوند.
- نشست‌های کانال: `agent:<agentId>:slack:channel:<channelId>`.
- پاسخ‌های رشته می‌توانند در صورت کاربرد پسوندهای نشست رشته (`:thread:<threadTs>`) بسازند.
- مقدار پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ مقدار پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` کنترل می‌کند هنگام شروع یک نشست رشته جدید چند پیام موجود رشته دریافت شود (پیش‌فرض `20`؛ برای غیرفعال‌سازی روی `0` تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، اشاره‌های ضمنی رشته را سرکوب می‌کند تا ربات فقط به اشاره‌های صریح `@bot` داخل رشته‌ها پاسخ دهد، حتی وقتی ربات قبلا در رشته مشارکت کرده باشد. بدون این، پاسخ‌ها در رشته‌ای که ربات در آن مشارکت داشته از کنترل `requireMention` عبور می‌کنند.

کنترل‌های رشته پاسخ:

- `channels.slack.replyToMode`: `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: به‌ازای هر `direct|group|channel`
- جایگزین قدیمی برای چت‌های مستقیم: `channels.slack.dm.replyToMode`

برچسب‌های پاسخ دستی پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` **تمام** رشته‌سازی پاسخ در Slack را غیرفعال می‌کند، از جمله برچسب‌های صریح `[[reply_to_*]]`. این با Telegram متفاوت است، جایی که برچسب‌های صریح همچنان در حالت `"off"` رعایت می‌شوند. رشته‌های Slack پیام‌ها را از کانال پنهان می‌کنند، در حالی که پاسخ‌های Telegram به‌صورت درون‌خطی قابل مشاهده می‌مانند.
</Note>

## واکنش‌های تایید

`ackReaction` هنگام پردازش پیام ورودی توسط OpenClaw یک ایموجی تایید ارسال می‌کند.

ترتیب حل‌وفصل:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- جایگزین ایموجی هویت عامل (`agents.list[].identity.emoji`، وگرنه "👀")

نکته‌ها:

- Slack انتظار shortcode دارد (برای مثال `"eyes"`).
- برای غیرفعال کردن واکنش برای حساب Slack یا به‌صورت سراسری از `""` استفاده کنید.

## پخش جریانی متن

`channels.slack.streaming` رفتار پیش‌نمایش زنده را کنترل می‌کند:

- `off`: پخش جریانی پیش‌نمایش زنده را غیرفعال می‌کند.
- `partial` (پیش‌فرض): متن پیش‌نمایش را با آخرین خروجی جزئی جایگزین می‌کند.
- `block`: به‌روزرسانی‌های پیش‌نمایش بخش‌بندی‌شده را اضافه می‌کند.
- `progress`: هنگام تولید، متن وضعیت پیشرفت را نشان می‌دهد، سپس متن نهایی را ارسال می‌کند.
- `streaming.preview.toolProgress`: وقتی پیش‌نمایش پیش‌نویس فعال است، به‌روزرسانی‌های ابزار/پیشرفت را به همان پیام پیش‌نمایش ویرایش‌شده مسیر‌دهی می‌کند (پیش‌فرض: `true`). برای نگه داشتن پیام‌های جداگانه ابزار/پیشرفت، روی `false` تنظیم کنید.
- `streaming.preview.commandText` / `streaming.progress.commandText`: برای حفظ خطوط فشرده پیشرفت ابزار هنگام پنهان کردن متن خام command/exec، روی `status` تنظیم کنید (پیش‌فرض: `raw`).

پنهان کردن متن خام command/exec در عین حفظ خطوط فشرده پیشرفت:

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

- برای ظاهر شدن پخش جریانی متن بومی و وضعیت رشته دستیار Slack، باید یک رشته پاسخ در دسترس باشد. انتخاب رشته همچنان از `replyToMode` پیروی می‌کند.
- ریشه‌های کانال، چت گروهی، و DM سطح بالا همچنان می‌توانند وقتی پخش جریانی بومی در دسترس نیست یا رشته پاسخی وجود ندارد، از پیش‌نمایش پیش‌نویس معمول استفاده کنند.
- DMهای سطح بالای Slack به‌صورت پیش‌فرض خارج از رشته می‌مانند، بنابراین پیش‌نمایش جریان/وضعیت بومی به سبک رشته Slack را نشان نمی‌دهند؛ OpenClaw به‌جای آن یک پیش‌نمایش پیش‌نویس را در DM ارسال و ویرایش می‌کند.
- رسانه و payloadهای غیرمتنی به تحویل معمول بازمی‌گردند.
- نتیجه‌های نهایی رسانه/خطا ویرایش‌های پیش‌نمایش معلق را لغو می‌کنند؛ نتیجه‌های نهایی متن/block واجد شرایط فقط وقتی flush می‌شوند که بتوانند پیش‌نمایش را درجا ویرایش کنند.
- اگر پخش جریانی در میانه پاسخ شکست بخورد، OpenClaw برای payloadهای باقی‌مانده به تحویل معمول بازمی‌گردد.

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

کلیدهای قدیمی:

- `channels.slack.streamMode` (`replace | status_final | append`) به‌صورت خودکار به `channels.slack.streaming.mode` مهاجرت داده می‌شود.
- مقدار boolean `channels.slack.streaming` به‌صورت خودکار به `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` مهاجرت داده می‌شود.
- `channels.slack.nativeStreaming` قدیمی به‌صورت خودکار به `channels.slack.streaming.nativeTransport` مهاجرت داده می‌شود.

## جایگزین واکنش تایپ کردن

`typingReaction` هنگامی که OpenClaw در حال پردازش یک پاسخ است، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و سپس هنگام پایان اجرای کار آن را حذف می‌کند. این قابلیت بیشتر خارج از پاسخ‌های رشته‌ای مفید است؛ پاسخ‌های رشته‌ای از نشانگر وضعیت پیش‌فرض «در حال تایپ است...» استفاده می‌کنند.

ترتیب حل:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکته‌ها:

- Slack انتظار کدهای کوتاه دارد (برای مثال `"hourglass_flowing_sand"`).
- واکنش به‌صورت بهترین تلاش انجام می‌شود و پس از تکمیل مسیر پاسخ یا شکست، پاک‌سازی به‌طور خودکار تلاش می‌شود.

## رسانه، بخش‌بندی، و تحویل

<AccordionGroup>
  <Accordion title="پیوست‌های ورودی">
    پیوست‌های فایل Slack از URLهای خصوصی میزبانی‌شده توسط Slack دانلود می‌شوند (جریان درخواست احراز هویت‌شده با توکن) و وقتی واکشی موفق باشد و محدودیت‌های اندازه اجازه دهند، در مخزن رسانه نوشته می‌شوند. جای‌نگهدارهای فایل شامل `fileId` مربوط به Slack هستند تا agentها بتوانند فایل اصلی را با `download-file` واکشی کنند.

    دانلودها از timeoutهای محدود برای بیکاری و کل زمان استفاده می‌کنند. اگر بازیابی فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به جای‌نگهدار فایل برمی‌گردد.

    سقف اندازه ورودی در زمان اجرا به‌طور پیش‌فرض `20MB` است، مگر اینکه با `channels.slack.mediaMaxMb` بازنویسی شود.

  </Accordion>

  <Accordion title="متن و فایل‌های خروجی">
    - بخش‌های متن از `channels.slack.textChunkLimit` استفاده می‌کنند (پیش‌فرض 4000)
    - `channels.slack.chunkMode="newline"` تقسیم‌بندی با اولویت پاراگراف را فعال می‌کند
    - ارسال فایل‌ها از APIهای بارگذاری Slack استفاده می‌کند و می‌تواند شامل پاسخ‌های رشته‌ای (`thread_ts`) باشد
    - سقف رسانه خروجی هنگام پیکربندی از `channels.slack.mediaMaxMb` پیروی می‌کند؛ در غیر این صورت ارسال‌های کانال از پیش‌فرض‌های نوع MIME در pipeline رسانه استفاده می‌کنند

  </Accordion>

  <Accordion title="مقصدهای تحویل">
    مقصدهای صریح ترجیحی:

    - `user:<id>` برای DMها
    - `channel:<id>` برای کانال‌ها

    DMهای Slack فقط متنی/بلوکی می‌توانند مستقیماً به شناسه‌های کاربر ارسال شوند؛ بارگذاری فایل و ارسال‌های رشته‌ای ابتدا DM را از طریق APIهای گفت‌وگوی Slack باز می‌کنند، چون آن مسیرها به یک شناسه گفت‌وگوی مشخص نیاز دارند.

  </Accordion>
</AccordionGroup>

## دستورها و رفتار slash

دستورهای slash در Slack یا به‌صورت یک دستور پیکربندی‌شده واحد ظاهر می‌شوند یا به‌صورت چند دستور native. برای تغییر پیش‌فرض‌های دستور، `channels.slack.slashCommand` را پیکربندی کنید:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

دستورهای native به [تنظیمات manifest اضافی](#additional-manifest-settings) در برنامه Slack شما نیاز دارند و به‌جای آن با `channels.slack.commands.native: true` یا `commands.native: true` در پیکربندی‌های سراسری فعال می‌شوند.

- حالت خودکار دستور native برای Slack **خاموش** است، بنابراین `commands.native: "auto"` دستورهای native Slack را فعال نمی‌کند.

```txt
/help
```

منوهای آرگومان native از یک راهبرد رندر تطبیقی استفاده می‌کنند که پیش از dispatch کردن مقدار گزینه انتخاب‌شده، یک modal تأیید نشان می‌دهد:

- تا 5 گزینه: بلوک‌های دکمه
- 6 تا 100 گزینه: منوی انتخاب ایستا
- بیش از 100 گزینه: انتخاب خارجی با فیلتر ناهمگام گزینه‌ها وقتی handlerهای گزینه‌های interactivity در دسترس باشند
- عبور از محدودیت‌های Slack: مقدارهای کدگذاری‌شده گزینه به دکمه‌ها برمی‌گردند

```txt
/think
```

نشست‌های slash از کلیدهای جداشده‌ای مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای دستورها را با استفاده از `CommandTargetSessionKey` به نشست گفت‌وگوی مقصد route می‌کنند.

## پاسخ‌های تعاملی

Slack می‌تواند کنترل‌های پاسخ تعاملی نوشته‌شده توسط agent را رندر کند، اما این قابلیت به‌طور پیش‌فرض غیرفعال است.

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

یا فقط برای یک حساب Slack فعال کنید:

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

پس از فعال‌سازی، agentها می‌توانند دستورهای پاسخ فقط مخصوص Slack منتشر کنند:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

این دستورها به Slack Block Kit کامپایل می‌شوند و کلیک‌ها یا انتخاب‌ها را از مسیر موجود رویداد تعامل Slack برمی‌گردانند.

نکته‌ها:

- این UI مخصوص Slack است. کانال‌های دیگر دستورهای Slack Block Kit را به سیستم‌های دکمه خودشان ترجمه نمی‌کنند.
- مقدارهای callback تعاملی، توکن‌های opaque تولیدشده توسط OpenClaw هستند، نه مقدارهای خام نوشته‌شده توسط agent.
- اگر بلوک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit فراتر بروند، OpenClaw به‌جای ارسال payload بلوک‌های نامعتبر، به پاسخ متنی اصلی برمی‌گردد.

## تأییدهای exec در Slack

Slack می‌تواند به‌جای برگشت به Web UI یا ترمینال، با دکمه‌ها و تعامل‌های تعاملی به‌عنوان یک client تأیید native عمل کند.

- تأییدهای exec از `channels.slack.execApprovals.*` برای route کردن native به DM/کانال استفاده می‌کنند.
- تأییدهای Plugin همچنان می‌توانند از همان سطح دکمه native در Slack حل شوند، وقتی درخواست از قبل در Slack فرود آمده باشد و نوع شناسه تأیید `plugin:` باشد.
- مجوز تأییدکننده همچنان اعمال می‌شود: فقط کاربرانی که به‌عنوان تأییدکننده شناسایی شده‌اند می‌توانند درخواست‌ها را از طریق Slack تأیید یا رد کنند.

این از همان سطح مشترک دکمه تأیید مثل کانال‌های دیگر استفاده می‌کند. وقتی `interactivity` در تنظیمات برنامه Slack شما فعال باشد، promptهای تأیید مستقیماً در گفت‌وگو به‌صورت دکمه‌های Block Kit رندر می‌شوند.
وقتی آن دکمه‌ها وجود دارند، UX اصلی تأیید همان‌ها هستند؛ OpenClaw
فقط وقتی باید دستور دستی `/approve` را اضافه کند که نتیجه ابزار بگوید تأییدهای chat
در دسترس نیستند یا تأیید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` برمی‌گردد)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`, `sessionFilter`

Slack وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک
تأییدکننده حل شود، تأییدهای exec native را به‌طور خودکار فعال می‌کند. برای غیرفعال کردن صریح Slack به‌عنوان client تأیید native، `enabled: false` را تنظیم کنید.
برای اجبار به فعال‌سازی تأییدهای native وقتی تأییدکننده‌ها حل می‌شوند، `enabled: true` را تنظیم کنید.

رفتار پیش‌فرض بدون پیکربندی صریح تأیید exec در Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

پیکربندی صریح native مربوط به Slack فقط زمانی لازم است که بخواهید تأییدکننده‌ها را بازنویسی کنید، filter اضافه کنید، یا
تحویل به chat مبدأ را فعال کنید:

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

forwarding مشترک `approvals.exec` جدا است. فقط وقتی از آن استفاده کنید که promptهای تأیید exec باید همچنین
به chatهای دیگر یا مقصدهای out-of-band صریح route شوند. forwarding مشترک `approvals.plugin` نیز
جدا است؛ دکمه‌های native Slack همچنان می‌توانند تأییدهای Plugin را حل کنند، وقتی آن درخواست‌ها از قبل
در Slack فرود آمده باشند.

`/approve` در همان chat نیز در کانال‌ها و DMهای Slack که از قبل از دستورها پشتیبانی می‌کنند کار می‌کند. برای مدل کامل forwarding تأیید، [تأییدهای exec](/fa/tools/exec-approvals) را ببینید.

## رویدادها و رفتار عملیاتی

- ویرایش/حذف پیام‌ها به رویدادهای سیستم نگاشت می‌شوند.
- پخش‌های رشته‌ای (پاسخ‌های رشته‌ای «Also send to channel») به‌عنوان پیام‌های عادی کاربر پردازش می‌شوند.
- رویدادهای افزودن/حذف واکنش به رویدادهای سیستم نگاشت می‌شوند.
- رویدادهای پیوستن/ترک عضو، ایجاد/تغییرنام کانال، و افزودن/حذف pin به رویدادهای سیستم نگاشت می‌شوند.
- وقتی `configWrites` فعال باشد، `channel_id_changed` می‌تواند کلیدهای پیکربندی کانال را migrate کند.
- metadata موضوع/هدف کانال به‌عنوان context غیرقابل اعتماد در نظر گرفته می‌شود و می‌تواند به context route کردن inject شود.
- آغازکننده رشته و seed کردن context اولیه تاریخچه رشته، در صورت کاربرد، بر اساس allowlistهای فرستنده پیکربندی‌شده filter می‌شوند.
- کنش‌های بلوک و تعامل‌های modal رویدادهای ساخت‌یافته سیستم `Slack interaction: ...` را با فیلدهای payload غنی منتشر می‌کنند:
  - کنش‌های بلوک: مقدارهای انتخاب‌شده، labelها، مقدارهای picker، و metadata مربوط به `workflow_*`
  - رویدادهای modal `view_submission` و `view_closed` با metadata کانال route‌شده و ورودی‌های فرم

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="فیلدهای پرسیگنال Slack">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- دسترسی DM: `dm.enabled`, `dmPolicy`, `allowFrom` (قدیمی: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle سازگاری: `dangerouslyAllowNameMatching` (break-glass؛ مگر در صورت نیاز خاموش نگه دارید)
- دسترسی کانال: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- رشته‌بندی/تاریخچه: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- تحویل: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- عملیات/قابلیت‌ها: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="هیچ پاسخی در کانال‌ها دریافت نمی‌شود">
    به‌ترتیب بررسی کنید:

    - `groupPolicy`
    - allowlist کانال (`channels.slack.channels`) — **کلیدها باید شناسه کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام زیر `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، چون route کردن کانال به‌طور پیش‌فرض ID-first است. برای پیدا کردن یک ID: روی کانال در Slack راست‌کلیک کنید → **Copy link** — مقدار `C...` در انتهای URL شناسه کانال است.
    - `requireMention`
    - allowlist کاربران در سطح هر کانال

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
    - `channels.slack.dmPolicy` (یا گزینه قدیمی `channels.slack.dm.policy`)
    - تأییدهای pairing / ورودی‌های allowlist
    - رویدادهای DM مربوط به Slack Assistant: logهای verbose که `drop message_changed` را ذکر می‌کنند
      معمولاً یعنی Slack یک رویداد ویرایش‌شده Assistant-thread بدون
      فرستنده انسانی قابل بازیابی در metadata پیام فرستاده است

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode وصل نمی‌شود">
    توکن‌های bot + app و فعال بودن Socket Mode را در تنظیمات برنامه Slack اعتبارسنجی کنید.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان می‌دهد، حساب Slack
    پیکربندی شده است اما runtime فعلی نتوانسته مقدار پشتیبانی‌شده با SecretRef را
    resolve کند.

  </Accordion>

  <Accordion title="HTTP mode رویدادها را دریافت نمی‌کند">
    اعتبارسنجی کنید:

    - signing secret
    - مسیر Webhook
    - URLهای درخواست Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` یکتا برای هر حساب HTTP

    اگر `signingSecretStatus: "configured_unavailable"` در snapshotهای حساب
    ظاهر شود، حساب HTTP پیکربندی شده است اما runtime فعلی نتوانسته
    signing secret پشتیبانی‌شده با SecretRef را resolve کند.

  </Accordion>

  <Accordion title="دستورهای native/slash اجرا نمی‌شوند">
    بررسی کنید که منظورتان کدام بوده است:

    - حالت دستور native (`channels.slack.commands.native: true`) با دستورهای slash متناظر ثبت‌شده در Slack
    - یا حالت دستور slash واحد (`channels.slack.slashCommand.enabled: true`)

    همچنین `commands.useAccessGroups` و allowlistهای کانال/کاربر را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مرجع vision پیوست

Slack وقتی دانلود فایل‌های Slack موفق باشند و محدودیت‌های اندازه اجازه دهند، می‌تواند رسانه دانلودشده را به turn مربوط به agent پیوست کند. فایل‌های تصویر می‌توانند از مسیر درک رسانه عبور داده شوند یا مستقیماً به مدل پاسخ دارای قابلیت vision داده شوند؛ فایل‌های دیگر به‌جای اینکه به‌عنوان ورودی تصویر در نظر گرفته شوند، به‌عنوان context فایل قابل دانلود نگه داشته می‌شوند.

### انواع رسانه پشتیبانی‌شده

| نوع رسانه                     | منبع               | رفتار فعلی                                                                  | یادداشت‌ها                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| تصاویر JPEG / PNG / GIF / WebP | URL فایل Slack       | دانلود می‌شود و برای پردازش دارای قابلیت بینایی به نوبت پیوست می‌شود                   | سقف هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض 20 MB)                 |
| فایل‌های PDF                      | URL فایل Slack       | دانلود می‌شود و به‌عنوان زمینهٔ فایل برای ابزارهایی مانند `download-file` یا `pdf` در دسترس قرار می‌گیرد | ورودی Slack به‌طور خودکار PDFها را به ورودی بینایی تصویر تبدیل نمی‌کند |
| فایل‌های دیگر                    | URL فایل Slack       | در صورت امکان دانلود می‌شود و به‌عنوان زمینهٔ فایل در دسترس قرار می‌گیرد                              | فایل‌های باینری به‌عنوان ورودی تصویر در نظر گرفته نمی‌شوند                               |
| پاسخ‌های رشته                 | فایل‌های آغازگر رشته | فایل‌های پیام ریشه وقتی پاسخ رسانهٔ مستقیم ندارد می‌توانند به‌عنوان زمینه بارگذاری شوند  | آغازگرهای فقط‌فایل از یک جای‌نگهدار پیوست استفاده می‌کنند                          |
| پیام‌های چندتصویری           | چند فایل Slack | هر فایل به‌صورت مستقل ارزیابی می‌شود                                              | پردازش Slack به هشت فایل برای هر پیام محدود است                     |

### خط لولهٔ ورودی

وقتی یک پیام Slack با پیوست‌های فایل می‌رسد:

1. OpenClaw فایل را از URL خصوصی Slack با استفاده از توکن ربات (`xoxb-...`) دانلود می‌کند.
2. فایل در صورت موفقیت در انبار رسانه نوشته می‌شود.
3. مسیرهای رسانهٔ دانلودشده و نوع‌های محتوا به زمینهٔ ورودی افزوده می‌شوند.
4. مسیرهای مدل/ابزار دارای قابلیت تصویر می‌توانند از پیوست‌های تصویر موجود در آن زمینه استفاده کنند.
5. فایل‌های غیرتصویری همچنان به‌صورت فرادادهٔ فایل یا ارجاع‌های رسانه برای ابزارهایی که می‌توانند آن‌ها را پردازش کنند در دسترس می‌مانند.

### وراثت پیوست ریشهٔ رشته

وقتی پیامی در یک رشته می‌رسد (یک والد `thread_ts` دارد):

- اگر خود پاسخ رسانهٔ مستقیم نداشته باشد و پیام ریشهٔ گنجانده‌شده فایل داشته باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان زمینهٔ آغازگر رشته بارگذاری کند.
- پیوست‌های مستقیم پاسخ بر پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و متن ندارد با یک جای‌نگهدار پیوست نمایش داده می‌شود تا مسیر پشتیبان همچنان بتواند فایل‌های آن را شامل شود.

### مدیریت چند پیوست

وقتی یک پیام Slack شامل چند پیوست فایل باشد:

- هر پیوست به‌صورت مستقل از طریق خط لولهٔ رسانه پردازش می‌شود.
- ارجاع‌های رسانهٔ دانلودشده در زمینهٔ پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در بار رویداد پیروی می‌کند.
- شکست در دانلود یک پیوست، سایر پیوست‌ها را مسدود نمی‌کند.

### محدودیت‌های اندازه، دانلود و مدل

- **سقف اندازه**: پیش‌فرض 20 MB برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل پیکربندی است.
- **شکست‌های دانلود**: فایل‌هایی که Slack نمی‌تواند ارائه کند، URLهای منقضی‌شده، فایل‌های غیرقابل‌دسترسی، فایل‌های بیش‌ازحد بزرگ، و پاسخ‌های HTML مربوط به احراز هویت/ورود Slack به‌جای اینکه به‌عنوان قالب‌های پشتیبانی‌نشده گزارش شوند، نادیده گرفته می‌شوند.
- **مدل بینایی**: تحلیل تصویر وقتی مدل پاسخ فعال از بینایی پشتیبانی کند از همان مدل استفاده می‌کند، یا از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel` استفاده می‌کند.

### محدودیت‌های شناخته‌شده

| سناریو                               | رفتار فعلی                                                             | راه‌حل جایگزین                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL فایل Slack منقضی شده                 | فایل نادیده گرفته می‌شود؛ خطایی نمایش داده نمی‌شود                                                 | فایل را دوباره در Slack بارگذاری کنید                                                |
| مدل بینایی پیکربندی نشده است            | پیوست‌های تصویر به‌عنوان ارجاع‌های رسانه ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند | `agents.defaults.imageModel` را پیکربندی کنید یا از یک مدل پاسخ دارای قابلیت بینایی استفاده کنید |
| تصاویر بسیار بزرگ (> 20 MB به‌صورت پیش‌فرض) | طبق سقف اندازه نادیده گرفته می‌شود                                                         | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید                       |
| پیوست‌های فورواردشده/اشتراک‌گذاری‌شده           | متن و رسانهٔ تصویر/فایل میزبانی‌شده در Slack به‌صورت بهترین تلاش پردازش می‌شوند                       | مستقیماً در رشتهٔ OpenClaw دوباره به اشتراک بگذارید                                   |
| پیوست‌های PDF                        | به‌عنوان زمینهٔ فایل/رسانه ذخیره می‌شوند، نه اینکه به‌طور خودکار از مسیر بینایی تصویر عبور کنند  | از `download-file` برای فرادادهٔ فایل یا از ابزار `pdf` برای تحلیل PDF استفاده کنید   |

### مستندات مرتبط

- [خط لولهٔ درک رسانه](/fa/nodes/media-understanding)
- [ابزار PDF](/fa/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — فعال‌سازی بینایی پیوست‌های Slack
- آزمون‌های رگرسیون: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- راستی‌آزمایی زنده: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Slack را به Gateway جفت کنید.
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
    چیدمان پیکربندی و اولویت‌بندی.
  </Card>
  <Card title="فرمان‌های اسلش" icon="terminal" href="/fa/tools/slash-commands">
    فهرست فرمان‌ها و رفتار.
  </Card>
</CardGroup>
