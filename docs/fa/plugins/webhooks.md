---
read_when:
    - می‌خواهید TaskFlowها را از یک سامانهٔ خارجی راه‌اندازی یا هدایت کنید
    - شما در حال پیکربندی Plugin وب‌هوک‌های همراه هستید
summary: 'Plugin وب‌هوک‌ها: ورودی احراز هویت‌شدهٔ TaskFlow برای خودکارسازی خارجی مورد اعتماد'
title: Plugin وب‌هوک‌ها
x-i18n:
    generated_at: "2026-07-12T10:41:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks مسیرهای HTTP احراز هویت‌شده‌ای اضافه می‌کند تا یک سامانه خارجی مورد اعتماد
(Zapier، n8n، یک وظیفه CI یا یک سرویس داخلی) بتواند TaskFlowهای مدیریت‌شده
OpenClaw را از طریق HTTP ایجاد و هدایت کند، بدون آنکه نیازی به نوشتن یک Plugin سفارشی باشد.

این Plugin درون فرایند Gateway اجرا می‌شود. برای یک Gateway راه‌دور، آن را روی
همان میزبان نصب و پیکربندی کنید، سپس Gateway را راه‌اندازی مجدد کنید. این Plugin
به‌صورت پیش‌فرض هیچ مسیر پیکربندی‌شده‌ای ندارد؛ بنابراین تا زمانی که دست‌کم یک
مسیر اضافه نکنید، هیچ عملی انجام نمی‌دهد.

## پیکربندی مسیرها

پیکربندی را در `plugins.entries.webhooks.config` تنظیم کنید:

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

| فیلد           | الزامی | پیش‌فرض                      | توضیحات                                                    |
| -------------- | ------ | ----------------------------- | ---------------------------------------------------------- |
| `enabled`      | خیر    | `true`                        |                                                            |
| `path`         | خیر    | `/plugins/webhooks/<routeId>` | باید در میان مسیرها منحصربه‌فرد باشد.                      |
| `sessionKey`   | بله    | -                             | نشست مالک TaskFlowهای متصل.                                |
| `secret`       | بله    | -                             | رشته ساده یا یک SecretRef (در ادامه).                      |
| `controllerId` | خیر    | `webhooks/<routeId>`          | به‌عنوان کنترل‌گر پیش‌فرض `create_flow` استفاده می‌شود.    |
| `description`  | خیر    | -                             | فقط یادداشتی برای اپراتور.                                 |

`secret` یک رشته ساده یا یک SecretRef را می‌پذیرد: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

هر مسیر پیکربندی‌شده، صرف‌نظر از اینکه راز آن در حال حاضر قابل بازیابی باشد یا
نه، هنگام راه‌اندازی ثبت می‌شود. راز غیرقابل‌بازیابی مسیر را غیرفعال یا نادیده
نمی‌گیرد؛ درخواست‌های آن تا زمانی که راز قابل بازیابی شود، در احراز هویت شکست
می‌خورند (`401`). مقادیر SecretRef در هر درخواست دوباره بازیابی می‌شوند؛ بنابراین
چرخش راز زیربنایی (متغیر محیطی، فایل یا خروجی exec) بدون راه‌اندازی مجدد Gateway
اعمال می‌شود.

## مدل امنیتی

هر مسیر با اختیارات TaskFlow مربوط به `sessionKey` پیکربندی‌شده خود عمل می‌کند:
می‌تواند هر TaskFlow متعلق به آن نشست را بررسی و تغییر دهد. دسترسی به TaskFlow
همیشه از طریق `api.runtime.tasks.managedFlows.bindSession(...)` انجام می‌شود؛
بنابراین یک مسیر هرگز نمی‌تواند خارج از نشست متصل خود عمل کند. برای محدود کردن
دامنه اثر:

- برای هر مسیر از یک راز قوی و منحصربه‌فرد استفاده کنید.
- SecretRef را به راز متن ساده درون‌خطی ترجیح دهید.
- مسیرها را به محدودترین نشستی متصل کنید که برای گردش کار مناسب است.
- فقط مسیر Webhook مشخصی را که نیاز دارید در دسترس قرار دهید.

