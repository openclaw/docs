---
read_when:
    - راه‌اندازی OpenClaw برای نخستین بار
    - در حال جست‌وجوی الگوهای رایج پیکربندی
    - رفتن به بخش‌های مشخص پیکربندی
summary: 'نمای کلی پیکربندی: کارهای رایج، راه‌اندازی سریع و پیوندهایی به مرجع کامل'
title: پیکربندی
x-i18n:
    generated_at: "2026-05-03T21:33:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: e27ef442d6375d8c22715f20194fb9ce50130204377c9ba4652c2949de28967c
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw پیکربندی اختیاری <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> را از `~/.openclaw/openclaw.json` می‌خواند.
مسیر پیکربندی فعال باید یک فایل عادی باشد. چیدمان‌های `openclaw.json` که به‌صورت symlink هستند
برای نوشتن‌های تحت مالکیت OpenClaw پشتیبانی نمی‌شوند؛ یک نوشتن اتمیک ممکن است
به‌جای حفظ symlink، مسیر را جایگزین کند. اگر پیکربندی را بیرون از
دایرکتوری حالت پیش‌فرض نگه می‌دارید، `OPENCLAW_CONFIG_PATH` را مستقیماً به فایل واقعی اشاره دهید.

اگر فایل وجود نداشته باشد، OpenClaw از پیش‌فرض‌های امن استفاده می‌کند. دلایل رایج برای افزودن پیکربندی:

- اتصال کانال‌ها و کنترل اینکه چه کسانی می‌توانند به بات پیام بدهند
- تنظیم مدل‌ها، ابزارها، sandboxing یا اتوماسیون (cron، hookها)
- تنظیم دقیق نشست‌ها، رسانه، شبکه یا UI

برای همه فیلدهای موجود، [مرجع کامل](/fa/gateway/configuration-reference) را ببینید.

عامل‌ها و اتوماسیون باید پیش از ویرایش پیکربندی، برای مستندات دقیق در سطح فیلد
از `config.schema.lookup` استفاده کنند. از این صفحه برای راهنمایی وظیفه‌محور و
از [مرجع پیکربندی](/fa/gateway/configuration-reference) برای نقشه گسترده‌تر
فیلدها و پیش‌فرض‌ها استفاده کنید.

