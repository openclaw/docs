---
read_when:
    - راه‌اندازی Slack یا اشکال‌زدایی حالت سوکت، HTTP یا رله در Slack
summary: راه‌اندازی Slack و رفتار زمان اجرا (Socket Mode، نشانی‌های اینترنتی درخواست HTTP و حالت رله)
title: Slack
x-i18n:
    generated_at: "2026-07-16T15:30:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

پشتیبانی Slack پیام‌های مستقیم و کانال‌ها را از طریق یکپارچه‌سازی‌های اپ Slack پوشش می‌دهد. انتقال پیش‌فرض Socket Mode است؛ HTTP Request URLs نیز پشتیبانی می‌شوند. حالت رله برای استقرارهای مدیریت‌شده‌ای است که در آن‌ها یک مسیریاب مورداعتماد مالک ورودی Slack است.

<CardGroup cols={3}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم Slack به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="دستورهای اسلش" icon="terminal" href="/fa/tools/slash-commands">
    رفتار بومی دستورها و فهرست دستورها.
  </Card>
  <Card title="عیب‌یابی کانال" icon="wrench" href="/fa/channels/troubleshooting">
    راهنماهای تشخیص و ترمیم میان‌کانالی.
  </Card>
</CardGroup>

## انتخاب روش انتقال

Socket Mode و HTTP Request URLs برای پیام‌رسانی، دستورهای اسلش، App Home و تعامل‌پذیری از نظر قابلیت‌ها هم‌سطح هستند. انتخاب را بر اساس شکل استقرار انجام دهید، نه قابلیت‌ها.

| ملاحظه                      | Socket Mode (پیش‌فرض)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL عمومی Gateway           | لازم نیست                                                                                                                                         | الزامی است (DNS، TLS، پروکسی معکوس یا تونل)                                                                   |
| شبکه خروجی             | WSS خروجی به `wss-primary.slack.com` باید قابل‌دسترسی باشد                                                                                            | بدون WS خروجی؛ فقط HTTPS ورودی                                                                             |
| توکن‌های لازم                | توکن ربات + App-Level Token با `connections:write`                                                                                                 | توکن ربات + Signing Secret                                                                                     |
| لپ‌تاپ توسعه / پشت فایروال | بدون تغییر کار می‌کند                                                                                                                                          | به تونل عمومی (ngrok، Cloudflare Tunnel، Tailscale Funnel) یا Gateway آزمایشی نیاز دارد                          |
| مقیاس‌پذیری افقی           | یک نشست Socket Mode به‌ازای هر اپ در هر میزبان؛ چند Gateway به اپ‌های Slack جداگانه نیاز دارند                                                                 | کنترل‌کننده POST بدون وضعیت؛ چند نمونه Gateway می‌توانند پشت یک متعادل‌کننده بار از یک اپ مشترک استفاده کنند                     |
| چند حساب در یک Gateway | پشتیبانی می‌شود؛ هر حساب WS خودش را باز می‌کند                                                                                                             | پشتیبانی می‌شود؛ هر حساب به یک `webhookPath` منحصربه‌فرد نیاز دارد (پیش‌فرض `/slack/events`) تا ثبت‌ها با هم تداخل نکنند |
| انتقال دستور اسلش      | از طریق اتصال WS تحویل داده می‌شود؛ `slash_commands[].url` نادیده گرفته می‌شود                                                                                  | Slack به `slash_commands[].url` درخواست POST می‌فرستد؛ این فیلد برای اجرای دستور الزامی است                           |
| امضای درخواست              | استفاده نمی‌شود (احراز هویت با App-Level Token انجام می‌شود)                                                                                                               | Slack هر درخواست را امضا می‌کند؛ OpenClaw آن را با `signingSecret` تأیید می‌کند                                              |
| بازیابی پس از قطع اتصال  | اتصال مجدد خودکار Slack SDK فعال است؛ OpenClaw نیز نشست‌های ناموفق Socket Mode را با پس‌نشینی محدود دوباره راه‌اندازی می‌کند. تنظیم انتقال برای مهلت‌پایان Pong اعمال می‌شود. | اتصال پایداری برای قطع‌شدن وجود ندارد؛ تلاش مجدد Slack برای هر درخواست انجام می‌شود                                           |

<Note>
  **Socket Mode را انتخاب کنید** برای میزبان‌های تک‌Gateway، لپ‌تاپ‌های توسعه و شبکه‌های داخلی که می‌توانند به `*.slack.com` به‌صورت خروجی دسترسی داشته باشند اما نمی‌توانند HTTPS ورودی بپذیرند.

**HTTP Request URLs را انتخاب کنید** هنگام اجرای چند نمونه Gateway پشت یک متعادل‌کننده بار، هنگامی که WSS خروجی مسدود اما HTTPS ورودی مجاز است، یا زمانی که از قبل Webhookهای Slack را در یک پروکسی معکوس خاتمه می‌دهید.
</Note>

<Warning>
  Slack می‌تواند چند اتصال Socket Mode را برای یک اپ نگه دارد و ممکن است هر بار داده را به هرکدام از اتصال‌ها تحویل دهد. بنابراین Gatewayهای جداگانه OpenClaw که یک اپ Slack را به اشتراک می‌گذارند، به پیکربندی مسیریابی و مجوزدهی یکسان نیاز دارند. در غیر این صورت، برای هر Gateway از یک اپ Slack جداگانه، یک ورودی رله واحد، یا HTTP Request URLs پشت یک متعادل‌کننده بار استفاده کنید. به [استفاده از Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections) مراجعه کنید.
</Warning>

### حالت رله

حالت رله ورودی Slack را از Gateway در OpenClaw جدا می‌کند. یک مسیریاب مورداعتماد مالک اتصال واحد Slack Socket Mode است، Gateway مقصد را انتخاب می‌کند و رویدادی نوع‌دار را از طریق یک websocket احراز هویت‌شده ارسال می‌کند. Gateway همچنان برای فراخوانی‌های خروجی Slack Web API از توکن ربات خودش استفاده می‌کند.

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

URL رله باید از `wss://` استفاده کند، مگر اینکه localhost را هدف بگیرد. توکن حامل و جدول مسیر مسیریاب را بخشی از مرز مجوزدهی Slack در نظر بگیرید: رویدادهای مسیریابی‌شده به‌عنوان فعال‌سازی‌های مجاز وارد کنترل‌کننده عادی پیام Slack می‌شوند. یک `slack_identity` ارائه‌شده توسط مسیریاب در فریم `hello` مربوط به websocket می‌تواند نام کاربری و نماد خروجی پیش‌فرض را تنظیم کند؛ هویت صریح ارائه‌شده توسط فراخواننده همچنان اولویت دارد. اتصال رله با همان زمان‌بندی پس‌نشینی محدود Socket Mode دوباره متصل می‌شود و هر زمان قطع شود، هویت ارائه‌شده توسط مسیریاب را پاک می‌کند.

### نصب‌های سراسر سازمان Enterprise Grid

یک حساب Slack می‌تواند پیام‌ها را از همه فضای‌کارهایی دریافت کند که نصب سراسر سازمان
Enterprise Grid پوشش می‌دهد. Socket Mode مستقیم یا HTTP
Request URLs را انتخاب کنید؛ حالت رله برای حساب‌های سازمانی پشتیبانی نمی‌شود. هر دو
مانیفست کمینه‌دسترسی زیر فقط مسیر رویداد V1 مربوط به `message` و `app_mention`،
پاسخ‌های فوری و واکنش‌های وضعیت تحت مالکیت شنونده را فعال می‌کنند.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "رابط Slack برای OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

از یک Enterprise Grid Org Admin یا Org Owner بخواهید اپ را تأیید کند، آن را در
سطح سازمان نصب کند و فضای‌کارهایی را انتخاب کند که نصب پوشش می‌دهد.
پیش از راه‌اندازی OpenClaw تأیید کنید که اپ در همه فضای‌کارهای موردنظر
در دسترس است. برای Socket Mode یک توکن در سطح اپ با `connections:write` ایجاد کنید،
سپس توکن ربات را از نصب سازمان کپی کنید. حسابی را که
از توکن ربات نصب‌شده در سازمان استفاده می‌کند پیکربندی کنید:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URLs

