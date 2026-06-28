---
read_when:
    - شما خواهان پشتیبانی از Zalo Personal (غیررسمی) در OpenClaw هستید
    - شما در حال پیکربندی یا توسعهٔ Plugin zalouser هستید.
summary: 'Plugin شخصی Zalo: ورود با QR + پیام‌رسانی از طریق zca-js بومی (نصب Plugin + پیکربندی کانال + ابزار)'
title: Plugin شخصی Zalo
x-i18n:
    generated_at: "2026-05-10T20:01:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 405348eac4c08cc6e28b22cfff615fa34c117dedc51a31613545c4057069c20b
    source_path: plugins/zalouser.md
    workflow: 16
    postprocess_version: locale-links-v1
---

پشتیبانی از Zalo Personal برای OpenClaw از طریق یک plugin، با استفاده از `zca-js` بومی برای خودکارسازی یک حساب کاربری عادی Zalo.

<Warning>
خودکارسازی غیررسمی ممکن است به تعلیق یا مسدود شدن حساب منجر شود. با مسئولیت خودتان استفاده کنید.
</Warning>

## نام‌گذاری

شناسهٔ کانال `zalouser` است تا صراحتا مشخص باشد که این یک **حساب کاربری شخصی Zalo** را خودکارسازی می‌کند (غیررسمی). ما `zalo` را برای یک ادغام احتمالی رسمی Zalo API در آینده رزرو نگه می‌داریم.

## محل اجرا

این plugin **داخل فرایند Gateway** اجرا می‌شود.

اگر از یک Gateway راه‌دور استفاده می‌کنید، آن را روی **دستگاهی که Gateway را اجرا می‌کند** نصب/پیکربندی کنید، سپس Gateway را بازراه‌اندازی کنید.

به هیچ باینری CLI خارجی `zca`/`openzca` نیاز نیست.

## نصب

### گزینهٔ A: نصب از npm

```bash
openclaw plugins install @openclaw/zalouser
```

برای دنبال کردن تگ انتشار رسمی فعلی، از بستهٔ بدون نسخه استفاده کنید. فقط وقتی به نصبی بازتولیدپذیر نیاز دارید، نسخهٔ دقیق را پین کنید.

پس از آن Gateway را بازراه‌اندازی کنید.

### گزینهٔ B: نصب از یک پوشهٔ محلی (توسعه)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

پس از آن Gateway را بازراه‌اندازی کنید.

## پیکربندی

پیکربندی کانال زیر `channels.zalouser` قرار می‌گیرد (نه `plugins.entries.*`):

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

- [ساخت pluginها](/fa/plugins/building-plugins)
- [ClawHub](/fa/clawhub)
