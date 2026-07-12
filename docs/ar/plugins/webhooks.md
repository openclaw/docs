---
read_when:
    - تريد تشغيل TaskFlows أو التحكم فيها من نظام خارجي
    - أنت تقوم بإعداد Plugin خطافات الويب المضمّن
summary: 'Plugin Webhooks: إدخال TaskFlow مُصادَق عليه للأتمتة الخارجية الموثوقة'
title: Plugin خطافات الويب
x-i18n:
    generated_at: "2026-07-12T06:25:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

تضيف إضافة Webhooks مسارات HTTP مصادقًا عليها بحيث يمكن لنظام خارجي موثوق
(Zapier أو n8n أو مهمة CI أو خدمة داخلية) إنشاء TaskFlows مُدارة في OpenClaw
والتحكم فيها عبر HTTP، من دون كتابة إضافة مخصصة.

تعمل الإضافة داخل عملية Gateway. إذا كان Gateway بعيدًا، فثبّتها واضبطها على
ذلك المضيف، ثم أعد تشغيل Gateway. تأتي من دون أي مسارات مضبوطة، لذا لا تنفّذ
شيئًا حتى تضيف مسارًا واحدًا على الأقل.

## ضبط المسارات

عيّن الإعدادات ضمن `plugins.entries.webhooks.config`:

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

| الحقل          | مطلوب | القيمة الافتراضية             | ملاحظات                                      |
| -------------- | ----- | ----------------------------- | -------------------------------------------- |
| `enabled`      | لا    | `true`                        |                                              |
| `path`         | لا    | `/plugins/webhooks/<routeId>` | يجب أن يكون فريدًا بين المسارات.             |
| `sessionKey`   | نعم   | -                             | الجلسة المالكة لـ TaskFlows المرتبطة.        |
| `secret`       | نعم   | -                             | سلسلة نصية عادية أو SecretRef (أدناه).       |
| `controllerId` | لا    | `webhooks/<routeId>`          | يُستخدم كوحدة تحكم `create_flow` الافتراضية. |
| `description`  | لا    | -                             | ملاحظة للمشغّل فقط.                           |

يقبل `secret` سلسلة نصية عادية أو SecretRef: ‏`{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

يُسجَّل كل مسار مضبوط عند بدء التشغيل بغض النظر عما إذا كان سرّه قابلًا للحل
حاليًا. لا يؤدي تعذّر حل السر إلى تعطيل المسار أو تخطيه؛ إذ تفشل مصادقة
الطلبات إليه (`401`) إلى أن يصبح حل السر ممكنًا. يُعاد حل قيم SecretRef مع كل
طلب، لذا يسري تدوير السر الأساسي (متغير بيئة أو ملف أو مخرجات تنفيذ) من دون
إعادة تشغيل Gateway.

## نموذج الأمان

يعمل كل مسار بصلاحيات TaskFlow الخاصة بـ `sessionKey` المضبوط له: ويمكنه فحص
أي TaskFlow تملكها تلك الجلسة وتعديلها. يمر الوصول إلى TaskFlow دائمًا عبر
`api.runtime.tasks.managedFlows.bindSession(...)`، لذلك لا يمكن للمسار مطلقًا
العمل خارج جلسته المرتبطة. للحد من نطاق الضرر:

- استخدم سرًا قويًا وفريدًا لكل مسار.
- فضّل SecretRef على سر نصي صريح مضمن.
- اربط المسارات بأضيق جلسة تلائم سير العمل.
- اكشف فقط مسار Webhook المحدد الذي تحتاج إليه.

ترتيب معالجة الطلبات لكل مسار: التحقق من طريقة HTTP (`POST` فقط) ومن
`Content-Type: application/json`، ثم تحديد المعدل بنافذة ثابتة (120 طلبًا لكل
نافذة مدتها 60 ثانية لكل مفتاح مؤلف من المسار وعنوان IP للعميل، مع تتبع ما يصل
إلى 4,096 مفتاحًا)، ثم تحديد الطلبات قيد التنفيذ (8 طلبات متزامنة لكل مفتاح،
مع تتبع ما يصل إلى 4,096 مفتاحًا)، ثم المصادقة بالسر المشترك، ثم قراءة نص JSON
بحد أقصى 256 كيلوبايت وخلال 15 ثانية. الطلبات التي تفشل في تحقق مبكر لا تصل
مطلقًا إلى عمليات التحقق اللاحقة.

## تنسيق الطلب

أرسل طلبات `POST` مع `Content-Type: application/json` وأحد الترويسَتين
`Authorization: Bearer <secret>` أو `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## الإجراءات المدعومة

