---
read_when:
    - راه‌اندازی OpenClaw برای نخستین بار
    - در حال جست‌وجوی الگوهای رایج پیکربندی
    - پیمایش به بخش‌های خاص پیکربندی
summary: 'نمای کلی پیکربندی: کارهای رایج، راه‌اندازی سریع، و پیوندهایی به مرجع کامل'
title: پیکربندی
x-i18n:
    generated_at: "2026-04-29T22:50:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eaad06dff8ec777adc881edbabc45048a376078d2814f2d3f7e7035abb2e8d
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw یک پیکربندی اختیاری <Tooltip tip="JSON5 از دیدگاه‌ها و ویرگول‌های انتهایی پشتیبانی می‌کند">**JSON5**</Tooltip> را از `~/.openclaw/openclaw.json` می‌خواند.
مسیر پیکربندی فعال باید یک فایل معمولی باشد. چیدمان‌های `openclaw.json`
که با symlink ساخته شده‌اند، برای نوشتن‌های متعلق به OpenClaw پشتیبانی نمی‌شوند؛ یک نوشتن اتمیک ممکن است
به‌جای حفظ symlink، مسیر را جایگزین کند. اگر پیکربندی را خارج از
دایرکتوری وضعیت پیش‌فرض نگه می‌دارید، `OPENCLAW_CONFIG_PATH` را مستقیماً به فایل واقعی اشاره دهید.

اگر فایل وجود نداشته باشد، OpenClaw از پیش‌فرض‌های امن استفاده می‌کند. دلایل رایج برای افزودن پیکربندی:

- اتصال کانال‌ها و کنترل اینکه چه کسی می‌تواند به ربات پیام بدهد
- تنظیم مدل‌ها، ابزارها، sandboxing، یا خودکارسازی (cron، hookها)
- تنظیم دقیق نشست‌ها، رسانه، شبکه، یا UI

برای همه فیلدهای موجود، [مرجع کامل](/fa/gateway/configuration-reference) را ببینید.

Agentها و خودکارسازی باید پیش از ویرایش پیکربندی، برای مستندات دقیق در سطح فیلد
از `config.schema.lookup` استفاده کنند. از این صفحه برای راهنمایی وظیفه‌محور و از
[مرجع پیکربندی](/fa/gateway/configuration-reference) برای نقشه گسترده‌تر
فیلدها و پیش‌فرض‌ها استفاده کنید.

