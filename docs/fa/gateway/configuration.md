---
read_when:
    - راه‌اندازی OpenClaw برای نخستین بار
    - در جست‌وجوی الگوهای رایج پیکربندی
    - پیمایش به بخش‌های مشخص پیکربندی
summary: 'نمای کلی پیکربندی: وظایف رایج، راه‌اندازی سریع، و پیوندهایی به مرجع کامل'
title: پیکربندی
x-i18n:
    generated_at: "2026-05-02T11:45:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5ad1685170923f26166fb2f74891468d16c6f86af5cc5f5f1da7a6dce65eb98
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw یک پیکربندی اختیاری <Tooltip tip="JSON5 از نظرها و ویرگول‌های پایانی پشتیبانی می‌کند">**JSON5**</Tooltip> را از `~/.openclaw/openclaw.json` می‌خواند.
مسیر پیکربندی فعال باید یک فایل معمولی باشد. چیدمان‌های `openclaw.json` که با symlink ساخته شده‌اند
برای نوشتن‌های متعلق به OpenClaw پشتیبانی نمی‌شوند؛ یک نوشتن اتمیک ممکن است
به‌جای حفظ symlink، مسیر را جایگزین کند. اگر پیکربندی را بیرون از
دایرکتوری وضعیت پیش‌فرض نگه می‌دارید، `OPENCLAW_CONFIG_PATH` را مستقیماً به فایل واقعی اشاره دهید.

اگر فایل وجود نداشته باشد، OpenClaw از پیش‌فرض‌های امن استفاده می‌کند. دلایل رایج برای افزودن پیکربندی:

- وصل کردن کانال‌ها و کنترل اینکه چه کسی می‌تواند به ربات پیام بدهد
- تنظیم مدل‌ها، ابزارها، sandboxing، یا خودکارسازی (Cron، هوک‌ها)
- تنظیم جلسه‌ها، رسانه، شبکه، یا UI

برای همه فیلدهای موجود، [مرجع کامل](/fa/gateway/configuration-reference) را ببینید.

عامل‌ها و خودکارسازی باید پیش از ویرایش پیکربندی، برای مستندات دقیق در سطح فیلد از
`config.schema.lookup` استفاده کنند. از این صفحه برای راهنمایی وظیفه‌محور و از
[مرجع پیکربندی](/fa/gateway/configuration-reference) برای نقشه گسترده‌تر
فیلدها و پیش‌فرض‌ها استفاده کنید.

<Tip>
**در پیکربندی تازه‌کار هستید؟** برای راه‌اندازی تعاملی با `openclaw onboard` شروع کنید، یا برای پیکربندی‌های کامل آماده کپی و جای‌گذاری، راهنمای [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) را ببینید.
</Tip>

