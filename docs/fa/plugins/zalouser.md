---
read_when:
    - شما پشتیبانی از Zalo Personal (غیررسمی) را در OpenClaw می‌خواهید
    - شما در حال پیکربندی یا توسعه‌ی Plugin zalouser هستید
summary: 'Plugin شخصی Zalo: ورود با QR + پیام‌رسانی از طریق zca-js بومی (نصب Plugin + پیکربندی کانال + ابزار)'
title: Plugin شخصی Zalo
x-i18n:
    generated_at: "2026-05-06T18:01:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

پشتیبانی Zalo Personal برای OpenClaw از طریق یک Plugin، با استفاده از `zca-js` بومی برای خودکارسازی یک حساب کاربری عادی Zalo.

<Warning>
خودکارسازی غیررسمی ممکن است به تعلیق یا مسدود شدن حساب منجر شود. با مسئولیت خودتان استفاده کنید.
</Warning>

## نام‌گذاری

شناسه کانال `zalouser` است تا صریح باشد که این یک **حساب کاربری شخصی Zalo** را خودکار می‌کند (غیررسمی). ما `zalo` را برای یک یکپارچه‌سازی احتمالی آینده با API رسمی Zalo رزرو نگه می‌داریم.

## محل اجرا

این Plugin **داخل فرایند Gateway** اجرا می‌شود.

اگر از Gateway راه‌دور استفاده می‌کنید، آن را روی **دستگاهی که Gateway را اجرا می‌کند** نصب/پیکربندی کنید، سپس Gateway را دوباره راه‌اندازی کنید.

هیچ باینری CLI خارجی `zca`/`openzca` لازم نیست.

## نصب

### گزینه الف: نصب از npm

```bash
openclaw plugins install @openclaw/zalouser
```

از بسته بدون نسخه استفاده کنید تا برچسب انتشار رسمی فعلی را دنبال کند. فقط زمانی یک نسخه دقیق را پین کنید که به نصب بازتولیدپذیر نیاز دارید.

پس از آن Gateway را دوباره راه‌اندازی کنید.

### گزینه ب: نصب از یک پوشه محلی (توسعه)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

پس از آن Gateway را دوباره راه‌اندازی کنید.

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

کنش‌ها: `send`، `image`، `link`، `friends`، `groups`، `me`، `status`

کنش‌های پیام کانال همچنین برای واکنش‌های پیام از `react` پشتیبانی می‌کنند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [Pluginهای جامعه](/fa/plugins/community)
