---
read_when:
    - تحديث مخططات البروتوكول أو توليد الكود
summary: مخططات TypeBox باعتبارها المصدر الوحيد للحقيقة لبروتوكول Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T07:51:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox هي مكتبة مخططات مصممة أولا لـ TypeScript. نستخدمها لتعريف **بروتوكول Gateway
WebSocket** (المصافحة، الطلب/الاستجابة، أحداث الخادم). تقود هذه المخططات
**التحقق في وقت التشغيل**، و**تصدير JSON Schema**، و**توليد كود Swift** لتطبيق
macOS. مصدر حقيقة واحد؛ وكل ما عداه مولد.

إذا أردت سياق البروتوكول الأعلى مستوى، فابدأ من
[معمارية Gateway](/ar/concepts/architecture).

## النموذج الذهني (30 ثانية)

كل رسالة Gateway WS هي أحد ثلاثة إطارات:

- **طلب**: `{ type: "req", id, method, params }`
- **استجابة**: `{ type: "res", id, ok, payload | error }`
- **حدث**: `{ type: "event", event, payload, seq?, stateVersion? }`

يجب أن يكون الإطار الأول **حتما** طلب `connect`. بعد ذلك، يمكن للعملاء استدعاء
الطرق (مثل `health`، و`send`، و`chat.send`) والاشتراك في الأحداث (مثل
`presence`، و`tick`، و`agent`).

تدفق الاتصال (الحد الأدنى):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

الطرق والأحداث الشائعة:

| الفئة | أمثلة | ملاحظات |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| الأساس | `connect`, `health`, `status` | يجب أن يكون `connect` أولا |
| المراسلة | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | تحتاج الآثار الجانبية إلى `idempotencyKey` |
| الدردشة | `chat.history`, `chat.send`, `chat.abort` | يستخدم WebChat هذه |
| الجلسات | `sessions.list`, `sessions.patch`, `sessions.delete` | إدارة الجلسات |
| الأتمتة | `wake`, `cron.list`, `cron.run`, `cron.runs` | التحكم في wake وcron |
| العقد | `node.list`, `node.invoke`, `node.pair.*` | Gateway WS + إجراءات العقد |
| الأحداث | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | دفع من الخادم |

مخزون **الاكتشاف** المعلن والموثوق موجود في
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## أين توجد المخططات

- المصدر: `src/gateway/protocol/schema.ts`
- أدوات التحقق في وقت التشغيل (AJV): `src/gateway/protocol/index.ts`
- سجل الميزات/الاكتشاف المعلن: `src/gateway/server-methods-list.ts`
- مصافحة الخادم + توزيع الطرق: `src/gateway/server.impl.ts`
- عميل Node: `src/gateway/client.ts`
- JSON Schema المولد: `dist/protocol.schema.json`
- نماذج Swift المولدة: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## المسار الحالي

- `pnpm protocol:gen`
  - يكتب JSON Schema (draft-07) إلى `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - يولد نماذج Swift الخاصة بـ Gateway
- `pnpm protocol:check`
  - يشغل كلا المولدين ويتحقق من أن المخرجات ملتزم بها

## كيف تستخدم المخططات في وقت التشغيل

- **جانب الخادم**: يتم التحقق من كل إطار وارد باستخدام AJV. لا تقبل المصافحة إلا
  طلب `connect` تطابق معاملاته `ConnectParams`.
- **جانب العميل**: يتحقق عميل JS من إطارات الأحداث والاستجابات قبل
  استخدامها.
- **اكتشاف الميزات**: يرسل Gateway قائمة محافظة من `features.methods`
  و`features.events` ضمن `hello-ok` من `listGatewayMethods()` و
  `GATEWAY_EVENTS`.
- قائمة الاكتشاف هذه ليست تفريغا مولدا لكل مساعد قابل للاستدعاء في
  `coreGatewayHandlers`؛ بعض مساعدات RPC منفذة في
  `src/gateway/server-methods/*.ts` من دون إدراجها في قائمة
  الميزات المعلنة.

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

## عميل بسيط (Node.js)

أصغر تدفق مفيد: الاتصال + الصحة.

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

مثال: أضف طلب `system.echo` جديدا يعيد `{ ok: true, text }`.

1. **المخطط (مصدر الحقيقة)**

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

أضف الاثنين إلى `ProtocolSchemas` وصدّر الأنواع:

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

أضف معالجا في `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

سجله في `src/gateway/server-methods.ts` (يدمج `systemHandlers` بالفعل)،
ثم أضف `"system.echo"` إلى دخل `listGatewayMethods` في
`src/gateway/server-methods-list.ts`.

إذا كانت الطريقة قابلة للاستدعاء من عملاء المشغل أو العقد، فصنفها أيضا في
`src/gateway/method-scopes.ts` حتى يظل فرض النطاق وإعلان ميزات `hello-ok`
متوافقين.

4. **إعادة التوليد**

```bash
pnpm protocol:check
```

5. **الاختبارات + المستندات**

أضف اختبار خادم في `src/gateway/server.*.test.ts` واذكر الطريقة في المستندات.

## سلوك توليد كود Swift

ينشئ مولد Swift ما يلي:

- تعداد `GatewayFrame` مع حالات `req`، و`res`، و`event`، و`unknown`
- بنيات/تعدادات payload ذات أنواع قوية
- قيم `ErrorCode` و`GATEWAY_PROTOCOL_VERSION`

تحتفظ أنواع الإطارات غير المعروفة كحمولات خام من أجل التوافق المستقبلي.

## تعيين الإصدارات + التوافق

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/schema.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ ويرفض الخادم حالات عدم التطابق.
- تحتفظ نماذج Swift بأنواع الإطارات غير المعروفة لتجنب كسر العملاء الأقدم.

## أنماط المخططات والاصطلاحات

- تستخدم معظم الكائنات `additionalProperties: false` للحمولات الصارمة.
- `NonEmptyString` هو الافتراضي للمعرفات وأسماء الطرق/الأحداث.
- يستخدم `GatewayFrame` في المستوى الأعلى **مميزا** على `type`.
- تتطلب الطرق ذات الآثار الجانبية عادة `idempotencyKey` ضمن المعاملات
  (مثال: `send`، و`poll`، و`agent`، و`chat.send`).
- يقبل `agent` اختياريا `internalEvents` لسياق التنسيق المولد في وقت التشغيل
  (مثل تسليم إكمال مهمة الوكيل الفرعي/cron)؛ تعامل مع هذا كسطح API داخلي.

## JSON Schema المباشر

يوجد JSON Schema المولد في المستودع عند `dist/protocol.schema.json`. يكون
الملف الخام المنشور متاحا عادة عند:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## عند تغيير المخططات

1. حدّث مخططات TypeBox.
2. سجل الطريقة/الحدث في `src/gateway/server-methods-list.ts`.
3. حدّث `src/gateway/method-scopes.ts` عندما يحتاج RPC الجديد إلى تصنيف نطاق المشغل أو
   العقدة.
4. شغل `pnpm protocol:check`.
5. التزم بالمخطط المعاد توليده + نماذج Swift.

## ذو صلة

- [بروتوكول المخرجات الغنية](/ar/reference/rich-output-protocol)
- [محولات RPC](/ar/reference/rpc)
