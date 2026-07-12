---
read_when:
    - اتصال OpenClaw به یک فضای کاری ClickClack
    - آزمایش هویت‌های ربات ClickClack
summary: راه‌اندازی کانال با توکن ربات ClickClack و نحو مقصد
title: کلیک‌کلاک
x-i18n:
    generated_at: "2026-07-12T09:32:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack از طریق توکن‌های اختصاصی ربات ClickClack، ‏OpenClaw را به یک فضای کاری ClickClack با میزبانی شخصی متصل می‌کند.

زمانی از این روش استفاده کنید که می‌خواهید یک عامل OpenClaw به‌عنوان کاربر ربات ClickClack ظاهر شود. ClickClack از ربات‌های سرویس مستقل و ربات‌های متعلق به کاربر پشتیبانی می‌کند؛ ربات‌های متعلق به کاربر یک `owner_user_id` را نگه می‌دارند و فقط محدوده‌های دسترسی توکنی را دریافت می‌کنند که شما اعطا می‌کنید.

## راه‌اندازی سریع

در سرور ClickClack یک توکن ربات ایجاد کنید:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

برای ربات متعلق به کاربر، `--owner <user_id>` را اضافه کنید.

OpenClaw را پیکربندی کنید:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

سپس اجرا کنید:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

یک حساب فقط زمانی پیکربندی‌شده محسوب می‌شود که `baseUrl`،‏ `token` و `workspace` همگی تنظیم شده باشند. `workspace` شناسه فضای کاری (`wsp_...`)، نامک یا نام را می‌پذیرد؛ Gateway هنگام راه‌اندازی آن را به شناسه تبدیل می‌کند.

### کلیدهای پیکربندی حساب

| کلید                    | پیش‌فرض            | توضیحات                                                                                             |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `baseUrl`               | هیچ‌کدام (الزامی)   | نشانی اینترنتی سرور ClickClack.                                                                    |
| `token`                 | هیچ‌کدام (الزامی)   | رشته ساده یا ارجاع محرمانه (`source: "env" \| "file" \| "exec"`).                                  |
| `workspace`             | هیچ‌کدام (الزامی)   | شناسه، نامک یا نام فضای کاری.                                                                       |
| `replyMode`             | `"agent"`           | `"agent"` خط لوله کامل عامل را اجرا می‌کند؛ `"model"` تکمیل‌های کوتاه و مستقیم مدل را ارسال می‌کند. |
| `defaultTo`             | `"channel:general"` | مقصدی که وقتی مسیر خروجی مقصدی ارائه نمی‌دهد استفاده می‌شود.                                       |
| `allowFrom`             | `["*"]`             | فهرست مجاز شناسه‌های کاربر برای پیام‌های خصوصی و پیام‌های کانال ورودی.                              |
| `botUserId`             | تشخیص خودکار        | هنگام راه‌اندازی از هویت توکن ربات استخراج می‌شود.                                                  |
| `agentId`               | پیش‌فرض مسیریابی    | پیام‌های ورودی این حساب را به یک عامل مشخص محدود می‌کند.                                            |
| `toolsAllow`            | هیچ‌کدام            | فهرست مجاز ابزارها برای پاسخ‌های عامل از این حساب.                                                   |
| `model`, `systemPrompt` | هیچ‌کدام            | در تکمیل‌های `replyMode: "model"` استفاده می‌شود.                                                    |
| `reconnectMs`           | `1500`              | تأخیر اتصال مجدد بلادرنگ (از ۱۰۰ تا ۶۰۰۰۰).                                                         |

اگر `plugins.allow` یک فهرست محدودکننده و غیرخالی باشد، انتخاب صریح
ClickClack در راه‌اندازی کانال یا اجرای `openclaw plugins enable clickclack`
مقدار `clickclack` را به آن فهرست اضافه می‌کند. نصب هنگام آغازبه‌کار نیز از همین
رفتار انتخاب صریح استفاده می‌کند. این مسیرها `plugins.deny` یا تنظیم سراسری
`plugins.enabled: false` را نادیده نمی‌گیرند. اجرای مستقیم
`openclaw plugins install @openclaw/clickclack` از سیاست عادی نصب
Plugin پیروی می‌کند و ClickClack را نیز در فهرست مجاز موجود ثبت می‌کند.

