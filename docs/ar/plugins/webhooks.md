---
read_when:
    - تريد تحفيز TaskFlows أو قيادتها من نظام خارجي
    - أنت تهيّئ Plugin Webhooks المضمّنة
summary: 'Plugin Webhooks: إدخال TaskFlow موثّق لأتمتة خارجية موثوقة'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-04-24T07:57:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Plugin Webhooks

تضيف Plugin Webhooks مسارات HTTP موثّقة تربط الأتمتة الخارجية
بـ TaskFlows في OpenClaw.

استخدمها عندما تريد لنظام موثوق مثل Zapier أو n8n أو وظيفة CI أو
خدمة داخلية أن ينشئ TaskFlows مُدارة ويقودها من دون كتابة Plugin مخصصة
أولًا.

## مكان التشغيل

تعمل Plugin Webhooks داخل عملية Gateway.

إذا كانت Gateway تعمل على جهاز آخر، فقم بتثبيت Plugin وتهيئتها على
مضيف Gateway ذاك، ثم أعد تشغيل Gateway.

## تهيئة المسارات

اضبط التهيئة تحت `plugins.entries.webhooks.config`:

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
              description: "جسر TaskFlow لـ Zapier",
            },
          },
        },
      },
    },
  },
}
```

حقول المسار:

- `enabled`: اختياري، والافتراضي `true`
- `path`: اختياري، والافتراضي `/plugins/webhooks/<routeId>`
- `sessionKey`: الجلسة المطلوبة التي تملك TaskFlows المرتبطة
- `secret`: السر المشترك المطلوب أو SecretRef
- `controllerId`: معرّف متحكم اختياري للتدفقات المُدارة التي تم إنشاؤها
- `description`: ملاحظة اختيارية للمشغّل

مدخلات `secret` المدعومة:

- سلسلة عادية
- SecretRef مع `source: "env" | "file" | "exec"`

إذا تعذر على مسار مدعوم بسر أن يحل سره عند بدء التشغيل، فإن Plugin
تتخطى ذلك المسار وتسجل تحذيرًا بدلًا من كشف نقطة نهاية معطلة.

## نموذج الأمان

يُوثق بكل مسار لكي يتصرف بسلطة TaskFlow الخاصة بـ
`sessionKey` المهيأة له.

وهذا يعني أن المسار يمكنه فحص وتعديل TaskFlows المملوكة لتلك الجلسة، لذلك
يجب عليك:

- استخدام سر قوي وفريد لكل مسار
- تفضيل مراجع الأسرار على الأسرار النصية الصريحة المضمنة
- ربط المسارات بأضيق جلسة تناسب سير العمل
- كشف مسار Webhook المحدد الذي تحتاجه فقط

تطبق Plugin ما يلي:

- مصادقة السر المشترك
- حدود حجم جسم الطلب وحمايات المهلة
- تحديد المعدل بنافذة ثابتة
- تحديد الطلبات الجارية
- وصول TaskFlow مقيّد بالمالك عبر `api.runtime.taskFlow.bindSession(...)`

## تنسيق الطلب

أرسل طلبات `POST` مع:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` أو `x-openclaw-webhook-secret: <secret>`

مثال:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## الإجراءات المدعومة

تقبل Plugin حاليًا قيم `action` التالية في JSON:

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

تنشئ TaskFlow مُدارة لجلسة المسار المرتبطة.

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

تنشئ مهمة فرعية مُدارة داخل TaskFlow مُدارة موجودة.

أوقات التشغيل المسموح بها هي:

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

## شكل الاستجابة

تعيد الاستجابات الناجحة:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

أما الطلبات المرفوضة فتعيد:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "لم يتم العثور على TaskFlow.",
  "result": {}
}
```

وتقوم Plugin عمدًا بتنقية بيانات المالك/الجلسة الوصفية من استجابات Webhook.

## وثائق ذات صلة

- [Plugin runtime SDK](/ar/plugins/sdk-runtime)
- [نظرة عامة على Hooks وWebhooks](/ar/automation/hooks)
- [CLI webhooks](/ar/cli/webhooks)
