---
read_when:
    - راه‌اندازی OpenClaw برای نخستین بار
    - در حال جست‌وجوی الگوهای رایج پیکربندی
    - رفتن به بخش‌های مشخص پیکربندی
summary: 'نمای کلی پیکربندی: کارهای رایج، راه‌اندازی سریع، و پیوندهایی به مرجع کامل'
title: پیکربندی
x-i18n:
    generated_at: "2026-05-10T19:41:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023ce17d31ed16e061516a2026ac6c31fd8716548e230d27a7965b9a2d8c59c1
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw یک پیکربندی اختیاری <Tooltip tip="JSON5 از توضیحات و ویرگول‌های پایانی پشتیبانی می‌کند">**JSON5**</Tooltip> را از `~/.openclaw/openclaw.json` می‌خواند.
مسیر پیکربندی فعال باید یک فایل معمولی باشد. چیدمان‌های `openclaw.json`
که symlink شده‌اند برای نوشتن‌های متعلق به OpenClaw پشتیبانی نمی‌شوند؛ یک نوشتن اتمیک ممکن است
مسیر را به‌جای حفظ symlink جایگزین کند. اگر پیکربندی را بیرون از
دایرکتوری وضعیت پیش‌فرض نگه می‌دارید، `OPENCLAW_CONFIG_PATH` را مستقیماً به فایل واقعی اشاره دهید.

اگر فایل وجود نداشته باشد، OpenClaw از پیش‌فرض‌های ایمن استفاده می‌کند. دلایل رایج برای افزودن پیکربندی:

- اتصال کانال‌ها و کنترل اینکه چه کسانی می‌توانند به ربات پیام بدهند
- تنظیم مدل‌ها، ابزارها، sandboxing، یا خودکارسازی (cron، hooks)
- تنظیم دقیق نشست‌ها، رسانه، شبکه، یا UI

برای همه فیلدهای موجود، [مرجع کامل](/fa/gateway/configuration-reference) را ببینید.

عامل‌ها و خودکارسازی باید پیش از ویرایش پیکربندی، برای مستندات دقیق در سطح فیلد
از `config.schema.lookup` استفاده کنند. از این صفحه برای راهنمایی وظیفه‌محور و از
[مرجع پیکربندی](/fa/gateway/configuration-reference) برای نقشه گسترده‌تر
فیلدها و پیش‌فرض‌ها استفاده کنید.

