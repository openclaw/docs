---
read_when:
    - การใช้งานหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - การสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การจับมือ, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-05-11T20:30:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

โปรโตคอล Gateway WS คือ **control plane + การขนส่งของ Node เดียว** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, UI บนเว็บ, แอป macOS, Node iOS/Android, Node แบบ headless)
เชื่อมต่อผ่าน WebSocket และประกาศ **บทบาท** + **ขอบเขต** ของตนในช่วง
handshake

## การขนส่ง

- WebSocket, เฟรมข้อความพร้อม payload แบบ JSON
- เฟรมแรก **ต้อง** เป็นคำขอ `connect`
- เฟรมก่อน connect จำกัดไว้ที่ 64 KiB หลังจาก handshake สำเร็จ ไคลเอนต์
  ควรทำตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้งาน diagnostics
  เฟรมขาเข้าที่มีขนาดเกินกำหนดและบัฟเฟอร์ขาออกที่ช้าจะปล่อยเหตุการณ์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้งเฟรมที่ได้รับผลกระทบ เหตุการณ์เหล่านี้เก็บ
  ขนาด ขีดจำกัด surface และรหัสเหตุผลที่ปลอดภัย ไม่เก็บเนื้อหาข้อความ
  เนื้อหาไฟล์แนบ เนื้อหาเฟรมดิบ token, cookie หรือค่าลับ

## Handshake (connect)

Gateway → ไคลเอนต์ (challenge ก่อน connect):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

ไคลเอนต์ → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → ไคลเอนต์:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

ขณะที่ Gateway ยังเริ่มต้น sidecar ให้เสร็จ คำขอ `connect` อาจ
ส่งคืนข้อผิดพลาด `UNAVAILABLE` ที่ลองใหม่ได้ โดยตั้งค่า `details.reason` เป็น
`"startup-sidecars"` พร้อม `retryAfterMs` ไคลเอนต์ควรลอง response นั้นใหม่
ภายในงบประมาณการเชื่อมต่อโดยรวม แทนที่จะแสดงเป็นความล้มเหลวของ
handshake ขั้นสุดท้าย

`server`, `features`, `snapshot` และ `policy` ทั้งหมดเป็นข้อมูลที่ schema
กำหนดให้มี (`src/gateway/protocol/schema/frames.ts`) `auth` ก็จำเป็นเช่นกันและรายงาน
บทบาท/ขอบเขตที่เจรจาได้ `pluginSurfaceUrls` เป็นตัวเลือก และแมปชื่อ surface ของ Plugin
เช่น `canvas` ไปยัง URL ที่โฮสต์แบบมีขอบเขต

URL surface ของ Plugin แบบมีขอบเขตอาจหมดอายุได้ Node สามารถเรียก
`node.pluginSurface.refresh` ด้วย `{ "surface": "canvas" }` เพื่อรับรายการใหม่ใน
`pluginSurfaceUrls` การ refactor Plugin Canvas แบบทดลองไม่รองรับเส้นทางความเข้ากันได้
`canvasHostUrl`, `canvasCapability` หรือ
`node.canvas.capability.refresh` ที่เลิกใช้แล้ว ไคลเอนต์ native และ
gateway ปัจจุบันต้องใช้ surface ของ Plugin

เมื่อไม่ได้ออก device token, `hello-ok.auth` จะรายงานสิทธิ์ที่เจรจาได้
โดยไม่มีฟิลด์ token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ไคลเอนต์ backend ใน process เดียวกันที่เชื่อถือได้ (`client.id: "gateway-client"`,
`client.mode: "backend"`) อาจละ `device` ได้ในการเชื่อมต่อ local loopback โดยตรงเมื่อ
ยืนยันตัวตนด้วย token/password ของ gateway ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้สำหรับ
RPC ของ control-plane ภายใน และกันไม่ให้ baseline การจับคู่ CLI/device ที่ล้าสมัย
บล็อกงาน backend ภายในเครื่อง เช่น การอัปเดต session ของ subagent ไคลเอนต์ระยะไกล
ไคลเอนต์จาก browser-origin, ไคลเอนต์ Node และไคลเอนต์ device-token/device-identity
แบบชัดเจนยังคงใช้การตรวจสอบการจับคู่และการยกระดับขอบเขตตามปกติ

เมื่อออก device token แล้ว `hello-ok` จะรวมสิ่งนี้ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ระหว่างการส่งต่อ bootstrap ที่เชื่อถือได้ `hello-ok.auth` อาจรวมรายการบทบาทแบบมีขอบเขตเพิ่มเติม
ใน `deviceTokens` ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

สำหรับ flow bootstrap ของ Node/operator ในตัว token หลักของ Node ยังคงเป็น
`scopes: []` และ token ของ operator ที่ส่งต่อจะยังคงจำกัดอยู่ใน allowlist ของ bootstrap
operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจสอบขอบเขต bootstrap ยังคง
มี prefix ตามบทบาท: รายการ operator จะตอบสนองเฉพาะคำขอของ operator และบทบาทที่ไม่ใช่ operator
ยังต้องมีขอบเขตภายใต้ prefix บทบาทของตนเอง

### ตัวอย่าง Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## การจัดเฟรม

- **คำขอ**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **เหตุการณ์**: `{type:"event", event, payload, seq?, stateVersion?}`

เมธอดที่มี side effect ต้องใช้ **idempotency keys** (ดู schema)

## บทบาท + ขอบเขต

สำหรับโมเดลขอบเขตของ operator แบบเต็ม การตรวจสอบในเวลาอนุมัติ และความหมายของ shared-secret
ดู [ขอบเขตของ Operator](/th/gateway/operator-scopes)

### บทบาท

- `operator` = ไคลเอนต์ control plane (CLI/UI/automation)
- `node` = โฮสต์ความสามารถ (camera/screen/canvas/system.run)

### ขอบเขต (operator)

ขอบเขตทั่วไป:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` พร้อม `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)

เมธอด RPC ของ gateway ที่ Plugin ลงทะเบียนอาจขอขอบเขต operator ของตนเองได้ แต่
prefix ผู้ดูแลระบบหลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะ resolve เป็น `operator.admin` เสมอ