هنگامی از حالت HTTP استفاده کنید که Gateway یک نقطه پایانی عمومی HTTPS دارد و
اتصال Socket Mode باز نمی‌کند. URL نمونه را با URL عمومی
`webhookPath` مربوط به Gateway جایگزین کنید (پیش‌فرض `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "رابط Slack برای OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

از یک Enterprise Grid Org Admin یا Org Owner بخواهید اپ را تأیید کند، آن را در
سطح سازمان نصب کند و فضای‌کارهایی را انتخاب کند که نصب پوشش می‌دهد.
پس از اینکه Slack آدرس Request URL را تأیید کرد، توکن ربات نصب سازمان و
**Basic Information -> App Credentials -> Signing Secret** اپ را کپی کنید. حساب
سازمانی را با همان مسیر Request URL پیکربندی کنید:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

هنگام راه‌اندازی، OpenClaw مقدار `enterpriseOrgInstall` را با `auth.test` در Slack تأیید می‌کند.
توکن نصب‌شده در سازمان بدون این پرچم، یا توکن فضای‌کار همراه این پرچم،
باعث شکست راه‌اندازی می‌شود. Slack مرجع اصلی فضای‌کارهایی باقی می‌ماند که
به نصب مجوز داده‌اند؛ سپس OpenClaw سیاست‌های پیکربندی‌شده کانال، کاربر،
پیام مستقیم و اشاره را بر هر رویداد تحویل‌شده اعمال می‌کند. Enterprise V1 همه
رویدادهای `message` و `app_mention` ایجادشده توسط ربات را پیش از ارسال، مستقل از
`allowBots` رد می‌کند، زیرا نصب‌های سازمانی برای جلوگیری از حلقه
هویت پایدار و واجد فضای‌کار برای ربات فراهم نمی‌کنند.

پشتیبانی سازمانی عمداً به Socket Mode مستقیم یا رویدادهای HTTP
`message` و `app_mention` و پاسخ‌های فوری آن‌ها محدود شده است. حالت رله،
دستورهای اسلش، تعاملات، App Home، شنونده‌های رویداد واکنش، سنجاق‌ها، ابزارهای کنش Slack،
تأییدهای بومی Slack، اتصال‌ها، تحویل صف‌شده یا زمان‌بندی‌شده
و ارسال‌های پیش‌دستانه برای یک حساب سازمانی در دسترس نیستند. واکنش‌های خروجی
تأیید دریافت، تایپ و وضعیت از طریق کلاینت Slack تحت مالکیت
شنونده پشتیبانی می‌شوند و به `reactions:write` نیاز دارند؛ اعلان‌های واکنش
ورودی و ابزارهای کنش واکنش همچنان در دسترس نیستند.

پاسخ‌های فوری از رفتار استاندارد تحویل Slack برای قطعه‌ها،
رسانه، فراداده، هویت جایگزین، بازکردن پیش‌نمایش پیوندها و رسیدها استفاده می‌کنند، اما فقط تا زمانی که
کلاینتِ اعتبارسنجی‌شده و متعلق به شنونده در نوبت فعال رویداد باقی بماند. صف ارسال
درون‌حافظه‌ای و رکوردهای مشارکت در رشته بر اساس فضای کاری آن
رویداد تفکیک می‌شوند؛ خود کلاینت هرگز سریال‌سازی یا ماندگار نمی‌شود.

کلیدهای خط‌مشی کانال و ورودی‌های `dm.groupChannels` باید از شناسه‌های خام و پایدار کانال Slack یا
قالب `channel:<id>` استفاده کنند. OpenClaw هر دو قالب را برای
تطبیق زمان اجرا به شناسه خام کانال نرمال‌سازی می‌کند؛ پیشوندهای `slack:`، `group:` و `mpim:` باعث شکست راه‌اندازی می‌شوند.
ورودی‌های خط‌مشی کاربر باید از شناسه‌های پایدار کاربر Slack استفاده کنند؛ نام‌ها، نامک‌ها، نام‌های نمایشی
و نشانی‌های ایمیل باعث شکست راه‌اندازی می‌شوند. شناسه‌ها باید از پیشوند بزرگ استاندارد
Slack و بدنه آن استفاده کنند (برای مثال، `C0123456789` یا `U0123456789`)؛ نمونه‌های مشابه با حروف کوچک و
کوتاه باعث شکست راه‌اندازی می‌شوند. حساب‌های سازمانی نمی‌توانند
`dangerouslyAllowNameMatching` را فعال کنند. حساب‌های سازمانی می‌توانند مقدار سراسری
`mentionPatterns.mode` را تنظیم کنند، اما `mentionPatterns.allowIn` و
`mentionPatterns.denyIn` باعث شکست راه‌اندازی می‌شوند، زیرا شناسه‌های ساده کانال Slack
به فضای کاری مقید نیستند و ممکن است در چند فضای کاری دوباره استفاده شوند. نصب‌های فضای کاری
رفتار موجود الگوی اشاره محدود به دامنه را حفظ می‌کنند. هر فضای کاری پذیرفته‌شده
هویت مسیریابی، نشست، رونوشت، حذف موارد تکراری، تاریخچه و حافظه نهان جداگانه‌ای
دریافت می‌کند، حتی وقتی شناسه‌های Slack هم‌پوشانی دارند. در جریان `message`، پیام‌های عادی کاربران
و رویدادهای `file_share` نوشته‌شده توسط کاربر پشتیبانی می‌شوند؛ سایر زیرنوع‌های پیام
پیش از مجوزدهی یا رسیدگی به رویدادهای سیستمی رد می‌شوند.

پیام‌های مستقیم سازمانی باید یا غیرفعال باشند (`dm.enabled=false` یا
`dmPolicy="disabled"`) یا به‌طور صریح با `dmPolicy="open"` و
یک `allowFrom` مؤثر برای حساب که شامل مقدار تحت‌اللفظی `"*"` است، باز شوند. فهرست مجاز خالی
یا شناسه‌های خاص کاربر بدون `"*"` باعث شکست راه‌اندازی می‌شوند. جفت‌سازی و
فهرست‌های مجاز پیام مستقیم برای هر کاربر رد می‌شوند، زیرا شناسه‌های کاربر Slack در آن
مخازن مجوزدهی به فضای کاری مقید نیستند. خط‌مشی کانال و فرستنده
همچنان بر پیام‌های کانال اعمال می‌شود.

## نصب

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` افزونه را ثبت و فعال می‌کند. تا زمانی که برنامه Slack و تنظیمات کانال زیر را پیکربندی نکنید، کاری انجام نمی‌دهد. برای قواعد عمومی نصب افزونه، [افزونه‌ها](/fa/tools/plugin) را ببینید.

## راه‌اندازی سریع

مانیفست‌های این بخش نصبی محدود به فضای کاری ایجاد می‌کنند. برای نصب
در سطح سازمان Enterprise Grid، به‌جای آن از
[مانیفست و گردش‌کار اختصاصی در سطح سازمان](#enterprise-grid-org-wide-installs) استفاده کنید.

<Tabs>
  <Tab title="حالت سوکت (پیش‌فرض)">
    <Steps>
      <Step title="ایجاد یک برنامه جدید Slack">
        [api.slack.com/apps](https://api.slack.com/apps/new) را باز کنید ← **Create New App** ← **From a manifest** ← فضای کاری خود را انتخاب کنید ← یکی از مانیفست‌های زیر را جای‌گذاری کنید ← **Next** ← **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "رابط Slack برای OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw رشته‌های دستیار Slack را به عامل‌های OpenClaw متصل می‌کند.",
      "suggested_prompts": [
        { "title": "چه کارهایی می‌توانید انجام دهید؟", "message": "در چه زمینه‌ای می‌توانید به من کمک کنید؟" },
        {
          "title": "این کانال را خلاصه کنید",
          "message": "فعالیت‌های اخیر این کانال را خلاصه کنید."
        },
        { "title": "پیش‌نویس یک پاسخ", "message": "برای تهیه پیش‌نویس یک پاسخ به من کمک کنید." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ارسال پیام به OpenClaw",
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
    "description": "رابط Slack برای OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw رشته‌های دستیار Slack را به عامل‌های OpenClaw متصل می‌کند.",
      "suggested_prompts": [
        { "title": "چه کارهایی می‌توانید انجام دهید؟", "message": "در چه زمینه‌ای می‌توانید به من کمک کنید؟" },
        {
          "title": "این کانال را خلاصه کنید",
          "message": "فعالیت‌های اخیر این کانال را خلاصه کنید."
        },
        { "title": "پیش‌نویس یک پاسخ", "message": "برای تهیه پیش‌نویس یک پاسخ به من کمک کنید." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ارسال پیام به OpenClaw",
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
          **پیشنهادی** با مجموعه کامل قابلیت‌های افزونه Slack مطابقت دارد: App Home، فرمان‌های اسلش، فایل‌ها، واکنش‌ها، سنجاق‌ها، پیام‌های مستقیم گروهی و خواندن ایموجی/گروه کاربری. وقتی خط‌مشی فضای کاری دامنه‌ها را محدود می‌کند، **حداقلی** را انتخاب کنید — این گزینه پیام‌های مستقیم، تاریخچه کانال/گروه، اشاره‌ها و فرمان‌های اسلش را پوشش می‌دهد، اما فایل‌ها، واکنش‌ها، سنجاق‌ها، پیام مستقیم گروهی (`mpim:*`)، `emoji:read` و `usergroups:read` را حذف می‌کند. برای منطق هر دامنه و گزینه‌های افزایشی مانند فرمان‌های اسلش بیشتر، [چک‌لیست مانیفست و دامنه](#manifest-and-scope-checklist) را ببینید.
        </Note>

        پس از آنکه Slack برنامه را ایجاد کرد:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: مقدار `connections:write` را اضافه کنید، ذخیره کنید و App-Level Token را کپی کنید.
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

        متغیرهای محیطی جایگزین (فقط حساب پیش‌فرض):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="راه‌اندازی Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="نشانی‌های URL درخواست HTTP">
    <Steps>
      <Step title="ایجاد یک برنامه جدید Slack">
        [api.slack.com/apps](https://api.slack.com/apps/new) را باز کنید ← **Create New App** ← **From a manifest** ← فضای کاری خود را انتخاب کنید ← یکی از مانیفست‌های زیر را جای‌گذاری کنید ← `https://gateway-host.example.com/slack/events` را با نشانی عمومی Gateway خود جایگزین کنید ← **Next** ← **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "رابط Slack برای OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw رشته‌های دستیار Slack را به عامل‌های OpenClaw متصل می‌کند.",
      "suggested_prompts": [
        { "title": "چه کارهایی می‌توانید انجام دهید؟", "message": "در چه زمینه‌ای می‌توانید به من کمک کنید؟" },
        {
          "title": "این کانال را خلاصه کنید",
          "message": "فعالیت‌های اخیر این کانال را خلاصه کنید."
        },
        { "title": "پیش‌نویس یک پاسخ", "message": "برای تهیه پیش‌نویس یک پاسخ به من کمک کنید." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ارسال پیام به OpenClaw",
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
    "description": "رابط Slack برای OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw رشته‌های دستیار Slack را به عامل‌های OpenClaw متصل می‌کند.",
      "suggested_prompts": [
        { "title": "چه کارهایی می‌توانید انجام دهید؟", "message": "در چه زمینه‌ای می‌توانید به من کمک کنید؟" },
        {
          "title": "خلاصه‌کردن این کانال",
          "message": "فعالیت‌های اخیر این کانال را خلاصه کنید."
        },
        { "title": "نوشتن پیش‌نویس پاسخ", "message": "برای نوشتن پیش‌نویس یک پاسخ به من کمک کنید." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ارسال پیام به OpenClaw",
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
          **توصیه‌شده** با مجموعه کامل قابلیت‌های Plugin مربوط به Slack مطابقت دارد؛ **حداقلی** فایل‌ها، واکنش‌ها، سنجاق‌ها، پیام مستقیم گروهی (`mpim:*`)، `emoji:read` و `usergroups:read` را برای فضاهای کاری محدودکننده حذف می‌کند. برای منطق هر دامنه، به [چک‌لیست مانیفست و دامنه‌ها](#manifest-and-scope-checklist) مراجعه کنید.
        </Note>

        <Info>
          هر سه فیلد URL ‏(`slash_commands[].url`، `event_subscriptions.request_url` و `interactivity.request_url` / `message_menu_options_url`) به یک نقطه پایانی OpenClaw اشاره می‌کنند. طرح‌واره مانیفست Slack ایجاب می‌کند نام آن‌ها جداگانه تعیین شود، اما OpenClaw مسیریابی را بر اساس نوع بار انجام می‌دهد؛ بنابراین یک `webhookPath` (با مقدار پیش‌فرض `/slack/events`) کافی است. فرمان‌های اسلش بدون `slash_commands[].url` در حالت HTTP بدون هیچ واکنشی نادیده گرفته می‌شوند.
        </Info>

        پس از اینکه Slack برنامه را ایجاد کرد:

        - **Basic Information → App Credentials**: برای تأیید درخواست، **Signing Secret** را کپی کنید.
        - **Install App -> Install to Workspace**: ‏Bot User OAuth Token را کپی کنید.

      </Step>

      <Step title="پیکربندی OpenClaw">

        راه‌اندازی توصیه‌شده SecretRef:

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

        به هر حساب یک `webhookPath` متمایز (با مقدار پیش‌فرض `/slack/events`) اختصاص دهید تا ثبت‌ها با یکدیگر تداخل نکنند.
        </Note>

      </Step>

      <Step title="راه‌اندازی Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## تنظیم انتقال در Socket Mode

OpenClaw به‌طور پیش‌فرض مهلت انتظار pong کلاینت SDK مربوط به Slack را برای Socket Mode روی 15 ثانیه تنظیم می‌کند. تنظیمات انتقال را فقط زمانی بازنویسی کنید که به تنظیم ویژه فضای کاری یا میزبان نیاز دارید:

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

این تنظیم را فقط برای فضاهای کاری Socket Mode به‌کار ببرید که مهلت‌های انتظار pong وب‌سوکت یا server-ping مربوط به Slack را ثبت می‌کنند، یا روی میزبان‌هایی اجرا می‌شوند که دچار محرومیت شناخته‌شده حلقه رویداد هستند. `clientPingTimeout` مدت انتظار برای pong پس از ارسال ping کلاینت توسط SDK است؛ `serverPingTimeout` مدت انتظار برای pingهای سرور Slack است. پیام‌ها و رویدادهای برنامه همچنان وضعیت برنامه محسوب می‌شوند، نه سیگنال‌های فعال‌بودن انتقال.

نکته‌ها:

- `socketMode` در حالت HTTP Request URL نادیده گرفته می‌شود.
- تنظیمات پایه `channels.slack.socketMode` برای همه حساب‌های Slack اعمال می‌شوند، مگر اینکه بازنویسی شده باشند. بازنویسی‌های مختص هر حساب از `channels.slack.accounts.<accountId>.socketMode` استفاده می‌کنند؛ از آنجا که این یک بازنویسی شیء است، همه فیلدهای تنظیم سوکت موردنظر برای آن حساب را درج کنید.
- فقط `clientPingTimeout` دارای مقدار پیش‌فرض OpenClaw است (`15000`). ‏`serverPingTimeout` و `pingPongLoggingEnabled` فقط در صورت پیکربندی به SDK مربوط به Slack ارسال می‌شوند.
- تأخیر بازآزمایی راه‌اندازی مجدد Socket Mode از حدود 2 ثانیه آغاز می‌شود و حداکثر به حدود 30 ثانیه می‌رسد. خطاهای قابل‌بازیابی در شروع، انتظار برای شروع و قطع اتصال تا زمان توقف کانال دوباره امتحان می‌شوند. خطاهای دائمی حساب و اعتبارنامه، مانند احراز هویت نامعتبر، توکن‌های لغوشده یا دامنه‌های مفقود، به‌جای بازآزمایی همیشگی بلافاصله شکست می‌خورند.

## چک‌لیست مانیفست و دامنه‌ها

مانیفست پایه برنامه Slack برای Socket Mode و HTTP Request URLs یکسان است. فقط بلوک `settings` (و `url` فرمان اسلش) متفاوت است.

مانیفست پایه (پیش‌فرض Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "رابط Slack برای OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw رشته‌های دستیار Slack را به عامل‌های OpenClaw متصل می‌کند.",
      "suggested_prompts": [
        { "title": "چه کارهایی می‌توانید انجام دهید؟", "message": "در چه زمینه‌ای می‌توانید به من کمک کنید؟" },
        {
          "title": "خلاصه‌کردن این کانال",
          "message": "فعالیت‌های اخیر این کانال را خلاصه کنید."
        },
        { "title": "نوشتن پیش‌نویس پاسخ", "message": "برای نوشتن پیش‌نویس یک پاسخ به من کمک کنید." }
      ]
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ارسال پیام به OpenClaw",
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

برای **حالت HTTP Request URLs**، ‏`settings` را با گونه HTTP جایگزین کنید و `url` را به هر فرمان اسلش بیفزایید. URL عمومی الزامی است:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "ارسال پیام به OpenClaw",
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

### تنظیمات تکمیلی مانیفست

قابلیت‌های متفاوتی را که پیش‌فرض‌های بالا را گسترش می‌دهند، ارائه کنید.

مانیفست پیش‌فرض زبانه **Home** در Slack App Home را فعال می‌کند و مشترک `app_home_opened` می‌شود. وقتی یکی از اعضای فضای کاری زبانه Home را باز می‌کند، OpenClaw یک نمای Home پیش‌فرض و ایمن را همراه با `views.publish` منتشر می‌کند؛ هیچ بار مکالمه یا پیکربندی خصوصی در آن گنجانده نمی‌شود. وقتی حالت تک‌فرمان اسلش فعال باشد، راهنمای فرمان از `channels.slack.slashCommand.name` استفاده می‌کند؛ نصب‌هایی که از فرمان‌های بومی استفاده می‌کنند یا فاقد فرمان اسلش هستند، این راهنما را حذف می‌کنند. زبانه **Messages** برای پیام‌های مستقیم Slack فعال باقی می‌ماند. مانیفست همچنین رشته‌های دستیار Slack را با `features.assistant_view`، ‏`assistant:write`، ‏`assistant_thread_started` و `assistant_thread_context_changed` فعال می‌کند؛ رشته‌های دستیار به نشست‌های رشته‌ای OpenClaw مخصوص خود هدایت می‌شوند و زمینه رشته ارائه‌شده توسط Slack را برای عامل در دسترس نگه می‌دارند.

<AccordionGroup>
  <Accordion title="فرمان‌های اسلش بومی اختیاری">

    چند [فرمان اسلش بومی](#commands-and-slash-behavior) را می‌توان با ملاحظاتی به‌جای یک فرمان پیکربندی‌شده استفاده کرد:

    - به‌جای `/status` از `/agentstatus` استفاده کنید، زیرا فرمان `/status` رزرو شده است.
    - در هر لحظه نمی‌توان بیش از 25 فرمان اسلش را در یک برنامه Slack ثبت کرد (محدودیت پلتفرم Slack).

    بخش `features.slash_commands` موجود خود را با زیرمجموعه‌ای از [فرمان‌های موجود](/fa/tools/slash-commands#command-list) جایگزین کنید:

    <Tabs>
      <Tab title="Socket Mode (پیش‌فرض)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "شروع یک نشست جدید",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "بازنشانی نشست فعلی"
    },
    {
      "command": "/compact",
      "description": "فشرده‌سازی زمینه نشست",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "توقف اجرای فعلی"
    },
    {
      "command": "/session",
      "description": "مدیریت انقضای اتصال رشته گفتگو",
      "usage_hint": "idle <duration|off> یا max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "تنظیم سطح تفکر",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "تغییر وضعیت خروجی مشروح",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "نمایش یا تنظیم حالت سریع",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "تغییر وضعیت نمایش استدلال",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "تغییر وضعیت حالت ارتقایافته",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "نمایش یا تنظیم پیش‌فرض‌های اجرا",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "تأیید یا رد درخواست‌های تأیید در انتظار",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "نمایش یا تنظیم مدل",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "فهرست ارائه‌دهندگان/مدل‌ها",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "نمایش خلاصه کوتاه راهنما"
    },
    {
      "command": "/commands",
      "description": "نمایش فهرست فرمان‌های تولیدشده"
    },
    {
      "command": "/tools",
      "description": "نمایش مواردی که عامل فعلی هم‌اکنون می‌تواند استفاده کند",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "نمایش وضعیت زمان اجرا، شامل میزان استفاده/سهمیه ارائه‌دهنده در صورت موجود بودن"
    },
    {
      "command": "/tasks",
      "description": "فهرست وظایف پس‌زمینه فعال/اخیر برای نشست فعلی"
    },
    {
      "command": "/context",
      "description": "توضیح نحوه ساخت زمینه",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "نمایش هویت فرستنده شما"
    },
    {
      "command": "/skill",
      "description": "اجرای یک مهارت بر اساس نام",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "پرسیدن یک سؤال جانبی بدون تغییر زمینه نشست",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "پرسیدن یک سؤال جانبی بدون تغییر زمینه نشست",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "کنترل پانویس میزان استفاده یا نمایش خلاصه هزینه",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="نشانی‌های URL درخواست HTTP">
        از همان فهرست `slash_commands` در حالت Socket در بالا استفاده کنید و `"url": "https://gateway-host.example.com/slack/events"` را به هر ورودی بیفزایید. نمونه:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "شروع یک نشست جدید",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "نمایش خلاصه کوتاه راهنما",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        آن مقدار `url` را برای همه فرمان‌های فهرست تکرار کنید.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="دامنه‌های اختیاری نویسندگی (عملیات نوشتن)">
    اگر می‌خواهید پیام‌های خروجی به‌جای هویت پیش‌فرض برنامه Slack از هویت عامل فعال (نام کاربری و نماد سفارشی) استفاده کنند، دامنه ربات `chat:write.customize` را اضافه کنید.

    اگر از نماد ایموجی استفاده می‌کنید، Slack انتظار دارد از نحو `:emoji_name:` استفاده شود.

  </Accordion>
  <Accordion title="دامنه‌های اختیاری توکن کاربر (عملیات خواندن)">
    اگر `channels.slack.userToken` را پیکربندی کنید، دامنه‌های معمول خواندن عبارت‌اند از:

    - `channels:history`، `groups:history`، `im:history`، `mpim:history`
    - `channels:read`، `groups:read`، `im:read`، `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (اگر به خواندن جست‌وجوی Slack وابسته هستید)

  </Accordion>
</AccordionGroup>

## مدل توکن

- `botToken` + `appToken` برای حالت Socket الزامی هستند.
- حالت HTTP به `botToken` + `signingSecret` نیاز دارد.
- حالت Relay به `botToken` به‌همراه `relay.url`، `relay.authToken` و `relay.gatewayId` نیاز دارد؛ این حالت از توکن برنامه یا راز امضا استفاده نمی‌کند.
- `botToken`، `appToken`، `signingSecret`، `relay.authToken` و `userToken` رشته‌های متن ساده
  یا اشیای SecretRef را می‌پذیرند.
- توکن‌های پیکربندی بر مقدار جایگزین محیطی اولویت دارند.
- مقدار جایگزین محیطی `SLACK_BOT_TOKEN`، `SLACK_APP_TOKEN` و `SLACK_USER_TOKEN` هرکدام فقط برای حساب پیش‌فرض اعمال می‌شوند.
- رفتار پیش‌فرض `userToken` فقط‌خواندنی است (`userTokenReadOnly: true`).

رفتار نمای لحظه‌ای وضعیت:

- بازرسی حساب Slack برای هر اعتبارنامه، فیلدهای `*Source` و `*Status`
  را ردیابی می‌کند (`botToken`، `appToken`، `signingSecret`، `userToken`).
- وضعیت `available`، `configured_unavailable` یا `missing` است.
- `configured_unavailable` یعنی حساب از طریق SecretRef
  یا منبع راز غیرخطی دیگری پیکربندی شده است، اما مسیر فرمان/زمان اجرای فعلی
  نتوانسته مقدار واقعی را برطرف کند.
- در حالت HTTP، `signingSecretStatus` گنجانده می‌شود؛ در حالت Socket،
  جفت الزامی `botTokenStatus` + `appTokenStatus` است.

<Tip>
برای عملیات و خواندن فهرست راهنما، در صورت پیکربندی می‌توان توکن کاربر را ترجیح داد. برای نوشتن، توکن ربات همچنان ترجیح داده می‌شود؛ نوشتن با توکن کاربر فقط زمانی مجاز است که `userTokenReadOnly: false` و توکن ربات در دسترس نباشد.
</Tip>

## عملیات و محدودکننده‌ها

عملیات Slack با `channels.slack.actions.*` کنترل می‌شوند.

گروه‌های عملیاتی موجود در ابزارهای فعلی Slack:

| گروه       | پیش‌فرض |
| ---------- | ------- |
| messages   | فعال |
| reactions  | فعال |
| pins       | فعال |
| memberInfo | فعال |
| emojiList  | فعال |

عملیات فعلی پیام Slack شامل `send`، `upload-file`، `download-file`، `read`، `edit`، `delete`، `pin`، `unpin`، `list-pins`، `member-info` و `emoji-list` است. `download-file` شناسه‌های فایل Slack نمایش‌داده‌شده در جای‌نگهدارهای فایل ورودی را می‌پذیرد و برای تصاویر، پیش‌نمایش تصویر و برای انواع دیگر فایل، فراداده فایل محلی را برمی‌گرداند.

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.slack.dmPolicy` دسترسی پیام مستقیم را کنترل می‌کند. `channels.slack.allowFrom` فهرست مجاز معیار برای پیام مستقیم است.

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (لازم است `channels.slack.allowFrom` شامل `"*"` باشد)
    - `disabled`

    پرچم‌های پیام مستقیم:

    - `dm.enabled` (مقدار پیش‌فرض true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (قدیمی)
    - `dm.groupEnabled` (مقدار پیش‌فرض پیام‌های مستقیم گروهی false است)
    - `dm.groupChannels` (فهرست مجاز اختیاری MPIM)

    اولویت چندحسابی:

    - `channels.slack.accounts.default.allowFrom` فقط برای حساب `default` اعمال می‌شود.
    - حساب‌های نام‌گذاری‌شده، وقتی `allowFrom` خودشان تنظیم نشده باشد، `channels.slack.allowFrom` را به ارث می‌برند.
    - حساب‌های نام‌گذاری‌شده `channels.slack.accounts.default.allowFrom` را به ارث نمی‌برند.

    `channels.slack.dm.policy` و `channels.slack.dm.allowFrom` قدیمی همچنان برای سازگاری خوانده می‌شوند. `openclaw doctor --fix` زمانی که بتواند بدون تغییر دسترسی این کار را انجام دهد، آن‌ها را به `dmPolicy` و `allowFrom` مهاجرت می‌دهد.

    جفت‌سازی در پیام‌های مستقیم از `openclaw pairing approve slack <code>` استفاده می‌کند.

  </Tab>

  <Tab title="سیاست کانال">
    `channels.slack.groupPolicy` نحوه مدیریت کانال را کنترل می‌کند:

    - `open`
    - `allowlist`
    - `disabled`

    فهرست مجاز کانال زیر `channels.slack.channels` قرار دارد و **باید از شناسه‌های پایدار کانال Slack** (برای مثال `C12345678`) به‌عنوان کلیدهای پیکربندی استفاده کند.

    نکته زمان اجرا: اگر `channels.slack` کاملاً وجود نداشته باشد (راه‌اندازی فقط با محیط)، زمان اجرا به `groupPolicy="allowlist"` برمی‌گردد و هشداری ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    تفکیک نام/شناسه:

    - ورودی‌های فهرست مجاز کانال و فهرست مجاز پیام مستقیم، هرگاه دسترسی توکن اجازه دهد، هنگام راه‌اندازی تفکیک می‌شوند
    - ورودی‌های تفکیک‌نشده نام کانال همان‌طور که پیکربندی شده‌اند حفظ می‌شوند، اما به‌طور پیش‌فرض برای مسیریابی نادیده گرفته می‌شوند
    - مجوزدهی ورودی و مسیریابی کانال به‌طور پیش‌فرض ابتدا بر اساس شناسه انجام می‌شوند؛ تطبیق مستقیم نام کاربری/نامک به `channels.slack.dangerouslyAllowNameMatching: true` نیاز دارد

    <Warning>
    کلیدهای مبتنی بر نام (`#channel-name` یا `channel-name`) تحت `groupPolicy: "allowlist"` تطبیق **نمی‌یابند**. جست‌وجوی کانال به‌طور پیش‌فرض ابتدا بر اساس شناسه انجام می‌شود، بنابراین یک کلید مبتنی بر نام هرگز با موفقیت مسیریابی نمی‌شود و همه پیام‌های آن کانال بی‌سروصدا مسدود خواهند شد. این رفتار با `groupPolicy: "open"` متفاوت است؛ در آنجا کلید کانال برای مسیریابی الزامی نیست و به نظر می‌رسد کلید مبتنی بر نام کار می‌کند.

    همیشه از شناسه کانال Slack به‌عنوان کلید استفاده کنید. برای یافتن آن: روی کانال در Slack راست‌کلیک کنید ← **Copy link** — شناسه (`C...`) در انتهای URL ظاهر می‌شود.

    صحیح:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    نادرست (تحت `groupPolicy: "allowlist"` بی‌سروصدا مسدود می‌شود):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="اشاره‌ها و کاربران کانال">
    پیام‌های کانال به‌طور پیش‌فرض به اشاره وابسته‌اند.

    منابع اشاره:

    - اشاره صریح به برنامه (`<@botId>`)
    - اشاره به گروه کاربری Slack (`<!subteam^S...>`) هنگامی که کاربر ربات عضو آن گروه کاربری باشد؛ به `usergroups:read` نیاز دارد
    - الگوهای عبارت منظم اشاره (`agents.list[].groupChat.mentionPatterns`، مقدار جایگزین `messages.groupChat.mentionPatterns`)
    - رفتار ضمنی رشته پاسخ به ربات (وقتی `thread.requireExplicitMention` برابر با `true` باشد، غیرفعال است)

    کنترل‌های هر کانال (`channels.slack.channels.<id>`؛ نام‌ها فقط از طریق تفکیک هنگام راه‌اندازی یا `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`؛ حالت پاسخ حساب/نوع گفتگو را برای این کانال لغو می‌کند)
    - `users` (فهرست مجاز)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`، `toolsBySender`
    - قالب کلید `toolsBySender`:‏ `channel:`، `id:`، `e164:`، `username:`، `name:` یا نویسه عام `"*"`
      (کلیدهای قدیمی بدون پیشوند همچنان فقط به `id:` نگاشت می‌شوند)

    `ignoreOtherMentions` (پیش‌فرض `false`) پیام‌های کانالی را که به کاربر یا گروه کاربری دیگری اشاره می‌کنند، اما به این ربات اشاره ندارند، حذف می‌کند. پیام‌های مستقیم و پیام‌های مستقیم گروهی (MPIMها) تحت تأثیر قرار نمی‌گیرند. این فیلتر به شناسه کاربری رباتِ حل‌شده از `auth.test` نیاز دارد؛ اگر آن هویت در دسترس نباشد (برای مثال، هویتی که فقط توکن کاربر دارد)، دروازه به‌صورت باز شکست می‌خورد و پیام‌ها بدون تغییر عبور می‌کنند.

    `allowBots` برای کانال‌ها و کانال‌های خصوصی محافظه‌کارانه عمل می‌کند: پیام‌های اتاق که توسط ربات ایجاد شده‌اند فقط زمانی پذیرفته می‌شوند که ربات فرستنده صراحتاً در فهرست مجاز `users` آن اتاق درج شده باشد، یا دست‌کم یک شناسه صریح مالک Slack از `channels.slack.allowFrom` در حال حاضر عضو اتاق باشد. نویسه‌های عام و ورودی‌های مالک مبتنی بر نام نمایشی، شرط حضور مالک را برآورده نمی‌کنند. حضور مالک از `conversations.members` در Slack استفاده می‌کند؛ مطمئن شوید برنامه دامنه دسترسی خواندن متناسب با نوع اتاق را دارد (`channels:read` برای کانال‌های عمومی، `groups:read` برای کانال‌های خصوصی). اگر جست‌وجوی عضو ناموفق باشد، OpenClaw پیام اتاقِ ایجادشده توسط ربات را حذف می‌کند.

    پیام‌های پذیرفته‌شده Slack که توسط ربات ایجاد شده‌اند، از [محافظت مشترک در برابر حلقه ربات](/fa/channels/bot-loop-protection) استفاده می‌کنند. `channels.defaults.botLoopProtection` را برای بودجه پیش‌فرض پیکربندی کنید، سپس هنگامی که فضای کاری یا کانالی به محدودیت متفاوتی نیاز دارد، آن را با `channels.slack.botLoopProtection` یا `channels.slack.channels.<id>.botLoopProtection` بازنویسی کنید.

  </Tab>
</Tabs>

## رشته‌ها، نشست‌ها و برچسب‌های پاسخ

- پیام‌های مستقیم به‌صورت `direct` مسیریابی می‌شوند؛ کانال‌ها به‌صورت `channel`؛ و MPIMها به‌صورت `group`.
- اتصال‌های مسیر Slack، شناسه‌های خام همتا و نیز قالب‌های مقصد Slack مانند `channel:C12345678`، `user:U12345678` و `<@U12345678>` را می‌پذیرند.
- با `session.dmScope=main` پیش‌فرض، پیام‌های مستقیم Slack در نشست اصلی عامل ادغام می‌شوند.
- نشست‌های کانال: `agent:<agentId>:slack:channel:<channelId>`.
- پیام‌های عادی سطح بالای کانال در نشست مختص هر کانال باقی می‌مانند، حتی وقتی `replyToMode` مقداری غیر از `off` دارد.
- پاسخ‌های رشته‌ای Slack از `thread_ts` والد Slack برای پسوندهای نشست (`:thread:<threadTs>`) استفاده می‌کنند، حتی وقتی رشته‌بندی پاسخ خروجی با `replyToMode="off"` غیرفعال شده باشد.
- هنگامی که انتظار می‌رود یک ریشه واجد شرایط و سطح بالای کانال، رشته‌ای قابل‌مشاهده در Slack آغاز کند، OpenClaw آن ریشه را در `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` مقداردهی اولیه می‌کند تا ریشه و پاسخ‌های بعدی رشته، یک نشست OpenClaw مشترک داشته باشند. این رفتار برای رویدادهای `app_mention`، تطبیق‌های صریح اشاره به ربات یا الگوی اشاره پیکربندی‌شده، و کانال‌های `requireMention: false` با `replyToMode` غیر از `off` اعمال می‌شود.
- مقدار پیش‌فرض `channels.slack.thread.historyScope` برابر `thread` است؛ مقدار پیش‌فرض `thread.inheritParent` برابر `false` است.
- `channels.slack.thread.initialHistoryLimit` تعیین می‌کند هنگام آغاز یک نشست رشته‌ای جدید، چه تعداد از پیام‌های موجود رشته واکشی شوند (پیش‌فرض `20`؛ برای غیرفعال‌کردن، `0` را تنظیم کنید).
- `channels.slack.thread.requireExplicitMention` (پیش‌فرض `false`): وقتی `true` باشد، اشاره‌های ضمنی رشته را سرکوب می‌کند تا ربات فقط به اشاره‌های صریح `@bot` درون رشته‌ها پاسخ دهد، حتی اگر ربات قبلاً در رشته مشارکت کرده باشد. بدون این تنظیم، پاسخ‌های یک رشته که ربات در آن مشارکت داشته است، از دروازه‌گذاری `requireMention` عبور می‌کنند.

کنترل‌های رشته‌بندی پاسخ:

- `channels.slack.channels.<id>.replyToMode`: بازنویسی مختص هر کانال برای پیام‌های کانال/کانال خصوصی Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (پیش‌فرض `off`)
- `channels.slack.replyToModeByChatType`: به‌ازای هر `direct|group|channel`
- پس‌گرد قدیمی برای گفت‌وگوهای مستقیم: `channels.slack.dm.replyToMode`

برچسب‌های دستی پاسخ پشتیبانی می‌شوند:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

برای پاسخ‌های صریح رشته‌ای Slack از ابزار `message`، مقدار `replyBroadcast: true` را همراه با `action: "send"` و `threadId` یا `replyTo` تنظیم کنید تا از Slack خواسته شود پاسخ رشته را در کانال والد نیز پخش کند. این مورد به پرچم `reply_broadcast` در `chat.postMessage` مربوط به Slack نگاشت می‌شود و فقط برای ارسال‌های متنی یا Block Kit پشتیبانی می‌شود، نه بارگذاری رسانه.

هنگامی که فراخوانی ابزار `message` درون یک رشته Slack اجرا می‌شود و همان کانال را هدف می‌گیرد، OpenClaw معمولاً رشته فعلی Slack را مطابق `replyToMode` مؤثرِ حساب، نوع گفت‌وگو یا مختص هر کانال به ارث می‌برد. پاسخ‌های خودکار و فراخوانی‌های `send` یا `upload-file` در همان کانال، از همان بازنویسی مختص هر کانال استفاده می‌کنند. برای اجبار به ایجاد پیام جدید در کانال والد، `topLevel: true` را روی `action: "send"` یا `action: "upload-file"` تنظیم کنید. `threadId: null` نیز به‌عنوان همان انصراف سطح بالا پذیرفته می‌شود.

<Note>
`replyToMode="off"` رشته‌بندی پاسخ خروجی Slack، از جمله برچسب‌های صریح `[[reply_to_*]]` را غیرفعال می‌کند. این تنظیم نشست‌های رشته‌ای ورودی Slack را مسطح نمی‌کند: پیام‌هایی که از قبل درون یک رشته Slack ارسال شده‌اند، همچنان به نشست `:thread:<threadTs>` مسیریابی می‌شوند. این رفتار با Telegram متفاوت است؛ در Telegram برچسب‌های صریح همچنان در حالت `"off"` رعایت می‌شوند. رشته‌های Slack پیام‌ها را از کانال پنهان می‌کنند، درحالی‌که پاسخ‌های Telegram به‌صورت درون‌خطی قابل‌مشاهده باقی می‌مانند.
</Note>

## واکنش‌های تأیید

`ackReaction` هنگامی که OpenClaw در حال پردازش یک پیام ورودی است، یک ایموجی تأیید ارسال می‌کند. `ackReactionScope` تعیین می‌کند آن ایموجی عملاً _چه زمانی_ ارسال شود.

به‌طور پیش‌فرض، واکنش تأیید ثابت باقی می‌ماند، درحالی‌که وضعیت بومی رشته دستیار Slack با پیام‌های بارگذاری چرخشی، پیشرفت را نمایش می‌دهد. برای فعال‌کردن چرخه واکنش صف/تفکر/ابزار/انجام‌شده/خطا، `messages.statusReactions.enabled: true` را تنظیم کنید.

### ایموجی (`ackReaction`)

ترتیب تفکیک:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- پس‌گرد ایموجی هویت عامل (`agents.list[].identity.emoji`، در غیر این صورت `"eyes"` / 👀)

نکته‌ها:

- Slack انتظار کد کوتاه دارد (برای مثال `"eyes"`).
- برای غیرفعال‌کردن واکنش برای حساب Slack یا به‌صورت سراسری، از `""` استفاده کنید.

### دامنه (`messages.ackReactionScope`)

ارائه‌دهنده Slack دامنه را از `messages.ackReactionScope` می‌خواند (پیش‌فرض `"group-mentions"`). در حال حاضر بازنویسی در سطح حساب Slack یا کانال Slack وجود ندارد؛ مقدار برای Gateway سراسری است.

مقادیر:

- `"all"`: در پیام‌های مستقیم و گروه‌ها، از جمله رویدادهای محیطی اتاق، واکنش نشان دهید.
- `"direct"`: فقط در پیام‌های مستقیم واکنش نشان دهید.
- `"group-all"`: به همه پیام‌های گروهی به‌جز رویدادهای محیطی اتاق واکنش نشان دهید (بدون پیام مستقیم).
- `"group-mentions"` (پیش‌فرض): در گروه‌ها واکنش نشان دهید، اما فقط وقتی به ربات اشاره شده باشد (یا در موارد قابل‌اشاره گروهی که شرکت در آن را فعال کرده‌اند). **پیام‌های مستقیم مستثنا هستند.**
- `"off"` / `"none"`: هرگز واکنش نشان ندهید.

<Note>
دامنه پیش‌فرض (`"group-mentions"`) واکنش‌های تأیید را در پیام‌های مستقیم یا رویدادهای محیطی اتاق فعال نمی‌کند. برای مشاهده `ackReaction` پیکربندی‌شده (برای مثال `"eyes"`) روی پیام‌های مستقیم ورودی Slack و رویدادهای بی‌صدای اتاق، `messages.ackReactionScope` را روی `"all"` تنظیم کنید. `messages.ackReactionScope` هنگام راه‌اندازی ارائه‌دهنده Slack خوانده می‌شود، بنابراین برای اعمال تغییر، راه‌اندازی مجدد Gateway لازم است.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // واکنش در پیام‌های مستقیم و گروه‌ها
  },
}
```

## پخش جریانی متن

`channels.slack.streaming` رفتار پیش‌نمایش زنده را کنترل می‌کند:

- `off`: پخش جریانی پیش‌نمایش زنده را غیرفعال کنید.
- `partial` (پیش‌فرض): متن پیش‌نمایش را با آخرین خروجی جزئی جایگزین کنید.
- `block`: به‌روزرسانی‌های تکه‌ای پیش‌نمایش را اضافه کنید.
- `progress`: هنگام تولید، متن وضعیت پیشرفت را نمایش دهید، سپس متن نهایی را ارسال کنید.
- `streaming.preview.toolProgress`: هنگامی که پیش‌نمایش پیش‌نویس فعال است، به‌روزرسانی‌های ابزار/پیشرفت را به همان پیام پیش‌نمایش ویرایش‌شده هدایت کنید (پیش‌فرض: `true`). برای نگه‌داشتن پیام‌های جداگانه ابزار/پیشرفت، `false` را تنظیم کنید.
- `streaming.preview.commandText` / `streaming.progress.commandText`: برای نگه‌داشتن خطوط فشرده پیشرفت ابزار و درعین‌حال پنهان‌کردن متن خام فرمان/اجرا، روی `status` تنظیم کنید (پیش‌فرض: `raw`).

پنهان‌کردن متن خام فرمان/اجرا با حفظ خطوط فشرده پیشرفت:

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

`channels.slack.streaming.nativeTransport` پخش جریانی بومی متن Slack را هنگامی کنترل می‌کند که `channels.slack.streaming.mode` برابر `partial` باشد (پیش‌فرض: `true`).

کارت‌های وظیفه پیشرفت بومی Slack برای حالت پیشرفت اختیاری هستند. `channels.slack.streaming.progress.nativeTaskCards` را با `channels.slack.streaming.mode="progress"` روی `true` تنظیم کنید تا هنگام اجرای کار، یک کارت برنامه/وظیفه بومی Slack ارسال شود و سپس همان کارت وظیفه پس از تکمیل به‌روزرسانی شود. بدون این پرچم، حالت پیشرفت رفتار قابل‌انتقال پیش‌نمایش پیش‌نویس را حفظ می‌کند.

- برای نمایش پخش جریانی بومی متن و وضعیت رشته دستیار Slack، باید یک رشته پاسخ در دسترس باشد. انتخاب رشته همچنان از `replyToMode` پیروی می‌کند.
- ریشه‌های کانال، گفت‌وگوی گروهی و پیام مستقیم سطح بالا، هنگام در دسترس نبودن پخش جریانی بومی یا نبود رشته پاسخ، همچنان می‌توانند از پیش‌نمایش پیش‌نویس عادی استفاده کنند.
- پیام‌های مستقیم سطح بالای Slack به‌طور پیش‌فرض خارج از رشته باقی می‌مانند، بنابراین پیش‌نمایش پخش جریانی/وضعیت بومیِ سبک رشته Slack را نمایش نمی‌دهند؛ OpenClaw در عوض یک پیش‌نمایش پیش‌نویس را در پیام مستقیم ارسال و ویرایش می‌کند.
- رسانه و محموله‌های غیرمتنی به تحویل عادی بازمی‌گردند.
- خروجی‌های نهایی رسانه/خطا، ویرایش‌های در انتظار پیش‌نمایش را لغو می‌کنند؛ خروجی‌های نهایی متن/بلوکِ واجد شرایط فقط وقتی تخلیه می‌شوند که بتوانند پیش‌نمایش را درجا ویرایش کنند.
- اگر پخش جریانی در میانه پاسخ ناموفق شود، OpenClaw برای محموله‌های باقی‌مانده به تحویل عادی بازمی‌گردد.

استفاده از پیش‌نمایش پیش‌نویس به‌جای پخش جریانی بومی متن Slack:

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

فعال‌کردن کارت‌های وظیفه پیشرفت بومی Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) نام مستعار قدیمی `channels.slack.streaming.mode` است.
- `channels.slack.streaming` بولی، نام مستعار قدیمی `channels.slack.streaming.mode` و `channels.slack.streaming.nativeTransport` است.
- `channels.slack.chunkMode` و `channels.slack.nativeStreaming` سطح بالا، نام‌های مستعار قدیمی `channels.slack.streaming.chunkMode` و `channels.slack.streaming.nativeTransport` هستند.
- نام‌های مستعار قدیمی در زمان اجرا خوانده نمی‌شوند؛ برای بازنویسی پیکربندی ذخیره‌شده پخش جریانی Slack به کلیدهای معیار، `openclaw doctor --fix` را اجرا کنید.

## پس‌گرد واکنش تایپ

`typingReaction` هنگامی که OpenClaw در حال پردازش پاسخ است، یک واکنش موقت به پیام ورودی Slack اضافه می‌کند و پس از پایان اجرا آن را حذف می‌کند. این ویژگی بیشترین کاربرد را خارج از پاسخ‌های رشته‌ای دارد؛ پاسخ‌های رشته‌ای از نشانگر وضعیت پیش‌فرض «در حال تایپ...» استفاده می‌کنند.

ترتیب تفکیک:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

نکته‌ها:

- Slack انتظار کد کوتاه دارد (برای مثال `"hourglass_flowing_sand"`).
- واکنش بر مبنای بیشترین تلاش انجام می‌شود و پس از تکمیل مسیر پاسخ یا شکست، پاک‌سازی به‌صورت خودکار انجام می‌گیرد.

## ورودی صوتی

برای صحبت با OpenClaw در Slack در حال حاضر، یک کلیپ صوتی Slack به برنامه OpenClaw ارسال کنید. میکروفون دیکته Slackbot قابلیتی جداگانه و متعلق به Slack است، نه API برنامه.

- **[دیکتهٔ صوتی Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** در گفت‌وگوی خصوصی کاربر با Slackbot قرار دارد. Slack ضبط را به یک پرامپت Slackbot تبدیل می‌کند، اما از طریق Events API هیچ فایل صوتی، رویداد دیکته، پرامپت یا نشانگر منبع ورودی‌ای برای برنامه‌های شخص ثالث Slack منتشر نمی‌کند. Plugin مربوط به Slack در OpenClaw نمی‌تواند آن را فعال یا دریافت کند.
- **[کلیپ‌های صوتی Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** فایل‌های ذخیره‌شده در Slack هستند که می‌توان آن‌ها را در پیام خصوصی، کانال یا رشتهٔ OpenClaw ارسال کرد. OpenClaw کلیپ قابل‌دسترسی را با توکن ربات بارگیری می‌کند، فرادادهٔ MIME کلیپ Slack را نرمال‌سازی می‌کند و آن را از [خط لولهٔ مشترک رونویسی صوتی](/fa/nodes/audio) عبور می‌دهد. مانیفست پیشنهادی برنامه شامل محدودهٔ دسترسی الزامی `files:read` است.

کلیپ‌های صوتی و دیکتهٔ Slackbot مفاهیم حریم خصوصی متفاوتی دارند: کلیپ‌ها از سیاست نگهداری فایل Slack پیروی می‌کنند و OpenClaw آن‌ها را برای رونویسی بارگیری می‌کند، درحالی‌که Slack می‌گوید صدای دیکته ذخیره نمی‌شود.

در کانالی با `requireMention: true`، یک کلیپ صوتی بدون زیرنویس می‌تواند با بیان یک الگوی اشارهٔ پیکربندی‌شده (`agents.list[].groupChat.mentionPatterns`، با بازگشت به `messages.groupChat.mentionPatterns`) شرط دروازه را برآورده کند. OpenClaw پیش از بارگیری یا رونویسی کلیپ، فرستنده را مجاز می‌کند و سپس فقط در صورتی آن را می‌پذیرد که رونویسی مطابقت داشته باشد. رونویسی آزمایشی ناموفق یا نامطابق همراه با کلیپ بارگیری‌شده دور انداخته می‌شود و در تاریخچهٔ کانال نگهداری نمی‌شود. هویت بومی `@bot` در Slack را نمی‌توان از روی گفتار استنباط کرد؛ بنابراین یک الگوی نام گفتاری پیکربندی کنید یا یک اشارهٔ تایپ‌شده بگنجانید. اگر بازتاب رونویسی فعال باشد، بازتاب فقط پس از پذیرش ارسال می‌شود.

## رسانه، قطعه‌بندی و تحویل

<AccordionGroup>
  <Accordion title="پیوست‌های ورودی">
    پیوست‌های فایل Slack از نشانی‌های خصوصی میزبانی‌شده در Slack بارگیری می‌شوند (جریان درخواست احراز هویت‌شده با توکن) و در صورت موفقیت واکشی و مجاز بودن محدودیت‌های اندازه، در مخزن رسانه نوشته می‌شوند. جای‌نگهدارهای فایل شامل `fileId` مربوط به Slack هستند تا عامل‌ها بتوانند فایل اصلی را با `download-file` واکشی کنند.

    بارگیری‌ها از مهلت‌های بیکاری و کلِ محدودشده استفاده می‌کنند. اگر بازیابی فایل Slack متوقف شود یا شکست بخورد، OpenClaw پردازش پیام را ادامه می‌دهد و به جای‌نگهدار فایل بازمی‌گردد.

    سقف اندازهٔ ورودی زمان اجرا به‌طور پیش‌فرض `20MB` است، مگر اینکه با `channels.slack.mediaMaxMb` بازنویسی شود.

  </Accordion>

  <Accordion title="متن و فایل‌های خروجی">
    - قطعه‌های متن از `channels.slack.textChunkLimit` استفاده می‌کنند (پیش‌فرض `8000`، با سقف محدودیت طول پیام خود Slack)
    - `channels.slack.streaming.chunkMode="newline"` تقسیم‌بندی مبتنی بر پاراگراف را فعال می‌کند
    - ارسال فایل‌ها از APIهای بارگذاری Slack استفاده می‌کند و می‌تواند شامل پاسخ‌های رشته‌ای (`thread_ts`) باشد
    - زیرنویس‌های طولانی فایل، نخستین قطعهٔ متن ایمن برای Slack را به‌عنوان نظر بارگذاری استفاده می‌کنند و قطعه‌های باقی‌مانده را به‌شکل پیام‌های پیگیری می‌فرستند
    - سقف رسانهٔ خروجی، در صورت پیکربندی از `channels.slack.mediaMaxMb` پیروی می‌کند؛ در غیر این صورت، ارسال‌های کانال از پیش‌فرض‌های نوع MIME در خط لولهٔ رسانه استفاده می‌کنند

  </Accordion>

  <Accordion title="مقصدهای تحویل">
    مقصدهای صریح ترجیحی:

    - `user:<id>` برای پیام‌های خصوصی
    - `channel:<id>` برای کانال‌ها

    پیام‌های خصوصی Slack که فقط شامل متن/بلوک هستند می‌توانند مستقیماً به شناسه‌های کاربر ارسال شوند؛ بارگذاری فایل و ارسال رشته‌ای ابتدا پیام خصوصی را از طریق APIهای گفت‌وگوی Slack باز می‌کنند، زیرا این مسیرها به یک شناسهٔ مشخص گفت‌وگو نیاز دارند.

  </Accordion>
</AccordionGroup>

## فرمان‌ها و رفتار اسلش

فرمان‌های اسلش در Slack یا به‌صورت یک فرمان پیکربندی‌شده یا چند فرمان بومی ظاهر می‌شوند. برای تغییر پیش‌فرض‌های فرمان، `channels.slack.slashCommand` را پیکربندی کنید:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

فرمان‌های بومی به [تنظیمات تکمیلی مانیفست](#additional-manifest-settings) در برنامهٔ Slack نیاز دارند و در عوض با `channels.slack.commands.native: true` یا `commands.native: true` در پیکربندی‌های سراسری فعال می‌شوند.

- حالت خودکار فرمان بومی برای Slack **خاموش** است؛ بنابراین `commands.native: "auto"` فرمان‌های بومی Slack را فعال نمی‌کند.

```txt
/help
```

منوهای آرگومان بومی به‌ترتیب اولویت به یکی از شکل‌های زیر نمایش داده می‌شوند:

- 3-5 گزینهٔ به‌اندازهٔ کافی کوتاه: یک منوی سرریز ("...")
- بیش از 100 گزینه، در صورت وجود پالایش ناهمگام گزینه‌ها: انتخاب‌گر خارجی
- 1-2 گزینه، یا هر گزینه‌ای که مقدار کدگذاری‌شدهٔ آن برای انتخاب‌گر بیش‌ازحد طولانی باشد: بلوک‌های دکمه
- در غیر این صورت (6-100 گزینه، یا بیش از 100 گزینه بدون پالایش ناهمگام): منوی انتخاب‌گر ایستا، قطعه‌بندی‌شده در 100 گزینه برای هر منو

```txt
/think
```

نشست‌های اسلش از کلیدهای مجزایی مانند `agent:<agentId>:slack:slash:<userId>` استفاده می‌کنند و همچنان اجرای فرمان‌ها را با استفاده از `CommandTargetSessionKey` به نشست گفت‌وگوی مقصد هدایت می‌کنند.

## نمودارهای بومی

بلوک عمومی [`data_visualization` در Block Kit](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
مربوط به Slack، نمودارهای خطی، میله‌ای، ناحیه‌ای و دایره‌ای را در پیام‌ها نمایش می‌دهد. OpenClaw بلوک قابل‌حمل
`presentation` `chart` را به آن ساختار بومی نگاشت می‌کند؛ فراتر از دسترسی عادی پیام
`chat:write`، هیچ محدودهٔ OAuth اضافی، بارگذاری فایل، رندرکنندهٔ تصویر یا پیکربندی Slack
لازم نیست.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "درآمد فصلی",
      "categories": ["سه‌ماههٔ اول", "سه‌ماههٔ دوم"],
      "series": [{ "name": "درآمد", "values": [120, 145] }],
      "xLabel": "سه‌ماهه"
    }
  ]
}
```

محدودیت‌های Slack پیش از رندر بومی اعمال می‌شوند:

- عنوان و برچسب‌های اختیاری محورها: 50 نویسه
- دایره‌ای: 1-12 بخش مثبت
- خطی/میله‌ای/ناحیه‌ای: 1-12 سری با نام‌های منحصربه‌فرد و 1-20 دستهٔ مشترک
- برچسب‌های بخش، دسته و سری: 20 نویسه
- هر سری باید برای هر دسته یک مقدار متناهی داشته باشد؛ مقادیر غیردایره‌ای
  می‌توانند منفی باشند

هر نمودار بومی همچنین یک نمایش متنی سطح‌بالا برای صفحه‌خوان‌ها،
اعلان‌ها، بازتاب نشست و کلاینت‌هایی دارد که نمی‌توانند بلوک را رندر کنند.
ارسال‌های ارائهٔ استاندارد به سایر کانال‌های OpenClaw همان داده‌های قطعی
نمودار را به‌صورت متن دریافت می‌کنند، مگر اینکه پشتیبانی بومی از نمودار را اعلام کنند. اگر
Slack طی عرضهٔ مرحله‌ای نمودار را با `invalid_blocks` رد کند، OpenClaw
بلوک‌های دادهٔ بومی ردشده را حذف می‌کند، کنترل‌های هم‌سطح را نگه می‌دارد و
نمایش کامل نمودار را به‌صورت متن قابل‌مشاهده ارسال می‌کند.

Slack در حال حاضر حداکثر دو بلوک `data_visualization` را در هر پیام می‌پذیرد. هنگامی‌که
یک ارائه بیش از دو نمودار معتبر داشته باشد، OpenClaw ترتیب آن‌ها را حفظ می‌کند
و رندر بومی را در پیام‌های پیگیری ادامه می‌دهد، به‌طوری‌که هر پیام بیش از دو
نمودار نداشته باشد.

[معرفی توسعه‌دهندگان](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
Slack این بلوک را به‌عنوان قابلیتی از Block Kit برای برنامه‌ها مستند می‌کند و هیچ محدودیت
طرح پولی‌ای منتشر نکرده است. عبارت مربوط به واجد شرایط بودن Business+/Enterprise به
تولید خودکار نمودار با هوش مصنوعی در Slackbot مربوط می‌شود که از ارسال
یک نمودار Block Kit از پیش ساختاریافته توسط برنامه جدا است. نمودارها بلوک‌های مختص پیام هستند، نه محتوای App
Home، modal یا Canvas.

## جدول‌های بومی

بلوک کنونی [`data_table` در Block Kit](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
مربوط به Slack، سطرها و ستون‌های ساختاریافته را در پیام‌ها نمایش می‌دهد. OpenClaw یک بلوک صریح و قابل‌حمل
`presentation` `table` را به `data_table` نگاشت می‌کند؛ از بلوک قدیمی
[`table`](https://docs.slack.dev/reference/block-kit/blocks/table-block/) مربوط به Slack استفاده نمی‌کند.
فراتر از دسترسی عادی پیام `chat:write`، هیچ محدودهٔ OAuth اضافی یا پیکربندی Slack
لازم نیست.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "خط لولهٔ باز",
      "headers": ["حساب", "مرحله", "ARR"],
      "rows": [
        ["Acme", "برنده", 125000],
        ["Globex", "بازبینی", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw سرستون‌ها و سلول‌های رشته‌ای را به سلول‌های `raw_text` در Slack نگاشت می‌کند. سلول‌های عددی
به `raw_number` نگاشت می‌شوند و مقدار عددی متناهی برای مرتب‌سازی
و پالایش بومی حفظ می‌شود. `rowHeaderColumnIndex`، در صورت وجود، آن ستون با
مبنای صفر را به‌عنوان سرستون سطرهای Slack علامت‌گذاری می‌کند.

محدودیت‌های منتشرشدهٔ `data_table` در Slack پیش از رندر بومی اعمال می‌شوند:

- 1-20 ستون
- 1-100 سطر داده، به‌علاوهٔ سطر سرستون
- تعداد یکسان سلول‌ها در هر سطر
- حداکثر 10,000 نویسه در مجموع تمام سلول‌های جدول در یک پیام

چند بلوک جدول معتبر می‌توانند تا زمانی‌که پیام در محدودهٔ مجموع نویسه‌ها
باقی بماند، به‌صورت بومی رندر شوند. جدولی که نتواند در محدودهٔ بومی رندر شود،
به‌جای از دست دادن سطرها یا سلول‌ها به متن قطعی و کامل تبدیل می‌شود. اگر آن متن
از یک پیام Slack فراتر رود، ارسال‌ها و پاسخ‌های اسلش از قطعه‌های متنی مرتب‌شده
استفاده می‌کنند. ویرایش جدول به‌جای کوتاه‌کردن بی‌سروصدای سطرهای یک پیام موجود،
با خطای صریح اندازه شکست می‌خورد.

هر جدول بومی تولیدشده از ارائهٔ قابل‌حمل همچنین یک نمایش متنی سطح‌بالا
برای صفحه‌خوان‌ها، اعلان‌ها، بازتاب نشست و کلاینت‌هایی دارد که نمی‌توانند
بلوک را رندر کنند. مقادیر خام نمودار و جدول در حالت بازگشتی عیناً باقی می‌مانند؛
بنابراین دادهٔ سلولی مانند `<@U123>` به اشارهٔ Slack تبدیل نمی‌شود.
اگر Slack بلوک‌های بومی نمودار یا جدول را با `invalid_blocks` رد کند، OpenClaw
همهٔ بلوک‌های دادهٔ بومی را در یک مرحلهٔ بازیابی محدود حذف می‌کند، بلوک‌های
هم‌سطح معتبر مانند دکمه‌ها و انتخاب‌گرها را نگه می‌دارد و متن کامل و قابل‌مشاهدهٔ
نمودار و جدول را با قالب‌بندی غیرفعال Slack ارسال می‌کند. تحویل فرمان اسلش،
بودجهٔ پنج فراخوانی `response_url` در Slack را در سراسر فرمان رهگیری می‌کند. پیش از هر
دستهٔ پاسخ، یک برنامهٔ کامل را انتخاب می‌کند که در فراخوانی‌های باقی‌مانده جا شود یا پیش از
ارسال آن دسته شکست می‌خورد.

فقط بلوک‌های جدول صریح `presentation` به جدول‌های بومی ارتقا می‌یابند.
جدول‌های لوله‌ای Markdown به‌صورت متن نوشته‌شده باقی می‌مانند؛ OpenClaw ساختار
جدول یا نوع سلول‌ها را حدس نمی‌زند. تولیدکنندگان بومی و مورداعتماد موجود در Slack می‌توانند
همچنان بلوک‌های خام را از طریق `channelData.slack.blocks` عبور دهند؛ OpenClaw متن
بازگشتی را از سلول‌های خام و معتبر `data_table` استخراج می‌کند، درحالی‌که بلوک‌های سفارشی
بدشکل ممکن است به زیرنویس خود یا حالت بازگشتی عمومی Block Kit تنزل یابند. خروجی قابل‌حمل
عامل، CLI و Plugin باید از `presentation` استفاده کند.

## پاسخ‌های تعاملی

Slack می‌تواند کنترل‌های تعاملی پاسخِ نوشته‌شده توسط عامل را رندر کند، اما این قابلیت به‌طور پیش‌فرض غیرفعال است.
برای خروجی جدید عامل، CLI و Plugin، دکمه‌ها یا بلوک‌های انتخاب مشترک
`presentation` را ترجیح دهید. آن‌ها از همان مسیر تعامل Slack استفاده می‌کنند
و در کانال‌های دیگر نیز تنزل مناسبی دارند.

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

یا فعال‌سازی فقط برای یک حساب Slack:

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

در صورت فعال‌سازی، عامل‌ها همچنان می‌توانند دستورالعمل‌های منسوخ‌شدهٔ پاسخِ مختص Slack را تولید کنند:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

این دستورالعمل‌ها به Slack Block Kit کامپایل می‌شوند و کلیک‌ها یا انتخاب‌ها را
از طریق مسیر موجود رویداد تعامل Slack بازمی‌گردانند. آن‌ها را برای پرامپت‌های قدیمی
و راه‌های گریز مختص Slack نگه دارید؛ برای کنترل‌های قابل‌حمل جدید از ارائهٔ مشترک
استفاده کنید.

APIهای کامپایلر دستورالعمل نیز برای کد تولیدکنندهٔ جدید منسوخ شده‌اند:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

برای کنترل‌های جدیدی که در Slack رندر می‌شوند، از محموله‌های `presentation` و
`buildSlackPresentationBlocks(...)` استفاده کنید.

نکته‌ها:

- این رابط کاربری قدیمی مختص Slack است. کانال‌های دیگر دستورالعمل‌های Slack Block
  Kit را به سامانه‌های دکمه‌ای خود تبدیل نمی‌کنند.
- مقادیر فراخوان تعاملی، توکن‌های مبهم تولیدشده توسط OpenClaw هستند، نه مقادیر خامی که عامل ایجاد کرده است.
- اگر بلوک‌های تعاملی تولیدشده از محدودیت‌های Slack Block Kit فراتر بروند، OpenClaw به‌جای ارسال یک payload بلوک نامعتبر، پاسخ متنی اصلی را ارسال می‌کند.

### ارسال‌های مودال تحت مالکیت Plugin

Pluginهای Slack که یک کنترل‌گر تعاملی ثبت می‌کنند، می‌توانند رویدادهای چرخه‌عمر مودال
`view_submission` و `view_closed` را نیز پیش از آن‌که OpenClaw
payload را برای رویداد سیستمی قابل‌مشاهده برای عامل فشرده کند، دریافت کنند. هنگام بازکردن یک مودال Slack از یکی از این الگوهای مسیریابی
استفاده کنید:

- `callback_id` را روی `openclaw:<namespace>:<payload>` تنظیم کنید.
- یا یک `callback_id` موجود را نگه دارید و `pluginInteractiveData:
"<namespace>:<payload>"` را در `private_metadata` مودال قرار دهید.

کنترل‌گر، `ctx.interaction.kind` را به‌صورت `view_submission` یا
`view_closed`، مقدار نرمال‌سازی‌شدهٔ `inputs` و شیء خام و کامل `stateValues` را از
Slack دریافت می‌کند. مسیریابی صرفاً بر اساس شناسهٔ فراخوان برای اجرای کنترل‌گر Plugin کافی است؛ اگر
مودال باید یک رویداد سیستمی قابل‌مشاهده برای عامل نیز ایجاد کند، فیلدهای مسیریابی کاربر/نشست `private_metadata` مودال موجود را
درج کنید. عامل یک رویداد سیستمی فشرده و ویرایش‌شدهٔ
`Slack interaction: ...` دریافت می‌کند. اگر کنترل‌گر
`systemEvent.summary`، `systemEvent.reference` یا `systemEvent.data` را برگرداند، این
فیلدها در آن رویداد فشرده درج می‌شوند تا عامل بتواند بدون مشاهدهٔ payload کامل فرم، به
فضای ذخیره‌سازی تحت مالکیت Plugin ارجاع دهد.

## تأییدهای بومی در Slack

Slack می‌تواند به‌جای بازگشت به رابط کاربری وب یا ترمینال، با دکمه‌ها و تعاملات تعاملی به‌عنوان یک کارخواه بومی تأیید عمل کند.

- تأییدهای اجرا و Plugin می‌توانند به‌شکل اعلان‌های بومی Slack مبتنی بر Block Kit نمایش داده شوند.
- `channels.slack.execApprovals.*` همچنان پیکربندی فعال‌سازی کارخواه بومی تأیید اجرا و مسیریابی پیام خصوصی/کانال است.
- پیام‌های خصوصی تأیید اجرا از `channels.slack.execApprovals.approvers` یا `commands.ownerAllowFrom` استفاده می‌کنند.
- هنگامی‌که Slack برای نشست مبدأ به‌عنوان کارخواه بومی تأیید فعال باشد، یا هنگامی‌که `approvals.plugin` به نشست Slack مبدأ یا یک مقصد Slack مسیریابی کند، تأییدهای Plugin از دکمه‌های بومی Slack استفاده می‌کنند.
- پیام‌های خصوصی تأیید Plugin از تأییدکنندگان Plugin مربوط به Slack در `channels.slack.allowFrom`، مقدار `allowFrom` حساب نام‌گذاری‌شده، یا مسیر پیش‌فرض حساب استفاده می‌کنند.
- مجوز تأییدکننده همچنان اعمال می‌شود: تأییدکنندگانی که فقط اجازهٔ اجرا دارند، نمی‌توانند درخواست‌های Plugin را تأیید کنند، مگر آن‌که تأییدکنندهٔ Plugin نیز باشند.

این قابلیت از همان سطح مشترک دکمهٔ تأیید سایر کانال‌ها استفاده می‌کند. هنگامی‌که `interactivity` در تنظیمات برنامهٔ Slack فعال باشد، اعلان‌های تأیید مستقیماً به‌شکل دکمه‌های Block Kit در گفتگو نمایش داده می‌شوند.
وقتی این دکمه‌ها وجود دارند، تجربهٔ کاربری اصلی تأیید هستند؛ OpenClaw
فقط زمانی باید یک فرمان دستی `/approve` را درج کند که نتیجهٔ ابزار نشان دهد تأییدهای چت
دردسترس نیستند یا تأیید دستی تنها مسیر است.

مسیر پیکربندی:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (اختیاری؛ در صورت امکان به `commands.ownerAllowFrom` بازمی‌گردد)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`، پیش‌فرض: `dm`)
- `agentFilter`، `sessionFilter`

وقتی `enabled` تنظیم نشده باشد یا `"auto"` باشد و دست‌کم یک
تأییدکنندهٔ اجرا شناسایی شود، Slack تأییدهای بومی اجرا را به‌طور خودکار فعال می‌کند. Slack همچنین می‌تواند از طریق این مسیر کارخواه بومی،
تأییدهای بومی Plugin را مدیریت کند، مشروط بر آن‌که تأییدکنندگان Plugin مربوط به Slack شناسایی شوند و درخواست با فیلترهای کارخواه بومی مطابقت داشته باشد. برای
غیرفعال‌کردن صریح Slack به‌عنوان کارخواه بومی تأیید، `enabled: false` را تنظیم کنید. برای
اجبار تأییدهای بومی در صورت شناسایی تأییدکنندگان، `enabled: true` را تنظیم کنید. غیرفعال‌کردن تأییدهای اجرای Slack،
تحویل تأیید بومی Plugin در Slack را که از طریق `approvals.plugin` فعال شده است غیرفعال نمی‌کند؛ تحویل تأیید
Plugin در عوض از تأییدکنندگان Plugin مربوط به Slack استفاده می‌کند.

رفتار پیش‌فرض بدون پیکربندی صریح تأیید اجرای Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

پیکربندی صریح بومی Slack فقط زمانی لازم است که بخواهید تأییدکنندگان را بازنویسی کنید، فیلترهایی بیفزایید یا
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

ارسال مشترک `approvals.exec` مستقل است. فقط زمانی از آن استفاده کنید که اعلان‌های تأیید اجرا باید
به چت‌های دیگر یا مقصدهای صریح خارج از مسیر نیز ارسال شوند. ارسال مشترک `approvals.plugin` نیز
مستقل است؛ تحویل بومی Slack فقط زمانی این مسیر جایگزین را سرکوب می‌کند که Slack بتواند درخواست تأیید
Plugin را به‌صورت بومی مدیریت کند.

`/approve` در همان چت، در کانال‌ها و پیام‌های خصوصی Slack که از قبل از فرمان‌ها پشتیبانی می‌کنند نیز کار می‌کند. برای مدل کامل ارسال تأیید، به [تأییدهای اجرا](/fa/tools/exec-approvals) مراجعه کنید.

## رویدادها و رفتار عملیاتی

- ویرایش‌ها/حذف‌های پیام به رویدادهای سیستمی نگاشت می‌شوند.
- پخش‌های رشته («ارسال به کانال نیز» برای پاسخ‌های رشته) به‌عنوان پیام‌های عادی کاربر پردازش می‌شوند.
- رویدادهای افزودن/حذف واکنش به رویدادهای سیستمی نگاشت می‌شوند.
- رویدادهای پیوستن/ترک عضو، ایجاد/تغییرنام کانال و افزودن/حذف سنجاق به رویدادهای سیستمی نگاشت می‌شوند.
- پایش اختیاری حضور می‌تواند گذار `away` به `active` یک شرکت‌کنندهٔ انسانی مشاهده‌شده را به جدیدترین نشست واجد شرایط و فعال Slack آن شرکت‌کننده نگاشت کند. این قابلیت به‌طور پیش‌فرض خاموش است.
- `channel_id_changed` می‌تواند کلیدهای پیکربندی کانال را هنگامی‌که `configWrites` فعال است مهاجرت دهد.
- فرادادهٔ موضوع/هدف کانال به‌عنوان زمینهٔ غیرقابل‌اعتماد در نظر گرفته می‌شود و می‌تواند به زمینهٔ مسیریابی تزریق شود.
- آغازگر رشته و بذرگذاری زمینهٔ تاریخچهٔ اولیهٔ رشته، در صورت کاربرد، بر اساس فهرست‌های مجاز فرستندهٔ پیکربندی‌شده فیلتر می‌شوند.
- کنش‌های بلوک، میان‌برها و تعاملات مودال، رویدادهای سیستمی ساخت‌یافتهٔ `Slack interaction: ...` را با فیلدهای غنی payload منتشر می‌کنند:
  - کنش‌های بلوک: مقادیر انتخاب‌شده، برچسب‌ها، مقادیر انتخاب‌گر و فرادادهٔ `workflow_*`
  - میان‌برهای سراسری: فرادادهٔ فراخوان و کنشگر، مسیریابی‌شده به نشست مستقیم کنشگر
  - میان‌برهای پیام: زمینهٔ فراخوان، کنشگر، کانال، رشته و پیام انتخاب‌شده
  - رویدادهای مودال `view_submission` و `view_closed` با فرادادهٔ کانال مسیریابی‌شده و ورودی‌های فرم

میان‌برهای سراسری یا پیام را در پیکربندی برنامهٔ Slack خود تعریف کنید و از هر شناسهٔ فراخوان غیرخالی استفاده کنید. OpenClaw دریافت payloadهای میان‌بر منطبق را تأیید می‌کند، همان سیاست فرستندهٔ پیام خصوصی/کانالِ سایر تعاملات Slack را اعمال می‌کند و رویداد پاک‌سازی‌شده را برای نشست عامل مسیریابی‌شده در صف قرار می‌دهد. شناسه‌های راه‌انداز و URLهای پاسخ از زمینهٔ عامل حذف می‌شوند.

### رویدادهای حضور

Slack تغییرات حضور را از طریق Events API یا Socket Mode ارسال نمی‌کند. OpenClaw می‌تواند در عوض [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) را برای شرکت‌کنندگان انسانی‌ای که پیام‌هایشان بررسی‌های عادی دسترسی و مسیریابی Slack را گذرانده‌اند، پایش کند.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (پیش‌فرض): بدون زمان‌سنج حضور یا فراخوانی‌های Slack API.
- `auto`: پیام‌های خصوصی، MPIMها و رشته‌های Slack فعال در 24 ساعت گذشته را با حداکثر 8 شرکت‌کنندهٔ انسانی مشاهده‌شده پایش می‌کند. نشست‌های سطح‌بالای کانال مستثنا هستند.
- `on`: همان گفتگوها را بدون سقف شرکت‌کننده پایش می‌کند و نشست‌های سطح‌بالای کانال را نیز شامل می‌شود. برای اجبار یا سرکوب یک کانال، از بازنویسی مختص هر کانال استفاده کنید.

OpenClaw در هر دقیقه و برای هر حساب Slack حداکثر 45 کاربر یکتا را پایش می‌کند، نتیجهٔ نخست را بدون بیدارکردن عامل به‌عنوان مقدار اولیه ثبت می‌کند و فقط هنگام مشاهدهٔ گذار `away` به `active` عامل را بیدار می‌کند. برای هر حساب Slack و کاربر، یک دورهٔ انتظار پایدار 8 ساعته اعمال می‌شود، حتی اگر آن شخص در چند رشته مشارکت داشته باشد. رویداد فقط به جدیدترین گفتگوی فعال و واجد شرایط آن شخص مسیریابی می‌شود و به عامل می‌گوید پیش از تصمیم‌گیری دربارهٔ ارسال یک خوشامدگویی کوتاه، حافظه/ویکی و زمینهٔ منطقهٔ زمانی شناخته‌شده را بررسی کند. عامل می‌تواند سکوت کند.

توکن ربات به `users:read` نیاز دارد که از قبل در manifest پیشنهادی درج شده است. رویدادهای حضور برای نصب‌های سراسری سازمان در Enterprise Grid دردسترس نیستند.

## مرجع پیکربندی

مرجع اصلی: [مرجع پیکربندی - Slack](/fa/gateway/config-channels#slack).

<Accordion title="فیلدهای پراهمیت Slack">

- حالت/احراز هویت: `mode`، `enterpriseOrgInstall`، `botToken`، `appToken`، `signingSecret`، `webhookPath`، `accounts.*`
- دسترسی پیام خصوصی: `dm.enabled`، `dmPolicy`، `allowFrom` (قدیمی: `dm.policy`، `dm.allowFrom`)، `dm.groupEnabled`، `dm.groupChannels`
- کلید سازگاری: `dangerouslyAllowNameMatching` (اضطراری؛ مگر در صورت نیاز خاموش نگه دارید)
- دسترسی کانال: `groupPolicy`، `channels.*`، `channels.*.users`، `channels.*.requireMention`
- رشته‌بندی/تاریخچه: `replyToMode`، `replyToModeByChatType`، `thread.*`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`
- بیدارسازی‌های حضور: `presenceEvents.mode`، `channels.*.presenceEvents.mode` (`off|auto|on`؛ پیش‌فرض `off`)
- تحویل: `textChunkLimit`، `streaming.chunkMode`، `mediaMaxMb`، `streaming`، `streaming.nativeTransport`، `streaming.preview.toolProgress`
- بازکردن پیش‌نمایش‌ها: `unfurlLinks` (پیش‌فرض: `false`)، `unfurlMedia` برای کنترل پیش‌نمایش پیوند/رسانهٔ `chat.postMessage`؛ برای فعال‌سازی دوبارهٔ پیش‌نمایش پیوندها، `unfurlLinks: true` را تنظیم کنید
- عملیات/قابلیت‌ها: `configWrites`، `commands.native`، `slashCommand.*`، `actions.*`، `userToken`، `userTokenReadOnly`

</Accordion>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="پاسخی در کانال‌ها دریافت نمی‌شود">
    به‌ترتیب بررسی کنید:

    - `groupPolicy`
    - فهرست مجاز کانال (`channels.slack.channels`) — **کلیدها باید شناسهٔ کانال باشند** (`C12345678`)، نه نام‌ها (`#channel-name`). کلیدهای مبتنی بر نام در `groupPolicy: "allowlist"` بی‌صدا شکست می‌خورند، زیرا مسیریابی کانال به‌طور پیش‌فرض ابتدا بر اساس شناسه انجام می‌شود. برای یافتن شناسه: روی کانال در Slack کلیک‌راست کنید → **Copy link** — مقدار `C...` در انتهای URL همان شناسهٔ کانال است.
    - `requireMention`
    - فهرست مجاز `users` مختص هر کانال
    - `messages.groupChat.visibleReplies`: درخواست‌های عادی گروه/کانال به‌طور پیش‌فرض روی `"automatic"` هستند. اگر `"message_tool"` را فعال کرده‌اید و گزارش‌ها متن دستیار را بدون فراخوانی `message(action=send)` نشان می‌دهند، مدل مسیر قابل‌مشاهدهٔ ابزار پیام را از دست داده است. متن نهایی در این حالت خصوصی می‌ماند؛ گزارش مفصل Gateway را برای فرادادهٔ payload سرکوب‌شده بررسی کنید، یا اگر می‌خواهید هر پاسخ نهایی عادی دستیار از مسیر قدیمی ارسال شود، آن را روی `"automatic"` تنظیم کنید.
    - `messages.groupChat.unmentionedInbound`: اگر مقدار آن `"room_event"` باشد، گفتگوی مجاز کانال که بدون اشاره ارسال شده است، زمینهٔ محیطی محسوب می‌شود و مگر آن‌که عامل ابزار `message` را فراخوانی کند، بی‌پاسخ می‌ماند. به [رویدادهای محیطی اتاق](/fa/channels/ambient-room-events) مراجعه کنید.

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

  <Accordion title="پیام‌های خصوصی نادیده گرفته می‌شوند">
    بررسی کنید:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (یا `channels.slack.dm.policy` قدیمی)
    - تأییدهای جفت‌سازی / ورودی‌های فهرست مجاز (`dmPolicy: "open"` همچنان به `channels.slack.allowFrom: ["*"]` نیاز دارد)
    - پیام‌های مستقیم گروهی از مدیریت MPIM استفاده می‌کنند؛ `channels.slack.dm.groupEnabled` را فعال کنید و در صورت پیکربندی، MPIM را در `channels.slack.dm.groupChannels` بگنجانید
    - رویدادهای پیام مستقیم Slack Assistant: گزارش‌های مفصل که به `drop message_changed` اشاره می‌کنند
      معمولاً به این معنا هستند که Slack رویداد ویرایش‌شده‌ای از رشته Assistant ارسال کرده است که
      فرستنده انسانی قابل‌بازیابی در فراداده پیام ندارد

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="حالت Socket متصل نمی‌شود">
    توکن‌های ربات و برنامه و فعال‌بودن Socket Mode را در تنظیمات برنامه Slack اعتبارسنجی کنید.
    App-Level Token به `connections:write` نیاز دارد و توکن ربات Bot User OAuth Token
    باید متعلق به همان برنامه/فضای کاری Slack باشد که توکن برنامه به آن تعلق دارد.

    اگر `openclaw channels status --probe --json` مقدار `botTokenStatus` یا
    `appTokenStatus: "configured_unavailable"` را نشان دهد، حساب Slack
    پیکربندی شده است، اما محیط اجرای کنونی نتوانسته مقدار مبتنی بر SecretRef را
    برطرف کند.

    گزارش‌هایی مانند `slack socket mode failed to start; retry ...` خطاهای قابل‌بازیابی
    هنگام راه‌اندازی هستند. در مقابل، محدوده‌های دسترسی مفقود، توکن‌های لغوشده و احراز هویت نامعتبر به‌سرعت
    با شکست مواجه می‌شوند. گزارش `slack token mismatch ...` به این معناست که ظاهراً توکن ربات و توکن برنامه
    به برنامه‌های Slack متفاوتی تعلق دارند؛ اعتبارنامه‌های برنامه Slack را اصلاح کنید.

  </Accordion>

  <Accordion title="حالت HTTP رویدادها را دریافت نمی‌کند">
    موارد زیر را اعتبارسنجی کنید:

    - راز امضا
    - مسیر Webhook
    - نشانی‌های درخواست Slack (رویدادها + تعامل‌پذیری + فرمان‌های اسلش)
    - `webhookPath` یکتا برای هر حساب HTTP
    - نشانی عمومی TLS را خاتمه می‌دهد و درخواست‌ها را به مسیر Gateway هدایت می‌کند
    - مسیر `request_url` برنامه Slack دقیقاً با `channels.slack.webhookPath` مطابقت دارد (پیش‌فرض `/slack/events`)

    اگر `signingSecretStatus: "configured_unavailable"` در نماهای لحظه‌ای حساب
    ظاهر شود، حساب HTTP پیکربندی شده است، اما محیط اجرای کنونی نتوانسته
    راز امضای مبتنی بر SecretRef را برطرف کند.

    تکرار گزارش `slack: webhook path ... already registered` به این معناست که دو حساب HTTP
    از `webhookPath` یکسانی استفاده می‌کنند؛ به هر حساب یک مسیر متمایز اختصاص دهید.

  </Accordion>

  <Accordion title="فرمان‌های بومی/اسلش اجرا نمی‌شوند">
    بررسی کنید که کدام‌یک مدنظر بوده است:

    - حالت فرمان بومی (`channels.slack.commands.native: true`) همراه با فرمان‌های اسلش منطبق ثبت‌شده در Slack
    - یا حالت تک‌فرمان اسلش (`channels.slack.slashCommand.enabled: true`)

    Slack فرمان‌های اسلش را به‌صورت خودکار ایجاد یا حذف نمی‌کند. `commands.native: "auto"` فرمان‌های بومی Slack را فعال نمی‌کند؛ از `true` استفاده کنید و فرمان‌های منطبق را در برنامه Slack بسازید. در حالت HTTP، هر فرمان اسلش Slack باید نشانی Gateway را دربر بگیرد. در Socket Mode، بارهای فرمان از طریق websocket دریافت می‌شوند و Slack مقدار `slash_commands[].url` را نادیده می‌گیرد.

    همچنین `commands.useAccessGroups`، مجوز پیام مستقیم، فهرست‌های مجاز کانال،
    و فهرست‌های مجاز `users` مختص هر کانال را بررسی کنید. Slack برای
    فرستندگان مسدودشده فرمان اسلش خطاهای موقت برمی‌گرداند، از جمله:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## مرجع رسانه پیوست

هنگامی که بارگیری فایل از Slack موفق باشد و محدودیت‌های اندازه اجازه دهند، Slack می‌تواند رسانه بارگیری‌شده را به نوبت عامل پیوست کند. کلیپ‌های صوتی قابل رونویسی هستند، فایل‌های تصویری می‌توانند از مسیر درک رسانه عبور کنند یا مستقیماً به مدل پاسخ‌گویی دارای قابلیت بینایی داده شوند، و فایل‌های دیگر به‌عنوان زمینه فایل قابل‌بارگیری در دسترس می‌مانند.

### انواع رسانه پشتیبانی‌شده

| نوع رسانه                     | منبع               | رفتار کنونی                                                                  | یادداشت‌ها                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| کلیپ‌های صوتی Slack              | نشانی فایل Slack       | بارگیری و از طریق رونویسی صوتی مشترک هدایت می‌شوند                          | به `files:read` و یک مدل یا CLI فعال `tools.media.audio` نیاز دارد      |
| تصاویر JPEG / PNG / GIF / WebP | نشانی فایل Slack       | بارگیری و برای پردازش دارای قابلیت بینایی به نوبت پیوست می‌شوند                   | سقف هر فایل: `channels.slack.mediaMaxMb` (پیش‌فرض 20 MB)                 |
| فایل‌های PDF                      | نشانی فایل Slack       | بارگیری و به‌عنوان زمینه فایل برای ابزارهایی مانند `download-file` یا `pdf` ارائه می‌شوند | ورودی Slack فایل‌های PDF را به‌طور خودکار به ورودی بینایی تصویری تبدیل نمی‌کند |
| فایل‌های دیگر                    | نشانی فایل Slack       | در صورت امکان بارگیری و به‌عنوان زمینه فایل ارائه می‌شوند                              | فایل‌های دودویی به‌عنوان ورودی تصویر در نظر گرفته نمی‌شوند                               |
| پاسخ‌های رشته                 | فایل‌های آغازگر رشته | هنگامی که پاسخ رسانه مستقیمی ندارد، فایل‌های پیام ریشه می‌توانند به‌عنوان زمینه آماده شوند  | آغازگرهای فقط‌فایل از جای‌نگهدار پیوست استفاده می‌کنند                          |
| پیام‌های چندفایلی            | چند فایل Slack | هر فایل به‌طور مستقل ارزیابی می‌شود                                              | پردازش Slack به هشت فایل در هر پیام محدود است                     |

### خط لوله ورودی

هنگامی که یک پیام Slack دارای فایل‌های پیوست دریافت می‌شود:

1. OpenClaw فایل را با استفاده از توکن ربات از نشانی خصوصی Slack بارگیری می‌کند.
2. در صورت موفقیت، فایل در مخزن رسانه نوشته می‌شود.
3. مسیرهای رسانه بارگیری‌شده و انواع محتوا به زمینه ورودی افزوده می‌شوند.
4. کلیپ‌های صوتی به خط لوله مشترک رونویسی هدایت می‌شوند؛ مسیرهای مدل/ابزار دارای قابلیت تصویر می‌توانند از پیوست‌های تصویری همان زمینه استفاده کنند.
5. فایل‌های دیگر به‌عنوان فراداده فایل یا ارجاعات رسانه برای ابزارهایی که می‌توانند آن‌ها را پردازش کنند، در دسترس می‌مانند.

### ارث‌بری پیوست پیام ریشه رشته

هنگامی که پیامی در یک رشته دریافت می‌شود (والد `thread_ts` دارد):

- اگر خود پاسخ رسانه مستقیمی نداشته باشد و پیام ریشه گنجانده‌شده فایل داشته باشد، Slack می‌تواند فایل‌های ریشه را به‌عنوان زمینه آغازگر رشته آماده کند.
- فایل‌های ریشه فقط هنگام مقداردهی اولیه نشست جدید یا بازنشانی‌شده رشته آماده می‌شوند. پاسخ‌های بعدی که فقط متن دارند، از زمینه نشست موجود دوباره استفاده می‌کنند و فایل‌های ریشه را مجدداً به‌عنوان رسانه تازه پیوست نمی‌کنند.
- پیوست‌های مستقیم پاسخ بر پیوست‌های پیام ریشه اولویت دارند.
- پیام ریشه‌ای که فقط فایل دارد و فاقد متن است، با جای‌نگهدار پیوست نمایش داده می‌شود تا حالت جایگزین همچنان بتواند فایل‌های آن را دربر بگیرد.

### مدیریت چند پیوست

هنگامی که یک پیام Slack دارای چند فایل پیوست است:

- هر پیوست به‌طور مستقل از طریق خط لوله رسانه پردازش می‌شود.
- ارجاعات رسانه بارگیری‌شده در زمینه پیام تجمیع می‌شوند.
- ترتیب پردازش از ترتیب فایل‌های Slack در بار رویداد پیروی می‌کند.
- شکست در بارگیری یک پیوست، پیوست‌های دیگر را مسدود نمی‌کند.

### محدودیت‌های اندازه، بارگیری و مدل

- **سقف اندازه**: پیش‌فرض 20 MB برای هر فایل. از طریق `channels.slack.mediaMaxMb` قابل‌پیکربندی است.
- **سقف رونویسی صوتی**: هنگامی که فایل بارگیری‌شده به ارائه‌دهنده رونویسی یا CLI ارسال می‌شود، `tools.media.audio.maxBytes` نیز اعمال می‌شود.
- **شکست‌های بارگیری**: فایل‌هایی که Slack نمی‌تواند ارائه کند، نشانی‌های منقضی‌شده، فایل‌های غیرقابل‌دسترسی، فایل‌های بیش‌ازحد بزرگ و پاسخ‌های HTML احراز هویت/ورود Slack به‌جای گزارش‌شدن به‌عنوان قالب پشتیبانی‌نشده، نادیده گرفته می‌شوند.
- **مدل بینایی**: تحلیل تصویر در صورت پشتیبانی مدل پاسخ‌گویی فعال از بینایی، از همان مدل استفاده می‌کند؛ در غیر این صورت از مدل تصویر پیکربندی‌شده در `agents.defaults.imageModel` استفاده می‌شود.

### محدودیت‌های شناخته‌شده

| سناریو                                      | رفتار کنونی                                                                   | راهکار جایگزین                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| نشانی منقضی‌شده فایل Slack                        | فایل نادیده گرفته می‌شود؛ خطایی نمایش داده نمی‌شود                                                       | فایل را دوباره در Slack بارگذاری کنید                                                   |
| رونویسی صوتی در دسترس نیست               | کلیپ پیوست باقی می‌ماند، اما رونویسی تولید نمی‌شود                                | `tools.media.audio` را پیکربندی کنید یا یک CLI محلی پشتیبانی‌شده برای رونویسی نصب کنید  |
| کلیپ بدون زیرنویس از دروازه اشاره عبور نمی‌کند | پس از رونویسی گمانه‌زنانه خصوصی کنار گذاشته می‌شود؛ رونویسی و فایل بارگیری‌شده حذف می‌شوند | الگوی اشاره با نام گفتاری را پیکربندی کنید، اشاره متنی به ربات بیفزایید یا از پیام مستقیم استفاده کنید |
| مدل بینایی پیکربندی نشده است                   | پیوست‌های تصویری به‌عنوان ارجاعات رسانه ذخیره می‌شوند، اما به‌عنوان تصویر تحلیل نمی‌شوند       | `agents.defaults.imageModel` را پیکربندی کنید یا از یک مدل پاسخ‌گویی دارای قابلیت بینایی استفاده کنید    |
| تصاویر بسیار بزرگ (> 20 MB به‌طور پیش‌فرض)        | مطابق سقف اندازه نادیده گرفته می‌شوند                                                               | اگر Slack اجازه می‌دهد، `channels.slack.mediaMaxMb` را افزایش دهید                          |
| پیوست‌های بازفرستاده‌شده/اشتراکی                  | متن و رسانه تصویر/فایل میزبانی‌شده در Slack به‌صورت بهترین‌تلاش پردازش می‌شوند                             | مستقیماً در رشته OpenClaw دوباره به اشتراک بگذارید                                      |
| پیوست‌های PDF                               | به‌عنوان زمینه فایل/رسانه ذخیره می‌شوند و به‌طور خودکار از مسیر بینایی تصویری عبور نمی‌کنند        | برای فراداده فایل از `download-file` یا برای تحلیل PDF از ابزار `pdf` استفاده کنید      |

### مستندات مرتبط

- [خط لوله درک رسانه](/fa/nodes/media-understanding)
- [یادداشت‌های صوتی و صدا](/fa/nodes/audio)
- [ابزار PDF](/fa/tools/pdf)

## مرتبط

<CardGroup cols={2}>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    یک کاربر Slack را با Gateway جفت کنید.
  </Card>
  <Card title="گروه‌ها" icon="users" href="/fa/channels/groups">
    رفتار کانال و پیام مستقیم گروهی.
  </Card>
  <Card title="مسیریابی کانال" icon="route" href="/fa/channels/channel-routing">
    پیام‌های ورودی را به عامل‌ها هدایت کنید.
  </Card>
  <Card title="امنیت" icon="shield" href="/fa/gateway/security">
    مدل تهدید و مقاوم‌سازی.
  </Card>
  <Card title="پیکربندی" icon="sliders" href="/fa/gateway/configuration">
    چیدمان و اولویت پیکربندی.
  </Card>
  <Card title="فرمان‌های اسلش" icon="terminal" href="/fa/tools/slash-commands">
    فهرست فرمان‌ها و رفتار آن‌ها.
  </Card>
</CardGroup>
