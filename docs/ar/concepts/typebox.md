---
read_when:
    - تحديث مخططات البروتوكول أو توليد الشيفرة
summary: مخططات TypeBox بوصفها المصدر الوحيد للحقيقة لبروتوكول Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-04-24T07:39:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0496db919ee5c50a5932aa9e51eb54e1f54791bc0a271f39d6fb9e6fe17a2a28
    source_path: concepts/typebox.md
    workflow: 15
---

# TypeBox بوصفها المصدر الوحيد للحقيقة للبروتوكول

آخر تحديث: 2026-01-10

TypeBox هي مكتبة مخططات تعتمد على TypeScript أولًا. نستخدمها لتعريف **بروتوكول Gateway
عبر WebSocket** (المصافحة، والطلب/الاستجابة، وأحداث الخادم). وتدفع هذه المخططات
عملية **التحقق وقت التشغيل**، و**تصدير JSON Schema**، و**توليد Swift code** لتطبيق macOS.
مصدر واحد للحقيقة؛ وكل شيء آخر مُولَّد.

إذا كنت تريد سياق البروتوكول الأعلى مستوى، فابدأ من
[بنية Gateway](/ar/concepts/architecture).

## النموذج الذهني (30 ثانية)

كل رسالة Gateway WS هي أحد ثلاثة إطارات:

- **طلب**: `{ type: "req", id, method, params }`
- **استجابة**: `{ type: "res", id, ok, payload | error }`
- **حدث**: `{ type: "event", event, payload, seq?, stateVersion? }`

**يجب** أن يكون الإطار الأول طلب `connect`. وبعد ذلك، يمكن للعملاء استدعاء
الطرق (مثل `health` و`send` و`chat.send`) والاشتراك في الأحداث (مثل
`presence` و`tick` و`agent`).

تدفق الاتصال (الحد الأدنى):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

الطرق + الأحداث الشائعة:

| الفئة      | أمثلة                                                      | ملاحظات                           |
| ---------- | ---------------------------------------------------------- | --------------------------------- |
| الأساسية   | `connect`, `health`, `status`                              | يجب أن تكون `connect` أولًا       |
| المراسلة   | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | تحتاج التأثيرات الجانبية إلى `idempotencyKey` |
| الدردشة    | `chat.history`, `chat.send`, `chat.abort`                  | يستخدم WebChat هذه                |
| الجلسات    | `sessions.list`, `sessions.patch`, `sessions.delete`       | إدارة الجلسات                     |
| الأتمتة    | `wake`, `cron.list`, `cron.run`, `cron.runs`               | التحكم في wake + Cron             |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | إجراءات Gateway WS + Node         |
| الأحداث    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | دفع من الخادم                     |

يوجد مخزون **الاكتشاف** المعلن والمرجعي في
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## أين توجد المخططات

- المصدر: `src/gateway/protocol/schema.ts`
- أدوات التحقق وقت التشغيل (AJV): `src/gateway/protocol/index.ts`
- سجل الميزات/الاكتشاف المعلن: `src/gateway/server-methods-list.ts`
- مصافحة الخادم + توزيع الطرق: `src/gateway/server.impl.ts`
- عميل Node: `src/gateway/client.ts`
- JSON Schema المُولَّد: `dist/protocol.schema.json`
- نماذج Swift المُولَّدة: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## خط الأنابيب الحالي