ขอบเขตของเมธอดเป็นเพียงด่านแรก คำสั่ง slash บางรายการที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจสอบระดับคำสั่งที่เข้มงวดกว่าเพิ่มเติม ตัวอย่างเช่น การเขียน
`/config set` และ `/config unset` แบบถาวรต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบขอบเขตเพิ่มเติมในเวลาอนุมัติ นอกเหนือจาก
ขอบเขตเมธอดพื้นฐาน:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มีคำสั่ง Node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่รวม `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node ประกาศการอ้างสิทธิ์ความสามารถในเวลา connect:

- `caps`: หมวดหมู่ความสามารถระดับสูง เช่น `camera`, `canvas`, `screen`,
  `location`, `voice` และ `talk`
- `commands`: allowlist ของคำสั่งสำหรับ invoke
- `permissions`: toggle แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือว่าสิ่งเหล่านี้เป็น **การอ้างสิทธิ์** และบังคับใช้ allowlist ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` ส่งคืนรายการที่ key ตามตัวตนอุปกรณ์
- รายการ presence รวม `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงหนึ่งแถวต่ออุปกรณ์ได้
  แม้เมื่ออุปกรณ์เชื่อมต่อเป็นทั้ง **operator** และ **node**
- `node.list` รวมฟิลด์ตัวเลือก `lastSeenAtMs` และ `lastSeenReason` Node ที่เชื่อมต่ออยู่จะรายงาน
  เวลาการเชื่อมต่อปัจจุบันเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; Node ที่จับคู่แล้วสามารถรายงาน
  presence เบื้องหลังที่คงทนได้เช่นกันเมื่อเหตุการณ์ Node ที่เชื่อถือได้อัปเดต metadata การจับคู่ของตน

### เหตุการณ์ Node background alive

Node อาจเรียก `node.event` ด้วย `event: "node.presence.alive"` เพื่อบันทึกว่า Node ที่จับคู่แล้ว
ยัง alive ระหว่างการ wake เบื้องหลัง โดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น enum แบบปิด: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` สตริง trigger ที่ไม่รู้จักจะถูก normalize เป็น
`background` โดย gateway ก่อน persistence เหตุการณ์จะคงทนเฉพาะสำหรับ session อุปกรณ์ Node
ที่ยืนยันตัวตนแล้วเท่านั้น; session ที่ไม่มีอุปกรณ์หรือไม่ได้จับคู่จะส่งคืน `handled: false`

gateway ที่สำเร็จจะส่งคืนผลลัพธ์แบบมีโครงสร้าง:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

gateway รุ่นเก่าอาจยังส่งคืน `{ "ok": true }` สำหรับ `node.event`; ไคลเอนต์ควรถือว่านั่นเป็น
RPC ที่ได้รับการยืนยันแล้ว ไม่ใช่ persistence ของ presence ที่คงทน

## การกำหนดขอบเขตเหตุการณ์ broadcast

เหตุการณ์ broadcast ของ WebSocket ที่เซิร์ฟเวอร์ push จะถูก gate ด้วยขอบเขต เพื่อไม่ให้ session ที่จำกัดเฉพาะการจับคู่หรือเฉพาะ Node รับเนื้อหา session แบบ passively

