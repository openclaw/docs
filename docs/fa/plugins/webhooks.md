---
read_when:
    - می‌خواهید TaskFlows را از یک سامانه خارجی فعال یا هدایت کنید
    - در حال پیکربندی Plugin وب‌هوک‌های همراه هستید
summary: 'Plugin Webhooks: ورودی احراز هویت‌شده TaskFlow برای خودکارسازی خارجی مورد اعتماد'
title: Plugin Webhookها
x-i18n:
    generated_at: "2026-05-06T18:01:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks مسیرهای HTTP احراز هویت‌شده‌ای اضافه می‌کند که اتوماسیون خارجی را به TaskFlowهای OpenClaw متصل می‌کنند.

از آن زمانی استفاده کنید که می‌خواهید یک سامانه قابل اعتماد مانند Zapier، n8n، یک کار CI، یا یک سرویس داخلی، بدون نوشتن یک Plugin سفارشی در ابتدا، TaskFlowهای مدیریت‌شده را ایجاد و هدایت کند.

## محل اجرا

Plugin Webhooks داخل فرایند Gateway اجرا می‌شود.

اگر Gateway شما روی ماشین دیگری اجرا می‌شود، Plugin را روی همان میزبان Gateway نصب و پیکربندی کنید، سپس Gateway را بازراه‌اندازی کنید.

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

- `enabled`: اختیاری، پیش‌فرض `true` است
- `path`: اختیاری، پیش‌فرض `/plugins/webhooks/<routeId>` است
- `sessionKey`: نشست الزامی که مالک TaskFlowهای متصل‌شده است
- `secret`: secret مشترک یا SecretRef الزامی
- `controllerId`: شناسه کنترلر اختیاری برای جریان‌های مدیریت‌شده ایجادشده
- `description`: یادداشت اختیاری برای اپراتور

ورودی‌های پشتیبانی‌شده `secret`:

- رشته ساده
- SecretRef با `source: "env" | "file" | "exec"`

اگر یک مسیر متکی به secret نتواند secret خود را هنگام راه‌اندازی resolve کند، Plugin آن مسیر را نادیده می‌گیرد و به‌جای نمایان کردن یک endpoint خراب، هشدار ثبت می‌کند.

## مدل امنیتی

هر مسیر مورد اعتماد است تا با اختیار TaskFlow مربوط به `sessionKey` پیکربندی‌شده‌اش عمل کند.

یعنی مسیر می‌تواند TaskFlowهای متعلق به آن نشست را بررسی و تغییر دهد، بنابراین باید:

- برای هر مسیر از یک secret قوی و یکتا استفاده کنید
- ارجاع‌های secret را به secretهای متن ساده درون‌خطی ترجیح دهید
- مسیرها را به محدودترین نشستی متصل کنید که برای گردش کار مناسب است
- فقط همان مسیر Webhook مشخصی را که نیاز دارید در معرض دسترس قرار دهید

Plugin اعمال می‌کند:

- احراز هویت با secret مشترک
- محافظ‌های اندازه بدنه درخواست و زمان‌پایان
- محدودسازی نرخ با پنجره ثابت
- محدودسازی درخواست‌های در حال اجرا
- دسترسی TaskFlow مقید به مالک از طریق `api.runtime.tasks.managedFlows.bindSession(...)`

## قالب درخواست

درخواست‌های `POST` را با این موارد ارسال کنید:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` یا `x-openclaw-webhook-secret: <secret>`

نمونه:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## کنش‌های پشتیبانی‌شده

Plugin در حال حاضر این مقادیر JSON `action` را می‌پذیرد:

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

نمونه:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

یک کار فرزند مدیریت‌شده داخل یک TaskFlow مدیریت‌شده موجود ایجاد می‌کند.

زمان‌های اجرای مجاز عبارت‌اند از:

- `subagent`
- `acp`

نمونه:

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

Plugin عمداً فراداده مالک/نشست را از پاسخ‌های Webhook پاک می‌کند.

## مستندات مرتبط

- [SDK زمان اجرای Plugin](/fa/plugins/sdk-runtime)
- [نمای کلی Hookها و Webhookها](/fa/automation/hooks)
- [Webhookهای CLI](/fa/cli/webhooks)