| الإجراء            | الغرض                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| `create_flow`      | إنشاء TaskFlow مُدارة لجلسة المسار.                                      |
| `get_flow`         | جلب TaskFlow واحدة حسب المعرّف.                                          |
| `list_flows`       | سرد TaskFlows الخاصة بجلسة المسار.                                       |
| `find_latest_flow` | جلب أحدث TaskFlow تحديثًا.                                               |
| `resolve_flow`     | حل TaskFlow بواسطة رمز مبهم.                                             |
| `get_task_summary` | جلب ملخص المهمة لـ TaskFlow.                                             |
| `set_waiting`      | تعليم TaskFlow بأنها قيد الانتظار، مع بيانات اختيارية للحالة/الانتظار.  |
| `resume_flow`      | استئناف TaskFlow قيد الانتظار/محظورة.                                    |
| `finish_flow`      | تعليم TaskFlow بأنها منتهية.                                             |
| `fail_flow`        | تعليم TaskFlow بأنها فشلت.                                               |
| `request_cancel`   | طلب إلغاء تعاوني.                                                         |
| `cancel_flow`      | إلغاء TaskFlow (قد يعيد `202` إذا ظلت المهام الفرعية نشطة).              |
| `run_task`         | إنشاء مهمة فرعية مُدارة داخل TaskFlow موجودة.                            |

تتطلب إجراءات التعديل (`set_waiting` و`resume_flow` و`finish_flow` و`fail_flow`
و`request_cancel`) الحقلين `flowId` و`expectedRevision` للتحكم المتفائل في
التزامن؛ وتعيد المراجعة القديمة `409 revision_conflict`.

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

قيم `runtime` المسموح بها: `subagent` و`acp`. لا تكون `startedAt` و`lastEventAt`
و`progressSummary` صالحة إلا عندما تكون `status` هي `"running"`؛ ويؤدي إرسالها
مع أي حالة أخرى إلى إرجاع `400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## بنية الاستجابة

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

لا تتضمن عروض التدفقات والمهام مطلقًا بيانات وصفية عن المالك/الجلسة، ولذلك لا
يمكن للاستجابات تسريب `sessionKey` المرتبط بالمسار. تتضمن قيم `code`:
`not_found` و`not_managed` و`revision_conflict` و`persist_failed`
و`cancel_requested` و`cancel_pending` و`terminal` و`invalid_request`
و`request_rejected`، بالإضافة إلى رموز احتياطية خاصة بالإجراء
(`mutation_rejected` و`create_rejected` و`task_not_created`
و`cancel_rejected`) عندما يُرفض تعديل لسبب لا تغطيه الرموز المسماة أعلاه.

## ذو صلة

- [الخطافات](/ar/automation/hooks) - الخطافات الداخلية المستندة إلى الأحداث مقارنةً بجسر TaskFlow هذا المستند إلى HTTP
- [Webhooks الخاصة بـ Gateway (إعداد `hooks.*`)](/ar/automation/cron-jobs#webhooks) - ميزة منفصلة لنقطة نهاية HTTP عامة في Gateway؛ وليست مماثلة لمسارات هذه الإضافة
- [حزمة SDK لوقت تشغيل الإضافة](/ar/plugins/sdk-runtime)
- [Webhooks في CLI](/ar/cli/webhooks)