- **เฟรม chat, agent และ tool-result** (รวมถึงเหตุการณ์ `agent` แบบ streamed และผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` Session ที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcast `plugin.*` ที่ Plugin กำหนด** จะถูก gate เป็น `operator.write` หรือ `operator.admin` ขึ้นอยู่กับวิธีที่ Plugin ลงทะเบียนไว้
- **เหตุการณ์สถานะและการขนส่ง** (`heartbeat`, `presence`, `tick`, lifecycle connect/disconnect ฯลฯ) ยังคงไม่ถูกจำกัดเพื่อให้ทุก session ที่ยืนยันตัวตนแล้วสังเกตสุขภาพของการขนส่งได้
- **กลุ่มเหตุการณ์ broadcast ที่ไม่รู้จัก** จะถูก gate ด้วยขอบเขตโดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนปรนอย่างชัดเจน

การเชื่อมต่อไคลเอนต์แต่ละรายการเก็บหมายเลขลำดับแบบต่อไคลเอนต์ของตัวเอง เพื่อให้ broadcast รักษาลำดับแบบเพิ่มขึ้นบน socket นั้น แม้ว่าไคลเอนต์แต่ละรายจะเห็น subset ของ event stream ที่ถูกกรองตามขอบเขตแตกต่างกัน

## กลุ่มเมธอด RPC ทั่วไป

surface WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ข้างต้น นี่
ไม่ใช่ dump ที่สร้างขึ้น — `hello-ok.features.methods` เป็นรายการ discovery
แบบอนุรักษ์นิยมที่สร้างจาก `src/gateway/server-methods-list.ts` รวมกับ export เมธอดของ
Plugin/channel ที่โหลดแล้ว ให้ถือว่าเป็น feature discovery ไม่ใช่
การแจกแจงแบบเต็มของ `src/gateway/server-methods/*.ts`

<AccordionGroup>
  <Accordion title="ระบบและตัวตน">
    - `health` ส่งคืน snapshot สุขภาพของ gateway ที่ cache ไว้หรือ probe ใหม่
    - `diagnostics.stability` ส่งคืนตัวบันทึกเสถียรภาพ diagnostics แบบมีขอบเขตล่าสุด โดยเก็บ metadata เชิงปฏิบัติการ เช่น ชื่อเหตุการณ์ จำนวน ขนาด byte การอ่านหน่วยความจำ สถานะ queue/session ชื่อ channel/plugin และ id ของ session ไม่เก็บข้อความ chat, webhook body, output ของ tool, body คำขอหรือ response ดิบ, token, cookie หรือค่าลับ ต้องใช้ขอบเขต operator read
    - `status` ส่งคืนสรุป gateway แบบ `/status`; ฟิลด์อ่อนไหวจะถูกรวมเฉพาะสำหรับไคลเอนต์ operator ที่มีขอบเขต admin
    - `gateway.identity.get` ส่งคืนตัวตนอุปกรณ์ของ gateway ที่ใช้โดย flow relay และ pairing
    - `system-presence` ส่งคืน snapshot presence ปัจจุบันสำหรับอุปกรณ์ operator/node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่มเหตุการณ์ระบบและสามารถอัปเดต/broadcast บริบท presence ได้
    - `last-heartbeat` ส่งคืนเหตุการณ์ Heartbeat ล่าสุดที่ persist ไว้
    - `set-heartbeats` toggle การประมวลผล Heartbeat บน gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแค็ตตาล็อกโมเดลที่รันไทม์อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าแล้วในขนาดพอดีกับตัวเลือก (`agents.defaults.models` ก่อน แล้วตามด้วย `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแค็ตตาล็อกทั้งหมด
    - `usage.status` ส่งคืนหน้าต่างการใช้งานของผู้ให้บริการ/สรุปโควตาที่เหลือ
    - `usage.cost` ส่งคืนสรุปการใช้งานต้นทุนที่รวบรวมแล้วสำหรับช่วงวันที่
    - `doctor.memory.status` ส่งคืนความพร้อมของ vector-memory / embedding ที่แคชไว้สำหรับพื้นที่ทำงานของเอเจนต์เริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจน
    - `doctor.memory.remHarness` ส่งคืนตัวอย่าง REM harness แบบอ่านอย่างเดียวที่มีขอบเขตจำกัดสำหรับไคลเอนต์ระนาบควบคุมระยะไกล โดยอาจรวมถึงพาธพื้นที่ทำงาน ชิ้นส่วนหน่วยความจำ มาร์กดาวน์ที่ยึดโยงและเรนเดอร์แล้ว และตัวเลือกสำหรับการเลื่อนระดับเชิงลึก ดังนั้นผู้เรียกต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานรายเซสชัน
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบอนุกรมเวลาสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="ช่องทางและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะช่องทาง/Plugin ในตัว + ที่บันเดิลมา
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีเฉพาะที่ช่องทางรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบผ่าน QR/เว็บสำหรับผู้ให้บริการช่องทางเว็บปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบผ่าน QR/เว็บนั้นเสร็จสมบูรณ์ และเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง Node iOS ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืนทริกเกอร์ wake-word ที่จัดเก็บไว้
    - `voicewake.set` อัปเดตทริกเกอร์ wake-word และกระจายการเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การส่งข้อความและบันทึก">
    - `send` คือ RPC การส่งออกโดยตรงสำหรับการส่งที่ระบุช่องทาง/บัญชี/thread นอกตัวรันแชต
    - `logs.tail` ส่งคืน tail บันทึกไฟล์ Gateway ที่กำหนดค่าไว้ พร้อมการควบคุม cursor/limit และจำนวนไบต์สูงสุด

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.catalog` ส่งคืนแค็ตตาล็อกผู้ให้บริการ Talk แบบอ่านอย่างเดียวสำหรับเสียงพูด การถอดเสียงแบบสตรีม และเสียงแบบเรียลไทม์ โดยรวมถึงรหัสผู้ให้บริการ ป้ายกำกับ สถานะที่กำหนดค่าไว้ รหัสโมเดล/เสียงที่เปิดเผย โหมดมาตรฐาน การขนส่ง กลยุทธ์สมอง และแฟล็กเสียง/ความสามารถแบบเรียลไทม์ โดยไม่ส่งคืนความลับของผู้ให้บริการหรือเปลี่ยนแปลงค่ากำหนดส่วนกลาง
    - `talk.config` ส่งคืน payload ค่ากำหนด Talk ที่มีผลจริง; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.session.create` สร้างเซสชัน Talk ที่ Gateway เป็นเจ้าของสำหรับ `realtime/gateway-relay`, `transcription/gateway-relay` หรือ `stt-tts/managed-room` `brain: "direct-tools"` ต้องใช้ `operator.admin`
    - `talk.session.join` ตรวจสอบโทเค็นเซสชัน managed-room ปล่อยเหตุการณ์ `session.ready` หรือ `session.replaced` ตามความจำเป็น และส่งคืนเมทาดาทาห้อง/เซสชันพร้อมเหตุการณ์ Talk ล่าสุดโดยไม่มีโทเค็นข้อความธรรมดาหรือแฮชโทเค็นที่จัดเก็บไว้
    - `talk.session.appendAudio` เพิ่มเสียงอินพุต PCM แบบ base64 ต่อท้ายในเซสชันรีเลย์เรียลไทม์และเซสชันถอดเสียงที่ Gateway เป็นเจ้าของ
    - `talk.session.startTurn`, `talk.session.endTurn` และ `talk.session.cancelTurn` ขับเคลื่อนวงจรชีวิต turn ของ managed-room พร้อมการปฏิเสธ turn ที่ค้างเก่าก่อนล้างสถานะ
    - `talk.session.cancelOutput` หยุดเอาต์พุตเสียงของผู้ช่วย โดยหลักใช้สำหรับการแทรกพูดที่ควบคุมด้วย VAD ในเซสชันรีเลย์ Gateway
    - `talk.session.submitToolResult` ทำให้การเรียกเครื่องมือของผู้ให้บริการที่ปล่อยโดยเซสชันรีเลย์เรียลไทม์ที่ Gateway เป็นเจ้าของเสร็จสมบูรณ์ ส่ง `options: { willContinue: true }` สำหรับเอาต์พุตเครื่องมือชั่วคราวเมื่อจะมีผลลัพธ์สุดท้ายตามมา หรือ `options: { suppressResponse: true }` เมื่อผลลัพธ์เครื่องมือควรตอบสนองการเรียกของผู้ให้บริการโดยไม่เริ่มการตอบกลับผู้ช่วยแบบเรียลไทม์อีกครั้ง
    - `talk.session.close` ปิดเซสชันรีเลย์ การถอดเสียง หรือ managed-room ที่ Gateway เป็นเจ้าของ และปล่อยเหตุการณ์ Talk ปลายทาง
    - `talk.mode` ตั้งค่า/กระจายสถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.client.create` สร้างเซสชันผู้ให้บริการเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของโดยใช้ `webrtc` หรือ `provider-websocket` ขณะที่ Gateway เป็นเจ้าของค่ากำหนด ข้อมูลรับรอง คำสั่ง และนโยบายเครื่องมือ
    - `talk.client.toolCall` ให้การขนส่งเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของส่งต่อการเรียกเครื่องมือของผู้ให้บริการไปยังนโยบาย Gateway เครื่องมือแรกที่รองรับคือ `openclaw_agent_consult`; ไคลเอนต์รับรหัสการรันและรอเหตุการณ์วงจรชีวิตแชตปกติก่อนส่งผลลัพธ์เครื่องมือเฉพาะผู้ให้บริการ
    - `talk.event` คือช่องทางเหตุการณ์ Talk เดียวสำหรับอะแดปเตอร์เรียลไทม์ การถอดเสียง STT/TTS, managed-room, โทรศัพท์ และการประชุม
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะการเปิดใช้ TTS ผู้ให้บริการที่ใช้งานอยู่ ผู้ให้บริการสำรอง และสถานะค่ากำหนดผู้ให้บริการ
    - `tts.providers` ส่งคืนคลังผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะค่ากำหนด TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงแบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ ค่ากำหนด การอัปเดต และวิซาร์ด">
    - `secrets.reload` แก้ไข SecretRefs ที่ใช้งานอยู่อีกครั้งและสลับสถานะความลับของรันไทม์เฉพาะเมื่อสำเร็จทั้งหมด
    - `secrets.resolve` แก้ไขการกำหนดความลับเป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายเฉพาะ
    - `config.get` ส่งคืน snapshot และแฮชของค่ากำหนดปัจจุบัน
    - `config.set` เขียน payload ค่ากำหนดที่ผ่านการตรวจสอบแล้ว
    - `config.patch` ผสานการอัปเดตค่ากำหนดบางส่วน
    - `config.apply` ตรวจสอบ + แทนที่ payload ค่ากำหนดทั้งหมด
    - `config.schema` ส่งคืน payload สคีมาค่ากำหนดสดที่ใช้โดยเครื่องมือ Control UI และ CLI: สคีมา, `uiHints`, เวอร์ชัน และเมทาดาทาการสร้าง รวมถึงเมทาดาทาสคีมา Plugin + ช่องทางเมื่อรันไทม์โหลดได้ สคีมามีเมทาดาทาฟิลด์ `title` / `description` ที่ได้มาจากป้ายกำกับและข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึงกิ่งองค์ประกอบของออบเจ็กต์ซ้อน wildcard รายการอาร์เรย์ และ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืน payload การค้นหาที่จำกัดตามพาธสำหรับพาธค่ากำหนดหนึ่งรายการ: พาธที่ทำให้เป็นมาตรฐานแล้ว โหนดสคีมาแบบตื้น hint ที่ตรงกัน + `hintPath` และสรุปลูกโดยตรงสำหรับการเจาะลึกใน UI/CLI โหนดสคีมาการค้นหาคงเอกสารที่ผู้ใช้เห็นและฟิลด์การตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขต numeric/string/array/object และแฟล็กอย่าง `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกเปิดเผย `key`, `path` ที่ทำให้เป็นมาตรฐานแล้ว, `type`, `required`, `hasChildren` รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รันโฟลว์อัปเดต Gateway และกำหนดเวลาการรีสตาร์ทเฉพาะเมื่อการอัปเดตเองสำเร็จ; ผู้เรียกที่มีเซสชันสามารถใส่ `continuationMessage` เพื่อให้ตอนเริ่มต้นระบบกลับมาดำเนิน turn ของเอเจนต์ถัดไปหนึ่งครั้งผ่านคิวการต่อเนื่องหลังรีสตาร์ท การอัปเดตผ่านตัวจัดการแพ็กเกจบังคับให้รีสตาร์ทอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังสลับแพ็กเกจ เพื่อไม่ให้กระบวนการ Gateway เก่ายังคง lazy-load จากต้นไม้ `dist` ที่ถูกแทนที่
    - `update.status` ส่งคืน sentinel การรีสตาร์ทอัปเดตที่แคชล่าสุด รวมถึงเวอร์ชันที่กำลังรันหลังรีสตาร์ทเมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผยวิซาร์ด onboarding ผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วยเอเจนต์และพื้นที่ทำงาน">
    - `agents.list` ส่งคืนรายการเอเจนต์ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลจริงและเมทาดาทารันไทม์
    - `agents.create`, `agents.update` และ `agents.delete` จัดการเรคคอร์ดเอเจนต์และการเชื่อมต่อพื้นที่ทำงาน
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการไฟล์พื้นที่ทำงาน bootstrap ที่เปิดเผยสำหรับเอเจนต์
    - `tasks.list`, `tasks.get` และ `tasks.cancel` เปิดเผยบัญชีงาน Gateway ให้ไคลเอนต์ SDK และผู้ปฏิบัติการ
    - `artifacts.list`, `artifacts.get` และ `artifacts.download` เปิดเผยสรุปและดาวน์โหลด artifact ที่ได้จาก transcript สำหรับขอบเขต `sessionKey`, `runId` หรือ `taskId` ที่ระบุอย่างชัดเจน คำค้นหารันและงานจะแก้ไขเซสชันเจ้าของฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อ transcript ที่มีแหล่งที่มาตรงกัน; แหล่ง URL ที่ไม่ปลอดภัยหรือเป็น local จะส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการ fetch ฝั่งเซิร์ฟเวอร์
    - `environments.list` และ `environments.status` เปิดเผยการค้นพบสภาพแวดล้อมแบบอ่านอย่างเดียวที่เป็น Gateway-local และ Node สำหรับไคลเอนต์ SDK
    - `agent.identity.get` ส่งคืนอัตลักษณ์ผู้ช่วยที่มีผลจริงสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้การรันเสร็จสิ้นและส่งคืน snapshot ปลายทางเมื่อมี

  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึงเมทาดาทา `agentRuntime` ต่อแถวเมื่อกำหนดค่าแบ็กเอนด์รันไทม์เอเจนต์ไว้
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับเหตุการณ์ transcript/ข้อความสำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนตัวอย่าง transcript ที่มีขอบเขตจำกัดสำหรับคีย์เซสชันเฉพาะ
    - `sessions.describe` ส่งคืนแถวเซสชัน Gateway หนึ่งแถวสำหรับคีย์เซสชันที่ตรงกันทุกประการ
    - `sessions.resolve` แก้ไขหรือทำให้เป้าหมายเซสชันเป็นมาตรฐาน
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปในเซสชันที่มีอยู่
    - `sessions.steer` คือรูปแบบ interrupt-and-steer สำหรับเซสชันที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่เป็นทางเลือก หรือส่งเฉพาะ `runId` สำหรับการรันที่ใช้งานอยู่ซึ่ง Gateway สามารถแก้ไขเป็นเซสชันได้
    - `sessions.patch` อัปเดตเมทาดาทา/การ override ของเซสชัน และรายงานโมเดลมาตรฐานที่แก้ไขแล้วพร้อม `agentRuntime` ที่มีผลจริง
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ดำเนินการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้ทั้งหมด
    - การดำเนินการแชตยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` `chat.history` ถูกปรับให้เป็นมาตรฐานสำหรับการแสดงผลแก่ไคลเอนต์ UI: แท็ก directive แบบ inline จะถูกลบออกจากข้อความที่มองเห็น, payload XML ของการเรียกเครื่องมือแบบข้อความธรรมดา (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) และโทเค็นควบคุมโมเดล ASCII/full-width ที่รั่วไหลจะถูกลบออก, แถวผู้ช่วยที่เป็นโทเค็นเงียบล้วน เช่น `NO_REPLY` / `no_reply` ที่ตรงกันทุกประการจะถูกละไว้ และแถวที่มีขนาดใหญ่เกินไปสามารถถูกแทนที่ด้วย placeholders

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และโทเค็นอุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วที่รอดำเนินการและอนุมัติแล้ว
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการเรคคอร์ดการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่อนุมัติและขอบเขตผู้เรียก
    - `device.token.revoke` เพิกถอนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่อนุมัติและขอบเขตผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่ Node, invoke และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` และ `node.pair.verify` ครอบคลุมการจับคู่ Node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` ส่งคืนสถานะ Node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับ Node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง Node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอ invoke
    - `node.event` นำเหตุการณ์ที่เกิดจาก Node กลับเข้าสู่ Gateway
    - `node.pending.pull` และ `node.pending.ack` คือ API คิวของ Node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบคงทนสำหรับ Node ที่ออฟไลน์/ตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="กลุ่มการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว พร้อมการค้นหา/เล่นซ้ำการอนุมัติที่ค้างอยู่
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่ค้างอยู่หนึ่งรายการ และส่งคืนผลการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการสแนปชอตนโยบายการอนุมัติ exec ของ gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec เฉพาะ Node ผ่านคำสั่ง relay ของ Node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่ Plugin กำหนด

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ, Skills และเครื่องมือ">
    - ระบบอัตโนมัติ: `wake` จัดกำหนดการแทรกข้อความปลุกทันทีหรือใน Heartbeat ถัดไป; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่ตั้งเวลาไว้
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### กลุ่มเหตุการณ์ทั่วไป

- `chat`: การอัปเดตแชตใน UI เช่น `chat.inject` และเหตุการณ์แชตอื่นๆ
  ที่มีเฉพาะบันทึกการสนทนา
- `session.message` และ `session.tool`: การอัปเดตบันทึกการสนทนา/สตรีมเหตุการณ์สำหรับ
  เซสชันที่สมัครรับข้อมูล
- `sessions.changed`: ดัชนีเซสชันหรือเมทาดาทามีการเปลี่ยนแปลง
- `presence`: การอัปเดตสแนปชอตสถานะระบบ
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดตสแนปชอตสถานะสุขภาพของ gateway
- `heartbeat`: การอัปเดตสตรีมเหตุการณ์ Heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลงงาน/การรัน Cron
- `shutdown`: การแจ้งเตือนการปิด Gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ Node
- `node.invoke.request`: การกระจายคำขอ invoke ของ Node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตอุปกรณ์ที่จับคู่
- `voicewake.changed`: ค่ากำหนดทริกเกอร์คำปลุกมีการเปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ Plugin

### เมธอดตัวช่วยของ Node

- Node อาจเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของไฟล์ปฏิบัติการ Skill
  สำหรับการตรวจสอบ auto-allow

### RPC ของบัญชีรายการงาน

ไคลเอนต์ผู้ปฏิบัติงานสามารถตรวจสอบและยกเลิกระเบียนงานเบื้องหลังของ Gateway ผ่าน
RPC ของบัญชีรายการงาน เมธอดเหล่านี้ส่งคืนสรุปงานที่ผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่
สถานะรันไทม์ดิบ

- `tasks.list` ต้องใช้ `operator.read`
  - พารามิเตอร์: `status` ที่ไม่บังคับ (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` หรือ `"timed_out"`) หรืออาร์เรย์ของสถานะเหล่านั้น,
    `agentId` ที่ไม่บังคับ, `sessionKey` ที่ไม่บังคับ, `limit` ที่ไม่บังคับตั้งแต่ `1` ถึง
    `500` และสตริง `cursor` ที่ไม่บังคับ
  - ผลลัพธ์: `{ "tasks": TaskSummary[], "nextCursor"?: string }`
- `tasks.get` ต้องใช้ `operator.read`
  - พารามิเตอร์: `{ "taskId": string }`
  - ผลลัพธ์: `{ "task": TaskSummary }`
  - id งานที่ไม่มีอยู่จะส่งคืนรูปแบบข้อผิดพลาด not-found ของ Gateway
- `tasks.cancel` ต้องใช้ `operator.write`
  - พารามิเตอร์: `{ "taskId": string, "reason"?: string }`
  - ผลลัพธ์:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`
  - `found` รายงานว่าบัญชีรายการมีงานที่ตรงกันหรือไม่ `cancelled`
    รายงานว่ารันไทม์ยอมรับหรือบันทึกการยกเลิกหรือไม่

`TaskSummary` มี `id`, `status` และเมทาดาทาที่ไม่บังคับ เช่น `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, ความคืบหน้า,
สรุปปลายทาง และข้อความข้อผิดพลาดที่ผ่านการทำให้ปลอดภัยแล้ว

### เมธอดตัวช่วยของผู้ปฏิบัติงาน

- ผู้ปฏิบัติงานอาจเรียก `commands.list` (`operator.read`) เพื่อดึงคลังคำสั่งรันไทม์
  สำหรับ agent
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านพื้นที่ทำงาน agent เริ่มต้น
  - `scope` ควบคุมว่า `name` หลักจะกำหนดเป้าหมายพื้นผิวใด:
    - `text` ส่งคืนโทเคนคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และพาธเริ่มต้น `both` ส่งคืนชื่อแบบ native ที่รับรู้ provider
      เมื่อมีให้ใช้
  - `textAliases` มี alias เครื่องหมายทับแบบตรงตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่ง native ที่รับรู้ provider เมื่อมีอยู่
  - `provider` เป็นตัวเลือก และมีผลเฉพาะต่อการตั้งชื่อแบบ native รวมถึงความพร้อมใช้งานของคำสั่ง Plugin
    แบบ native
  - `includeArgs=false` ละเมทาดาทาอาร์กิวเมนต์ที่ serialize แล้วจากการตอบกลับ
- ผู้ปฏิบัติงานอาจเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือรันไทม์สำหรับ
  agent การตอบกลับมีเครื่องมือที่จัดกลุ่มแล้วและเมทาดาทา provenance:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: เครื่องมือ Plugin เป็นตัวเลือกหรือไม่
- ผู้ปฏิบัติงานอาจเรียก `tools.effective` (`operator.read`) เพื่อดึงคลังเครื่องมือที่มีผลในรันไทม์
  สำหรับเซสชัน
  - ต้องระบุ `sessionKey`
  - gateway อนุมานบริบทรันไทม์ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนที่จะยอมรับ
    บริบทการตรวจสอบสิทธิ์หรือการส่งมอบที่ผู้เรียกส่งมา
  - การตอบกลับอยู่ในขอบเขตเซสชันและสะท้อนสิ่งที่บทสนทนาที่ใช้งานอยู่สามารถใช้ได้ในตอนนี้
    รวมถึงเครื่องมือ core, Plugin และ channel
- ผู้ปฏิบัติงานอาจเรียก `tools.invoke` (`operator.write`) เพื่อ invoke เครื่องมือที่พร้อมใช้งานหนึ่งรายการผ่าน
  พาธนโยบาย gateway เดียวกับ `/tools/invoke`
  - ต้องระบุ `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ
    `idempotencyKey` เป็นตัวเลือก
  - หากมีทั้ง `sessionKey` และ `agentId` agent ของเซสชันที่ resolve แล้วต้องตรงกับ
    `agentId`
  - การตอบกลับเป็น envelope สำหรับ SDK ที่มี `ok`, `toolName`, `output` ที่ไม่บังคับ และฟิลด์
    `error` แบบมีชนิด การปฏิเสธจากการอนุมัติหรือนโยบายจะส่งคืน `ok:false` ใน payload แทนที่จะ
    ข้าม pipeline นโยบายเครื่องมือของ gateway
- ผู้ปฏิบัติงานอาจเรียก `skills.status` (`operator.read`) เพื่อดึงคลัง Skill
  ที่มองเห็นได้สำหรับ agent
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านพื้นที่ทำงาน agent เริ่มต้น
  - การตอบกลับมีคุณสมบัติความพร้อมใช้งาน ข้อกำหนดที่ขาดหาย การตรวจสอบค่ากำหนด และ
    ตัวเลือกการติดตั้งที่ผ่านการทำให้ปลอดภัยแล้ว โดยไม่เปิดเผยค่าความลับดิบ
- ผู้ปฏิบัติงานอาจเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ
  เมทาดาทาการค้นพบ ClawHub
- ผู้ปฏิบัติงานอาจเรียก `skills.upload.begin`, `skills.upload.chunk` และ
  `skills.upload.commit` (`operator.admin`) เพื่อ stage archive Skill ส่วนตัว
  ก่อนติดตั้ง นี่เป็นพาธอัปโหลดสำหรับ admin แยกต่างหากสำหรับไคลเอนต์ที่เชื่อถือได้
  ไม่ใช่โฟลว์ติดตั้ง Skill ของ ClawHub ตามปกติ และถูกปิดใช้งานโดยค่าเริ่มต้น เว้นแต่
  `skills.install.allowUploadedArchives` จะเปิดใช้งาน
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    สร้างการอัปโหลดที่ผูกกับ slug และค่า force นั้น
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` ต่อท้ายไบต์ที่
    offset ที่ถอดรหัสแล้วแบบตรงตัว
  - `skills.upload.commit({ uploadId, sha256? })` ตรวจสอบขนาดสุดท้ายและ
    SHA-256 การ commit เพียงทำให้การอัปโหลดเสร็จสมบูรณ์เท่านั้น; ไม่ได้ติดตั้ง Skill
  - archive Skill ที่อัปโหลดเป็น archive zip ที่มีราก `SKILL.md` ชื่อไดเรกทอรีภายในของ
    archive จะไม่เลือกเป้าหมายการติดตั้ง
- ผู้ปฏิบัติงานอาจเรียก `skills.install` (`operator.admin`) ได้สามโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้ง
    โฟลเดอร์ Skill ลงในไดเรกทอรี `skills/` ของพื้นที่ทำงาน agent เริ่มต้น
  - โหมดอัปโหลด: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    ติดตั้งการอัปโหลดที่ commit แล้วลงในไดเรกทอรี `skills/<slug>`
    ของพื้นที่ทำงาน agent เริ่มต้น slug และค่า force ต้องตรงกับคำขอ
    `skills.upload.begin` เดิม โหมดนี้จะถูกปฏิเสธ เว้นแต่
    `skills.install.allowUploadedArchives` จะเปิดใช้งาน การตั้งค่านี้ไม่มีผลต่อ
    การติดตั้ง ClawHub
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    รัน action `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ gateway
- ผู้ปฏิบัติงานอาจเรียก `skills.update` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามหนึ่งรายการหรือการติดตั้ง ClawHub ที่ติดตามทั้งหมดใน
    พื้นที่ทำงาน agent เริ่มต้น
  - โหมดค่ากำหนด patch ค่า `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` รับพารามิเตอร์ `view` ที่ไม่บังคับ:

- ละไว้หรือ `"default"`: พฤติกรรมรันไทม์ปัจจุบัน หากกำหนดค่า `agents.defaults.models` ไว้ การตอบกลับคือแค็ตตาล็อกที่อนุญาต รวมถึงโมเดลที่ค้นพบแบบไดนามิกสำหรับรายการ `provider/*` มิฉะนั้นการตอบกลับคือแค็ตตาล็อก Gateway ทั้งหมด
- `"configured"`: พฤติกรรมขนาดเหมาะกับตัวเลือก หากกำหนดค่า `agents.defaults.models` ไว้ ค่านั้นยังมีผลเหนือกว่า รวมถึงการค้นพบในขอบเขต provider สำหรับรายการ `provider/*` หากไม่มี allowlist การตอบกลับจะใช้รายการ `models.providers.*.models` แบบชัดเจน และ fallback ไปยังแค็ตตาล็อกทั้งหมดเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แค็ตตาล็อก Gateway ทั้งหมด โดยข้าม `agents.defaults.models` ใช้สำหรับ UI การวินิจฉัยและการค้นพบ ไม่ใช่ตัวเลือกโมเดลปกติ

## การอนุมัติ exec

- เมื่อคำขอ exec ต้องการการอนุมัติ gateway จะกระจาย `exec.approval.requested`
- ไคลเอนต์ผู้ปฏิบัติงาน resolve โดยเรียก `exec.approval.resolve` (ต้องใช้ scope `operator.approvals`)
- สำหรับ `host=node`, `exec.approval.request` ต้องมี `systemRunPlan` (ข้อมูลเมทาดาทา `argv`/`cwd`/`rawCommand`/session แบบ canonical) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังอนุมัติ การเรียก `node.invoke system.run` ที่ส่งต่อจะใช้ `systemRunPlan` แบบ canonical นั้นซ้ำ
  เป็นบริบทคำสั่ง/cwd/session ที่มีอำนาจ
- หากผู้เรียกกลายพันธุ์ `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่างการเตรียมและการส่งต่อ `system.run` ที่ได้รับอนุมัติขั้นสุดท้าย
  gateway จะปฏิเสธการรัน แทนที่จะเชื่อถือ payload ที่ถูกกลายพันธุ์

## fallback การส่งมอบของ agent

- คำขอ `agent` สามารถมี `deliver=true` เพื่อขอการส่งมอบขาออก
- `bestEffortDeliver=false` คงพฤติกรรมเข้มงวด: เป้าหมายการส่งมอบที่ resolve ไม่ได้หรือเป็น internal-only จะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback ไปยังการดำเนินการเฉพาะเซสชันเมื่อไม่สามารถ resolve เส้นทางภายนอกที่ส่งมอบได้ (เช่น เซสชัน internal/webchat หรือค่ากำหนดหลาย channel ที่คลุมเครือ)
- ผลลัพธ์ `agent` สุดท้ายอาจมี `result.deliveryStatus` เมื่อมีการขอการส่งมอบ
  โดยใช้สถานะ `sent`, `suppressed`, `partial_failed` และ `failed`
  เดียวกับที่บันทึกไว้สำหรับ [`openclaw agent --json --deliver`](/th/cli/agent#json-delivery-status)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/version.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธช่วงที่
  ไม่รวม protocol ปัจจุบันของตน ไคลเอนต์ native ใช้ขอบเขตล่าง v3 เพื่อให้
  ไคลเอนต์ v4 แบบเพิ่มได้ยังคงเข้าถึง gateway v3 ได้
- Schema + model ถูกสร้างจากนิยาม TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

ไคลเอนต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่ามีความ
เสถียรตลอด protocol v4 และเป็น baseline ที่คาดไว้สำหรับไคลเอนต์บุคคลที่สาม

| ค่าคงที่                                  | ค่าเริ่มต้น                                               | แหล่งที่มา                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| ระยะหมดเวลาคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| ระยะหมดเวลา Preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่มงบประมาณ server/client ที่จับคู่กันได้) |
| ระยะ backoff การเชื่อมต่อใหม่เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| ระยะ backoff การเชื่อมต่อใหม่สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| ขีดจำกัด fast-retry หลังปิด device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ระยะผ่อนผัน force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| ระยะหมดเวลาเริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| การปิดจาก tick-timeout                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

server ประกาศค่า `policy.tickIntervalMs`, `policy.maxPayload`,
และ `policy.maxBufferedBytes` ที่มีผลจริงใน `hello-ok`; client ควรปฏิบัติตามค่าเหล่านั้น
แทนค่าเริ่มต้นก่อน handshake

## การยืนยันตัวตน

- การยืนยันตัวตน Gateway แบบ shared-secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมดการยืนยันตัวตนที่กำหนดค่าไว้
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ
  `gateway.auth.mode: "trusted-proxy"` ที่ไม่ใช่ loopback
  จะผ่านการตรวจสอบการยืนยันตัวตนสำหรับ connect จาก
  request headers แทน `connect.params.auth.*`
- `gateway.auth.mode: "none"` สำหรับ private-ingress จะข้ามการยืนยันตัวตนแบบ shared-secret สำหรับ connect
  ทั้งหมด; อย่าเปิดเผยโหมดนั้นบน ingress สาธารณะหรือไม่น่าเชื่อถือ
- หลังการจับคู่ Gateway จะออก **device token** ที่จำกัดขอบเขตตาม
  role + scopes ของการเชื่อมต่อ ค่านี้จะถูกส่งคืนใน `hello-ok.auth.deviceToken` และ client ควร
  เก็บไว้เพื่อใช้ในการเชื่อมต่อในอนาคต
- client ควรเก็บ `hello-ok.auth.deviceToken` หลักหลังจาก
  connect สำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วย device token ที่ **เก็บไว้** นั้นควรใช้ชุด scope ที่อนุมัติแล้วซึ่งเก็บไว้
  สำหรับ token นั้นซ้ำด้วย วิธีนี้จะรักษาสิทธิ์เข้าถึง read/probe/status
  ที่ได้รับอนุญาตแล้ว และหลีกเลี่ยงการย่อขอบเขตการเชื่อมต่อใหม่อย่างเงียบ ๆ เป็น
  scope แบบ admin-only โดยนัยที่แคบกว่า
- การประกอบการยืนยันตัวตนสำหรับ connect ฝั่ง client (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากส่วนอื่นและจะถูกส่งต่อเสมอเมื่อมีการตั้งค่า
  - `auth.token` ถูกเติมค่าตามลำดับความสำคัญ: shared token ที่ระบุอย่างชัดเจนก่อน,
    จากนั้น `deviceToken` ที่ระบุอย่างชัดเจน, แล้วจึงเป็น per-device token ที่เก็บไว้ (ผูกด้วย
    `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อไม่มีรายการข้างต้นแก้เป็น
    `auth.token` ได้ shared token หรือ device token ใด ๆ ที่แก้ได้จะระงับค่านี้
  - การเลื่อนขั้นอัตโนมัติของ device token ที่เก็บไว้ในการลองซ้ำแบบ one-shot
    `AUTH_TOKEN_MISMATCH` ถูกจำกัดให้ทำได้กับ **endpoint ที่เชื่อถือได้เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบ pinned `wss://`
    สาธารณะที่ไม่มีการ pin จะไม่เข้าเกณฑ์
- รายการ `hello-ok.auth.deviceTokens` เพิ่มเติมคือ token สำหรับ bootstrap handoff
  เก็บรายการเหล่านี้ไว้เฉพาะเมื่อ connect ใช้ bootstrap auth บน transport ที่เชื่อถือได้
  เช่น `wss://` หรือการจับคู่แบบ loopback/local
- หาก client ระบุ `deviceToken` หรือ `scopes` อย่าง **ชัดเจน** ชุด scope ที่
  ผู้เรียกขอยังคงเป็นแหล่งอ้างอิงหลัก; cached scopes จะถูกนำกลับมาใช้เฉพาะ
  เมื่อ client กำลังใช้ per-device token ที่เก็บไว้ซ้ำ
- device token สามารถหมุนเวียน/เพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องมี scope `operator.pairing`)
- `device.token.rotate` ส่งคืน metadata การหมุนเวียน โดยจะ echo replacement
  bearer token เฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ยืนยันตัวตนด้วย
  device token นั้นอยู่แล้ว เพื่อให้ client แบบ token-only สามารถเก็บ replacement ของตนก่อน
  เชื่อมต่อใหม่ การหมุนเวียนแบบ shared/admin จะไม่ echo bearer token
- การออก token การหมุนเวียน และการเพิกถอนยังคงถูกจำกัดไว้กับชุด role ที่อนุมัติแล้ว
  ซึ่งบันทึกไว้ในรายการ pairing ของ device นั้น; การเปลี่ยนแปลง token ไม่สามารถขยายหรือ
  กำหนดเป้าหมาย role ของ device ที่การอนุมัติ pairing ไม่เคยให้ไว้
- สำหรับ paired-device token sessions การจัดการ device จะจำกัดขอบเขตกับตนเอง เว้นแต่
  ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ admin สามารถลบ/เพิกถอน/หมุนเวียน
  ได้เฉพาะรายการ device **ของตนเอง** เท่านั้น
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุด scope ของ operator
  token เป้าหมายเทียบกับ scopes ของ session ปัจจุบันของผู้เรียก ผู้เรียกที่ไม่ใช่ admin
  ไม่สามารถหมุนเวียนหรือเพิกถอน operator token ที่กว้างกว่าที่ตนมีอยู่แล้ว
- ความล้มเหลวในการยืนยันตัวตนมี `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมของ client สำหรับ `AUTH_TOKEN_MISMATCH`:
  - client ที่เชื่อถือได้อาจลองซ้ำแบบจำกัดหนึ่งครั้งด้วย cached per-device token
  - หากการลองซ้ำนั้นล้มเหลว client ควรหยุดวงวนการเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำการดำเนินการสำหรับ operator
- `AUTH_SCOPE_MISMATCH` หมายความว่า device token ถูกจดจำได้แต่ไม่ครอบคลุม
  role/scopes ที่ขอ client ไม่ควรนำเสนอเรื่องนี้ว่าเป็น token ที่ไม่ถูกต้อง;
  ให้แจ้ง operator ให้จับคู่ใหม่หรืออนุมัติสัญญา scope ที่แคบกว่า/กว้างกว่า

## ข้อมูลระบุตัวตนของ device + การจับคู่

- node ควรมีข้อมูลระบุตัวตนของ device ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  fingerprint ของ keypair
- Gateway ออก token ต่อ device + role
- การอนุมัติการจับคู่จำเป็นสำหรับ device ID ใหม่ เว้นแต่เปิดใช้การอนุมัติอัตโนมัติแบบ local
- การอนุมัติอัตโนมัติของการจับคู่มีศูนย์กลางอยู่ที่การเชื่อมต่อ direct local loopback
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่จำกัดสำหรับ
  โฟลว์ helper แบบ shared-secret ที่เชื่อถือได้
- การเชื่อมต่อ tailnet หรือ LAN บน host เดียวกันยังคงถือว่าเป็น remote สำหรับการจับคู่และ
  ต้องได้รับการอนุมัติ
- โดยปกติ WS client จะใส่ข้อมูลระบุตัวตน `device` ระหว่าง `connect` (operator +
  node) ข้อยกเว้น operator ที่ไม่มี device มีเฉพาะเส้นทางความไว้วางใจที่ระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP ที่ไม่ปลอดภัยเฉพาะ localhost
  - การยืนยันตัวตน Control UI ของ operator ด้วย `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
  - RPC backend `gateway-client` แบบ direct-loopback ที่ยืนยันตัวตนด้วย shared
    gateway token/password
- ทุกการเชื่อมต่อต้องลงนาม nonce `connect.challenge` ที่ server ให้มา

### diagnostics การย้าย device auth

สำหรับ client รุ่นเก่าที่ยังใช้พฤติกรรมการลงนามก่อน challenge ตอนนี้ `connect` จะส่งคืน
code รายละเอียด `DEVICE_AUTH_*` ใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวทั่วไปในการย้าย:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | client ละเว้น `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | client ลงนามด้วย nonce ที่เก่า/ผิด            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ลายเซ็นไม่ตรงกับ payload v2       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอก skew ที่อนุญาต          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/canonicalization ของ public key ล้มเหลว         |

เป้าหมายการย้าย:

- รอ `connect.challenge` เสมอ
- ลงนาม payload v2 ที่มี server nonce
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload ลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` รุ่นเก่ายังคงถูกยอมรับเพื่อความเข้ากันได้ แต่การ pin metadata ของ paired-device
  ยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + การ pin

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- client อาจ pin fingerprint ของใบรับรอง Gateway ได้ตามต้องการ (ดู config `gateway.tls`
  รวมถึง `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

protocol นี้เปิดเผย **API ของ Gateway แบบเต็ม** (status, channels, models, chat,
agent, sessions, nodes, approvals ฯลฯ) พื้นผิวที่แน่นอนถูกกำหนดโดย
TypeBox schemas ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [protocol ของ Bridge](/th/gateway/bridge-protocol)
- [runbook ของ Gateway](/th/gateway)
