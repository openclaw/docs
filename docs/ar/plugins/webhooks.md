---
read_when:
    - تريد تشغيل TaskFlows أو التحكم فيها من نظام خارجي
    - أنت تقوم بتهيئة Plugin Webhooks المضمّن
summary: 'Plugin Webhooks: نقطة دخول TaskFlow مصادَق عليها للأتمتة الخارجية الموثوقة'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-05-06T18:02:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

يضيف Plugin Webhooks مسارات HTTP موثقة تربط الأتمتة الخارجية بـ OpenClaw TaskFlows.

استخدمه عندما تريد من نظام موثوق مثل Zapier أو n8n أو مهمة CI أو خدمة داخلية إنشاء TaskFlows مُدارة وتشغيلها دون كتابة Plugin مخصص أولاً.

## أين يعمل

يعمل Plugin Webhooks داخل عملية Gateway.

إذا كان Gateway لديك يعمل على جهاز آخر، فثبّت Plugin واضبطه على مضيف Gateway ذلك، ثم أعد تشغيل Gateway.

## ضبط المسارات

اضبط التكوين ضمن `plugins.entries.webhooks.config`:

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

حقول المسار:

- `enabled`: اختياري، والقيمة الافتراضية هي `true`
- `path`: اختياري، والقيمة الافتراضية هي `/plugins/webhooks/<routeId>`
- `sessionKey`: الجلسة المطلوبة التي تملك TaskFlows المرتبطة
- `secret`: السر المشترك المطلوب أو SecretRef
- `controllerId`: معرّف المتحكم الاختياري للتدفقات المُدارة المنشأة
- `description`: ملاحظة اختيارية للمشغّل

مدخلات `secret` المدعومة:

- سلسلة نصية عادية
- SecretRef مع `source: "env" | "file" | "exec"`

إذا تعذّر على مسار يعتمد على سر حلّ سره عند بدء التشغيل، يتخطى Plugin ذلك المسار ويسجّل تحذيراً بدلاً من كشف نقطة نهاية معطلة.

## نموذج الأمان

كل مسار موثوق به للتصرف بصلاحية TaskFlow الخاصة بـ `sessionKey` المضبوطة له.

هذا يعني أن المسار يستطيع فحص وتعديل TaskFlows التي تملكها تلك الجلسة، لذلك ينبغي عليك:

- استخدام سر قوي وفريد لكل مسار
- تفضيل مراجع الأسرار على الأسرار النصية الصريحة المضمنة
- ربط المسارات بأضيق جلسة تناسب سير العمل
- كشف مسار Webhook المحدد الذي تحتاج إليه فقط

يطبّق Plugin ما يلي:

- مصادقة بالسر المشترك
- ضوابط لحجم نص الطلب والمهلة
- تحديد معدل بنافذة ثابتة
- تحديد الطلبات قيد التنفيذ
- وصول TaskFlow مقيّد بالمالك عبر `api.runtime.tasks.managedFlows.bindSession(...)`

## صيغة الطلب

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

يقبل Plugin حالياً قيم `action` التالية بصيغة JSON:

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

ينشئ TaskFlow مُداراً للجلسة المرتبطة بالمسار.

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

ينشئ مهمة فرعية مُدارة داخل TaskFlow مُدار موجود.

أزمنة التشغيل المسموح بها هي:

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

تعيد الطلبات المرفوضة:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

يزيل Plugin عمداً بيانات تعريف المالك/الجلسة من استجابات Webhook.

## الوثائق ذات الصلة

- [Plugin runtime SDK](/ar/plugins/sdk-runtime)
- [نظرة عامة على الخطافات وwebhooks](/ar/automation/hooks)
- [CLI webhooks](/ar/cli/webhooks)
