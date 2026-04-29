---
read_when:
    - می‌خواهید TaskFlows را از یک سامانهٔ خارجی فعال یا هدایت کنید
    - شما در حال پیکربندی Plugin Webhook همراه هستید
summary: 'Plugin Webhooks: ورودی احراز هویت‌شدهٔ TaskFlow برای خودکارسازی خارجی مورد اعتماد'
title: Plugin Webhookها
x-i18n:
    generated_at: "2026-04-29T23:22:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhookها (Plugin)

Plugin مربوط به Webhookها مسیرهای HTTP احرازشده‌ای اضافه می‌کند که اتوماسیون خارجی را به TaskFlowهای OpenClaw متصل می‌کنند.

وقتی از آن استفاده کنید که می‌خواهید یک سیستم مورد اعتماد مانند Zapier، n8n، یک کار CI، یا یک سرویس داخلی، بدون اینکه ابتدا یک Plugin سفارشی بنویسید، TaskFlowهای مدیریت‌شده ایجاد و هدایت کند.

## محل اجرا

Plugin مربوط به Webhookها داخل فرایند Gateway اجرا می‌شود.

اگر Gateway شما روی دستگاه دیگری اجرا می‌شود، Plugin را روی همان میزبان Gateway نصب و پیکربندی کنید، سپس Gateway را راه‌اندازی مجدد کنید.

## پیکربندی مسیرها

پیکربندی را زیر `plugins.entries.webhooks.config` تنظیم کنید:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

فیلدهای مسیر:

- `enabled`: اختیاری، مقدار پیش‌فرض `true` است
- `path`: اختیاری، مقدار پیش‌فرض `/plugins/webhooks/<routeId>` است
- `sessionKey`: نشست الزامی که مالک TaskFlowهای متصل است
- `secret`: راز مشترک یا SecretRef الزامی
- `controllerId`: شناسه کنترل‌کننده اختیاری برای جریان‌های مدیریت‌شده ایجادشده
- `description`: یادداشت اختیاری برای اپراتور

ورودی‌های پشتیبانی‌شده برای `secret`:

- رشته ساده
- SecretRef با `source: "env" | "file" | "exec"`

اگر یک مسیر متکی به راز نتواند راز خود را هنگام راه‌اندازی resolve کند، Plugin آن مسیر را نادیده می‌گیرد و به‌جای افشای یک endpoint خراب، هشدار ثبت می‌کند.

## مدل امنیتی

هر مسیر مورد اعتماد است تا با اختیار TaskFlow مربوط به `sessionKey` پیکربندی‌شده خود عمل کند.

این یعنی مسیر می‌تواند TaskFlowهای متعلق به آن نشست را بررسی و تغییر دهد، بنابراین باید:

- برای هر مسیر از یک راز قوی و یکتا استفاده کنید
- ارجاع‌های راز را به رازهای متن ساده درون‌خطی ترجیح دهید
- مسیرها را به محدودترین نشستی متصل کنید که برای گردش‌کار کافی است
- فقط مسیر Webhook مشخصی را که نیاز دارید در دسترس قرار دهید

Plugin اعمال می‌کند:

- احراز هویت با راز مشترک
- محافظ‌های اندازه بدنه درخواست و timeout
- محدودسازی نرخ با پنجره ثابت
- محدودسازی درخواست‌های در حال اجرا
- دسترسی TaskFlow محدود به مالک از طریق `api.runtime.tasks.managedFlows.bindSession(...)`

## قالب درخواست

درخواست‌های `POST` را با موارد زیر ارسال کنید:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` یا `x-openclaw-webhook-secret: <secret>`

مثال:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## کنش‌های پشتیبانی‌شده

Plugin در حال حاضر این مقدارهای JSON برای `action` را می‌پذیرد:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

یک TaskFlow مدیریت‌شده برای نشست متصل به مسیر ایجاد می‌کند.

مثال:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

یک وظیفه فرزند مدیریت‌شده را داخل یک TaskFlow مدیریت‌شده موجود ایجاد می‌کند.

runtimeهای مجاز عبارت‌اند از:

- `subagent`
- `acp`

مثال:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## شکل پاسخ

پاسخ‌های موفق این را برمی‌گردانند:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

درخواست‌های ردشده این را برمی‌گردانند:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin عمدا فراداده مالک/نشست را از پاسخ‌های Webhook پاک می‌کند.

## مستندات مرتبط

- [SDK زمان اجرای Plugin](/fa/plugins/sdk-runtime)
- [نمای کلی Hookها و Webhookها](/fa/automation/hooks)
- [Webhookهای CLI](/fa/cli/webhooks)