## پیکربندی کمینه

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
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) را باز کنید و از زبانه **Config** استفاده کنید.
    Control UI فرمی را از schema پیکربندی زنده نمایش می‌دهد، شامل فراداده مستندات
    فیلدهای `title` / `description` به‌همراه schemaهای Plugin و کانال، وقتی
    در دسترس باشند، و یک ویرایشگر **Raw JSON** را به‌عنوان راه خروج ارائه می‌کند. برای UIهای
    drill-down و ابزارهای دیگر، Gateway همچنین `config.schema.lookup` را ارائه می‌کند تا
    یک گره schema محدود به مسیر به‌همراه خلاصه‌های فرزند بلافصل را واکشی کند.
  </Tab>
  <Tab title="ویرایش مستقیم">
    `~/.openclaw/openclaw.json` را مستقیماً ویرایش کنید. Gateway فایل را زیر نظر می‌گیرد و تغییرات را به‌طور خودکار اعمال می‌کند (نگاه کنید به [بارگذاری مجدد داغ](#config-hot-reload)).
  </Tab>
</Tabs>

## اعتبارسنجی سخت‌گیرانه

<Warning>
OpenClaw فقط پیکربندی‌هایی را می‌پذیرد که کاملاً با schema مطابقت داشته باشند. کلیدهای ناشناخته، نوع‌های بدشکل، یا مقدارهای نامعتبر باعث می‌شوند Gateway **از شروع به کار خودداری کند**. تنها استثنای سطح ریشه `$schema` (رشته) است، تا ویرایشگرها بتوانند فراداده JSON Schema را پیوست کنند.
</Warning>

`openclaw config schema`، JSON Schema رسمی مورد استفاده Control UI
و اعتبارسنجی را چاپ می‌کند. `config.schema.lookup` یک گره محدود به مسیر به‌همراه
خلاصه‌های فرزند را برای ابزارهای drill-down واکشی می‌کند. فراداده مستندات فیلدهای `title`/`description`
از میان آبجکت‌های تو در تو، wildcard (`*`)، آیتم‌های آرایه (`[]`)، و شاخه‌های `anyOf`/
`oneOf`/`allOf` عبور می‌کند. وقتی رجیستری manifest بارگذاری شود، schemaهای Plugin و کانال در زمان اجرا
در آن ادغام می‌شوند.

وقتی اعتبارسنجی شکست بخورد:

- Gateway بوت نمی‌شود
- فقط دستورهای تشخیصی کار می‌کنند (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- برای دیدن مشکلات دقیق، `openclaw doctor` را اجرا کنید
- برای اعمال تعمیرها، `openclaw doctor --fix` (یا `--yes`) را اجرا کنید

Gateway پس از هر شروع موفق، یک نسخه مورد اعتماد از آخرین پیکربندی سالم را نگه می‌دارد.
اگر `openclaw.json` بعداً در اعتبارسنجی شکست بخورد (یا `gateway.mode` را حذف کند، به‌شدت
کوچک شود، یا یک خط لاگ سرگردان به ابتدای آن اضافه شده باشد)، OpenClaw فایل خراب را
با نام `.clobbered.*` حفظ می‌کند، نسخه آخرین پیکربندی سالم را برمی‌گرداند، و دلیل بازیابی را
لاگ می‌کند. نوبت بعدی عامل نیز یک هشدار رویداد سیستمی دریافت می‌کند تا عامل اصلی
کورکورانه پیکربندی بازیابی‌شده را بازنویسی نکند. ارتقا به آخرین پیکربندی سالم
وقتی یک نامزد شامل جای‌نگهدارهای راز redacted مانند `***` باشد، رد می‌شود.
وقتی همه مشکلات اعتبارسنجی به `plugins.entries.<id>...` محدود باشند، OpenClaw
بازیابی کل فایل را انجام نمی‌دهد. پیکربندی فعلی را فعال نگه می‌دارد و
شکست محلی Plugin را نمایش می‌دهد تا ناسازگاری schema یک Plugin یا نسخه میزبان
نتواند تنظیمات نامرتبط کاربر را به عقب برگرداند.

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
    - برای افزودن ورودی‌های allowlist بدون حذف مدل‌های موجود، از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. جایگزینی‌های ساده‌ای که ورودی‌ها را حذف کنند رد می‌شوند، مگر اینکه `--replace` را بفرستید.
    - ارجاع‌های مدل از قالب `provider/model` استفاده می‌کنند (مثلاً `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` کوچک‌سازی تصویرهای transcript/tool را کنترل می‌کند (پیش‌فرض `1200`)؛ مقدارهای کمتر معمولاً مصرف vision-token را در اجراهای پر از اسکرین‌شات کاهش می‌دهند.
    - برای تعویض مدل‌ها در گفت‌وگو، [Models CLI](/fa/concepts/models) و برای چرخش احراز هویت و رفتار fallback، [Model Failover](/fa/concepts/model-failover) را ببینید.
    - برای providerهای سفارشی/خودمیزبان، [providerهای سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) را در مرجع ببینید.

  </Accordion>

  <Accordion title="کنترل اینکه چه کسی می‌تواند به ربات پیام بدهد">
    دسترسی DM برای هر کانال از طریق `dmPolicy` کنترل می‌شود:

    - `"pairing"` (پیش‌فرض): فرستنده‌های ناشناخته یک کد pairing یک‌بارمصرف برای تأیید دریافت می‌کنند
    - `"allowlist"`: فقط فرستنده‌های داخل `allowFrom` (یا فروشگاه allow جفت‌شده)
    - `"open"`: همه DMهای ورودی را مجاز می‌کند (نیازمند `allowFrom: ["*"]`)
    - `"disabled"`: همه DMها را نادیده می‌گیرد

    برای گروه‌ها، از `groupPolicy` + `groupAllowFrom` یا allowlistهای ویژه کانال استفاده کنید.

    برای جزئیات هر کانال، [مرجع کامل](/fa/gateway/config-channels#dm-and-group-access) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی کنترل mention در گفت‌وگوی گروهی">
    پیام‌های گروهی به‌طور پیش‌فرض **نیازمند mention** هستند. الگوهای trigger را برای هر عامل پیکربندی کنید، و پاسخ‌های قابل‌مشاهده اتاق را روی مسیر پیش‌فرض ابزار پیام نگه دارید، مگر اینکه عمداً پاسخ‌های نهایی خودکار قدیمی را بخواهید:

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

    - **mentionهای فراداده**: @-mentionهای بومی (tap-to-mention در WhatsApp، @bot در Telegram، و غیره)
    - **الگوهای متنی**: الگوهای regex امن در `mentionPatterns`
    - **پاسخ‌های قابل‌مشاهده**: `messages.visibleReplies` می‌تواند ارسال‌های ابزار پیام را به‌صورت سراسری الزامی کند؛ `messages.groupChat.visibleReplies` این را برای گروه‌ها/کانال‌ها override می‌کند.
    - برای حالت‌های پاسخ قابل‌مشاهده، overrideهای هر کانال، و حالت self-chat، [مرجع کامل](/fa/gateway/config-channels#group-chat-mention-gating) را ببینید.

  </Accordion>

  <Accordion title="محدود کردن Skills برای هر عامل">
    برای یک baseline مشترک از `agents.defaults.skills` استفاده کنید، سپس عامل‌های مشخص را با
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
    - برای به ارث بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
    - برای نبود Skills، `agents.list[].skills: []` را تنظیم کنید.
    - [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و
      [مرجع پیکربندی](/fa/gateway/config-agents#agents-defaults-skills) را ببینید.

  </Accordion>

  <Accordion title="تنظیم پایش سلامت کانال Gateway">
    کنترل کنید Gateway کانال‌هایی را که کهنه به نظر می‌رسند با چه شدتی restart کند:

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
    - `channelStaleEventThresholdMinutes` باید بزرگ‌تر یا برابر با فاصله بررسی باشد.
    - برای غیرفعال کردن restartهای خودکار برای یک کانال یا حساب بدون غیرفعال کردن پایشگر سراسری، از `channels.<provider>.healthMonitor.enabled` یا `channels.<provider>.accounts.<id>.healthMonitor.enabled` استفاده کنید.
    - برای اشکال‌زدایی عملیاتی، [Health Checks](/fa/gateway/health) و برای همه فیلدها [مرجع کامل](/fa/gateway/configuration-reference#gateway) را ببینید.

  </Accordion>

  <Accordion title="تنظیم timeout دست‌دهی WebSocket در Gateway">
    به clientهای محلی زمان بیشتری بدهید تا دست‌دهی WebSocket پیش از احراز هویت را روی
    میزبان‌های پربار یا کم‌توان کامل کنند:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - پیش‌فرض `15000` میلی‌ثانیه است.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` همچنان برای overrideهای یک‌باره سرویس یا shell تقدم دارد.
    - ابتدا رفع توقف‌های startup/event-loop را ترجیح دهید؛ این knob برای میزبان‌هایی است که سالم‌اند اما هنگام warmup کند هستند.

  </Accordion>

  <Accordion title="پیکربندی جلسه‌ها و resetها">
    جلسه‌ها تداوم و جداسازی گفت‌وگو را کنترل می‌کنند:

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
    - برای دامنه‌بندی، پیوندهای هویتی، و سیاست ارسال، [مدیریت نشست](/fa/concepts/session) را ببینید.
    - برای همه فیلدها، [مرجع کامل](/fa/gateway/config-agents#session) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی sandboxing">
    نشست‌های عامل را در runtimeهای sandbox ایزوله اجرا کنید:

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

    ابتدا تصویر را بسازید — از یک checkout منبع، `scripts/sandbox-setup.sh` را اجرا کنید، یا از یک نصب npm، دستور درون‌خطی `docker build` را در [Sandboxing § تصاویر و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) ببینید.

    برای راهنمای کامل [Sandboxing](/fa/gateway/sandboxing) و برای همه گزینه‌ها [مرجع کامل](/fa/gateway/config-agents#agentsdefaultssandbox) را ببینید.

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

    - به gateway اجازه می‌دهد `push.test`، تلنگرهای بیدارباش، و بیدارباش‌های اتصال مجدد را از طریق relay خارجی ارسال کند.
    - از یک مجوز ارسال با دامنه ثبت‌نام استفاده می‌کند که برنامه iOS جفت‌شده آن را ارسال کرده است. gateway به توکن relay در سطح deployment نیاز ندارد.
    - هر ثبت‌نام مبتنی بر relay را به هویت gateway که برنامه iOS با آن جفت شده است متصل می‌کند، بنابراین gateway دیگری نمی‌تواند از ثبت‌نام ذخیره‌شده دوباره استفاده کند.
    - buildهای محلی/دستی iOS را روی APNs مستقیم نگه می‌دارد. ارسال‌های مبتنی بر relay فقط برای buildهای توزیع‌شده رسمی که از طریق relay ثبت‌نام کرده‌اند اعمال می‌شوند.
    - باید با URL پایه relay که در build رسمی/TestFlight iOS قرار داده شده مطابقت داشته باشد، تا ترافیک ثبت‌نام و ارسال به همان deployment relay برسد.

    جریان سرتاسری:

    1. یک build رسمی/TestFlight iOS را نصب کنید که با همان URL پایه relay کامپایل شده است.
    2. `gateway.push.apns.relay.baseUrl` را روی gateway پیکربندی کنید.
    3. برنامه iOS را با gateway جفت کنید و اجازه دهید هر دو نشست node و operator وصل شوند.
    4. برنامه iOS هویت gateway را دریافت می‌کند، با استفاده از App Attest به‌همراه رسید برنامه در relay ثبت‌نام می‌کند، و سپس payload مبتنی بر relay مربوط به `push.apns.register` را به gateway جفت‌شده منتشر می‌کند.
    5. gateway شناسه relay و مجوز ارسال را ذخیره می‌کند، سپس از آن‌ها برای `push.test`، تلنگرهای بیدارباش، و بیدارباش‌های اتصال مجدد استفاده می‌کند.

    نکات عملیاتی:

    - اگر برنامه iOS را به gateway متفاوتی منتقل کردید، برنامه را دوباره وصل کنید تا بتواند ثبت‌نام relay جدیدی را که به آن gateway متصل است منتشر کند.
    - اگر build جدیدی از iOS منتشر کنید که به deployment relay متفاوتی اشاره می‌کند، برنامه به‌جای استفاده دوباره از مبدا relay قدیمی، ثبت‌نام relay کش‌شده خود را تازه‌سازی می‌کند.

    نکته سازگاری:

    - `OPENCLAW_APNS_RELAY_BASE_URL` و `OPENCLAW_APNS_RELAY_TIMEOUT_MS` همچنان به‌عنوان overrideهای موقت env کار می‌کنند.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` همچنان یک راه خروج توسعه فقط برای loopback است؛ URLهای relay مبتنی بر HTTP را در config ماندگار نکنید.

    برای جریان سرتاسری [برنامه iOS](/fa/platforms/ios#relay-backed-push-for-official-builds) و برای مدل امنیتی relay [جریان احراز هویت و اعتماد](/fa/platforms/ios#authentication-and-trust-flow) را ببینید.

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

    - `every`: رشته مدت‌زمان (`30m`، `2h`). برای غیرفعال‌سازی، `0m` تنظیم کنید.
    - `target`: `last` | `none` | `<channel-id>` (برای مثال `discord`، `matrix`، `telegram`، یا `whatsapp`)
    - `directPolicy`: `allow` (پیش‌فرض) یا `block` برای هدف‌های Heartbeat به سبک DM
    - برای راهنمای کامل [Heartbeat](/fa/gateway/heartbeat) را ببینید.

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

    - `sessionRetention`: نشست‌های اجرای ایزوله تکمیل‌شده را از `sessions.json` حذف می‌کند (پیش‌فرض `24h`؛ برای غیرفعال‌سازی `false` تنظیم کنید).
    - `runLog`: `cron/runs/<jobId>.jsonl` را بر اساس اندازه و تعداد خطوط نگه‌داشته‌شده پاک‌سازی می‌کند.
    - برای مرور قابلیت و مثال‌های CLI، [jobهای Cron](/fa/automation/cron-jobs) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی webhooks (hookها)">
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
    - همه محتوای payload مربوط به hook/webhook را ورودی نامطمئن در نظر بگیرید.
    - از یک `hooks.token` اختصاصی استفاده کنید؛ توکن مشترک Gateway را دوباره استفاده نکنید.
    - احراز هویت hook فقط مبتنی بر header است (`Authorization: Bearer ...` یا `x-openclaw-token`)؛ توکن‌های query-string رد می‌شوند.
    - `hooks.path` نمی‌تواند `/` باشد؛ ورود webhook را روی یک زیرمسیر اختصاصی مانند `/hooks` نگه دارید.
    - flagهای دور زدن محتوای ناامن را غیرفعال نگه دارید (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) مگر برای اشکال‌زدایی با دامنه بسیار محدود.
    - اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را هم تنظیم کنید تا کلیدهای نشست انتخاب‌شده توسط فراخواننده محدود شوند.
    - برای عامل‌های مبتنی بر hook، tierهای مدل مدرن و قوی و سیاست ابزار سخت‌گیرانه را ترجیح دهید (برای مثال فقط پیام‌رسانی به‌همراه sandboxing در صورت امکان).

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

    - **تک‌فایل**: شیء دربرگیرنده را جایگزین می‌کند
    - **آرایه‌ای از فایل‌ها**: به‌ترتیب به‌صورت deep-merge ادغام می‌شوند (مورد بعدی برنده است)
    - **کلیدهای هم‌سطح**: پس از includeها ادغام می‌شوند (مقادیر includeشده را override می‌کنند)
    - **includeهای تو در تو**: تا عمق ۱۰ سطح پشتیبانی می‌شوند
    - **مسیرهای نسبی**: نسبت به فایل includeکننده resolve می‌شوند
    - **نوشتن‌های تحت مالکیت OpenClaw**: وقتی یک نوشتن فقط یک بخش سطح‌بالا را تغییر می‌دهد
      که پشتوانه آن یک include تک‌فایلی مانند `plugins: { $include: "./plugins.json5" }` است،
      OpenClaw همان فایل includeشده را به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد
    - **write-through پشتیبانی‌نشده**: includeهای root، آرایه‌های include، و includeهایی
      با overrideهای هم‌سطح برای نوشتن‌های تحت مالکیت OpenClaw بسته و ناموفق می‌شوند، به‌جای اینکه
      config را تخت کنند
    - **محصورسازی**: مسیرهای `$include` باید زیر دایرکتوری نگه‌دارنده
      `openclaw.json` resolve شوند. برای اشتراک‌گذاری یک درخت میان ماشین‌ها یا کاربران،
      `OPENCLAW_INCLUDE_ROOTS` را روی یک path-list (`:` در POSIX، `;` در Windows) از
      دایرکتوری‌های اضافی تنظیم کنید که includeها ممکن است به آن‌ها ارجاع دهند. symlinkها resolve
      و دوباره بررسی می‌شوند، بنابراین مسیری که از نظر لفظی در یک دایرکتوری config قرار دارد اما
      مقصد واقعی آن از همه rootهای مجاز خارج می‌شود همچنان رد می‌شود.
    - **مدیریت خطا**: خطاهای روشن برای فایل‌های گم‌شده، خطاهای parse، و includeهای چرخه‌ای

  </Accordion>
</AccordionGroup>

## بارگذاری مجدد داغ config

Gateway فایل `~/.openclaw/openclaw.json` را watch می‌کند و تغییرات را به‌صورت خودکار اعمال می‌کند — برای بیشتر تنظیمات به راه‌اندازی مجدد دستی نیاز نیست.

ویرایش‌های مستقیم فایل تا زمانی که اعتبارسنجی شوند نامطمئن در نظر گرفته می‌شوند. watcher منتظر می‌ماند
تا نوسان‌های temp-write/rename ویرایشگر آرام شود، فایل نهایی را می‌خواند، و
ویرایش‌های خارجی نامعتبر را با بازگرداندن آخرین config سالم شناخته‌شده رد می‌کند. نوشتن‌های
config تحت مالکیت OpenClaw پیش از نوشتن از همان gate schema استفاده می‌کنند؛ clobberهای مخرب مانند
حذف `gateway.mode` یا کوچک کردن فایل به بیش از نصف رد می‌شوند
و برای بررسی به‌صورت `.rejected.*` ذخیره می‌شوند.

شکست‌های اعتبارسنجی محلی Plugin استثنا هستند: اگر همه مشکلات زیر
`plugins.entries.<id>...` باشند، reload پیکربندی فعلی را نگه می‌دارد و مشکل Plugin را
به‌جای بازگرداندن `.last-good` گزارش می‌کند.

اگر در logها `Config auto-restored from last-known-good` یا
`config reload restored last-known-good config` را دیدید، فایل منطبق
`.clobbered.*` کنار `openclaw.json` را بررسی کنید، payload ردشده را اصلاح کنید، سپس
`openclaw config validate` را اجرا کنید. برای فهرست بررسی بازیابی، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-restored-last-known-good-config)
را ببینید.

### حالت‌های reload

| حالت                   | رفتار                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (پیش‌فرض) | تغییرات امن را فورا به‌صورت داغ اعمال می‌کند. برای موارد بحرانی به‌صورت خودکار restart می‌کند.           |
| **`hot`**              | فقط تغییرات امن را به‌صورت داغ اعمال می‌کند. وقتی restart لازم باشد هشدار log می‌کند — شما آن را مدیریت می‌کنید. |
| **`restart`**          | Gateway را با هر تغییر config، چه امن باشد چه نباشد، restart می‌کند.                                 |
| **`off`**              | file watching را غیرفعال می‌کند. تغییرات در restart دستی بعدی اعمال می‌شوند.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### چه چیزهایی به‌صورت داغ اعمال می‌شوند و چه چیزهایی به restart نیاز دارند

بیشتر فیلدها بدون downtime به‌صورت داغ اعمال می‌شوند. در حالت `hybrid`، تغییراتی که به restart نیاز دارند به‌صورت خودکار مدیریت می‌شوند.

| دسته‌بندی | فیلدها | نیاز به راه‌اندازی مجدد؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| کانال‌ها | `channels.*`, `web` (WhatsApp) — همه کانال‌های داخلی و کانال‌های Plugin | خیر |
| عامل و مدل‌ها | `agent`, `agents`, `models`, `routing` | خیر |
| اتوماسیون | `hooks`, `cron`, `agent.heartbeat` | خیر |
| نشست‌ها و پیام‌ها | `session`, `messages` | خیر |
| ابزارها و رسانه | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk` | خیر |
| رابط کاربری و متفرقه | `ui`, `logging`, `identity`, `bindings` | خیر |
| سرور Gateway | `gateway.*` (درگاه، اتصال، احراز هویت، tailscale، TLS، HTTP) | **بله** |
| زیرساخت | `discovery`, `canvasHost`, `plugins` | **بله** |

<Note>
`gateway.reload` و `gateway.remote` استثنا هستند — تغییر آن‌ها باعث راه‌اندازی مجدد **نمی‌شود**.
</Note>

### برنامه‌ریزی بارگذاری مجدد

وقتی یک فایل منبع را ویرایش می‌کنید که از طریق `$include` ارجاع داده شده است، OpenClaw بارگذاری مجدد را از چیدمان نوشته‌شده در منبع برنامه‌ریزی می‌کند، نه از نمای تخت‌شده در حافظه. این کار باعث می‌شود تصمیم‌های بارگذاری مجدد داغ (اعمال داغ در برابر راه‌اندازی مجدد) قابل پیش‌بینی بمانند، حتی وقتی یک بخش سطح‌بالای واحد در فایل includeشده خودش قرار دارد، مانند `plugins: { $include: "./plugins.json5" }`. اگر چیدمان منبع مبهم باشد، برنامه‌ریزی بارگذاری مجدد به‌صورت بسته شکست می‌خورد.

## RPC پیکربندی (به‌روزرسانی‌های برنامه‌نویسی‌شده)

برای ابزارهایی که پیکربندی را از طریق API Gateway می‌نویسند، این جریان را ترجیح دهید:

- `config.schema.lookup` برای بررسی یک زیردرخت (گره اسکیمای سطحی + خلاصه‌های فرزند)
- `config.get` برای دریافت اسنپ‌شات فعلی به‌همراه `hash`
- `config.patch` برای به‌روزرسانی‌های جزئی (JSON merge patch: اشیا ادغام می‌شوند، `null` حذف می‌کند، آرایه‌ها جایگزین می‌شوند)
- `config.apply` فقط وقتی قصد دارید کل پیکربندی را جایگزین کنید
- `update.run` برای خودبه‌روزرسانی صریح به‌همراه راه‌اندازی مجدد
- `update.status` برای بررسی آخرین sentinel راه‌اندازی مجددِ به‌روزرسانی و تأیید نسخه در حال اجرا پس از راه‌اندازی مجدد

عامل‌ها باید `config.schema.lookup` را نخستین نقطه مراجعه برای مستندات و محدودیت‌های دقیق در سطح فیلد بدانند. وقتی به نقشه گسترده‌تر پیکربندی، پیش‌فرض‌ها، یا پیوندهای منابع اختصاصی زیرسامانه‌ها نیاز دارند، از [مرجع پیکربندی](/fa/gateway/configuration-reference) استفاده کنید.

<Note>
نوشتن‌های سطح کنترل (`config.apply`, `config.patch`, `update.run`) به 3 درخواست در هر 60 ثانیه برای هر `deviceId+clientIp` محدود می‌شوند. درخواست‌های راه‌اندازی مجدد با هم ادغام می‌شوند و سپس بین چرخه‌های راه‌اندازی مجدد یک دوره انتظار 30 ثانیه‌ای اعمال می‌کنند. `update.status` فقط‌خواندنی است اما در محدوده ادمین قرار دارد، چون sentinel راه‌اندازی مجدد می‌تواند خلاصه‌های مراحل به‌روزرسانی و انتهای خروجی فرمان را شامل شود.
</Note>

نمونه patch جزئی:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

هر دو `config.apply` و `config.patch` مقدارهای `raw`, `baseHash`, `sessionKey`, `note`, و `restartDelayMs` را می‌پذیرند. وقتی پیکربندی از قبل وجود داشته باشد، `baseHash` برای هر دو روش الزامی است.

## متغیرهای محیطی

OpenClaw متغیرهای محیطی را از پردازند والد و همچنین موارد زیر می‌خواند:

- `.env` از دایرکتوری کاری فعلی (اگر وجود داشته باشد)
- `~/.openclaw/.env` (fallback سراسری)

هیچ‌کدام از این فایل‌ها متغیرهای محیطی موجود را بازنویسی نمی‌کنند. همچنین می‌توانید متغیرهای محیطی درون‌خطی را در پیکربندی تنظیم کنید:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="وارد کردن محیط shell (اختیاری)">
  اگر فعال باشد و کلیدهای مورد انتظار تنظیم نشده باشند، OpenClaw shell ورود شما را اجرا می‌کند و فقط کلیدهای مفقود را وارد می‌کند:

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
  در هر مقدار رشته‌ای پیکربندی با `${VAR_NAME}` به متغیرهای محیطی ارجاع دهید:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

قواعد:

- فقط نام‌های بزرگ مطابق این الگو تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`
- متغیرهای مفقود/خالی هنگام بارگذاری خطا ایجاد می‌کنند
- برای خروجی لفظی با `$${VAR}` escape کنید
- داخل فایل‌های `$include` کار می‌کند
- جایگزینی درون‌خطی: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="ارجاع‌های محرمانه (محیط، فایل، اجرا)">
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

جزئیات SecretRef (از جمله `secrets.providers` برای `env`/`file`/`exec`) در [مدیریت محرمانه‌ها](/fa/gateway/secrets) آمده است. مسیرهای اعتبارنامه پشتیبانی‌شده در [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) فهرست شده‌اند.
</Accordion>

برای اولویت‌بندی کامل و منابع، [محیط](/fa/help/environment) را ببینید.

## مرجع کامل

برای مرجع کامل فیلدبه‌فیلد، **[مرجع پیکربندی](/fa/gateway/configuration-reference)** را ببینید.

---

_مرتبط: [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [مرجع پیکربندی](/fa/gateway/configuration-reference) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
- [Runbook Gateway](/fa/gateway)