## چند ربات

هر حساب اتصال بلادرنگ ClickClack خود را باز می‌کند و از توکن ربات خودش استفاده می‌کند.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## حالت‌های پاسخ

- `replyMode: "agent"` (پیش‌فرض) پیام‌های ورودی را از طریق خط لوله عادی عامل، شامل ثبت نشست و سیاست ابزار، هدایت می‌کند.
- `replyMode: "model"` خط لوله عامل را رد می‌کند و برای پاسخ‌های کوتاه و مستقیم ربات از `llm.complete` در زمان اجرای Plugin استفاده می‌کند (که می‌توان شکل آن را با `model` و `systemPrompt` تعیین کرد).

حالت مدل، تکمیل‌ها را با شناسه عامل ربات استخراج‌شده اجرا می‌کند که به بیت اعتماد
صریح `plugins.entries.clickclack.llm.allowAgentIdOverride: true` نیاز دارد:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

اگر فقط از حالت پاسخ پیش‌فرض `agent` استفاده می‌کنید، بیت اعتماد را غیرفعال
نگه دارید؛ در آن حالت نیازی به آن نیست.

برای شواهد هم‌بستگی میان سرویس‌ها از حالت `agent` استفاده کنید. برای شناسه پیام
معتبر ClickClack با قالب استاندارد `msg_<ulid>`، کانال شناسه اجرای قطعی OpenClaw
یعنی `clickclack:<message-id>` را ایجاد می‌کند. سپس هر فراخوانی مدل در اطلاعات
تشخیصی به‌شکل `clickclack:<message-id>:model:<n>` قابل مشاهده است؛ وقتی آن نوبت
از ClawRouter استفاده کند، همان شناسه فراخوانی مدل به‌عنوان `X-Request-ID`
ارسال می‌شود. حالت `model` اطلاعات تشخیصی عادی اجرای عامل/نشست را دور می‌زند و
بنابراین برای این مسیر شواهد مناسب نیست.

هنگامی که یک رویداد بلادرنگ دارای `payload.correlation_id` اعتبارسنجی‌شده باشد،
کانال آن را در واکشی معتبر پیام و درخواست‌های پاسخ ClickClack حاصل، به‌صورت
`X-Correlation-ID` منتقل می‌کند. مقادیر از مجموعه امن ۱۲۸ نویسه‌ای ClickClack
(`A-Z`،‏ `a-z`،‏ `0-9`،‏ `.`،‏ `_`،‏ `:` و `-`) استفاده می‌کنند؛ مقادیر نامعتبر
حذف می‌شوند. این پیوندها فقط شامل شناسه‌ها هستند و هرگز بدنه پیام‌ها،
پرامپت‌ها، تکمیل‌ها، اطلاعات احراز هویت یا خروجی ابزار را در بر نمی‌گیرند.

## ردیف‌های فعالیت عامل

به‌طور پیش‌فرض، هنگام اجرای یک نوبت عامل، کانال ClickClack چیزی نمایش نمی‌دهد و فقط پاسخ نهایی درج می‌شود. برای انتشار ردیف‌های پیام ماندگار `agent_commentary` و `agent_tool` در طول اجرای نوبت، روی حساب `agentActivity: true` را تنظیم کنید:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

الزامات و رفتار:

- **به‌طور پیش‌فرض غیرفعال است.** تنظیمات استاندارد و سرورهای قدیمی‌تر ClickClack بدون تغییر باقی می‌مانند.
- **به محدوده توکن `agent_activity:write` نیاز دارد.** این محدوده از `bot:write` جدا است و از آن به ارث نمی‌رسد؛ پیش از فعال‌سازی این گزینه، توکن ربات را با `--scopes bot:write,agent_activity:write` ایجاد کنید (یا این محدوده را به توکن موجود اعطا کنید).
- **تنزل کنترل‌شده در حد تلاش ممکن.** اگر توکن فاقد `agent_activity:write` باشد یا سرور نوشتن فعالیت را رد کند، خطاها ثبت می‌شوند و پاسخ نهایی همچنان به‌طور عادی تحویل داده می‌شود؛ هیچ ردیف فعالیتی ظاهر نمی‌شود.
- ردیف‌ها بر اساس هر نوبت (`turn_id`) گروه‌بندی و ادغام می‌شوند تا هر گام منطقی یک ردیف باشد؛ ردیف‌های ابزار نیز از همان قالب‌بندی پیشرفت Discord/Slack/Telegram استفاده می‌کنند (نام ابزار به‌همراه جزئیات فرمان).
- **فراداده انتساب.** پست‌های نوشته‌شده توسط عامل (ردیف‌های فعالیت و پاسخ نهایی) دارای فیلدهای `author_model` و `author_thinking` هستند که از مدل واقعی استفاده‌شده در نوبت استخراج می‌شوند (از جمله پس از استفاده از جایگزین). سرورهایی که این ستون‌ها را تعریف نکرده‌اند، فیلدهای ناشناخته JSON را نادیده می‌گیرند؛ سرورهایی که آن‌ها را ذخیره می‌کنند، می‌توانند برای هر پیام به پرسش «کدام مدل این خط را با چه سطحی از تفکر بیان کرده است» پاسخ دهند.

## مقصدها

- `channel:<name-or-id>` به یک کانال فضای کاری ارسال می‌کند. مقصدهای بدون پیشوند به‌طور پیش‌فرض `channel:` هستند.
- `dm:<user_id>` یک گفت‌وگوی مستقیم با آن کاربر ایجاد می‌کند یا از گفت‌وگوی موجود دوباره استفاده می‌کند.
- `thread:<message_id>` در رشته‌ای که ریشه آن آن پیام است پاسخ می‌دهد.

مقصدهای خروجی صریح می‌توانند پیشوند ارائه‌دهنده `clickclack:` یا `cc:` را نیز داشته باشند.

نمونه‌ها:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## مجوزها

محدوده‌های توکن ClickClack توسط API ‏ClickClack اعمال می‌شوند.

- `bot:read`: خواندن داده‌های فضای کاری/کانال/پیام/رشته/پیام خصوصی/بلادرنگ/نمایه.
- `bot:write`:‏ `bot:read` به‌همراه پیام‌های کانال، پاسخ‌های رشته، پیام‌های خصوصی و بارگذاری‌ها.
- `bot:admin`:‏ `bot:write` به‌همراه ایجاد کانال.
- `agent_activity:write`: ردیف‌های ماندگار فعالیت عامل (`agent_commentary` / `agent_tool`). از `bot:write` یا `bot:admin` به ارث نمی‌رسد؛ فقط زمانی لازم است که `agentActivity: true` تنظیم شده باشد.

OpenClaw برای گفت‌وگوی عادی عامل فقط به `bot:write` نیاز دارد. هنگام فعال‌سازی [ردیف‌های فعالیت عامل](#agent-activity-rows)،‏ `agent_activity:write` را اضافه کنید.

## عیب‌یابی

- `ClickClack is not configured for account "<id>"`: برای آن حساب `baseUrl`،‏ `token` (برای نمونه از طریق `CLICKCLACK_BOT_TOKEN`) و `workspace` را تنظیم کنید.
- `ClickClack workspace not found: <value>`:‏ `workspace` را روی شناسه، نامک یا نام فضای کاری بازگردانده‌شده توسط ClickClack تنظیم کنید.
- پاسخ ورودی دریافت نمی‌شود: تأیید کنید که توکن دسترسی خواندن بلادرنگ دارد و توجه داشته باشید که ربات پیام‌های خودش و پیام‌های ربات‌های دیگر را نادیده می‌گیرد.
- ارسال به کانال ناموفق است: بررسی کنید که ربات عضو فضای کاری است و مجوز `bot:write` دارد.
