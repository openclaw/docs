---
read_when:
    - راه‌اندازی OpenClaw برای نخستین بار
    - در حال جست‌وجوی الگوهای رایج پیکربندی
    - پیمایش به بخش‌های مشخص پیکربندی
summary: 'نمای کلی پیکربندی: کارهای رایج، راه‌اندازی سریع، و پیوندهایی به مرجع کامل'
title: پیکربندی
x-i18n:
    generated_at: "2026-05-06T09:16:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42de21fc7e113feffe38fe1a748430f7e59e7abaf2c18ef6f388533b1aca5c0e
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw پیکربندی اختیاری <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> را از `~/.openclaw/openclaw.json` می‌خواند.
مسیر پیکربندی فعال باید یک فایل عادی باشد. چیدمان‌های `openclaw.json`
که با symlink ساخته شده‌اند برای نوشتن‌های متعلق به OpenClaw پشتیبانی نمی‌شوند؛ نوشتن اتمیک ممکن است
به‌جای حفظ symlink، مسیر را جایگزین کند. اگر پیکربندی را خارج از
دایرکتوری وضعیت پیش‌فرض نگه می‌دارید، `OPENCLAW_CONFIG_PATH` را مستقیم به فایل واقعی اشاره دهید.

اگر فایل وجود نداشته باشد، OpenClaw از پیش‌فرض‌های امن استفاده می‌کند. دلایل رایج برای افزودن پیکربندی:

- اتصال کانال‌ها و کنترل اینکه چه کسی می‌تواند به ربات پیام بدهد
- تنظیم مدل‌ها، ابزارها، sandboxing یا خودکارسازی (cron، hookها)
- تنظیم sessionها، رسانه، شبکه یا UI

برای همه فیلدهای موجود، [مرجع کامل](/fa/gateway/configuration-reference) را ببینید.

agentها و خودکارسازی باید پیش از ویرایش پیکربندی، برای مستندات دقیق در سطح فیلد از `config.schema.lookup` استفاده کنند.
از این صفحه برای راهنمایی taskمحور و از
[مرجع پیکربندی](/fa/gateway/configuration-reference) برای نقشه گسترده‌تر
فیلدها و پیش‌فرض‌ها استفاده کنید.

