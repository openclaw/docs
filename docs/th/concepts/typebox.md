---
read_when:
    - การอัปเดตสคีมาโปรโตคอลหรือการสร้างโค้ด
summary: สคีมา TypeBox ในฐานะแหล่งความจริงเดียวสำหรับโปรโตคอล Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-11T20:28:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecc9a69ac6d4ac101a4a6f34e44acfbe952dce0f90d178d4f8559191fb92c3b4
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox เป็นไลบรารีสคีมาที่ให้ความสำคัญกับ TypeScript เป็นหลัก เราใช้เพื่อกำหนด **โปรโตคอล WebSocket ของ Gateway** (handshake, request/response, server events) สคีมาเหล่านั้นขับเคลื่อน **การตรวจสอบความถูกต้องขณะรัน**, **การส่งออก JSON Schema** และ **การสร้างโค้ด Swift** สำหรับแอป macOS แหล่งความจริงเดียว ส่วนที่เหลือทั้งหมดถูกสร้างขึ้น

หากคุณต้องการบริบทโปรโตคอลระดับสูงกว่า ให้เริ่มที่
[สถาปัตยกรรม Gateway](/th/concepts/architecture)

## แบบจำลองทางความคิด (30 วินาที)

ข้อความ Gateway WS ทุกข้อความเป็นหนึ่งในสามเฟรมต่อไปนี้:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

เฟรมแรก **ต้อง** เป็นคำขอ `connect` หลังจากนั้น ไคลเอนต์สามารถเรียกเมธอด (เช่น `health`, `send`, `chat.send`) และสมัครรับเหตุการณ์ (เช่น
`presence`, `tick`, `agent`) ได้

ลำดับการเชื่อมต่อ (แบบย่อที่สุด):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

เมธอด + เหตุการณ์ที่พบบ่อย:

| หมวดหมู่ | ตัวอย่าง                                                   | หมายเหตุ                              |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| แกนหลัก       | `connect`, `health`, `status`                              | `connect` ต้องมาก่อน            |
| การรับส่งข้อความ  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side effect ต้องมี `idempotencyKey` |
| แชต       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat ใช้เมธอดเหล่านี้                 |
| เซสชัน   | `sessions.list`, `sessions.patch`, `sessions.delete`       | การดูแลเซสชัน                      |
| ระบบอัตโนมัติ | `wake`, `cron.list`, `cron.run`, `cron.runs`               | การควบคุม wake + cron                |
| โหนด      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + การดำเนินการของโหนด          |
| เหตุการณ์     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | การ push จากเซิร์ฟเวอร์                        |

รายการ **discovery** ที่ประกาศอย่างเป็นทางการอยู่ใน
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`)

## ตำแหน่งของสคีมา

- แหล่งที่มา: `src/gateway/protocol/schema.ts`
- ตัวตรวจสอบความถูกต้องขณะรัน (AJV): `src/gateway/protocol/index.ts`
- รีจิสทรีฟีเจอร์/discovery ที่ประกาศ: `src/gateway/server-methods-list.ts`
- Server handshake + การ dispatch เมธอด: `src/gateway/server.impl.ts`
- ไคลเอนต์ Node: `src/gateway/client.ts`
- JSON Schema ที่สร้างขึ้น: `dist/protocol.schema.json`
- โมเดล Swift ที่สร้างขึ้น: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## ไปป์ไลน์ปัจจุบัน

- `pnpm protocol:gen`
  - เขียน JSON Schema (draft-07) ไปที่ `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - สร้างโมเดล Gateway สำหรับ Swift
- `pnpm protocol:check`
  - รันตัวสร้างทั้งสองตัวและตรวจสอบว่า output ถูก commit แล้ว

## วิธีใช้สคีมาขณะรัน

- **ฝั่งเซิร์ฟเวอร์**: เฟรมขาเข้าทุกเฟรมถูกตรวจสอบด้วย AJV โดย handshake จะยอมรับเฉพาะคำขอ `connect` ที่ params ตรงกับ `ConnectParams`
- **ฝั่งไคลเอนต์**: ไคลเอนต์ JS ตรวจสอบเฟรมเหตุการณ์และเฟรมการตอบกลับก่อนใช้งาน
- **การค้นพบฟีเจอร์**: Gateway ส่งรายการ `features.methods`
  และ `features.events` แบบระมัดระวังใน `hello-ok` จาก `listGatewayMethods()` และ
  `GATEWAY_EVENTS`
- รายการ discovery นั้นไม่ใช่ dump ที่สร้างขึ้นของ helper ทุกตัวที่เรียกได้ใน
  `coreGatewayHandlers`; helper RPC บางตัวถูกใช้งานใน
  `src/gateway/server-methods/*.ts` โดยไม่ได้ถูกแจกแจงในรายการฟีเจอร์ที่ประกาศ

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

