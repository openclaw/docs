---
read_when:
    - การอัปเดตสคีมาโปรโตคอลหรือการสร้างโค้ด
summary: สคีมา TypeBox เป็นแหล่งความจริงแหล่งเดียวสำหรับโปรโตคอล Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-06-27T17:30:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2f3da11e9dcf3250fd77e0c43f4ed918551a536d93fa71bce95eaf3d7539f6d
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox เป็นไลบรารีสคีมาที่ให้ความสำคัญกับ TypeScript เป็นอันดับแรก เราใช้เพื่อกำหนด **โปรโตคอล Gateway
WebSocket** (handshake, request/response, server events) สคีมาเหล่านี้ขับเคลื่อน **การตรวจสอบขณะรันไทม์**, **การส่งออก JSON Schema** และ **Swift codegen** สำหรับแอป macOS แหล่งความจริงเดียว; ส่วนอื่นทั้งหมดสร้างขึ้นจากมัน

หากต้องการบริบทโปรโตคอลในระดับสูงกว่า ให้เริ่มที่
[สถาปัตยกรรม Gateway](/th/concepts/architecture)

## โมเดลทางความคิด (30 วินาที)

ทุกข้อความ Gateway WS เป็นหนึ่งในสามเฟรม:

- **คำขอ**: `{ type: "req", id, method, params }`
- **การตอบกลับ**: `{ type: "res", id, ok, payload | error }`
- **เหตุการณ์**: `{ type: "event", event, payload, seq?, stateVersion? }`

เฟรมแรก **ต้อง** เป็นคำขอ `connect` หลังจากนั้น ไคลเอนต์สามารถเรียกเมธอด
(เช่น `health`, `send`, `chat.send`) และสมัครรับเหตุการณ์ (เช่น
`presence`, `tick`, `agent`)

โฟลว์การเชื่อมต่อ (ขั้นต่ำ):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

เมธอดและเหตุการณ์ทั่วไป:

| หมวดหมู่   | ตัวอย่าง                                                   | หมายเหตุ                              |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| แกนหลัก       | `connect`, `health`, `status`                              | `connect` ต้องมาก่อน            |
| การส่งข้อความ  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side effect ต้องใช้ `idempotencyKey` |
| แชต       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat ใช้สิ่งเหล่านี้                 |
| เซสชัน   | `sessions.list`, `sessions.patch`, `sessions.delete`       | การดูแลเซสชัน                      |
| อัตโนมัติ | `wake`, `cron.list`, `cron.run`, `cron.runs`               | การควบคุม wake + cron                |
| โหนด      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + การกระทำของโหนด          |
| เหตุการณ์     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | การ push จากเซิร์ฟเวอร์                        |

คลังรายการ **discovery** ที่ประกาศอย่างเป็นทางการอยู่ใน
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`)

## ตำแหน่งของสคีมา

- ซอร์ส: `packages/gateway-protocol/src/schema.ts`
- ตัวตรวจสอบรันไทม์ (AJV): `packages/gateway-protocol/src/index.ts`
- รีจิสทรี feature/discovery ที่ประกาศ: `src/gateway/server-methods-list.ts`
- Server handshake + การ dispatch เมธอด: `src/gateway/server.impl.ts`
- ไคลเอนต์ Node: `src/gateway/client.ts`
- JSON Schema ที่สร้างขึ้น: `dist/protocol.schema.json`
- โมเดล Swift ที่สร้างขึ้น: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## ไปป์ไลน์ปัจจุบัน

- `pnpm protocol:gen`
  - เขียน JSON Schema (draft-07) ไปที่ `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - สร้างโมเดล Swift gateway
- `pnpm protocol:check`
  - รันตัวสร้างทั้งสองและตรวจสอบว่า output ถูก commit แล้ว

## วิธีใช้สคีมาขณะรันไทม์

- **ฝั่งเซิร์ฟเวอร์**: เฟรมขาเข้าทุกเฟรมถูกตรวจสอบด้วย AJV handshake ยอมรับเฉพาะ
  คำขอ `connect` ที่ params ตรงกับ `ConnectParams`
- **ฝั่งไคลเอนต์**: ไคลเอนต์ JS ตรวจสอบเฟรมเหตุการณ์และการตอบกลับก่อน
  ใช้งาน
- **Feature discovery**: Gateway ส่งรายการ `features.methods`
  และ `features.events` แบบระมัดระวังใน `hello-ok` จาก `listGatewayMethods()` และ
  `GATEWAY_EVENTS`
- รายการ discovery นั้นไม่ใช่ dump ที่สร้างขึ้นของ helper ทุกตัวที่เรียกได้ใน
  `coreGatewayHandlers`; helper RPC บางตัวถูก implement ใน
  `src/gateway/server-methods/*.ts` โดยไม่ได้ถูกแจกแจงในรายการ feature
  ที่ประกาศ

