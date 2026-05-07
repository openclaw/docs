---
read_when:
    - การอัปเดตสคีมาโปรโตคอลหรือการสร้างโค้ด
summary: สคีมา TypeBox ในฐานะแหล่งข้อมูลจริงเพียงแหล่งเดียวสำหรับโปรโตคอล Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-07T13:15:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95baccfdfa6f77ba57f6ac8502d502084289a84cfd03a450dd1e9422931706dd
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox เป็นไลบรารี schema ที่ให้ความสำคัญกับ TypeScript เป็นหลัก เราใช้เพื่อกำหนด **โปรโตคอล Gateway WebSocket** (handshake, request/response, server events) schema เหล่านี้ขับเคลื่อน **การตรวจสอบความถูกต้องขณะรันไทม์**, **การส่งออก JSON Schema** และ **การสร้างโค้ด Swift** สำหรับแอป macOS แหล่งความจริงหนึ่งเดียว ส่วนอื่นทั้งหมดถูกสร้างขึ้น

หากคุณต้องการบริบทโปรโตคอลระดับสูงกว่า ให้เริ่มที่
[สถาปัตยกรรม Gateway](/th/concepts/architecture)

## โมเดลความคิด (30 วินาที)

ทุกข้อความ Gateway WS เป็นหนึ่งในสาม frame:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

frame แรก **ต้อง** เป็นคำขอ `connect` หลังจากนั้น client สามารถเรียก method (เช่น `health`, `send`, `chat.send`) และสมัครรับ event (เช่น `presence`, `tick`, `agent`)

ลำดับการเชื่อมต่อ (ขั้นต่ำ):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

method และ event ทั่วไป:

| หมวดหมู่ | ตัวอย่าง | หมายเหตุ |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Core | `connect`, `health`, `status` | `connect` ต้องมาก่อน |
| Messaging | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side effect ต้องใช้ `idempotencyKey` |
| Chat | `chat.history`, `chat.send`, `chat.abort` | WebChat ใช้รายการเหล่านี้ |
| Sessions | `sessions.list`, `sessions.patch`, `sessions.delete` | การดูแล session |
| Automation | `wake`, `cron.list`, `cron.run`, `cron.runs` | การควบคุม wake + cron |
| Nodes | `node.list`, `node.invoke`, `node.pair.*` | Gateway WS + การกระทำของ node |
| Events | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown` | การ push จาก server |

คลังรายการ **discovery** ที่ประกาศอย่างเป็นทางการอยู่ใน
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`)

## schema อยู่ที่ไหน

- แหล่งที่มา: `src/gateway/protocol/schema.ts`
- ตัวตรวจสอบความถูกต้องขณะรันไทม์ (AJV): `src/gateway/protocol/index.ts`
- registry ของ feature/discovery ที่ประกาศ: `src/gateway/server-methods-list.ts`
- handshake ของ server + การ dispatch method: `src/gateway/server.impl.ts`
- client ของ Node: `src/gateway/client.ts`
- JSON Schema ที่สร้างแล้ว: `dist/protocol.schema.json`
- โมเดล Swift ที่สร้างแล้ว: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## pipeline ปัจจุบัน

