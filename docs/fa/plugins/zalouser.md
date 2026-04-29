---
read_when:
    - شما پشتیبانی Zalo Personal (غیررسمی) را در OpenClaw می‌خواهید
    - شما در حال پیکربندی یا توسعهٔ Plugin zalouser هستید
summary: 'Plugin شخصی Zalo: ورود با QR + پیام‌رسانی از طریق zca-js بومی (نصب Plugin + پیکربندی کانال + ابزار)'
title: Plugin شخصی Zalo
x-i18n:
    generated_at: "2026-04-29T23:22:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (plugin)

پشتیبانی Zalo Personal برای OpenClaw از طریق یک plugin، با استفاده از `zca-js` بومی برای خودکارسازی یک حساب کاربری عادی Zalo.

<Warning>
خودکارسازی غیررسمی ممکن است به تعلیق یا مسدود شدن حساب منجر شود. با مسئولیت خودتان استفاده کنید.
</Warning>

## نام‌گذاری

شناسه کانال `zalouser` است تا صریح باشد که این مورد یک **حساب کاربری شخصی Zalo** را خودکارسازی می‌کند (غیررسمی). ما `zalo` را برای یک ادغام احتمالی رسمی با API رسمی Zalo در آینده رزرو نگه می‌داریم.

## محل اجرا

این plugin **داخل فرایند Gateway** اجرا می‌شود.

اگر از Gateway راه‌دور استفاده می‌کنید، آن را روی **ماشینی که Gateway را اجرا می‌کند** نصب/پیکربندی کنید، سپس Gateway را بازراه‌اندازی کنید.

به هیچ باینری CLI خارجی `zca`/`openzca` نیاز نیست.

## نصب

### گزینه A: نصب از npm

```bash
openclaw plugins install @openclaw/zalouser
```

اگر npm بسته متعلق به OpenClaw را منسوخ‌شده گزارش کند، آن نسخه بسته
از یک زنجیره بسته خارجی قدیمی‌تر است؛ از یک build بسته‌بندی‌شده فعلی OpenClaw یا
مسیر پوشه محلی استفاده کنید تا زمانی که بسته npm جدیدتری منتشر شود.

پس از آن Gateway را بازراه‌اندازی کنید.

### گزینه B: نصب از یک پوشه محلی (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

پس از آن Gateway را بازراه‌اندازی کنید.

## پیکربندی

پیکربندی کانال زیر `channels.zalouser` قرار دارد (نه `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## ابزار عامل

نام ابزار: `zalouser`

اقدام‌ها: `send`، `image`، `link`، `friends`، `groups`، `me`، `status`

اقدام‌های پیام کانال همچنین از `react` برای واکنش‌های پیام پشتیبانی می‌کنند.

## مرتبط

- [ساخت pluginها](/fa/plugins/building-plugins)
- [pluginهای جامعه](/fa/plugins/community)