## ตัวอย่างเฟรม

Connect (ข้อความแรก):

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
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

คำขอ + การตอบกลับ:

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

โฟลว์ที่เล็กที่สุดแต่ใช้งานได้: connect + health

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

## ตัวอย่างแบบทำจริง: เพิ่มเมธอดตั้งแต่ต้นจนจบ

ตัวอย่าง: เพิ่มคำขอ `system.echo` ใหม่ที่คืนค่า `{ ok: true, text }`

1. **สคีมา (แหล่งความจริง)**

เพิ่มใน `packages/gateway-protocol/src/schema.ts`:

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

เพิ่มทั้งคู่ใน `ProtocolSchemas` และ export types:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **การตรวจสอบ**

ใน `packages/gateway-protocol/src/index.ts` ให้ export ตัวตรวจสอบ AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **พฤติกรรมเซิร์ฟเวอร์**

เพิ่ม handler ใน `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

ลงทะเบียนใน `src/gateway/server-methods.ts` (รวม `systemHandlers` อยู่แล้ว)
จากนั้นเพิ่ม `"system.echo"` ใน input ของ `listGatewayMethods` ใน
`src/gateway/server-methods-list.ts`

หากเมธอดเรียกได้โดยไคลเอนต์ operator หรือ node ให้จัดประเภทใน
`src/gateway/method-scopes.ts` ด้วย เพื่อให้การบังคับใช้ scope และการประกาศ feature
ใน `hello-ok` สอดคล้องกัน

4. **สร้างใหม่**

```bash
pnpm protocol:check
```

5. **การทดสอบ + เอกสาร**

เพิ่มการทดสอบเซิร์ฟเวอร์ใน `src/gateway/server.*.test.ts` และบันทึกเมธอดนี้ไว้ในเอกสาร

## พฤติกรรม Swift codegen

ตัวสร้าง Swift emit:

- enum `GatewayFrame` พร้อมเคส `req`, `res`, `event` และ `unknown`
- structs/enums ของ payload ที่มี type ชัดเจน
- ค่า `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` และ `GATEWAY_MIN_PROTOCOL_VERSION`

ประเภทเฟรมที่ไม่รู้จักจะถูกเก็บเป็น raw payload เพื่อความเข้ากันได้ไปข้างหน้า

## การกำหนดเวอร์ชัน + ความเข้ากันได้

- `PROTOCOL_VERSION` อยู่ใน `packages/gateway-protocol/src/version.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธช่วงที่
  ไม่รวมโปรโตคอลปัจจุบันของมัน
- โมเดล Swift เก็บประเภทเฟรมที่ไม่รู้จักไว้เพื่อหลีกเลี่ยงการทำให้ไคลเอนต์เก่าเสียหาย

## รูปแบบและข้อตกลงของสคีมา

- ออบเจ็กต์ส่วนใหญ่ใช้ `additionalProperties: false` สำหรับ payload ที่เข้มงวด
- `NonEmptyString` เป็นค่าเริ่มต้นสำหรับ IDs และชื่อ method/event
- `GatewayFrame` ระดับบนสุดใช้ **discriminator** บน `type`
- เมธอดที่มี side effect มักต้องใช้ `idempotencyKey` ใน params
  (ตัวอย่าง: `send`, `poll`, `agent`, `chat.send`)
- `agent` รับ `internalEvents` แบบ optional สำหรับบริบท orchestration ที่รันไทม์สร้างขึ้น
  (เช่นการส่งต่อเมื่อ subagent/cron task เสร็จสิ้น); ให้ถือสิ่งนี้เป็นพื้นผิว API ภายใน

## JSON สคีมาแบบสด

JSON Schema ที่สร้างขึ้นอยู่ใน repo ที่ `dist/protocol.schema.json` โดยทั่วไปไฟล์ raw
ที่เผยแพร่จะพร้อมใช้งานที่:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## เมื่อคุณเปลี่ยนสคีมา

1. อัปเดตสคีมา TypeBox
2. ลงทะเบียน method/event ใน `src/gateway/server-methods-list.ts`
3. อัปเดต `src/gateway/method-scopes.ts` เมื่อ RPC ใหม่ต้องมีการจัดประเภท scope ของ operator หรือ
   node
4. รัน `pnpm protocol:check`
5. Commit สคีมาและโมเดล Swift ที่สร้างใหม่

## ที่เกี่ยวข้อง

- [โปรโตคอล rich output](/th/reference/rich-output-protocol)
- [อะแดปเตอร์ RPC](/th/reference/rpc)
