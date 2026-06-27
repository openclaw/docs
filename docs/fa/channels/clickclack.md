---
read_when:
    - اتصال OpenClaw به فضای کاری ClickClack
    - آزمودن هویت‌های ربات ClickClack
summary: راه‌اندازی کانال توکن ربات ClickClack و نحو هدف
title: ClickClack
x-i18n:
    generated_at: "2026-06-27T17:09:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17d5dd79c29122916474a54069306e8e040a68c15c46bd217391bc97dd5d5bb5
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack از طریق توکن‌های ربات درجه‌یک ClickClack، OpenClaw را به یک فضای کاری خودمیزبان ClickClack متصل می‌کند.

وقتی می‌خواهید یک عامل OpenClaw به‌عنوان کاربر ربات ClickClack ظاهر شود، از این استفاده کنید. ClickClack از ربات‌های سرویس مستقل و ربات‌های متعلق به کاربر پشتیبانی می‌کند؛ ربات‌های متعلق به کاربر یک `owner_user_id` را نگه می‌دارند و فقط محدوده‌های توکنی را دریافت می‌کنند که شما اعطا می‌کنید.

## راه‌اندازی سریع

یک توکن ربات در ClickClack بسازید:

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

برای ربات متعلق به کاربر، `--owner <user_id>` را اضافه کنید.

OpenClaw را پیکربندی کنید:

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
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

سپس اجرا کنید:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

اگر `plugins.allow` یک فهرست محدودکننده و غیرخالی باشد، انتخاب صریح
ClickClack در راه‌اندازی کانال یا اجرای `openclaw plugins enable clickclack`
مقدار `clickclack` را به آن فهرست اضافه می‌کند. نصب هنگام آغازبه‌کار از همان
رفتار انتخاب صریح استفاده می‌کند. این مسیرها `plugins.deny` یا تنظیم
سراسری `plugins.enabled: false` را نادیده نمی‌گیرند. اجرای مستقیم
`openclaw plugins install @openclaw/clickclack` از سیاست عادی
نصب Plugin پیروی می‌کند و ClickClack را نیز در یک فهرست مجاز موجود ثبت می‌کند.

## چندین ربات

هر حساب اتصال بلادرنگ ClickClack خودش را باز می‌کند و از توکن ربات خودش استفاده می‌کند.

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
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` برای پاسخ‌های کوتاه ربات، مستقیماً از `api.runtime.llm.complete` استفاده می‌کند.
وقتی یک حساب `agentId` را تنظیم می‌کند، OpenClaw به بیت اعتماد صریح
`plugins.entries.clickclack.llm.allowAgentIdOverride` نیاز دارد تا Plugin
بتواند برای آن عامل ربات تکمیل‌ها را اجرا کند. اگر فقط از مسیر عامل پیش‌فرض
استفاده می‌کنید، آن را خاموش نگه دارید.

## مقصدها

- `channel:<name-or-id>` به یک کانال فضای کاری ارسال می‌کند. مقصدهای بدون پیشوند به‌طور پیش‌فرض `channel:` هستند.
- `dm:<user_id>` یک گفت‌وگوی مستقیم با آن کاربر ایجاد می‌کند یا دوباره به‌کار می‌گیرد.
- `thread:<message_id>` در یک رشته موجود پاسخ می‌دهد.

نمونه‌ها:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## مجوزها

محدوده‌های توکن ClickClack توسط API ClickClack اعمال می‌شوند.

- `bot:read`: خواندن داده‌های فضای کاری/کانال/پیام/رشته/DM/بلادرنگ/نمایه.
- `bot:write`: `bot:read` به‌علاوه پیام‌های کانال، پاسخ‌های رشته، DMها، و بارگذاری‌ها.
- `bot:admin`: `bot:write` به‌علاوه ایجاد کانال.

OpenClaw برای گفت‌وگوی عادی عامل فقط به `bot:write` نیاز دارد.

## عیب‌یابی

- `ClickClack is not configured`: مقدار `channels.clickclack.token` یا `CLICKCLACK_BOT_TOKEN` را تنظیم کنید.
- `workspace not found`: مقدار `workspace` را روی شناسه یا نامک فضای کاری بازگردانده‌شده توسط ClickClack تنظیم کنید.
- پاسخی از ورودی‌ها دریافت نمی‌شود: تأیید کنید توکن دسترسی خواندن بلادرنگ دارد و ربات به پیام‌های خودش پاسخ نمی‌دهد.
- ارسال‌های کانال ناموفق‌اند: بررسی کنید ربات عضو فضای کاری است و `bot:write` دارد.
