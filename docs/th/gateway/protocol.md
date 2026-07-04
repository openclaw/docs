---
read_when:
    - การใช้งานหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักโปรโตคอลไม่ตรงกันหรือการเชื่อมต่อล้มเหลว
    - กำลังสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การแฮนด์เชก, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-07-04T18:24:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 763dd5cba2f1aa0de95243a4996b4da1b4aa32c5c1a4b5b6c112d605e677bd70
    source_path: gateway/protocol.md
    workflow: 16
---

โปรโตคอล Gateway WS คือ **ระนาบควบคุมเดียว + ทรานสปอร์ตของ Node** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, UI เว็บ, แอป macOS, Node iOS/Android, Node แบบ headless)
เชื่อมต่อผ่าน WebSocket และประกาศ **role** + **scope** ของตน
ในช่วง handshake

## ทรานสปอร์ต

- WebSocket, text frames พร้อม payload JSON
- เฟรมแรก **ต้อง** เป็นคำขอ `connect`
- เฟรมก่อนเชื่อมต่อถูกจำกัดไว้ที่ 64 KiB หลังจาก handshake สำเร็จแล้ว ไคลเอนต์
  ควรทำตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้ diagnostics,
  เฟรมขาเข้าที่มีขนาดใหญ่เกินไปและบัฟเฟอร์ขาออกที่ช้าจะส่งอีเวนต์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้งเฟรมที่ได้รับผลกระทบ อีเวนต์เหล่านี้เก็บ
  ขนาด ขีดจำกัด พื้นผิว และรหัสเหตุผลที่ปลอดภัยไว้ แต่ไม่เก็บเนื้อหาข้อความ
  เนื้อหาไฟล์แนบ เนื้อหาเฟรมดิบ โทเค็น คุกกี้ หรือค่าลับ

## Handshake (connect)

Gateway → Client (challenge ก่อนเชื่อมต่อ):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

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

Gateway → Client:

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

ขณะที่ Gateway ยังคงกำลังเริ่มต้น sidecar ให้เสร็จ คำขอ `connect` อาจ
ส่งคืนข้อผิดพลาด `UNAVAILABLE` ที่ลองใหม่ได้ โดยตั้งค่า `details.reason` เป็น
`"startup-sidecars"` และมี `retryAfterMs` ไคลเอนต์ควรลองส่งการตอบกลับนั้นใหม่
ภายในงบเวลาการเชื่อมต่อโดยรวม แทนที่จะแสดงเป็นความล้มเหลวของ handshake
แบบสิ้นสุด

`server`, `features`, `snapshot` และ `policy` ทั้งหมดเป็นค่าที่ schema กำหนดให้มี
(`packages/gateway-protocol/src/schema/frames.ts`) `auth` ก็จำเป็นเช่นกันและรายงาน
role/scopes ที่เจรจาได้ `pluginSurfaceUrls` เป็นตัวเลือกเสริมและแมปชื่อพื้นผิวของ plugin
เช่น `canvas` ไปยัง URL ที่โฮสต์แบบมี scope

URL พื้นผิวของ plugin ที่มี scope อาจหมดอายุได้ Node สามารถเรียก
`node.pluginSurface.refresh` พร้อม `{ "surface": "canvas" }` เพื่อรับรายการใหม่
ใน `pluginSurfaceUrls` การรีแฟกเตอร์ Plugin Canvas แบบทดลองไม่รองรับเส้นทางความเข้ากันได้
`canvasHostUrl`, `canvasCapability` หรือ `node.canvas.capability.refresh` ที่เลิกใช้แล้ว;
ไคลเอนต์ native และ gateway ปัจจุบันต้องใช้พื้นผิวของ plugin

เมื่อไม่มีการออกโทเค็นอุปกรณ์ `hello-ok.auth` จะรายงานสิทธิ์ที่เจรจาได้
โดยไม่มีฟิลด์โทเค็น:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ไคลเอนต์ backend ในโปรเซสเดียวกันที่เชื่อถือได้ (`client.id: "gateway-client"`,
`client.mode: "backend"`) อาจละเว้น `device` บนการเชื่อมต่อ loopback โดยตรงได้เมื่อ
ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน gateway ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้สำหรับ
RPC ระนาบควบคุมภายใน และป้องกันไม่ให้ baseline การจับคู่ CLI/อุปกรณ์ที่ค้างอยู่
ไปบล็อกงาน backend ภายใน เช่น การอัปเดตเซสชัน subagent ไคลเอนต์ระยะไกล,
ไคลเอนต์จาก browser-origin, ไคลเอนต์ Node และไคลเอนต์ที่ระบุ device-token/device-identity
ยังคงใช้การตรวจสอบการจับคู่และการยกระดับ scope ตามปกติ

เมื่อมีการออกโทเค็นอุปกรณ์ `hello-ok` จะรวมข้อมูลนี้ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

การบูตสแตรปด้วย QR/setup-code ในตัวเป็นเส้นทางส่งต่อมือถือแบบใหม่ เมื่อ
การเชื่อมต่อด้วย setup-code baseline สำเร็จ จะส่งคืนโทเค็น Node หลักพร้อม
โทเค็น operator แบบมีขอบเขตหนึ่งรายการ:

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

การส่งต่อ operator ถูกจำกัดโดยตั้งใจ เพื่อให้การ onboarding ด้วย QR สามารถเริ่ม
ลูป operator บนมือถือและทำการตั้งค่า native ให้เสร็จ โดยไม่ให้ scope สำหรับ
การเปลี่ยนแปลงการจับคู่หรือ `operator.admin` โดยรวม `operator.talk.secrets` ไว้เพื่อให้
ไคลเอนต์ native อ่านการกำหนดค่า Talk ที่ต้องใช้หลัง bootstrap ได้ การเข้าถึง
การจับคู่และผู้ดูแลระบบที่กว้างกว่านี้ต้องใช้การจับคู่ operator หรือ flow โทเค็น
ที่ได้รับอนุมัติแยกต่างหาก ไคลเอนต์ควรคงค่า
`hello-ok.auth.deviceTokens` ไว้เฉพาะ
เมื่อการเชื่อมต่อใช้ bootstrap auth บนทรานสปอร์ตที่เชื่อถือได้ เช่น `wss://` หรือ
การจับคู่ผ่าน loopback/local

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

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

เมธอดที่มีผลข้างเคียงต้องใช้ **idempotency keys** (ดู schema)

## Roles + scopes

สำหรับโมเดล scope ของ operator แบบเต็ม การตรวจสอบในช่วงอนุมัติ และ
ความหมายของ shared-secret ดู [Operator scopes](/th/gateway/operator-scopes)

### Roles

- `operator` = ไคลเอนต์ระนาบควบคุม (CLI/UI/automation)
- `node` = โฮสต์ความสามารถ (camera/screen/canvas/system.run)

### Scopes (operator)

scope ที่พบบ่อย:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` พร้อม `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)
เมื่อรวม secrets ไว้ ไคลเอนต์ควรอ่านข้อมูลประจำตัวของผู้ให้บริการ Talk ที่ใช้งานอยู่
จาก `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
ยังคงมีรูปทรงเหมือนแหล่งที่มา และอาจเป็นออบเจ็กต์ SecretRef หรือสตริงที่ถูกปกปิด

เมธอด Gateway RPC ที่ลงทะเบียนโดย plugin อาจขอ scope ของ operator ของตนเองได้ แต่
prefix ของ core admin ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะแปลงเป็น `operator.admin` เสมอ

scope ของเมธอดเป็นเพียงด่านแรกเท่านั้น คำสั่ง slash บางรายการที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจสอบระดับคำสั่งที่เข้มงวดกว่าเพิ่มเติม ตัวอย่างเช่น การเขียนแบบคงอยู่
ด้วย `/config set` และ `/config unset` ต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบ scope เพิ่มเติมในช่วงอนุมัติ นอกเหนือจาก
scope ของเมธอดพื้นฐาน:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มีคำสั่ง Node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่รวม `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node ประกาศการอ้างสิทธิ์ความสามารถในช่วงเชื่อมต่อ:

- `caps`: หมวดหมู่ความสามารถระดับสูง เช่น `camera`, `canvas`, `screen`,
  `location`, `voice` และ `talk`
