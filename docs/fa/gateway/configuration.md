---
read_when:
    - راه‌اندازی OpenClaw برای نخستین بار
    - جست‌وجوی الگوهای رایج پیکربندی
    - پیمایش به بخش‌های مشخص پیکربندی
summary: 'مرور کلی پیکربندی: کارهای رایج، راه‌اندازی سریع و پیوندها به مرجع کامل'
title: پیکربندی
x-i18n:
    generated_at: "2026-07-16T16:14:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw پیکربندی اختیاری <Tooltip tip="JSON5 از دیدگاه‌ها و ویرگول‌های پایانی پشتیبانی می‌کند">**JSON5**</Tooltip> را از `~/.openclaw/openclaw.json` می‌خواند. اگر فایل وجود نداشته باشد، OpenClaw از پیش‌فرض‌های امن استفاده می‌کند.

مسیر پیکربندی فعال باید یک فایل معمولی باشد. نوشتن‌های متعلق به OpenClaw آن را به‌صورت اتمی جایگزین می‌کنند (با تغییر نام روی مسیر)، بنابراین در یک `openclaw.json` دارای پیوند نمادین، به‌جای نوشتن از طریق پیوند، هدف آن جایگزین می‌شود — از چیدمان‌های پیکربندی دارای پیوند نمادین پرهیز کنید. اگر پیکربندی را خارج از پوشهٔ پیش‌فرض وضعیت نگه می‌دارید، `OPENCLAW_CONFIG_PATH` را مستقیماً به فایل واقعی اشاره دهید.

دلایل رایج برای افزودن پیکربندی:

- کانال‌ها را متصل کنید و کنترل کنید چه کسانی می‌توانند به ربات پیام دهند
- مدل‌ها، ابزارها، سندباکس‌سازی یا خودکارسازی (Cron، هوک‌ها) را تنظیم کنید
- نشست‌ها، رسانه، شبکه یا رابط کاربری را تنظیم دقیق کنید

برای مشاهدهٔ تمام فیلدهای موجود، [مرجع کامل](/fa/gateway/configuration-reference) را ببینید.

عامل‌ها و خودکارسازی‌ها باید پیش از ویرایش پیکربندی، برای مستندات دقیق در سطح فیلد
از `config.schema.lookup` استفاده کنند. از این صفحه برای راهنمایی وظیفه‌محور و از
[مرجع پیکربندی](/fa/gateway/configuration-reference) برای نقشهٔ گسترده‌تر
فیلدها و پیش‌فرض‌ها استفاده کنید.