<Tip>
**تازه با پیکربندی شروع کرده‌اید؟** برای راه‌اندازی تعاملی با `openclaw onboard` شروع کنید، یا برای پیکربندی‌های کامل قابل کپی‌کردن، راهنمای [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) را ببینید.
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
  <Tab title="UI کنترل">
    [http://127.0.0.1:18789](http://127.0.0.1:18789) را باز کنید و از زبانه **پیکربندی** استفاده کنید.
    UI کنترل، فرمی را از طرح‌واره پیکربندی زنده نمایش می‌دهد، شامل فراداده مستندات
    `title` / `description` برای فیلدها به‌علاوه طرح‌واره‌های Plugin و کانال وقتی
    موجود باشند، همراه با یک ویرایشگر **JSON خام** به‌عنوان راه خروج. برای UIهای
    ریزشونده و ابزارهای دیگر، Gateway همچنین `config.schema.lookup` را ارائه می‌کند تا
    یک گره طرح‌واره محدود به مسیر به‌همراه خلاصه‌های فرزند فوری را دریافت کند.
  </Tab>
  <Tab title="ویرایش مستقیم">
    `~/.openclaw/openclaw.json` را مستقیماً ویرایش کنید. Gateway فایل را پایش می‌کند و تغییرات را به‌صورت خودکار اعمال می‌کند ([بازبارگذاری داغ](#config-hot-reload) را ببینید).
  </Tab>
</Tabs>

## اعتبارسنجی سخت‌گیرانه

<Warning>
OpenClaw فقط پیکربندی‌هایی را می‌پذیرد که کاملاً با طرح‌واره مطابقت داشته باشند. کلیدهای ناشناخته، نوع‌های بدشکل، یا مقدارهای نامعتبر باعث می‌شوند Gateway **از شروع به کار خودداری کند**. تنها استثنای سطح ریشه `$schema` (رشته) است، تا ویرایشگرها بتوانند فراداده JSON Schema را پیوست کنند.
</Warning>

`openclaw config schema` طرح‌واره JSON مرجع را که UI کنترل
و اعتبارسنجی استفاده می‌کنند چاپ می‌کند. `config.schema.lookup` یک گره محدود به مسیر به‌همراه
خلاصه‌های فرزند را برای ابزارهای ریزشونده دریافت می‌کند. فراداده مستندات `title`/`description` فیلد
از میان آبجکت‌های تودرتو، wildcard (`*`)، آیتم آرایه (`[]`)، و شاخه‌های `anyOf`/
`oneOf`/`allOf` عبور می‌کند. طرح‌واره‌های Plugin و کانال در زمان اجرا، وقتی
رجیستری manifest بارگذاری شده باشد، ادغام می‌شوند.

وقتی اعتبارسنجی شکست می‌خورد:

- Gateway بوت نمی‌شود
- فقط فرمان‌های تشخیصی کار می‌کنند (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- برای دیدن مشکلات دقیق، `openclaw doctor` را اجرا کنید
- برای اعمال تعمیرات، `openclaw doctor --fix` (یا `--yes`) را اجرا کنید

Gateway پس از هر راه‌اندازی موفق، یک نسخه مورد اعتماد از آخرین وضعیت سالم نگه می‌دارد،
اما راه‌اندازی و بازبارگذاری داغ آن را به‌صورت خودکار بازیابی نمی‌کنند. اگر `openclaw.json`
در اعتبارسنجی شکست بخورد (از جمله اعتبارسنجی محلی Plugin)، راه‌اندازی Gateway شکست می‌خورد یا
بازبارگذاری رد می‌شود و runtime فعلی آخرین پیکربندی پذیرفته‌شده را نگه می‌دارد.
برای تعمیر پیکربندی دارای پیشوند/بازنویسی‌شده یا بازیابی نسخه آخرین وضعیت سالم،
`openclaw doctor --fix` (یا `--yes`) را اجرا کنید. ارتقا به آخرین وضعیت سالم وقتی یک
نامزد شامل placeholderهای راز redacted مانند `***` باشد، رد می‌شود.

## وظایف رایج

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

    - `agents.defaults.models` کاتالوگ مدل را تعریف می‌کند و به‌عنوان allowlist برای `/model` عمل می‌کند؛ ورودی‌های `provider/*`، `/model`، `/models`، و انتخابگرهای مدل را به ارائه‌دهندگان انتخاب‌شده محدود می‌کنند، در حالی که همچنان از کشف پویای مدل استفاده می‌شود.
    - برای افزودن ورودی‌های allowlist بدون حذف مدل‌های موجود، از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. جایگزینی‌های ساده‌ای که ورودی‌ها را حذف کنند رد می‌شوند، مگر اینکه `--replace` را بدهید.
    - ارجاع‌های مدل از قالب `provider/model` استفاده می‌کنند (مثلاً `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` کوچک‌سازی تصویرهای transcript/tool را کنترل می‌کند (پیش‌فرض `1200`)؛ مقدارهای کمتر معمولاً مصرف vision-token را در اجراهای سنگین با screenshot کاهش می‌دهند.
    - برای تغییر مدل‌ها در گفت‌وگو، [CLI مدل‌ها](/fa/concepts/models) و برای چرخش auth و رفتار fallback، [Failover مدل](/fa/concepts/model-failover) را ببینید.
    - برای ارائه‌دهندگان سفارشی/خودمیزبان، [ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) را در مرجع ببینید.

  </Accordion>

  <Accordion title="کنترل اینکه چه کسانی می‌توانند به ربات پیام بدهند">
    دسترسی DM برای هر کانال از طریق `dmPolicy` کنترل می‌شود:

    - `"pairing"` (پیش‌فرض): فرستندگان ناشناخته یک کد جفت‌سازی یک‌بارمصرف برای تأیید دریافت می‌کنند
    - `"allowlist"`: فقط فرستندگان موجود در `allowFrom` (یا ذخیره مجاز جفت‌شده)
    - `"open"`: همه DMهای ورودی را مجاز می‌کند (نیازمند `allowFrom: ["*"]`)
    - `"disabled"`: همه DMها را نادیده می‌گیرد

    برای گروه‌ها، از `groupPolicy` + `groupAllowFrom` یا allowlistهای مخصوص کانال استفاده کنید.

    برای جزئیات هر کانال، [مرجع کامل](/fa/gateway/config-channels#dm-and-group-access) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی mention gating برای گفت‌وگوی گروهی">
    پیام‌های گروهی به‌طور پیش‌فرض **نیازمند mention** هستند. الگوهای trigger را برای هر عامل پیکربندی کنید، و پاسخ‌های قابل مشاهده اتاق را روی مسیر پیش‌فرض message-tool نگه دارید، مگر اینکه عمداً پاسخ‌های نهایی خودکار legacy را بخواهید:

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

    - **Metadata mentions**: @-mentionهای بومی (tap-to-mention در WhatsApp، @bot در Telegram و غیره)
    - **الگوهای متنی**: الگوهای regex ایمن در `mentionPatterns`
    - **پاسخ‌های قابل مشاهده**: `messages.visibleReplies` می‌تواند ارسال‌های message-tool را به‌صورت سراسری الزامی کند؛ `messages.groupChat.visibleReplies` آن را برای گروه‌ها/کانال‌ها override می‌کند.
    - برای حالت‌های پاسخ قابل مشاهده، overrideهای هر کانال، و حالت self-chat، [مرجع کامل](/fa/gateway/config-channels#group-chat-mention-gating) را ببینید.

  </Accordion>

  <Accordion title="محدود کردن Skills برای هر عامل">
    برای baseline مشترک از `agents.defaults.skills` استفاده کنید، سپس عامل‌های مشخص را با
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
    - برای به‌ارث‌بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
    - برای نداشتن Skills، `agents.list[].skills: []` را تنظیم کنید.
    - [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و
      [مرجع پیکربندی](/fa/gateway/config-agents#agents-defaults-skills) را ببینید.

  </Accordion>

  <Accordion title="تنظیم پایش سلامت کانال Gateway">
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
    - برای غیرفعال کردن restartهای خودکار برای یک کانال یا حساب بدون غیرفعال کردن مانیتور سراسری، از `channels.<provider>.healthMonitor.enabled` یا `channels.<provider>.accounts.<id>.healthMonitor.enabled` استفاده کنید.
    - برای دیباگ عملیاتی، [Health Checks](/fa/gateway/health) و برای همه فیلدها، [مرجع کامل](/fa/gateway/configuration-reference#gateway) را ببینید.

  </Accordion>

  <Accordion title="تنظیم timeout دست‌دهی WebSocket در Gateway">
    به کلاینت‌های محلی زمان بیشتری بدهید تا دست‌دهی WebSocket پیش از auth را روی
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
    - ابتدا رفع گیرهای startup/event-loop را ترجیح دهید؛ این knob برای میزبان‌هایی است که سالم هستند اما هنگام warmup کندند.

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
    - `threadBindings`: پیش‌فرض‌های سراسری برای مسیریابی نشست‌های وابسته به رشته گفتگو (Discord از `/focus`، `/unfocus`، `/agents`، `/session idle` و `/session max-age` پشتیبانی می‌کند).
    - برای محدوده‌بندی، پیوندهای هویتی و سیاست ارسال، [مدیریت نشست](/fa/concepts/session) را ببینید.
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

    ابتدا image را بسازید - از یک checkout سورس `scripts/sandbox-setup.sh` را اجرا کنید، یا از نصب npm، دستور درون‌خطی `docker build` را در [Sandboxing § Images and setup](/fa/gateway/sandboxing#images-and-setup) ببینید.

    برای راهنمای کامل، [Sandboxing](/fa/gateway/sandboxing) و برای همه گزینه‌ها [مرجع کامل](/fa/gateway/config-agents#agentsdefaultssandbox) را ببینید.

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

    - به Gateway اجازه می‌دهد `push.test`، تلنگرهای بیدارسازی و بیدارسازی‌های اتصال مجدد را از طریق relay خارجی ارسال کند.
    - از یک مجوز ارسال با محدوده ثبت استفاده می‌کند که توسط برنامه iOS جفت‌شده ارسال شده است. Gateway به token relay در سطح deployment نیاز ندارد.
    - هر ثبت مبتنی بر relay را به هویت Gateway که برنامه iOS با آن جفت شده است متصل می‌کند، تا Gateway دیگری نتواند ثبت ذخیره‌شده را دوباره استفاده کند.
    - buildهای محلی/دستی iOS را روی APNs مستقیم نگه می‌دارد. ارسال‌های مبتنی بر relay فقط برای buildهای توزیع‌شده رسمی اعمال می‌شوند که از طریق relay ثبت شده‌اند.
    - باید با URL پایه relay که در build رسمی/TestFlight iOS تعبیه شده مطابقت داشته باشد، تا ترافیک ثبت و ارسال به همان deployment relay برسد.

    جریان سرتاسری:

    1. یک build رسمی/TestFlight iOS را نصب کنید که با همان URL پایه relay کامپایل شده است.
    2. `gateway.push.apns.relay.baseUrl` را روی Gateway پیکربندی کنید.
    3. برنامه iOS را با Gateway جفت کنید و اجازه دهید هر دو نشست node و operator متصل شوند.
    4. برنامه iOS هویت Gateway را دریافت می‌کند، با استفاده از App Attest به‌همراه رسید برنامه در relay ثبت می‌شود، و سپس payload مبتنی بر relay مربوط به `push.apns.register` را در Gateway جفت‌شده منتشر می‌کند.
    5. Gateway شناسه relay و مجوز ارسال را ذخیره می‌کند، سپس از آن‌ها برای `push.test`، تلنگرهای بیدارسازی و بیدارسازی‌های اتصال مجدد استفاده می‌کند.

    نکات عملیاتی:

    - اگر برنامه iOS را به Gateway دیگری تغییر می‌دهید، برنامه را دوباره متصل کنید تا بتواند ثبت relay جدیدی را منتشر کند که به آن Gateway متصل است.
    - اگر build جدیدی از iOS منتشر می‌کنید که به deployment relay دیگری اشاره می‌کند، برنامه ثبت relay کش‌شده خود را به‌جای استفاده دوباره از مبدا relay قدیمی تازه‌سازی می‌کند.

    نکته سازگاری:

    - `OPENCLAW_APNS_RELAY_BASE_URL` و `OPENCLAW_APNS_RELAY_TIMEOUT_MS` همچنان به‌عنوان overrideهای موقت env کار می‌کنند.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` همچنان یک راه خروج توسعه فقط برای loopback است؛ URLهای relay مبتنی بر HTTP را در config پایدار نکنید.

    برای جریان سرتاسری، [برنامه iOS](/fa/platforms/ios#relay-backed-push-for-official-builds) و برای مدل امنیتی relay، [جریان احراز هویت و اعتماد](/fa/platforms/ios#authentication-and-trust-flow) را ببینید.

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

    - `every`: رشته مدت‌زمان (`30m`، `2h`). برای غیرفعال‌سازی `0m` را تنظیم کنید.
    - `target`: `last` | `none` | `<channel-id>` (برای مثال `discord`، `matrix`، `telegram` یا `whatsapp`)
    - `directPolicy`: `allow` (پیش‌فرض) یا `block` برای هدف‌های Heartbeat به سبک DM
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
    - `runLog`: فایل `cron/runs/<jobId>.jsonl` را بر اساس اندازه و خط‌های نگه‌داری‌شده پاک‌سازی می‌کند.
    - برای نمای کلی قابلیت و مثال‌های CLI، [jobهای Cron](/fa/automation/cron-jobs) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی webhookها (hookها)">
    endpointهای Webhook مبتنی بر HTTP را روی Gateway فعال کنید:

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
    - همه محتوای payloadهای hook/webhook را ورودی غیرقابل‌اعتماد در نظر بگیرید.
    - از یک `hooks.token` اختصاصی استفاده کنید؛ token مشترک Gateway را دوباره استفاده نکنید.
    - احراز هویت hook فقط از طریق header است (`Authorization: Bearer ...` یا `x-openclaw-token`)؛ tokenهای query-string رد می‌شوند.
    - `hooks.path` نمی‌تواند `/` باشد؛ ورودی webhook را روی یک زیردامنه مسیر اختصاصی مانند `/hooks` نگه دارید.
    - پرچم‌های عبور از محتوای ناامن را غیرفعال نگه دارید (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) مگر برای اشکال‌زدایی با محدوده بسیار محدود.
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

    برای قواعد binding و profileهای دسترسی به‌ازای هر عامل، [چندعاملی](/fa/concepts/multi-agent) و [مرجع کامل](/fa/gateway/config-agents#multi-agent-routing) را ببینید.

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

    - **فایل تکی**: شیء دربرگیرنده را جایگزین می‌کند
    - **آرایه‌ای از فایل‌ها**: به‌ترتیب deep-merge می‌شوند (مورد بعدی برنده است)
    - **کلیدهای هم‌سطح**: پس از includeها merge می‌شوند (مقادیر includeشده را override می‌کنند)
    - **includeهای تودرتو**: تا عمق ۱۰ سطح پشتیبانی می‌شوند
    - **مسیرهای نسبی**: نسبت به فایل includeکننده resolve می‌شوند
    - **نوشتن‌های متعلق به OpenClaw**: وقتی یک نوشتن فقط یک بخش top-level را تغییر می‌دهد
      که پشتوانه آن یک include تک‌فایلی مانند `plugins: { $include: "./plugins.json5" }` است،
      OpenClaw آن فایل includeشده را به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده می‌گذارد
    - **write-through پشتیبانی‌نشده**: includeهای root، آرایه‌های include و includeهایی
      با overrideهای هم‌سطح، برای نوشتن‌های متعلق به OpenClaw به‌جای
      مسطح‌کردن config به‌صورت بسته شکست می‌خورند
    - **محدودسازی**: مسیرهای `$include` باید زیر دایرکتوری نگه‌دارنده
      `openclaw.json` resolve شوند. برای اشتراک‌گذاری یک درخت میان ماشین‌ها یا کاربران، `OPENCLAW_INCLUDE_ROOTS`
      را به یک path-list (`:` در POSIX، `;` در Windows) از
      دایرکتوری‌های اضافی تنظیم کنید که includeها می‌توانند به آن‌ها ارجاع دهند. Symlinkها resolve
      و دوباره بررسی می‌شوند، بنابراین مسیری که از نظر نوشتاری در یک دایرکتوری config قرار دارد اما
      هدف واقعی آن از هر root مجاز خارج می‌شود همچنان رد می‌شود.
    - **مدیریت خطا**: خطاهای روشن برای فایل‌های گم‌شده، خطاهای parse و includeهای چرخه‌ای

  </Accordion>
</AccordionGroup>

## بارگذاری مجدد داغ config

Gateway فایل `~/.openclaw/openclaw.json` را پایش می‌کند و تغییرات را به‌صورت خودکار اعمال می‌کند - برای بیشتر تنظیمات به restart دستی نیاز نیست.

ویرایش‌های مستقیم فایل تا زمانی که validate نشوند غیرقابل‌اعتماد تلقی می‌شوند. watcher منتظر می‌ماند
تا churn مربوط به temp-write/rename ویرایشگر آرام شود، فایل نهایی را می‌خواند و
ویرایش‌های خارجی نامعتبر را بدون بازنویسی `openclaw.json` رد می‌کند. نوشتن‌های config
متعلق به OpenClaw پیش از نوشتن از همان gate schema استفاده می‌کنند؛ clobberهای مخرب مانند
حذف `gateway.mode` یا کوچک‌کردن فایل به کمتر از نصف رد می‌شوند و
برای بررسی با پسوند `.rejected.*` ذخیره می‌شوند.

اگر `config reload skipped (invalid config)` را می‌بینید یا startup پیام `Invalid
config` گزارش می‌کند، config را بررسی کنید، `openclaw config validate` را اجرا کنید، سپس برای ترمیم `openclaw
doctor --fix` را اجرا کنید. برای checklist، [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)
را ببینید.

### حالت‌های بارگذاری مجدد

| حالت                   | رفتار                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (پیش‌فرض) | تغییرات امن را فورا به‌صورت داغ اعمال می‌کند. برای موارد حیاتی به‌صورت خودکار restart می‌کند.           |
| **`hot`**              | فقط تغییرات امن را به‌صورت داغ اعمال می‌کند. وقتی restart لازم باشد warning ثبت می‌کند - شما آن را انجام می‌دهید. |
| **`restart`**          | Gateway را برای هر تغییر config، چه امن باشد چه نباشد، restart می‌کند.                                 |
| **`off`**              | پایش فایل را غیرفعال می‌کند. تغییرات در restart دستی بعدی اعمال می‌شوند.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### چه چیزهایی داغ اعمال می‌شوند و چه چیزهایی به restart نیاز دارند

بیشتر فیلدها بدون downtime به‌صورت داغ اعمال می‌شوند. در حالت `hybrid`، تغییراتی که به restart نیاز دارند به‌صورت خودکار مدیریت می‌شوند.

| دسته‌بندی            | فیلدها                                                            | نیاز به restart؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| کانال‌ها            | `channels.*`، `web` (WhatsApp) - همه کانال‌های داخلی و plugin | خیر              |
| عامل و مدل‌ها      | `agent`، `agents`، `models`، `routing`                            | خیر              |
| اتوماسیون          | `hooks`، `cron`، `agent.heartbeat`                                | خیر              |
| نشست‌ها و پیام‌ها | `session`، `messages`                                             | خیر              |
| ابزارها و رسانه       | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk`              | خیر              |
| UI و متفرقه           | `ui`، `logging`، `identity`، `bindings`                           | خیر              |
| سرور Gateway      | `gateway.*` (port، bind، auth، tailscale، TLS، HTTP)              | **بله**         |
| زیرساخت      | `discovery`، `plugins`                                            | **بله**         |

<Note>
`gateway.reload` و `gateway.remote` استثنا هستند - تغییر آن‌ها باعث راه‌اندازی مجدد **نمی‌شود**.
</Note>

### برنامه‌ریزی بارگذاری مجدد

وقتی یک فایل منبع را که از طریق `$include` ارجاع شده است ویرایش می‌کنید، OpenClaw
بارگذاری مجدد را از چیدمان نوشته‌شده در منبع برنامه‌ریزی می‌کند، نه از نمای تخت‌شده‌ی درون‌حافظه‌ای.
این کار تصمیم‌های بارگذاری مجدد داغ (اعمال داغ در برابر راه‌اندازی مجدد) را حتی زمانی قابل پیش‌بینی نگه می‌دارد که یک
بخش سطح‌بالای واحد در فایل include‌شده‌ی خودش قرار دارد، مانند
`plugins: { $include: "./plugins.json5" }`. اگر چیدمان منبع مبهم باشد، برنامه‌ریزی بارگذاری مجدد به‌صورت بسته شکست می‌خورد.

## RPC پیکربندی (به‌روزرسانی‌های برنامه‌نویسی‌شده)

برای ابزارهایی که پیکربندی را از طریق API Gateway می‌نویسند، این جریان را ترجیح دهید:

- `config.schema.lookup` برای بررسی یک زیرشاخه (گره schema کم‌عمق + خلاصه‌های فرزند)
- `config.get` برای دریافت snapshot فعلی به‌همراه `hash`
- `config.patch` برای به‌روزرسانی‌های جزئی (JSON merge patch: اشیا merge می‌شوند، `null`
  حذف می‌کند، آرایه‌ها جایگزین می‌شوند)
- `config.apply` فقط وقتی قصد دارید کل پیکربندی را جایگزین کنید
- `update.run` برای خودبه‌روزرسانی صریح به‌همراه راه‌اندازی مجدد؛ وقتی session پس از راه‌اندازی مجدد باید یک نوبت پیگیری اجرا کند، `continuationMessage` را وارد کنید
- `update.status` برای بررسی آخرین sentinel راه‌اندازی مجدد به‌روزرسانی و تأیید نسخه‌ی در حال اجرا پس از راه‌اندازی مجدد

عامل‌ها باید `config.schema.lookup` را نخستین نقطه‌ی مراجعه برای مستندات دقیق
در سطح فیلد و محدودیت‌ها بدانند. وقتی به نقشه‌ی گسترده‌تر پیکربندی، پیش‌فرض‌ها، یا پیوندهای ارجاع‌های اختصاصی
زیرسامانه نیاز دارند، از [مرجع پیکربندی](/fa/gateway/configuration-reference)
استفاده کنید.

<Note>
نوشتن‌های control-plane (`config.apply`, `config.patch`, `update.run`) برای هر `deviceId+clientIp` به
۳ درخواست در هر ۶۰ ثانیه محدود می‌شوند. درخواست‌های راه‌اندازی مجدد با هم ادغام می‌شوند و سپس یک دوره‌ی انتظار ۳۰ ثانیه‌ای بین چرخه‌های راه‌اندازی مجدد اعمال می‌کنند.
`update.status` فقط‌خواندنی است اما در محدوده‌ی admin قرار دارد، چون sentinel راه‌اندازی مجدد می‌تواند
خلاصه‌های گام‌های به‌روزرسانی و انتهای خروجی فرمان را شامل شود.
</Note>

نمونه patch جزئی:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

هر دو `config.apply` و `config.patch`، `raw`، `baseHash`، `sessionKey`،
`note`، و `restartDelayMs` را می‌پذیرند. وقتی یک
پیکربندی از قبل وجود داشته باشد، `baseHash` برای هر دو متد الزامی است.

## متغیرهای محیطی

OpenClaw متغیرهای محیطی را از پردازه‌ی والد به‌علاوه‌ی موارد زیر می‌خواند:

- `.env` از دایرکتوری کاری فعلی (اگر وجود داشته باشد)
- `~/.openclaw/.env` (fallback سراسری)

هیچ‌کدام از این فایل‌ها متغیرهای محیطی موجود را override نمی‌کنند. همچنین می‌توانید متغیرهای محیطی inline را در پیکربندی تنظیم کنید:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="وارد کردن env شل (اختیاری)">
  اگر فعال باشد و کلیدهای مورد انتظار تنظیم نشده باشند، OpenClaw شل ورود شما را اجرا می‌کند و فقط کلیدهای گم‌شده را وارد می‌کند:

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
  در هر مقدار رشته‌ای پیکربندی با `${VAR_NAME}` به متغیرهای محیطی ارجاع دهید:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

قواعد:

- فقط نام‌های بزرگ matched می‌شوند: `[A-Z_][A-Z0-9_]*`
- متغیرهای گم‌شده/خالی هنگام load خطا می‌دهند
- برای خروجی literal با `$${VAR}` escape کنید
- داخل فایل‌های `$include` کار می‌کند
- جایگزینی inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="ارجاع‌های محرمانه (env، file، exec)">
  برای فیلدهایی که از اشیای SecretRef پشتیبانی می‌کنند، می‌توانید از این‌ها استفاده کنید:

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
مسیرهای credential پشتیبانی‌شده در [سطح credential برای SecretRef](/fa/reference/secretref-credential-surface) فهرست شده‌اند.
</Accordion>

برای اولویت کامل و منابع، [محیط](/fa/help/environment) را ببینید.

## مرجع کامل

برای مرجع کامل فیلدبه‌فیلد، **[مرجع پیکربندی](/fa/gateway/configuration-reference)** را ببینید.

---

_مرتبط: [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [مرجع پیکربندی](/fa/gateway/configuration-reference) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
- [راهنمای عملیاتی Gateway](/fa/gateway)