- `pnpm protocol:gen`
  - يكتب JSON Schema ‏(draft‑07) إلى `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - يولد نماذج Swift الخاصة بـ gateway
- `pnpm protocol:check`
  - يشغّل كلا المولّدين ويتحقق من أن المخرجات مُلتزَم بها

## كيف تُستخدم المخططات وقت التشغيل

- **على جانب الخادم**: يتم التحقق من كل إطار وارد باستخدام AJV. ولا تقبل المصافحة إلا
  طلب `connect` whose params match `ConnectParams`.
- **على جانب العميل**: يتحقق عميل JS من إطارات الأحداث والاستجابة قبل
  استخدامها.
- **اكتشاف الميزات**: يرسل Gateway قائمة محافظة `features.methods`
  و`features.events` في `hello-ok` من `listGatewayMethods()` و
  `GATEWAY_EVENTS`.
- قائمة الاكتشاف هذه ليست تفريغًا مولدًا لكل مساعد قابل للاستدعاء في
  `coreGatewayHandlers`; إذ إن بعض RPCs المساعدة منفذة في
  `src/gateway/server-methods/*.ts` من دون أن تُعدَّد في قائمة الميزات المعلنة.

## أمثلة على الإطارات

Connect (الرسالة الأولى):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

استجابة Hello-ok:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

طلب + استجابة:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

حدث:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## عميل مصغر (Node.js)

أصغر تدفق مفيد: connect + health.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## مثال عملي: إضافة طريقة من البداية إلى النهاية

مثال: أضف طلب `system.echo` جديدًا يعيد `{ ok: true, text }`.

1. **المخطط (المصدر الوحيد للحقيقة)**

أضف إلى `src/gateway/protocol/schema.ts`:

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

أضف كليهما إلى `ProtocolSchemas` وصدّر الأنواع:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **التحقق**

في `src/gateway/protocol/index.ts`، صدّر أداة تحقق AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **سلوك الخادم**

أضف معالجًا في `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

سجّله في `src/gateway/server-methods.ts` (الذي يدمج `systemHandlers` بالفعل)،
ثم أضف `"system.echo"` إلى مدخل `listGatewayMethods` في
`src/gateway/server-methods-list.ts`.

إذا كانت الطريقة قابلة للاستدعاء بواسطة عملاء operator أو Node، فصنّفها أيضًا في
`src/gateway/method-scopes.ts` بحيث يبقى فرض النطاقات وإعلان الميزات في `hello-ok`
متوافقين.

4. **أعد التوليد**

```bash
pnpm protocol:check
```

5. **الاختبارات + الوثائق**

أضف اختبار خادم في `src/gateway/server.*.test.ts` واذكر الطريقة في الوثائق.

## سلوك توليد Swift code

يولد مولد Swift ما يلي:

- تعداد `GatewayFrame` بحالات `req` و`res` و`event` و`unknown`
- بنيات/تعدادات payload قوية الكتابة
- قيم `ErrorCode` و`GATEWAY_PROTOCOL_VERSION`

تُحفَظ أنواع الإطارات غير المعروفة كحمولات خام للتوافق المستقبلي.

## الإصدار + التوافق

- توجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`; ويرفض الخادم حالات عدم التطابق.
- تحتفظ نماذج Swift بأنواع الإطارات غير المعروفة لتجنب كسر العملاء الأقدم.

## أنماط المخططات والاصطلاحات

- تستخدم معظم الكائنات `additionalProperties: false` لحمولات صارمة.
- يُعد `NonEmptyString` الخيار الافتراضي للمعرّفات وأسماء الطرق/الأحداث.
- يستخدم `GatewayFrame` على المستوى الأعلى **مميزًا** على `type`.
- تتطلب الطرق ذات التأثيرات الجانبية عادةً `idempotencyKey` في params
  (مثال: `send`, `poll`, `agent`, `chat.send`).
- يقبل `agent` قيمة `internalEvents` اختيارية لسياق التنسيق المولّد وقت التشغيل
  (على سبيل المثال تسليم إكمال مهمة وكيل فرعي/Cron); تعامل مع هذا على أنه سطح API داخلي.

## JSON الحي للمخطط

يوجد JSON Schema المُولَّد في المستودع ضمن `dist/protocol.schema.json`. ويكون
الملف الخام المنشور متاحًا عادةً على:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## عندما تغيّر المخططات

1. حدّث مخططات TypeBox.
2. سجّل الطريقة/الحدث في `src/gateway/server-methods-list.ts`.
3. حدّث `src/gateway/method-scopes.ts` عندما يحتاج RPC الجديد إلى تصنيف نطاق operator أو
   Node.
4. شغّل `pnpm protocol:check`.
5. التزم بالمخطط المُعاد توليده + نماذج Swift.

## ذو صلة

- [بروتوكول المخرجات الغنية](/ar/reference/rich-output-protocol)
- [محولات RPC](/ar/reference/rpc)
