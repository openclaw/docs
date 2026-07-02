---
read_when:
    - راه‌اندازی OpenClaw برای نخستین بار
    - در جست‌وجوی الگوهای رایج پیکربندی
    - رفتن به بخش‌های مشخص پیکربندی
summary: 'نمای کلی پیکربندی: کارهای رایج، راه‌اندازی سریع، و پیوندهایی به مرجع کامل'
title: پیکربندی
x-i18n:
    generated_at: "2026-07-02T08:37:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0044dd771effee8e11d5dfd99e6f14f105089328dcca23f5794ddff4995bca7
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw یک پیکربندی اختیاری <Tooltip tip="JSON5 از کامنت‌ها و کاماهای انتهایی پشتیبانی می‌کند">**JSON5**</Tooltip> را از `~/.openclaw/openclaw.json` می‌خواند.
مسیر پیکربندی فعال باید یک فایل معمولی باشد. چیدمان‌های `openclaw.json`
که با symlink ساخته شده‌اند، برای نوشتن‌های متعلق به OpenClaw پشتیبانی نمی‌شوند؛ یک نوشتن اتمیک ممکن است
به‌جای حفظ symlink، مسیر را جایگزین کند. اگر پیکربندی را بیرون از
دایرکتوری وضعیت پیش‌فرض نگه می‌دارید، `OPENCLAW_CONFIG_PATH` را مستقیما به فایل واقعی اشاره دهید.

اگر فایل وجود نداشته باشد، OpenClaw از پیش‌فرض‌های امن استفاده می‌کند. دلایل رایج برای افزودن پیکربندی:

- اتصال کانال‌ها و کنترل اینکه چه کسی می‌تواند به بات پیام بدهد
- تنظیم مدل‌ها، ابزارها، sandboxing، یا خودکارسازی (cron، هوک‌ها)
- تنظیم دقیق نشست‌ها، رسانه، شبکه، یا UI

برای همه فیلدهای موجود، [مرجع کامل](/fa/gateway/configuration-reference) را ببینید.

عامل‌ها و خودکارسازی باید پیش از ویرایش پیکربندی، برای مستندات دقیق در سطح فیلد
از `config.schema.lookup` استفاده کنند. از این صفحه برای راهنمایی وظیفه‌محور و از
[مرجع پیکربندی](/fa/gateway/configuration-reference) برای نقشه گسترده‌تر
فیلدها و پیش‌فرض‌ها استفاده کنید.

<Tip>
**تازه با پیکربندی آشنا شده‌اید؟** برای راه‌اندازی تعاملی با `openclaw onboard` شروع کنید، یا راهنمای [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) را برای پیکربندی‌های کامل آماده کپی و چسباندن ببینید.
</Tip>

## پیکربندی حداقلی

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## ویرایش پیکربندی

