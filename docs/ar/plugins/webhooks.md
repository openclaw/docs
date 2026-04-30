---
read_when:
    - تريد تشغيل TaskFlows أو التحكم فيها من نظام خارجي
    - أنت تقوم بتكوين Plugin خطافات الويب المضمّن
summary: 'Plugin Webhooks: مدخل TaskFlow مُصادَق عليه للأتمتة الخارجية الموثوقة'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-04-30T08:19:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhooks (Plugin)

يضيف Plugin Webhooks مسارات HTTP مصادَقًا عليها تربط الأتمتة الخارجية
بـ OpenClaw TaskFlows.

استخدمه عندما تريد أن ينشئ نظام موثوق مثل Zapier أو n8n أو مهمة CI أو خدمة
داخلية TaskFlows مُدارة ويوجهها دون كتابة Plugin مخصص أولًا.

## مكان تشغيله

يعمل Plugin Webhooks داخل عملية Gateway.

إذا كان Gateway لديك يعمل على جهاز آخر، فثبّت Plugin وهيّئه على مضيف
Gateway ذلك، ثم أعد تشغيل Gateway.

## تهيئة المسارات

عيّن الإعداد ضمن `plugins.entries.webhooks.config`:

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
- `secret`: السر المشترك أو SecretRef المطلوب
- `controllerId`: معرّف وحدة التحكم الاختياري للتدفقات المُدارة المنشأة
- `description`: ملاحظة اختيارية للمشغّل

مدخلات `secret` المدعومة:

- سلسلة نصية عادية
- SecretRef مع `source: "env" | "file" | "exec"`

إذا تعذر على مسار مدعوم بسر حل السر الخاص به عند بدء التشغيل، يتجاوز
Plugin ذلك المسار ويسجل تحذيرًا بدلًا من كشف نقطة نهاية معطلة.

## نموذج الأمان

كل مسار موثوق به للتصرف بصلاحية TaskFlow الخاصة بـ `sessionKey` المهيأة له.

يعني هذا أن المسار يمكنه فحص TaskFlows المملوكة لتلك الجلسة وتعديلها، لذلك
ينبغي عليك:

- استخدام سر قوي وفريد لكل مسار
- تفضيل مراجع الأسرار على الأسرار النصية المضمنة
- ربط المسارات بأضيق جلسة تناسب سير العمل
- كشف مسار Webhook المحدد الذي تحتاجه فقط

يطبق Plugin ما يلي:

- مصادقة بالسر المشترك
- ضوابط لحجم جسم الطلب والمهلة الزمنية
- تحديد معدل بنافذة ثابتة
- تحديد الطلبات قيد التنفيذ
- وصول TaskFlow مقيّد بالمالك عبر `api.runtime.tasks.managedFlows.bindSession(...)`

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

يقبل Plugin حاليًا قيم `action` بصيغة JSON التالية:

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

ينشئ TaskFlow مُدارًا للجلسة المرتبطة بالمسار.

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

بيئات التشغيل المسموح بها هي:

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

يزيل Plugin عمدًا بيانات تعريف المالك/الجلسة من استجابات Webhook.

## المستندات ذات الصلة

- [Plugin runtime SDK](/ar/plugins/sdk-runtime)
- [نظرة عامة على Hooks وWebhooks](/ar/automation/hooks)
- [Webhooks في CLI](/ar/cli/webhooks)