Request + response:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Event:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## ไคลเอนต์ขั้นต่ำ (Node.js)

ลำดับการทำงานที่มีประโยชน์น้อยที่สุด: connect + health

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

ตัวอย่าง: เพิ่มคำขอ `system.echo` ใหม่ที่คืนค่า `{ ok: true, text }`

1. **สคีมา (แหล่งความจริง)**

เพิ่มใน `src/gateway/protocol/schema.ts`:

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

เพิ่มทั้งสองรายการใน `ProtocolSchemas` และ export types:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **การตรวจสอบความถูกต้อง**

ใน `src/gateway/protocol/index.ts` ให้ export ตัวตรวจสอบ AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **พฤติกรรมฝั่งเซิร์ฟเวอร์**

เพิ่ม handler ใน `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

ลงทะเบียนใน `src/gateway/server-methods.ts` (ซึ่ง merge `systemHandlers` อยู่แล้ว)
จากนั้นเพิ่ม `"system.echo"` ลงใน input ของ `listGatewayMethods` ใน
`src/gateway/server-methods-list.ts`

หากเมธอดนี้เรียกได้โดยไคลเอนต์ผู้ปฏิบัติการหรือโหนด ให้จัดหมวดหมู่ใน
`src/gateway/method-scopes.ts` ด้วย เพื่อให้การบังคับใช้ scope และการประกาศฟีเจอร์ใน `hello-ok` สอดคล้องกัน

4. **สร้างใหม่**

```bash
pnpm protocol:check
```

5. **การทดสอบ + เอกสาร**

เพิ่มการทดสอบเซิร์ฟเวอร์ใน `src/gateway/server.*.test.ts` และบันทึกเมธอดนี้ไว้ในเอกสาร

## พฤติกรรมการสร้างโค้ด Swift

ตัวสร้าง Swift จะ emit:

- enum `GatewayFrame` ที่มี case `req`, `res`, `event` และ `unknown`
- structs/enums ของ payload ที่มี type ชัดเจน
- ค่า `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` และ `GATEWAY_MIN_PROTOCOL_VERSION`

ชนิดเฟรมที่ไม่รู้จักจะถูกเก็บไว้เป็น raw payload เพื่อความเข้ากันได้ในอนาคต

## การกำหนดเวอร์ชัน + ความเข้ากันได้

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/version.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์จะปฏิเสธช่วงที่ไม่รวมโปรโตคอลปัจจุบันของเซิร์ฟเวอร์
- โมเดล Swift เก็บชนิดเฟรมที่ไม่รู้จักไว้เพื่อหลีกเลี่ยงการทำให้ไคลเอนต์รุ่นเก่าเสียหาย

## รูปแบบและข้อตกลงของสคีมา

- อ็อบเจ็กต์ส่วนใหญ่ใช้ `additionalProperties: false` เพื่อให้ payload เข้มงวด
- `NonEmptyString` เป็นค่าเริ่มต้นสำหรับ ID และชื่อเมธอด/เหตุการณ์
- `GatewayFrame` ระดับบนสุดใช้ **discriminator** บน `type`
- เมธอดที่มี side effect มักต้องมี `idempotencyKey` ใน params
  (ตัวอย่าง: `send`, `poll`, `agent`, `chat.send`)
- `agent` รับ `internalEvents` แบบไม่บังคับสำหรับบริบท orchestration ที่สร้างขณะรัน
  (เช่น การส่งมอบเมื่อ subagent/cron task เสร็จสิ้น); ให้ถือว่านี่เป็นพื้นผิว API ภายใน

## JSON สคีมาแบบสด

JSON Schema ที่สร้างขึ้นอยู่ใน repo ที่ `dist/protocol.schema.json` โดยไฟล์ raw ที่เผยแพร่มักอยู่ที่:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## เมื่อคุณเปลี่ยนสคีมา

1. อัปเดตสคีมา TypeBox
2. ลงทะเบียนเมธอด/เหตุการณ์ใน `src/gateway/server-methods-list.ts`
3. อัปเดต `src/gateway/method-scopes.ts` เมื่อ RPC ใหม่ต้องการการจัดหมวดหมู่ scope ของผู้ปฏิบัติการหรือโหนด
4. รัน `pnpm protocol:check`
5. Commit สคีมาและโมเดล Swift ที่สร้างใหม่

## ที่เกี่ยวข้อง

- [โปรโตคอล rich output](/th/reference/rich-output-protocol)
- [อะแดปเตอร์ RPC](/th/reference/rpc)
