---
read_when:
    - راه‌اندازی OpenClaw برای نخستین بار
    - در حال جست‌وجوی الگوهای رایج پیکربندی
    - رفتن به بخش‌های مشخص پیکربندی
summary: 'نمای کلی پیکربندی: کارهای رایج، راه‌اندازی سریع، و پیوندهایی به مرجع کامل'
title: پیکربندی
x-i18n:
    generated_at: "2026-05-01T11:46:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6697f8800f29fbdf369f95bd442842d0bb6a341dcf8efa4698a2f43c8acc8981
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw یک پیکربندی اختیاری <Tooltip tip="JSON5 از کامنت‌ها و ویرگول‌های انتهایی پشتیبانی می‌کند">**JSON5**</Tooltip> را از `~/.openclaw/openclaw.json` می‌خواند.
مسیر پیکربندی فعال باید یک فایل معمولی باشد. چیدمان‌های `openclaw.json`
که symlink شده‌اند برای نوشتن‌های تحت مالکیت OpenClaw پشتیبانی نمی‌شوند؛ یک نوشتن اتمیک ممکن است
به‌جای حفظ symlink، مسیر را جایگزین کند. اگر پیکربندی را بیرون از
دایرکتوری وضعیت پیش‌فرض نگه می‌دارید، `OPENCLAW_CONFIG_PATH` را مستقیما به فایل واقعی اشاره دهید.

اگر فایل وجود نداشته باشد، OpenClaw از پیش‌فرض‌های امن استفاده می‌کند. دلایل رایج برای افزودن پیکربندی:

- اتصال کانال‌ها و کنترل اینکه چه کسی می‌تواند به ربات پیام بدهد
- تنظیم مدل‌ها، ابزارها، sandboxing، یا خودکارسازی (cron، hooks)
- تنظیم دقیق نشست‌ها، رسانه، شبکه، یا رابط کاربری

برای همه فیلدهای موجود، [مرجع کامل](/fa/gateway/configuration-reference) را ببینید.

عامل‌ها و خودکارسازی باید پیش از ویرایش پیکربندی، برای مستندات دقیق در سطح فیلد
از `config.schema.lookup` استفاده کنند. از این صفحه برای راهنمایی وظیفه‌محور و از
[مرجع پیکربندی](/fa/gateway/configuration-reference) برای نقشه گسترده‌تر
فیلدها و پیش‌فرض‌ها استفاده کنید.

