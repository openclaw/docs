---
read_when:
    - การอัปเดตสคีมาโปรโตคอลหรือการสร้างโค้ดอัตโนมัติ
summary: สคีมา TypeBox เป็นแหล่งข้อมูลจริงเพียงแหล่งเดียวสำหรับโปรโตคอล Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T16:00:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox เป็นไลบรารีสคีมาที่เน้น TypeScript เป็นหลัก OpenClaw ใช้ไลบรารีนี้เพื่อกำหนด **โปรโตคอล Gateway WebSocket** (การจับมือเริ่มต้น คำขอ/การตอบกลับ และเหตุการณ์จากเซิร์ฟเวอร์) สคีมาเหล่านั้นใช้ขับเคลื่อน **การตรวจสอบความถูกต้องขณะรันไทม์** (AJV), **การส่งออก JSON Schema** และ **การสร้างโค้ด Swift** สำหรับแอป macOS โดยมีแหล่งข้อมูลจริงเพียงแห่งเดียว ส่วนอื่นทั้งหมดจะถูกสร้างขึ้น

สำหรับบริบทของโปรโตคอลในระดับที่สูงขึ้น ให้เริ่มจาก [สถาปัตยกรรม Gateway](/th/concepts/architecture)

## แบบจำลองทางความคิด (30 วินาที)

ทุกข้อความ Gateway WS เป็นเฟรมหนึ่งในสามประเภท:

- **คำขอ**: `{ type: "req", id, method, params }`
- **การตอบกลับ**: `{ type: "res", id, ok, payload | error }`
- **เหตุการณ์**: `{ type: "event", event, payload, seq?, stateVersion? }`

เฟรมแรก **ต้อง** เป็นคำขอ `connect` หลังจากนั้นไคลเอนต์จะเรียกเมธอด (เช่น `health`, `send`, `chat.send`) และสมัครรับเหตุการณ์ (เช่น `presence`, `tick`, `agent`)

ลำดับการเชื่อมต่อ (ขั้นต่ำ):