ترتیب پردازش درخواست برای هر مسیر: بررسی متد HTTP (فقط `POST`) و
`Content-Type: application/json`، سپس محدودسازی نرخ با پنجره ثابت (۱۲۰ درخواست
در هر پنجره ۶۰ثانیه‌ای برای هر کلید مسیر+IP کلاینت، با حداکثر ۴٬۰۹۶ کلید
ردیابی‌شده)، سپس محدودسازی درخواست‌های در حال پردازش (۸ درخواست هم‌زمان برای هر
کلید، با حداکثر ۴٬۰۹۶ کلید ردیابی‌شده)، سپس احراز هویت با راز مشترک و در پایان
خواندن بدنه JSON با محدودیت ۲۵۶ کیلوبایت / ۱۵ ثانیه. درخواست‌هایی که در بررسی
زودتری شکست بخورند، هرگز به مراحل بعدی نمی‌رسند.

## قالب درخواست

درخواست‌های `POST` را با `Content-Type: application/json` و یکی از
`Authorization: Bearer <secret>` یا `x-openclaw-webhook-secret: <secret>` ارسال کنید:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## عملیات پشتیبانی‌شده

| عملیات            | هدف                                                                    |
| ----------------- | ---------------------------------------------------------------------- |
| `create_flow`      | ایجاد یک TaskFlow مدیریت‌شده برای نشست مسیر.                           |
| `get_flow`         | دریافت یک TaskFlow با شناسه.                                           |
| `list_flows`       | فهرست کردن TaskFlowهای نشست مسیر.                                      |
| `find_latest_flow` | دریافت TaskFlowی که اخیراً به‌روزرسانی شده است.                        |
| `resolve_flow`     | یافتن یک TaskFlow با توکن مات.                                         |
| `get_task_summary` | دریافت خلاصه وظیفه یک TaskFlow.                                        |
| `set_waiting`      | علامت‌گذاری TaskFlow به‌عنوان منتظر، همراه با داده اختیاری وضعیت/انتظار. |
| `resume_flow`      | ازسرگیری یک TaskFlow منتظر/مسدودشده.                                   |
| `finish_flow`      | علامت‌گذاری TaskFlow به‌عنوان پایان‌یافته.                              |
| `fail_flow`        | علامت‌گذاری TaskFlow به‌عنوان ناموفق.                                  |
| `request_cancel`   | درخواست لغو مشارکتی.                                                   |
| `cancel_flow`      | لغو یک TaskFlow (اگر فرزندان همچنان فعال باشند، ممکن است `202` برگرداند). |
| `run_task`         | ایجاد یک وظیفه فرزند مدیریت‌شده درون یک TaskFlow موجود.                 |

عملیات تغییر‌دهنده (`set_waiting`، `resume_flow`، `finish_flow`، `fail_flow` و
`request_cancel`) برای هم‌زمانی خوش‌بینانه به `flowId` و `expectedRevision`
نیاز دارند؛ بازبینی قدیمی، `409 revision_conflict` برمی‌گرداند.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

مقادیر مجاز `runtime` عبارت‌اند از: `subagent` و `acp`. مقادیر `startedAt`،
`lastEventAt` و `progressSummary` فقط زمانی معتبرند که `status` برابر با
`"running"` باشد؛ ارسال آن‌ها با هر وضعیت دیگری، `400 invalid_request`
برمی‌گرداند.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## ساختار پاسخ

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

نماهای گردش کار و وظیفه هرگز فراداده مالک/نشست را شامل نمی‌شوند؛ بنابراین
پاسخ‌ها نمی‌توانند `sessionKey` متصل به مسیر را افشا کنند. مقادیر `code` شامل
`not_found`، `not_managed`، `revision_conflict`، `persist_failed`،
`cancel_requested`، `cancel_pending`، `terminal`، `invalid_request`،
`request_rejected` و کدهای جایگزین مختص هر عملیات (`mutation_rejected`،
`create_rejected`، `task_not_created` و `cancel_rejected`) هستند؛ این کدهای
جایگزین زمانی استفاده می‌شوند که یک تغییر به دلیلی رد شود که کدهای نام‌گذاری‌شده
بالا آن را پوشش نمی‌دهند.

## مرتبط

- [قلاب‌ها](/fa/automation/hooks) - قلاب‌های داخلی رویدادمحور در مقایسه با این پل TaskFlow مبتنی بر HTTP
- [Webhookهای Gateway (پیکربندی `hooks.*`)](/fa/automation/cron-jobs#webhooks) - قابلیت جداگانه نقطه پایانی عمومی HTTP در Gateway؛ با مسیرهای این Plugin یکسان نیست
- [SDK زمان اجرای Plugin](/fa/plugins/sdk-runtime)
- [Webhookهای CLI](/fa/cli/webhooks)