<Tip>
**تازه با پیکربندی شروع کرده‌اید؟** برای راه‌اندازی تعاملی با `openclaw onboard` شروع کنید، یا برای پیکربندی‌های کامل قابل کپی‌پیست، راهنمای [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) را ببینید.
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
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) را باز کنید و از زبانه **Config** استفاده کنید.
    Control UI از schema پیکربندی زنده یک فرم نمایش می‌دهد، شامل فراداده مستندات
    `title` / `description` برای فیلدها، به‌همراه schemaهای Plugin و کانال در صورت
    موجود بودن، و یک ویرایشگر **Raw JSON** به‌عنوان راه خروج. برای UIهای
    drill-down و ابزارهای دیگر، gateway همچنین `config.schema.lookup` را ارائه می‌کند تا
    یک گره schema محدود به مسیر به‌همراه خلاصه فرزندان مستقیم را دریافت کند.
  </Tab>
  <Tab title="Direct edit">
    `~/.openclaw/openclaw.json` را مستقیماً ویرایش کنید. Gateway فایل را زیر نظر می‌گیرد و تغییرات را به‌صورت خودکار اعمال می‌کند (ببینید: [بارگذاری مجدد داغ](#config-hot-reload)).
  </Tab>
</Tabs>

## اعتبارسنجی سخت‌گیرانه

<Warning>
OpenClaw فقط پیکربندی‌هایی را می‌پذیرد که کاملاً با schema منطبق باشند. کلیدهای ناشناخته، نوع‌های نامعتبر یا مقدارهای نامعتبر باعث می‌شوند Gateway **از شروع به کار خودداری کند**. تنها استثنای سطح ریشه `$schema` (رشته) است، تا ویرایشگرها بتوانند فراداده JSON Schema را متصل کنند.
</Warning>

`openclaw config schema`، JSON Schema مرجع مورد استفاده Control UI
و اعتبارسنجی را چاپ می‌کند. `config.schema.lookup` یک گره محدود به مسیر
به‌همراه خلاصه فرزندان را برای ابزارهای drill-down دریافت می‌کند. فراداده مستندات
`title`/`description` فیلدها در آبجکت‌های تو در تو، wildcard (`*`)، آیتم‌های آرایه (`[]`) و شاخه‌های `anyOf`/
`oneOf`/`allOf` حفظ می‌شود. schemaهای runtime مربوط به Plugin و کانال زمانی ادغام می‌شوند که
رجیستری manifest بارگذاری شده باشد.

وقتی اعتبارسنجی شکست بخورد:

- Gateway بوت نمی‌شود
- فقط فرمان‌های عیب‌یابی کار می‌کنند (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- برای دیدن مشکلات دقیق، `openclaw doctor` را اجرا کنید
- برای اعمال تعمیرات، `openclaw doctor --fix` (یا `--yes`) را اجرا کنید

Gateway پس از هر راه‌اندازی موفق، یک نسخه قابل اعتماد از آخرین پیکربندی سالم نگه می‌دارد،
اما startup و hot reload آن را به‌صورت خودکار بازیابی نمی‌کنند. اگر `openclaw.json`
اعتبارسنجی را رد کند (از جمله اعتبارسنجی محلی Plugin)، startup Gateway شکست می‌خورد یا
reload رد می‌شود و runtime فعلی آخرین پیکربندی پذیرفته‌شده را نگه می‌دارد.
برای تعمیر پیکربندی prefixed/clobbered یا بازیابی آخرین نسخه سالم شناخته‌شده،
`openclaw doctor --fix` (یا `--yes`) را اجرا کنید. اگر یک candidate شامل placeholderهای secret ویرایش‌شده مانند `***` باشد، ارتقا به آخرین نسخه سالم شناخته‌شده رد می‌شود.

## کارهای رایج

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    هر کانال بخش پیکربندی خودش را زیر `channels.<provider>` دارد. برای مراحل راه‌اندازی، صفحه اختصاصی کانال را ببینید:

    - [WhatsApp](/fa/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/fa/channels/telegram) — `channels.telegram`
    - [Discord](/fa/channels/discord) — `channels.discord`
    - [Feishu](/fa/channels/feishu) — `channels.feishu`
    - [Google Chat](/fa/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/fa/channels/msteams) — `channels.msteams`
    - [Slack](/fa/channels/slack) — `channels.slack`
    - [Signal](/fa/channels/signal) — `channels.signal`
    - [iMessage](/fa/channels/imessage) — `channels.imessage`
    - [Mattermost](/fa/channels/mattermost) — `channels.mattermost`

    همه کانال‌ها از الگوی یکسان سیاست DM استفاده می‌کنند:

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

  <Accordion title="Choose and configure models">
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
    - برای افزودن ورودی‌های allowlist بدون حذف مدل‌های موجود، از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. جایگزینی‌های ساده که باعث حذف ورودی‌ها شوند، رد می‌شوند مگر اینکه `--replace` را پاس بدهید.
    - ارجاع‌های مدل از قالب `provider/model` استفاده می‌کنند (مثلاً `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` کوچک‌سازی تصویرهای transcript/tool را کنترل می‌کند (پیش‌فرض `1200`)؛ مقدارهای کمتر معمولاً مصرف vision-token را در اجراهای دارای screenshot زیاد کاهش می‌دهند.
    - برای تغییر مدل‌ها در chat، [CLI مدل‌ها](/fa/concepts/models) و برای چرخش auth و رفتار fallback، [Failover مدل](/fa/concepts/model-failover) را ببینید.
    - برای providerهای سفارشی/خودمیزبان، در مرجع، [Providerهای سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) را ببینید.

  </Accordion>

  <Accordion title="Control who can message the bot">
    دسترسی DM برای هر کانال از طریق `dmPolicy` کنترل می‌شود:

    - `"pairing"` (پیش‌فرض): فرستنده‌های ناشناس یک کد pairing یک‌بارمصرف برای تأیید دریافت می‌کنند
    - `"allowlist"`: فقط فرستنده‌های موجود در `allowFrom` (یا مخزن allow جفت‌شده)
    - `"open"`: اجازه به همه DMهای ورودی (نیازمند `allowFrom: ["*"]`)
    - `"disabled"`: نادیده گرفتن همه DMها

    برای گروه‌ها، از `groupPolicy` + `groupAllowFrom` یا allowlistهای مخصوص کانال استفاده کنید.

    برای جزئیات هر کانال، [مرجع کامل](/fa/gateway/config-channels#dm-and-group-access) را ببینید.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    پیام‌های گروه به‌صورت پیش‌فرض **نیازمند mention** هستند. الگوهای trigger را برای هر عامل پیکربندی کنید، و پاسخ‌های قابل مشاهده اتاق را روی مسیر پیش‌فرض ابزار پیام نگه دارید مگر اینکه عمداً پاسخ‌های نهایی خودکار legacy را بخواهید:

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

    - **Metadata mentions**: @-mentionهای بومی (mention با ضربه در WhatsApp، `@bot` در Telegram و غیره)
    - **Text patterns**: الگوهای regex امن در `mentionPatterns`
    - **Visible replies**: `messages.visibleReplies` می‌تواند ارسال‌های message-tool را به‌صورت سراسری الزامی کند؛ `messages.groupChat.visibleReplies` آن را برای گروه‌ها/کانال‌ها override می‌کند.
    - برای حالت‌های پاسخ قابل مشاهده، overrideهای هر کانال و حالت self-chat، [مرجع کامل](/fa/gateway/config-channels#group-chat-mention-gating) را ببینید.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    برای یک baseline مشترک از `agents.defaults.skills` استفاده کنید، سپس عامل‌های مشخص را با `agents.list[].skills` override کنید:

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

    - برای Skills بدون محدودیت به‌صورت پیش‌فرض، `agents.defaults.skills` را حذف کنید.
    - برای ارث‌بری از پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
    - برای نداشتن Skills، `agents.list[].skills: []` را تنظیم کنید.
    - [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و
      [مرجع پیکربندی](/fa/gateway/config-agents#agents-defaults-skills) را ببینید.

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
    کنترل کنید gateway با چه شدتی کانال‌هایی را که stale به نظر می‌رسند restart کند:

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
    - برای غیرفعال کردن restartهای خودکار برای یک کانال یا account بدون غیرفعال کردن monitor سراسری، از `channels.<provider>.healthMonitor.enabled` یا `channels.<provider>.accounts.<id>.healthMonitor.enabled` استفاده کنید.
    - برای عیب‌یابی عملیاتی، [بررسی‌های سلامت](/fa/gateway/health) و برای همه فیلدها، [مرجع کامل](/fa/gateway/configuration-reference#gateway) را ببینید.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    به clientهای محلی زمان بیشتری بدهید تا handshake پیش از auth مربوط به WebSocket را روی
    میزبان‌های پربار یا کم‌توان کامل کنند:

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

  <Accordion title="Configure sessions and resets">
    نشست‌ها پیوستگی و جداسازی گفتگو را کنترل می‌کنند:

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
    - `threadBindings`: پیش‌فرض‌های سراسری برای مسیریابی نشست‌های وابسته به thread (Discord از `/focus`، `/unfocus`، `/agents`، `/session idle` و `/session max-age` پشتیبانی می‌کند).
    - برای scoping، لینک‌های هویتی و سیاست ارسال، [مدیریت نشست](/fa/concepts/session) را ببینید.
    - برای همه فیلدها، [مرجع کامل](/fa/gateway/config-agents#session) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی sandboxing">
    نشست‌های agent را در runtimeهای sandbox ایزوله اجرا کنید:

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

    ابتدا image را بسازید — از یک checkout منبع، `scripts/sandbox-setup.sh` را اجرا کنید، یا از نصب npm، دستور درون‌خطی `docker build` را در [Sandboxing § Images and setup](/fa/gateway/sandboxing#images-and-setup) ببینید.

    برای راهنمای کامل [Sandboxing](/fa/gateway/sandboxing) و برای همه گزینه‌ها [مرجع کامل](/fa/gateway/config-agents#agentsdefaultssandbox) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی push مبتنی بر relay برای buildهای رسمی iOS">
    push مبتنی بر relay در `openclaw.json` پیکربندی می‌شود.

    این را در پیکربندی Gateway تنظیم کنید:

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

    - به Gateway اجازه می‌دهد `push.test`، تلنگرهای بیدارباش، و بیدارباش‌های اتصال مجدد را از طریق relay خارجی ارسال کند.
    - از یک مجوز ارسال محدود به ثبت استفاده می‌کند که app جفت‌شده iOS آن را forward می‌کند. Gateway به token relay در سطح deployment نیاز ندارد.
    - هر ثبت مبتنی بر relay را به هویت Gateway که app iOS با آن جفت شده متصل می‌کند، بنابراین Gateway دیگری نمی‌تواند ثبت ذخیره‌شده را دوباره استفاده کند.
    - buildهای محلی/دستی iOS را روی APNs مستقیم نگه می‌دارد. ارسال‌های مبتنی بر relay فقط برای buildهای توزیع‌شده رسمی اعمال می‌شوند که از طریق relay ثبت شده‌اند.
    - باید با URL پایه relay که در build رسمی/TestFlight iOS تعبیه شده مطابقت داشته باشد، تا ترافیک ثبت و ارسال به همان deployment relay برسد.

    جریان end-to-end:

    1. یک build رسمی/TestFlight iOS نصب کنید که با همان URL پایه relay کامپایل شده باشد.
    2. `gateway.push.apns.relay.baseUrl` را روی Gateway پیکربندی کنید.
    3. app iOS را با Gateway جفت کنید و اجازه دهید هر دو نشست node و operator وصل شوند.
    4. app iOS هویت Gateway را دریافت می‌کند، با استفاده از App Attest همراه با app receipt در relay ثبت می‌شود، و سپس payload مبتنی بر relay `push.apns.register` را در Gateway جفت‌شده منتشر می‌کند.
    5. Gateway handle و مجوز ارسال relay را ذخیره می‌کند، سپس از آن‌ها برای `push.test`، تلنگرهای بیدارباش، و بیدارباش‌های اتصال مجدد استفاده می‌کند.

    نکات عملیاتی:

    - اگر app iOS را به Gateway دیگری تغییر دهید، app را دوباره وصل کنید تا بتواند ثبت relay جدیدی منتشر کند که به آن Gateway متصل است.
    - اگر build جدیدی از iOS منتشر کنید که به deployment relay متفاوتی اشاره دارد، app به‌جای استفاده دوباره از مبدا relay قدیمی، ثبت relay cache‌شده خود را تازه‌سازی می‌کند.

    نکته سازگاری:

    - `OPENCLAW_APNS_RELAY_BASE_URL` و `OPENCLAW_APNS_RELAY_TIMEOUT_MS` همچنان به‌عنوان overrideهای موقت env کار می‌کنند.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` همچنان یک راه خروج توسعه فقط برای loopback است؛ URLهای relay مبتنی بر HTTP را در پیکربندی پایدار نکنید.

    برای جریان end-to-end، [app iOS](/fa/platforms/ios#relay-backed-push-for-official-builds) و برای مدل امنیتی relay، [جریان احراز هویت و اعتماد](/fa/platforms/ios#authentication-and-trust-flow) را ببینید.

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

    - `every`: رشته مدت‌زمان (`30m`، `2h`). برای غیرفعال‌سازی، `0m` را تنظیم کنید.
    - `target`: `last` | `none` | `<channel-id>` (برای مثال `discord`، `matrix`، `telegram`، یا `whatsapp`)
    - `directPolicy`: برای هدف‌های Heartbeat از نوع DM، `allow` (پیش‌فرض) یا `block`
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

    - `sessionRetention`: نشست‌های اجرای ایزوله تکمیل‌شده را از `sessions.json` پاک‌سازی می‌کند (پیش‌فرض `24h`؛ برای غیرفعال‌سازی `false` را تنظیم کنید).
    - `runLog`: `cron/runs/<jobId>.jsonl` را بر اساس اندازه و خط‌های نگه‌داشته‌شده پاک‌سازی می‌کند.
    - برای مرور قابلیت و مثال‌های CLI، [jobهای Cron](/fa/automation/cron-jobs) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی Webhookها (hookها)">
    endpointهای Webhook HTTP را روی Gateway فعال کنید:

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
    - همه محتوای payload مربوط به hook/webhook را ورودی نامطمئن در نظر بگیرید.
    - از `hooks.token` اختصاصی استفاده کنید؛ token مشترک Gateway را دوباره استفاده نکنید.
    - احراز هویت hook فقط از طریق header است (`Authorization: Bearer ...` یا `x-openclaw-token`)؛ tokenهای query-string رد می‌شوند.
    - `hooks.path` نمی‌تواند `/` باشد؛ ورود Webhook را روی یک subpath اختصاصی مثل `/hooks` نگه دارید.
    - flagهای bypass محتوای ناامن (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) را غیرفعال نگه دارید، مگر برای اشکال‌زدایی با دامنه بسیار محدود.
    - اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را هم تنظیم کنید تا session keyهای انتخاب‌شده توسط فراخواننده محدود شوند.
    - برای agentهای hook-driven، tierهای model مدرن و قوی و سیاست سخت‌گیرانه ابزار را ترجیح دهید (برای مثال فقط پیام‌رسانی به‌همراه sandboxing در صورت امکان).

    برای همه گزینه‌های mapping و ادغام Gmail، [مرجع کامل](/fa/gateway/configuration-reference#hooks) را ببینید.

  </Accordion>

  <Accordion title="پیکربندی routing چند-agent">
    چند agent ایزوله را با workspaceها و نشست‌های جداگانه اجرا کنید:

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

    برای قواعد binding و profileهای دسترسی per-agent، [چند-Agent](/fa/concepts/multi-agent) و [مرجع کامل](/fa/gateway/config-agents#multi-agent-routing) را ببینید.

  </Accordion>

  <Accordion title="تقسیم پیکربندی به چند فایل ($include)">
    برای سازمان‌دهی پیکربندی‌های بزرگ از `$include` استفاده کنید:

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

    - **تک فایل**: object دربرگیرنده را جایگزین می‌کند
    - **آرایه‌ای از فایل‌ها**: به‌ترتیب deep-merge می‌شوند (مورد بعدی برنده است)
    - **کلیدهای sibling**: پس از includeها merge می‌شوند (مقادیر include‌شده را override می‌کنند)
    - **includeهای nested**: تا عمق ۱۰ سطح پشتیبانی می‌شوند
    - **مسیرهای نسبی**: نسبت به فایل includeکننده resolve می‌شوند
    - **نوشتن‌های متعلق به OpenClaw**: وقتی یک نوشتن فقط یک بخش top-level را تغییر می‌دهد
      که با یک single-file include مانند `plugins: { $include: "./plugins.json5" }` پشتیبانی می‌شود،
      OpenClaw همان فایل include‌شده را به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد
    - **write-through پشتیبانی‌نشده**: root includeها، آرایه‌های include، و includeهایی
      با overrideهای sibling برای نوشتن‌های متعلق به OpenClaw به‌صورت fail closed عمل می‌کنند، به‌جای اینکه
      پیکربندی را flatten کنند
    - **محدودسازی**: مسیرهای `$include` باید زیر directory نگهدارنده
      `openclaw.json` resolve شوند. برای اشتراک‌گذاری یک tree بین ماشین‌ها یا کاربران، `OPENCLAW_INCLUDE_ROOTS` را به یک path-list (`:` در POSIX، `;` در Windows) از
      directoryهای اضافی تنظیم کنید که includeها می‌توانند به آن‌ها ارجاع دهند. symlinkها resolve
      و دوباره بررسی می‌شوند، بنابراین مسیری که از نظر lexical در یک directory پیکربندی قرار دارد اما
      target واقعی آن از همه rootهای مجاز خارج می‌شود همچنان رد می‌شود.
    - **مدیریت خطا**: خطاهای روشن برای فایل‌های گمشده، خطاهای parse، و includeهای circular

  </Accordion>
</AccordionGroup>

## reload داغ پیکربندی

Gateway فایل `~/.openclaw/openclaw.json` را watch می‌کند و تغییرات را به‌صورت خودکار اعمال می‌کند — برای بیشتر تنظیمات، restart دستی لازم نیست.

ویرایش‌های مستقیم فایل تا زمان validate شدن نامطمئن در نظر گرفته می‌شوند. watcher منتظر می‌ماند
تا churn مربوط به temp-write/rename ویرایشگر آرام شود، فایل نهایی را می‌خواند، و
ویرایش‌های خارجی نامعتبر را بدون بازنویسی `openclaw.json` رد می‌کند. نوشتن‌های پیکربندی
متعلق به OpenClaw پیش از نوشتن از همان schema gate استفاده می‌کنند؛ clobberهای مخرب مانند
حذف `gateway.mode` یا کوچک کردن فایل به کمتر از نصف، رد می‌شوند و
برای بررسی به‌صورت `.rejected.*` ذخیره می‌شوند.

اگر `config reload skipped (invalid config)` را می‌بینید یا startup گزارش `Invalid
config` می‌دهد، پیکربندی را بررسی کنید، `openclaw config validate` را اجرا کنید، سپس برای repair، `openclaw
doctor --fix` را اجرا کنید. برای checklist، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)
را ببینید.

### حالت‌های reload

| حالت                   | رفتار                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (پیش‌فرض) | تغییرات امن را فوراً به‌صورت داغ اعمال می‌کند. برای موارد بحرانی به‌صورت خودکار restart می‌کند.           |
| **`hot`**              | فقط تغییرات امن را به‌صورت داغ اعمال می‌کند. وقتی restart لازم باشد warning ثبت می‌کند — مدیریت آن با شماست. |
| **`restart`**          | با هر تغییر پیکربندی، چه امن چه غیرامن، Gateway را restart می‌کند.                                 |
| **`off`**              | file watching را غیرفعال می‌کند. تغییرات در restart دستی بعدی اعمال می‌شوند.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### چه چیزهایی hot-apply می‌شوند و چه چیزهایی به restart نیاز دارند

بیشتر فیلدها بدون downtime به‌صورت داغ اعمال می‌شوند. در حالت `hybrid`، تغییراتی که نیازمند restart هستند به‌صورت خودکار مدیریت می‌شوند.

| دسته‌بندی            | فیلدها                                                            | restart لازم است؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Channelها            | `channels.*`, `web` (WhatsApp) — همه channelهای داخلی و Plugin | خیر              |
| Agent و modelها      | `agent`, `agents`, `models`, `routing`                            | خیر              |
| اتوماسیون          | `hooks`, `cron`, `agent.heartbeat`                                | خیر              |
| نشست‌ها و پیام‌ها | `session`, `messages`                                             | خیر              |
| ابزارها و رسانه       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | خیر              |
| UI و موارد متفرقه           | `ui`, `logging`, `identity`, `bindings`                           | خیر              |
| سرور Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **بله**         |
| زیرساخت      | `discovery`, `canvasHost`, `plugins`                              | **بله**         |

<Note>
`gateway.reload` و `gateway.remote` استثنا هستند — تغییر آن‌ها باعث restart نمی‌شود.
</Note>

### برنامه‌ریزی reload

وقتی یک فایل منبع را که از طریق `$include` ارجاع شده ویرایش می‌کنید، OpenClaw
بازبارگذاری را از چیدمان نوشته‌شده در منبع برنامه‌ریزی می‌کند، نه از نمای تخت‌شدهٔ درون حافظه.
این کار تصمیم‌های بارگذاری داغ (اعمال داغ در برابر راه‌اندازی دوباره) را حتی وقتی یک
بخش سطح‌بالای واحد در فایل جداگانهٔ واردشدهٔ خودش قرار دارد، مانند
`plugins: { $include: "./plugins.json5" }`، قابل پیش‌بینی نگه می‌دارد. اگر
چیدمان منبع مبهم باشد، برنامه‌ریزی بازبارگذاری به‌صورت بسته شکست می‌خورد.

## RPC پیکربندی (به‌روزرسانی‌های برنامه‌ای)

برای ابزارهایی که پیکربندی را از طریق API Gateway می‌نویسند، این جریان را ترجیح دهید:

- `config.schema.lookup` برای بررسی یک زیردرخت (گره طرح‌وارهٔ کم‌عمق + خلاصه‌های فرزند)
- `config.get` برای دریافت snapshot فعلی به‌همراه `hash`
- `config.patch` برای به‌روزرسانی‌های جزئی (وصلهٔ ادغام JSON: اشیا ادغام می‌شوند، `null`
  حذف می‌کند، آرایه‌ها جایگزین می‌شوند)
- `config.apply` فقط وقتی قصد دارید کل پیکربندی را جایگزین کنید
- `update.run` برای خودبه‌روزرسانی صریح به‌همراه راه‌اندازی دوباره؛ وقتی جلسهٔ پس از راه‌اندازی دوباره باید یک نوبت پیگیری اجرا کند، `continuationMessage` را وارد کنید
- `update.status` برای بررسی آخرین sentinel راه‌اندازی دوبارهٔ به‌روزرسانی و تأیید نسخهٔ در حال اجرا پس از راه‌اندازی دوباره

Agentها باید `config.schema.lookup` را نخستین مقصد برای مستندات و محدودیت‌های دقیق
در سطح فیلد بدانند. وقتی به نقشهٔ گسترده‌تر پیکربندی، پیش‌فرض‌ها، یا پیوندهای ارجاع‌های
اختصاصی زیرسیستم نیاز دارند، از [مرجع پیکربندی](/fa/gateway/configuration-reference)
استفاده کنید.

<Note>
نوشتن‌های صفحهٔ کنترل (`config.apply`، `config.patch`، `update.run`) به
۳ درخواست در هر ۶۰ ثانیه برای هر `deviceId+clientIp` محدود شده‌اند. درخواست‌های
راه‌اندازی دوباره با هم ادغام می‌شوند و سپس یک دورهٔ انتظار ۳۰ ثانیه‌ای بین چرخه‌های
راه‌اندازی دوباره اعمال می‌شود. `update.status` فقط‌خواندنی است اما در محدودهٔ admin قرار دارد، چون sentinel راه‌اندازی دوباره می‌تواند
خلاصه‌های مراحل به‌روزرسانی و انتهای خروجی فرمان را شامل شود.
</Note>

نمونه وصلهٔ جزئی:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

هر دو `config.apply` و `config.patch`، `raw`، `baseHash`، `sessionKey`،
`note` و `restartDelayMs` را می‌پذیرند. وقتی پیکربندی از قبل وجود دارد،
`baseHash` برای هر دو روش الزامی است.

## متغیرهای محیطی

OpenClaw متغیرهای محیطی را از فرایند والد و همچنین این موارد می‌خواند:

- `.env` از پوشهٔ کاری فعلی (اگر وجود داشته باشد)
- `~/.openclaw/.env` (پشتیبان سراسری)

هیچ‌کدام از این فایل‌ها متغیرهای محیطی موجود را بازنویسی نمی‌کنند. همچنین می‌توانید متغیرهای محیطی درون‌خطی را در پیکربندی تنظیم کنید:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env import (optional)">
  اگر فعال باشد و کلیدهای مورد انتظار تنظیم نشده باشند، OpenClaw پوستهٔ ورود شما را اجرا می‌کند و فقط کلیدهای گمشده را وارد می‌کند:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

معادل متغیر محیطی: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  به متغیرهای محیطی در هر مقدار رشته‌ای پیکربندی با `${VAR_NAME}` ارجاع دهید:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

قواعد:

- فقط نام‌های بزرگ تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`
- متغیرهای گمشده/خالی هنگام بارگذاری خطا ایجاد می‌کنند
- برای خروجی لفظی با `$${VAR}` escape کنید
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

جزئیات SecretRef (از جمله `secrets.providers` برای `env`/`file`/`exec`) در [مدیریت اسرار](/fa/gateway/secrets) آمده است.
مسیرهای credential پشتیبانی‌شده در [سطح Credential در SecretRef](/fa/reference/secretref-credential-surface) فهرست شده‌اند.
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
