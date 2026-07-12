---
read_when:
    - تحديث مخططات البروتوكول أو توليد الشيفرة
summary: مخططات TypeBox بوصفها المصدر الوحيد للحقيقة لبروتوكول Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T05:50:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox هي مكتبة مخططات تركّز على TypeScript أولًا. تستخدمها OpenClaw لتعريف **بروتوكول WebSocket الخاص بـ Gateway** (المصافحة، والطلب/الاستجابة، وأحداث الخادم). تقود هذه المخططات **التحقق أثناء التشغيل** (AJV)، و**تصدير JSON Schema**، و**توليد شيفرة Swift** لتطبيق macOS. مصدر حقيقة واحد؛ وكل ما عداه يُولَّد منه.

للاطلاع على سياق البروتوكول الأعلى مستوى، ابدأ بـ [معمارية Gateway](/ar/concepts/architecture).

## النموذج الذهني (30 ثانية)

كل رسالة WS خاصة بـ Gateway هي أحد ثلاثة إطارات:

- **طلب**: `{ type: "req", id, method, params }`
- **استجابة**: `{ type: "res", id, ok, payload | error }`
- **حدث**: `{ type: "event", event, payload, seq?, stateVersion? }`

يجب أن يكون الإطار الأول طلب `connect`. بعد ذلك، تستدعي البرامج العميلة أساليب (مثل `health` و`send` و`chat.send`) وتشترك في أحداث (مثل `presence` و`tick` و`agent`).

تدفق الاتصال (الحد الأدنى):

```text
العميل                   Gateway
  |---- طلب:connect -------->|
  |<---- استجابة:hello-ok ----|
  |<---- حدث:tick ------------|
  |---- طلب:health ---------->|
  |<---- استجابة:health ------|
```

الأساليب والأحداث الشائعة:

| الفئة       | الأمثلة                                                    | الملاحظات                                       |
| ----------- | ---------------------------------------------------------- | ----------------------------------------------- |
| الأساس      | `connect`, `health`, `status`                              | يجب أن يكون `connect` أولًا                     |
| المراسلة    | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | تحتاج الأساليب ذات الآثار الجانبية إلى `idempotencyKey` |
| الدردشة     | `chat.history`, `chat.send`, `chat.abort`                  | تستخدم WebChat هذه الأساليب                     |
| الجلسات     | `sessions.list`, `sessions.patch`, `sessions.delete`       | إدارة الجلسات                                   |
| الأتمتة     | `wake`, `cron.list`, `cron.run`, `cron.runs`               | التحكم في الإيقاظ وCron                         |
| العُقد      | `node.list`, `node.invoke`, `node.pair.*`                  | WS الخاص بـ Gateway بالإضافة إلى إجراءات العُقد |
| الأحداث     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | دفع من الخادم                                   |

توجد قائمة **الاكتشاف** المعلنة والمرجعية في `src/gateway/server-methods-list.ts` ‏(`listGatewayMethods` و`GATEWAY_EVENTS`).

## مواضع المخططات

- ملف التصدير المصدر: يعيد `packages/gateway-protocol/src/schema.ts` تصدير وحدات النطاق ضمن `packages/gateway-protocol/src/schema/*.ts` ‏(`frames.ts` للأغلفة العليا والمصافحة، و`agent.ts` و`sessions.ts` و`cron.ts` وغيرها بحسب مجال الميزة). يمثّل `protocol-schemas.ts` سجل `ProtocolSchemas` المركزي الذي يربط أسماء المخططات بتعريفاتها في TypeBox.
- أدوات التحقق أثناء التشغيل (AJV): `packages/gateway-protocol/src/index.ts`
- سجل الميزات/الاكتشاف المعلن: `src/gateway/server-methods-list.ts`
- مصافحة الخادم وتوجيه الأساليب: `src/gateway/server.impl.ts`
- عميل Node: `src/gateway/client.ts`
- JSON Schema المولَّد: `dist/protocol.schema.json` (ناتج بناء، غير مُضمَّن في المستودع)
- نماذج Swift المولَّدة: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## مسار المعالجة الحالي

- يكتب `pnpm protocol:gen` ملف JSON Schema ‏(draft-07) إلى `dist/protocol.schema.json`.
- يولّد `pnpm protocol:gen:swift` نماذج Gateway بلغة Swift.
- يشغّل `pnpm protocol:check` كلا المولّدين ويتحقق من تضمين ناتج Swift في المستودع (أما ناتج JSON Schema فهو أثر بناء يتجاهله Git).

## كيفية استخدام المخططات أثناء التشغيل

