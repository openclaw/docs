---
read_when:
    - می‌خواهید OpenClaw از Zalo Personal (غیررسمی) پشتیبانی کند
    - در حال پیکربندی یا توسعه Plugin ‏zalouser هستید
summary: 'Plugin شخصی Zalo: ورود با کد QR + پیام‌رسانی از طریق zca-js بومی (نصب Plugin + پیکربندی کانال + ابزار)'
title: Plugin شخصی Zalo
x-i18n:
    generated_at: "2026-07-12T10:37:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

پشتیبانی از Zalo Personal برای OpenClaw از طریق Pluginای که با استفاده از `zca-js` بومی، یک حساب کاربری عادی Zalo را خودکارسازی می‌کند. هیچ فایل اجرایی خارجی CLI با نام `zca`/`openzca` لازم نیست.

<Warning>
خودکارسازی غیررسمی ممکن است به تعلیق یا مسدودشدن حساب منجر شود. با مسئولیت خودتان استفاده کنید.
</Warning>

## نام‌گذاری

شناسه کانال `zalouser` است تا به‌صراحت مشخص کند که این کانال یک **حساب کاربری شخصی Zalo** را خودکارسازی می‌کند (غیررسمی). شناسه کانال جداگانه `zalo` مربوط به یکپارچه‌سازی رسمی و همراه Zalo Bot/Webhook است؛ [Zalo](/fa/channels/zalo) را ببینید.

## محل اجرا

این Plugin **درون فرایند Gateway** اجرا می‌شود. برای یک Gateway راه‌دور، آن را روی همان میزبان نصب و پیکربندی کنید و سپس Gateway را راه‌اندازی مجدد کنید.

## نصب

### از npm

```bash
openclaw plugins install @openclaw/zalouser
```

برای دنبال‌کردن برچسب انتشار رسمی فعلی، از بسته بدون تعیین نسخه استفاده کنید؛ فقط زمانی نسخه‌ای دقیق را تثبیت کنید که به نصبی تکرارپذیر نیاز دارید. پس از آن Gateway را راه‌اندازی مجدد کنید.

### از یک پوشه محلی (توسعه)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

پس از آن Gateway را راه‌اندازی مجدد کنید.

## پیکربندی

پیکربندی کانال در `channels.zalouser` قرار می‌گیرد (نه در `plugins.entries.*`):

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

برای کنترل دسترسی پیام‌های مستقیم/گروهی، راه‌اندازی چندحسابی، متغیرهای محیطی و عیب‌یابی، [پیکربندی کانال شخصی Zalo](/fa/channels/zalouser) را ببینید.

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## ابزار عامل

نام ابزار: `zalouser`

عملیات: `send`، `image`، `link`، `friends`، `groups`، `me`، `status`

عملیات پیام کانال (نه ابزار عامل) برای واکنش به پیام‌ها از `react` نیز پشتیبانی می‌کنند.

## مرتبط

- [پیکربندی کانال شخصی Zalo](/fa/channels/zalouser)
- [Zalo (کانال رسمی Bot/Webhook)](/fa/channels/zalo)
- [ساخت Pluginها](/fa/plugins/building-plugins)
- [ClawHub](/clawhub)
