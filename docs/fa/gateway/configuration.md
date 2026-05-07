---
read_when:
    - راه‌اندازی OpenClaw برای نخستین بار
    - در حال جست‌وجو برای الگوهای رایج پیکربندی
    - پیمایش به بخش‌های مشخص پیکربندی
summary: 'نمای کلی پیکربندی: کارهای رایج، راه‌اندازی سریع، و پیوندهایی به مرجع کامل'
title: پیکربندی
x-i18n:
    generated_at: "2026-05-07T13:19:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b64a49882b8649280fc4f4e39bf025ccc1bdf6a813b7940a6d57ee857aea5a77
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw یک پیکربندی اختیاری <Tooltip tip="JSON5 از توضیحات و ویرگول‌های انتهایی پشتیبانی می‌کند">**JSON5**</Tooltip> را از `~/.openclaw/openclaw.json` می‌خواند.
مسیر پیکربندی فعال باید یک فایل معمولی باشد. چیدمان‌های `openclaw.json`
که با symlink ساخته شده‌اند برای نوشتن‌های متعلق به OpenClaw پشتیبانی نمی‌شوند؛ نوشتن اتمیک ممکن است
مسیر را به‌جای حفظ symlink جایگزین کند. اگر پیکربندی را خارج از
دایرکتوری وضعیت پیش‌فرض نگه می‌دارید، `OPENCLAW_CONFIG_PATH` را مستقیم به فایل واقعی اشاره دهید.

اگر فایل وجود نداشته باشد، OpenClaw از پیش‌فرض‌های امن استفاده می‌کند. دلایل رایج برای افزودن پیکربندی:

- اتصال کانال‌ها و کنترل اینکه چه کسی می‌تواند به بات پیام بدهد
- تنظیم مدل‌ها، ابزارها، sandboxing، یا خودکارسازی (cron، hookها)
- تنظیم sessionها، رسانه، شبکه، یا UI

برای همه فیلدهای موجود، [مرجع کامل](/fa/gateway/configuration-reference) را ببینید.

عامل‌ها و خودکارسازی باید پیش از ویرایش پیکربندی، برای مستندات دقیق در سطح فیلد
از `config.schema.lookup` استفاده کنند. از این صفحه برای راهنمایی وظیفه‌محور و از
[مرجع پیکربندی](/fa/gateway/configuration-reference) برای نقشه گسترده‌تر
فیلدها و پیش‌فرض‌ها استفاده کنید.