- **جانب الخادم**: يُتحقق من كل إطار وارد باستخدام AJV. لا تقبل المصافحة سوى طلب `connect` تطابق معاملاته `ConnectParams`.
- **جانب العميل**: يتحقق عميل JS من إطارات الأحداث والاستجابات قبل استخدامها.
- **اكتشاف الميزات**: يرسل Gateway قائمة متحفظة من `features.methods` و`features.events` ضمن `hello-ok`، مصدرها `listGatewayMethods()` و`GATEWAY_EVENTS`.
- قائمة الاكتشاف هذه ليست تفريغًا مولَّدًا لكل دالة مساعدة قابلة للاستدعاء في `coreGatewayHandlers`؛ إذ توجد بعض إجراءات RPC المساعدة المنفَّذة في `src/gateway/server-methods/*.ts` من دون إدراجها في قائمة الميزات المعلنة.

## أمثلة على الإطارات

الاتصال (الرسالة الأولى):

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

استجابة hello-ok:

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
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

الطلب والاستجابة:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

الحدث:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## عميل مبسّط (Node.js)

أصغر تدفق مفيد: الاتصال + فحص الصحة.

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

## مثال عملي: إضافة أسلوب من البداية إلى النهاية

مثال: أضف طلبًا جديدًا باسم `system.echo` يعيد `{ ok: true, text }`.

1. **المخطط (مصدر الحقيقة)**

أضف إلى `packages/gateway-protocol/src/schema/system.ts` (أو إلى أقرب وحدة ميزة مطابقة):

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

استورد كليهما في `packages/gateway-protocol/src/schema/protocol-schemas.ts`، وأضفهما إلى سجل `ProtocolSchemas`، ثم صدّر الأنواع المشتقة:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **التحقق**

في `packages/gateway-protocol/src/index.ts`، صدّر أداة تحقق AJV:

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

سجّله في `src/gateway/server-methods.ts` (الذي يدمج `systemHandlers` بالفعل)، ثم أضف `"system.echo"` إلى مدخل `listGatewayMethods` في `src/gateway/server-methods-list.ts`.

إذا كان الأسلوب قابلًا للاستدعاء بواسطة عملاء المشغّل أو العُقد، فصنّفه أيضًا في `src/gateway/method-scopes.ts` حتى يظل فرض النطاق وإعلان الميزات في `hello-ok` متوافقين.

4. **إعادة التوليد**

```bash
pnpm protocol:check
```

5. **الاختبارات والتوثيق**

أضف اختبار خادم في `src/gateway/server.*.test.ts` واذكر الأسلوب في التوثيق.

## سلوك توليد شيفرة Swift

يُصدر مولّد Swift ما يلي:

- تعداد `GatewayFrame` يتضمن حالات `req` و`res` و`event` و`unknown`
- بُنى/تعدادات حمولة قوية الأنواع
- قيم `ErrorCode` و`GATEWAY_PROTOCOL_VERSION` و`GATEWAY_MIN_PROTOCOL_VERSION`

تُحفَظ أنواع الإطارات غير المعروفة كحِمولات خام لضمان التوافق المستقبلي.

## إدارة الإصدارات والتوافق

- يوجد `PROTOCOL_VERSION` في `packages/gateway-protocol/src/version.ts` (القيمة الحالية: `4`).
- ترسل البرامج العميلة `minProtocol` و`maxProtocol`؛ ويرفض الخادم النطاقات التي لا تشمل بروتوكوله الحالي.
- تحتفظ نماذج Swift بأنواع الإطارات غير المعروفة لتجنب تعطيل البرامج العميلة الأقدم.

## أنماط المخططات واصطلاحاتها

- تستخدم معظم الكائنات `additionalProperties: false` للحِمولات الصارمة.
- يمثّل `NonEmptyString` ‏(`Type.String({ minLength: 1 })`) الخيار الافتراضي للمعرّفات وأسماء الأساليب/الأحداث.
- يستخدم `GatewayFrame` عالي المستوى **مميِّزًا** على `type`.
- تتطلب الأساليب ذات الآثار الجانبية عادةً `idempotencyKey` ضمن المعاملات (مثل `send` و`poll` و`agent` و`chat.send`).
- يقبل `agent` الخيار `internalEvents` لأجل سياق التنسيق المولَّد أثناء التشغيل (مثل تسليم اكتمال مهمة وكيل فرعي أو Cron)؛ تعامل معه كسطح API داخلي.

## ملف JSON المباشر للمخطط

يمثّل JSON Schema المولَّد أثر بناء غير مُضمَّن في المستودع. يتوفر الملف الخام المنشور عادةً على:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## عند تغيير المخططات

1. حدّث مخططات TypeBox في وحدة `packages/gateway-protocol/src/schema/*.ts` المالكة وسجّلها في `protocol-schemas.ts`.
2. سجّل الأسلوب/الحدث في `src/gateway/server-methods-list.ts`.
3. حدّث `src/gateway/method-scopes.ts` عندما يحتاج إجراء RPC الجديد إلى تصنيف نطاق المشغّل أو العُقدة.
4. شغّل `pnpm protocol:check`.
5. ضمّن نماذج Swift المعاد توليدها في المستودع.

## ذو صلة

- [بروتوكول المخرجات الغنية](/ar/reference/rich-output-protocol)
- [مهايئات RPC](/ar/reference/rpc)
