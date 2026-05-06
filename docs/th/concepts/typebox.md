---
read_when:
    - การอัปเดตสคีมาของโปรโตคอลหรือการสร้างโค้ด
summary: สคีมา TypeBox เป็นแหล่งความจริงหนึ่งเดียวสำหรับโปรโตคอล Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T09:11:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox เป็นไลบรารีสคีมาที่ออกแบบโดยให้ TypeScript มาก่อน เราใช้ไลบรารีนี้เพื่อกำหนด **โปรโตคอล Gateway
WebSocket** (handshake, request/response, server events) สคีมาเหล่านั้น
ขับเคลื่อน **การตรวจสอบความถูกต้องขณะรันไทม์**, **การส่งออก JSON Schema** และ **Swift codegen** สำหรับ
แอป macOS แหล่งความจริงหนึ่งเดียว; ส่วนอื่นทั้งหมดสร้างขึ้นจากแหล่งนี้

หากคุณต้องการบริบทโปรโตคอลในระดับสูงขึ้น ให้เริ่มที่
[สถาปัตยกรรม Gateway](/th/concepts/architecture)

## โมเดลทางความคิด (30 วินาที)

ข้อความ Gateway WS ทุกข้อความเป็นเฟรมหนึ่งในสามแบบ:

- **คำขอ**: `{ type: "req", id, method, params }`
- **การตอบกลับ**: `{ type: "res", id, ok, payload | error }`
- **เหตุการณ์**: `{ type: "event", event, payload, seq?, stateVersion? }`

เฟรมแรก **ต้อง** เป็นคำขอ `connect` หลังจากนั้น ไคลเอ็นต์สามารถเรียก
เมธอด (เช่น `health`, `send`, `chat.send`) และสมัครรับเหตุการณ์ (เช่น
`presence`, `tick`, `agent`)

ลำดับการเชื่อมต่อ (ขั้นต่ำ):

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
| การส่งข้อความ  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side-effect ต้องใช้ `idempotencyKey` |
| แชต       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat ใช้รายการเหล่านี้                 |
| เซสชัน   | `sessions.list`, `sessions.patch`, `sessions.delete`       | การดูแลเซสชัน                      |
| ระบบอัตโนมัติ | `wake`, `cron.list`, `cron.run`, `cron.runs`               | การควบคุม wake + cron                |
| Node      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + การทำงานของ node          |
| เหตุการณ์     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | server push                        |

รายการ **discovery** ที่ประกาศอย่างเป็นทางการอยู่ใน
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`)

## ตำแหน่งของสคีมา

- ซอร์ส: `src/gateway/protocol/schema.ts`
- ตัวตรวจสอบรันไทม์ (AJV): `src/gateway/protocol/index.ts`
- รีจิสทรี feature/discovery ที่ประกาศ: `src/gateway/server-methods-list.ts`
- Server handshake + method dispatch: `src/gateway/server.impl.ts`
- ไคลเอ็นต์ Node: `src/gateway/client.ts`
- JSON Schema ที่สร้างแล้ว: `dist/protocol.schema.json`
- โมเดล Swift ที่สร้างแล้ว: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## ไปป์ไลน์ปัจจุบัน

- `pnpm protocol:gen`
  - เขียน JSON Schema (draft-07) ไปที่ `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - สร้างโมเดล Swift สำหรับ gateway
- `pnpm protocol:check`
  - รันตัวสร้างทั้งสองตัวและตรวจสอบว่าเอาต์พุตถูก commit แล้ว

## วิธีใช้สคีมาขณะรันไทม์

- **ฝั่งเซิร์ฟเวอร์**: เฟรมขาเข้าทุกเฟรมถูกตรวจสอบด้วย AJV handshake จะยอมรับเฉพาะ
  คำขอ `connect` ที่ params ตรงกับ `ConnectParams`
- **ฝั่งไคลเอ็นต์**: ไคลเอ็นต์ JS ตรวจสอบเฟรมเหตุการณ์และเฟรมการตอบกลับก่อน
  ใช้งาน
- **Feature discovery**: Gateway ส่งรายการ `features.methods`
  และ `features.events` แบบระมัดระวังใน `hello-ok` จาก `listGatewayMethods()` และ
  `GATEWAY_EVENTS`
- รายการ discovery นั้นไม่ใช่ dump ที่สร้างจาก helper ที่เรียกได้ทุกตัวใน
  `coreGatewayHandlers`; helper RPC บางรายการถูกใช้งานใน
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