<Tabs>
  <Tab title="جادوگر تعاملی">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (دستورهای تک‌خطی)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI کنترل">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) را باز کنید و از زبانه **پیکربندی** استفاده کنید.
    UI کنترل یک فرم را از schema پیکربندی زنده رندر می‌کند، از جمله metadata مستندات
    فیلدهای `title` / `description` به‌علاوه schemaهای Plugin و کانال، در صورت
    موجود بودن، همراه با ویرایشگر **JSON خام** به‌عنوان راه خروج. برای UIهای جزئیات‌محور
    و ابزارهای دیگر، Gateway همچنین `config.schema.lookup` را برای
    واکشی یک گره schema محدود به مسیر به‌همراه خلاصه‌های فرزند بلافاصله ارائه می‌کند.
  </Tab>
  <Tab title="ویرایش مستقیم">
    `~/.openclaw/openclaw.json` را مستقیما ویرایش کنید. Gateway فایل را زیر نظر می‌گیرد و تغییرات را به‌طور خودکار اعمال می‌کند (به [بارگذاری مجدد داغ](#config-hot-reload) مراجعه کنید).
  </Tab>
</Tabs>

## اعتبارسنجی سخت‌گیرانه

<Warning>
OpenClaw فقط پیکربندی‌هایی را می‌پذیرد که کاملا با schema مطابق باشند. کلیدهای ناشناخته، نوع‌های بدشکل، یا مقدارهای نامعتبر باعث می‌شوند Gateway **از شروع به کار خودداری کند**. تنها استثنای سطح ریشه `$schema` (رشته) است، تا ویرایشگرها بتوانند metadata مربوط به JSON Schema را پیوست کنند.
</Warning>

`openclaw config schema`‏ JSON Schema معیار را که Control UI
و اعتبارسنجی استفاده می‌کنند چاپ می‌کند. `config.schema.lookup` یک گره محدود به مسیر به‌همراه
خلاصه‌های فرزند را برای ابزارهای جزئیات‌محور واکشی می‌کند. metadata مستندات فیلدهای `title`/`description`
از طریق آبجکت‌های تودرتو، wildcard (`*`)، آیتم آرایه (`[]`)، و شاخه‌های `anyOf`/
`oneOf`/`allOf` منتقل می‌شود. schemaهای Plugin و کانال در زمان اجرا وقتی
registry مانیفست بارگذاری شده باشد ادغام می‌شوند.

وقتی اعتبارسنجی شکست می‌خورد:

- Gateway بوت نمی‌شود
- فقط دستورهای تشخیصی کار می‌کنند (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- برای دیدن مشکلات دقیق، `openclaw doctor` را اجرا کنید
- برای اعمال تعمیرها، `openclaw doctor --fix` (یا `--yes`) را اجرا کنید

Gateway پس از هر راه‌اندازی موفق، یک کپی مورد اعتماد از آخرین وضعیت سالم نگه می‌دارد،
اما راه‌اندازی و بارگذاری مجدد داغ آن را به‌طور خودکار بازیابی نمی‌کنند. اگر `openclaw.json`
اعتبارسنجی را رد کند (از جمله اعتبارسنجی محلی Plugin)، راه‌اندازی Gateway شکست می‌خورد یا
بارگذاری مجدد نادیده گرفته می‌شود و runtime فعلی آخرین پیکربندی پذیرفته‌شده را نگه می‌دارد.
برای تعمیر پیکربندی دارای پیشوند/بازنویسی‌شده یا
بازیابی کپی آخرین وضعیت سالم، `openclaw doctor --fix` (یا `--yes`) را اجرا کنید. ارتقا به آخرین وضعیت سالم زمانی نادیده گرفته می‌شود که یک
کاندید شامل placeholderهای secret redacted مانند `***` باشد.

## کارهای رایج

<AccordionGroup>
  <Accordion title="راه‌اندازی یک کانال (WhatsApp، Telegram، Discord، و غیره)">
    هر کانال بخش پیکربندی خودش را زیر `channels.<provider>` دارد. برای مراحل راه‌اندازی، صفحه اختصاصی کانال را ببینید:

    - [WhatsApp](/fa/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/fa/channels/telegram) - `channels.telegram`
    - [Discord](/fa/channels/discord) - `channels.discord`
    - [Feishu](/fa/channels/feishu) - `channels.feishu`
    - [Google Chat](/fa/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/fa/channels/msteams) - `channels.msteams`
    - [Slack](/fa/channels/slack) - `channels.slack`
    - [Signal](/fa/channels/signal) - `channels.signal`
    - [iMessage](/fa/channels/imessage) - `channels.imessage`
    - [Mattermost](/fa/channels/mattermost) - `channels.mattermost`

    همه کانال‌ها از الگوی سیاست DM یکسانی استفاده می‌کنند:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="انتخاب و پیکربندی مدل‌ها">
    مدل اصلی و fallbackهای اختیاری را تنظیم کنید:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` کاتالوگ مدل را تعریف می‌کند و به‌عنوان allowlist برای `/model` عمل می‌کند؛ ورودی‌های `provider/*`، `/model`، `/models` و انتخابگرهای مدل را به ارائه‌دهندگان منتخب محدود می‌کنند، در حالی که همچنان از کشف پویای مدل استفاده می‌شود.
    - برای افزودن ورودی‌های allowlist بدون حذف مدل‌های موجود، از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. جایگزینی‌های ساده‌ای که ورودی‌ها را حذف کنند رد می‌شوند، مگر اینکه `--replace` را پاس بدهید.
    - ارجاع‌های مدل از قالب `provider/model` استفاده می‌کنند (مثلا `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` کوچک‌سازی تصویرهای transcript/tool را کنترل می‌کند (پیش‌فرض `1200`)؛ مقدارهای کمتر معمولا مصرف توکن بینایی را در اجراهای پر از اسکرین‌شات کاهش می‌دهند.
    - برای تغییر مدل‌ها در چت، [CLI مدل‌ها](/fa/concepts/models) را ببینید و برای چرخش auth و رفتار fallback، [Failover مدل](/fa/concepts/model-failover) را ببینید.
    - برای ارائه‌دهندگان سفارشی/خودمیزبان، [ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) را در مرجع ببینید.

  </Accordion>

  <Accordion title="کنترل اینکه چه کسی می‌تواند به بات پیام بدهد">
    دسترسی DM برای هر کانال از طریق `dmPolicy` کنترل می‌شود:

    - `"pairing"` (پیش‌فرض): فرستندگان ناشناخته یک کد pair یک‌بارمصرف برای تایید دریافت می‌کنند
    - `"allowlist"`: فقط فرستندگان موجود در `allowFrom` (یا ذخیره allow جفت‌شده)
    - `"open"`: همه DMهای ورودی را مجاز می‌کند (به `allowFrom: ["*"]` نیاز دارد)
    - `"disabled"`: همه DMها را نادیده می‌گیرد

    برای گروه‌ها، از `groupPolicy` + `groupAllowFrom` یا allowlistهای مخصوص کانال استفاده کنید.

    برای جزئیات هر کانال، [مرجع کامل](/fa/gateway/config-channels#dm-and-group-access) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی gate کردن mention در چت گروهی">
    پیام‌های گروهی به‌صورت پیش‌فرض **نیازمند mention** هستند. الگوهای trigger را برای هر عامل پیکربندی کنید. پاسخ‌های معمول گروه/کانال به‌طور خودکار ارسال می‌شوند؛ برای اتاق‌های مشترکی که عامل باید تصمیم بگیرد چه زمانی صحبت کند، مسیر message-tool را فعال کنید:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **mentionهای metadata**: @-mentionهای بومی (WhatsApp tap-to-mention، Telegram @bot، و غیره)
    - **الگوهای متن**: الگوهای regex امن در `mentionPatterns`
    - **پاسخ‌های قابل مشاهده**: `messages.visibleReplies` می‌تواند ارسال با message-tool را به‌صورت سراسری الزامی کند؛ `messages.groupChat.visibleReplies` این را برای گروه‌ها/کانال‌ها override می‌کند.
    - برای حالت‌های پاسخ قابل مشاهده، overrideهای هر کانال، و حالت self-chat، [مرجع کامل](/fa/gateway/config-channels#group-chat-mention-gating) را ببینید.

  </Accordion>

  <Accordion title="محدود کردن Skills برای هر عامل">
    برای baseline مشترک از `agents.defaults.skills` استفاده کنید، سپس عامل‌های خاص را با
    `agents.list[].skills` override کنید:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - برای Skills نامحدود به‌صورت پیش‌فرض، `agents.defaults.skills` را حذف کنید.
    - برای ارث‌بری پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
    - برای نداشتن Skills، `agents.list[].skills: []` را تنظیم کنید.
    - [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و
      [مرجع پیکربندی](/fa/gateway/config-agents#agents-defaults-skills) را ببینید.

  </Accordion>

  <Accordion title="تنظیم دقیق پایش سلامت کانال Gateway">
    کنترل کنید Gateway با چه شدتی کانال‌هایی را که کهنه به نظر می‌رسند restart کند:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - برای غیرفعال کردن restartهای health-monitor به‌صورت سراسری، `gateway.channelHealthCheckMinutes: 0` را تنظیم کنید.
    - `channelStaleEventThresholdMinutes` باید بزرگ‌تر یا مساوی بازه بررسی باشد.
    - برای غیرفعال کردن restart خودکار برای یک کانال یا حساب بدون غیرفعال کردن monitor سراسری، از `channels.<provider>.healthMonitor.enabled` یا `channels.<provider>.accounts.<id>.healthMonitor.enabled` استفاده کنید.
    - برای اشکال‌زدایی عملیاتی، [بررسی‌های سلامت](/fa/gateway/health) و برای همه فیلدها [مرجع کامل](/fa/gateway/configuration-reference#gateway) را ببینید.

  </Accordion>

  <Accordion title="تنظیم دقیق timeout دست‌دهی WebSocket در Gateway">
    به clientهای محلی زمان بیشتری بدهید تا دست‌دهی WebSocket پیش از auth را روی
    میزبان‌های پربار یا کم‌قدرت کامل کنند:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - پیش‌فرض `15000` میلی‌ثانیه است.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` همچنان برای overrideهای موردی service یا shell اولویت دارد.
    - ابتدا رفع stallهای startup/event-loop را ترجیح دهید؛ این knob برای میزبان‌هایی است که سالم‌اند اما هنگام warmup کند هستند.

  </Accordion>

  <Accordion title="پیکربندی نشست‌ها و resetها">
    نشست‌ها تداوم و جداسازی مکالمه را کنترل می‌کنند:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
```

    - `dmScope`: `main` (مشترک) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: پیش‌فرض‌های سراسری برای مسیریابی نشست‌های وابسته به رشته (Discord از `/focus`، `/unfocus`، `/agents`، `/session idle`، و `/session max-age` پشتیبانی می‌کند).
    - برای دامنه‌بندی، پیوندهای هویت، و سیاست ارسال، [مدیریت نشست](/fa/concepts/session) را ببینید.
    - برای همه فیلدها، [مرجع کامل](/fa/gateway/config-agents#session) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی ایزوله‌سازی">
    نشست‌های عامل را در زمان‌اجرای ایزوله‌شده اجرا کنید:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    ابتدا تصویر را بسازید - از یک checkout منبع، `scripts/sandbox-setup.sh` را اجرا کنید، یا از یک نصب npm، دستور درون‌خطی `docker build` را در [ایزوله‌سازی § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) ببینید.

    برای راهنمای کامل، [ایزوله‌سازی](/fa/gateway/sandboxing) و برای همه گزینه‌ها [مرجع کامل](/fa/gateway/config-agents#agentsdefaultssandbox) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی push مبتنی بر relay برای buildهای رسمی iOS">
    push مبتنی بر relay برای buildهای عمومی App Store از relay میزبانی‌شده OpenClaw استفاده می‌کند: `https://ios-push-relay.openclaw.ai`.

    استقرارهای relay سفارشی به یک مسیر build/استقرار iOS عمدا جداگانه نیاز دارند که URL relay آن با URL relay در gateway مطابقت داشته باشد. اگر از یک build relay سفارشی استفاده می‌کنید، این را در پیکربندی gateway تنظیم کنید:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    معادل CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    این کار چه می‌کند:

    - به gateway اجازه می‌دهد `push.test`، تلنگرهای بیدارباش، و بیدارباش‌های اتصال مجدد را از طریق relay خارجی ارسال کند.
    - از یک مجوز ارسال محدود به ثبت‌نام استفاده می‌کند که توسط اپ iOS جفت‌شده منتقل می‌شود. gateway به توکن relay سراسری برای استقرار نیاز ندارد.
    - هر ثبت‌نام مبتنی بر relay را به هویت gateway که اپ iOS با آن جفت شده متصل می‌کند، بنابراین gateway دیگر نمی‌تواند از ثبت‌نام ذخیره‌شده دوباره استفاده کند.
    - buildهای محلی/دستی iOS را روی APNs مستقیم نگه می‌دارد. ارسال‌های مبتنی بر relay فقط برای buildهای رسمی توزیع‌شده‌ای اعمال می‌شوند که از طریق relay ثبت‌نام کرده‌اند.
    - باید با URL پایه relay که در build iOS تعبیه شده مطابقت داشته باشد، تا ترافیک ثبت‌نام و ارسال به همان استقرار relay برسد.

    جریان سرتاسری:

    1. اپ رسمی iOS را نصب کنید.
    2. اختیاری: `gateway.push.apns.relay.baseUrl` را فقط زمانی روی gateway پیکربندی کنید که از یک build relay سفارشی عمدا جداگانه استفاده می‌کنید.
    3. اپ iOS را با gateway جفت کنید و اجازه دهید هر دو نشست نود و اپراتور متصل شوند.
    4. اپ iOS هویت gateway را دریافت می‌کند، با استفاده از App Attest به‌همراه رسید اپ در relay ثبت‌نام می‌کند، و سپس بار `push.apns.register` مبتنی بر relay را در gateway جفت‌شده منتشر می‌کند.
    5. gateway دسته relay و مجوز ارسال را ذخیره می‌کند، سپس از آن‌ها برای `push.test`، تلنگرهای بیدارباش، و بیدارباش‌های اتصال مجدد استفاده می‌کند.

    نکات عملیاتی:

    - اگر اپ iOS را به gateway دیگری منتقل کردید، اپ را دوباره متصل کنید تا بتواند یک ثبت‌نام relay جدیدِ متصل به آن gateway منتشر کند.
    - اگر build جدیدی از iOS منتشر کنید که به استقرار relay متفاوتی اشاره دارد، اپ به‌جای استفاده مجدد از مبدا relay قدیمی، ثبت‌نام relay کش‌شده خود را تازه‌سازی می‌کند.

    نکته سازگاری:

    - `OPENCLAW_APNS_RELAY_BASE_URL` و `OPENCLAW_APNS_RELAY_TIMEOUT_MS` همچنان به‌عنوان بازنویسی‌های موقت env کار می‌کنند.
    - URLهای relay سفارشی gateway باید با URL پایه relay که در build iOS تعبیه شده مطابقت داشته باشند. مسیر انتشار عمومی App Store، بازنویسی‌های URL relay سفارشی iOS را رد می‌کند.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` همچنان یک راه فرار توسعه فقط برای loopback باقی می‌ماند؛ URLهای relay مبتنی بر HTTP را در config پایدار نکنید.

    برای جریان سرتاسری، [اپ iOS](/fa/platforms/ios#relay-backed-push-for-official-builds) و برای مدل امنیتی relay، [جریان احراز هویت و اعتماد](/fa/platforms/ios#authentication-and-trust-flow) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی Heartbeat (بررسی‌های دوره‌ای)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: رشته مدت‌زمان (`30m`، `2h`). برای غیرفعال‌سازی، `0m` را تنظیم کنید.
    - `target`: `last` | `none` | `<channel-id>` (برای مثال `discord`، `matrix`، `telegram`، یا `whatsapp`)
    - `directPolicy`: برای اهداف Heartbeat به سبک DM، `allow` (پیش‌فرض) یا `block`
    - برای راهنمای کامل، [Heartbeat](/fa/gateway/heartbeat) را ببینید.

  </Accordion>

  <Accordion title="پیکربندی کارهای Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: نشست‌های اجرای ایزوله تکمیل‌شده را از `sessions.json` پاک‌سازی می‌کند (پیش‌فرض `24h`؛ برای غیرفعال‌سازی `false` را تنظیم کنید).
    - `runLog`: ردیف‌های تاریخچه اجرای Cron نگه‌داری‌شده را برای هر کار پاک‌سازی می‌کند. `maxBytes` همچنان برای لاگ‌های اجرای قدیمی‌ترِ مبتنی بر فایل پذیرفته می‌شود.
    - برای نمای کلی قابلیت و مثال‌های CLI، [کارهای Cron](/fa/automation/cron-jobs) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی webhooks (hooks)">
    endpointهای HTTP Webhook را روی Gateway فعال کنید:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    نکته امنیتی:
    - همه محتوای payload مربوط به hook/webhook را ورودی غیرقابل اعتماد در نظر بگیرید.
    - از یک `hooks.token` اختصاصی استفاده کنید؛ secretهای فعال احراز هویت Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) را دوباره استفاده نکنید.
    - احراز هویت hook فقط از طریق header است (`Authorization: Bearer ...` یا `x-openclaw-token`)؛ توکن‌های query-string رد می‌شوند.
    - `hooks.path` نمی‌تواند `/` باشد؛ ورودی webhook را روی یک زیرمسیر اختصاصی مانند `/hooks` نگه دارید.
    - flagهای عبور از محتوای ناامن را غیرفعال نگه دارید (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) مگر برای اشکال‌زدایی با دامنه بسیار محدود.
    - اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را نیز تنظیم کنید تا کلیدهای نشست انتخاب‌شده توسط فراخوان محدود شوند.
    - برای عامل‌های هدایت‌شده با hook، tierهای مدل مدرن قوی و سیاست ابزار سخت‌گیرانه را ترجیح دهید (برای مثال فقط پیام‌رسانی به‌همراه ایزوله‌سازی هر جا ممکن است).

    برای همه گزینه‌های نگاشت و یکپارچه‌سازی Gmail، [مرجع کامل](/fa/gateway/configuration-reference#hooks) را ببینید.

  </Accordion>

  <Accordion title="پیکربندی مسیریابی چندعاملی">
    چند عامل ایزوله را با workspaceها و نشست‌های جداگانه اجرا کنید:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    برای قواعد اتصال و پروفایل‌های دسترسی برای هر عامل، [چندعاملی](/fa/concepts/multi-agent) و [مرجع کامل](/fa/gateway/config-agents#multi-agent-routing) را ببینید.

  </Accordion>

  <Accordion title="تقسیم config به چند فایل ($include)">
    از `$include` برای سازمان‌دهی configهای بزرگ استفاده کنید:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **فایل تکی**: شیء دربرگیرنده را جایگزین می‌کند
    - **آرایه‌ای از فایل‌ها**: به‌ترتیب به‌صورت عمیق ادغام می‌شوند (موردهای بعدی برنده‌اند)
    - **کلیدهای هم‌سطح**: پس از includeها ادغام می‌شوند (مقادیر includeشده را بازنویسی می‌کنند)
    - **includeهای تو در تو**: تا عمق 10 سطح پشتیبانی می‌شوند
    - **مسیرهای نسبی**: نسبت به فایلِ includeکننده resolve می‌شوند
    - **فرمت مسیر**: مسیرهای include نباید شامل بایت null باشند و باید پیش و پس از resolve شدن، اکیدا کوتاه‌تر از 4096 کاراکتر باشند
    - **نوشتن‌های مالکیت‌شده توسط OpenClaw**: وقتی یک نوشتن فقط یک بخش سطح‌بالا را تغییر می‌دهد
      که توسط یک include تک‌فایلی مانند `plugins: { $include: "./plugins.json5" }` پشتیبانی می‌شود،
      OpenClaw همان فایل includeشده را به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده باقی می‌گذارد
    - **write-through پشتیبانی‌نشده**: includeهای root، آرایه‌های include، و includeهایی
      با بازنویسی‌های هم‌سطح، برای نوشتن‌های مالکیت‌شده توسط OpenClaw به‌جای
      تخت کردن config، fail closed می‌شوند
    - **محدودسازی**: مسیرهای `$include` باید زیر دایرکتوری نگه‌دارنده
      `openclaw.json` resolve شوند. برای اشتراک‌گذاری یک درخت میان ماشین‌ها یا کاربران، `OPENCLAW_INCLUDE_ROOTS` را روی یک path-list (`:` در POSIX، `;` در Windows) از
      دایرکتوری‌های اضافی تنظیم کنید که includeها می‌توانند به آن‌ها ارجاع دهند. symlinkها resolve
      و دوباره بررسی می‌شوند، بنابراین مسیری که از نظر لغوی در یک دایرکتوری config قرار دارد اما
      مقصد واقعی آن از همه rootهای مجاز خارج می‌شود همچنان رد می‌شود.
    - **مدیریت خطا**: خطاهای روشن برای فایل‌های گم‌شده، خطاهای parse، includeهای چرخه‌ای، فرمت مسیر نامعتبر، و طول بیش از حد

  </Accordion>
</AccordionGroup>

## بارگذاری مجدد داغ config

Gateway فایل `~/.openclaw/openclaw.json` را زیر نظر می‌گیرد و تغییرات را به‌صورت خودکار اعمال می‌کند - برای بیشتر تنظیمات نیازی به راه‌اندازی مجدد دستی نیست.

ویرایش‌های مستقیم فایل تا زمانی که اعتبارسنجی شوند غیرقابل اعتماد در نظر گرفته می‌شوند. ناظر منتظر می‌ماند
تا churn ناشی از temp-write/rename ویرایشگر آرام شود، فایل نهایی را می‌خواند، و
ویرایش‌های خارجی نامعتبر را بدون بازنویسی `openclaw.json` رد می‌کند. نوشتن‌های config
مالکیت‌شده توسط OpenClaw پیش از نوشتن از همان gate schema استفاده می‌کنند؛ clobberهای مخرب مانند
حذف `gateway.mode` یا کوچک کردن فایل به بیش از نصف، رد می‌شوند و
برای بررسی به‌صورت `.rejected.*` ذخیره می‌شوند.

اگر `config reload skipped (invalid config)` را می‌بینید یا startup گزارش `Invalid
config` می‌دهد، config را بررسی کنید، `openclaw config validate` را اجرا کنید، سپس برای تعمیر `openclaw
doctor --fix` را اجرا کنید. برای checklist، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)
را ببینید.

### حالت‌های بارگذاری مجدد

| حالت                   | رفتار                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (پیش‌فرض) | تغییرات امن را فورا به‌صورت داغ اعمال می‌کند. برای موارد حیاتی به‌صورت خودکار راه‌اندازی مجدد می‌کند.           |
| **`hot`**              | فقط تغییرات امن را به‌صورت داغ اعمال می‌کند. وقتی راه‌اندازی مجدد لازم باشد هشدار log می‌کند - مدیریت آن با شماست. |
| **`restart`**          | Gateway را با هر تغییر config، امن یا غیرامن، راه‌اندازی مجدد می‌کند.                                 |
| **`off`**              | نظارت بر فایل را غیرفعال می‌کند. تغییرات در راه‌اندازی مجدد دستی بعدی اعمال می‌شوند.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### چه چیزهایی به‌صورت داغ اعمال می‌شوند و چه چیزهایی به راه‌اندازی مجدد نیاز دارند

بیشتر فیلدها بدون downtime به‌صورت داغ اعمال می‌شوند. در حالت `hybrid`، تغییراتی که به راه‌اندازی مجدد نیاز دارند به‌صورت خودکار مدیریت می‌شوند.

| دسته‌بندی | فیلدها | نیاز به راه‌اندازی مجدد؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| کانال‌ها | `channels.*`، `web` (WhatsApp) - همهٔ کانال‌های داخلی و Plugin | خیر |
| عامل و مدل‌ها | `agent`، `agents`، `models`، `routing` | خیر |
| خودکارسازی | `hooks`، `cron`، `agent.heartbeat` | خیر |
| نشست‌ها و پیام‌ها | `session`، `messages` | خیر |
| ابزارها و رسانه | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk` | خیر |
| UI و متفرقه | `ui`، `logging`، `identity`، `bindings` | خیر |
| سرور Gateway | `gateway.*` (port، bind، auth، tailscale، TLS، HTTP) | **بله** |
| زیرساخت | `discovery`، `plugins` | **بله** |

<Note>
`gateway.reload` و `gateway.remote` استثنا هستند - تغییر آن‌ها راه‌اندازی مجدد را **فعال نمی‌کند**.
</Note>

### برنامه‌ریزی بارگذاری مجدد

وقتی یک فایل منبع را که از طریق `$include` ارجاع داده شده ویرایش می‌کنید، OpenClaw
بارگذاری مجدد را از چیدمان نوشته‌شده در منبع برنامه‌ریزی می‌کند، نه از نمای تخت‌شدهٔ درون حافظه.
این کار تصمیم‌های بارگذاری مجدد داغ (اعمال داغ در برابر راه‌اندازی مجدد) را قابل پیش‌بینی نگه می‌دارد، حتی وقتی یک
بخش سطح‌بالای واحد در فایل include شدهٔ خودش قرار دارد، مانند
`plugins: { $include: "./plugins.json5" }`. اگر چیدمان منبع مبهم باشد، برنامه‌ریزی بارگذاری مجدد به‌صورت بسته شکست می‌خورد.

## RPC پیکربندی (به‌روزرسانی‌های برنامه‌نویسی‌شده)

برای ابزارهایی که پیکربندی را از طریق API Gateway می‌نویسند، این جریان را ترجیح دهید:

- `config.schema.lookup` برای بررسی یک زیردرخت (گره طرح‌وارهٔ سطحی + خلاصه‌های فرزند)
- `config.get` برای دریافت snapshot فعلی به‌همراه `hash`
- `config.patch` برای به‌روزرسانی‌های جزئی (JSON merge patch: آبجکت‌ها merge می‌شوند، `null`
  حذف می‌کند، آرایه‌ها وقتی به‌طور صریح با `replacePaths` تأیید شده باشند جایگزین می‌شوند اگر
  ورودی‌هایی حذف شوند)
- `config.apply` فقط وقتی قصد دارید کل پیکربندی را جایگزین کنید
- `update.run` برای خودبه‌روزرسانی صریح به‌همراه راه‌اندازی مجدد؛ وقتی نشست پس از راه‌اندازی مجدد باید یک نوبت پیگیری اجرا کند، `continuationMessage` را شامل کنید
- `update.status` برای بررسی آخرین نشانگر راه‌اندازی مجددِ به‌روزرسانی و تأیید نسخهٔ در حال اجرا پس از راه‌اندازی مجدد

عامل‌ها باید `config.schema.lookup` را اولین نقطهٔ مراجعه برای مستندات و محدودیت‌های دقیق
در سطح فیلد بدانند. وقتی به نقشهٔ گسترده‌تر پیکربندی، پیش‌فرض‌ها، یا لینک به مراجع اختصاصی
زیرسامانه‌ها نیاز دارند، از [مرجع پیکربندی](/fa/gateway/configuration-reference) استفاده کنید.

<Note>
نوشتن‌های سطح کنترل (`config.apply`، `config.patch`، `update.run`) به
۳ درخواست در هر ۶۰ ثانیه برای هر `deviceId+clientIp` محدود می‌شوند. درخواست‌های راه‌اندازی مجدد
با هم تجمیع می‌شوند و سپس یک دورهٔ انتظار ۳۰ ثانیه‌ای بین چرخه‌های راه‌اندازی مجدد اعمال می‌کنند.
`update.status` فقط‌خواندنی است، اما به مدیر محدود شده، چون نشانگر راه‌اندازی مجدد می‌تواند
شامل خلاصه‌های مراحل به‌روزرسانی و انتهای خروجی فرمان باشد.
</Note>

نمونه patch جزئی:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

هر دو `config.apply` و `config.patch` مقدارهای `raw`، `baseHash`، `sessionKey`،
`note`، و `restartDelayMs` را می‌پذیرند. وقتی پیکربندی از قبل وجود داشته باشد،
`baseHash` برای هر دو روش الزامی است.

`config.patch` همچنین `replacePaths` را می‌پذیرد؛ آرایه‌ای از مسیرهای پیکربندی که جایگزینی آرایهٔ
آن‌ها عمدی است. اگر یک patch بخواهد آرایه‌ای موجود را با ورودی‌های کمتر جایگزین یا حذف کند،
Gateway نوشتن را رد می‌کند مگر اینکه همان مسیر دقیق در `replacePaths` آمده باشد؛ آرایه‌های تو در تو زیر ورودی‌های آرایه از `[]` استفاده می‌کنند، مانند
`agents.list[].skills`. این کار از آن جلوگیری می‌کند که snapshotهای کوتاه‌شدهٔ `config.get`
آرایه‌های مسیریابی یا فهرست مجاز را بی‌صدا بازنویسی کنند. وقتی قصد دارید کل پیکربندی را جایگزین کنید، از `config.apply` استفاده کنید.

## متغیرهای محیطی

OpenClaw متغیرهای محیطی را از فرایند والد به‌همراه موارد زیر می‌خواند:

- `.env` از دایرکتوری کاری فعلی (اگر وجود داشته باشد)
- `~/.openclaw/.env` (fallback سراسری)

هیچ‌کدام از این فایل‌ها متغیرهای محیطی موجود را بازنویسی نمی‌کنند. همچنین می‌توانید متغیرهای محیطی inline را در پیکربندی تنظیم کنید:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="درون‌ریزی env شل (اختیاری)">
  اگر فعال باشد و کلیدهای مورد انتظار تنظیم نشده باشند، OpenClaw شل ورود شما را اجرا می‌کند و فقط کلیدهای مفقود را درون‌ریزی می‌کند:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

معادل متغیر محیطی: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="جایگزینی متغیر محیطی در مقادیر پیکربندی">
  در هر مقدار رشته‌ای پیکربندی، با `${VAR_NAME}` به متغیرهای محیطی ارجاع دهید:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

قواعد:

- فقط نام‌های حروف بزرگ match می‌شوند: `[A-Z_][A-Z0-9_]*`
- متغیرهای مفقود/خالی هنگام load خطا ایجاد می‌کنند
- برای خروجی literal با `$${VAR}` escape کنید
- داخل فایل‌های `$include` کار می‌کند
- جایگزینی inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="ارجاع‌های محرمانه (env، file، exec)">
  برای فیلدهایی که از آبجکت‌های SecretRef پشتیبانی می‌کنند، می‌توانید از این‌ها استفاده کنید:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

جزئیات SecretRef (از جمله `secrets.providers` برای `env`/`file`/`exec`) در [مدیریت اسرار](/fa/gateway/secrets) آمده است.
مسیرهای credential پشتیبانی‌شده در [سطح credential برای SecretRef](/fa/reference/secretref-credential-surface) فهرست شده‌اند.
</Accordion>

برای تقدم کامل و منابع، [محیط](/fa/help/environment) را ببینید.

## مرجع کامل

برای مرجع کامل فیلدبه‌فیلد، **[مرجع پیکربندی](/fa/gateway/configuration-reference)** را ببینید.

---

_مرتبط: [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [مرجع پیکربندی](/fa/gateway/configuration-reference) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
- [runbook Gateway](/fa/gateway)