```text
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

เมธอดและเหตุการณ์ที่ใช้ทั่วไป:

| หมวดหมู่   | ตัวอย่าง                                                   | หมายเหตุ                                        |
| ---------- | ---------------------------------------------------------- | -------------------------------------------- |
| แกนหลัก       | `connect`, `health`, `status`                              | `connect` ต้องมาก่อน                      |
| การรับส่งข้อความ  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | เมธอดที่ก่อให้เกิดผลข้างเคียงต้องมี `idempotencyKey` |
| แชต       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat ใช้เมธอดเหล่านี้                           |
| เซสชัน   | `sessions.list`, `sessions.patch`, `sessions.delete`       | การดูแลเซสชัน                                |
| ระบบอัตโนมัติ | `wake`, `cron.list`, `cron.run`, `cron.runs`               | การควบคุมการปลุกและ cron                        |
| Node      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS ร่วมกับการดำเนินการของ Node                 |
| เหตุการณ์     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | การพุชจากเซิร์ฟเวอร์                                  |

รายการ **การค้นพบความสามารถ** ที่ประกาศอย่างเป็นทางการอยู่ใน `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`)

## ตำแหน่งของสคีมา

- ไฟล์รวมสำหรับซอร์ส: `packages/gateway-protocol/src/schema.ts` ส่งออกโมดูลตามโดเมนอีกครั้งจาก `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` สำหรับซองข้อมูลระดับบนสุดและการจับมือเริ่มต้น รวมถึง `agent.ts`, `sessions.ts`, `cron.ts` เป็นต้นตามขอบเขตของแต่ละฟีเจอร์) `protocol-schemas.ts` คือรีจิสทรีส่วนกลาง `ProtocolSchemas` ที่จับคู่ชื่อสคีมากับนิยาม TypeBox
- ตัวตรวจสอบขณะรันไทม์ (AJV): `packages/gateway-protocol/src/index.ts`
- รีจิสทรีฟีเจอร์/การค้นพบความสามารถที่ประกาศ: `src/gateway/server-methods-list.ts`
- การจับมือเริ่มต้นของเซิร์ฟเวอร์และการส่งต่อเมธอด: `src/gateway/server.impl.ts`
- ไคลเอนต์ Node: `src/gateway/client.ts`
- JSON Schema ที่สร้างขึ้น: `dist/protocol.schema.json` (ผลลัพธ์จากการบิลด์ ไม่ได้คอมมิต)
- โมเดล Swift ที่สร้างขึ้น: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## ไปป์ไลน์ปัจจุบัน

- `pnpm protocol:gen` เขียน JSON Schema (draft-07) ไปยัง `dist/protocol.schema.json`
- `pnpm protocol:gen:swift` สร้างโมเดล Gateway สำหรับ Swift
- `pnpm protocol:check` เรียกตัวสร้างทั้งสองรายการและตรวจสอบว่าได้คอมมิตผลลัพธ์ Swift แล้ว (ผลลัพธ์ JSON Schema เป็นอาร์ติแฟกต์จากการบิลด์ที่ถูกละเว้นโดย Git)

## วิธีใช้สคีมาขณะรันไทม์

- **ฝั่งเซิร์ฟเวอร์**: ทุกเฟรมขาเข้าจะถูกตรวจสอบด้วย AJV การจับมือเริ่มต้นยอมรับเฉพาะคำขอ `connect` ที่พารามิเตอร์ตรงกับ `ConnectParams`
- **ฝั่งไคลเอนต์**: ไคลเอนต์ JS ตรวจสอบเฟรมเหตุการณ์และการตอบกลับก่อนนำไปใช้
- **การค้นพบฟีเจอร์**: Gateway ส่งรายการ `features.methods` และ `features.events` แบบจำกัดไว้เพื่อความปลอดภัยใน `hello-ok` โดยมาจาก `listGatewayMethods()` และ `GATEWAY_EVENTS`
- รายการการค้นพบนี้ไม่ใช่การถ่ายโอนรายการตัวช่วยทั้งหมดใน `coreGatewayHandlers` ที่สามารถเรียกได้โดยอัตโนมัติ RPC ตัวช่วยบางรายการถูกติดตั้งใช้งานใน `src/gateway/server-methods/*.ts` โดยไม่ได้ระบุไว้ในรายการฟีเจอร์ที่ประกาศ

## ตัวอย่างเฟรม

เชื่อมต่อ (ข้อความแรก):

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

การตอบกลับ Hello-ok:

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

คำขอและการตอบกลับ:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

เหตุการณ์:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## ไคลเอนต์ขั้นต่ำ (Node.js)

ลำดับการทำงานที่เล็กที่สุดแต่ใช้งานได้: เชื่อมต่อ + ตรวจสอบสถานะ

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

## ตัวอย่างแบบครบขั้นตอน: เพิ่มเมธอดตั้งแต่ต้นจนจบ

ตัวอย่าง: เพิ่มคำขอใหม่ `system.echo` ที่ส่งคืน `{ ok: true, text }`

1. **สคีมา (แหล่งข้อมูลจริง)**

เพิ่มใน `packages/gateway-protocol/src/schema/system.ts` (หรือโมดูลฟีเจอร์ที่ตรงที่สุด):

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

นำเข้าทั้งสองรายการใน `packages/gateway-protocol/src/schema/protocol-schemas.ts` เพิ่มลงในรีจิสทรี `ProtocolSchemas` และส่งออกชนิดข้อมูลที่ได้:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **การตรวจสอบความถูกต้อง**

ใน `packages/gateway-protocol/src/index.ts` ให้ส่งออกตัวตรวจสอบ AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **พฤติกรรมของเซิร์ฟเวอร์**

เพิ่มตัวจัดการใน `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

ลงทะเบียนใน `src/gateway/server-methods.ts` (ซึ่งผสาน `systemHandlers` อยู่แล้ว) จากนั้นเพิ่ม `"system.echo"` ลงในอินพุตของ `listGatewayMethods` ใน `src/gateway/server-methods-list.ts`

หากไคลเอนต์ผู้ควบคุมหรือไคลเอนต์ Node สามารถเรียกเมธอดนี้ได้ ให้จัดประเภทเมธอดใน `src/gateway/method-scopes.ts` ด้วย เพื่อให้การบังคับใช้ขอบเขตสิทธิ์และการประกาศฟีเจอร์ใน `hello-ok` สอดคล้องกัน

4. **สร้างใหม่**

```bash
pnpm protocol:check
```

5. **การทดสอบและเอกสาร**

เพิ่มการทดสอบเซิร์ฟเวอร์ใน `src/gateway/server.*.test.ts` และระบุเมธอดนี้ไว้ในเอกสาร

## พฤติกรรมการสร้างโค้ด Swift

ตัวสร้าง Swift จะสร้าง:

- enum `GatewayFrame` ที่มีกรณี `req`, `res`, `event` และ `unknown`
- struct/enum ของเพย์โหลดที่กำหนดชนิดข้อมูลอย่างเข้มงวด
- ค่า `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` และ `GATEWAY_MIN_PROTOCOL_VERSION`

ชนิดเฟรมที่ไม่รู้จักจะถูกเก็บไว้เป็นเพย์โหลดดิบเพื่อรองรับความเข้ากันได้ในอนาคต

## การกำหนดเวอร์ชันและความเข้ากันได้

- `PROTOCOL_VERSION` อยู่ใน `packages/gateway-protocol/src/version.ts` (ค่าปัจจุบัน: `4`)
- ไคลเอนต์ส่ง `minProtocol` และ `maxProtocol` เซิร์ฟเวอร์จะปฏิเสธช่วงที่ไม่ครอบคลุมโปรโตคอลปัจจุบัน
- โมเดล Swift เก็บชนิดเฟรมที่ไม่รู้จักไว้เพื่อหลีกเลี่ยงการทำให้ไคลเอนต์รุ่นเก่าใช้งานไม่ได้

## รูปแบบและข้อตกลงของสคีมา

- อ็อบเจ็กต์ส่วนใหญ่ใช้ `additionalProperties: false` เพื่อให้เพย์โหลดมีโครงสร้างเข้มงวด
- `NonEmptyString` (`Type.String({ minLength: 1 })`) เป็นค่าเริ่มต้นสำหรับ ID และชื่อเมธอด/เหตุการณ์
- `GatewayFrame` ระดับบนสุดใช้ **ตัวจำแนก** บน `type`
- เมธอดที่มีผลข้างเคียงมักกำหนดให้ต้องมี `idempotencyKey` ในพารามิเตอร์ (ตัวอย่าง: `send`, `poll`, `agent`, `chat.send`)
- `agent` ยอมรับ `internalEvents` แบบไม่บังคับสำหรับบริบทการประสานงานที่สร้างขึ้นขณะรันไทม์ (เช่น การส่งมอบเมื่องานของตัวแทนย่อย/cron เสร็จสิ้น) ให้ถือว่านี่เป็นพื้นผิว API ภายใน

## JSON ของสคีมาแบบสด

JSON Schema ที่สร้างขึ้นเป็นอาร์ติแฟกต์จากการบิลด์และไม่ได้คอมมิตไว้ในรีโพ โดยปกติไฟล์ดิบที่เผยแพร่แล้วจะอยู่ที่:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## เมื่อคุณเปลี่ยนสคีมา

1. อัปเดตสคีมา TypeBox ในโมดูลเจ้าของ `packages/gateway-protocol/src/schema/*.ts` และลงทะเบียนใน `protocol-schemas.ts`
2. ลงทะเบียนเมธอด/เหตุการณ์ใน `src/gateway/server-methods-list.ts`
3. อัปเดต `src/gateway/method-scopes.ts` เมื่อ RPC ใหม่ต้องมีการจัดประเภทขอบเขตสิทธิ์ของผู้ควบคุมหรือ Node
4. เรียกใช้ `pnpm protocol:check`
5. คอมมิตโมเดล Swift ที่สร้างใหม่

## ที่เกี่ยวข้อง

- [โปรโตคอลเอาต์พุตแบบสมบูรณ์](/th/reference/rich-output-protocol)
- [อะแดปเตอร์ RPC](/th/reference/rpc)
