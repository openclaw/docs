---
read_when:
    - تحديث مخططات البروتوكول أو توليد الشيفرة
summary: مخططات TypeBox باعتبارها مصدر الحقيقة الوحيد لبروتوكول Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-11T20:30:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecc9a69ac6d4ac101a4a6f34e44acfbe952dce0f90d178d4f8559191fb92c3b4
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox هي مكتبة مخططات موجهة لـ TypeScript. نستخدمها لتعريف **بروتوكول WebSocket الخاص بـ Gateway** (المصافحة، الطلب/الاستجابة، أحداث الخادم). تقود هذه المخططات **التحقق في وقت التشغيل**، و**تصدير JSON Schema**، و**توليد كود Swift** لتطبيق macOS. مصدر حقيقة واحد؛ وكل شيء آخر يتم توليده.

إذا أردت سياق البروتوكول الأعلى مستوى، فابدأ بـ
[بنية Gateway](/ar/concepts/architecture).

## النموذج الذهني (30 ثانية)

كل رسالة Gateway WS هي أحد ثلاثة إطارات:

- **طلب**: `{ type: "req", id, method, params }`
- **استجابة**: `{ type: "res", id, ok, payload | error }`
- **حدث**: `{ type: "event", event, payload, seq?, stateVersion? }`

يجب أن يكون الإطار الأول **طلب** `connect`. بعد ذلك، يمكن للعملاء استدعاء
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

الطرق + الأحداث الشائعة:

| الفئة | أمثلة | ملاحظات |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| النواة | `connect`, `health`, `status` | يجب أن يكون `connect` أولًا |
| المراسلة | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | الآثار الجانبية تحتاج إلى `idempotencyKey` |
| الدردشة | `chat.history`, `chat.send`, `chat.abort` | يستخدم WebChat هذه |
| الجلسات | `sessions.list`, `sessions.patch`, `sessions.delete` | إدارة الجلسات |
| الأتمتة | `wake`, `cron.list`, `cron.run`, `cron.runs` | التحكم في wake + cron |
| العقد | `node.list`, `node.invoke`, `node.pair.*` | Gateway WS + إجراءات العقد |
| الأحداث | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | دفع الخادم |

تعيش قائمة **الاكتشاف** المعلنة والموثوقة في
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## مكان وجود المخططات

- المصدر: `src/gateway/protocol/schema.ts`
- مدققات وقت التشغيل (AJV): `src/gateway/protocol/index.ts`
- سجل الميزات/الاكتشاف المعلن: `src/gateway/server-methods-list.ts`
- مصافحة الخادم + توجيه الطرق: `src/gateway/server.impl.ts`
- عميل Node: `src/gateway/client.ts`
- JSON Schema المولدة: `dist/protocol.schema.json`
- نماذج Swift المولدة: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## المسار الحالي

- `pnpm protocol:gen`
  - يكتب JSON Schema (draft-07) إلى `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - يولد نماذج Swift الخاصة بـ Gateway
- `pnpm protocol:check`
  - يشغل كلا المولدين ويتحقق من أن الناتج ملتزم به

## كيف تُستخدم المخططات في وقت التشغيل

- **جانب الخادم**: يتم التحقق من كل إطار وارد باستخدام AJV. لا تقبل المصافحة إلا
  طلب `connect` تطابق معاملاته `ConnectParams`.
- **جانب العميل**: يتحقق عميل JS من إطارات الأحداث والاستجابات قبل
  استخدامها.
- **اكتشاف الميزات**: يرسل Gateway قائمة محافظة من `features.methods`
  و`features.events` في `hello-ok` من `listGatewayMethods()` و
  `GATEWAY_EVENTS`.
- قائمة الاكتشاف هذه ليست تفريغًا مولدًا لكل مساعد قابل للاستدعاء في
  `coreGatewayHandlers`؛ فبعض RPCs المساعدة منفذة في
  `src/gateway/server-methods/*.ts` دون تعدادها في قائمة الميزات
  المعلنة.

## أمثلة على الإطارات

Connect (الرسالة الأولى):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
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
    "protocol": 4,
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
        minProtocol: 4,
        maxProtocol: 4,
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

في `src/gateway/protocol/index.ts`، صدّر مدقق AJV:

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

سجله في `src/gateway/server-methods.ts` (يدمج `systemHandlers` بالفعل)،
ثم أضف `"system.echo"` إلى مُدخلات `listGatewayMethods` في
`src/gateway/server-methods-list.ts`.

إذا كانت الطريقة قابلة للاستدعاء من عملاء المشغل أو العقد، فصنفها أيضًا في
`src/gateway/method-scopes.ts` حتى يظل فرض النطاق وإعلان ميزات `hello-ok`
متوافقين.

4. **إعادة التوليد**

```bash
pnpm protocol:check
```

5. **الاختبارات + التوثيق**

أضف اختبار خادم في `src/gateway/server.*.test.ts` واذكر الطريقة في التوثيق.

## سلوك توليد كود Swift

ينتج مولد Swift:

- enum باسم `GatewayFrame` مع حالات `req` و`res` و`event` و`unknown`
- structs/enums للحمولات مكتوبة الأنواع بقوة
- قيم `ErrorCode` و`GATEWAY_PROTOCOL_VERSION` و`GATEWAY_MIN_PROTOCOL_VERSION`

تُحفظ أنواع الإطارات غير المعروفة كحمولات خام للتوافق المستقبلي.

## الإصدارات + التوافق

- يوجد `PROTOCOL_VERSION` في `src/gateway/protocol/version.ts`.
- يرسل العملاء `minProtocol` + `maxProtocol`؛ يرفض الخادم النطاقات التي
  لا تتضمن بروتوكوله الحالي.
- تحتفظ نماذج Swift بأنواع الإطارات غير المعروفة لتجنب كسر العملاء الأقدم.

## أنماط المخططات والاصطلاحات

- تستخدم معظم الكائنات `additionalProperties: false` للحمولات الصارمة.
- `NonEmptyString` هو الافتراضي للمعرفات وأسماء الطرق/الأحداث.
- يستخدم `GatewayFrame` في المستوى الأعلى **مميزًا** على `type`.
- الطرق ذات الآثار الجانبية تتطلب عادة `idempotencyKey` في المعاملات
  (مثال: `send`، و`poll`، و`agent`، و`chat.send`).
- يقبل `agent` قيمة `internalEvents` اختيارية لسياق التنسيق المولد في وقت التشغيل
  (على سبيل المثال تسليم إكمال مهمة وكيل فرعي/cron)؛ تعامل مع هذا كسطح API داخلي.

## JSON المخطط المباشر

توجد JSON Schema المولدة في المستودع عند `dist/protocol.schema.json`. يكون
الملف الخام المنشور متاحًا عادةً على:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## عندما تغير المخططات

1. حدّث مخططات TypeBox.
2. سجل الطريقة/الحدث في `src/gateway/server-methods-list.ts`.
3. حدّث `src/gateway/method-scopes.ts` عندما تحتاج RPC الجديدة إلى تصنيف نطاق
   المشغل أو العقدة.
4. شغّل `pnpm protocol:check`.
5. التزم بالمخطط المعاد توليده + نماذج Swift.

## ذات صلة

- [بروتوكول الإخراج الغني](/ar/reference/rich-output-protocol)
- [محولات RPC](/ar/reference/rpc)