<Tip>
**تازه با پیکربندی آشنا شده‌اید؟** برای راه‌اندازی تعاملی با `openclaw onboard` شروع کنید، یا راهنمای [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) را برای پیکربندی‌های کامل قابل copy-paste ببینید.
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
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) را باز کنید و از تب **پیکربندی** استفاده کنید.
    Control UI فرمی را از schema پیکربندی زنده render می‌کند، شامل metadata مستندات
    `title` / `description` فیلد به‌همراه schemaهای plugin و کانال در صورت موجود بودن،
    با یک ویرایشگر **Raw JSON** به‌عنوان راه خروج اضطراری. برای UIهای drill-down
    و ابزارهای دیگر، gateway همچنین `config.schema.lookup` را ارائه می‌کند تا
    یک node schema محدود به مسیر به‌همراه خلاصه‌های فرزند مستقیم را دریافت کند.
  </Tab>
  <Tab title="ویرایش مستقیم">
    `~/.openclaw/openclaw.json` را مستقیم ویرایش کنید. Gateway فایل را زیر نظر می‌گیرد و تغییرات را خودکار اعمال می‌کند (نگاه کنید به [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## اعتبارسنجی سخت‌گیرانه

<Warning>
OpenClaw فقط پیکربندی‌هایی را می‌پذیرد که کاملا با schema مطابقت داشته باشند. کلیدهای ناشناخته، نوع‌های بدشکل، یا مقدارهای نامعتبر باعث می‌شوند Gateway **از شروع به کار خودداری کند**. تنها استثنای سطح root، `$schema` (رشته) است، تا editorها بتوانند metadata مربوط به JSON Schema را پیوست کنند.
</Warning>

`openclaw config schema`، JSON Schema canonical را که Control UI
و اعتبارسنجی استفاده می‌کنند چاپ می‌کند. `config.schema.lookup` یک node
محدود به مسیر به‌همراه خلاصه‌های فرزند را برای ابزارهای drill-down دریافت می‌کند.
metadata مستندات `title`/`description` فیلد از میان objectهای تو در تو، wildcard (`*`)،
array-item (`[]`) و شاخه‌های `anyOf`/
`oneOf`/`allOf` عبور می‌کند. schemaهای runtime مربوط به plugin و کانال وقتی
manifest registry بارگذاری شده باشد merge می‌شوند.

وقتی اعتبارسنجی شکست می‌خورد:

- Gateway بوت نمی‌شود
- فقط دستورهای تشخیصی کار می‌کنند (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- برای دیدن issueهای دقیق، `openclaw doctor` را اجرا کنید
- برای اعمال تعمیرات، `openclaw doctor --fix` (یا `--yes`) را اجرا کنید

Gateway پس از هر startup موفق، یک کپی مورد اعتماد از آخرین وضعیت سالم شناخته‌شده نگه می‌دارد،
اما startup و hot reload آن را خودکار restore نمی‌کنند. اگر `openclaw.json`
در اعتبارسنجی شکست بخورد (از جمله اعتبارسنجی plugin-local)، startup مربوط به Gateway شکست می‌خورد یا
reload رد می‌شود و runtime فعلی آخرین پیکربندی پذیرفته‌شده را نگه می‌دارد.
برای تعمیر پیکربندی prefixed/clobbered یا restore کردن کپی آخرین وضعیت سالم شناخته‌شده،
`openclaw doctor --fix` (یا `--yes`) را اجرا کنید. وقتی یک
candidate شامل placeholderهای secret سانسورشده مانند `***` باشد، promotion به آخرین وضعیت سالم شناخته‌شده انجام نمی‌شود.

## کارهای رایج

<AccordionGroup>
  <Accordion title="راه‌اندازی یک کانال (WhatsApp، Telegram، Discord و غیره)">
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

    - `agents.defaults.models` کاتالوگ مدل را تعریف می‌کند و برای `/model` نقش allowlist را دارد.
    - برای افزودن entryهای allowlist بدون حذف مدل‌های موجود، از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. جایگزینی‌های ساده‌ای که entryها را حذف کنند رد می‌شوند، مگر اینکه `--replace` را پاس بدهید.
    - refهای مدل از قالب `provider/model` استفاده می‌کنند (مثلا `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` کوچک‌سازی تصویرهای transcript/tool را کنترل می‌کند (پیش‌فرض `1200`)؛ مقدارهای کمتر معمولا مصرف vision-token را در اجراهای پر از screenshot کاهش می‌دهند.
    - برای تغییر مدل‌ها در chat، [CLI مدل‌ها](/fa/concepts/models) و برای auth rotation و رفتار fallback، [Failover مدل](/fa/concepts/model-failover) را ببینید.
    - برای providerهای سفارشی/self-hosted، بخش [providerهای سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) را در مرجع ببینید.

  </Accordion>

  <Accordion title="کنترل اینکه چه کسانی می‌توانند به بات پیام بدهند">
    دسترسی DM برای هر کانال از طریق `dmPolicy` کنترل می‌شود:

    - `"pairing"` (پیش‌فرض): فرستندگان ناشناس یک کد جفت‌سازی یک‌بارمصرف برای تأیید دریافت می‌کنند
    - `"allowlist"`: فقط فرستندگانی که در `allowFrom` هستند (یا در مخزن مجازِ جفت‌شده)
    - `"open"`: همه DMهای ورودی را مجاز کن (به `allowFrom: ["*"]` نیاز دارد)
    - `"disabled"`: همه DMها را نادیده بگیر

    برای گروه‌ها، از `groupPolicy` + `groupAllowFrom` یا فهرست‌های مجاز مخصوص کانال استفاده کنید.

    برای جزئیات هر کانال، [مرجع کامل](/fa/gateway/config-channels#dm-and-group-access) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی کنترل منشن در گفت‌وگوی گروهی">
    پیام‌های گروهی به‌طور پیش‌فرض **نیازمند منشن** هستند. الگوهای راه‌انداز را برای هر عامل پیکربندی کنید، و پاسخ‌های قابل مشاهده اتاق را روی مسیر پیش‌فرض ابزار پیام نگه دارید، مگر اینکه عمداً پاسخ‌های نهایی خودکار قدیمی را بخواهید:

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

    - **منشن‌های فراداده**: @-منشن‌های بومی (منشن با لمس در WhatsApp، `@bot` در Telegram، و غیره)
    - **الگوهای متنی**: الگوهای regex امن در `mentionPatterns`
    - **پاسخ‌های قابل مشاهده**: `messages.visibleReplies` می‌تواند ارسال از طریق ابزار پیام را به‌صورت سراسری الزامی کند؛ `messages.groupChat.visibleReplies` این رفتار را برای گروه‌ها/کانال‌ها بازنویسی می‌کند.
    - برای حالت‌های پاسخ قابل مشاهده، بازنویسی‌های مخصوص کانال، و حالت خودگفت‌وگو، [مرجع کامل](/fa/gateway/config-channels#group-chat-mention-gating) را ببینید.

  </Accordion>

  <Accordion title="محدود کردن Skills برای هر عامل">
    از `agents.defaults.skills` برای یک خط پایه مشترک استفاده کنید، سپس عامل‌های مشخص را با `agents.list[].skills` بازنویسی کنید:

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
    - برای به ارث بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
    - برای نداشتن Skills، `agents.list[].skills: []` را تنظیم کنید.
    - [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و
      [مرجع پیکربندی](/fa/gateway/config-agents#agents-defaults-skills) را ببینید.

  </Accordion>

  <Accordion title="تنظیم پایش سلامت کانال Gateway">
    کنترل کنید Gateway با چه شدتی کانال‌هایی را که کهنه به نظر می‌رسند بازراه‌اندازی کند:

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

    - برای غیرفعال کردن بازراه‌اندازی‌های پایش سلامت به‌صورت سراسری، `gateway.channelHealthCheckMinutes: 0` را تنظیم کنید.
    - `channelStaleEventThresholdMinutes` باید بزرگ‌تر یا برابر با فاصله بررسی باشد.
    - برای غیرفعال کردن بازراه‌اندازی خودکار برای یک کانال یا حساب، بدون غیرفعال کردن پایشگر سراسری، از `channels.<provider>.healthMonitor.enabled` یا `channels.<provider>.accounts.<id>.healthMonitor.enabled` استفاده کنید.
    - برای اشکال‌زدایی عملیاتی، [بررسی‌های سلامت](/fa/gateway/health) و برای همه فیلدها [مرجع کامل](/fa/gateway/configuration-reference#gateway) را ببینید.

  </Accordion>

  <Accordion title="تنظیم زمان‌سنج دست‌دهی WebSocket در Gateway">
    به کلاینت‌های محلی زمان بیشتری بدهید تا دست‌دهی WebSocket پیش از احراز هویت را روی میزبان‌های پربار یا کم‌توان کامل کنند:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - مقدار پیش‌فرض `15000` میلی‌ثانیه است.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` همچنان برای بازنویسی‌های موردی سرویس یا پوسته اولویت دارد.
    - ابتدا رفع توقف‌های راه‌اندازی/حلقه رویداد را ترجیح دهید؛ این کنترل برای میزبان‌هایی است که سالم‌اند اما هنگام گرم‌شدن کند هستند.

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
    - `threadBindings`: پیش‌فرض‌های سراسری برای مسیریابی نشست وابسته به رشته (Discord از `/focus`، `/unfocus`، `/agents`، `/session idle`، و `/session max-age` پشتیبانی می‌کند).
    - برای دامنه‌بندی، پیوندهای هویت، و سیاست ارسال، [مدیریت نشست](/fa/concepts/session) را ببینید.
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

    ابتدا image را بسازید - از یک checkout سورس، `scripts/sandbox-setup.sh` را اجرا کنید، یا از نصب npm، دستور درون‌خطی `docker build` را در [Sandboxing § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) ببینید.

    برای راهنمای کامل، [Sandboxing](/fa/gateway/sandboxing) و برای همه گزینه‌ها [مرجع کامل](/fa/gateway/config-agents#agentsdefaultssandbox) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی push مبتنی بر relay برای buildهای رسمی iOS">
    Push مبتنی بر relay در `openclaw.json` پیکربندی می‌شود.

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

    - به gateway اجازه می‌دهد `push.test`، تلنگرهای بیدارسازی، و بیدارسازی‌های اتصال مجدد را از طریق relay خارجی ارسال کند.
    - از یک مجوز ارسال scoped به ثبت‌نام استفاده می‌کند که app جفت‌شده iOS آن را forward کرده است. gateway به token relay در سطح deployment نیاز ندارد.
    - هر ثبت‌نام مبتنی بر relay را به هویت gatewayای که app iOS با آن جفت شده است bind می‌کند، بنابراین gateway دیگری نمی‌تواند از ثبت‌نام ذخیره‌شده دوباره استفاده کند.
    - buildهای محلی/دستی iOS را روی APNs مستقیم نگه می‌دارد. ارسال‌های مبتنی بر relay فقط برای buildهای توزیع‌شده رسمی اعمال می‌شوند که از طریق relay ثبت‌نام کرده‌اند.
    - باید با URL پایه relay که در build رسمی/TestFlight iOS baked شده است مطابقت داشته باشد، تا ترافیک ثبت‌نام و ارسال به همان deployment relay برسد.

    جریان انتهابه‌انتها:

    1. یک build رسمی/TestFlight iOS را نصب کنید که با همان URL پایه relay کامپایل شده است.
    2. `gateway.push.apns.relay.baseUrl` را روی gateway پیکربندی کنید.
    3. app iOS را با gateway جفت کنید و اجازه دهید هر دو نشست node و operator وصل شوند.
    4. app iOS هویت gateway را دریافت می‌کند، با استفاده از App Attest به‌همراه receipt app در relay ثبت‌نام می‌کند، و سپس payload `push.apns.register` مبتنی بر relay را در gateway جفت‌شده منتشر می‌کند.
    5. gateway، handle relay و مجوز ارسال را ذخیره می‌کند، سپس از آن‌ها برای `push.test`، تلنگرهای بیدارسازی، و بیدارسازی‌های اتصال مجدد استفاده می‌کند.

    نکات عملیاتی:

    - اگر app iOS را به gateway دیگری تغییر دادید، app را دوباره وصل کنید تا بتواند ثبت‌نام relay جدیدی منتشر کند که به آن gateway bind شده است.
    - اگر build جدیدی از iOS منتشر کردید که به deployment relay متفاوتی اشاره می‌کند، app ثبت‌نام relay cache‌شده خود را به‌جای استفاده دوباره از origin قدیمی relay تازه‌سازی می‌کند.

    نکته سازگاری:

    - `OPENCLAW_APNS_RELAY_BASE_URL` و `OPENCLAW_APNS_RELAY_TIMEOUT_MS` همچنان به‌عنوان overrideهای موقت env کار می‌کنند.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` همچنان یک راه فرار توسعه فقط برای loopback است؛ URLهای relay مبتنی بر HTTP را در config ماندگار نکنید.

    برای جریان انتهابه‌انتها، [app iOS](/fa/platforms/ios#relay-backed-push-for-official-builds) و برای مدل امنیتی relay، [جریان احراز هویت و اعتماد](/fa/platforms/ios#authentication-and-trust-flow) را ببینید.

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

    - `every`: رشته مدت‌زمان (`30m`، `2h`). برای غیرفعال‌سازی `0m` را تنظیم کنید.
    - `target`: `last` | `none` | `<channel-id>` (برای مثال `discord`، `matrix`، `telegram`، یا `whatsapp`)
    - `directPolicy`: `allow` (پیش‌فرض) یا `block` برای هدف‌های heartbeat شبیه DM
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

    - `sessionRetention`: نشست‌های run ایزوله تکمیل‌شده را از `sessions.json` prune می‌کند (پیش‌فرض `24h`؛ برای غیرفعال‌سازی `false` را تنظیم کنید).
    - `runLog`: `cron/runs/<jobId>.jsonl` را بر اساس اندازه و خطوط نگه‌داشته‌شده prune می‌کند.
    - برای نمای کلی قابلیت و مثال‌های CLI، [jobهای Cron](/fa/automation/cron-jobs) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی Webhookها (hookها)">
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

    نکته امنیتی:
    - همه محتوای payload hook/webhook را ورودی غیرقابل‌اعتماد در نظر بگیرید.
    - از یک `hooks.token` اختصاصی استفاده کنید؛ token مشترک Gateway را دوباره استفاده نکنید.
    - احراز هویت hook فقط header-only است (`Authorization: Bearer ...` یا `x-openclaw-token`)؛ tokenهای query-string رد می‌شوند.
    - `hooks.path` نمی‌تواند `/` باشد؛ ingress webhook را روی یک subpath اختصاصی مانند `/hooks` نگه دارید.
    - flagهای bypass محتوای ناامن را غیرفعال نگه دارید (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) مگر برای debugging با دامنه کاملا محدود.
    - اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را هم تنظیم کنید تا کلیدهای نشست انتخاب‌شده توسط caller محدود شوند.
    - برای agentهای hook-driven، tierهای مدل مدرن و قوی و policy سخت‌گیرانه ابزار را ترجیح دهید (برای مثال فقط messaging به‌همراه sandboxing در صورت امکان).

    برای همه گزینه‌های mapping و یکپارچه‌سازی Gmail، [مرجع کامل](/fa/gateway/configuration-reference#hooks) را ببینید.

  </Accordion>

  <Accordion title="پیکربندی routing چند-agentی">
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

    برای قواعد binding و profileهای دسترسی per-agent، [Multi-Agent](/fa/concepts/multi-agent) و [مرجع کامل](/fa/gateway/config-agents#multi-agent-routing) را ببینید.

  </Accordion>

  <Accordion title="تقسیم config به چند فایل ($include)">
    برای سازمان‌دهی configهای بزرگ از `$include` استفاده کنید:

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

    - **تک‌فایل**: object دربرگیرنده را جایگزین می‌کند
    - **آرایه‌ای از فایل‌ها**: به‌ترتیب deep-merge می‌شوند (مورد بعدی برنده است)
    - **کلیدهای sibling**: پس از includeها merge می‌شوند (valueهای include‌شده را override می‌کنند)
    - **includeهای nested**: تا عمق 10 سطح پشتیبانی می‌شوند
    - **مسیرهای نسبی**: نسبت به فایل includeکننده resolve می‌شوند
    - **نوشتن‌های متعلق به OpenClaw**: وقتی یک نوشتن فقط یک بخش top-level را تغییر می‌دهد
      که توسط یک include تک‌فایلی مانند `plugins: { $include: "./plugins.json5" }` پشتیبانی می‌شود،
      OpenClaw همان فایل include‌شده را به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد
    - **write-through پشتیبانی‌نشده**: includeهای root، آرایه‌های include، و includeهایی
      با overrideهای sibling برای نوشتن‌های متعلق به OpenClaw fail closed می‌شوند به‌جای اینکه
      config را flatten کنند
    - **محصورسازی**: مسیرهای `$include` باید زیر دایرکتوری حاوی
      `openclaw.json` resolve شوند. برای اشتراک‌گذاری یک tree میان machineها یا کاربران،
      `OPENCLAW_INCLUDE_ROOTS` را به یک path-list (`:` در POSIX، `;` در Windows) از
      دایرکتوری‌های اضافی که includeها می‌توانند به آن‌ها ارجاع دهند تنظیم کنید. Symlinkها resolve
      و دوباره بررسی می‌شوند، بنابراین مسیری که از نظر lexical داخل یک دایرکتوری config قرار دارد اما
      target واقعی آن از هر root مجاز خارج می‌شود همچنان رد می‌شود.
    - **مدیریت خطا**: خطاهای روشن برای فایل‌های مفقود، خطاهای parse، و includeهای circular

  </Accordion>
</AccordionGroup>

## reload داغ config

Gateway فایل `~/.openclaw/openclaw.json` را watch می‌کند و تغییرات را به‌صورت خودکار اعمال می‌کند - برای بیشتر تنظیمات، restart دستی لازم نیست.

ویرایش‌های مستقیم فایل تا زمانی که validate نشوند غیرقابل‌اعتماد محسوب می‌شوند. watcher منتظر می‌ماند
تا churn مربوط به temp-write/rename ویرایشگر آرام شود، فایل نهایی را می‌خواند، و
ویرایش‌های خارجی نامعتبر را بدون بازنویسی `openclaw.json` رد می‌کند. نوشتن‌های config
متعلق به OpenClaw پیش از نوشتن از همان schema gate استفاده می‌کنند؛ clobberهای مخرب مانند
حذف `gateway.mode` یا کوچک‌کردن فایل بیش از نصف رد می‌شوند و
برای بررسی به‌صورت `.rejected.*` ذخیره می‌شوند.

اگر `config reload skipped (invalid config)` را می‌بینید یا startup، `Invalid
config` گزارش می‌کند، config را بررسی کنید، `openclaw config validate` را اجرا کنید، سپس برای repair، `openclaw
doctor --fix` را اجرا کنید. برای checklist، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)
را ببینید.

### حالت‌های reload

| حالت                   | رفتار                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (پیش‌فرض) | تغییرات safe را فورا hot-apply می‌کند. برای موارد critical به‌صورت خودکار restart می‌کند.           |
| **`hot`**              | فقط تغییرات safe را hot-apply می‌کند. وقتی restart لازم باشد warning ثبت می‌کند - شما آن را انجام می‌دهید. |
| **`restart`**          | Gateway را با هر تغییر config، safe یا غیر safe، restart می‌کند.                                 |
| **`off`**              | file watching را غیرفعال می‌کند. تغییرات در restart دستی بعدی اثر می‌کنند.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### چه چیزی hot-apply می‌شود و چه چیزی به restart نیاز دارد

بیشتر fieldها بدون downtime به‌صورت hot-apply اعمال می‌شوند. در حالت `hybrid`، تغییراتی که به restart نیاز دارند خودکار مدیریت می‌شوند.

| دسته            | fieldها                                                            | restart لازم است؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| کانال‌ها            | `channels.*`, `web` (WhatsApp) - همه کانال‌های داخلی و plugin | خیر              |
| Agent و مدل‌ها      | `agent`, `agents`, `models`, `routing`                            | خیر              |
| Automation          | `hooks`, `cron`, `agent.heartbeat`                                | خیر              |
| نشست‌ها و پیام‌ها | `session`, `messages`                                             | خیر              |
| ابزارها و media       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | خیر              |
| UI و موارد متفرقه           | `ui`, `logging`, `identity`, `bindings`                           | خیر              |
| سرور Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **بله**         |
| Infrastructure      | `discovery`, `canvasHost`, `plugins`                              | **بله**         |

<Note>
`gateway.reload` و `gateway.remote` استثنا هستند - تغییر آن‌ها **باعث** restart نمی‌شود.
</Note>

### برنامه‌ریزی reload

وقتی یک فایل منبع را که از طریق `$include` ارجاع شده است ویرایش می‌کنید، OpenClaw بارگذاری مجدد را بر اساس چیدمان نوشته‌شده در منبع برنامه‌ریزی می‌کند، نه نمای تخت‌شده درون حافظه. این کار تصمیم‌های بارگذاری داغ (اعمال داغ در برابر راه‌اندازی مجدد) را قابل پیش‌بینی نگه می‌دارد، حتی وقتی یک بخش سطح‌بالای واحد در فایل included خودش قرار دارد؛ مانند `plugins: { $include: "./plugins.json5" }`. اگر چیدمان منبع مبهم باشد، برنامه‌ریزی بارگذاری مجدد به‌صورت بسته شکست می‌خورد.

## RPC پیکربندی (به‌روزرسانی‌های برنامه‌نویسی‌شده)

برای ابزارهایی که پیکربندی را از طریق API Gateway می‌نویسند، این جریان را ترجیح دهید:

- `config.schema.lookup` برای بررسی یک زیردرخت (گره schema سطحی + خلاصه‌های فرزند)
- `config.get` برای دریافت snapshot فعلی به‌همراه `hash`
- `config.patch` برای به‌روزرسانی‌های جزئی (JSON merge patch: اشیا merge می‌شوند، `null` حذف می‌کند، آرایه‌ها جایگزین می‌شوند)
- `config.apply` فقط زمانی که قصد دارید کل پیکربندی را جایگزین کنید
- `update.run` برای خود-به‌روزرسانی صریح به‌همراه راه‌اندازی مجدد؛ وقتی session پس از راه‌اندازی مجدد باید یک نوبت پیگیری اجرا کند، `continuationMessage` را اضافه کنید
- `update.status` برای بررسی آخرین sentinel راه‌اندازی مجدد به‌روزرسانی و تأیید نسخه در حال اجرا پس از راه‌اندازی مجدد

Agentها باید `config.schema.lookup` را نخستین مقصد برای مستندات و محدودیت‌های دقیق در سطح فیلد بدانند. وقتی به نقشه گسترده‌تر پیکربندی، پیش‌فرض‌ها، یا پیوندها به مراجع اختصاصی زیرسامانه‌ها نیاز دارند، از [مرجع پیکربندی](/fa/gateway/configuration-reference) استفاده کنید.

<Note>
نوشتن‌های control-plane (`config.apply`، `config.patch`، `update.run`) به ۳ درخواست در هر ۶۰ ثانیه برای هر `deviceId+clientIp` محدود می‌شوند. درخواست‌های راه‌اندازی مجدد ادغام می‌شوند و سپس بین چرخه‌های راه‌اندازی مجدد یک cooldown سی‌ثانیه‌ای اعمال می‌کنند. `update.status` فقط‌خواندنی است اما در scope مدیریتی قرار دارد، چون sentinel راه‌اندازی مجدد می‌تواند شامل خلاصه‌های مراحل به‌روزرسانی و دنباله‌های خروجی command باشد.
</Note>

نمونه patch جزئی:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

هر دو `config.apply` و `config.patch`، `raw`، `baseHash`، `sessionKey`، `note` و `restartDelayMs` را می‌پذیرند. وقتی پیکربندی از قبل وجود داشته باشد، `baseHash` برای هر دو method الزامی است.

## متغیرهای محیطی

OpenClaw متغیرهای env را از parent process به‌علاوه موارد زیر می‌خواند:

- `.env` از دایرکتوری کاری فعلی (اگر وجود داشته باشد)
- `~/.openclaw/.env` (fallback سراسری)

هیچ‌کدام از این فایل‌ها متغیرهای env موجود را override نمی‌کنند. همچنین می‌توانید متغیرهای env درون‌خطی را در پیکربندی تنظیم کنید:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="وارد کردن env پوسته (اختیاری)">
  اگر فعال باشد و کلیدهای مورد انتظار تنظیم نشده باشند، OpenClaw پوسته login شما را اجرا می‌کند و فقط کلیدهای missing را وارد می‌کند:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

معادل متغیر env: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="جایگزینی متغیر env در مقادیر پیکربندی">
  در هر مقدار رشته‌ای پیکربندی با `${VAR_NAME}` به متغیرهای env ارجاع دهید:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

قواعد:

- فقط نام‌های uppercase مطابق می‌شوند: `[A-Z_][A-Z0-9_]*`
- متغیرهای missing/empty هنگام load خطا می‌دهند
- برای خروجی literal با `$${VAR}` escape کنید
- داخل فایل‌های `$include` کار می‌کند
- جایگزینی درون‌خطی: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="ارجاع‌های secret (env، file، exec)">
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

جزئیات SecretRef (از جمله `secrets.providers` برای `env`/`file`/`exec`) در [مدیریت Secrets](/fa/gateway/secrets) آمده است. مسیرهای credential پشتیبانی‌شده در [سطح Credential مربوط به SecretRef](/fa/reference/secretref-credential-surface) فهرست شده‌اند.
</Accordion>

برای precedence و sourceهای کامل، [محیط](/fa/help/environment) را ببینید.

## مرجع کامل

برای مرجع کامل فیلدبه‌فیلد، **[مرجع پیکربندی](/fa/gateway/configuration-reference)** را ببینید.

---

_مرتبط: [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [مرجع پیکربندی](/fa/gateway/configuration-reference) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
- [runbook Gateway](/fa/gateway)