<Tip>
**با پیکربندی آشنا نیستید؟** برای راه‌اندازی تعاملی با `openclaw onboard` شروع کنید، یا برای پیکربندی‌های کامل و آمادهٔ کپی‌کردن، راهنمای [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) را ببینید.
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
  <Tab title="راهنمای تعاملی">
    ```bash
    openclaw onboard       # فرایند کامل آغاز به کار
    openclaw configure     # راهنمای پیکربندی
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
    [http://127.0.0.1:18789](http://127.0.0.1:18789) را باز کنید و از زبانهٔ **پیکربندی** استفاده کنید.
    رابط کاربری کنترل، فرمی را از طرح‌وارهٔ زندهٔ پیکربندی نمایش می‌دهد که شامل فرادادهٔ مستندات
    `title` / `description` فیلد و نیز طرح‌واره‌های Plugin و کانال، در صورت
    موجود بودن، است و یک ویرایشگر **JSON خام** نیز به‌عنوان راه گریز ارائه می‌کند. برای رابط‌های کاربری
    جزئی‌نگر و ابزارهای دیگر، Gateway همچنین `config.schema.lookup` را برای
    دریافت یک گرهٔ طرح‌واره با دامنهٔ یک مسیر، همراه با خلاصهٔ فرزندان بلافصل آن، ارائه می‌کند.
  </Tab>
  <Tab title="ویرایش مستقیم">
    `~/.openclaw/openclaw.json` را مستقیماً ویرایش کنید. Gateway فایل را زیر نظر می‌گیرد و تغییرات را به‌طور خودکار اعمال می‌کند ([بارگذاری مجدد آنی](#config-hot-reload) را ببینید).
  </Tab>
</Tabs>

## اعتبارسنجی سخت‌گیرانه

<Warning>
OpenClaw فقط پیکربندی‌هایی را می‌پذیرد که کاملاً با طرح‌واره مطابقت داشته باشند. کلیدهای ناشناخته، نوع‌های بدشکل یا مقادیر نامعتبر باعث می‌شوند Gateway **از راه‌اندازی خودداری کند**. تنها استثنا در سطح ریشه `$schema` (رشته) است تا ویرایشگرها بتوانند فرادادهٔ JSON Schema را پیوست کنند.
</Warning>

`openclaw config schema` طرح‌وارهٔ استاندارد JSON مورداستفادهٔ رابط کاربری کنترل
و اعتبارسنجی را چاپ می‌کند. `config.schema.lookup` یک گره با دامنهٔ یک مسیر را همراه با
خلاصهٔ فرزندان آن برای ابزارهای جزئی‌نگر دریافت می‌کند. فرادادهٔ مستندات فیلد `title`/`description`
در اشیای تو‌در‌تو، نویسهٔ عام (`*`)، عضو آرایه (`[]`) و شاخه‌های `anyOf`/
`oneOf`/`allOf` منتقل می‌شود. هنگامی که رجیستری مانیفست بارگذاری شود،
طرح‌واره‌های زمان اجرای Plugin و کانال نیز ادغام می‌شوند.

هنگام شکست اعتبارسنجی:

- Gateway راه‌اندازی نمی‌شود
- فقط فرمان‌های عیب‌یابی کار می‌کنند (`openclaw doctor`، `openclaw logs`، `openclaw health`، `openclaw status`)
- برای مشاهدهٔ دقیق مشکلات، `openclaw doctor` را اجرا کنید
- برای اعمال اصلاحات، `openclaw doctor --fix` را اجرا کنید (`--repair` همان پرچم است؛ `--yes` پرسش‌ها را رد می‌کند)

Gateway پس از هر راه‌اندازی موفق، یک نسخهٔ قابل‌اعتماد از آخرین پیکربندی سالم را نگه می‌دارد،
اما راه‌اندازی و بارگذاری مجدد آنی آن را به‌طور خودکار بازیابی نمی‌کنند — فقط `openclaw doctor --fix`
این کار را انجام می‌دهد. اگر اعتبارسنجی `openclaw.json` شکست بخورد (از جمله اعتبارسنجی محلی Plugin)،
راه‌اندازی Gateway شکست می‌خورد یا بارگذاری مجدد نادیده گرفته می‌شود و زمان اجرای فعلی آخرین
پیکربندی پذیرفته‌شده را حفظ می‌کند. یک نوشتن ردشده نیز برای بررسی در `<path>.rejected.<timestamp>` ذخیره می‌شود.
Gateway نوشتن‌هایی را که شبیه بازنویسی ناخواسته باشند مسدود می‌کند — حذف `gateway.mode`،
از دست رفتن بلوک `meta` یا کوچک‌شدن فایل به بیش از نصف — مگر اینکه نوشتن
صراحتاً تغییرات مخرب را مجاز کند. اگر یک پیکربندی پیشنهادی شامل جای‌نگهدار راز ویرایش‌شده‌ای مانند
`***` یا `[redacted]` باشد، ارتقای آن به آخرین پیکربندی سالم انجام نمی‌شود.

## کارهای رایج

<AccordionGroup>
  <Accordion title="راه‌اندازی یک کانال (WhatsApp، Telegram، Discord و غیره)">
    هر کانال بخش پیکربندی خود را زیر `channels.<provider>` دارد. برای مراحل راه‌اندازی، صفحهٔ اختصاصی کانال را ببینید:

    - [Discord](/fa/channels/discord) - `channels.discord`
    - [Feishu](/fa/channels/feishu) - `channels.feishu`
    - [Google Chat](/fa/channels/googlechat) - `channels.googlechat`
    - [iMessage](/fa/channels/imessage) - `channels.imessage`
    - [Mattermost](/fa/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/fa/channels/msteams) - `channels.msteams`
    - [Signal](/fa/channels/signal) - `channels.signal`
    - [Slack](/fa/channels/slack) - `channels.slack`
    - [Telegram](/fa/channels/telegram) - `channels.telegram`
    - [WhatsApp](/fa/channels/whatsapp) - `channels.whatsapp`

    همهٔ کانال‌ها از الگوی سیاست پیام مستقیم یکسانی استفاده می‌کنند:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // فقط برای allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="انتخاب و پیکربندی مدل‌ها">
    مدل اصلی و جایگزین‌های اختیاری را تنظیم کنید:

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

    - `agents.defaults.models` فهرست مدل‌ها را تعریف می‌کند و به‌عنوان فهرست مجاز برای `/model` عمل می‌کند؛ ورودی‌های `provider/*`، ضمن ادامهٔ استفاده از کشف پویای مدل، `/model`، `/models` و انتخابگرهای مدل را به ارائه‌دهندگان منتخب محدود می‌کنند.
    - برای افزودن ورودی‌های فهرست مجاز بدون حذف مدل‌های موجود، از `openclaw config set agents.defaults.models '<json>' --strict-json --merge` استفاده کنید. جایگزینی‌های ساده‌ای که ورودی‌ها را حذف کنند، مگر با ارسال `--replace`، رد می‌شوند.
    - ارجاع‌های مدل از قالب `provider/model` استفاده می‌کنند (برای نمونه `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` کوچک‌سازی تصاویر رونوشت/ابزار را کنترل می‌کند (پیش‌فرض `1200`)؛ مقادیر کمتر معمولاً مصرف توکن بینایی را در اجراهای دارای اسکرین‌شات فراوان کاهش می‌دهند.
    - برای جابه‌جایی مدل‌ها در گفت‌وگو، [CLI مدل‌ها](/fa/concepts/models) و برای چرخش احراز هویت و رفتار جایگزینی، [جایگزینی مدل](/fa/concepts/model-failover) را ببینید.
    - برای ارائه‌دهندگان سفارشی/خودمیزبان، بخش [ارائه‌دهندگان سفارشی](/fa/gateway/config-tools#custom-providers-and-base-urls) را در مرجع ببینید.

  </Accordion>

  <Accordion title="کنترل افرادی که می‌توانند به ربات پیام دهند">
    دسترسی پیام مستقیم برای هر کانال از طریق `dmPolicy` کنترل می‌شود (پیش‌فرض `"pairing"`):

    - `"pairing"`: فرستندگان ناشناس یک کد یک‌بارمصرف جفت‌سازی برای تأیید دریافت می‌کنند
    - `"allowlist"`: فقط فرستندگان موجود در `allowFrom` (یا مخزن مجاز جفت‌شده)
    - `"open"`: همهٔ پیام‌های مستقیم ورودی را مجاز می‌کند (به `allowFrom: ["*"]` نیاز دارد)
    - `"disabled"`: همهٔ پیام‌های مستقیم را نادیده می‌گیرد

    برای گروه‌ها، از `groupPolicy` (`"allowlist" | "open" | "disabled"`) به‌همراه `groupAllowFrom` یا فهرست‌های مجاز مختص کانال استفاده کنید.

    برای جزئیات هر کانال، [مرجع کامل](/fa/gateway/config-channels#dm-and-group-access) را ببینید.

  </Accordion>

  <Accordion title="راه‌اندازی محدودسازی اشاره در گفت‌وگوی گروهی">
    پیام‌های گروهی به‌طور پیش‌فرض **به اشاره نیاز دارند**. الگوهای فعال‌سازی را برای هر عامل پیکربندی کنید. پاسخ‌های معمول گروه/کانال به‌طور خودکار ارسال می‌شوند؛ برای اتاق‌های مشترکی که عامل باید تصمیم بگیرد چه زمانی صحبت کند، مسیر ابزار پیام را فعال کنید:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // برای الزام ارسال از طریق ابزار پیام در همه‌جا، روی "message_tool" تنظیم کنید
        groupChat: {
          visibleReplies: "message_tool", // انتخابی؛ خروجی قابل‌مشاهده به message(action=send) نیاز دارد
          unmentionedInbound: "room_event", // گفت‌وگوی گروهی دائمی بدون اشاره، زمینه‌ای بی‌صدا است
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

    - **اشاره‌های فراداده‌ای**: اشاره‌های بومی @ (اشاره با لمس در WhatsApp، ‏@bot در Telegram و غیره)
    - **الگوهای متنی**: الگوهای امن عبارت منظم در `mentionPatterns`
    - **پاسخ‌های قابل‌مشاهده**: `messages.visibleReplies` می‌تواند ارسال از طریق ابزار پیام را به‌صورت سراسری الزامی کند؛ `messages.groupChat.visibleReplies` این تنظیم را برای گروه‌ها/کانال‌ها بازنویسی می‌کند.
    - برای حالت‌های پاسخ قابل‌مشاهده، بازنویسی‌های مختص کانال و حالت گفت‌وگو با خود، [مرجع کامل](/fa/gateway/config-channels#group-chat-mention-gating) را ببینید.

  </Accordion>

  <Accordion title="محدودکردن Skills برای هر عامل">
    برای یک خط پایهٔ مشترک از `agents.defaults.skills` استفاده کنید، سپس عامل‌های
    مشخص را با `agents.list[].skills` بازنویسی کنید:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github و weather را به ارث می‌برد
          { id: "docs", skills: ["docs-search"] }, // پیش‌فرض‌ها را جایگزین می‌کند
          { id: "locked-down", skills: [] }, // بدون Skills
        ],
      },
    }
    ```

    - برای نامحدودبودن Skills به‌طور پیش‌فرض، `agents.defaults.skills` را حذف کنید.
    - برای به‌ارث‌بردن پیش‌فرض‌ها، `agents.list[].skills` را حذف کنید.
    - برای نداشتن Skills، مقدار `agents.list[].skills: []` را تنظیم کنید.
    - [Skills](/fa/tools/skills)، [پیکربندی Skills](/fa/tools/skills-config) و
      [مرجع پیکربندی](/fa/gateway/config-agents#agents-defaults-skills) را ببینید.

  </Accordion>

  <Accordion title="تنظیم دقیق پایش سلامت کانال‌های Gateway">
    میزان تهاجمی‌بودن Gateway در راه‌اندازی مجدد کانال‌هایی را که کهنه به نظر می‌رسند کنترل کنید:

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

    - مقادیر نمایش‌داده‌شده پیش‌فرض هستند. برای غیرفعال‌کردن راه‌اندازی‌های مجدد پایش سلامت در سطح سراسری، `gateway.channelHealthCheckMinutes: 0` را تنظیم کنید.
    - `channelStaleEventThresholdMinutes` باید بزرگ‌تر یا مساوی بازهٔ بررسی باشد.
    - برای غیرفعال‌کردن راه‌اندازی مجدد خودکار یک کانال یا حساب، بدون غیرفعال‌کردن پایشگر سراسری، از `channels.<provider>.healthMonitor.enabled` یا `channels.<provider>.accounts.<id>.healthMonitor.enabled` استفاده کنید.
    - برای عیب‌یابی عملیاتی، [بررسی‌های سلامت](/fa/gateway/health) و برای همهٔ فیلدها، [مرجع کامل](/fa/gateway/configuration-reference#gateway) را ببینید.

  </Accordion>

  <Accordion title="تنظیم دقیق مهلت دست‌دهی WebSocket در Gateway">
    به کلاینت‌های محلی روی میزبان‌های پربار یا کم‌توان، زمان بیشتری برای تکمیل دست‌دهی
    WebSocket پیش از احراز هویت بدهید:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - مقدار پیش‌فرض `15000` میلی‌ثانیه است.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` همچنان برای بازنویسی‌های یک‌بارهٔ سرویس یا پوسته اولویت دارد.
    - ابتدا رفع توقف‌های راه‌اندازی/حلقهٔ رویداد را در اولویت قرار دهید؛ این تنظیم برای میزبان‌هایی است که سالم‌اند اما هنگام گرم‌شدن کند عمل می‌کنند.

  </Accordion>

  <Accordion title="پیکربندی نشست‌ها و بازنشانی‌ها">
    نشست‌ها تداوم و جداسازی مکالمه را کنترل می‌کنند:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // برای چند کاربر توصیه می‌شود
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
    - `threadBindings`: پیش‌فرض‌های سراسری برای مسیریابی نشست‌های متصل به رشته. `/focus`، `/unfocus`، `/agents`، `/session idle` و `/session max-age` این مورد را برای هر نشست متصل، جدا، فهرست و تنظیم می‌کنند (Discord رشته‌ها را متصل می‌کند و Telegram موضوع‌ها/مکالمه‌ها را).
    - برای محدوده‌بندی، پیوندهای هویتی و سیاست ارسال، به [مدیریت نشست](/fa/concepts/session) مراجعه کنید.
    - برای همهٔ فیلدها، [مرجع کامل](/fa/gateway/config-agents#session) را ببینید.

  </Accordion>

  <Accordion title="فعال‌سازی سندباکس">
    نشست‌های عامل را در محیط‌های اجرایی سندباکسِ ایزوله اجرا کنید:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // خاموش | غیر اصلی | همه
            scope: "agent",    // نشست | عامل | مشترک
          },
        },
      },
    }
    ```

    ابتدا ایمیج را بسازید — از یک checkout منبع، `scripts/sandbox-setup.sh` را اجرا کنید، یا برای نصب npm، فرمان درون‌خطی `docker build` را در [سندباکس § ایمیج‌ها و راه‌اندازی](/fa/gateway/sandboxing#images-and-setup) ببینید.

    برای راهنمای کامل به [سندباکس](/fa/gateway/sandboxing) و برای همهٔ گزینه‌ها به [مرجع کامل](/fa/gateway/config-agents#agentsdefaultssandbox) مراجعه کنید.

  </Accordion>

  <Accordion title="فعال‌سازی پوش مبتنی بر رله برای بیلدهای رسمی iOS">
    پوش مبتنی بر رله برای بیلدهای عمومی App Store از رلهٔ میزبانی‌شدهٔ OpenClaw استفاده می‌کند: `https://ios-push-relay.openclaw.ai`.

    استقرارهای سفارشی رله به یک مسیر بیلد/استقرار iOS عمداً مجزا نیاز دارند که URL رلهٔ آن با URL رلهٔ Gateway مطابقت داشته باشد. اگر از بیلد رلهٔ سفارشی استفاده می‌کنید، این مورد را در پیکربندی Gateway تنظیم کنید:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // اختیاری. پیش‌فرض: 10000
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

    کارکرد این تنظیم:

    - به Gateway اجازه می‌دهد `push.test`، تلنگرهای بیدارباش و بیدارباش‌های اتصال مجدد را از طریق رلهٔ خارجی ارسال کند.
    - از مجوز ارسالِ محدود به ثبت‌نام استفاده می‌کند که برنامهٔ جفت‌شدهٔ iOS آن را ارسال می‌کند. Gateway به توکن رلهٔ سراسری برای کل استقرار نیاز ندارد.
    - هر ثبت‌نام مبتنی بر رله را به هویت Gatewayای متصل می‌کند که برنامهٔ iOS با آن جفت شده است؛ بنابراین Gateway دیگری نمی‌تواند از ثبت‌نام ذخیره‌شده دوباره استفاده کند.
    - بیلدهای محلی/دستی iOS را روی APNs مستقیم نگه می‌دارد. ارسال‌های مبتنی بر رله فقط برای بیلدهای رسمی توزیع‌شده‌ای اعمال می‌شوند که از طریق رله ثبت‌نام کرده‌اند.
    - باید با URL پایهٔ رلهٔ تعبیه‌شده در بیلد iOS مطابقت داشته باشد تا ترافیک ثبت‌نام و ارسال به همان استقرار رله برسد.

    جریان سرتاسری:

    1. برنامهٔ رسمی iOS را نصب کنید.
    2. اختیاری: فقط هنگام استفاده از یک بیلد رلهٔ سفارشی و عمداً مجزا، `gateway.push.apns.relay.baseUrl` را روی Gateway پیکربندی کنید.
    3. برنامهٔ iOS را با Gateway جفت کنید و اجازه دهید نشست‌های Node و اپراتور هر دو متصل شوند.
    4. برنامهٔ iOS هویت Gateway را دریافت می‌کند، با استفاده از App Attest به‌همراه رسید برنامه در رله ثبت‌نام می‌کند و سپس payload مبتنی بر رلهٔ `push.apns.register` را در Gateway جفت‌شده منتشر می‌کند.
    5. Gateway شناسهٔ رله و مجوز ارسال را ذخیره می‌کند و سپس از آن‌ها برای `push.test`، تلنگرهای بیدارباش و بیدارباش‌های اتصال مجدد استفاده می‌کند.

    نکات عملیاتی:

    - اگر برنامهٔ iOS را به Gateway دیگری منتقل کردید، برنامه را دوباره متصل کنید تا بتواند ثبت‌نام رلهٔ جدیدی منتشر کند که به آن Gateway متصل است.
    - اگر بیلد جدیدی از iOS منتشر کنید که به استقرار رلهٔ دیگری اشاره دارد، برنامه به‌جای استفادهٔ مجدد از مبدأ رلهٔ قبلی، ثبت‌نام رلهٔ کش‌شدهٔ خود را تازه‌سازی می‌کند.

    نکتهٔ سازگاری:

    - `OPENCLAW_APNS_RELAY_BASE_URL` و `OPENCLAW_APNS_RELAY_TIMEOUT_MS` همچنان به‌عنوان بازنویسی‌های موقت متغیر محیطی کار می‌کنند.
    - URLهای رلهٔ سفارشی Gateway باید با URL پایهٔ رلهٔ تعبیه‌شده در بیلد iOS مطابقت داشته باشند؛ مسیر انتشار عمومی App Store بازنویسی‌های سفارشی URL رلهٔ iOS را رد می‌کند.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` همچنان یک راه فرار توسعه‌ایِ محدود به loopback است؛ URLهای رلهٔ HTTP را در پیکربندی ماندگار نکنید.

    برای جریان سرتاسری به [برنامهٔ iOS](/fa/platforms/ios#relay-backed-push-for-official-builds) و برای مدل امنیتی رله به [جریان احراز هویت و اعتماد](/fa/platforms/ios#authentication-and-trust-flow) مراجعه کنید.

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

    - `every`: رشتهٔ مدت‌زمان (`30m`، `2h`). برای غیرفعال‌سازی، `0m` را تنظیم کنید. پیش‌فرض: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (برای مثال `discord`، `matrix`، `telegram` یا `whatsapp`)
    - `directPolicy`: `allow` (پیش‌فرض) یا `block` برای مقصدهای Heartbeat به سبک پیام مستقیم
    - برای راهنمای کامل به [Heartbeat](/fa/gateway/heartbeat) مراجعه کنید.

  </Accordion>

  <Accordion title="پیکربندی کارهای Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // پیش‌فرض؛ توزیع Cron + اجرای نوبت عامل Cron به‌صورت ایزوله
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: نشست‌های اجرای ایزولهٔ تکمیل‌شده را از ردیف‌های نشست SQLite پاک می‌کند (پیش‌فرض `24h`؛ برای غیرفعال‌سازی، `false` را تنظیم کنید).
    - تاریخچهٔ اجرا به‌طور خودکار جدیدترین 2000 ردیف پایانی را برای هر کار نگه می‌دارد؛ ردیف‌های ازدست‌رفته بازهٔ پاک‌سازی 24 ساعتهٔ خود را حفظ می‌کنند.
    - برای نمای کلی قابلیت و نمونه‌های CLI، به [کارهای Cron](/fa/automation/cron-jobs) مراجعه کنید.

  </Accordion>

  <Accordion title="راه‌اندازی Webhookها (قلاب‌ها)">
    نقاط پایانی Webhook مبتنی بر HTTP را روی Gateway فعال کنید:

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
    - تمام محتوای payload قلاب/Webhook را ورودی غیرقابل‌اعتماد در نظر بگیرید.
    - از یک `hooks.token` اختصاصی استفاده کنید؛ اسرار فعال احراز هویت Gateway را دوباره استفاده نکنید (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` یا `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - احراز هویت قلاب فقط از طریق سربرگ انجام می‌شود (`Authorization: Bearer ...` یا `x-openclaw-token`)؛ توکن‌های رشتهٔ پرس‌وجو رد می‌شوند.
    - `hooks.path` نمی‌تواند `/` باشد؛ ورودی Webhook را روی یک زیرمسیر اختصاصی مانند `/hooks` نگه دارید.
    - پرچم‌های دور زدن محتوای ناامن (`hooks.gmail.allowUnsafeExternalContent`، `hooks.mappings[].allowUnsafeExternalContent`) را غیرفعال نگه دارید، مگر هنگام اشکال‌زدایی با محدوده‌ای کاملاً محدود.
    - اگر `hooks.allowRequestSessionKey` را فعال می‌کنید، `hooks.allowedSessionKeyPrefixes` را نیز تنظیم کنید تا کلیدهای نشست انتخاب‌شده توسط فراخواننده محدود شوند.
    - برای عامل‌های راه‌اندازی‌شده توسط قلاب، سطوح قدرتمند و مدرن مدل و سیاست سخت‌گیرانهٔ ابزار را ترجیح دهید (برای مثال فقط پیام‌رسانی به‌همراه سندباکس، هرجا ممکن باشد).

    برای همهٔ گزینه‌های نگاشت و یکپارچه‌سازی Gmail، به [مرجع کامل](/fa/gateway/configuration-reference#hooks) مراجعه کنید.

  </Accordion>

  <Accordion title="پیکربندی مسیریابی چندعاملی">
    چند عامل ایزوله را با فضای کاری و نشست‌های جداگانه اجرا کنید:

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

    برای قواعد اتصال و پروفایل‌های دسترسی هر عامل، به [چندعاملی](/fa/concepts/multi-agent) و [مرجع کامل](/fa/gateway/config-agents#multi-agent-routing) مراجعه کنید.

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

    - **یک فایل**: شیء دربرگیرنده را جایگزین می‌کند
    - **آرایه‌ای از فایل‌ها**: به‌ترتیب به‌صورت عمیق ادغام می‌شوند (مورد بعدی اولویت دارد)، تا عمق 10 سطح تودرتو
    - **کلیدهای هم‌سطح**: پس از includeها ادغام می‌شوند (مقادیر includeشده را بازنویسی می‌کنند)
    - **مسیرهای نسبی**: نسبت به فایل includeکننده تفکیک می‌شوند
    - **قالب مسیر**: مسیرهای include نباید حاوی بایت null باشند و پیش و پس از تفکیک باید اکیداً کوتاه‌تر از 4096 نویسه باشند
    - **نوشتن‌های متعلق به OpenClaw**: هنگامی که یک نوشتن فقط یک بخش سطح‌بالا را تغییر می‌دهد
      که با یک include تک‌فایلی مانند `plugins: { $include: "./plugins.json5" }` پشتیبانی می‌شود،
      OpenClaw آن فایل includeشده را به‌روزرسانی می‌کند و `openclaw.json` را دست‌نخورده باقی می‌گذارد
    - **انتقال نوشتن پشتیبانی‌نشده**: includeهای ریشه، آرایه‌های include و includeهایی
      که بازنویسی هم‌سطح دارند، برای نوشتن‌های متعلق به OpenClaw به‌صورت بسته شکست می‌خورند،
      به‌جای اینکه پیکربندی را مسطح کنند
    - **محدودسازی**: مسیرهای `$include` باید زیر دایرکتوری نگه‌دارندهٔ
      `openclaw.json` تفکیک شوند. برای اشتراک‌گذاری یک درخت میان ماشین‌ها یا کاربران،
      `OPENCLAW_INCLUDE_ROOTS` را روی فهرستی از مسیرها (`:` در POSIX، `;` در Windows) از
      دایرکتوری‌های اضافی تنظیم کنید که includeها مجازند به آن‌ها ارجاع دهند. پیوندهای نمادین تفکیک
      و دوباره بررسی می‌شوند؛ بنابراین مسیری که از نظر نوشتاری داخل دایرکتوری پیکربندی قرار دارد اما
      مقصد واقعی آن از همهٔ ریشه‌های مجاز خارج می‌شود، همچنان رد خواهد شد.
    - **مدیریت خطا**: خطاهای شفاف برای فایل‌های مفقود، خطاهای تجزیه، includeهای دوری، قالب نامعتبر مسیر و طول بیش‌ازحد

  </Accordion>
</AccordionGroup>

## بارگذاری مجدد داغ پیکربندی

Gateway فایل `~/.openclaw/openclaw.json` را پایش می‌کند و تغییرات را به‌طور خودکار اعمال می‌کند — برای بیشتر تنظیمات نیازی به راه‌اندازی مجدد دستی نیست.

ویرایش‌های مستقیم فایل تا زمان اعتبارسنجی، غیرقابل‌اعتماد در نظر گرفته می‌شوند. پایشگر منتظر می‌ماند
تا نوسان ناشی از نوشتن موقت/تغییرنام ویرایشگر فروکش کند، فایل نهایی را می‌خواند و
ویرایش‌های خارجی نامعتبر را بدون بازنویسی `openclaw.json` رد می‌کند. نوشتن‌های پیکربندی
متعلق به OpenClaw پیش از نوشتن از همان دروازهٔ طرح‌واره استفاده می‌کنند (برای قواعد بازنویسی/بازگردانی
که بر هر نوشتن اعمال می‌شوند، [اعتبارسنجی سخت‌گیرانه](#strict-validation) را ببینید).

اگر `config reload skipped (invalid config)` را مشاهده کردید یا راه‌اندازی `Invalid
config` را گزارش داد، پیکربندی را بررسی کنید، `openclaw config validate` را اجرا کنید و سپس برای تعمیر `openclaw
doctor --fix` را اجرا کنید. برای فهرست بررسی به [عیب‌یابی Gateway](/fa/gateway/troubleshooting#gateway-rejected-invalid-config)
مراجعه کنید.

### حالت‌های بارگذاری مجدد

| حالت                   | رفتار                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (پیش‌فرض) | تغییرات امن را بی‌درنگ و بدون راه‌اندازی مجدد اعمال می‌کند. برای تغییرات حیاتی به‌طور خودکار راه‌اندازی مجدد می‌کند.           |
| **`hot`**              | فقط تغییرات امن را بدون راه‌اندازی مجدد اعمال می‌کند. هنگامی که راه‌اندازی مجدد لازم باشد، هشداری ثبت می‌کند — انجام آن بر عهده شماست. |
| **`restart`**          | با هر تغییر پیکربندی، چه امن باشد چه نباشد، Gateway را دوباره راه‌اندازی می‌کند.                                 |
| **`off`**              | پایش فایل‌ها را غیرفعال می‌کند. تغییرات در راه‌اندازی مجدد دستی بعدی اعمال می‌شوند.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### چه چیزهایی بدون راه‌اندازی مجدد اعمال می‌شوند و چه چیزهایی به راه‌اندازی مجدد نیاز دارند

بیشتر فیلدها بدون توقف سرویس و بدون راه‌اندازی مجدد اعمال می‌شوند؛ برخی بخش‌هایی که به‌صورت زنده اعمال می‌شوند، فقط همان
زیرسامانه (کانال، cron، heartbeat، پایشگر سلامت) را به‌جای کل Gateway دوباره راه‌اندازی می‌کنند. در
حالت `hybrid`، تغییراتی که به راه‌اندازی مجدد Gateway نیاز دارند، به‌طور خودکار مدیریت می‌شوند.

| دسته            | فیلدها                                                                  | نیاز به راه‌اندازی مجدد Gateway؟      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| کانال‌ها            | `channels.*`، `web` (WhatsApp) — همه کانال‌های داخلی و کانال‌های Plugin       | خیر (همان کانال را دوباره راه‌اندازی می‌کند)   |
| عامل و مدل‌ها      | `agent`، `agents`، `models`، `routing`                                  | خیر                           |
| خودکارسازی          | `hooks`، `cron`، `agent.heartbeat`                                      | خیر (همان زیرسامانه را دوباره راه‌اندازی می‌کند) |
| نشست‌ها و پیام‌ها | `session`، `messages`                                                   | خیر                           |
| ابزارها و رسانه       | `tools`، `skills`، `mcp`، `audio`، `talk`                               | خیر                           |
| پیکربندی Plugin       | `plugins.entries.*`، `plugins.allow`، `plugins.deny`، `plugins.enabled` | خیر (محیط اجرای Plugin را دوباره بارگذاری می‌کند)  |
| رابط کاربری و متفرقه           | `ui`، `logging`، `identity`، `bindings`                                 | خیر                           |
| سرور Gateway      | `gateway.*` (درگاه، اتصال، احراز هویت، tailscale، TLS، HTTP، ارسال)              | **بله**                      |
| زیرساخت      | `discovery`، `browser`، `plugins.load`، `plugins.installs`              | **بله**                      |

<Note>
`gateway.reload` و `gateway.remote` در `gateway.*` استثنا هستند — تغییر آن‌ها باعث راه‌اندازی مجدد **نمی‌شود**. هر Plugin نیز می‌تواند این جدول را بازنویسی کند: یک Plugin بارگذاری‌شده ممکن است پیشوندهای پیکربندیِ راه‌اندازِ مجدد خودش را اعلام کند (برای مثال، Plugin همراه Canvas برای `plugins.enabled`، `plugins.allow` و `plugins.deny`، و نه فقط `plugins.entries.canvas` خودش، Gateway را دوباره راه‌اندازی می‌کند)، بنابراین رفتار واقعی به Pluginهای فعال بستگی دارد.
</Note>

### برنامه‌ریزی بارگذاری مجدد

هنگامی که فایل منبعی را ویرایش می‌کنید که از طریق `$include` ارجاع داده شده است، OpenClaw
بارگذاری مجدد را بر اساس چیدمان نوشته‌شده در منبع برنامه‌ریزی می‌کند، نه نمای تخت‌شده در حافظه.
این کار تصمیم‌های بارگذاری مجدد زنده (اعمال بدون راه‌اندازی مجدد در برابر راه‌اندازی مجدد) را حتی زمانی که یک
بخش سطح‌بالا در فایل الحاق‌شده جداگانه‌ای مانند
`plugins: { $include: "./plugins.json5" }` قرار دارد، قابل پیش‌بینی نگه می‌دارد. اگر
چیدمان منبع مبهم باشد، برنامه‌ریزی بارگذاری مجدد به‌صورت ایمن متوقف می‌شود.

## RPC پیکربندی (به‌روزرسانی‌های برنامه‌نویسی‌شده)

برای ابزارهایی که پیکربندی را از طریق API درگاه می‌نویسند، این روند ترجیح داده می‌شود:

- `config.schema.lookup` برای بررسی یک زیردرخت (گره سطحی طرح‌واره + خلاصه
  فرزندان)
- `config.get` برای دریافت تصویر لحظه‌ای کنونی به‌همراه `hash`
- `config.patch` برای به‌روزرسانی‌های جزئی (وصله ادغام JSON: اشیا ادغام می‌شوند، `null`
  حذف می‌کند و آرایه‌ها، اگر حذف ورودی‌ها با `replacePaths` صریحاً تأیید شده باشد،
  جایگزین می‌شوند)
- `config.apply` فقط هنگامی که قصد دارید کل پیکربندی را جایگزین کنید
- `update.run` برای خودبه‌روزرسانی صریح به‌همراه راه‌اندازی مجدد؛ اگر نشست پس از راه‌اندازی مجدد باید یک نوبت پیگیری اجرا کند، `continuationMessage` را اضافه کنید
- `update.status` برای بررسی آخرین نشانگر راه‌اندازی مجدد به‌روزرسانی و تأیید نسخه در حال اجرا پس از راه‌اندازی مجدد

عامل‌ها باید `config.schema.lookup` را نخستین مرجع برای مستندات و محدودیت‌های دقیق
در سطح فیلد بدانند. هنگامی که به نقشه گسترده‌تر پیکربندی، مقادیر پیش‌فرض یا پیوندهای
مراجع اختصاصی زیرسامانه‌ها نیاز دارند، از [مرجع پیکربندی](/fa/gateway/configuration-reference)
استفاده کنند.

<Note>
نوشتن‌های صفحه کنترل (`config.apply`، `config.patch`، `update.run`)
به 3 درخواست در هر 60 ثانیه برای هر `deviceId+clientIp` محدود شده‌اند. درخواست‌های
راه‌اندازی مجدد با هم ادغام می‌شوند و سپس میان چرخه‌های راه‌اندازی مجدد یک دوره انتظار 30ثانیه‌ای اعمال می‌شود.
`update.status` فقط‌خواندنی است، اما به سطح مدیر محدود می‌شود، زیرا نشانگر راه‌اندازی مجدد ممکن است
شامل خلاصه مراحل به‌روزرسانی و انتهای خروجی فرمان باشد.
</Note>

نمونه وصله جزئی:

```bash
openclaw gateway call config.get --params '{}'  # دریافت payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

هر دو `config.apply` و `config.patch` مقادیر `raw`، `baseHash`، `sessionKey`،
`note` و `restartDelayMs` را می‌پذیرند. پس از آنکه فایل
پیکربندی از قبل وجود داشته باشد، `baseHash` برای هر دو روش الزامی است (نخستین نوشتن بدون پیکربندی موجود، این بررسی را نادیده می‌گیرد).

`config.patch` همچنین `replacePaths` را می‌پذیرد؛ آرایه‌ای از مسیرهای پیکربندی که
جایگزینی آرایه در آن‌ها عمدی است. اگر وصله‌ای آرایه موجودی را با ورودی‌های کمتر جایگزین
یا حذف کند، Gateway نوشتن را رد می‌کند، مگر اینکه همان مسیر دقیق در
`replacePaths` وجود داشته باشد؛ آرایه‌های تودرتو در ورودی‌های آرایه از `[]` استفاده می‌کنند، مانند
`agents.list[].skills`. این کار مانع می‌شود تصویرهای لحظه‌ای ناقص `config.get`
آرایه‌های مسیریابی یا فهرست مجاز را بی‌سروصدا بازنویسی کنند. هنگامی که قصد دارید
کل پیکربندی را جایگزین کنید، از `config.apply` استفاده کنید.

## متغیرهای محیطی

OpenClaw متغیرهای محیطی را از فرایند والد و نیز منابع زیر می‌خواند:

- `.env` از پوشه کاری کنونی (در صورت وجود)
- `~/.openclaw/.env` (جایگزین سراسری)

هیچ‌یک از این فایل‌ها متغیرهای محیطی موجود را بازنویسی نمی‌کنند. همچنین می‌توانید متغیرهای محیطی درون‌خطی را در پیکربندی تنظیم کنید:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="وارد کردن محیط پوسته (اختیاری)">
  اگر فعال باشد و کلیدهای مورد انتظار تنظیم نشده باشند، OpenClaw پوسته ورود شما را اجرا می‌کند و فقط کلیدهای مفقود را وارد می‌کند:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

متغیر محیطی معادل: `OPENCLAW_LOAD_SHELL_ENV=1`. مقدار پیش‌فرض `timeoutMs`: ‏`15000`.
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

- فقط نام‌های بزرگ تطبیق داده می‌شوند: `[A-Z_][A-Z0-9_]*`
- متغیرهای مفقود یا خالی هنگام بارگذاری خطا ایجاد می‌کنند
- برای خروجی تحت‌اللفظی با `$${VAR}` نویسه گریز قرار دهید
- در فایل‌های `$include` کار می‌کند
- جایگزینی درون‌خطی: `"${BASE}/v1"` ← `"https://api.example.com/v1"`

</Accordion>

<Accordion title="ارجاع‌های اطلاعات محرمانه (محیط، فایل، اجرا)">
  برای فیلدهایی که از اشیای SecretRef پشتیبانی می‌کنند، می‌توانید از موارد زیر استفاده کنید:

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

جزئیات SecretRef (از جمله `secrets.providers` برای `env`/`file`/`exec`) در [مدیریت اطلاعات محرمانه](/fa/gateway/secrets) آمده است.
مسیرهای پشتیبانی‌شده اعتبارنامه در [سطح اعتبارنامه SecretRef](/fa/reference/secretref-credential-surface) فهرست شده‌اند.
</Accordion>

برای تقدم کامل و منابع، به [محیط](/fa/help/environment) مراجعه کنید.

## مرجع کامل

برای مرجع کامل و فیلدبه‌فیلد، به **[مرجع پیکربندی](/fa/gateway/configuration-reference)** مراجعه کنید.

---

_مرتبط: [نمونه‌های پیکربندی](/fa/gateway/configuration-examples) · [مرجع پیکربندی](/fa/gateway/configuration-reference) · [Doctor](/fa/gateway/doctor)_

## مطالب مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [نمونه‌های پیکربندی](/fa/gateway/configuration-examples)
- [راهنمای عملیاتی Gateway](/fa/gateway)