<Tip>
**تازه با پیکربندی شروع کرده‌اید؟** برای راه‌اندازی تعاملی با `openclaw onboard` شروع کنید، یا برای پیکربندی‌های کامل قابل کپی و جای‌گذاری، راهنمای [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) را ببینید.
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
    رابط کاربری کنترل یک فرم را از schema پیکربندی زنده رندر می‌کند، شامل
    فراداده مستندات فیلدهای `title` / `description` به‌همراه schemaهای Plugin و کانال در صورت
    موجود بودن، با یک ویرایشگر **JSON خام** به‌عنوان راه گریز. برای رابط‌های کاربری
    drill-down و ابزارهای دیگر، Gateway همچنین `config.schema.lookup` را برای
    دریافت یک گره schema محدود به مسیر به‌همراه خلاصه‌های فرزند مستقیم در اختیار می‌گذارد.
  </Tab>
  <Tab title="ویرایش مستقیم">
    `~/.openclaw/openclaw.json` را مستقیما ویرایش کنید. Gateway فایل را پایش می‌کند و تغییرات را به‌صورت خودکار اعمال می‌کند ([بارگذاری مجدد داغ](#config-hot-reload) را ببینید).
  </Tab>
</Tabs>

## اعتبارسنجی سخت‌گیرانه

<Warning>
OpenClaw فقط پیکربندی‌هایی را می‌پذیرد که کاملا با schema مطابقت داشته باشند. کلیدهای ناشناخته، نوع‌های بدشکل، یا مقدارهای نامعتبر باعث می‌شوند Gateway **از شروع به کار خودداری کند**. تنها استثنای سطح ریشه `$schema` (string) است، تا ویرایشگرها بتوانند فراداده JSON Schema را متصل کنند.
</Warning>

`openclaw config schema`، JSON Schema مرجع را که توسط رابط کاربری کنترل
و اعتبارسنجی استفاده می‌شود چاپ می‌کند. `config.schema.lookup` یک گره واحد محدود به مسیر را به‌همراه
خلاصه‌های فرزند برای ابزارهای drill-down دریافت می‌کند. فراداده مستندات فیلدهای `title`/`description`
در objectهای تو در تو، wildcard (`*`)، array-item (`[]`)، و شاخه‌های `anyOf`/
`oneOf`/`allOf` منتقل می‌شود. schemaهای Plugin و کانال زمان اجرا هنگامی که
registry manifest بارگذاری شود ادغام می‌شوند.

وقتی اعتبارسنجی شکست بخورد:

- Gateway بوت نمی‌شود
- فقط دستورهای تشخیصی کار می‌کنند (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- برای دیدن مشکلات دقیق، `openclaw doctor` را اجرا کنید
- برای اعمال تعمیرات، `openclaw doctor --fix` (یا `--yes`) را اجرا کنید

Gateway پس از هر راه‌اندازی موفق، یک نسخه مورد اعتمادِ آخرین وضعیت سالم نگه می‌دارد.
اگر `openclaw.json` بعدا در اعتبارسنجی شکست بخورد (یا `gateway.mode` را حذف کند، به‌شدت
کوچک شود، یا یک خط لاگ سرگردان به ابتدای آن اضافه شود)، OpenClaw فایل خراب را
با نام `.clobbered.*` حفظ می‌کند، نسخه آخرین وضعیت سالم را بازیابی می‌کند، و دلیل بازیابی را
ثبت می‌کند. نوبت بعدی عامل نیز یک هشدار system-event دریافت می‌کند تا عامل اصلی
کورکورانه پیکربندی بازیابی‌شده را بازنویسی نکند. ارتقا به آخرین وضعیت سالم
وقتی یک نامزد شامل placeholderهای secret حذف‌شده مانند `***` باشد رد می‌شود.
وقتی همه مشکلات اعتبارسنجی به `plugins.entries.<id>...` محدود باشند، OpenClaw
بازیابی کل فایل انجام نمی‌دهد. پیکربندی فعلی را فعال نگه می‌دارد و
شکست محلی Plugin را نمایش می‌دهد تا ناسازگاری schema یک Plugin یا نسخه میزبان
نتواند تنظیمات نامرتبط کاربر را برگرداند.

## وظایف رایج

<AccordionGroup>
  <Accordion title="راه‌اندازی یک کانال (WhatsApp، Telegram، Discord، و غیره)">
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

    - `agents.defaults.models` کاتالوگ مدل را تعریف می‌کند و به‌عنوان allowlist برای `/model` عمل می‌کند.
    - برای افزودن ورودی‌های allowlist بدون حذف مدل‌های موجود، از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. جایگزینی‌های ساده‌ای که ورودی‌ها را حذف کنند رد می‌شوند مگر اینکه `--replace` را پاس کنید.
    - ارجاع‌های مدل از قالب `provider/model` استفاده می‌کنند (مثلا `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` کوچک‌سازی تصویر transcript/tool را کنترل می‌کند (پیش‌فرض `1200`)؛ مقدارهای کمتر معمولا مصرف vision-token را در اجراهای سنگین از نظر screenshot کاهش می‌دهند.
    - برای تغییر مدل‌ها در چت، [CLI مدل‌ها](/fa/concepts/models) را ببینید و برای چرخش auth و رفتار fallback، [Failover مدل](/fa/concepts/model-failover) را ببینید.
    - برای providerهای سفارشی/خودمیزبان، [providerهای سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) را در مرجع ببینید.

  </Accordion>

  <Accordion title="کنترل اینکه چه کسی می‌تواند به ربات پیام بدهد">
    دسترسی DM به‌ازای هر کانال از طریق `dmPolicy` کنترل می‌شود:

    - `"pairing"` (پیش‌فرض): فرستنده‌های ناشناخته یک کد pairing یک‌بارمصرف برای تایید دریافت می‌کنند
    - `"allowlist"`: فقط فرستنده‌های موجود در `allowFrom` (یا مخزن allow جفت‌شده)
    - `"open"`: اجازه به همه DMهای ورودی (به `allowFrom: ["*"]` نیاز دارد)
    - `"disabled"`: نادیده گرفتن همه DMها

    برای گروه‌ها، از `groupPolicy` + `groupAllowFrom` یا allowlistهای ویژه کانال استفاده کنید.

    برای جزئیات هر کانال، [مرجع کامل](/fa/gateway/config-channels#dm-and-group-access) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی کنترل mention در گفت‌وگوی گروهی">
    پیام‌های گروهی به‌صورت پیش‌فرض **نیازمند mention** هستند. الگوهای trigger را برای هر عامل پیکربندی کنید و پاسخ‌های قابل مشاهده اتاق را روی مسیر پیش‌فرض message-tool نگه دارید مگر اینکه عمدا پاسخ‌های نهایی خودکار legacy را بخواهید:

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

    - **mentionهای فراداده‌ای**: @-mentionهای بومی (WhatsApp tap-to-mention، Telegram @bot، و غیره)
    - **الگوهای متنی**: الگوهای regex امن در `mentionPatterns`
    - **پاسخ‌های قابل مشاهده**: `messages.visibleReplies` می‌تواند ارسال‌های message-tool را به‌صورت سراسری الزامی کند؛ `messages.groupChat.visibleReplies` این مورد را برای گروه‌ها/کانال‌ها override می‌کند.
    - برای حالت‌های پاسخ قابل مشاهده، overrideهای هر کانال، و حالت self-chat، [مرجع کامل](/fa/gateway/config-channels#group-chat-mention-gating) را ببینید.

  </Accordion>

  <Accordion title="محدود کردن Skills به‌ازای هر عامل">
    برای یک baseline مشترک از `agents.defaults.skills` استفاده کنید، سپس عامل‌های مشخص را
    با `agents.list[].skills` override کنید:

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
    - برای ارث‌بری از پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
    - برای بدون Skills بودن، `agents.list[].skills: []` را تنظیم کنید.
    - [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و
      [مرجع پیکربندی](/fa/gateway/config-agents#agents-defaults-skills) را ببینید.

  </Accordion>

  <Accordion title="تنظیم پایش سلامت کانال Gateway">
    کنترل کنید Gateway کانال‌هایی را که stale به‌نظر می‌رسند با چه شدتی restart کند:

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
    - `channelStaleEventThresholdMinutes` باید بزرگ‌تر یا مساوی interval بررسی باشد.
    - برای غیرفعال کردن restartهای خودکار برای یک کانال یا حساب بدون غیرفعال کردن monitor سراسری، از `channels.<provider>.healthMonitor.enabled` یا `channels.<provider>.accounts.<id>.healthMonitor.enabled` استفاده کنید.
    - برای debugging عملیاتی، [بررسی‌های سلامت](/fa/gateway/health) را ببینید و برای همه فیلدها [مرجع کامل](/fa/gateway/configuration-reference#gateway) را ببینید.

  </Accordion>

  <Accordion title="تنظیم timeout handshake WebSocket در Gateway">
    به کلاینت‌های محلی زمان بیشتری بدهید تا handshake پیش از auth برای WebSocket را روی
    میزبان‌های پربار یا کم‌توان کامل کنند:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - پیش‌فرض `15000` میلی‌ثانیه است.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` همچنان برای overrideهای موردی سرویس یا shell اولویت دارد.
    - ابتدا رفع stallهای startup/event-loop را ترجیح دهید؛ این knob برای میزبان‌هایی است که سالم هستند اما هنگام warmup کندند.

  </Accordion>

  <Accordion title="پیکربندی نشست‌ها و resetها">
    نشست‌ها پیوستگی و جداسازی مکالمه را کنترل می‌کنند:

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
    - `threadBindings`: پیش‌فرض‌های سراسری برای مسیریابی نشست‌های وابسته به رشته (Discord از `/focus`، `/unfocus`، `/agents`، `/session idle` و `/session max-age` پشتیبانی می‌کند).
    - برای دامنه‌بندی، پیوندهای هویت، و سیاست ارسال، [مدیریت نشست](/fa/concepts/session) را ببینید.
    - برای همه فیلدها، [مرجع کامل](/fa/gateway/config-agents#session) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی sandboxing">
    نشست‌های عامل را در زمان‌اجراهای sandbox ایزوله اجرا کنید:

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

    ابتدا تصویر را بسازید — از یک checkout منبع، `scripts/sandbox-setup.sh` را اجرا کنید، یا از نصب npm، فرمان درون‌خطی `docker build` را در [Sandboxing § Images and setup](/fa/gateway/sandboxing#images-and-setup) ببینید.

    برای راهنمای کامل، [Sandboxing](/fa/gateway/sandboxing) و برای همه گزینه‌ها [مرجع کامل](/fa/gateway/config-agents#agentsdefaultssandbox) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی push متکی بر relay برای بیلدهای رسمی iOS">
    push متکی بر relay در `openclaw.json` پیکربندی می‌شود.

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

    این کار چه انجام می‌دهد:

    - به Gateway اجازه می‌دهد `push.test`، تلنگرهای بیدارسازی، و بیدارسازی‌های اتصال مجدد را از طریق relay خارجی ارسال کند.
    - از مجوز ارسال با دامنه ثبت‌نام استفاده می‌کند که توسط اپ iOS جفت‌شده ارسال شده است. Gateway به token سراسری relay برای استقرار نیاز ندارد.
    - هر ثبت‌نام متکی بر relay را به هویت Gateway که اپ iOS با آن جفت شده است متصل می‌کند، بنابراین Gateway دیگری نمی‌تواند از ثبت‌نام ذخیره‌شده دوباره استفاده کند.
    - بیلدهای محلی/دستی iOS را روی APNs مستقیم نگه می‌دارد. ارسال‌های متکی بر relay فقط برای بیلدهای رسمی توزیع‌شده‌ای اعمال می‌شوند که از طریق relay ثبت‌نام کرده‌اند.
    - باید با URL پایه relay که در بیلد رسمی/TestFlight iOS تعبیه شده است مطابقت داشته باشد، تا ترافیک ثبت‌نام و ارسال به همان استقرار relay برسد.

    جریان سرتاسری:

    1. یک بیلد رسمی/TestFlight iOS را نصب کنید که با همان URL پایه relay کامپایل شده است.
    2. `gateway.push.apns.relay.baseUrl` را روی Gateway پیکربندی کنید.
    3. اپ iOS را با Gateway جفت کنید و اجازه دهید هر دو نشست node و operator متصل شوند.
    4. اپ iOS هویت Gateway را دریافت می‌کند، با استفاده از App Attest به‌همراه رسید اپ در relay ثبت‌نام می‌کند، و سپس payload متکی بر relay مربوط به `push.apns.register` را در Gateway جفت‌شده منتشر می‌کند.
    5. Gateway دسته relay و مجوز ارسال را ذخیره می‌کند، سپس از آن‌ها برای `push.test`، تلنگرهای بیدارسازی، و بیدارسازی‌های اتصال مجدد استفاده می‌کند.

    نکات عملیاتی:

    - اگر اپ iOS را به Gateway دیگری تغییر دهید، اپ را دوباره متصل کنید تا بتواند ثبت‌نام relay جدیدی را منتشر کند که به آن Gateway متصل است.
    - اگر بیلد جدیدی از iOS منتشر کنید که به استقرار relay متفاوتی اشاره می‌کند، اپ به‌جای استفاده دوباره از مبدا relay قدیمی، ثبت‌نام relay کش‌شده خود را تازه‌سازی می‌کند.

    نکته سازگاری:

    - `OPENCLAW_APNS_RELAY_BASE_URL` و `OPENCLAW_APNS_RELAY_TIMEOUT_MS` همچنان به‌عنوان overrideهای موقت env کار می‌کنند.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` همچنان یک راه گریز توسعه فقط برای loopback است؛ URLهای HTTP relay را در پیکربندی پایدار نکنید.

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

  <Accordion title="پیکربندی کارهای cron">
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

    - `sessionRetention`: نشست‌های اجرای ایزوله تکمیل‌شده را از `sessions.json` هرس می‌کند (پیش‌فرض `24h`؛ برای غیرفعال‌سازی `false` را تنظیم کنید).
    - `runLog`: `cron/runs/<jobId>.jsonl` را بر اساس اندازه و خطوط نگه‌داشته‌شده هرس می‌کند.
    - برای نمای کلی قابلیت و مثال‌های CLI، [کارهای Cron](/fa/automation/cron-jobs) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی webhooks (hooks)">
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
    - همه محتوای payloadهای hook/webhook را ورودی نامطمئن در نظر بگیرید.
    - از `hooks.token` اختصاصی استفاده کنید؛ token مشترک Gateway را دوباره استفاده نکنید.
    - احراز هویت hook فقط از طریق header است (`Authorization: Bearer ...` یا `x-openclaw-token`)؛ tokenهای query-string رد می‌شوند.
    - `hooks.path` نمی‌تواند `/` باشد؛ ورودی webhook را روی یک زیرمسیر اختصاصی مانند `/hooks` نگه دارید.
    - پرچم‌های bypass محتوای ناامن را غیرفعال نگه دارید (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) مگر برای اشکال‌زدایی با دامنه بسیار محدود.
    - اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، همچنین `hooks.allowedSessionKeyPrefixes` را تنظیم کنید تا کلیدهای نشست انتخاب‌شده توسط فراخواننده محدود شوند.
    - برای عامل‌های hook-driven، tierهای مدل مدرن و قوی و سیاست ابزار سخت‌گیرانه را ترجیح دهید (برای مثال فقط پیام‌رسانی به‌همراه sandboxing در صورت امکان).

    برای همه گزینه‌های mapping و یکپارچه‌سازی Gmail، [مرجع کامل](/fa/gateway/configuration-reference#hooks) را ببینید.

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

    برای قواعد binding و پروفایل‌های دسترسی هر عامل، [چندعاملی](/fa/concepts/multi-agent) و [مرجع کامل](/fa/gateway/config-agents#multi-agent-routing) را ببینید.

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
    - **آرایه‌ای از فایل‌ها**: به‌ترتیب به‌صورت deep-merge ادغام می‌شود (مورد بعدی برنده است)
    - **کلیدهای هم‌سطح**: پس از includeها ادغام می‌شوند (مقادیر include‌شده را override می‌کنند)
    - **includeهای تو در تو**: تا عمق ۱۰ سطح پشتیبانی می‌شوند
    - **مسیرهای نسبی**: نسبت به فایل شامل‌کننده resolve می‌شوند
    - **نوشتن‌های متعلق به OpenClaw**: وقتی یک نوشتن فقط یک بخش سطح‌بالا را تغییر می‌دهد
      که با include تک‌فایلی مانند `plugins: { $include: "./plugins.json5" }` پشتیبانی می‌شود،
      OpenClaw آن فایل include‌شده را به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد
    - **write-through پشتیبانی‌نشده**: includeهای root، آرایه‌های include، و includeهایی
      با overrideهای هم‌سطح برای نوشتن‌های متعلق به OpenClaw به‌صورت fail closed عمل می‌کنند، به‌جای اینکه
      پیکربندی را flatten کنند
    - **مدیریت خطا**: خطاهای روشن برای فایل‌های گم‌شده، خطاهای parse، و includeهای circular

  </Accordion>
</AccordionGroup>

## بارگذاری مجدد داغ پیکربندی

Gateway فایل `~/.openclaw/openclaw.json` را پایش می‌کند و تغییرات را به‌صورت خودکار اعمال می‌کند — برای بیشتر تنظیمات نیازی به راه‌اندازی مجدد دستی نیست.

ویرایش‌های مستقیم فایل تا زمانی که اعتبارسنجی شوند نامطمئن در نظر گرفته می‌شوند. watcher منتظر می‌ماند
تا آشفتگی temp-write/rename ویرایشگر آرام شود، فایل نهایی را می‌خواند، و
ویرایش‌های خارجی نامعتبر را با بازگرداندن آخرین پیکربندی معتبر شناخته‌شده رد می‌کند. نوشتن‌های پیکربندی متعلق به OpenClaw
پیش از نوشتن از همان gate schema استفاده می‌کنند؛ clobberهای مخرب
مانند حذف `gateway.mode` یا کوچک کردن فایل به بیش از نصف رد می‌شوند
و برای بررسی به‌صورت `.rejected.*` ذخیره می‌شوند.

شکست‌های اعتبارسنجی محلی Plugin استثنا هستند: اگر همه مشکلات زیر
`plugins.entries.<id>...` باشند، reload پیکربندی فعلی را نگه می‌دارد و مشکل Plugin
را گزارش می‌کند، به‌جای اینکه `.last-good` را بازگرداند.

اگر در لاگ‌ها `Config auto-restored from last-known-good` یا
`config reload restored last-known-good config` را دیدید، فایل متناظر
`.clobbered.*` کنار `openclaw.json` را بررسی کنید، payload ردشده را اصلاح کنید، سپس
`openclaw config validate` را اجرا کنید. برای چک‌لیست بازیابی، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-restored-last-known-good-config)
را ببینید.

### حالت‌های reload

| حالت                   | رفتار                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (پیش‌فرض) | تغییرات امن را بلافاصله به‌صورت داغ اعمال می‌کند. برای تغییرات بحرانی به‌صورت خودکار راه‌اندازی مجدد می‌کند.           |
| **`hot`**              | فقط تغییرات امن را به‌صورت داغ اعمال می‌کند. وقتی راه‌اندازی مجدد لازم باشد هشدار ثبت می‌کند — مدیریت آن با شماست. |
| **`restart`**          | Gateway را با هر تغییر پیکربندی، امن یا غیرامن، راه‌اندازی مجدد می‌کند.                                 |
| **`off`**              | پایش فایل را غیرفعال می‌کند. تغییرات در راه‌اندازی مجدد دستی بعدی اثر می‌کنند.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### چه چیزهایی به‌صورت داغ اعمال می‌شوند و چه چیزهایی به راه‌اندازی مجدد نیاز دارند

بیشتر فیلدها بدون downtime به‌صورت داغ اعمال می‌شوند. در حالت `hybrid`، تغییراتی که به راه‌اندازی مجدد نیاز دارند به‌صورت خودکار مدیریت می‌شوند.

| دسته‌بندی            | فیلدها                                                            | راه‌اندازی مجدد لازم است؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| کانال‌ها            | `channels.*`, `web` (WhatsApp) — همه کانال‌های داخلی و Plugin | خیر              |
| عامل و مدل‌ها      | `agent`, `agents`, `models`, `routing`                            | خیر              |
| خودکارسازی          | `hooks`, `cron`, `agent.heartbeat`                                | خیر              |
| نشست‌ها و پیام‌ها | `session`, `messages`                                             | خیر              |
| ابزارها و رسانه       | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | خیر              |
| UI و موارد متفرقه           | `ui`, `logging`, `identity`, `bindings`                           | خیر              |
| سرور Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **بله**         |
| زیرساخت      | `discovery`, `canvasHost`, `plugins`                              | **بله**         |

<Note>
`gateway.reload` و `gateway.remote` استثنا هستند — تغییر آن‌ها راه‌اندازی مجدد را trigger نمی‌کند.
</Note>

### برنامه‌ریزی reload

وقتی یک فایل منبع را که از طریق `$include` ارجاع شده است ویرایش می‌کنید، OpenClaw
بارگذاری مجدد را بر اساس چیدمان نوشته‌شده در منبع برنامه‌ریزی می‌کند، نه نمای
تخت‌شده‌ی درون حافظه. این کار تصمیم‌های بارگذاری مجدد داغ (اعمال داغ در برابر
راه‌اندازی مجدد) را قابل پیش‌بینی نگه می‌دارد، حتی وقتی یک بخش سطح‌بالای واحد
در فایل include‌شده‌ی خودش قرار دارد، مانند
`plugins: { $include: "./plugins.json5" }`. اگر چیدمان منبع مبهم باشد،
برنامه‌ریزی بارگذاری مجدد به‌صورت بسته شکست می‌خورد.

## RPC پیکربندی (به‌روزرسانی‌های برنامه‌نویسانه)

برای ابزارهایی که پیکربندی را از طریق API Gateway می‌نویسند، این روند را ترجیح دهید:

- `config.schema.lookup` برای بررسی یک زیردرخت (گره طرح‌واره‌ی کم‌عمق + خلاصه‌های فرزند)
- `config.get` برای دریافت snapshot فعلی به‌همراه `hash`
- `config.patch` برای به‌روزرسانی‌های جزئی (JSON merge patch: شیءها ادغام می‌شوند، `null`
  حذف می‌کند، آرایه‌ها جایگزین می‌شوند)
- `config.apply` فقط وقتی قصد دارید کل پیکربندی را جایگزین کنید
- `update.run` برای خودبه‌روزرسانی صریح به‌همراه راه‌اندازی مجدد
- `update.status` برای بررسی آخرین sentinel راه‌اندازی مجددِ به‌روزرسانی و تأیید نسخه‌ی در حال اجرا پس از راه‌اندازی مجدد

عامل‌ها باید `config.schema.lookup` را اولین مقصد برای مستندات و محدودیت‌های دقیق
در سطح فیلد بدانند. وقتی به نقشه‌ی گسترده‌تر پیکربندی، پیش‌فرض‌ها، یا پیوندهای
ارجاع‌های اختصاصی زیرسامانه نیاز دارند، از [مرجع پیکربندی](/fa/gateway/configuration-reference)
استفاده کنید.

<Note>
نوشتن‌های control-plane (`config.apply`, `config.patch`, `update.run`) به
۳ درخواست در هر ۶۰ ثانیه برای هر `deviceId+clientIp` محدود می‌شوند. درخواست‌های
راه‌اندازی مجدد با هم ادغام می‌شوند و سپس بین چرخه‌های راه‌اندازی مجدد یک cooldown
۳۰ ثانیه‌ای اعمال می‌کنند. `update.status` فقط خواندنی است، اما در محدوده‌ی admin
قرار دارد، چون sentinel راه‌اندازی مجدد می‌تواند شامل خلاصه‌های گام‌های به‌روزرسانی
و انتهای خروجی فرمان باشد.
</Note>

نمونه‌ی patch جزئی:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

هر دو `config.apply` و `config.patch` مقدارهای `raw`, `baseHash`, `sessionKey`,
`note`, و `restartDelayMs` را می‌پذیرند. وقتی پیکربندی از قبل وجود داشته باشد،
`baseHash` برای هر دو روش الزامی است.

## متغیرهای محیطی

OpenClaw متغیرهای محیطی را از فرایند والد و همچنین این موارد می‌خواند:

- `.env` از دایرکتوری کاری فعلی (اگر وجود داشته باشد)
- `~/.openclaw/.env` (fallback سراسری)

هیچ‌کدام از این فایل‌ها متغیرهای محیطی موجود را override نمی‌کنند. همچنین می‌توانید
متغیرهای محیطی inline را در پیکربندی تنظیم کنید:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="وارد کردن env شِل (اختیاری)">
  اگر فعال باشد و کلیدهای مورد انتظار تنظیم نشده باشند، OpenClaw شِل ورود شما را اجرا می‌کند و فقط کلیدهای گمشده را وارد می‌کند:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

معادل متغیر محیطی: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="جایگزینی متغیر محیطی در مقدارهای پیکربندی">
  در هر مقدار رشته‌ای پیکربندی، با `${VAR_NAME}` به متغیرهای محیطی ارجاع دهید:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

قواعد:

- فقط نام‌های بزرگ مطابق می‌شوند: `[A-Z_][A-Z0-9_]*`
- متغیرهای گمشده/خالی هنگام بارگذاری خطا ایجاد می‌کنند
- برای خروجی literal با `$${VAR}` escape کنید
- داخل فایل‌های `$include` کار می‌کند
- جایگزینی inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="ارجاع‌های محرمانه (env، file، exec)">
  برای فیلدهایی که از شیءهای SecretRef پشتیبانی می‌کنند، می‌توانید از این موارد استفاده کنید:

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

جزئیات SecretRef (از جمله `secrets.providers` برای `env`/`file`/`exec`) در [مدیریت محرمانه‌ها](/fa/gateway/secrets) آمده است.
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
- [runbook مربوط به Gateway](/fa/gateway)
