---
read_when:
    - راه‌اندازی OpenClaw برای اولین بار
    - در جست‌وجوی الگوهای رایج پیکربندی
    - پیمایش به بخش‌های مشخص پیکربندی
summary: 'نمای کلی پیکربندی: وظایف رایج، راه‌اندازی سریع، و پیوندهایی به مرجع کامل'
title: پیکربندی
x-i18n:
    generated_at: "2026-06-27T17:42:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw یک پیکربندی اختیاری <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> را از `~/.openclaw/openclaw.json` می‌خواند.
مسیر پیکربندی فعال باید یک فایل معمولی باشد. چیدمان‌های `openclaw.json`
با پیوند نمادین برای نوشتن‌های متعلق به OpenClaw پشتیبانی نمی‌شوند؛ یک نوشتن اتمیک ممکن است
به‌جای حفظ پیوند نمادین، مسیر را جایگزین کند. اگر پیکربندی را بیرون از
دایرکتوری پیش‌فرض وضعیت نگه می‌دارید، `OPENCLAW_CONFIG_PATH` را مستقیماً به فایل واقعی اشاره دهید.

اگر فایل وجود نداشته باشد، OpenClaw از پیش‌فرض‌های امن استفاده می‌کند. دلایل رایج برای افزودن پیکربندی:

- اتصال کانال‌ها و کنترل اینکه چه کسی می‌تواند به ربات پیام بدهد
- تنظیم مدل‌ها، ابزارها، sandboxing، یا خودکارسازی (cron، hooks)
- تنظیم دقیق نشست‌ها، رسانه، شبکه، یا رابط کاربری

برای همه فیلدهای موجود، [مرجع کامل](/fa/gateway/configuration-reference) را ببینید.

Agentها و خودکارسازی باید پیش از ویرایش پیکربندی، برای مستندات دقیق در سطح فیلد
از `config.schema.lookup` استفاده کنند. از این صفحه برای راهنمایی وظیفه‌محور و
از [مرجع پیکربندی](/fa/gateway/configuration-reference) برای نقشه گسترده‌تر
فیلدها و پیش‌فرض‌ها استفاده کنید.