<Tip>
**با پیکربندی تازه‌کار هستید؟** برای راه‌اندازی تعاملی با `openclaw onboard` شروع کنید، یا برای پیکربندی‌های کامل آماده کپی و جای‌گذاری، راهنمای [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) را ببینید.
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
  <Tab title="ویزارد تعاملی">
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
  <Tab title="رابط کاربری کنترل">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) را باز کنید و از زبانه **پیکربندی** استفاده کنید.
    رابط کاربری کنترل، فرمی را از schema پیکربندی زنده نمایش می‌دهد، شامل metadata مستندات فیلدهای
    `title` / `description` به‌همراه schemaهای plugin و کانال در صورت
    موجود بودن، و یک ویرایشگر **JSON خام** به‌عنوان راه خروج. برای UIهای drill-down
    و ابزارهای دیگر، Gateway همچنین `config.schema.lookup` را برای
    دریافت یک node schema محدود به مسیر به‌همراه خلاصه‌های فرزندان بلافصل ارائه می‌کند.
  </Tab>
  <Tab title="ویرایش مستقیم">
    `~/.openclaw/openclaw.json` را مستقیم ویرایش کنید. Gateway فایل را زیر نظر می‌گیرد و تغییرات را خودکار اعمال می‌کند ([بارگذاری مجدد سریع](#config-hot-reload) را ببینید).
  </Tab>
</Tabs>

## اعتبارسنجی سخت‌گیرانه

<Warning>
OpenClaw فقط پیکربندی‌هایی را می‌پذیرد که کاملاً با schema مطابقت داشته باشند. کلیدهای ناشناخته، نوع‌های بدفرم، یا مقدارهای نامعتبر باعث می‌شوند Gateway **از شروع به کار خودداری کند**. تنها استثنای سطح ریشه `$schema` (رشته) است، تا ویرایشگرها بتوانند metadata مربوط به JSON Schema را پیوست کنند.
</Warning>

`openclaw config schema`، JSON Schema مرجعی را چاپ می‌کند که توسط رابط کاربری کنترل
و اعتبارسنجی استفاده می‌شود. `config.schema.lookup` یک node محدود به مسیر به‌همراه
خلاصه‌های فرزندان را برای ابزارهای drill-down دریافت می‌کند. metadata مستندات فیلدهای `title`/`description`
از میان objectهای تو در تو، wildcard (`*`)، آیتم آرایه (`[]`)، و شاخه‌های `anyOf`/
`oneOf`/`allOf` عبور می‌کند. schemaهای runtime plugin و کانال وقتی manifest registry
بارگذاری شده باشد ادغام می‌شوند.

وقتی اعتبارسنجی شکست بخورد:

- Gateway بوت نمی‌شود
- فقط دستورهای تشخیصی کار می‌کنند (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- برای دیدن مشکل‌های دقیق، `openclaw doctor` را اجرا کنید
- برای اعمال تعمیرها، `openclaw doctor --fix` (یا `--yes`) را اجرا کنید

Gateway پس از هر راه‌اندازی موفق، یک نسخه معتبر آخرین-وضعیت-سالم نگه می‌دارد،
اما startup و بارگذاری مجدد سریع آن را خودکار بازگردانی نمی‌کنند. اگر `openclaw.json`
در اعتبارسنجی شکست بخورد (از جمله اعتبارسنجی محلی plugin)، startup Gateway شکست می‌خورد یا
بارگذاری مجدد نادیده گرفته می‌شود و runtime فعلی آخرین پیکربندی پذیرفته‌شده را نگه می‌دارد.
برای تعمیر پیکربندی دارای پیشوند/بازنویسی‌شده یا بازگردانی نسخه آخرین-وضعیت-سالم،
`openclaw doctor --fix` (یا `--yes`) را اجرا کنید. وقتی یک candidate شامل placeholderهای secret ویرایش‌پوشانی‌شده مانند `***` باشد، ارتقا به آخرین-وضعیت-سالم نادیده گرفته می‌شود.

## وظایف رایج

<AccordionGroup>
  <Accordion title="راه‌اندازی یک کانال (WhatsApp، Telegram، Discord، و غیره)">
    هر کانال، بخش پیکربندی خودش را زیر `channels.<provider>` دارد. برای گام‌های راه‌اندازی، صفحه اختصاصی کانال را ببینید:

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

    همه کانال‌ها الگوی سیاست DM یکسانی دارند:

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

    - `agents.defaults.models` کاتالوگ مدل را تعریف می‌کند و به‌عنوان allowlist برای `/model` عمل می‌کند.
    - برای افزودن ورودی‌های allowlist بدون حذف مدل‌های موجود، از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. جایگزینی‌های ساده‌ای که باعث حذف ورودی‌ها شوند رد می‌شوند مگر اینکه `--replace` را بدهید.
    - مرجع‌های مدل از قالب `provider/model` استفاده می‌کنند (مثلاً `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` کوچک‌سازی تصویرهای transcript/tool را کنترل می‌کند (پیش‌فرض `1200`)؛ مقدارهای پایین‌تر معمولاً مصرف vision-token را در اجراهای پر از screenshot کاهش می‌دهند.
    - برای تغییر مدل‌ها در chat، [CLI مدل‌ها](/fa/concepts/models) و برای چرخش auth و رفتار fallback، [Failover مدل](/fa/concepts/model-failover) را ببینید.
    - برای providerهای سفارشی/خودمیزبان، در مرجع [providerهای سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) را ببینید.

  </Accordion>

  <Accordion title="کنترل اینکه چه کسانی می‌توانند به ربات پیام بدهند">
    دسترسی DM برای هر کانال از طریق `dmPolicy` کنترل می‌شود:

    - `"pairing"` (پیش‌فرض): فرستنده‌های ناشناس یک کد جفت‌سازی یک‌بارمصرف برای تأیید دریافت می‌کنند
    - `"allowlist"`: فقط فرستنده‌های موجود در `allowFrom` (یا ذخیره‌گاه مجاز جفت‌شده)
    - `"open"`: همه DMهای ورودی را مجاز می‌کند (نیازمند `allowFrom: ["*"]`)
    - `"disabled"`: همه DMها را نادیده می‌گیرد

    برای گروه‌ها، از `groupPolicy` + `groupAllowFrom` یا allowlistهای مختص کانال استفاده کنید.

    برای جزئیات هر کانال، [مرجع کامل](/fa/gateway/config-channels#dm-and-group-access) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی محدودسازی اشاره در گفت‌وگوی گروهی">
    پیام‌های گروهی به‌طور پیش‌فرض **نیازمند اشاره** هستند. الگوهای فعال‌سازی را برای هر عامل پیکربندی کنید و پاسخ‌های قابل مشاهده اتاق را روی مسیر پیش‌فرض ابزار پیام نگه دارید، مگر اینکه عمداً پاسخ‌های نهایی خودکار قدیمی را بخواهید:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
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

    - **اشاره‌های فراداده‌ای**: @-mentionهای بومی (اشاره با لمس در WhatsApp، ‏Telegram @bot، و غیره)
    - **الگوهای متنی**: الگوهای regex امن در `mentionPatterns`
    - **پاسخ‌های قابل مشاهده**: `messages.visibleReplies` می‌تواند ارسال‌های ابزار پیام را به‌صورت سراسری الزامی کند؛ `messages.groupChat.visibleReplies` این را برای گروه‌ها/کانال‌ها بازنویسی می‌کند.
    - برای حالت‌های پاسخ قابل مشاهده، بازنویسی‌های هر کانال، و حالت گفت‌وگو با خود، [مرجع کامل](/fa/gateway/config-channels#group-chat-mention-gating) را ببینید.

  </Accordion>

  <Accordion title="محدود کردن Skills برای هر عامل">
    از `agents.defaults.skills` برای یک پایه مشترک استفاده کنید، سپس عامل‌های مشخص را با `agents.list[].skills` بازنویسی کنید:

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
    - برای به‌ارث بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
    - برای نداشتن Skills، مقدار `agents.list[].skills: []` را تنظیم کنید.
    - [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و
      [مرجع پیکربندی](/fa/gateway/config-agents#agents-defaults-skills) را ببینید.

  </Accordion>

  <Accordion title="تنظیم پایش سلامت کانال Gateway">
    کنترل کنید Gateway با چه شدتی کانال‌هایی را که کهنه به نظر می‌رسند راه‌اندازی مجدد کند:

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

    - برای غیرفعال کردن راه‌اندازی‌های مجدد پایش سلامت به‌صورت سراسری، `gateway.channelHealthCheckMinutes: 0` را تنظیم کنید.
    - `channelStaleEventThresholdMinutes` باید بزرگ‌تر یا مساوی بازه بررسی باشد.
    - برای غیرفعال کردن راه‌اندازی مجدد خودکار برای یک کانال یا حساب، بدون غیرفعال کردن پایشگر سراسری، از `channels.<provider>.healthMonitor.enabled` یا `channels.<provider>.accounts.<id>.healthMonitor.enabled` استفاده کنید.
    - برای اشکال‌زدایی عملیاتی، [بررسی‌های سلامت](/fa/gateway/health) و برای همه فیلدها، [مرجع کامل](/fa/gateway/configuration-reference#gateway) را ببینید.

  </Accordion>

  <Accordion title="تنظیم مهلت زمانی دست‌دهی WebSocket در Gateway">
    به کلاینت‌های محلی زمان بیشتری بدهید تا دست‌دهی WebSocket پیش از احراز هویت را روی میزبان‌های پربار یا کم‌توان کامل کنند:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - پیش‌فرض `15000` میلی‌ثانیه است.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` همچنان برای بازنویسی‌های موردی سرویس یا shell اولویت دارد.
    - ابتدا رفع توقف‌های راه‌اندازی/حلقه رویداد را ترجیح دهید؛ این تنظیم برای میزبان‌هایی است که سالم هستند اما هنگام گرم‌شدن کند عمل می‌کنند.

  </Accordion>

  <Accordion title="پیکربندی نشست‌ها و بازنشانی‌ها">
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
    - `threadBindings`: پیش‌فرض‌های سراسری برای مسیریابی نشست وابسته به رشته (Discord از `/focus`،‏ `/unfocus`،‏ `/agents`،‏ `/session idle`، و `/session max-age` پشتیبانی می‌کند).
    - برای دامنه‌بندی، پیوندهای هویت، و سیاست ارسال، [مدیریت نشست](/fa/concepts/session) را ببینید.
    - برای همه فیلدها، [مرجع کامل](/fa/gateway/config-agents#session) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی sandboxing">
    جلسه‌های agent را در runtimeهای sandbox ایزوله اجرا کنید:

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

    ابتدا image را بسازید - از یک source checkout، `scripts/sandbox-setup.sh` را اجرا کنید، یا از یک نصب npm، فرمان درون‌خطی `docker build` را در [Sandboxing § Images and setup](/fa/gateway/sandboxing#images-and-setup) ببینید.

    برای راهنمای کامل، [Sandboxing](/fa/gateway/sandboxing) و برای همهٔ گزینه‌ها، [مرجع کامل](/fa/gateway/config-agents#agentsdefaultssandbox) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی push مبتنی بر relay برای buildهای رسمی iOS">
    push مبتنی بر relay در `openclaw.json` پیکربندی می‌شود.

    این را در پیکربندی gateway تنظیم کنید:

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

    - به gateway اجازه می‌دهد `push.test`، تلنگرهای بیدارباش، و بیدارباش‌های اتصال دوباره را از طریق relay خارجی ارسال کند.
    - از یک مجوز ارسال محدود به registration استفاده می‌کند که توسط اپ iOS جفت‌شده فوروارد شده است. gateway به token مربوط به relay در سطح deployment نیاز ندارد.
    - هر registration مبتنی بر relay را به هویت gateway که اپ iOS با آن جفت شده است bind می‌کند، تا gateway دیگری نتواند registration ذخیره‌شده را دوباره استفاده کند.
    - buildهای محلی/دستی iOS را روی APNs مستقیم نگه می‌دارد. ارسال‌های مبتنی بر relay فقط برای buildهای رسمی توزیع‌شده‌ای اعمال می‌شوند که از طریق relay ثبت‌نام کرده‌اند.
    - باید با URL پایهٔ relay که در build رسمی/TestFlight iOS تعبیه شده است منطبق باشد، تا ترافیک registration و send به همان deployment مربوط به relay برسد.

    جریان انتهابه‌انتها:

    1. یک build رسمی/TestFlight iOS نصب کنید که با همان URL پایهٔ relay کامپایل شده باشد.
    2. `gateway.push.apns.relay.baseUrl` را روی gateway پیکربندی کنید.
    3. اپ iOS را با gateway جفت کنید و بگذارید هر دو جلسهٔ node و operator متصل شوند.
    4. اپ iOS هویت gateway را دریافت می‌کند، با استفاده از App Attest همراه با رسید اپ در relay ثبت‌نام می‌کند، و سپس payload مبتنی بر relay مربوط به `push.apns.register` را به gateway جفت‌شده منتشر می‌کند.
    5. gateway، handle و مجوز ارسال relay را ذخیره می‌کند، سپس از آن‌ها برای `push.test`، تلنگرهای بیدارباش، و بیدارباش‌های اتصال دوباره استفاده می‌کند.

    نکته‌های عملیاتی:

    - اگر اپ iOS را به gateway دیگری تغییر دهید، اپ را دوباره متصل کنید تا بتواند registration جدیدی برای relay منتشر کند که به آن gateway bind شده باشد.
    - اگر build جدیدی از iOS منتشر کنید که به deployment دیگری از relay اشاره می‌کند، اپ registration کش‌شدهٔ relay خود را به‌جای استفادهٔ دوباره از origin قدیمی relay تازه‌سازی می‌کند.

    نکتهٔ سازگاری:

    - `OPENCLAW_APNS_RELAY_BASE_URL` و `OPENCLAW_APNS_RELAY_TIMEOUT_MS` همچنان به‌عنوان overrideهای موقت env کار می‌کنند.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` همچنان یک راه فرار توسعهٔ فقط loopback است؛ URLهای HTTP relay را در config ماندگار نکنید.

    برای جریان انتهابه‌انتها [اپ iOS](/fa/platforms/ios#relay-backed-push-for-official-builds) و برای مدل امنیتی relay، [جریان احراز هویت و اعتماد](/fa/platforms/ios#authentication-and-trust-flow) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی Heartbeat (check-inهای دوره‌ای)">
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

    - `every`: رشتهٔ duration (`30m`، `2h`). برای غیرفعال‌سازی، `0m` را تنظیم کنید.
    - `target`: `last` | `none` | `<channel-id>` (برای مثال `discord`، `matrix`، `telegram`، یا `whatsapp`)
    - `directPolicy`: `allow` (پیش‌فرض) یا `block` برای هدف‌های Heartbeat سبک DM
    - برای راهنمای کامل، [Heartbeat](/fa/gateway/heartbeat) را ببینید.

  </Accordion>

  <Accordion title="پیکربندی jobهای Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: جلسه‌های اجرای ایزولهٔ کامل‌شده را از `sessions.json` پاک‌سازی می‌کند (پیش‌فرض `24h`؛ برای غیرفعال‌سازی `false` را تنظیم کنید).
    - `runLog`: فایل `cron/runs/<jobId>.jsonl` را بر اساس اندازه و تعداد خط‌های نگه‌داری‌شده پاک‌سازی می‌کند.
    - برای نمای کلی قابلیت و مثال‌های CLI، [jobهای Cron](/fa/automation/cron-jobs) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی webhooks (hookها)">
    endpointهای HTTP webhook را روی Gateway فعال کنید:

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

    نکتهٔ امنیتی:
    - همهٔ محتوای payload مربوط به hook/webhook را ورودی غیرقابل‌اعتماد تلقی کنید.
    - از یک `hooks.token` اختصاصی استفاده کنید؛ token مشترک Gateway را دوباره استفاده نکنید.
    - احراز هویت hook فقط مبتنی بر header است (`Authorization: Bearer ...` یا `x-openclaw-token`)؛ tokenهای query-string رد می‌شوند.
    - `hooks.path` نمی‌تواند `/` باشد؛ ورودی webhook را روی یک subpath اختصاصی مانند `/hooks` نگه دارید.
    - پرچم‌های bypass برای محتوای ناامن را غیرفعال نگه دارید (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) مگر برای debugging با scope کاملا محدود.
    - اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را هم تنظیم کنید تا کلیدهای جلسهٔ انتخاب‌شده توسط caller محدود شوند.
    - برای agentهای راه‌اندازی‌شده با hook، tierهای مدل مدرن و قوی و سیاست سخت‌گیرانهٔ tool را ترجیح دهید (برای مثال فقط messaging، همراه با sandboxing در صورت امکان).

    برای همهٔ گزینه‌های mapping و integration با Gmail، [مرجع کامل](/fa/gateway/configuration-reference#hooks) را ببینید.

  </Accordion>

  <Accordion title="پیکربندی مسیریابی چند-agent">
    چند agent ایزوله را با workspaceها و sessionهای جداگانه اجرا کنید:

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

    برای قاعده‌های binding و پروفایل‌های دسترسی per-agent، [چند-Agent](/fa/concepts/multi-agent) و [مرجع کامل](/fa/gateway/config-agents#multi-agent-routing) را ببینید.

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

    - **تک فایل**: شیء دربرگیرنده را جایگزین می‌کند
    - **آرایه‌ای از فایل‌ها**: به‌ترتیب deep-merge می‌شود (موردهای بعدی برنده می‌شوند)
    - **کلیدهای sibling**: پس از includeها merge می‌شوند (مقدارهای include‌شده را override می‌کنند)
    - **includeهای تودرتو**: تا عمق ۱۰ سطح پشتیبانی می‌شود
    - **مسیرهای نسبی**: نسبت به فایل include‌کننده resolve می‌شوند
    - **نوشتن‌های متعلق به OpenClaw**: وقتی یک write فقط یک بخش top-level را تغییر می‌دهد
      که با یک include تک‌فایلی مانند `plugins: { $include: "./plugins.json5" }` پشتیبانی می‌شود،
      OpenClaw آن فایل include‌شده را به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد
    - **write-through پشتیبانی‌نشده**: includeهای root، آرایه‌های include، و includeهایی
      با overrideهای sibling برای writeهای متعلق به OpenClaw به‌صورت fail-closed شکست می‌خورند، به‌جای آن‌که
      config را تخت کنند
    - **محدودسازی**: مسیرهای `$include` باید زیر دایرکتوری حاوی
      `openclaw.json` resolve شوند. برای اشتراک‌گذاری یک tree میان ماشین‌ها یا کاربران، `OPENCLAW_INCLUDE_ROOTS`
      را روی یک path-list (`:` در POSIX، `;` در Windows) از
      دایرکتوری‌های اضافی تنظیم کنید که includeها می‌توانند به آن‌ها ارجاع دهند. symlinkها resolve
      و دوباره بررسی می‌شوند، بنابراین مسیری که از نظر lexical در یک config dir قرار دارد اما
      هدف واقعی آن از همهٔ rootهای مجاز خارج می‌شود همچنان رد می‌شود.
    - **مدیریت خطا**: خطاهای روشن برای فایل‌های گمشده، خطاهای parse، و includeهای حلقوی

  </Accordion>
</AccordionGroup>

## بارگذاری مجدد داغ config

Gateway فایل `~/.openclaw/openclaw.json` را watch می‌کند و تغییرها را به‌صورت خودکار اعمال می‌کند - برای بیشتر تنظیمات به restart دستی نیاز نیست.

ویرایش‌های مستقیم فایل تا زمانی که validate نشوند غیرقابل‌اعتماد تلقی می‌شوند. watcher منتظر می‌ماند
تا churn مربوط به temp-write/rename در editor آرام شود، فایل نهایی را می‌خواند، و
ویرایش‌های خارجی نامعتبر را بدون بازنویسی `openclaw.json` رد می‌کند. نوشتن‌های config
متعلق به OpenClaw پیش از نوشتن از همان schema gate استفاده می‌کنند؛ clobberهای مخرب مانند
حذف `gateway.mode` یا کوچک کردن فایل به کمتر از نصف، رد می‌شوند و
برای بررسی به‌صورت `.rejected.*` ذخیره می‌شوند.

اگر `config reload skipped (invalid config)` را دیدید یا startup، `Invalid
config` گزارش کرد، config را بررسی کنید، `openclaw config validate` را اجرا کنید، سپس برای repair، `openclaw
doctor --fix` را اجرا کنید. برای checklist، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)
را ببینید.

### حالت‌های reload

| حالت                   | رفتار                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (پیش‌فرض) | تغییرهای امن را فورا به‌صورت داغ اعمال می‌کند. برای تغییرهای حیاتی به‌صورت خودکار restart می‌کند.           |
| **`hot`**              | فقط تغییرهای امن را به‌صورت داغ اعمال می‌کند. وقتی restart لازم باشد warning ثبت می‌کند - مدیریت آن با شماست. |
| **`restart`**          | Gateway را با هر تغییر config، چه امن چه ناامن، restart می‌کند.                                 |
| **`off`**              | file watching را غیرفعال می‌کند. تغییرها در restart دستی بعدی اعمال می‌شوند.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### چه چیزهایی به‌صورت داغ اعمال می‌شوند و چه چیزهایی به restart نیاز دارند

بیشتر fieldها بدون downtime به‌صورت داغ اعمال می‌شوند. در حالت `hybrid`، تغییرهای نیازمند restart به‌صورت خودکار مدیریت می‌شوند.

| دسته‌بندی            | fieldها                                                            | restart لازم است؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| کانال‌ها            | `channels.*`، `web` (WhatsApp) - همهٔ کانال‌های built-in و Plugin | خیر              |
| agent و مدل‌ها      | `agent`، `agents`، `models`، `routing`                            | خیر              |
| Automation          | `hooks`، `cron`، `agent.heartbeat`                                | خیر              |
| Sessionها و پیام‌ها | `session`، `messages`                                             | خیر              |
| Toolها و media      | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk`              | خیر              |
| UI و موارد متفرقه   | `ui`، `logging`، `identity`، `bindings`                           | خیر              |
| سرور Gateway        | `gateway.*` (port، bind، auth، tailscale، TLS، HTTP)              | **بله**         |
| Infrastructure      | `discovery`، `plugins`                                            | **بله**         |

<Note>
`gateway.reload` و `gateway.remote` استثنا هستند - تغییر آن‌ها restart را trigger نمی‌کند.
</Note>

### برنامه‌ریزی reload

وقتی یک فایل منبع را که از طریق `$include` ارجاع داده شده ویرایش می‌کنید، OpenClaw
بارگذاری مجدد را بر اساس چیدمان نوشته‌شده در منبع برنامه‌ریزی می‌کند، نه نمای تخت‌شده‌ی درون‌حافظه‌ای.
این کار تصمیم‌های بارگذاری گرم (اعمال گرم در برابر راه‌اندازی مجدد) را قابل پیش‌بینی نگه می‌دارد، حتی وقتی
یک بخش سطح‌بالای واحد در فایل include شده‌ی خودش قرار دارد، مانند
`plugins: { $include: "./plugins.json5" }`. اگر چیدمان منبع مبهم باشد، برنامه‌ریزی بارگذاری مجدد به‌صورت بسته شکست می‌خورد.

## RPC پیکربندی (به‌روزرسانی‌های برنامه‌نویسی‌شده)

برای ابزارهایی که پیکربندی را از طریق API Gateway می‌نویسند، این جریان را ترجیح دهید:

- `config.schema.lookup` برای بررسی یک زیردرخت (گره سطحی schema + خلاصه‌های فرزند)
- `config.get` برای دریافت snapshot فعلی به‌همراه `hash`
- `config.patch` برای به‌روزرسانی‌های جزئی (JSON merge patch: اشیا merge می‌شوند، `null`
  حذف می‌کند، آرایه‌ها جایگزین می‌شوند)
- `config.apply` فقط وقتی قصد دارید کل پیکربندی را جایگزین کنید
- `update.run` برای خودبه‌روزرسانی صریح به‌همراه راه‌اندازی مجدد؛ وقتی نشست پس از راه‌اندازی مجدد باید یک نوبت پیگیری اجرا کند، `continuationMessage` را اضافه کنید
- `update.status` برای بررسی آخرین sentinel راه‌اندازی مجدد به‌روزرسانی و تأیید نسخه در حال اجرا پس از راه‌اندازی مجدد

عامل‌ها باید `config.schema.lookup` را نخستین محل مراجعه برای مستندات و محدودیت‌های دقیق
در سطح فیلد بدانند. وقتی به نگاشت گسترده‌تر پیکربندی، پیش‌فرض‌ها، یا پیوندها به مرجع‌های اختصاصی
زیرسامانه نیاز دارند، از [مرجع پیکربندی](/fa/gateway/configuration-reference)
استفاده کنید.

<Note>
نوشتن‌های control-plane (`config.apply`, `config.patch`, `update.run`) به
۳ درخواست در هر ۶۰ ثانیه برای هر `deviceId+clientIp` محدود می‌شوند. درخواست‌های راه‌اندازی مجدد
ادغام می‌شوند و سپس یک cooldown سی‌ثانیه‌ای بین چرخه‌های راه‌اندازی مجدد اعمال می‌کنند.
`update.status` فقط خواندنی است، اما در محدوده admin قرار دارد، چون sentinel راه‌اندازی مجدد می‌تواند
شامل خلاصه‌های گام‌های به‌روزرسانی و انتهای خروجی فرمان باشد.
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
`note`، و `restartDelayMs` را می‌پذیرند. وقتی پیکربندی از قبل وجود داشته باشد، `baseHash`
برای هر دو روش الزامی است.

## متغیرهای محیطی

OpenClaw متغیرهای env را از پردازه والد به‌علاوه موارد زیر می‌خواند:

- `.env` از دایرکتوری کاری فعلی (اگر وجود داشته باشد)
- `~/.openclaw/.env` (fallback سراسری)

هیچ‌کدام از این فایل‌ها متغیرهای env موجود را بازنویسی نمی‌کنند. همچنین می‌توانید متغیرهای env درون‌خطی را در پیکربندی تنظیم کنید:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  اگر فعال باشد و کلیدهای مورد انتظار تنظیم نشده باشند، OpenClaw login shell شما را اجرا می‌کند و فقط کلیدهای مفقود را import می‌کند:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

معادل متغیر env: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  در هر مقدار رشته‌ای پیکربندی، با `${VAR_NAME}` به متغیرهای env ارجاع دهید:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

قواعد:

- فقط نام‌های حروف بزرگ تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`
- متغیرهای مفقود/خالی در زمان بارگذاری خطا ایجاد می‌کنند
- برای خروجی literal با `$${VAR}` escape کنید
- داخل فایل‌های `$include` کار می‌کند
- جایگزینی درون‌خطی: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
  برای فیلدهایی که از اشیای SecretRef پشتیبانی می‌کنند، می‌توانید از این موارد استفاده کنید:

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

جزئیات SecretRef (از جمله `secrets.providers` برای `env`/`file`/`exec`) در [مدیریت secrets](/fa/gateway/secrets) آمده است.
مسیرهای credential پشتیبانی‌شده در [سطح credential در SecretRef](/fa/reference/secretref-credential-surface) فهرست شده‌اند.
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