- `pnpm protocol:gen`
  - เขียน JSON Schema (draft-07) ไปที่ `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - สร้างโมเดล gateway ของ Swift
- `pnpm protocol:check`
  - รัน generator ทั้งสองตัวและตรวจสอบว่า output ถูก commit แล้ว

## schema ถูกใช้ขณะรันไทม์อย่างไร

- **ฝั่ง server**: frame ขาเข้าทุกตัวถูกตรวจสอบด้วย AJV handshake รับเฉพาะคำขอ `connect` ที่ params ตรงกับ `ConnectParams`
- **ฝั่ง client**: client ของ JS ตรวจสอบ frame event และ response ก่อนใช้งาน
- **feature discovery**: Gateway ส่งรายการ `features.methods` และ `features.events` แบบอนุรักษนิยมใน `hello-ok` จาก `listGatewayMethods()` และ `GATEWAY_EVENTS`
- รายการ discovery นั้นไม่ใช่ dump ที่สร้างจาก helper ที่เรียกได้ทุกตัวใน `coreGatewayHandlers`; helper RPC บางตัวถูก implement ใน `src/gateway/server-methods/*.ts` โดยไม่ได้ถูกแจกแจงในรายการ feature ที่ประกาศ

## ตัวอย่าง frame

Connect (ข้อความแรก):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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

response Hello-ok:

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

## client ขั้นต่ำ (Node.js)

ลำดับที่เล็กที่สุดที่ยังมีประโยชน์: connect + health

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

## ตัวอย่างแบบลงมือทำ: เพิ่ม method ตั้งแต่ต้นจนจบ

ตัวอย่าง: เพิ่มคำขอ `system.echo` ใหม่ที่คืนค่า `{ ok: true, text }`

1. **Schema (แหล่งความจริง)**

เพิ่มลงใน `src/gateway/protocol/schema.ts`:

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

เพิ่มทั้งสองรายการลงใน `ProtocolSchemas` และ export type:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **การตรวจสอบความถูกต้อง**

ใน `src/gateway/protocol/index.ts` ให้ export validator ของ AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **พฤติกรรมของ server**

เพิ่ม handler ใน `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

ลงทะเบียนใน `src/gateway/server-methods.ts` (รวม `systemHandlers` อยู่แล้ว) จากนั้นเพิ่ม `"system.echo"` ลงใน input ของ `listGatewayMethods` ใน
`src/gateway/server-methods-list.ts`

หาก method นี้เรียกได้โดย operator หรือ node client ให้จัดประเภทใน
`src/gateway/method-scopes.ts` ด้วย เพื่อให้การบังคับใช้ scope และการประกาศ feature ใน `hello-ok` สอดคล้องกัน

4. **สร้างใหม่**

```bash
pnpm protocol:check
```

5. **test + docs**

เพิ่ม test ของ server ใน `src/gateway/server.*.test.ts` และบันทึก method นี้ใน docs

## พฤติกรรมการสร้างโค้ด Swift

generator ของ Swift สร้าง:

- enum `GatewayFrame` ที่มี case `req`, `res`, `event` และ `unknown`
- struct/enum payload ที่มี type ชัดเจน
- ค่า `ErrorCode` และ `GATEWAY_PROTOCOL_VERSION`

frame type ที่ไม่รู้จักจะถูกเก็บเป็น payload ดิบเพื่อความเข้ากันได้ในอนาคต

## การกำหนดเวอร์ชัน + ความเข้ากันได้

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/version.ts`
- client ส่ง `minProtocol` + `maxProtocol`; server ปฏิเสธรายการที่ไม่ตรงกัน
- โมเดล Swift เก็บ frame type ที่ไม่รู้จักไว้เพื่อหลีกเลี่ยงการทำให้ client รุ่นเก่าเสียหาย

## รูปแบบและ convention ของ schema

- object ส่วนใหญ่ใช้ `additionalProperties: false` สำหรับ payload แบบเข้มงวด
- `NonEmptyString` เป็นค่าเริ่มต้นสำหรับ ID และชื่อ method/event
- `GatewayFrame` ระดับบนสุดใช้ **discriminator** บน `type`
- method ที่มี side effect มักต้องใช้ `idempotencyKey` ใน params
  (ตัวอย่าง: `send`, `poll`, `agent`, `chat.send`)
- `agent` รับ `internalEvents` แบบไม่บังคับสำหรับบริบท orchestration ที่สร้างขณะรันไทม์
  (เช่น การส่งต่องานเมื่อ subagent/cron task เสร็จสิ้น); ให้ถือว่านี่เป็นพื้นผิว API ภายใน

## JSON schema สด

JSON Schema ที่สร้างแล้วอยู่ใน repo ที่ `dist/protocol.schema.json` โดยปกติไฟล์ raw ที่เผยแพร่จะพร้อมใช้งานที่:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## เมื่อคุณเปลี่ยน schema

1. อัปเดต schema ของ TypeBox
2. ลงทะเบียน method/event ใน `src/gateway/server-methods-list.ts`
3. อัปเดต `src/gateway/method-scopes.ts` เมื่อ RPC ใหม่ต้องการการจัดประเภท scope ของ operator หรือ node
4. รัน `pnpm protocol:check`
5. commit schema ที่สร้างใหม่ + โมเดล Swift

## ที่เกี่ยวข้อง

- [โปรโตคอล rich output](/th/reference/rich-output-protocol)
- [adapter ของ RPC](/th/reference/rpc)