- `commands`: รายการคำสั่งที่อนุญาตสำหรับ invoke
- `permissions`: สวิตช์ย่อยแบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือค่าสิ่งเหล่านี้เป็น **claims** และบังคับใช้ allowlist ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` ส่งคืนรายการที่ key ด้วย identity ของอุปกรณ์
- รายการ presence รวม `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงหนึ่งแถวต่ออุปกรณ์ได้
  แม้เมื่อเชื่อมต่อเป็นทั้ง **operator** และ **node**
- `node.list` รวมฟิลด์ตัวเลือกเสริม `lastSeenAtMs` และ `lastSeenReason` Node ที่เชื่อมต่ออยู่รายงาน
  เวลาเชื่อมต่อปัจจุบันของตนเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; Node ที่จับคู่แล้วอาจรายงาน
  background presence แบบคงทนได้ด้วย เมื่ออีเวนต์ Node ที่เชื่อถือได้อัปเดต metadata การจับคู่ของตน

### อีเวนต์ alive เบื้องหลังของ Node

Node อาจเรียก `node.event` พร้อม `event: "node.presence.alive"` เพื่อบันทึกว่า Node ที่จับคู่แล้ว
ยัง alive ระหว่างการ wake ในเบื้องหลัง โดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น enum แบบปิด: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` สตริง trigger ที่ไม่รู้จักจะถูก gateway ทำให้เป็น
`background` ก่อนคงค่าไว้ อีเวนต์นี้คงทนเฉพาะสำหรับเซสชันอุปกรณ์ Node ที่ยืนยันตัวตนแล้ว
เท่านั้น; เซสชันที่ไม่มีอุปกรณ์หรือยังไม่ได้จับคู่จะส่งคืน `handled: false`

Gateway ที่สำเร็จจะส่งคืนผลลัพธ์แบบมีโครงสร้าง:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway รุ่นเก่าอาจยังส่งคืน `{ "ok": true }` สำหรับ `node.event`; ไคลเอนต์ควรถือว่านั่นเป็น
RPC ที่ได้รับการยืนยันแล้ว ไม่ใช่การคงค่า presence แบบคงทน

## การกำหนด scope ของอีเวนต์ broadcast

อีเวนต์ broadcast ของ WebSocket ที่เซิร์ฟเวอร์ push จะถูก gate ด้วย scope เพื่อไม่ให้เซสชันที่มี scope สำหรับการจับคู่หรือเฉพาะ Node รับเนื้อหาเซสชันแบบ passive

- **เฟรม chat, agent และ tool-result** (รวมถึงอีเวนต์ `agent` แบบ streamed และผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcast `plugin.*` ที่กำหนดโดย Plugin** ถูก gate ไปยัง `operator.write` หรือ `operator.admin` ขึ้นอยู่กับวิธีที่ plugin ลงทะเบียนไว้
- **อีเวนต์สถานะและทรานสปอร์ต** (`heartbeat`, `presence`, `tick`, lifecycle การเชื่อมต่อ/ตัดการเชื่อมต่อ ฯลฯ) ยังคงไม่ถูกจำกัด เพื่อให้ทุกเซสชันที่ยืนยันตัวตนแล้วสังเกตสุขภาพของทรานสปอร์ตได้
- **ตระกูลอีเวนต์ broadcast ที่ไม่รู้จัก** ถูก gate ด้วย scope ตามค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนคลายข้อจำกัดอย่างชัดเจน

การเชื่อมต่อไคลเอนต์แต่ละรายการเก็บหมายเลขลำดับต่อไคลเอนต์ของตนเอง เพื่อให้ broadcast รักษาลำดับแบบ monotonic บน socket นั้น แม้เมื่อไคลเอนต์ต่างกันเห็น subset ของสตรีมอีเวนต์ที่ถูกกรองด้วย scope แตกต่างกัน

## ตระกูลเมธอด RPC ที่พบบ่อย

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ด้านบน นี่
ไม่ใช่ dump ที่สร้างขึ้น — `hello-ok.features.methods` เป็นรายการ discovery
แบบอนุรักษ์นิยมที่สร้างจาก `src/gateway/server-methods-list.ts` รวมกับ export เมธอดของ
plugin/channel ที่โหลดแล้ว ให้ถือเป็น feature discovery ไม่ใช่รายการแจกแจงแบบเต็ม
ของ `src/gateway/server-methods/*.ts`

  <AccordionGroup>
  <Accordion title="ระบบและตัวตน">
    - `health` ส่งคืนสแนปช็อตสถานะสุขภาพของ Gateway ที่แคชไว้หรือเพิ่งโพรบใหม่
    - `diagnostics.stability` ส่งคืนตัวบันทึกเสถียรภาพการวินิจฉัยแบบมีขอบเขตล่าสุด โดยเก็บเมทาดาต้าด้านการปฏิบัติการ เช่น ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าการใช้หน่วยความจำ สถานะคิว/เซสชัน ชื่อช่องทาง/Plugin และรหัสเซสชัน แต่ไม่เก็บข้อความแชต เนื้อหา Webhook เอาต์พุตของเครื่องมือ เนื้อหาคำขอหรือคำตอบแบบดิบ โทเคน คุกกี้ หรือค่าลับ ต้องมีขอบเขตการอ่านของผู้ปฏิบัติการ
    - `status` ส่งคืนสรุป Gateway รูปแบบ `/status`; ฟิลด์ที่ละเอียดอ่อนจะถูกรวมไว้เฉพาะสำหรับไคลเอนต์ผู้ปฏิบัติการที่มีขอบเขตผู้ดูแลระบบเท่านั้น
    - `gateway.identity.get` ส่งคืนตัวตนอุปกรณ์ของ Gateway ที่ใช้โดยโฟลว์รีเลย์และการจับคู่
    - `system-presence` ส่งคืนสแนปช็อตการปรากฏตัวปัจจุบันสำหรับอุปกรณ์ผู้ปฏิบัติการ/Node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่มเหตุการณ์ระบบและสามารถอัปเดต/กระจายบริบทการปรากฏตัวได้
    - `last-heartbeat` ส่งคืนเหตุการณ์ Heartbeat ล่าสุดที่คงอยู่ถาวร
    - `set-heartbeats` สลับการประมวลผล Heartbeat บน Gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแคตตาล็อกโมเดลที่รันไทม์อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าไว้ในขนาดสำหรับตัวเลือก (`agents.defaults.models` ก่อน แล้วจึง `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแคตตาล็อกทั้งหมด
    - `usage.status` ส่งคืนสรุปหน้าต่างการใช้งาน/โควต้าคงเหลือของผู้ให้บริการ
    - `usage.cost` ส่งคืนสรุปการใช้งานต้นทุนที่รวมยอดแล้วสำหรับช่วงวันที่
      ส่ง `agentId` สำหรับเอเจนต์เดียว หรือ `agentScope: "all"` เพื่อรวมเอเจนต์ที่กำหนดค่าไว้
    - `doctor.memory.status` ส่งคืนความพร้อมของหน่วยความจำเวกเตอร์ / embedding ที่แคชไว้สำหรับพื้นที่ทำงานของเอเจนต์เริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจน ไคลเอนต์ที่รองรับ Dreaming อาจส่ง `{ "agentId": "agent-id" }` เพื่อจำกัดสถิติที่เก็บ Dreaming ไปยังพื้นที่ทำงานของเอเจนต์ที่เลือกได้ด้วย; หากละ `agentId` จะคง fallback ของเอเจนต์เริ่มต้นและรวมพื้นที่ทำงาน Dreaming ที่กำหนดค่าไว้
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, และ `doctor.memory.dedupeDreamDiary` รับพารามิเตอร์ `{ "agentId": "agent-id" }` แบบไม่บังคับสำหรับมุมมอง/การกระทำ Dreaming ของเอเจนต์ที่เลือก เมื่อไม่ได้ระบุ `agentId` พวกมันจะทำงานบนพื้นที่ทำงานของเอเจนต์เริ่มต้นที่กำหนดค่าไว้
    - `doctor.memory.remHarness` ส่งคืนตัวอย่าง REM harness แบบอ่านอย่างเดียวและมีขอบเขตสำหรับไคลเอนต์ control-plane ระยะไกล โดยอาจรวมพาธพื้นที่ทำงาน ส่วนย่อยหน่วยความจำ Markdown ที่ยึดหลักจริงซึ่งเรนเดอร์แล้ว และตัวเลือกการเลื่อนระดับเชิงลึก ดังนั้นผู้เรียกต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานรายเซสชัน ส่ง `agentId` สำหรับหนึ่ง
      เอเจนต์ หรือ `agentScope: "all"` เพื่อแสดงเอเจนต์ที่กำหนดค่าไว้ร่วมกัน
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบอนุกรมเวลาสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="ช่องทางและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะช่องทาง/Plugin ในตัวและที่บันเดิลมา
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีที่ระบุเมื่อช่องทางรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบ QR/เว็บสำหรับผู้ให้บริการช่องทางเว็บปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบ QR/เว็บนั้นเสร็จสมบูรณ์และเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง Node iOS ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืนตัวกระตุ้นคำปลุกที่จัดเก็บไว้
    - `voicewake.set` อัปเดตตัวกระตุ้นคำปลุกและกระจายการเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การรับส่งข้อความและบันทึก">
    - `send` คือ RPC การส่งออกโดยตรงสำหรับการส่งที่กำหนดเป้าหมายตามช่องทาง/บัญชี/เธรดนอกตัวรันแชต
    - `logs.tail` ส่งคืนส่วนท้ายบันทึกไฟล์ของ Gateway ที่กำหนดค่าไว้ พร้อมการควบคุมเคอร์เซอร์/ขีดจำกัดและจำนวนไบต์สูงสุด

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.catalog` ส่งคืนแคตตาล็อกผู้ให้บริการ Talk แบบอ่านอย่างเดียวสำหรับเสียงพูด การถอดเสียงแบบสตรีม และเสียงแบบเรียลไทม์ โดยรวมรหัสผู้ให้บริการแบบบัญญัติ นามแฝงในรีจิสทรี ป้ายกำกับ สถานะที่กำหนดค่าไว้ ผลลัพธ์ `ready` ระดับกลุ่มแบบไม่บังคับ รหัสโมเดล/เสียงที่เปิดเผย โหมดบัญญัติ ทรานสปอร์ต กลยุทธ์สมอง และแฟล็กเสียง/ความสามารถแบบเรียลไทม์ โดยไม่ส่งคืนความลับของผู้ให้บริการหรือเปลี่ยนแปลงการกำหนดค่าส่วนกลาง Gateway ปัจจุบันตั้งค่า `ready` หลังจากใช้การเลือกผู้ให้บริการรันไทม์แล้ว; ไคลเอนต์ควรถือว่าการไม่มีค่านี้หมายถึงยังไม่ได้ตรวจสอบ เพื่อความเข้ากันได้กับ Gateway รุ่นเก่า
    - `talk.config` ส่งคืนเพย์โหลดการกำหนดค่า Talk ที่มีผล; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.session.create` สร้างเซสชัน Talk ที่ Gateway เป็นเจ้าของสำหรับ `realtime/gateway-relay`, `transcription/gateway-relay`, หรือ `stt-tts/managed-room` สำหรับ `stt-tts/managed-room` ผู้เรียก `operator.write` ที่ส่ง `sessionKey` ต้องส่ง `spawnedBy` ด้วยเพื่อให้มองเห็นคีย์เซสชันตามขอบเขต; การสร้าง `sessionKey` แบบไม่จำกัดขอบเขตและ `brain: "direct-tools"` ต้องใช้ `operator.admin`
    - `talk.session.join` ตรวจสอบโทเคนเซสชัน managed-room ปล่อยเหตุการณ์ `session.ready` หรือ `session.replaced` ตามจำเป็น และส่งคืนเมทาดาต้าห้อง/เซสชันพร้อมเหตุการณ์ Talk ล่าสุด โดยไม่มีโทเคนข้อความธรรมดาหรือแฮชโทเคนที่จัดเก็บไว้
    - `talk.session.appendAudio` เพิ่มเสียงอินพุต PCM แบบ base64 ไปยังเซสชันรีเลย์เรียลไทม์และเซสชันถอดเสียงที่ Gateway เป็นเจ้าของ
    - `talk.session.startTurn`, `talk.session.endTurn`, และ `talk.session.cancelTurn` ขับเคลื่อนวงจรชีวิตเทิร์นของ managed-room พร้อมการปฏิเสธเทิร์นเก่าก่อนล้างสถานะ
    - `talk.session.cancelOutput` หยุดเอาต์พุตเสียงของผู้ช่วย โดยหลักใช้สำหรับการแทรกพูดที่ถูกควบคุมด้วย VAD ในเซสชันรีเลย์ของ Gateway
    - `talk.session.submitToolResult` ทำให้การเรียกเครื่องมือของผู้ให้บริการที่ปล่อยโดยเซสชันรีเลย์เรียลไทม์ที่ Gateway เป็นเจ้าของเสร็จสมบูรณ์ ส่ง `options: { willContinue: true }` สำหรับเอาต์พุตเครื่องมือชั่วคราวเมื่อจะมีผลลัพธ์สุดท้ายตามมา หรือ `options: { suppressResponse: true }` เมื่อผลลัพธ์เครื่องมือควรตอบสนองการเรียกของผู้ให้บริการโดยไม่เริ่มคำตอบผู้ช่วยเรียลไทม์อีกครั้ง
    - `talk.session.steer` ส่งการควบคุมเสียงของรันที่กำลังใช้งานเข้าสู่เซสชัน Talk ที่หนุนด้วยเอเจนต์และ Gateway เป็นเจ้าของ โดยรับ `{ sessionId, text, mode? }` ซึ่ง `mode` คือ `status`, `steer`, `cancel`, หรือ `followup`; โหมดที่ละไว้จะถูกจำแนกจากข้อความที่พูด
    - `talk.session.close` ปิดเซสชันรีเลย์ การถอดเสียง หรือ managed-room ที่ Gateway เป็นเจ้าของ และปล่อยเหตุการณ์ Talk ปลายทาง
    - `talk.mode` ตั้งค่า/กระจายสถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.client.create` สร้างเซสชันผู้ให้บริการเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของโดยใช้ `webrtc` หรือ `provider-websocket` ขณะที่ Gateway เป็นเจ้าของการกำหนดค่า ข้อมูลประจำตัว คำสั่ง และนโยบายเครื่องมือ
    - `talk.client.toolCall` ให้ทรานสปอร์ตเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของส่งต่อการเรียกเครื่องมือของผู้ให้บริการไปยังนโยบาย Gateway เครื่องมือแรกที่รองรับคือ `openclaw_agent_consult`; ไคลเอนต์จะได้รับรหัสรันและรอเหตุการณ์วงจรชีวิตแชตปกติก่อนส่งผลลัพธ์เครื่องมือเฉพาะผู้ให้บริการ
    - `talk.client.steer` ส่งการควบคุมเสียงของรันที่กำลังใช้งานสำหรับทรานสปอร์ตเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของ Gateway จะแก้หารันแบบฝังที่ใช้งานอยู่จาก `sessionKey` และส่งคืนผลลัพธ์ยอมรับ/ปฏิเสธแบบมีโครงสร้างแทนการทิ้งการบังคับทิศทางอย่างเงียบ ๆ
    - `talk.event` คือช่องทางเหตุการณ์ Talk เดียวสำหรับอะแดปเตอร์เรียลไทม์ การถอดเสียง STT/TTS, managed-room, โทรศัพท์ และการประชุม
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะเปิดใช้ TTS ผู้ให้บริการที่ใช้งานอยู่ ผู้ให้บริการ fallback และสถานะการกำหนดค่าผู้ให้บริการ
    - `tts.providers` ส่งคืนคลังผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะการตั้งค่า TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` เรียกใช้การแปลงข้อความเป็นเสียงพูดแบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ การกำหนดค่า การอัปเดต และวิซาร์ด">
    - `secrets.reload` แก้หา SecretRefs ที่ใช้งานอยู่อีกครั้งและสลับสถานะความลับของรันไทม์เฉพาะเมื่อสำเร็จทั้งหมดเท่านั้น
    - `secrets.resolve` แก้หาการกำหนดความลับเป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายที่ระบุ
    - `config.get` ส่งคืนสแนปช็อตการกำหนดค่าปัจจุบันและแฮช
    - `config.set` เขียนเพย์โหลดการกำหนดค่าที่ผ่านการตรวจสอบแล้ว
    - `config.patch` ผสานการอัปเดตการกำหนดค่าบางส่วน การแทนที่อาร์เรย์แบบทำลาย
      ต้องระบุพาธที่ได้รับผลกระทบใน `replacePaths`; อาร์เรย์ซ้อน
      ใต้รายการอาร์เรย์ใช้พาธ `[]` เช่น `agents.list[].skills`
    - `config.apply` ตรวจสอบความถูกต้อง + แทนที่เพย์โหลดการกำหนดค่าทั้งหมด
    - `config.schema` ส่งคืนเพย์โหลดสคีมาการกำหนดค่าแบบสดที่ใช้โดยเครื่องมือ Control UI และ CLI: สคีมา, `uiHints`, เวอร์ชัน และเมทาดาต้าการสร้าง รวมถึงเมทาดาต้าสคีมา Plugin + ช่องทางเมื่อรันไทม์โหลดได้ สคีมารวมเมทาดาต้าฟิลด์ `title` / `description` ที่ได้มาจากป้ายกำกับและข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึงอ็อบเจ็กต์ซ้อน wildcard รายการอาร์เรย์ และแขนงการประกอบ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืนเพย์โหลดการค้นหาแบบจำกัดพาธสำหรับพาธการกำหนดค่าหนึ่งพาธ: พาธที่ทำให้เป็นมาตรฐานแล้ว โหนดสคีมาตื้น ๆ คำใบ้ที่ตรงกัน + `hintPath`, `reloadKind` แบบไม่บังคับ และสรุปลูกโดยตรงสำหรับการเจาะลึกใน UI/CLI `reloadKind` เป็นหนึ่งใน `restart`, `hot`, หรือ `none` และสะท้อนตัววางแผนการโหลดการกำหนดค่า Gateway ใหม่สำหรับพาธที่ร้องขอ โหนดสคีมาการค้นหาจะคงเอกสารที่ผู้ใช้เห็นและฟิลด์ตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขตตัวเลข/สตริง/อาร์เรย์/อ็อบเจ็กต์ และแฟล็กเช่น `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกเปิดเผย `key`, `path` ที่ทำให้เป็นมาตรฐานแล้ว, `type`, `required`, `hasChildren`, `reloadKind` แบบไม่บังคับ รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` เรียกใช้โฟลว์อัปเดต Gateway และกำหนดเวลารีสตาร์ตเฉพาะเมื่อการอัปเดตเองสำเร็จ; ผู้เรียกที่มีเซสชันสามารถรวม `continuationMessage` เพื่อให้การเริ่มต้นกลับมาทำเทิร์นเอเจนต์ติดตามผลหนึ่งครั้งผ่านคิวความต่อเนื่องของการรีสตาร์ต การอัปเดตตัวจัดการแพ็กเกจและการอัปเดต git-checkout ที่มีการกำกับดูแลจาก control plane ใช้การส่งต่องาน managed-service แบบแยกออก แทนการแทนที่ผังแพ็กเกจหรือเปลี่ยนแปลงเอาต์พุต checkout/build ภายใน Gateway ที่กำลังทำงาน การส่งต่องานที่เริ่มแล้วส่งคืน `ok: true` พร้อม `result.reason: "managed-service-handoff-started"` และ `handoff.status: "started"`; การส่งต่องานที่ไม่พร้อมใช้งานหรือล้มเหลวส่งคืน `ok: false` พร้อม `managed-service-handoff-unavailable` หรือ `managed-service-handoff-failed` รวมถึง `handoff.command` เมื่อจำเป็นต้องอัปเดตด้วยเชลล์แบบแมนนวล การส่งต่องานที่ไม่พร้อมใช้งานหมายความว่า OpenClaw ไม่มีขอบเขตผู้กำกับดูแลที่ปลอดภัยหรือตัวตนบริการที่ทนทาน เช่น `OPENCLAW_SYSTEMD_UNIT` สำหรับ systemd ระหว่างการส่งต่องานที่เริ่มแล้ว sentinel การรีสตาร์ตอาจรายงาน `stats.reason: "restart-health-pending"` ชั่วครู่; ความต่อเนื่องจะถูกหน่วงจนกว่า CLI จะตรวจสอบ Gateway ที่รีสตาร์ตแล้วและเขียน sentinel `ok` สุดท้าย
    - `update.status` รีเฟรชและส่งคืน sentinel การรีสตาร์ตการอัปเดตล่าสุด รวมถึงเวอร์ชันที่กำลังรันหลังรีสตาร์ตเมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status`, และ `wizard.cancel` เปิดเผยวิซาร์ดการเริ่มต้นใช้งานผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วยเอเจนต์และเวิร์กสเปซ">
    - `agents.list` ส่งคืนรายการเอเจนต์ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลใช้งานและเมทาดาทารันไทม์
    - `agents.create`, `agents.update` และ `agents.delete` จัดการระเบียนเอเจนต์และการเชื่อมต่อเวิร์กสเปซ
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการไฟล์เวิร์กสเปซเริ่มต้นที่เปิดเผยให้เอเจนต์ใช้
    - `tasks.list`, `tasks.get` และ `tasks.cancel` เปิดเผยสมุดรายการงานของ Gateway ให้ไคลเอนต์ SDK และผู้ปฏิบัติงาน
    - `artifacts.list`, `artifacts.get` และ `artifacts.download` เปิดเผยสรุปอาร์ติแฟกต์ที่ได้จากทรานสคริปต์และการดาวน์โหลดสำหรับขอบเขต `sessionKey`, `runId` หรือ `taskId` ที่ระบุอย่างชัดเจน คิวรีรันและงานจะ resolve เซสชันเจ้าของทางฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อทรานสคริปต์ที่มีแหล่งที่มาตรงกันเท่านั้น แหล่ง URL ที่ไม่ปลอดภัยหรือเป็น local จะส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการดึงข้อมูลทางฝั่งเซิร์ฟเวอร์
    - `environments.list` และ `environments.status` เปิดเผยการค้นพบสภาพแวดล้อมแบบอ่านอย่างเดียวของ Gateway-local และ Node สำหรับไคลเอนต์ SDK
    - `agent.identity.get` ส่งคืนตัวตนผู้ช่วยที่มีผลใช้งานสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้รันเสร็จสิ้นและส่งคืนสแนปช็อตสถานะสิ้นสุดเมื่อมีให้ใช้

  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึงเมทาดาทา `agentRuntime` ต่อแถวเมื่อมีการกำหนดค่าแบ็กเอนด์รันไทม์ของเอเจนต์
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับเหตุการณ์ทรานสคริปต์/ข้อความสำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนตัวอย่างทรานสคริปต์แบบมีขอบเขตสำหรับคีย์เซสชันที่ระบุ
    - `sessions.describe` ส่งคืนหนึ่งแถวเซสชันของ Gateway สำหรับคีย์เซสชันที่ตรงกันทุกประการ
    - `sessions.resolve` resolve หรือทำให้เป้าหมายเซสชันเป็นรูปแบบ canonical
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปในเซสชันที่มีอยู่
    - `sessions.steer` เป็นรูปแบบ interrupt-and-steer สำหรับเซสชันที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่เป็นทางเลือก หรือส่งเฉพาะ `runId` สำหรับรันที่ใช้งานอยู่ซึ่ง Gateway สามารถ resolve ไปยังเซสชันได้
    - `sessions.patch` อัปเดตเมทาดาทา/การ override ของเซสชัน และรายงานโมเดล canonical ที่ resolve แล้วพร้อม `agentRuntime` ที่มีผลใช้งาน
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ดำเนินการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้แบบเต็ม
    - การเรียกใช้แชทยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` `chat.history` ถูกทำให้เป็นมาตรฐานสำหรับการแสดงผลแก่ไคลเอนต์ UI: แท็กคำสั่งแบบ inline จะถูกลบออกจากข้อความที่มองเห็นได้, payload XML ของ tool-call แบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน) และโทเคนควบคุมโมเดลแบบ ASCII/full-width ที่รั่วออกมาจะถูกลบออก, แถวผู้ช่วยที่เป็น silent-token ล้วน เช่น `NO_REPLY` / `no_reply` ที่ตรงทุกประการจะถูกละเว้น และแถวที่มีขนาดใหญ่เกินไปอาจถูกแทนที่ด้วย placeholder
    - `chat.message.get` เป็นตัวอ่าน full-message แบบมีขอบเขตที่เพิ่มเข้ามาสำหรับรายการทรานสคริปต์ที่มองเห็นได้รายการเดียว ไคลเอนต์ส่ง `sessionKey`, `agentId` ที่เป็นทางเลือกเมื่อการเลือกเซสชันมีขอบเขตตามเอเจนต์ พร้อม `messageId` ของทรานสคริปต์ที่เคยเปิดเผยผ่าน `chat.history` และ Gateway จะส่งคืน projection ที่ถูกทำให้เป็นมาตรฐานสำหรับการแสดงผลแบบเดียวกันโดยไม่มีเพดานการตัดทอนประวัติแบบเบา เมื่อรายการที่จัดเก็บไว้ยังมีอยู่และไม่ได้มีขนาดใหญ่เกินไป
    - `chat.send` รับ `fastMode: "auto"` แบบหนึ่งเทิร์นเพื่อใช้โหมดเร็วกับการเรียกโมเดลที่เริ่มก่อนจุดตัด auto จากนั้นจึงเริ่มการเรียก retry, fallback, tool-result หรือ continuation ภายหลังโดยไม่ใช้โหมดเร็ว จุดตัดมีค่าเริ่มต้นที่ 60 วินาที และสามารถกำหนดค่าต่อโมเดลได้ด้วย `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ผู้เรียก `chat.send` สามารถส่ง `fastAutoOnSeconds` แบบหนึ่งเทิร์นเพื่อ override จุดตัดสำหรับคำขอนั้น

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และโทเคนอุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วซึ่งรออนุมัติและได้รับอนุมัติแล้ว
    - `device.pair.setupCode` สร้างโค้ดตั้งค่ามือถือ และโดยค่าเริ่มต้นจะสร้าง PNG QR data URL ด้วย ต้องใช้ `operator.admin` และตั้งใจละเว้นจากการค้นพบที่ประกาศไว้ ผลลัพธ์มี `setupCode`, `qrDataUrl` ที่เป็นทางเลือก, `gatewayUrl`, ป้ายกำกับ `auth` ที่ไม่เป็นความลับ และ `urlSource`
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียนโทเคนอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่อนุมัติและขอบเขตผู้เรียก
    - `device.token.revoke` เพิกถอนโทเคนอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่อนุมัติและขอบเขตผู้เรียก

    โค้ดตั้งค่าฝังข้อมูลรับรองเริ่มต้นที่มีอายุสั้น ไคลเอนต์ต้องไม่
    บันทึก log หรือคงข้อมูลนี้ไว้นอกเหนือจาก flow การจับคู่

  </Accordion>

  <Accordion title="การจับคู่ Node, การเรียกใช้ และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` และ `node.pair.verify` ครอบคลุมการจับคู่ Node และการยืนยัน bootstrap
    - `node.list` และ `node.describe` ส่งคืนสถานะ Node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับ Node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง Node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอ invoke
    - `node.event` นำเหตุการณ์ที่มาจาก Node กลับเข้าสู่ Gateway
    - `node.pending.pull` และ `node.pending.ack` เป็น API คิวของ Node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบคงทนสำหรับ Node ที่ offline/ตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="ตระกูลการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบใช้ครั้งเดียว พร้อมการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการและส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการสแนปช็อตนโยบายการอนุมัติ exec ของ Gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec แบบ local ของ Node ผ่านคำสั่ง relay ของ Node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุม flow การอนุมัติที่ Plugin กำหนด

  </Accordion>

  <Accordion title="Automation, skills และเครื่องมือ">
    - Automation: `wake` จัดกำหนดการฉีดข้อความปลุกทันทีหรือใน Heartbeat ถัดไป; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่กำหนดเวลาไว้
    - `cron.run` ยังคงเป็น RPC แบบ enqueue สำหรับการรันด้วยตนเอง ไคลเอนต์ที่ต้องการ semantics ของการเสร็จสิ้นควรอ่าน `runId` ที่ส่งคืนและ poll `cron.runs`
    - `cron.runs` รับตัวกรอง `runId` ที่เป็นทางเลือกและไม่ว่าง เพื่อให้ไคลเอนต์ติดตามการรันด้วยตนเองหนึ่งรายการในคิวได้โดยไม่ชนกับรายการประวัติอื่นของงานเดียวกัน
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### ตระกูลเหตุการณ์ทั่วไป

- `chat`: การอัปเดตแชท UI เช่น `chat.inject` และเหตุการณ์แชทอื่นที่เป็นเฉพาะทรานสคริปต์
  ใน protocol v4 payload แบบ delta จะมี `deltaText`; `message` ยังคงเป็น
  สแนปช็อตผู้ช่วยแบบสะสม การแทนที่ที่ไม่ใช่ prefix จะตั้ง `replace=true`
  และใช้ `deltaText` เป็นข้อความแทนที่
- `session.message`, `session.operation` และ `session.tool`: ทรานสคริปต์,
  การดำเนินการเซสชันที่กำลังทำงาน และการอัปเดตสตรีมเหตุการณ์สำหรับเซสชัน
  ที่สมัครรับ
- `sessions.changed`: ดัชนีเซสชันหรือเมทาดาทาเปลี่ยนแปลง
- `presence`: การอัปเดตสแนปช็อต presence ของระบบ
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดตสแนปช็อตสุขภาพของ Gateway
- `heartbeat`: การอัปเดตสตรีมเหตุการณ์ Heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลงรัน/งาน Cron
- `shutdown`: การแจ้งเตือนการปิด Gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ Node
- `node.invoke.request`: การ broadcast คำขอ invoke ของ Node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตอุปกรณ์ที่จับคู่
- `voicewake.changed`: การกำหนดค่า trigger wake-word เปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ Plugin

### เมธอดตัวช่วย Node

- Node อาจเรียก `skills.bins` เพื่อดึงรายการ executable ของ skill ปัจจุบัน
  สำหรับการตรวจสอบ auto-allow

### RPC ของสมุดรายการงาน

ไคลเอนต์ผู้ปฏิบัติงานอาจตรวจสอบและยกเลิกระเบียนงานเบื้องหลังของ Gateway ผ่าน
RPC ของสมุดรายการงาน เมธอดเหล่านี้ส่งคืนสรุปงานที่ผ่านการล้างข้อมูลแล้ว ไม่ใช่
สถานะรันไทม์ดิบ

- `tasks.list` ต้องใช้ `operator.read`
  - พารามิเตอร์: `status` ที่เป็นทางเลือก (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` หรือ `"timed_out"`) หรืออาร์เรย์ของสถานะเหล่านั้น,
    `agentId` ที่เป็นทางเลือก, `sessionKey` ที่เป็นทางเลือก, `limit` ที่เป็นทางเลือกตั้งแต่ `1` ถึง
    `500` และสตริง `cursor` ที่เป็นทางเลือก
  - ผลลัพธ์: `{ "tasks": TaskSummary[], "nextCursor"?: string }`
- `tasks.get` ต้องใช้ `operator.read`
  - พารามิเตอร์: `{ "taskId": string }`
  - ผลลัพธ์: `{ "task": TaskSummary }`
  - id งานที่หายไปจะส่งคืนรูปแบบข้อผิดพลาด not-found ของ Gateway
- `tasks.cancel` ต้องใช้ `operator.write`
  - พารามิเตอร์: `{ "taskId": string, "reason"?: string }`
  - ผลลัพธ์:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`
  - `found` รายงานว่าสมุดรายการมีงานที่ตรงกันหรือไม่ `cancelled`
    รายงานว่ารันไทม์ยอมรับหรือบันทึกการยกเลิกหรือไม่

`TaskSummary` มี `id`, `status` และเมทาดาทาที่เป็นทางเลือก เช่น `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, progress,
สรุปสถานะสิ้นสุด และข้อความข้อผิดพลาดที่ผ่านการล้างข้อมูลแล้ว `agentId` ระบุเอเจนต์
ที่กำลังเรียกใช้งาน; `sessionKey` และ `ownerKey` เก็บรักษาบริบทผู้ร้องขอและการควบคุม

### เมธอดตัวช่วยผู้ปฏิบัติงาน

- ผู้ปฏิบัติการอาจเรียก `commands.list` (`operator.read`) เพื่อดึงคลังคำสั่งรันไทม์สำหรับเอเจนต์
  - `agentId` เป็นค่าไม่บังคับ; ละไว้เพื่ออ่านเวิร์กสเปซเอเจนต์เริ่มต้น
  - `scope` ควบคุมว่าพื้นผิวใดที่ `name` หลักจะชี้เป้า:
    - `text` ส่งคืนโทเค็นคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางเริ่มต้น `both` ส่งคืนชื่อเนทีฟที่รับรู้ผู้ให้บริการ
      เมื่อมีให้ใช้
  - `textAliases` พกพาเอเลียสแบบสแลชที่ตรงกันทุกประการ เช่น `/model` และ `/m`
  - `nativeName` พกพาชื่อคำสั่งเนทีฟที่รับรู้ผู้ให้บริการเมื่อมีอยู่
  - `provider` เป็นค่าไม่บังคับและมีผลเฉพาะกับการตั้งชื่อเนทีฟรวมถึงความพร้อมใช้งานของคำสั่ง Plugin เนทีฟ
  - `includeArgs=false` ละเมทาดาทาอาร์กิวเมนต์แบบซีเรียลไลซ์ออกจากการตอบกลับ
- ผู้ปฏิบัติการอาจเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือรันไทม์สำหรับเอเจนต์ การตอบกลับมีเครื่องมือที่จัดกลุ่มและเมทาดาทาที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: ระบุว่าเครื่องมือ Plugin เป็นแบบไม่บังคับหรือไม่
- ผู้ปฏิบัติการอาจเรียก `tools.effective` (`operator.read`) เพื่อดึงคลังเครื่องมือที่มีผลในรันไทม์สำหรับเซสชัน
  - ต้องระบุ `sessionKey`
  - Gateway อนุมานบริบทรันไทม์ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนการยอมรับบริบทการยืนยันตัวตนหรือการส่งมอบที่ผู้เรียกส่งมา
  - การตอบกลับเป็นการฉายภาพจากเซิร์ฟเวอร์ในขอบเขตเซสชันของคลังที่ใช้งานอยู่
    รวมถึงเครื่องมือ core, Plugin, channel และเครื่องมือเซิร์ฟเวอร์ MCP ที่ค้นพบแล้ว
  - `tools.effective` เป็นแบบอ่านอย่างเดียวสำหรับ MCP: อาจฉายแค็ตตาล็อก MCP ของเซสชันที่วอร์มอยู่ผ่านนโยบายเครื่องมือขั้นสุดท้าย แต่จะไม่สร้างรันไทม์ MCP, เชื่อมต่อทรานสปอร์ต หรือออกคำสั่ง
    `tools/list` หากไม่มีแค็ตตาล็อกที่วอร์มอยู่ซึ่งตรงกัน การตอบกลับอาจมีประกาศ เช่น
    `mcp-not-yet-connected`, `mcp-not-yet-listed` หรือ `mcp-stale-catalog`
  - รายการเครื่องมือที่มีผลใช้ `source="core"`, `source="plugin"`, `source="channel"` หรือ
    `source="mcp"`
- ผู้ปฏิบัติการอาจเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือที่มีอยู่หนึ่งรายการผ่านเส้นทางนโยบาย Gateway เดียวกับ `/tools/invoke`
  - ต้องระบุ `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ
    `idempotencyKey` เป็นค่าไม่บังคับ
  - หากมีทั้ง `sessionKey` และ `agentId` เอเจนต์ของเซสชันที่แก้ไขได้ต้องตรงกับ
    `agentId`
  - แรปเปอร์ core สำหรับเจ้าของเท่านั้น เช่น `cron`, `gateway` และ `nodes` ต้องใช้อัตลักษณ์เจ้าของ/ผู้ดูแล (`operator.admin`) แม้ว่าเมธอด `tools.invoke`
    เองจะเป็น `operator.write`
  - การตอบกลับเป็นเอนเวโลปสำหรับ SDK ที่มี `ok`, `toolName`, `output` ที่ไม่บังคับ และฟิลด์
    `error` แบบมีชนิด การปฏิเสธจากการอนุมัติหรือนโยบายจะส่งคืน `ok:false` ในเพย์โหลด แทนการข้ามไปป์ไลน์นโยบายเครื่องมือของ Gateway
- ผู้ปฏิบัติการอาจเรียก `skills.status` (`operator.read`) เพื่อดึงคลัง Skills ที่มองเห็นได้สำหรับเอเจนต์
  - `agentId` เป็นค่าไม่บังคับ; ละไว้เพื่ออ่านเวิร์กสเปซเอเจนต์เริ่มต้น
  - การตอบกลับมีคุณสมบัติการมีสิทธิ์ ข้อกำหนดที่ขาดหาย การตรวจสอบคอนฟิก และตัวเลือกการติดตั้งที่ผ่านการทำให้ปลอดภัยแล้วโดยไม่เปิดเผยค่าลับดิบ
- ผู้ปฏิบัติการอาจเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับเมทาดาทาการค้นพบ ClawHub
- ผู้ปฏิบัติการอาจเรียก `skills.upload.begin`, `skills.upload.chunk` และ
  `skills.upload.commit` (`operator.admin`) เพื่อจัดเตรียมอาร์ไคฟ์ Skill ส่วนตัวก่อนติดตั้ง นี่เป็นเส้นทางอัปโหลดผู้ดูแลแยกต่างหากสำหรับไคลเอนต์ที่เชื่อถือได้
  ไม่ใช่โฟลว์ติดตั้ง Skill ของ ClawHub ตามปกติ และถูกปิดใช้งานโดยค่าเริ่มต้นเว้นแต่จะเปิดใช้
  `skills.install.allowUploadedArchives`
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    สร้างการอัปโหลดที่ผูกกับ slug และค่า force นั้น
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` ต่อท้ายไบต์ที่
    ออฟเซ็ตที่ถอดรหัสแล้วตรงกันทุกประการ
  - `skills.upload.commit({ uploadId, sha256? })` ตรวจสอบขนาดสุดท้ายและ
    SHA-256 Commit จะสรุปการอัปโหลดเท่านั้น; ไม่ได้ติดตั้ง Skill
  - อาร์ไคฟ์ Skill ที่อัปโหลดเป็นอาร์ไคฟ์ zip ที่มีราก `SKILL.md` ชื่อไดเรกทอรีภายในของอาร์ไคฟ์ไม่เคยเป็นตัวเลือกเป้าหมายการติดตั้ง
- ผู้ปฏิบัติการอาจเรียก `skills.install` (`operator.admin`) ได้สามโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้งโฟลเดอร์ Skill ลงในไดเรกทอรี `skills/` ของเวิร์กสเปซเอเจนต์เริ่มต้น
  - โหมดอัปโหลด: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    ติดตั้งการอัปโหลดที่ commit แล้วลงในไดเรกทอรี `skills/<slug>`
    ของเวิร์กสเปซเอเจนต์เริ่มต้น ค่า slug และ force ต้องตรงกับคำขอ
    `skills.upload.begin` เดิม โหมดนี้จะถูกปฏิเสธเว้นแต่จะเปิดใช้
    `skills.install.allowUploadedArchives` การตั้งค่านี้ไม่มีผลต่อการติดตั้ง ClawHub
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, timeoutMs? }`
    รันการกระทำ `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ Gateway
    ไคลเอนต์เก่ายังอาจส่ง `dangerouslyForceUnsafeInstall`; ฟิลด์นี้เลิกใช้แล้ว ยอมรับเฉพาะเพื่อความเข้ากันได้ของโปรโตคอล และถูกละเลย ใช้
    `security.installPolicy` สำหรับการตัดสินใจติดตั้งที่ผู้ปฏิบัติการเป็นเจ้าของ
- ผู้ปฏิบัติการอาจเรียก `skills.update` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามหนึ่งรายการหรือการติดตั้ง ClawHub ที่ติดตามทั้งหมดในเวิร์กสเปซเอเจนต์เริ่มต้น
  - โหมดคอนฟิกแพตช์ค่า `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` รับพารามิเตอร์ `view` ที่ไม่บังคับ:

- ละไว้หรือ `"default"`: พฤติกรรมรันไทม์ปัจจุบัน หากกำหนดค่า `agents.defaults.models` ไว้ การตอบกลับจะเป็นแค็ตตาล็อกที่อนุญาต รวมถึงโมเดลที่ค้นพบแบบไดนามิกสำหรับรายการ `provider/*` มิฉะนั้นการตอบกลับจะเป็นแค็ตตาล็อก Gateway แบบเต็ม
- `"configured"`: พฤติกรรมขนาดเท่าตัวเลือก หากกำหนดค่า `agents.defaults.models` ไว้ ค่านั้นยังคงชนะ รวมถึงการค้นพบในขอบเขตผู้ให้บริการสำหรับรายการ `provider/*` หากไม่มี allowlist การตอบกลับจะใช้รายการ `models.providers.*.models` ที่ระบุชัดเจน และจะ fallback ไปยังแค็ตตาล็อกเต็มเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แค็ตตาล็อก Gateway แบบเต็ม โดยข้าม `agents.defaults.models` ใช้สิ่งนี้สำหรับการวินิจฉัยและ UI การค้นพบ ไม่ใช่ตัวเลือกโมเดลตามปกติ

## การอนุมัติ Exec

- เมื่อคำขอ exec ต้องการการอนุมัติ Gateway จะบรอดแคสต์ `exec.approval.requested`
- ไคลเอนต์ผู้ปฏิบัติการแก้ไขโดยเรียก `exec.approval.resolve` (ต้องใช้สโคป `operator.approvals`)
- สำหรับ `host=node` คำขอ `exec.approval.request` ต้องมี `systemRunPlan` (ข้อมูลมาตรฐาน `argv`/`cwd`/`rawCommand`/เมทาดาทาเซสชัน) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังการอนุมัติ การเรียก `node.invoke system.run` ที่ส่งต่อจะใช้
  `systemRunPlan` มาตรฐานนั้นซ้ำเป็นบริบทคำสั่ง/cwd/เซสชันที่มีอำนาจ
- หากผู้เรียกแก้ไข `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่างการเตรียมและการส่งต่อ `system.run` ที่ได้รับอนุมัติขั้นสุดท้าย
  Gateway จะปฏิเสธการรันแทนการเชื่อถือเพย์โหลดที่ถูกแก้ไข

## Fallback การส่งมอบเอเจนต์

- คำขอ `agent` สามารถมี `deliver=true` เพื่อขอการส่งมอบขาออก
- `bestEffortDeliver=false` คงพฤติกรรมที่เข้มงวด: เป้าหมายการส่งมอบที่แก้ไขไม่ได้หรือเป็นภายในเท่านั้นจะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback ไปยังการดำเนินการเฉพาะเซสชันเมื่อไม่สามารถแก้ไขเส้นทางที่ส่งมอบภายนอกได้ (เช่น เซสชันภายใน/webchat หรือคอนฟิกหลายช่องทางที่กำกวม)
- ผลลัพธ์ `agent` ขั้นสุดท้ายอาจมี `result.deliveryStatus` เมื่อมีการร้องขอการส่งมอบ โดยใช้สถานะ `sent`, `suppressed`, `partial_failed` และ `failed`
  เดียวกับที่จัดทำเอกสารไว้สำหรับ [`openclaw agent --json --deliver`](/th/cli/agent#json-delivery-status)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `packages/gateway-protocol/src/version.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธช่วงที่
  ไม่รวมโปรโตคอลปัจจุบันของตน ไคลเอนต์และเซิร์ฟเวอร์ปัจจุบันต้องใช้
  โปรโตคอล v4
- Schemas + models สร้างจากนิยาม TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ไคลเอนต์

ไคลเอนต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าต่างๆ
คงที่ตลอดโปรโตคอล v4 และเป็น baseline ที่คาดหวังสำหรับไคลเอนต์ภายนอก

| ค่าคงที่                                  | ค่าเริ่มต้น                                               | แหล่งที่มา                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| หมดเวลาคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| หมดเวลา Preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่มงบเซิร์ฟเวอร์/ไคลเอนต์คู่กันได้) |
| backoff การเชื่อมต่อใหม่เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| backoff การเชื่อมต่อใหม่สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| การหนีบ fast-retry หลังปิด device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ระยะผ่อนปรน force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| หมดเวลาเริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| การปิดเมื่อ tick-timeout                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศ `policy.tickIntervalMs`, `policy.maxPayload`,
และ `policy.maxBufferedBytes` ที่มีผลใน `hello-ok`; ไคลเอนต์ควรเคารพค่าเหล่านั้น
แทนค่าเริ่มต้นก่อน handshake

## Auth

- การยืนยันตัวตน Gateway ด้วย shared-secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมดการยืนยันตัวตนที่กำหนดค่าไว้
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ non-loopback
  `gateway.auth.mode: "trusted-proxy"` จะผ่านการตรวจสอบการยืนยันตัวตนสำหรับ connect จาก
  ส่วนหัวคำขอแทน `connect.params.auth.*`
- private-ingress `gateway.auth.mode: "none"` จะข้ามการยืนยันตัวตน connect แบบ shared-secret
  ทั้งหมด อย่าเปิดเผยโหมดนั้นบน ingress สาธารณะ/ไม่น่าเชื่อถือ
- หลังจากจับคู่แล้ว Gateway จะออก **device token** ที่จำกัดขอบเขตตาม role +
  scopes ของการเชื่อมต่อ โดยส่งคืนใน `hello-ok.auth.deviceToken` และไคลเอนต์ควร
  เก็บไว้เพื่อใช้กับการเชื่อมต่อครั้งต่อไป
- ไคลเอนต์ควรเก็บ `hello-ok.auth.deviceToken` หลักหลังจาก connect สำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วย device token ที่ **เก็บไว้** นั้นควรนำชุด scope ที่อนุมัติแล้ว
  ซึ่งเก็บไว้สำหรับ token นั้นกลับมาใช้ด้วย สิ่งนี้จะรักษาสิทธิ์เข้าถึง
  read/probe/status ที่ได้รับอนุญาตแล้ว และหลีกเลี่ยงการลดขอบเขตการเชื่อมต่อใหม่
  อย่างเงียบ ๆ ให้เหลือเพียง scope admin-only โดยนัยที่แคบกว่า
- การประกอบการยืนยันตัวตน connect ฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` แยกอิสระจากส่วนอื่นและจะถูกส่งต่อเสมอเมื่อตั้งค่าไว้
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: shared token ที่ระบุชัดเจนก่อน
    จากนั้น `deviceToken` ที่ระบุชัดเจน แล้วจึงเป็น token ต่ออุปกรณ์ที่เก็บไว้
    (ผูกกับ `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อไม่มีรายการข้างต้นแก้เป็น
    `auth.token` ได้ shared token หรือ device token ใด ๆ ที่แก้ได้จะระงับการส่งค่านี้
  - การเลื่อนระดับ token ของอุปกรณ์ที่เก็บไว้โดยอัตโนมัติในการลองซ้ำแบบครั้งเดียว
    `AUTH_TOKEN_MISMATCH` ถูกจำกัดไว้สำหรับ **ปลายทางที่เชื่อถือได้เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบปักหมุดไว้ `wss://`
    สาธารณะที่ไม่มีการปักหมุดจะไม่เข้าเงื่อนไข
- bootstrap ด้วย setup-code ในตัวจะส่งคืน
  `hello-ok.auth.deviceToken` ของ node หลัก พร้อม token ของ operator ที่มีขอบเขตจำกัดใน
  `hello-ok.auth.deviceTokens` สำหรับการส่งต่อให้มือถือที่เชื่อถือได้ token ของ operator
  มี `operator.talk.secrets` สำหรับการอ่านค่ากำหนด native Talk แต่ไม่รวม scope สำหรับ
  การเปลี่ยนแปลงการจับคู่และ `operator.admin`
- ระหว่างที่ bootstrap ด้วย setup-code ที่ไม่ใช่ baseline กำลังรอการอนุมัติ รายละเอียด
  `PAIRING_REQUIRED` จะมี `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  และ `pauseReconnect: false` ไคลเอนต์ควรเชื่อมต่อใหม่ต่อไปด้วย bootstrap token เดิม
  จนกว่าคำขอจะได้รับการอนุมัติหรือ token จะใช้งานไม่ได้
- เก็บ `hello-ok.auth.deviceTokens` เฉพาะเมื่อ connect ใช้ bootstrap auth
  บน transport ที่เชื่อถือได้ เช่น `wss://` หรือการจับคู่แบบ loopback/local
- หากไคลเอนต์ระบุ `deviceToken` **อย่างชัดเจน** หรือระบุ `scopes` อย่างชัดเจน
  ชุด scope ที่ผู้เรียกขอยังคงเป็นแหล่งอ้างอิงหลัก scope ที่แคชไว้จะถูกนำกลับมาใช้
  เฉพาะเมื่อไคลเอนต์กำลังนำ token ต่ออุปกรณ์ที่เก็บไว้กลับมาใช้
- Device tokens สามารถหมุนเวียน/เพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องใช้ scope `operator.pairing`) การหมุนเวียนหรือ
  เพิกถอน node หรือ role อื่นที่ไม่ใช่ operator ต้องใช้ `operator.admin` ด้วย
- `device.token.rotate` จะส่งคืน metadata การหมุนเวียน โดยจะสะท้อน bearer token
  ทดแทนเฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ยืนยันตัวตนด้วย device token นั้นอยู่แล้ว
  เพื่อให้ไคลเอนต์ที่ใช้เฉพาะ token สามารถเก็บค่าทดแทนก่อนเชื่อมต่อใหม่ได้
  การหมุนเวียนแบบ shared/admin จะไม่สะท้อน bearer token
- การออก token การหมุนเวียน และการเพิกถอนจะถูกจำกัดไว้กับชุด role ที่อนุมัติแล้ว
  ซึ่งบันทึกอยู่ในรายการจับคู่ของอุปกรณ์นั้น การเปลี่ยนแปลง token ไม่สามารถขยายหรือ
  กำหนดเป้าหมาย role ของอุปกรณ์ที่การอนุมัติการจับคู่ไม่เคยให้ไว้
- สำหรับเซสชัน token ของอุปกรณ์ที่จับคู่แล้ว การจัดการอุปกรณ์จะจำกัดขอบเขตไว้กับตนเอง
  เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ admin สามารถจัดการได้เฉพาะ
  token ของ operator สำหรับรายการอุปกรณ์ **ของตนเอง** เท่านั้น การจัดการ token ของ node
  และ token อื่นที่ไม่ใช่ operator เป็น admin-only แม้สำหรับอุปกรณ์ของผู้เรียกเอง
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุด scope ของ token
  operator เป้าหมายเทียบกับ scope ของเซสชันปัจจุบันของผู้เรียกด้วย ผู้เรียกที่ไม่ใช่
  admin ไม่สามารถหมุนเวียนหรือเพิกถอน token operator ที่มีขอบเขตกว้างกว่าที่ตนมีอยู่แล้ว
- ความล้มเหลวของการยืนยันตัวตนจะมี `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลองซ้ำแบบมีขอบเขตหนึ่งครั้งด้วย token ต่ออุปกรณ์ที่แคชไว้
  - หากการลองซ้ำนั้นล้มเหลว ไคลเอนต์ควรหยุดลูปเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำการดำเนินการสำหรับ operator
- `AUTH_SCOPE_MISMATCH` หมายความว่า device token ได้รับการจดจำแล้วแต่ไม่ครอบคลุม
  role/scopes ที่ร้องขอ ไคลเอนต์ไม่ควรนำเสนอสิ่งนี้ว่าเป็น token ที่ไม่ถูกต้อง
  ให้แจ้ง operator เพื่อจับคู่ใหม่หรืออนุมัติสัญญา scope ที่แคบกว่า/กว้างกว่า

## ข้อมูลระบุตัวตนอุปกรณ์ + การจับคู่

- Nodes ควรมีข้อมูลระบุตัวตนอุปกรณ์ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  fingerprint ของ keypair
- Gateway ออก token ต่ออุปกรณ์ + role
- ต้องมีการอนุมัติการจับคู่สำหรับ ID อุปกรณ์ใหม่ เว้นแต่จะเปิดใช้การอนุมัติอัตโนมัติแบบ local
- การอนุมัติการจับคู่อัตโนมัติมีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่แคบสำหรับ
  helper flows แบบ shared-secret ที่เชื่อถือได้
- การเชื่อมต่อ tailnet หรือ LAN บนโฮสต์เดียวกันยังคงถือเป็นระยะไกลสำหรับการจับคู่และ
  ต้องได้รับการอนุมัติ
- โดยปกติไคลเอนต์ WS จะรวมข้อมูลระบุตัวตน `device` ระหว่าง `connect` (operator +
  node) ข้อยกเว้น operator ที่ไม่มีอุปกรณ์มีเฉพาะเส้นทางความเชื่อถือที่ระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP ที่ไม่ปลอดภัยแบบ localhost-only
  - การยืนยันตัวตน Control UI ของ operator ผ่าน `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
  - RPC backend ของ `gateway-client` แบบ direct-loopback บนเส้นทาง helper ภายในที่สงวนไว้
- การละเว้นข้อมูลระบุตัวตนอุปกรณ์มีผลต่อ scope เมื่ออนุญาตการเชื่อมต่อ operator
  ที่ไม่มีอุปกรณ์ผ่านเส้นทางความเชื่อถือที่ระบุชัดเจน OpenClaw ยังคงล้าง scope
  ที่ประกาศเองเป็นชุดว่าง เว้นแต่เส้นทางนั้นมีข้อยกเว้นการรักษา scope ที่มีชื่อกำกับ
  จากนั้นเมธอดที่ถูกควบคุมด้วย scope จะล้มเหลวด้วย `missing scope`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` เป็นเส้นทางรักษา scope
  แบบ break-glass ของ Control UI ไม่ได้ให้ scope แก่ไคลเอนต์ WebSocket แบบ backend
  หรือ CLI-shaped ที่กำหนดเองโดยพลการ
- เส้นทาง helper backend ของ `gateway-client` แบบ direct-loopback ที่สงวนไว้จะรักษา
  scope เฉพาะสำหรับ RPC control-plane แบบ local ภายในเท่านั้น ID backend ที่กำหนดเอง
  จะไม่ได้รับข้อยกเว้นนี้
- การเชื่อมต่อทั้งหมดต้องลงนาม nonce `connect.challenge` ที่เซิร์ฟเวอร์ให้มา

### การวินิจฉัยการย้ายการยืนยันตัวตนอุปกรณ์

สำหรับไคลเอนต์รุ่นเก่าที่ยังคงใช้พฤติกรรมการลงนามก่อน challenge ตอนนี้ `connect` จะส่งคืน
โค้ดรายละเอียด `DEVICE_AUTH_*` ใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวในการย้ายที่พบบ่อย:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ละเว้น `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่า/ผิด            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ลายเซ็นไม่ตรงกับ payload v2       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอก skew ที่อนุญาต          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/canonicalization ของ public key ล้มเหลว         |

เป้าหมายการย้าย:

- รอ `connect.challenge` เสมอ
- ลงนาม payload v2 ที่มี nonce ของเซิร์ฟเวอร์
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload ลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` รุ่นเก่ายังคงได้รับการยอมรับเพื่อความเข้ากันได้ แต่การปักหมุด
  metadata ของอุปกรณ์ที่จับคู่แล้วยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + การปักหมุด

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์อาจเลือกปักหมุด fingerprint ของใบรับรอง Gateway ได้ (ดู config `gateway.tls`
  พร้อม `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## Scope

โปรโตคอลนี้เปิดเผย **Gateway API เต็มรูปแบบ** (status, channels, models, chat,
agent, sessions, nodes, approvals เป็นต้น) พื้นผิวที่แน่นอนกำหนดโดย
TypeBox schemas ใน `packages/gateway-protocol/src/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [runbook ของ Gateway](/th/gateway)