<Tip>
**تازه با پیکربندی آشنا شده‌اید؟** برای راه‌اندازی تعاملی با `openclaw onboard` شروع کنید، یا برای پیکربندی‌های کامل آماده کپی و جای‌گذاری، راهنمای [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) را ببینید.
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
    Control UI فرمی را از schema پیکربندی زنده رندر می‌کند، شامل فراداده مستندات
    `title` / `description` فیلدها و همچنین schemaهای Plugin و کانال، وقتی
    موجود باشند، همراه با یک ویرایشگر **Raw JSON** به‌عنوان راه خروج. برای رابط‌های
    کاربری drill-down و ابزارهای دیگر، Gateway همچنین `config.schema.lookup` را ارائه می‌کند تا
    یک گره schema محدود به مسیر به‌همراه خلاصه‌های فرزندان مستقیم را واکشی کند.
  </Tab>
  <Tab title="Direct edit">
    `~/.openclaw/openclaw.json` را مستقیماً ویرایش کنید. Gateway فایل را زیر نظر می‌گیرد و تغییرات را به‌صورت خودکار اعمال می‌کند ([بارگذاری مجدد داغ](#config-hot-reload) را ببینید).
  </Tab>
</Tabs>

## اعتبارسنجی سخت‌گیرانه

<Warning>
OpenClaw فقط پیکربندی‌هایی را می‌پذیرد که کاملاً با schema مطابقت داشته باشند. کلیدهای ناشناخته، نوع‌های بدشکل، یا مقدارهای نامعتبر باعث می‌شوند Gateway **از شروع به کار خودداری کند**. تنها استثنای سطح ریشه `$schema` (رشته) است، تا ویرایشگرها بتوانند فراداده JSON Schema را متصل کنند.
</Warning>

`openclaw config schema`، JSON Schema کانونی مورد استفاده Control UI
و اعتبارسنجی را چاپ می‌کند. `config.schema.lookup` یک گره محدود به مسیر به‌همراه
خلاصه‌های فرزند را برای ابزارهای drill-down واکشی می‌کند. فراداده مستندات `title`/`description` فیلدها
از میان اشیای تودرتو، wildcard (`*`)، موردهای آرایه (`[]`)، و شاخه‌های `anyOf`/
`oneOf`/`allOf` عبور می‌کند. schemaهای Plugin و کانال در زمان اجرا، وقتی
رجیستری manifest بارگذاری شود، ادغام می‌شوند.

وقتی اعتبارسنجی شکست می‌خورد:

- Gateway بوت نمی‌شود
- فقط فرمان‌های تشخیصی کار می‌کنند (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- برای دیدن مشکلات دقیق، `openclaw doctor` را اجرا کنید
- برای اعمال تعمیرات، `openclaw doctor --fix` (یا `--yes`) را اجرا کنید

Gateway پس از هر شروع موفق، یک نسخه مورد اعتماد از آخرین پیکربندی سالم نگه می‌دارد،
اما شروع به کار و بارگذاری مجدد داغ آن را به‌صورت خودکار بازیابی نمی‌کنند. اگر `openclaw.json`
در اعتبارسنجی شکست بخورد (از جمله اعتبارسنجی محلی Plugin)، شروع Gateway شکست می‌خورد یا
بارگذاری مجدد رد می‌شود و runtime فعلی آخرین پیکربندی پذیرفته‌شده را نگه می‌دارد.
برای تعمیر پیکربندی پیشونددار/خراب‌شده یا بازیابی
آخرین نسخه سالم، `openclaw doctor --fix` (یا `--yes`) را اجرا کنید. وقتی یک
گزینه نامزد شامل placeholderهای redacted برای رازها مانند `***` باشد، ارتقا به آخرین نسخه سالم رد می‌شود.

## وظایف رایج

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
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

    - `agents.defaults.models` کاتالوگ مدل را تعریف می‌کند و به‌عنوان allowlist برای `/model` عمل می‌کند؛ ورودی‌های `provider/*`، `/model`، `/models`، و انتخابگرهای مدل را به providerهای انتخاب‌شده محدود می‌کنند، در حالی که همچنان از کشف پویای مدل استفاده می‌شود.
    - برای افزودن ورودی‌های allowlist بدون حذف مدل‌های موجود، از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. جایگزینی‌های ساده که ورودی‌ها را حذف کنند رد می‌شوند، مگر اینکه `--replace` را پاس کنید.
    - ارجاع‌های مدل از قالب `provider/model` استفاده می‌کنند (مثلاً `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` کوچک‌سازی تصویرهای transcript/tool را کنترل می‌کند (پیش‌فرض `1200`)؛ مقدارهای کمتر معمولاً مصرف vision-token را در اجراهای سنگین از نظر screenshot کاهش می‌دهند.
    - برای تعویض مدل‌ها در chat، [CLI مدل‌ها](/fa/concepts/models) را ببینید و برای چرخش auth و رفتار fallback، [Failover مدل](/fa/concepts/model-failover) را ببینید.
    - برای providerهای سفارشی/خودمیزبان، [providerهای سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) را در مرجع ببینید.

  </Accordion>

  <Accordion title="Control who can message the bot">
    دسترسی DM به‌ازای هر کانال از طریق `dmPolicy` کنترل می‌شود:

    - `"pairing"` (پیش‌فرض): فرستنده‌های ناشناخته یک کد pairing یک‌باره برای تأیید دریافت می‌کنند
    - `"allowlist"`: فقط فرستنده‌های موجود در `allowFrom` (یا ذخیره allow جفت‌شده)
    - `"open"`: همه DMهای ورودی را مجاز می‌کند (نیازمند `allowFrom: ["*"]`)
    - `"disabled"`: همه DMها را نادیده می‌گیرد

    برای گروه‌ها، از `groupPolicy` + `groupAllowFrom` یا allowlistهای مخصوص کانال استفاده کنید.

    برای جزئیات به‌ازای هر کانال، [مرجع کامل](/fa/gateway/config-channels#dm-and-group-access) را ببینید.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    پیام‌های گروهی به‌صورت پیش‌فرض **نیازمند mention** هستند. الگوهای trigger را به‌ازای هر agent پیکربندی کنید. پاسخ‌های عادی گروه/کانال به‌صورت خودکار ارسال می‌شوند؛ برای اتاق‌های مشترکی که agent باید تصمیم بگیرد چه زمانی صحبت کند، مسیر message-tool را انتخاب کنید:

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

    - **mentionهای فراداده‌ای**: @-mentionهای بومی (WhatsApp tap-to-mention، Telegram @bot، و غیره)
    - **الگوهای متنی**: الگوهای regex امن در `mentionPatterns`
    - **پاسخ‌های قابل مشاهده**: `messages.visibleReplies` می‌تواند ارسال‌های message-tool را به‌صورت سراسری الزامی کند؛ `messages.groupChat.visibleReplies` آن را برای گروه‌ها/کانال‌ها override می‌کند.
    - برای حالت‌های پاسخ قابل مشاهده، overrideهای به‌ازای هر کانال، و حالت self-chat، [مرجع کامل](/fa/gateway/config-channels#group-chat-mention-gating) را ببینید.

  </Accordion>

  <Accordion title="Restrict skills per agent">
    از `agents.defaults.skills` برای یک خط پایه مشترک استفاده کنید، سپس agentهای مشخص را با
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

  <Accordion title="Tune gateway channel health monitoring">
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
    - برای غیرفعال کردن restartهای خودکار برای یک کانال یا حساب، بدون غیرفعال کردن monitor سراسری، از `channels.<provider>.healthMonitor.enabled` یا `channels.<provider>.accounts.<id>.healthMonitor.enabled` استفاده کنید.
    - برای اشکال‌زدایی عملیاتی، [بررسی‌های سلامت](/fa/gateway/health) را ببینید و برای همه فیلدها [مرجع کامل](/fa/gateway/configuration-reference#gateway) را ببینید.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    به clientهای محلی زمان بیشتری بدهید تا handshake WebSocket پیش از auth را روی
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
    - ابتدا بهتر است توقف‌های startup/event-loop را اصلاح کنید؛ این knob برای میزبان‌هایی است که سالم‌اند اما هنگام warmup کند هستند.

  </Accordion>

  <Accordion title="Configure sessions and resets">
    نشست‌ها تداوم و جداسازی گفت‌وگو را کنترل می‌کنند:

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
    - برای محدوده‌بندی، پیوندهای هویت، و سیاست ارسال، [مدیریت نشست](/fa/concepts/session) را ببینید.
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

    ابتدا image را بسازید - از یک source checkout، `scripts/sandbox-setup.sh` را اجرا کنید، یا از یک نصب npm، دستور درون‌خطی `docker build` را در [Sandboxing § Images and setup](/fa/gateway/sandboxing#images-and-setup) ببینید.

    برای راهنمای کامل، [Sandboxing](/fa/gateway/sandboxing) و برای همه گزینه‌ها [مرجع کامل](/fa/gateway/config-agents#agentsdefaultssandbox) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی push مبتنی بر رله برای buildهای رسمی iOS">
    push مبتنی بر رله برای buildهای عمومی App Store/TestFlight از رله میزبانی‌شده OpenClaw استفاده می‌کند: `https://ios-push-relay.openclaw.ai`.

    استقرارهای رله سفارشی به یک مسیر build/deployment عمدا جداگانه برای iOS نیاز دارند که URL رله آن با URL رله Gateway مطابقت داشته باشد. اگر از build رله سفارشی استفاده می‌کنید، این مورد را در پیکربندی Gateway تنظیم کنید:

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

    - به Gateway اجازه می‌دهد `push.test`، تلنگرهای بیدارباش، و بیدارباش‌های اتصال مجدد را از طریق رله خارجی ارسال کند.
    - از مجوز ارسال محدود به ثبت‌نام استفاده می‌کند که توسط اپلیکیشن iOS جفت‌شده فوروارد شده است. Gateway به توکن رله سراسری برای استقرار نیاز ندارد.
    - هر ثبت‌نام مبتنی بر رله را به هویت Gateway که اپلیکیشن iOS با آن جفت شده است متصل می‌کند، تا Gateway دیگری نتواند از ثبت‌نام ذخیره‌شده دوباره استفاده کند.
    - buildهای محلی/دستی iOS را روی APNs مستقیم نگه می‌دارد. ارسال‌های مبتنی بر رله فقط برای buildهای رسمی توزیع‌شده‌ای اعمال می‌شوند که از طریق رله ثبت شده‌اند.
    - باید با URL پایه رله‌ای که در build iOS تعبیه شده مطابقت داشته باشد، تا ترافیک ثبت‌نام و ارسال به همان استقرار رله برسد.

    جریان سرتاسری:

    1. یک build رسمی/TestFlight iOS نصب کنید.
    2. اختیاری: فقط هنگام استفاده از یک build رله سفارشی عمدا جداگانه، `gateway.push.apns.relay.baseUrl` را روی Gateway پیکربندی کنید.
    3. اپلیکیشن iOS را با Gateway جفت کنید و اجازه دهید هر دو نشست node و operator متصل شوند.
    4. اپلیکیشن iOS هویت Gateway را دریافت می‌کند، با استفاده از App Attest به‌همراه رسید اپلیکیشن در رله ثبت‌نام می‌کند، و سپس payload مبتنی بر رله `push.apns.register` را در Gateway جفت‌شده منتشر می‌کند.
    5. Gateway شناسه رله و مجوز ارسال را ذخیره می‌کند، سپس از آن‌ها برای `push.test`، تلنگرهای بیدارباش، و بیدارباش‌های اتصال مجدد استفاده می‌کند.

    نکات عملیاتی:

    - اگر اپلیکیشن iOS را به Gateway دیگری تغییر دهید، اپلیکیشن را دوباره متصل کنید تا بتواند یک ثبت‌نام رله جدید وابسته به آن Gateway منتشر کند.
    - اگر build جدید iOS منتشر کنید که به استقرار رله متفاوتی اشاره می‌کند، اپلیکیشن به‌جای استفاده دوباره از مبدأ رله قبلی، ثبت‌نام رله cache‌شده خود را تازه‌سازی می‌کند.

    نکته سازگاری:

    - `OPENCLAW_APNS_RELAY_BASE_URL` و `OPENCLAW_APNS_RELAY_TIMEOUT_MS` همچنان به‌عنوان overrideهای موقت env کار می‌کنند.
    - URLهای رله سفارشی Gateway باید با URL پایه رله‌ای که در build iOS تعبیه شده مطابقت داشته باشند. مسیر انتشار عمومی App Store، overrideهای URL رله سفارشی iOS را رد می‌کند.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` همچنان یک راه فرار توسعه‌ای فقط برای loopback است؛ URLهای رله HTTP را در پیکربندی پایدار نکنید.

    برای جریان سرتاسری، [اپلیکیشن iOS](/fa/platforms/ios#relay-backed-push-for-official-builds) و برای مدل امنیتی رله، [جریان احراز هویت و اعتماد](/fa/platforms/ios#authentication-and-trust-flow) را ببینید.

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
    - `directPolicy`: `allow` (پیش‌فرض) یا `block` برای هدف‌های Heartbeat به سبک DM
    - برای راهنمای کامل، [Heartbeat](/fa/gateway/heartbeat) را ببینید.

  </Accordion>

  <Accordion title="پیکربندی jobهای Cron">
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

    - `sessionRetention`: نشست‌های اجرای ایزوله تکمیل‌شده را از `sessions.json` هرس می‌کند (پیش‌فرض `24h`؛ برای غیرفعال‌سازی `false` را تنظیم کنید).
    - `runLog`: ردیف‌های نگه‌داشته‌شده تاریخچه اجرای Cron را به‌ازای هر job هرس می‌کند. `maxBytes` همچنان برای run logهای قدیمی مبتنی بر فایل پذیرفته می‌شود.
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
    - همه محتوای payload hook/webhook را ورودی غیرقابل اعتماد در نظر بگیرید.
    - از یک `hooks.token` اختصاصی استفاده کنید؛ secretهای فعال احراز هویت Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) را دوباره استفاده نکنید.
    - احراز هویت hook فقط از طریق header است (`Authorization: Bearer ...` یا `x-openclaw-token`)؛ tokenهای query-string رد می‌شوند.
    - `hooks.path` نمی‌تواند `/` باشد؛ ورودی webhook را روی یک زیرمسیر اختصاصی مانند `/hooks` نگه دارید.
    - flagهای bypass برای محتوای ناامن (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) را غیرفعال نگه دارید مگر برای debugging با محدوده بسیار محدود.
    - اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را نیز تنظیم کنید تا session keyهای انتخاب‌شده توسط فراخواننده محدود شوند.
    - برای agentهای هدایت‌شده با hook، tierهای مدل مدرن و قوی و سیاست tool سخت‌گیرانه را ترجیح دهید (برای مثال فقط پیام‌رسانی به‌علاوه sandboxing در صورت امکان).

    برای همه گزینه‌های mapping و یکپارچه‌سازی Gmail، [مرجع کامل](/fa/gateway/configuration-reference#hooks) را ببینید.

  </Accordion>

  <Accordion title="پیکربندی مسیریابی چند-agent">
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

    برای قواعد binding و پروفایل‌های دسترسی به‌ازای هر agent، [چند-Agent](/fa/concepts/multi-agent) و [مرجع کامل](/fa/gateway/config-agents#multi-agent-routing) را ببینید.

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

    - **فایل تکی**: شیء دربرگیرنده را جایگزین می‌کند
    - **آرایه‌ای از فایل‌ها**: به‌ترتیب deep-merge می‌شوند (مورد بعدی برنده است)
    - **کلیدهای sibling**: پس از includeها merge می‌شوند (مقادیر include‌شده را override می‌کنند)
    - **includeهای تو در تو**: تا عمق 10 سطح پشتیبانی می‌شوند
    - **مسیرهای نسبی**: نسبت به فایل includeکننده resolve می‌شوند
    - **قالب مسیر**: مسیرهای include نباید شامل null byte باشند و باید قبل و بعد از resolution، کاملا کوتاه‌تر از 4096 کاراکتر باشند
    - **نوشتن‌های متعلق به OpenClaw**: وقتی یک نوشتن فقط یک بخش top-level را تغییر می‌دهد
      که پشتوانه آن یک include تک‌فایلی مانند `plugins: { $include: "./plugins.json5" }` است،
      OpenClaw همان فایل include‌شده را به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد
    - **write-through پشتیبانی‌نشده**: root includeها، آرایه‌های include، و includeهایی
      با overrideهای sibling برای نوشتن‌های متعلق به OpenClaw fail closed می‌شوند، به‌جای اینکه
      پیکربندی را flatten کنند
    - **محصورسازی**: مسیرهای `$include` باید زیر دایرکتوری نگهدارنده
      `openclaw.json` resolve شوند. برای اشتراک‌گذاری یک درخت بین ماشین‌ها یا کاربران، مقدار
      `OPENCLAW_INCLUDE_ROOTS` را به path-list (`:` در POSIX، `;` در Windows) از
      دایرکتوری‌های اضافی تنظیم کنید که includeها می‌توانند به آن‌ها ارجاع دهند. symlinkها resolve
      و دوباره بررسی می‌شوند، بنابراین مسیری که از نظر لفظی در یک دایرکتوری config قرار دارد اما
      هدف واقعی آن از هر root مجاز خارج می‌شود همچنان رد می‌شود.
    - **مدیریت خطا**: خطاهای روشن برای فایل‌های گم‌شده، خطاهای parse، includeهای چرخه‌ای، قالب مسیر نامعتبر، و طول بیش از حد

  </Accordion>
</AccordionGroup>

## بارگذاری مجدد داغ پیکربندی

Gateway فایل `~/.openclaw/openclaw.json` را watch می‌کند و تغییرات را به‌صورت خودکار اعمال می‌کند - برای بیشتر تنظیمات نیازی به restart دستی نیست.

ویرایش مستقیم فایل تا زمانی که validate نشود غیرقابل اعتماد تلقی می‌شود. watcher منتظر می‌ماند
تا churn مربوط به temp-write/rename ویرایشگر آرام شود، فایل نهایی را می‌خواند، و
ویرایش‌های خارجی نامعتبر را بدون بازنویسی `openclaw.json` رد می‌کند. نوشتن‌های پیکربندی
متعلق به OpenClaw پیش از نوشتن از همان gate schema استفاده می‌کنند؛ clobberهای مخرب مانند
حذف `gateway.mode` یا کوچک کردن فایل به بیش از نصف رد می‌شوند و
برای بررسی به‌صورت `.rejected.*` ذخیره می‌شوند.

اگر `config reload skipped (invalid config)` را می‌بینید یا startup، `Invalid
config` گزارش می‌کند، پیکربندی را بررسی کنید، `openclaw config validate` را اجرا کنید، سپس برای تعمیر `openclaw
doctor --fix` را اجرا کنید. برای checklist، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)
را ببینید.

### حالت‌های بارگذاری مجدد

| حالت                   | رفتار                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (پیش‌فرض) | تغییرات safe را فوری hot-apply می‌کند. برای موارد critical به‌صورت خودکار restart می‌کند.           |
| **`hot`**              | فقط تغییرات safe را hot-apply می‌کند. وقتی restart لازم باشد warning ثبت می‌کند - مدیریت آن با شماست. |
| **`restart`**          | Gateway را با هر تغییر پیکربندی restart می‌کند، چه safe باشد چه نباشد.                                 |
| **`off`**              | file watching را غیرفعال می‌کند. تغییرات در restart دستی بعدی اعمال می‌شوند.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### چه چیزی hot-apply می‌شود و چه چیزی به restart نیاز دارد

بیشتر فیلدها بدون downtime به‌صورت hot-apply اعمال می‌شوند. در حالت `hybrid`، تغییراتی که نیازمند restart هستند به‌صورت خودکار مدیریت می‌شوند.

| دسته‌بندی          | فیلدها                                                            | نیاز به راه‌اندازی دوباره؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| کانال‌ها            | `channels.*`، `web` (WhatsApp) - همه کانال‌های داخلی و Plugin     | خیر             |
| عامل و مدل‌ها       | `agent`، `agents`، `models`، `routing`                            | خیر             |
| خودکارسازی          | `hooks`، `cron`، `agent.heartbeat`                                | خیر             |
| نشست‌ها و پیام‌ها   | `session`، `messages`                                             | خیر             |
| ابزارها و رسانه     | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk`              | خیر             |
| رابط کاربری و متفرقه | `ui`، `logging`، `identity`، `bindings`                           | خیر             |
| سرور Gateway        | `gateway.*` (port، bind، auth، tailscale، TLS، HTTP)              | **بله**         |
| زیرساخت             | `discovery`، `plugins`                                            | **بله**         |

<Note>
`gateway.reload` و `gateway.remote` استثنا هستند - تغییر آن‌ها باعث راه‌اندازی دوباره **نمی‌شود**.
</Note>

### برنامه‌ریزی بارگذاری دوباره

وقتی یک فایل منبع را که از طریق `$include` ارجاع داده شده ویرایش می‌کنید، OpenClaw بارگذاری دوباره را
از چیدمان نوشته‌شده در منبع برنامه‌ریزی می‌کند، نه از نمای مسطح‌شده در حافظه.
این کار تصمیم‌های بارگذاری داغ (اعمال داغ در برابر راه‌اندازی دوباره) را حتی زمانی قابل پیش‌بینی نگه می‌دارد که
یک بخش سطح‌بالای واحد در فایل include‌شده خودش قرار دارد، مانند
`plugins: { $include: "./plugins.json5" }`. اگر چیدمان منبع مبهم باشد، برنامه‌ریزی بارگذاری دوباره به‌صورت بسته شکست می‌خورد.

## RPC پیکربندی (به‌روزرسانی‌های برنامه‌نویسی‌شده)

برای ابزارهایی که پیکربندی را از طریق API Gateway می‌نویسند، این جریان را ترجیح دهید:

- `config.schema.lookup` برای بررسی یک زیردرخت (گره سطحی schema + خلاصه‌های فرزند)
- `config.get` برای دریافت snapshot فعلی به‌همراه `hash`
- `config.patch` برای به‌روزرسانی‌های جزئی (JSON merge patch: objectها merge می‌شوند، `null`
  حذف می‌کند، arrayها فقط وقتی با `replacePaths` به‌طور صریح تأیید شده باشد جایگزین می‌شوند اگر
  entryها حذف شوند)
- `config.apply` فقط وقتی قصد دارید کل پیکربندی را جایگزین کنید
- `update.run` برای self-update صریح به‌همراه راه‌اندازی دوباره؛ وقتی نشست پس از راه‌اندازی دوباره باید یک نوبت پیگیری اجرا کند، `continuationMessage` را وارد کنید
- `update.status` برای بررسی آخرین sentinel راه‌اندازی دوباره به‌روزرسانی و تأیید نسخه در حال اجرا پس از راه‌اندازی دوباره

عامل‌ها باید `config.schema.lookup` را اولین مقصد برای مستندات و محدودیت‌های دقیق
در سطح فیلد در نظر بگیرند. وقتی به نقشه پیکربندی گسترده‌تر، پیش‌فرض‌ها یا لینک‌های
ارجاع به زیرسامانه‌های اختصاصی نیاز دارند، از [مرجع پیکربندی](/fa/gateway/configuration-reference)
استفاده کنید.

<Note>
نوشتن‌های control-plane (`config.apply`، `config.patch`، `update.run`) برای هر `deviceId+clientIp`
به ۳ درخواست در هر ۶۰ ثانیه محدود می‌شوند. درخواست‌های راه‌اندازی دوباره
با هم ادغام می‌شوند و سپس بین چرخه‌های راه‌اندازی دوباره یک cooldown سی‌ثانیه‌ای اعمال می‌کنند.
`update.status` فقط خواندنی است اما در محدوده admin قرار دارد، چون sentinel راه‌اندازی دوباره می‌تواند
شامل خلاصه‌های مرحله به‌روزرسانی و tail خروجی command باشد.
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
`note` و `restartDelayMs` را می‌پذیرند. وقتی پیکربندی از قبل وجود داشته باشد،
`baseHash` برای هر دو method الزامی است.

`config.patch` همچنین `replacePaths` را می‌پذیرد، آرایه‌ای از مسیرهای پیکربندی که جایگزینی array
در آن‌ها عمدی است. اگر یک patch قرار باشد یک array موجود را با entryهای کمتر جایگزین یا حذف کند،
Gateway نوشتن را رد می‌کند مگر اینکه همان مسیر دقیق در `replacePaths` آمده باشد؛ arrayهای تو در تو زیر entryهای array از `[]` استفاده می‌کنند، مانند
`agents.list[].skills`. این کار مانع می‌شود snapshotهای ناقص `config.get`
بی‌صدا arrayهای routing یا allowlist را خراب کنند. وقتی قصد دارید کل پیکربندی را جایگزین کنید، از `config.apply` استفاده کنید.

## متغیرهای محیطی

OpenClaw متغیرهای env را از فرایند والد به‌علاوه موارد زیر می‌خواند:

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

<Accordion title="وارد کردن env شل (اختیاری)">
  اگر فعال باشد و کلیدهای مورد انتظار تنظیم نشده باشند، OpenClaw login shell شما را اجرا می‌کند و فقط کلیدهای گمشده را وارد می‌کند:

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

- فقط نام‌های uppercase تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`
- متغیرهای گمشده/خالی در زمان load خطا می‌دهند
- برای خروجی literal با `$${VAR}` escape کنید
- داخل فایل‌های `$include` کار می‌کند
- جایگزینی درون‌خطی: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="ارجاع‌های Secret (env، file، exec)">
  برای فیلدهایی که از objectهای SecretRef پشتیبانی می‌کنند، می‌توانید از این استفاده کنید:

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

جزئیات SecretRef (از جمله `secrets.providers` برای `env`/`file`/`exec`) در [مدیریت Secrets](/fa/gateway/secrets) آمده است.
مسیرهای credential پشتیبانی‌شده در [سطح Credential مربوط به SecretRef](/fa/reference/secretref-credential-surface) فهرست شده‌اند.
</Accordion>

برای precedence و sourceهای کامل، [محیط](/fa/help/environment) را ببینید.

## مرجع کامل

برای مرجع کامل فیلد به فیلد، **[مرجع پیکربندی](/fa/gateway/configuration-reference)** را ببینید.

---

_مرتبط: [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [مرجع پیکربندی](/fa/gateway/configuration-reference) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
- [Runbook Gateway](/fa/gateway)