การตอบกลับ Hello-ok:

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

## ไคลเอ็นต์ขั้นต่ำ (Node.js)

ลำดับการทำงานที่เล็กที่สุดแต่มีประโยชน์: connect + health

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

## ตัวอย่างแบบลงมือทำ: เพิ่มเมธอดแบบครบวงจร

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

เพิ่มทั้งสองรายการใน `ProtocolSchemas` และส่งออกชนิดข้อมูล:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **การตรวจสอบความถูกต้อง**

ใน `src/gateway/protocol/index.ts` ให้ส่งออกตัวตรวจสอบ AJV:

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

ลงทะเบียนใน `src/gateway/server-methods.ts` (ซึ่งรวม `systemHandlers` อยู่แล้ว),
จากนั้นเพิ่ม `"system.echo"` ลงในอินพุตของ `listGatewayMethods` ใน
`src/gateway/server-methods-list.ts`

หากเมธอดนี้เรียกได้โดย operator หรือไคลเอ็นต์ node ให้จัดหมวดหมู่ใน
`src/gateway/method-scopes.ts` ด้วย เพื่อให้การบังคับใช้ scope และการประกาศ feature
ใน `hello-ok` สอดคล้องกัน

4. **สร้างใหม่**

```bash
pnpm protocol:check
```

5. **การทดสอบ + เอกสาร**

เพิ่มการทดสอบเซิร์ฟเวอร์ใน `src/gateway/server.*.test.ts` และระบุเมธอดนี้ในเอกสาร

## พฤติกรรมของ Swift codegen

ตัวสร้าง Swift จะปล่อยเอาต์พุต:

- enum `GatewayFrame` ที่มีเคส `req`, `res`, `event` และ `unknown`
- structs/enums สำหรับ payload ที่มีชนิดข้อมูลชัดเจน
- ค่า `ErrorCode` และ `GATEWAY_PROTOCOL_VERSION`

ชนิดเฟรมที่ไม่รู้จักจะถูกเก็บเป็น raw payload เพื่อความเข้ากันได้ในอนาคต

## การกำหนดเวอร์ชัน + ความเข้ากันได้

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema.ts`
- ไคลเอ็นต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์จะปฏิเสธเมื่อไม่ตรงกัน
- โมเดล Swift เก็บชนิดเฟรมที่ไม่รู้จักไว้เพื่อหลีกเลี่ยงการทำให้ไคลเอ็นต์รุ่นเก่าพัง

## รูปแบบและแนวทางปฏิบัติของสคีมา

- ออบเจ็กต์ส่วนใหญ่ใช้ `additionalProperties: false` สำหรับ payload ที่เข้มงวด
- `NonEmptyString` เป็นค่าเริ่มต้นสำหรับ ID และชื่อเมธอด/เหตุการณ์
- `GatewayFrame` ระดับบนสุดใช้ **discriminator** บน `type`
- เมธอดที่มี side effect มักต้องมี `idempotencyKey` ใน params
  (ตัวอย่าง: `send`, `poll`, `agent`, `chat.send`)
- `agent` รับ `internalEvents` แบบไม่บังคับสำหรับบริบท orchestration ที่สร้างขึ้นขณะรันไทม์
  (เช่น การส่งมอบงานหลัง subagent/cron task เสร็จสิ้น); ให้ถือว่านี่เป็นพื้นผิว API ภายใน

## JSON สคีมาแบบสด

JSON Schema ที่สร้างแล้วอยู่ใน repo ที่ `dist/protocol.schema.json` โดยปกติ
ไฟล์ raw ที่เผยแพร่จะอยู่ที่:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## เมื่อคุณเปลี่ยนสคีมา

1. อัปเดตสคีมา TypeBox
2. ลงทะเบียนเมธอด/เหตุการณ์ใน `src/gateway/server-methods-list.ts`
3. อัปเดต `src/gateway/method-scopes.ts` เมื่อ RPC ใหม่ต้องจัดหมวดหมู่ scope ของ operator หรือ
   node
4. รัน `pnpm protocol:check`
5. Commit สคีมาที่สร้างใหม่ + โมเดล Swift

## ที่เกี่ยวข้อง

- [โปรโตคอล rich output](/th/reference/rich-output-protocol)
- [RPC adapters](/th/reference/rpc)
