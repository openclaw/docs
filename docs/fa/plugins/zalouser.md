---
read_when:
    - شما خواهان پشتیبانی از Zalo Personal (غیررسمی) در OpenClaw هستید
    - شما در حال پیکربندی یا توسعهٔ Plugin zalouser هستید
summary: 'Plugin شخصی Zalo: ورود با QR + پیام‌رسانی از طریق zca-js بومی (نصب Plugin + پیکربندی کانال + ابزار)'
title: Plugin شخصی Zalo
x-i18n:
    generated_at: "2026-05-02T22:25:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8bcead1a6425587a2cae40e4e817c45b9adf8afbfce6dc673065cc98353f844
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

پشتیبانی Zalo Personal برای OpenClaw از طریق یک Plugin، با استفاده از `zca-js` بومی برای خودکارسازی یک حساب کاربری عادی Zalo.

<Warning>
خودکارسازی غیررسمی ممکن است به تعلیق یا مسدود شدن حساب منجر شود. با مسئولیت خودتان استفاده کنید.
</Warning>

## نام‌گذاری

شناسه کانال `zalouser` است تا به‌صراحت نشان دهد که این مورد یک **حساب کاربری شخصی Zalo** را خودکارسازی می‌کند (غیررسمی). ما `zalo` را برای یک یکپارچه‌سازی احتمالی رسمی API مربوط به Zalo در آینده محفوظ نگه می‌داریم.

## محل اجرا

این Plugin **داخل فرایند Gateway** اجرا می‌شود.

اگر از یک Gateway راه دور استفاده می‌کنید، آن را روی **دستگاهی که Gateway را اجرا می‌کند** نصب/پیکربندی کنید، سپس Gateway را بازراه‌اندازی کنید.

هیچ باینری CLI خارجی `zca`/`openzca` لازم نیست.

## نصب

### گزینه A: نصب از npm

```bash
openclaw plugins install @openclaw/zalouser
```

برای دنبال کردن برچسب انتشار رسمی فعلی، از بسته بدون نسخه استفاده کنید. فقط زمانی نسخه دقیق را پین کنید که به نصب بازتولیدپذیر نیاز دارید.

پس از آن Gateway را بازراه‌اندازی کنید.

### گزینه B: نصب از یک پوشه محلی (توسعه)

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

اقدام‌ها: `send`، `image`، `link`، `friends`، `groups`، `me`، `status`

اقدام‌های پیام کانال همچنین از `react` برای واکنش‌های پیام پشتیبانی می‌کنند.

## مرتبط

- [ساخت Pluginها](/fa/plugins/building-plugins)
- [Pluginهای جامعه](/fa/plugins/community)