<Tip>
**در پیکربندی تازه‌کار هستید؟** برای راه‌اندازی تعاملی با `openclaw onboard` شروع کنید، یا برای پیکربندی‌های کامل قابل کپی‌پیست، راهنمای [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) را ببینید.
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
    UI کنترل از روی schema پیکربندی زنده یک فرم نمایش می‌دهد، شامل metadata مستندات
    `title` / `description` فیلدها، به‌همراه schemaهای plugin و کانال در صورت
    موجود بودن، و یک ویرایشگر **JSON خام** به‌عنوان راه فرار. برای UIهای drill-down
    و ابزارهای دیگر، gateway همچنین `config.schema.lookup` را ارائه می‌کند تا
    یک گره schema محدود به مسیر، به‌همراه خلاصه فرزندان بلافاصله آن دریافت شود.
  </Tab>
  <Tab title="ویرایش مستقیم">
    `~/.openclaw/openclaw.json` را مستقیماً ویرایش کنید. Gateway فایل را زیر نظر می‌گیرد و تغییرات را به‌طور خودکار اعمال می‌کند ([بارگذاری مجدد داغ](#config-hot-reload) را ببینید).
  </Tab>
</Tabs>

## اعتبارسنجی سخت‌گیرانه

<Warning>
OpenClaw فقط پیکربندی‌هایی را می‌پذیرد که کاملاً با schema مطابقت داشته باشند. کلیدهای ناشناخته، نوع‌های بدشکل، یا مقدارهای نامعتبر باعث می‌شوند Gateway **از شروع به کار خودداری کند**. تنها استثنای سطح ریشه `$schema` (رشته) است تا ویرایشگرها بتوانند metadata مربوط به JSON Schema را پیوست کنند.
</Warning>

`openclaw config schema` نسخه canonical از JSON Schema را که توسط UI کنترل
و اعتبارسنجی استفاده می‌شود چاپ می‌کند. `config.schema.lookup` یک گره محدود به
مسیر، به‌همراه خلاصه فرزندان، برای ابزارهای drill-down دریافت می‌کند. metadata مستندات
`title`/`description` فیلدها در آبجکت‌های تو در تو، wildcard (`*`)، آیتم‌های آرایه (`[]`)، و شاخه‌های `anyOf`/
`oneOf`/`allOf` نیز منتقل می‌شود. schemaهای runtime مربوط به plugin و کانال وقتی
manifest registry بارگذاری شده باشد ادغام می‌شوند.

وقتی اعتبارسنجی شکست می‌خورد:

- Gateway بوت نمی‌شود
- فقط دستورهای تشخیصی کار می‌کنند (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- برای دیدن مشکلات دقیق، `openclaw doctor` را اجرا کنید
- برای اعمال تعمیرها، `openclaw doctor --fix` (یا `--yes`) را اجرا کنید

Gateway پس از هر راه‌اندازی موفق، یک کپی قابل اعتماد از آخرین نسخه سالم نگه می‌دارد.
اگر `openclaw.json` بعداً در اعتبارسنجی شکست بخورد (یا `gateway.mode` را حذف کند، به‌شدت
کوچک شود، یا یک خط log سرگردان به ابتدای آن اضافه شده باشد)، OpenClaw فایل خراب را
با نام `.clobbered.*` حفظ می‌کند، کپی آخرین نسخه سالم را بازمی‌گرداند، و دلیل بازیابی را
ثبت می‌کند. نوبت بعدی agent نیز یک هشدار system-event دریافت می‌کند تا agent اصلی
کورکورانه پیکربندی بازیابی‌شده را بازنویسی نکند. ارتقا به آخرین نسخه سالم زمانی که
یک کاندید شامل placeholderهای secret ویرایش‌شده مانند `***` باشد رد می‌شود.
وقتی همه مشکلات اعتبارسنجی به `plugins.entries.<id>...` محدود باشند، OpenClaw
بازیابی کل فایل را انجام نمی‌دهد. پیکربندی فعلی را فعال نگه می‌دارد و
شکست محلی plugin را نشان می‌دهد تا ناسازگاری schema plugin یا نسخه میزبان
نتواند تنظیمات نامرتبط کاربر را برگرداند.

## وظایف رایج

<AccordionGroup>
  <Accordion title="راه‌اندازی یک کانال (WhatsApp، Telegram، Discord و غیره)">
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

    همه کانال‌ها از الگوی policy یکسانی برای DM استفاده می‌کنند:

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
    - برای افزودن ورودی‌های allowlist بدون حذف مدل‌های موجود، از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. جایگزینی‌های ساده‌ای که ورودی‌ها را حذف کنند رد می‌شوند مگر اینکه `--replace` را پاس بدهید.
    - ارجاع‌های مدل از قالب `provider/model` استفاده می‌کنند (مثلاً `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` کوچک‌سازی تصویرهای transcript/tool را کنترل می‌کند (پیش‌فرض `1200`)؛ مقدارهای کمتر معمولاً مصرف vision-token را در اجراهای پر از screenshot کاهش می‌دهند.
    - برای تغییر مدل‌ها در chat، [Models CLI](/fa/concepts/models) را ببینید و برای چرخش احراز هویت و رفتار fallback، [Model Failover](/fa/concepts/model-failover) را ببینید.
    - برای providerهای سفارشی/خودمیزبان، در مرجع [providerهای سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) را ببینید.

  </Accordion>

  <Accordion title="کنترل اینکه چه کسی می‌تواند به ربات پیام بدهد">
    دسترسی DM در هر کانال از طریق `dmPolicy` کنترل می‌شود:

    - `"pairing"` (پیش‌فرض): فرستنده‌های ناشناخته یک کد pairing یک‌بارمصرف برای تأیید دریافت می‌کنند
    - `"allowlist"`: فقط فرستنده‌های موجود در `allowFrom` (یا store اجازه paired)
    - `"open"`: همه DMهای ورودی را مجاز می‌کند (نیازمند `allowFrom: ["*"]`)
    - `"disabled"`: همه DMها را نادیده می‌گیرد

    برای گروه‌ها، از `groupPolicy` + `groupAllowFrom` یا allowlistهای اختصاصی کانال استفاده کنید.

    برای جزئیات هر کانال، [مرجع کامل](/fa/gateway/config-channels#dm-and-group-access) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی کنترل mention در گروه chat">
    پیام‌های گروهی به‌طور پیش‌فرض **نیازمند mention** هستند. الگوهای trigger را برای هر agent پیکربندی کنید و پاسخ‌های قابل مشاهده اتاق را روی مسیر پیش‌فرض message-tool نگه دارید مگر اینکه عمداً پاسخ‌های نهایی خودکار قدیمی را بخواهید:

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

    - **mentionهای metadata**: @-mentionهای native (tap-to-mention در WhatsApp، @bot در Telegram و غیره)
    - **الگوهای متنی**: الگوهای regex امن در `mentionPatterns`
    - **پاسخ‌های قابل مشاهده**: `messages.visibleReplies` می‌تواند ارسال‌های message-tool را به‌صورت سراسری الزامی کند؛ `messages.groupChat.visibleReplies` این را برای گروه‌ها/کانال‌ها override می‌کند.
    - برای حالت‌های پاسخ قابل مشاهده، overrideهای هر کانال، و حالت self-chat، [مرجع کامل](/fa/gateway/config-channels#group-chat-mention-gating) را ببینید.

  </Accordion>

  <Accordion title="محدود کردن Skills برای هر agent">
    از `agents.defaults.skills` برای baseline مشترک استفاده کنید، سپس agentهای مشخص را
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
    - برای به ارث بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
    - برای نداشتن Skills، `agents.list[].skills: []` را تنظیم کنید.
    - [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config)، و
      [مرجع پیکربندی](/fa/gateway/config-agents#agents-defaults-skills) را ببینید.

  </Accordion>

  <Accordion title="تنظیم پایش سلامت کانال Gateway">
    کنترل کنید gateway با چه شدتی کانال‌هایی را که کهنه به نظر می‌رسند restart کند:

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
    - برای غیرفعال کردن auto-restartها برای یک کانال یا حساب، بدون غیرفعال کردن monitor سراسری، از `channels.<provider>.healthMonitor.enabled` یا `channels.<provider>.accounts.<id>.healthMonitor.enabled` استفاده کنید.
    - برای debugging عملیاتی، [بررسی‌های سلامت](/fa/gateway/health) را ببینید و برای همه فیلدها [مرجع کامل](/fa/gateway/configuration-reference#gateway) را ببینید.

  </Accordion>

  <Accordion title="تنظیم timeout دست‌دهی WebSocket در Gateway">
    به clientهای محلی زمان بیشتری بدهید تا دست‌دهی WebSocket پیش از احراز هویت را روی
    میزبان‌های پر بار یا کم‌توان کامل کنند:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - پیش‌فرض `15000` میلی‌ثانیه است.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` همچنان برای overrideهای تک‌باره service یا shell اولویت دارد.
    - ابتدا رفع stallهای startup/event-loop را ترجیح دهید؛ این knob برای میزبان‌هایی است که سالم‌اند اما هنگام warmup کند هستند.

  </Accordion>

  <Accordion title="پیکربندی نشست‌ها و resetها">
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
    - `threadBindings`: پیش‌فرض‌های سراسری برای مسیریابی نشست‌های وابسته به رشته (Discord از `/focus`، `/unfocus`، `/agents`، `/session idle`، و `/session max-age` پشتیبانی می‌کند).
    - برای دامنه‌بندی، پیوندهای هویتی، و سیاست ارسال، [مدیریت نشست](/fa/concepts/session) را ببینید.
    - برای همهٔ فیلدها، [مرجع کامل](/fa/gateway/config-agents#session) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی ایزوله‌سازی">
    نشست‌های عامل را در محیط‌های اجرای ایزوله اجرا کنید:

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

    ابتدا تصویر را بسازید: `scripts/sandbox-setup.sh`

    برای راهنمای کامل، [ایزوله‌سازی](/fa/gateway/sandboxing) و برای همهٔ گزینه‌ها [مرجع کامل](/fa/gateway/config-agents#agentsdefaultssandbox) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی پوش مبتنی بر رله برای ساخت‌های رسمی iOS">
    پوش مبتنی بر رله در `openclaw.json` پیکربندی می‌شود.

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

    - به Gateway اجازه می‌دهد `push.test`، تکان‌های بیدارسازی، و بیدارسازی‌های اتصال مجدد را از طریق رلهٔ خارجی ارسال کند.
    - از یک مجوز ارسال با دامنهٔ ثبت استفاده می‌کند که برنامهٔ iOS جفت‌شده آن را ارسال کرده است. Gateway به توکن رلهٔ سراسری برای استقرار نیاز ندارد.
    - هر ثبت مبتنی بر رله را به هویت Gateway که برنامهٔ iOS با آن جفت شده است متصل می‌کند، بنابراین Gateway دیگری نمی‌تواند ثبت ذخیره‌شده را دوباره استفاده کند.
    - ساخت‌های محلی/دستی iOS را روی APNs مستقیم نگه می‌دارد. ارسال‌های مبتنی بر رله فقط برای ساخت‌های توزیع‌شدهٔ رسمی اعمال می‌شوند که از طریق رله ثبت شده‌اند.
    - باید با URL پایهٔ رله‌ای که در ساخت رسمی/TestFlight iOS گنجانده شده است تطبیق داشته باشد، تا ترافیک ثبت و ارسال به همان استقرار رله برسد.

    جریان سرتاسری:

    1. یک ساخت رسمی/TestFlight iOS را نصب کنید که با همان URL پایهٔ رله کامپایل شده است.
    2. `gateway.push.apns.relay.baseUrl` را روی Gateway پیکربندی کنید.
    3. برنامهٔ iOS را با Gateway جفت کنید و اجازه دهید هر دو نشست Node و اپراتور وصل شوند.
    4. برنامهٔ iOS هویت Gateway را دریافت می‌کند، با استفاده از App Attest به‌همراه رسید برنامه در رله ثبت می‌شود، و سپس بار `push.apns.register` مبتنی بر رله را در Gateway جفت‌شده منتشر می‌کند.
    5. Gateway دستهٔ رله و مجوز ارسال را ذخیره می‌کند، سپس از آن‌ها برای `push.test`، تکان‌های بیدارسازی، و بیدارسازی‌های اتصال مجدد استفاده می‌کند.

    نکات عملیاتی:

    - اگر برنامهٔ iOS را به Gateway دیگری منتقل می‌کنید، برنامه را دوباره وصل کنید تا بتواند ثبت رلهٔ جدیدی منتشر کند که به آن Gateway متصل است.
    - اگر ساخت iOS جدیدی منتشر می‌کنید که به استقرار رلهٔ متفاوتی اشاره می‌کند، برنامه به‌جای استفادهٔ دوباره از مبدا رلهٔ قدیمی، ثبت رلهٔ کش‌شدهٔ خود را تازه‌سازی می‌کند.

    نکتهٔ سازگاری:

    - `OPENCLAW_APNS_RELAY_BASE_URL` و `OPENCLAW_APNS_RELAY_TIMEOUT_MS` همچنان به‌عنوان overrideهای موقت env کار می‌کنند.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` همچنان یک راه فرار توسعه‌ای فقط برای loopback است؛ URLهای رلهٔ HTTP را در پیکربندی ماندگار نکنید.

    برای جریان سرتاسری، [برنامهٔ iOS](/fa/platforms/ios#relay-backed-push-for-official-builds) و برای مدل امنیتی رله [احراز هویت و جریان اعتماد](/fa/platforms/ios#authentication-and-trust-flow) را ببینید.

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

    - `every`: رشتهٔ مدت‌زمان (`30m`، `2h`). برای غیرفعال‌سازی، `0m` را تنظیم کنید.
    - `target`: `last` | `none` | `<channel-id>` (برای نمونه `discord`، `matrix`، `telegram`، یا `whatsapp`)
    - `directPolicy`: برای مقصدهای Heartbeat به سبک DM، مقدار `allow` (پیش‌فرض) یا `block`
    - برای راهنمای کامل، [Heartbeat](/fa/gateway/heartbeat) را ببینید.

  </Accordion>

  <Accordion title="پیکربندی کارهای Cron">
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

    - `sessionRetention`: نشست‌های اجرای ایزولهٔ تکمیل‌شده را از `sessions.json` پاک‌سازی می‌کند (پیش‌فرض `24h`؛ برای غیرفعال‌سازی `false` را تنظیم کنید).
    - `runLog`: فایل `cron/runs/<jobId>.jsonl` را بر اساس اندازه و خطوط نگه‌داری‌شده پاک‌سازی می‌کند.
    - برای نمای کلی قابلیت و نمونه‌های CLI، [کارهای Cron](/fa/automation/cron-jobs) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی Webhookها (قلاب‌ها)">
    نقطه‌های پایانی Webhook HTTP را روی Gateway فعال کنید:

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
    - با همهٔ محتوای بار hook/webhook به‌عنوان ورودی نامطمئن رفتار کنید.
    - از یک `hooks.token` اختصاصی استفاده کنید؛ توکن مشترک Gateway را دوباره استفاده نکنید.
    - احراز هویت hook فقط از طریق header است (`Authorization: Bearer ...` یا `x-openclaw-token`)؛ توکن‌های query-string رد می‌شوند.
    - `hooks.path` نمی‌تواند `/` باشد؛ ورودی Webhook را روی یک زیرمسیر اختصاصی مانند `/hooks` نگه دارید.
    - پرچم‌های دور زدن محتوای ناامن را غیرفعال نگه دارید (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) مگر برای اشکال‌زدایی با دامنهٔ کاملا محدود.
    - اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را نیز تنظیم کنید تا کلیدهای نشست انتخاب‌شده توسط فراخواننده محدود شوند.
    - برای عامل‌های راه‌اندازی‌شده با hook، رده‌های مدل مدرن و قوی و سیاست ابزار سخت‌گیرانه را ترجیح دهید (برای مثال فقط پیام‌رسانی به‌همراه ایزوله‌سازی در صورت امکان).

    برای همهٔ گزینه‌های نگاشت و یکپارچه‌سازی Gmail، [مرجع کامل](/fa/gateway/configuration-reference#hooks) را ببینید.

  </Accordion>

  <Accordion title="پیکربندی مسیریابی چندعاملی">
    چند عامل ایزوله را با فضاهای کاری و نشست‌های جداگانه اجرا کنید:

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

    برای قوانین اتصال و پروفایل‌های دسترسی هر عامل، [چندعاملی](/fa/concepts/multi-agent) و [مرجع کامل](/fa/gateway/config-agents#multi-agent-routing) را ببینید.

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
    - **آرایه‌ای از فایل‌ها**: به‌ترتیب به‌صورت عمیق ادغام می‌شوند (موردهای بعدی برنده می‌شوند)
    - **کلیدهای هم‌سطح**: پس از includeها ادغام می‌شوند (مقدارهای includeشده را override می‌کنند)
    - **includeهای تو در تو**: تا عمق ۱۰ سطح پشتیبانی می‌شوند
    - **مسیرهای نسبی**: نسبت به فایل includeکننده حل می‌شوند
    - **نوشتن‌های متعلق به OpenClaw**: وقتی یک نوشتن فقط یک بخش سطح بالایی را تغییر می‌دهد
      که توسط یک include تک‌فایلی مانند `plugins: { $include: "./plugins.json5" }` پشتیبانی می‌شود،
      OpenClaw همان فایل includeشده را به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده باقی می‌گذارد
    - **نوشتن عبوری پشتیبانی‌نشده**: includeهای ریشه، آرایه‌های include، و includeهایی
      با overrideهای هم‌سطح برای نوشتن‌های متعلق به OpenClaw به‌صورت بسته شکست می‌خورند، به‌جای اینکه
      پیکربندی را تخت کنند
    - **رسیدگی به خطا**: خطاهای روشن برای فایل‌های گم‌شده، خطاهای parse، و includeهای چرخه‌ای

  </Accordion>
</AccordionGroup>

## بارگذاری مجدد داغ پیکربندی

Gateway فایل `~/.openclaw/openclaw.json` را پایش می‌کند و تغییرها را به‌صورت خودکار اعمال می‌کند — برای بیشتر تنظیمات نیازی به راه‌اندازی مجدد دستی نیست.

ویرایش مستقیم فایل تا زمانی که اعتبارسنجی نشود، نامطمئن در نظر گرفته می‌شود. پایشگر صبر می‌کند
تا آشفتگی نوشتن موقت/تغییرنام ویرایشگر آرام شود، فایل نهایی را می‌خواند، و ویرایش‌های خارجی
نامعتبر را با بازیابی آخرین پیکربندی سالمِ شناخته‌شده رد می‌کند. نوشتن‌های پیکربندی متعلق به OpenClaw
پیش از نوشتن از همان گیت schema استفاده می‌کنند؛ بازنویسی‌های مخرب مانند
حذف `gateway.mode` یا کوچک کردن فایل به بیش از نصف، رد می‌شوند
و برای بررسی با پسوند `.rejected.*` ذخیره می‌شوند.

شکست‌های اعتبارسنجی محلی Plugin استثنا هستند: اگر همهٔ مشکل‌ها زیر
`plugins.entries.<id>...` باشند، بارگذاری مجدد پیکربندی فعلی را نگه می‌دارد و مشکل Plugin
را به‌جای بازیابی `.last-good` گزارش می‌کند.

اگر در لاگ‌ها `Config auto-restored from last-known-good` یا
`config reload restored last-known-good config` را دیدید، فایل متناظر
`.clobbered.*` کنار `openclaw.json` را بررسی کنید، بار ردشده را اصلاح کنید، سپس
`openclaw config validate` را اجرا کنید. برای چک‌لیست بازیابی،
[عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-restored-last-known-good-config)
را ببینید.

### حالت‌های بارگذاری مجدد

| حالت                   | رفتار                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (پیش‌فرض) | تغییرهای امن را فورا به‌صورت داغ اعمال می‌کند. برای موارد حیاتی به‌صورت خودکار راه‌اندازی مجدد می‌کند.           |
| **`hot`**              | فقط تغییرهای امن را به‌صورت داغ اعمال می‌کند. وقتی راه‌اندازی مجدد لازم باشد هشدار ثبت می‌کند — رسیدگی با شماست. |
| **`restart`**          | با هر تغییر پیکربندی، چه امن چه ناامن، Gateway را راه‌اندازی مجدد می‌کند.                                 |
| **`off`**              | پایش فایل را غیرفعال می‌کند. تغییرها در راه‌اندازی مجدد دستی بعدی اثر می‌کنند.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### چه چیزهایی به‌صورت داغ اعمال می‌شوند و چه چیزهایی به راه‌اندازی مجدد نیاز دارند

بیشتر فیلدها بدون توقف به‌صورت داغ اعمال می‌شوند. در حالت `hybrid`، تغییرهایی که به راه‌اندازی مجدد نیاز دارند به‌صورت خودکار رسیدگی می‌شوند.

| دسته‌بندی            | فیلدها                                                            | راه‌اندازی مجدد لازم است؟ |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| کانال‌ها            | `channels.*`، `web` (WhatsApp) — همهٔ کانال‌های داخلی و Plugin | خیر              |
| عامل و مدل‌ها      | `agent`، `agents`، `models`، `routing`                            | خیر              |
| خودکارسازی          | `hooks`، `cron`، `agent.heartbeat`                                | خیر              |
| نشست‌ها و پیام‌ها | `session`، `messages`                                             | خیر              |
| ابزارها و رسانه       | `tools`، `browser`، `skills`، `mcp`، `audio`، `talk`              | خیر              |
| UI و متفرقه           | `ui`، `logging`، `identity`، `bindings`                           | خیر              |
| سرور Gateway      | `gateway.*` (پورت، bind، احراز هویت، tailscale، TLS، HTTP)              | **بله**         |
| زیرساخت      | `discovery`، `canvasHost`، `plugins`                              | **بله**         |

<Note>
`gateway.reload` و `gateway.remote` استثنا هستند — تغییر آن‌ها راه‌اندازی مجدد را فعال **نمی‌کند**.
</Note>

### برنامه‌ریزی بارگذاری مجدد

وقتی یک فایل منبع را که از طریق `$include` ارجاع شده است ویرایش می‌کنید، OpenClaw بارگذاری مجدد را از چیدمان نوشته‌شده در منبع برنامه‌ریزی می‌کند، نه از نمای تخت‌شده در حافظه. این کار باعث می‌شود تصمیم‌های بارگذاری داغ (اعمال داغ در برابر راه‌اندازی مجدد) حتی وقتی یک بخش سطح‌بالای واحد در فایل include شده‌ی خودش قرار دارد، مانند `plugins: { $include: "./plugins.json5" }`، قابل پیش‌بینی بمانند. اگر چیدمان منبع مبهم باشد، برنامه‌ریزی بارگذاری مجدد به‌صورت بسته و ایمن شکست می‌خورد.

## Config RPC (به‌روزرسانی‌های برنامه‌نویسی‌شده)

برای ابزارهایی که پیکربندی را از طریق Gateway API می‌نویسند، این جریان را ترجیح دهید:

- `config.schema.lookup` برای بررسی یک زیردرخت (گره شِمای کم‌عمق + خلاصه‌های فرزند)
- `config.get` برای واکشی snapshot فعلی به‌همراه `hash`
- `config.patch` برای به‌روزرسانی‌های جزئی (JSON merge patch: آبجکت‌ها ادغام می‌شوند، `null` حذف می‌کند، آرایه‌ها جایگزین می‌شوند)
- `config.apply` فقط زمانی که قصد دارید کل پیکربندی را جایگزین کنید
- `update.run` برای self-update صریح به‌همراه راه‌اندازی مجدد
- `update.status` برای بررسی آخرین sentinel راه‌اندازی مجددِ به‌روزرسانی و تأیید نسخه‌ی در حال اجرا پس از راه‌اندازی مجدد

Agentها باید `config.schema.lookup` را نقطه‌ی شروع برای مستندات و محدودیت‌های دقیق در سطح فیلد بدانند. وقتی به نقشه‌ی گسترده‌تر پیکربندی، پیش‌فرض‌ها، یا لینک‌های ارجاع‌های اختصاصی زیرسیستم نیاز دارند، از [مرجع پیکربندی](/fa/gateway/configuration-reference) استفاده کنید.

<Note>
نوشتن‌های control-plane (`config.apply`، `config.patch`، `update.run`) به 3 درخواست در هر 60 ثانیه برای هر `deviceId+clientIp` محدود می‌شوند. درخواست‌های راه‌اندازی مجدد با هم ادغام می‌شوند و سپس بین چرخه‌های راه‌اندازی مجدد یک cooldown سی‌ثانیه‌ای اعمال می‌کنند. `update.status` فقط‌خواندنی است، اما در محدوده‌ی admin قرار دارد، چون sentinel راه‌اندازی مجدد می‌تواند خلاصه‌های مرحله‌های به‌روزرسانی و انتهای خروجی فرمان را شامل شود.
</Note>

نمونه patch جزئی:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

هر دو `config.apply` و `config.patch` مقادیر `raw`، `baseHash`، `sessionKey`، `note`، و `restartDelayMs` را می‌پذیرند. وقتی پیکربندی از قبل وجود داشته باشد، `baseHash` برای هر دو متد الزامی است.

## متغیرهای محیطی

OpenClaw متغیرهای محیطی را از فرایند والد به‌علاوه‌ی موارد زیر می‌خواند:

- `.env` از دایرکتوری کاری فعلی (اگر وجود داشته باشد)
- `~/.openclaw/.env` (fallback سراسری)

هیچ‌کدام از فایل‌ها متغیرهای محیطی موجود را override نمی‌کنند. همچنین می‌توانید متغیرهای محیطی inline را در پیکربندی تنظیم کنید:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="وارد کردن محیط Shell (اختیاری)">
  اگر فعال باشد و کلیدهای مورد انتظار تنظیم نشده باشند، OpenClaw login shell شما را اجرا می‌کند و فقط کلیدهای گمشده را وارد می‌کند:

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

- فقط نام‌های uppercase تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`
- متغیرهای گمشده/خالی هنگام بارگذاری خطا ایجاد می‌کنند
- برای خروجی literal با `$${VAR}` escape کنید
- داخل فایل‌های `$include` کار می‌کند
- جایگزینی inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="ارجاع‌های Secret (env، file، exec)">
  برای فیلدهایی که از آبجکت‌های SecretRef پشتیبانی می‌کنند، می‌توانید از این موارد استفاده کنید:

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

جزئیات SecretRef (از جمله `secrets.providers` برای `env`/`file`/`exec`) در [مدیریت Secrets](/fa/gateway/secrets) آمده است. مسیرهای credential پشتیبانی‌شده در [سطح Credential در SecretRef](/fa/reference/secretref-credential-surface) فهرست شده‌اند.
</Accordion>

برای precedence و منابع کامل، [محیط](/fa/help/environment) را ببینید.

## مرجع کامل

برای مرجع کامل فیلدبه‌فیلد، **[مرجع پیکربندی](/fa/gateway/configuration-reference)** را ببینید.

---

_مرتبط: [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [مرجع پیکربندی](/fa/gateway/configuration-reference) · [Doctor](/fa/gateway/doctor)_

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
- [Runbook Gateway](/fa/gateway)
