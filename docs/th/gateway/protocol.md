---
read_when:
    - การใช้งานหรือการอัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักโปรโตคอลที่ไม่ตรงกันหรือความล้มเหลวในการเชื่อมต่อ
    - กำลังสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การจับมือ, เฟรม, การกำหนดเวอร์ชัน'
title: Gateway protocol
x-i18n:
    generated_at: "2026-06-27T17:37:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

โปรโตคอล Gateway WS คือ **control plane + การส่งข้อมูลของโหนดแบบเดียว** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, UI บนเว็บ, แอป macOS, โหนด iOS/Android,
โหนดแบบ headless) เชื่อมต่อผ่าน WebSocket และประกาศ **บทบาท** + **ขอบเขต**
ของตนในช่วง handshake

## การส่งข้อมูล

- WebSocket, text frames ที่มี JSON payload
- frame แรก **ต้อง** เป็นคำขอ `connect`
- frame ก่อน connect จำกัดไว้ที่ 64 KiB หลัง handshake สำเร็จ ไคลเอนต์
  ควรทำตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิด diagnostics ไว้
  frame ขาเข้าที่ใหญ่เกินและบัฟเฟอร์ขาออกที่ช้าจะปล่อยเหตุการณ์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้ง frame ที่ได้รับผลกระทบ เหตุการณ์เหล่านี้เก็บ
  ขนาด ขีดจำกัด พื้นผิว และรหัสเหตุผลที่ปลอดภัย แต่ไม่เก็บเนื้อหาข้อความ
  เนื้อหาสิ่งแนบ เนื้อหา frame ดิบ token, cookie หรือค่าลับ

## Handshake (connect)

Gateway → ไคลเอนต์ (pre-connect challenge):

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

ขณะที่ Gateway ยังเริ่ม sidecar ช่วง startup ไม่เสร็จ คำขอ `connect` อาจ
ส่งคืนข้อผิดพลาด `UNAVAILABLE` ที่ลองใหม่ได้ โดยมี `details.reason` ตั้งเป็น
`"startup-sidecars"` และมี `retryAfterMs` ไคลเอนต์ควรลองส่ง response นั้นใหม่
ภายในงบเวลาการเชื่อมต่อโดยรวม แทนที่จะแสดงเป็นความล้มเหลวของ handshake ขั้นสุดท้าย

`server`, `features`, `snapshot` และ `policy` ทั้งหมดเป็นค่าที่ schema
(`packages/gateway-protocol/src/schema/frames.ts`) กำหนดว่าต้องมี `auth` ก็ต้องมีเช่นกัน
และรายงานบทบาท/ขอบเขตที่ negotiate แล้ว `pluginSurfaceUrls` เป็นค่าไม่บังคับ
และ map ชื่อพื้นผิวของ plugin เช่น `canvas` ไปยัง URL ที่ host ไว้แบบมีขอบเขต

URL พื้นผิว plugin แบบมีขอบเขตอาจหมดอายุได้ โหนดสามารถเรียก
`node.pluginSurface.refresh` พร้อม `{ "surface": "canvas" }` เพื่อรับรายการใหม่
ใน `pluginSurfaceUrls` การ refactor Canvas plugin แบบทดลองไม่รองรับเส้นทางความเข้ากันได้
ที่เลิกใช้แล้วอย่าง `canvasHostUrl`, `canvasCapability` หรือ
`node.canvas.capability.refresh`; ไคลเอนต์ native และ gateway ปัจจุบันต้องใช้พื้นผิว plugin

เมื่อไม่ได้ออก device token, `hello-ok.auth` จะรายงาน permissions ที่ negotiate แล้ว
โดยไม่มีฟิลด์ token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ไคลเอนต์ backend แบบ same-process ที่เชื่อถือได้ (`client.id: "gateway-client"`,
`client.mode: "backend"`) อาจละ `device` ได้บนการเชื่อมต่อ loopback โดยตรง
เมื่อยืนยันตัวตนด้วย gateway token/password ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้สำหรับ
RPC ของ control plane ภายใน และป้องกันไม่ให้ baseline การจับคู่ CLI/device ที่ค้างอยู่
ขวางงาน backend ในเครื่อง เช่น การอัปเดตเซสชัน subagent ไคลเอนต์ระยะไกล
ไคลเอนต์จาก browser-origin, ไคลเอนต์โหนด และไคลเอนต์ device-token/device-identity
แบบชัดเจนยังคงใช้การจับคู่และการตรวจ scope-upgrade ปกติ

เมื่อมีการออก device token, `hello-ok` จะรวมสิ่งต่อไปนี้ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

bootstrap ด้วย QR/setup-code ในตัวเป็นเส้นทาง handoff มือถือแบบใหม่ การ connect
ด้วย baseline setup-code ที่สำเร็จจะส่งคืน token โหนดหลักพร้อม operator token
ที่มีขอบเขตจำกัดหนึ่งรายการ:

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

operator handoff ถูกจำกัดโดยตั้งใจ เพื่อให้การ onboarding ผ่าน QR เริ่ม loop ของ
mobile operator ได้โดยไม่มอบ `operator.admin` หรือ `operator.pairing`
ทั้งนี้รวม `operator.talk.secrets` เพื่อให้ไคลเอนต์ native อ่านการกำหนดค่า Talk
ที่ต้องใช้หลัง bootstrap ได้ ขอบเขต admin และ pairing ที่กว้างขึ้นต้องใช้
การจับคู่ operator หรือ token flow ที่อนุมัติแยกต่างหาก ไคลเอนต์ควรคงค่า
`hello-ok.auth.deviceTokens` ไว้เฉพาะเมื่อการ connect ใช้ bootstrap auth
บน transport ที่เชื่อถือได้ เช่น `wss://` หรือการจับคู่ loopback/local

### ตัวอย่างโหนด

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

## การจัด frame

- **คำขอ**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **เหตุการณ์**: `{type:"event", event, payload, seq?, stateVersion?}`

method ที่มี side effect ต้องใช้ **idempotency keys** (ดู schema)

## บทบาท + ขอบเขต

สำหรับโมเดลขอบเขต operator ฉบับเต็ม การตรวจช่วงอนุมัติ และความหมายของ shared-secret
ดู [ขอบเขต operator](/th/gateway/operator-scopes)

### บทบาท

- `operator` = ไคลเอนต์ control plane (CLI/UI/automation)
- `node` = host ความสามารถ (camera/screen/canvas/system.run)

### ขอบเขต (operator)

ขอบเขตที่พบบ่อย:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` พร้อม `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)

method RPC ของ gateway ที่ plugin ลงทะเบียนอาจขอขอบเขต operator ของตนเองได้ แต่
prefix admin หลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะ resolve เป็น `operator.admin` เสมอ

ขอบเขตของ method เป็นเพียงด่านแรกเท่านั้น slash command บางรายการที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจระดับ command ที่เข้มงวดกว่าเพิ่มเติม เช่น การเขียนถาวร
`/config set` และ `/config unset` ต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจขอบเขตช่วงอนุมัติเพิ่มเติม นอกเหนือจากขอบเขต method พื้นฐาน:

- คำขอที่ไม่มี command: `operator.pairing`
- คำขอที่มี command โหนดที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่รวม `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (โหนด)

โหนดประกาศ capability claims ตอน connect:

- `caps`: หมวดหมู่ความสามารถระดับสูง เช่น `camera`, `canvas`, `screen`,
  `location`, `voice` และ `talk`
- `commands`: allowlist ของ command สำหรับ invoke
- `permissions`: toggle แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือค่าสิ่งเหล่านี้เป็น **claims** และบังคับใช้ allowlist ฝั่ง server

## Presence

- `system-presence` ส่งคืนรายการที่ key ด้วย identity ของอุปกรณ์
- รายการ Presence รวม `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงหนึ่งแถวต่ออุปกรณ์ได้
  แม้อุปกรณ์นั้นจะเชื่อมต่อเป็นทั้ง **operator** และ **node**
- `node.list` รวมฟิลด์ไม่บังคับ `lastSeenAtMs` และ `lastSeenReason` โหนดที่เชื่อมต่ออยู่รายงาน
  เวลาการเชื่อมต่อปัจจุบันเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; โหนดที่จับคู่แล้วอาจรายงาน
  presence เบื้องหลังแบบ durable ได้เช่นกัน เมื่อเหตุการณ์โหนดที่เชื่อถือได้อัปเดต metadata การจับคู่ของตน

### เหตุการณ์โหนดยังทำงานอยู่เบื้องหลัง

โหนดอาจเรียก `node.event` พร้อม `event: "node.presence.alive"` เพื่อบันทึกว่าโหนดที่จับคู่แล้ว
ยังมีชีวิตอยู่ระหว่างการปลุกเบื้องหลัง โดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น closed enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` string trigger ที่ไม่รู้จักจะถูก normalize เป็น
`background` โดย gateway ก่อน persistence เหตุการณ์นี้ durable เฉพาะสำหรับเซสชันอุปกรณ์โหนด
ที่ยืนยันตัวตนแล้วเท่านั้น; เซสชันที่ไม่มีอุปกรณ์หรือไม่ได้จับคู่จะส่งคืน `handled: false`

gateway ที่สำเร็จจะส่งคืนผลลัพธ์แบบมีโครงสร้าง:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

gateway รุ่นเก่าอาจยังส่งคืน `{ "ok": true }` สำหรับ `node.event`; ไคลเอนต์ควรมองว่านั่นเป็น
RPC ที่ได้รับการยืนยันแล้ว ไม่ใช่การ persist presence แบบ durable

## การกำหนดขอบเขตเหตุการณ์ broadcast

เหตุการณ์ broadcast ผ่าน WebSocket ที่ server push จะถูก gate ด้วยขอบเขต เพื่อไม่ให้เซสชันที่มีขอบเขตเฉพาะ pairing หรือเฉพาะโหนดรับเนื้อหาเซสชันแบบ passive

- **frame ของ chat, agent และ tool-result** (รวมถึงเหตุการณ์ `agent` แบบ streamed และผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้าม frame เหล่านี้ทั้งหมด
- **broadcast `plugin.*` ที่ plugin กำหนด** จะถูก gate เป็น `operator.write` หรือ `operator.admin` ขึ้นกับวิธีที่ plugin ลงทะเบียนไว้
- **เหตุการณ์สถานะและ transport** (`heartbeat`, `presence`, `tick`, lifecycle connect/disconnect ฯลฯ) ยังคงไม่ถูกจำกัด เพื่อให้ทุกเซสชันที่ยืนยันตัวตนแล้วสังเกตสุขภาพของ transport ได้
- **ตระกูลเหตุการณ์ broadcast ที่ไม่รู้จัก** จะถูก gate ด้วยขอบเขตโดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนคลายอย่างชัดเจน

การเชื่อมต่อไคลเอนต์แต่ละรายการเก็บ sequence number ต่อไคลเอนต์ของตนเอง เพื่อให้ broadcast รักษาลำดับ monotonic บน socket นั้น แม้ไคลเอนต์แต่ละรายจะเห็น subset ของ event stream ที่ถูกกรองตามขอบเขตต่างกัน

## ตระกูล method RPC ที่พบบ่อย

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ด้านบน นี่ไม่ใช่ dump ที่สร้างขึ้น —
`hello-ok.features.methods` เป็นรายการ discovery แบบอนุรักษนิยมที่สร้างจาก
`src/gateway/server-methods-list.ts` บวกกับ export method ของ plugin/channel ที่โหลดแล้ว
ให้ถือว่าเป็น feature discovery ไม่ใช่การแจกแจงครบถ้วนของ `src/gateway/server-methods/*.ts`

  <AccordionGroup>
  <Accordion title="ระบบและตัวตน">
    - `health` ส่งคืนสแนปช็อตสุขภาพของ Gateway ที่แคชไว้หรือเพิ่งตรวจสอบใหม่
    - `diagnostics.stability` ส่งคืนตัวบันทึกเสถียรภาพการวินิจฉัยล่าสุดแบบมีขอบเขต โดยเก็บเมทาดาทาการดำเนินงาน เช่น ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าการอ่านหน่วยความจำ สถานะคิว/เซสชัน ชื่อช่องทาง/Plugin และรหัสเซสชัน ไม่เก็บข้อความแชต เนื้อหา Webhook เอาต์พุตเครื่องมือ เนื้อหาคำขอหรือคำตอบดิบ โทเค็น คุกกี้ หรือค่าลับ ต้องมีขอบเขตการอ่านของผู้ปฏิบัติงาน
    - `status` ส่งคืนสรุป Gateway แบบ `/status`; ฟิลด์ที่ละเอียดอ่อนจะรวมเฉพาะสำหรับไคลเอนต์ผู้ปฏิบัติงานที่มีขอบเขตผู้ดูแลระบบ
    - `gateway.identity.get` ส่งคืนตัวตนอุปกรณ์ Gateway ที่ใช้โดยโฟลว์รีเลย์และการจับคู่
    - `system-presence` ส่งคืนสแนปช็อต presence ปัจจุบันสำหรับอุปกรณ์ผู้ปฏิบัติงาน/Node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่มเหตุการณ์ระบบและสามารถอัปเดต/บรอดแคสต์บริบท presence ได้
    - `last-heartbeat` ส่งคืนเหตุการณ์ Heartbeat ล่าสุดที่บันทึกถาวรไว้
    - `set-heartbeats` สลับการประมวลผล Heartbeat บน Gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแค็ตตาล็อกโมเดลที่รันไทม์อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าแล้วขนาดเหมาะกับตัวเลือก (`agents.defaults.models` ก่อน แล้วตามด้วย `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแค็ตตาล็อกทั้งหมด
    - `usage.status` ส่งคืนสรุปหน้าต่างการใช้งาน/โควตาคงเหลือของผู้ให้บริการ
    - `usage.cost` ส่งคืนสรุปค่าใช้จ่ายการใช้งานแบบรวมสำหรับช่วงวันที่
      ส่ง `agentId` สำหรับเอเจนต์หนึ่งตัว หรือ `agentScope: "all"` เพื่อรวมเอเจนต์ที่กำหนดค่าไว้
    - `doctor.memory.status` ส่งคืนความพร้อมของ vector-memory / embedding ที่แคชไว้สำหรับ workspace เอเจนต์เริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจน ไคลเอนต์ที่รองรับ Dreaming อาจส่ง `{ "agentId": "agent-id" }` เพื่อจำกัดสถิติที่เก็บ Dreaming ไปยัง workspace เอเจนต์ที่เลือกได้ด้วย; การละเว้น `agentId` จะคง fallback ไปยังเอเจนต์เริ่มต้นและรวม workspace Dreaming ที่กำหนดค่าไว้
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, และ `doctor.memory.dedupeDreamDiary` รับพารามิเตอร์ `{ "agentId": "agent-id" }` แบบไม่บังคับสำหรับมุมมอง/การกระทำ Dreaming ของเอเจนต์ที่เลือก เมื่อละเว้น `agentId` จะทำงานกับ workspace เอเจนต์เริ่มต้นที่กำหนดค่าไว้
    - `doctor.memory.remHarness` ส่งคืนตัวอย่าง REM harness แบบอ่านอย่างเดียวและมีขอบเขตสำหรับไคลเอนต์ control-plane ระยะไกล อาจรวมพาธ workspace, snippet หน่วยความจำ, markdown grounded ที่เรนเดอร์แล้ว และตัวเลือกการโปรโมตเชิงลึก ดังนั้นผู้เรียกต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานรายเซสชัน ส่ง `agentId` สำหรับ
      เอเจนต์หนึ่งตัว หรือ `agentScope: "all"` เพื่อแสดงเอเจนต์ที่กำหนดค่าไว้ร่วมกัน
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบ timeseries สำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="ช่องทางและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะช่องทาง/Plugin แบบ built-in + bundled
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีที่ระบุเมื่อช่องทางรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบ QR/เว็บสำหรับผู้ให้บริการช่องทางเว็บปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบ QR/เว็บนั้นเสร็จสมบูรณ์และเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง Node iOS ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืนทริกเกอร์ wake-word ที่จัดเก็บไว้
    - `voicewake.set` อัปเดตทริกเกอร์ wake-word และบรอดแคสต์การเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การส่งข้อความและบันทึก">
    - `send` คือ RPC การส่งออกโดยตรงสำหรับการส่งที่ระบุช่องทาง/บัญชี/thread นอก chat runner
    - `logs.tail` ส่งคืนส่วนท้ายบันทึกไฟล์ Gateway ที่กำหนดค่าไว้ พร้อมการควบคุม cursor/limit และ max-byte

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.catalog` ส่งคืนแค็ตตาล็อกผู้ให้บริการ Talk แบบอ่านอย่างเดียวสำหรับเสียงพูด การถอดเสียงแบบสตรีม และเสียงแบบเรียลไทม์ โดยรวมรหัสผู้ให้บริการ ป้ายกำกับ สถานะที่กำหนดค่า รหัสโมเดล/เสียงที่เปิดเผย โหมด canonical การขนส่ง กลยุทธ์สมอง และแฟล็กเสียง/ความสามารถแบบเรียลไทม์ โดยไม่ส่งคืนความลับของผู้ให้บริการหรือแก้ไข config ส่วนกลาง
    - `talk.config` ส่งคืน payload config Talk ที่มีผล; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.session.create` สร้างเซสชัน Talk ที่ Gateway เป็นเจ้าของสำหรับ `realtime/gateway-relay`, `transcription/gateway-relay`, หรือ `stt-tts/managed-room` สำหรับ `stt-tts/managed-room` ผู้เรียก `operator.write` ที่ส่ง `sessionKey` ต้องส่ง `spawnedBy` ด้วยเพื่อการมองเห็น session-key แบบมีขอบเขต; การสร้าง `sessionKey` แบบไม่มีขอบเขตและ `brain: "direct-tools"` ต้องใช้ `operator.admin`
    - `talk.session.join` ตรวจสอบโทเค็นเซสชัน managed-room, ปล่อยเหตุการณ์ `session.ready` หรือ `session.replaced` ตามจำเป็น และส่งคืนเมทาดาทาห้อง/เซสชันพร้อมเหตุการณ์ Talk ล่าสุด โดยไม่มีโทเค็นข้อความล้วนหรือแฮชโทเค็นที่จัดเก็บไว้
    - `talk.session.appendAudio` เพิ่มเสียงอินพุต PCM แบบ base64 ไปยังเซสชันรีเลย์เรียลไทม์และถอดเสียงที่ Gateway เป็นเจ้าของ
    - `talk.session.startTurn`, `talk.session.endTurn`, และ `talk.session.cancelTurn` ขับเคลื่อน lifecycle ของ turn ใน managed-room พร้อมปฏิเสธ stale-turn ก่อนล้างสถานะ
    - `talk.session.cancelOutput` หยุดเอาต์พุตเสียงของผู้ช่วย โดยหลักสำหรับการแทรกพูดที่ gated ด้วย VAD ในเซสชันรีเลย์ Gateway
    - `talk.session.submitToolResult` ทำให้การเรียกเครื่องมือของผู้ให้บริการที่ปล่อยโดยเซสชันรีเลย์เรียลไทม์ที่ Gateway เป็นเจ้าของเสร็จสมบูรณ์ ส่ง `options: { willContinue: true }` สำหรับเอาต์พุตเครื่องมือชั่วคราวเมื่อจะมีผลลัพธ์สุดท้ายตามมา หรือ `options: { suppressResponse: true }` เมื่อผลลัพธ์เครื่องมือควรทำให้การเรียกผู้ให้บริการสำเร็จโดยไม่เริ่มคำตอบผู้ช่วยเรียลไทม์อีกครั้ง
    - `talk.session.steer` ส่งการควบคุมเสียงของ active-run เข้าไปยังเซสชัน Talk ที่มีเอเจนต์รองรับและ Gateway เป็นเจ้าของ โดยรับ `{ sessionId, text, mode? }` ซึ่ง `mode` คือ `status`, `steer`, `cancel`, หรือ `followup`; โหมดที่ละเว้นจะถูกจัดประเภทจากข้อความพูด
    - `talk.session.close` ปิดเซสชันรีเลย์ ถอดเสียง หรือ managed-room ที่ Gateway เป็นเจ้าของ และปล่อยเหตุการณ์ Talk ปลายทาง
    - `talk.mode` ตั้งค่า/บรอดแคสต์สถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.client.create` สร้างเซสชันผู้ให้บริการเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของโดยใช้ `webrtc` หรือ `provider-websocket` ขณะที่ Gateway เป็นเจ้าของ config, ข้อมูลประจำตัว, คำสั่ง และนโยบายเครื่องมือ
    - `talk.client.toolCall` ให้การขนส่งเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของส่งต่อการเรียกเครื่องมือของผู้ให้บริการไปยังนโยบาย Gateway เครื่องมือที่รองรับตัวแรกคือ `openclaw_agent_consult`; ไคลเอนต์ได้รับรหัส run และรอเหตุการณ์ lifecycle แชตปกติก่อนส่งผลลัพธ์เครื่องมือเฉพาะผู้ให้บริการ
    - `talk.client.steer` ส่งการควบคุมเสียงของ active-run สำหรับการขนส่งเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของ Gateway จะแก้ active embedded run จาก `sessionKey` และส่งคืนผลลัพธ์ accepted/rejected แบบมีโครงสร้างแทนการทิ้ง steering อย่างเงียบ ๆ
    - `talk.event` คือช่องทางเหตุการณ์ Talk เดียวสำหรับอะแดปเตอร์เรียลไทม์ การถอดเสียง STT/TTS, managed-room, โทรศัพท์ และการประชุม
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะเปิดใช้งาน TTS ผู้ให้บริการที่ใช้งานอยู่ ผู้ให้บริการ fallback และสถานะ config ผู้ให้บริการ
    - `tts.providers` ส่งคืน inventory ผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะ prefs ของ TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงแบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ config การอัปเดต และ wizard">
    - `secrets.reload` resolve `SecretRefs` ที่ใช้งานอยู่อีกครั้งและสลับสถานะความลับของรันไทม์เฉพาะเมื่อสำเร็จทั้งหมด
    - `secrets.resolve` resolve การกำหนดความลับเป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายที่ระบุ
    - `config.get` ส่งคืนสแนปช็อต config ปัจจุบันและแฮช
    - `config.set` เขียน payload config ที่ตรวจสอบแล้ว
    - `config.patch` รวมการอัปเดต config บางส่วน การแทนที่อาร์เรย์แบบทำลาย
      ต้องมีพาธที่ได้รับผลกระทบใน `replacePaths`; อาร์เรย์ซ้อน
      ภายใต้รายการอาร์เรย์ใช้พาธ `[]` เช่น `agents.list[].skills`
    - `config.apply` ตรวจสอบ + แทนที่ payload config ทั้งหมด
    - `config.schema` ส่งคืน payload schema config สดที่ใช้โดย Control UI และเครื่องมือ CLI: schema, `uiHints`, เวอร์ชัน และเมทาดาทาการสร้าง รวมถึงเมทาดาทา schema ของ Plugin + ช่องทางเมื่อรันไทม์โหลดได้ schema รวมเมทาดาทาฟิลด์ `title` / `description` ที่ได้จากป้ายกำกับและข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึง object ซ้อน, wildcard, array-item และ branch การประกอบ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืน payload lookup ที่จำกัดด้วยพาธสำหรับหนึ่งพาธ config: พาธที่ normalize แล้ว, node schema แบบตื้น, hint ที่ตรงกัน + `hintPath`, `reloadKind` แบบไม่บังคับ และสรุปลูกทันทีสำหรับการเจาะลึก UI/CLI `reloadKind` เป็นหนึ่งใน `restart`, `hot`, หรือ `none` และสะท้อน planner การ reload config ของ Gateway สำหรับพาธที่ร้องขอ node schema ของ lookup จะคงเอกสารที่ผู้ใช้เห็นและฟิลด์ตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขต numeric/string/array/object และแฟล็กเช่น `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกเปิดเผย `key`, `path` ที่ normalize แล้ว, `type`, `required`, `hasChildren`, `reloadKind` แบบไม่บังคับ รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รันโฟลว์อัปเดต Gateway และจัดกำหนดการรีสตาร์ทเฉพาะเมื่อการอัปเดตเองสำเร็จ; ผู้เรียกที่มีเซสชันสามารถรวม `continuationMessage` เพื่อให้ startup กลับมาทำ agent turn ติดตามผลหนึ่งครั้งผ่านคิว restart continuation การอัปเดตผ่าน package-manager และการอัปเดต git-checkout ที่มีการควบคุมจาก control plane ใช้การส่งต่อไปยัง managed-service แบบ detached แทนการแทนที่ package tree หรือแก้ไขเอาต์พุต checkout/build ภายใน Gateway ที่กำลังทำงาน handoff ที่เริ่มแล้วส่งคืน `ok: true` พร้อม `result.reason: "managed-service-handoff-started"` และ `handoff.status: "started"`; handoff ที่ไม่พร้อมใช้งานหรือล้มเหลวส่งคืน `ok: false` พร้อม `managed-service-handoff-unavailable` หรือ `managed-service-handoff-failed` รวมถึง `handoff.command` เมื่อจำเป็นต้องอัปเดต shell ด้วยตนเอง handoff ที่ไม่พร้อมใช้งานหมายความว่า OpenClaw ไม่มีขอบเขต supervisor ที่ปลอดภัยหรือตัวตนบริการที่ทนทาน เช่น `OPENCLAW_SYSTEMD_UNIT` สำหรับ systemd ระหว่าง handoff ที่เริ่มแล้ว restart sentinel อาจรายงาน `stats.reason: "restart-health-pending"` ชั่วครู่; continuation จะถูกหน่วงจนกว่า CLI จะตรวจสอบ Gateway ที่รีสตาร์ทแล้วและเขียน sentinel `ok` สุดท้าย
    - `update.status` รีเฟรชและส่งคืน restart sentinel การอัปเดตล่าสุด รวมถึงเวอร์ชันที่ทำงานอยู่หลังรีสตาร์ทเมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status`, และ `wizard.cancel` เปิดเผย onboarding wizard ผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วยเอเจนต์และเวิร์กสเปซ">
    - `agents.list` ส่งคืนรายการเอเจนต์ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลใช้งานและเมทาดาทารันไทม์
    - `agents.create`, `agents.update` และ `agents.delete` จัดการระเบียนเอเจนต์และการเชื่อมโยงเวิร์กสเปซ
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการไฟล์เวิร์กสเปซเริ่มต้นที่เปิดเผยให้เอเจนต์ใช้งาน
    - `tasks.list`, `tasks.get` และ `tasks.cancel` เปิดเผยบัญชีแยกประเภทธุรกรรมงานของ Gateway ให้ไคลเอนต์ SDK และผู้ปฏิบัติงานใช้งาน
    - `artifacts.list`, `artifacts.get` และ `artifacts.download` เปิดเผยสรุปอาร์ติแฟกต์ที่ได้จากทรานสคริปต์และการดาวน์โหลดสำหรับขอบเขต `sessionKey`, `runId` หรือ `taskId` ที่ระบุชัดเจน การสืบค้นรันและงานจะแก้ไขเซสชันเจ้าของที่ฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อทรานสคริปต์ที่มีแหล่งที่มาตรงกันเท่านั้น แหล่ง URL ที่ไม่ปลอดภัยหรือเป็นโลคัลจะส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการดึงข้อมูลฝั่งเซิร์ฟเวอร์
    - `environments.list` และ `environments.status` เปิดเผยการค้นหาสภาพแวดล้อมแบบอ่านอย่างเดียวของ Gateway โลคัลและ Node ให้ไคลเอนต์ SDK ใช้งาน
    - `agent.identity.get` ส่งคืนอัตลักษณ์ผู้ช่วยที่มีผลใช้งานสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้รันเสร็จสิ้นและส่งคืนสแนปช็อตปลายทางเมื่อมีให้ใช้งาน

  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึงเมทาดาทา `agentRuntime` ต่อแถวเมื่อกำหนดค่าแบ็กเอนด์รันไทม์ของเอเจนต์ไว้
    - `sessions.subscribe` และ `sessions.unsubscribe` เปิดหรือปิดการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` เปิดหรือปิดการสมัครรับเหตุการณ์ทรานสคริปต์/ข้อความสำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนตัวอย่างทรานสคริปต์แบบจำกัดขอบเขตสำหรับคีย์เซสชันที่ระบุ
    - `sessions.describe` ส่งคืนแถวเซสชัน Gateway หนึ่งแถวสำหรับคีย์เซสชันที่ตรงกันพอดี
    - `sessions.resolve` แก้ไขหรือทำให้เป้าหมายเซสชันเป็นรูปแบบมาตรฐาน
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปในเซสชันที่มีอยู่
    - `sessions.steer` เป็นรูปแบบขัดจังหวะและบังคับทิศทางสำหรับเซสชันที่กำลังทำงาน
    - `sessions.abort` ยกเลิกงานที่กำลังทำงานสำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่ไม่บังคับ หรือส่งเฉพาะ `runId` สำหรับรันที่ทำงานอยู่ซึ่ง Gateway สามารถแก้ไขเป็นเซสชันได้
    - `sessions.patch` อัปเดตเมทาดาทา/การแทนที่ของเซสชัน และรายงานโมเดลมาตรฐานที่แก้ไขแล้วพร้อม `agentRuntime` ที่มีผลใช้งาน
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ดำเนินการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้ทั้งหมด
    - การดำเนินการแชทยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` `chat.history` ถูกปรับให้อยู่ในรูปแบบการแสดงผลสำหรับไคลเอนต์ UI: แท็กคำสั่งแบบอินไลน์จะถูกตัดออกจากข้อความที่มองเห็นได้, เพย์โหลด XML ของการเรียกเครื่องมือแบบข้อความธรรมดา (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) และโทเค็นควบคุมโมเดล ASCII/เต็มความกว้างที่รั่วออกมาจะถูกตัดออก, แถวผู้ช่วยที่เป็นโทเค็นเงียบล้วน เช่น `NO_REPLY` / `no_reply` แบบตรงตัวจะถูกละไว้ และแถวที่ใหญ่เกินไปอาจถูกแทนที่ด้วยตัวยึดตำแหน่ง
    - `chat.message.get` เป็นตัวอ่านข้อความเต็มแบบจำกัดขอบเขตที่เพิ่มเข้ามาสำหรับรายการทรานสคริปต์ที่มองเห็นได้รายการเดียว ไคลเอนต์ส่ง `sessionKey`, `agentId` ที่ไม่บังคับเมื่อการเลือกเซสชันถูกกำหนดขอบเขตตามเอเจนต์ พร้อม `messageId` ของทรานสคริปต์ที่เคยแสดงผ่าน `chat.history` และ Gateway จะส่งคืนโปรเจกชันที่ปรับให้อยู่ในรูปแบบการแสดงผลเดียวกันโดยไม่มีเพดานการตัดทอนประวัติแบบเบา เมื่อรายการที่จัดเก็บไว้ยังมีอยู่และไม่ใหญ่เกินไป
    - `chat.send` รับ `fastMode: "auto"` แบบหนึ่งเทิร์นเพื่อใช้โหมดเร็วสำหรับการเรียกโมเดลที่เริ่มก่อนจุดตัดอัตโนมัติ จากนั้นจึงเริ่มการเรียกลองใหม่ภายหลัง, สำรอง, ผลลัพธ์เครื่องมือ หรือการเรียกต่อเนื่องโดยไม่ใช้โหมดเร็ว จุดตัดมีค่าเริ่มต้นเป็น 60 วินาที และสามารถกำหนดค่าต่อโมเดลได้ด้วย `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ผู้เรียก `chat.send` สามารถส่ง `fastAutoOnSeconds` แบบหนึ่งเทิร์นเพื่อแทนที่จุดตัดสำหรับคำขอนั้น

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และโทเค็นอุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วซึ่งรอดำเนินการและได้รับอนุมัติ
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก
    - `device.token.revoke` เพิกถอนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่ Node, การเรียกใช้ และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` และ `node.pair.verify` ครอบคลุมการจับคู่ Node และการตรวจสอบการเริ่มต้น
    - `node.list` และ `node.describe` ส่งคืนสถานะ Node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับ Node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง Node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอเรียกใช้
    - `node.event` นำเหตุการณ์ที่มีต้นทางจาก Node กลับเข้าสู่ Gateway
    - `node.pending.pull` และ `node.pending.ack` เป็น API คิวของ Node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบคงทนสำหรับ Node ที่ออฟไลน์/ตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="กลุ่มการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติการ exec แบบครั้งเดียว พร้อมการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติการ exec ที่รอดำเนินการหนึ่งรายการและส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการสแนปช็อตนโยบายการอนุมัติการ exec ของ Gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติการ exec แบบโลคัลของ Node ผ่านคำสั่งรีเลย์ Node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่กำหนดโดย Plugin

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ, Skills และเครื่องมือ">
    - ระบบอัตโนมัติ: `wake` กำหนดเวลาการแทรกข้อความปลุกแบบทันทีหรือใน Heartbeat ถัดไป; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่กำหนดเวลาไว้
    - `cron.run` ยังคงเป็น RPC แบบเข้าคิวสำหรับการรันด้วยตนเอง ไคลเอนต์ที่ต้องการความหมายของการเสร็จสมบูรณ์ควรอ่าน `runId` ที่ส่งคืนและโพล `cron.runs`
    - `cron.runs` รับตัวกรอง `runId` ที่ไม่บังคับและไม่ว่าง เพื่อให้ไคลเอนต์ติดตามการรันด้วยตนเองที่อยู่ในคิวหนึ่งรายการได้โดยไม่แข่งกับรายการประวัติอื่นของงานเดียวกัน
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### กลุ่มเหตุการณ์ทั่วไป

- `chat`: การอัปเดตแชท UI เช่น `chat.inject` และเหตุการณ์แชทอื่นที่เป็นทรานสคริปต์เท่านั้น
  ในโปรโตคอล v4 เพย์โหลดเดลตาจะมี `deltaText`; `message` ยังคงเป็น
  สแนปช็อตผู้ช่วยแบบสะสม การแทนที่ที่ไม่ใช่คำนำหน้าจะตั้ง `replace=true`
  และใช้ `deltaText` เป็นข้อความแทนที่
- `session.message`, `session.operation` และ `session.tool`: การอัปเดตทรานสคริปต์,
  การดำเนินการเซสชันที่กำลังทำงาน และสตรีมเหตุการณ์สำหรับเซสชัน
  ที่สมัครรับไว้
- `sessions.changed`: ดัชนีเซสชันหรือเมทาดาทาเปลี่ยนแปลง
- `presence`: การอัปเดตสแนปช็อตสถานะระบบ
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดตสแนปช็อตสุขภาพของ Gateway
- `heartbeat`: การอัปเดตสตรีมเหตุการณ์ Heartbeat
- `cron`: เหตุการณ์เปลี่ยนแปลงรัน/งาน Cron
- `shutdown`: การแจ้งเตือนการปิด Gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ Node
- `node.invoke.request`: การบรอดแคสต์คำขอเรียกใช้ Node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตของอุปกรณ์ที่จับคู่แล้ว
- `voicewake.changed`: การกำหนดค่าทริกเกอร์คำปลุกเปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติการ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ Plugin

### เมธอดตัวช่วย Node

- Node อาจเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของไฟล์ปฏิบัติการ Skills
  สำหรับการตรวจสอบอนุญาตอัตโนมัติ

### RPC บัญชีแยกประเภทธุรกรรมงาน

ไคลเอนต์ผู้ปฏิบัติงานอาจตรวจสอบและยกเลิกระเบียนงานเบื้องหลังของ Gateway ผ่าน
RPC บัญชีแยกประเภทธุรกรรมงาน เมธอดเหล่านี้ส่งคืนสรุปงานที่ผ่านการล้างข้อมูลแล้ว ไม่ใช่สถานะ
รันไทม์ดิบ

- `tasks.list` ต้องใช้ `operator.read`.
  - พารามิเตอร์: `status` ที่ไม่บังคับ (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` หรือ `"timed_out"`) หรืออาร์เรย์ของสถานะเหล่านั้น,
    `agentId` ที่ไม่บังคับ, `sessionKey` ที่ไม่บังคับ, `limit` ที่ไม่บังคับตั้งแต่ `1` ถึง
    `500` และสตริง `cursor` ที่ไม่บังคับ
  - ผลลัพธ์: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` ต้องใช้ `operator.read`.
  - พารามิเตอร์: `{ "taskId": string }`.
  - ผลลัพธ์: `{ "task": TaskSummary }`.
  - ID งานที่ขาดหายจะส่งคืนรูปแบบข้อผิดพลาดไม่พบของ Gateway
- `tasks.cancel` ต้องใช้ `operator.write`.
  - พารามิเตอร์: `{ "taskId": string, "reason"?: string }`.
  - ผลลัพธ์:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` รายงานว่าบัญชีแยกประเภทธุรกรรมมีงานที่ตรงกันหรือไม่ `cancelled`
    รายงานว่ารันไทม์ยอมรับหรือบันทึกการยกเลิกหรือไม่

`TaskSummary` มี `id`, `status` และเมทาดาทาที่ไม่บังคับ เช่น `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, ไทม์สแตมป์, ความคืบหน้า,
สรุปปลายทาง และข้อความข้อผิดพลาดที่ผ่านการล้างข้อมูลแล้ว `agentId` ระบุเอเจนต์
ที่ดำเนินงาน; `sessionKey` และ `ownerKey` รักษาบริบทผู้ร้องขอและการควบคุมไว้

### เมธอดตัวช่วยผู้ปฏิบัติงาน

- ผู้ปฏิบัติงานสามารถเรียก `commands.list` (`operator.read`) เพื่อดึงรายการคำสั่งรันไทม์สำหรับเอเจนต์ได้
  - `agentId` เป็นค่าที่ไม่บังคับ; ละไว้เพื่ออ่านเวิร์กสเปซเอเจนต์เริ่มต้น
  - `scope` ควบคุมว่าพื้นผิวใดที่ `name` หลักจะกำหนดเป้าหมาย:
    - `text` ส่งคืนโทเค็นคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และพาธเริ่มต้น `both` จะส่งคืนชื่อแบบเนทีฟที่รับรู้ผู้ให้บริการเมื่อมี
  - `textAliases` มีนามแฝงแบบสแลชที่ตรงตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่งแบบเนทีฟที่รับรู้ผู้ให้บริการเมื่อมีอยู่
  - `provider` เป็นค่าที่ไม่บังคับ และมีผลเฉพาะกับการตั้งชื่อแบบเนทีฟรวมถึงความพร้อมใช้งานของคำสั่ง Plugin แบบเนทีฟ
  - `includeArgs=false` ละเว้นเมทาดาทาอาร์กิวเมนต์แบบทำให้เป็นอนุกรมจากการตอบกลับ
- ผู้ปฏิบัติงานสามารถเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือรันไทม์สำหรับเอเจนต์ได้ การตอบกลับรวมเครื่องมือที่จัดกลุ่มและเมทาดาทาแหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: ระบุว่าเครื่องมือ Plugin เป็นแบบไม่บังคับหรือไม่
- ผู้ปฏิบัติงานสามารถเรียก `tools.effective` (`operator.read`) เพื่อดึงรายการเครื่องมือที่มีผลในรันไทม์สำหรับเซสชันได้
  - ต้องระบุ `sessionKey`
  - Gateway อนุมานบริบทรันไทม์ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนการยอมรับบริบทการยืนยันตัวตนหรือการส่งมอบที่ผู้เรียกส่งมา
  - การตอบกลับเป็นการฉายภาพที่อนุมานจากเซิร์ฟเวอร์ตามขอบเขตเซสชันของรายการที่ใช้งานอยู่ รวมถึงเครื่องมือของคอร์, Plugin, ช่องทาง และเครื่องมือเซิร์ฟเวอร์ MCP ที่ค้นพบแล้ว
  - `tools.effective` เป็นแบบอ่านอย่างเดียวสำหรับ MCP: อาจฉายแค็ตตาล็อก MCP ของเซสชันที่อุ่นอยู่ผ่านนโยบายเครื่องมือสุดท้าย แต่จะไม่สร้างรันไทม์ MCP, เชื่อมต่อทรานสปอร์ต หรือออก `tools/list` หากไม่มีแค็ตตาล็อกอุ่นที่ตรงกัน การตอบกลับอาจรวมประกาศ เช่น `mcp-not-yet-connected`, `mcp-not-yet-listed` หรือ `mcp-stale-catalog`
  - รายการเครื่องมือที่มีผลใช้ `source="core"`, `source="plugin"`, `source="channel"` หรือ `source="mcp"`
- ผู้ปฏิบัติงานสามารถเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือที่พร้อมใช้งานหนึ่งรายการผ่านพาธนโยบาย Gateway เดียวกับ `/tools/invoke`
  - ต้องระบุ `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ `idempotencyKey` เป็นค่าที่ไม่บังคับ
  - หากมีทั้ง `sessionKey` และ `agentId` เอเจนต์ของเซสชันที่ resolve แล้วต้องตรงกับ `agentId`
  - ตัวครอบคอร์เฉพาะเจ้าของ เช่น `cron`, `gateway` และ `nodes` ต้องมีตัวตนเจ้าของ/ผู้ดูแลระบบ (`operator.admin`) แม้ว่าเมธอด `tools.invoke` เองจะเป็น `operator.write`
  - การตอบกลับเป็น envelope สำหรับ SDK ที่มี `ok`, `toolName`, `output` ที่ไม่บังคับ และฟิลด์ `error` แบบมีชนิด การอนุมัติหรือการปฏิเสธตามนโยบายจะส่งคืน `ok:false` ในเพย์โหลด แทนที่จะข้ามไปป์ไลน์นโยบายเครื่องมือของ Gateway
- ผู้ปฏิบัติงานสามารถเรียก `skills.status` (`operator.read`) เพื่อดึงรายการ skill ที่มองเห็นได้สำหรับเอเจนต์
  - `agentId` เป็นค่าที่ไม่บังคับ; ละไว้เพื่ออ่านเวิร์กสเปซเอเจนต์เริ่มต้น
  - การตอบกลับรวมคุณสมบัติที่เข้าเกณฑ์, ข้อกำหนดที่ขาดหาย, การตรวจสอบค่ากำหนด และตัวเลือกการติดตั้งที่ผ่านการทำให้ปลอดภัยโดยไม่เปิดเผยค่าความลับดิบ
- ผู้ปฏิบัติงานสามารถเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับเมทาดาทาการค้นพบของ ClawHub
- ผู้ปฏิบัติงานสามารถเรียก `skills.upload.begin`, `skills.upload.chunk` และ `skills.upload.commit` (`operator.admin`) เพื่อจัดเตรียมไฟล์เก็บถาวร skill ส่วนตัวก่อนติดตั้งได้ นี่เป็นพาธอัปโหลดสำหรับผู้ดูแลระบบแยกต่างหากสำหรับไคลเอนต์ที่เชื่อถือได้ ไม่ใช่โฟลว์การติดตั้ง skill ของ ClawHub ตามปกติ และถูกปิดใช้งานเป็นค่าเริ่มต้น เว้นแต่จะเปิดใช้ `skills.install.allowUploadedArchives`
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    สร้างการอัปโหลดที่ผูกกับ slug และค่า force นั้น
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` ผนวกไบต์ที่ออฟเซ็ตที่ถอดรหัสแล้วตรงกันพอดี
  - `skills.upload.commit({ uploadId, sha256? })` ตรวจสอบขนาดสุดท้ายและ SHA-256 การ commit เพียงทำให้การอัปโหลดสิ้นสุดเท่านั้น; ไม่ได้ติดตั้ง skill
  - ไฟล์เก็บถาวร skill ที่อัปโหลดเป็นไฟล์ zip ที่มีราก `SKILL.md` ชื่อไดเรกทอรีภายในไฟล์เก็บถาวรจะไม่เลือกเป้าหมายการติดตั้ง
- ผู้ปฏิบัติงานสามารถเรียก `skills.install` (`operator.admin`) ได้ในสามโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้งโฟลเดอร์ skill ลงในไดเรกทอรี `skills/` ของเวิร์กสเปซเอเจนต์เริ่มต้น
  - โหมดอัปโหลด: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    ติดตั้งการอัปโหลดที่ commit แล้วลงในไดเรกทอรี `skills/<slug>` ของเวิร์กสเปซเอเจนต์เริ่มต้น ค่า slug และ force ต้องตรงกับคำขอ `skills.upload.begin` เดิม โหมดนี้จะถูกปฏิเสธเว้นแต่เปิดใช้ `skills.install.allowUploadedArchives` การตั้งค่านี้ไม่มีผลต่อการติดตั้ง ClawHub
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, timeoutMs? }`
    เรียกใช้แอ็กชัน `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ gateway ไคลเอนต์รุ่นเก่าอาจยังส่ง `dangerouslyForceUnsafeInstall`; ฟิลด์นี้เลิกใช้แล้ว ยอมรับเฉพาะเพื่อความเข้ากันได้ของโปรโตคอล และถูกละเว้น ใช้ `security.installPolicy` สำหรับการตัดสินใจติดตั้งที่ผู้ปฏิบัติงานเป็นเจ้าของ
- ผู้ปฏิบัติงานสามารถเรียก `skills.update` (`operator.admin`) ได้ในสองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามหนึ่งรายการหรือการติดตั้ง ClawHub ที่ติดตามทั้งหมดในเวิร์กสเปซเอเจนต์เริ่มต้น
  - โหมดค่ากำหนดแพตช์ค่า `skills.entries.<skillKey>` เช่น `enabled`, `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` ยอมรับพารามิเตอร์ `view` ที่ไม่บังคับ:

- ละไว้หรือ `"default"`: พฤติกรรมรันไทม์ปัจจุบัน หากกำหนดค่า `agents.defaults.models` ไว้ การตอบกลับคือแค็ตตาล็อกที่อนุญาต รวมถึงโมเดลที่ค้นพบแบบไดนามิกสำหรับรายการ `provider/*` มิฉะนั้นการตอบกลับคือแค็ตตาล็อก Gateway แบบเต็ม
- `"configured"`: พฤติกรรมขนาดพอดีกับตัวเลือก หากกำหนดค่า `agents.defaults.models` ไว้ ค่านั้นยังคงมีผลเหนือกว่า รวมถึงการค้นพบตามขอบเขตผู้ให้บริการสำหรับรายการ `provider/*` หากไม่มี allowlist การตอบกลับจะใช้รายการ `models.providers.*.models` ที่ระบุชัดเจน โดยถอยกลับไปใช้แค็ตตาล็อกเต็มเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แค็ตตาล็อก Gateway แบบเต็ม โดยข้าม `agents.defaults.models` ใช้สิ่งนี้สำหรับการวินิจฉัยและ UI การค้นพบ ไม่ใช่ตัวเลือกโมเดลตามปกติ

## การอนุมัติ Exec

- เมื่อคำขอ exec ต้องการการอนุมัติ gateway จะกระจาย `exec.approval.requested`
- ไคลเอนต์ผู้ปฏิบัติงาน resolve โดยเรียก `exec.approval.resolve` (ต้องมีขอบเขต `operator.approvals`)
- สำหรับ `host=node` ต้องมี `systemRunPlan` ใน `exec.approval.request` (`argv`/`cwd`/`rawCommand`/เมทาดาทาเซสชันแบบ canonical) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังการอนุมัติ การเรียก `node.invoke system.run` ที่ส่งต่อจะใช้ `systemRunPlan` แบบ canonical นั้นซ้ำเป็นบริบทคำสั่ง/cwd/เซสชันที่มีอำนาจ
- หากผู้เรียกแก้ไข `command`, `rawCommand`, `cwd`, `agentId` หรือ `sessionKey` ระหว่างการเตรียมและการส่งต่อ `system.run` ที่ได้รับอนุมัติขั้นสุดท้าย gateway จะปฏิเสธการรันแทนการเชื่อถือเพย์โหลดที่ถูกแก้ไข

## ทางเลือกสำรองการส่งมอบของเอเจนต์

- คำขอ `agent` สามารถรวม `deliver=true` เพื่อขอการส่งมอบออกภายนอกได้
- `bestEffortDeliver=false` คงพฤติกรรมแบบเข้มงวด: เป้าหมายการส่งมอบที่ resolve ไม่ได้หรือเป็นภายในเท่านั้นจะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ถอยกลับไปดำเนินการเฉพาะเซสชันเมื่อไม่สามารถ resolve เส้นทางที่ส่งมอบภายนอกได้ (เช่น เซสชันภายใน/webchat หรือค่ากำหนดหลายช่องทางที่กำกวม)
- ผลลัพธ์ `agent` ขั้นสุดท้ายอาจรวม `result.deliveryStatus` เมื่อมีการร้องขอการส่งมอบ โดยใช้สถานะ `sent`, `suppressed`, `partial_failed` และ `failed` เดียวกับที่จัดทำเอกสารไว้สำหรับ [`openclaw agent --json --deliver`](/th/cli/agent#json-delivery-status)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `packages/gateway-protocol/src/version.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธช่วงที่ไม่รวมโปรโตคอลปัจจุบันของตน ไคลเอนต์และเซิร์ฟเวอร์ปัจจุบันต้องใช้โปรโตคอล v4
- Schemas + models สร้างจากนิยาม TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

ไคลเอนต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่ามีเสถียรภาพตลอดโปรโตคอล v4 และเป็น baseline ที่คาดหวังสำหรับไคลเอนต์บุคคลที่สาม

| ค่าคงที่                                  | ค่าเริ่มต้น                                               | แหล่งที่มา                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| หมดเวลาคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| หมดเวลา Preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่มงบประมาณเซิร์ฟเวอร์/ไคลเอนต์แบบจับคู่ได้) |
| backoff การเชื่อมต่อใหม่เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| backoff การเชื่อมต่อใหม่สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp การลองซ้ำเร็วหลังปิด device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ระยะผ่อนผัน force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| หมดเวลาเริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| ปิดเมื่อ tick-timeout                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศค่า `policy.tickIntervalMs`, `policy.maxPayload` และ `policy.maxBufferedBytes` ที่มีผลใน `hello-ok`; ไคลเอนต์ควรเคารพค่าเหล่านั้นแทนค่าเริ่มต้นก่อน handshake

## Auth

- การยืนยันตัวตน Gateway แบบ shared-secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมดการยืนยันตัวตนที่กำหนดค่าไว้
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ non-loopback
  `gateway.auth.mode: "trusted-proxy"` จะผ่านการตรวจสอบการยืนยันตัวตนขณะเชื่อมต่อจาก
  ส่วนหัวคำขอแทน `connect.params.auth.*`
- `gateway.auth.mode: "none"` สำหรับ private-ingress จะข้ามการยืนยันตัวตนขณะเชื่อมต่อแบบ shared-secret
  ทั้งหมด อย่าเปิดใช้โหมดนั้นบน ingress สาธารณะ/ไม่น่าเชื่อถือ
- หลังจากจับคู่แล้ว Gateway จะออก **device token** ที่จำกัดตามบทบาทการเชื่อมต่อ
  + ขอบเขต โทเค็นนี้จะถูกส่งกลับใน `hello-ok.auth.deviceToken` และไคลเอนต์ควร
  คงไว้ใช้สำหรับการเชื่อมต่อในอนาคต
- ไคลเอนต์ควรคง `hello-ok.auth.deviceToken` หลักไว้หลังจากเชื่อมต่อสำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วย device token ที่ **จัดเก็บไว้** ควรนำชุดขอบเขตที่อนุมัติแล้วและจัดเก็บไว้
  สำหรับโทเค็นนั้นกลับมาใช้ด้วย วิธีนี้จะรักษาสิทธิ์อ่าน/probe/status
  ที่ได้รับอนุญาตแล้ว และหลีกเลี่ยงการยุบการเชื่อมต่อใหม่อย่างเงียบๆ ไปเป็น
  ขอบเขต implicit แบบ admin-only ที่แคบกว่า
- การประกอบการยืนยันตัวตนขณะเชื่อมต่อฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากส่วนอื่น และจะถูกส่งต่อเสมอเมื่อตั้งค่าไว้
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: shared token แบบชัดเจนก่อน
    จากนั้น `deviceToken` แบบชัดเจน แล้วจึงเป็นโทเค็นต่ออุปกรณ์ที่จัดเก็บไว้ (อ้างอิงด้วย
    `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อไม่มีรายการข้างต้นใด resolve เป็น
    `auth.token` shared token หรือ device token ใดๆ ที่ resolve ได้จะระงับการส่งค่านี้
  - การเลื่อนใช้ device token ที่จัดเก็บไว้โดยอัตโนมัติในการลองใหม่แบบครั้งเดียว
    เมื่อเจอ `AUTH_TOKEN_MISMATCH` ถูกจำกัดไว้เฉพาะ **ปลายทางที่เชื่อถือได้เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบ pinned `wss://` สาธารณะ
    ที่ไม่มี pinning จะไม่เข้าเกณฑ์
- bootstrap ด้วย setup-code ในตัวจะส่งคืน Node หลัก
  `hello-ok.auth.deviceToken` พร้อมโทเค็นผู้ปฏิบัติการแบบมีขอบเขตจำกัดใน
  `hello-ok.auth.deviceTokens` สำหรับการส่งต่อไปยังมือถือที่เชื่อถือได้ โทเค็นผู้ปฏิบัติการ
  มี `operator.talk.secrets` สำหรับอ่านการกำหนดค่า Talk แบบ native และ
  ไม่รวม `operator.admin` กับ `operator.pairing`
- ขณะที่ bootstrap ด้วย setup-code ที่ไม่ใช่ baseline กำลังรอการอนุมัติ รายละเอียด `PAIRING_REQUIRED`
  จะมี `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  และ `pauseReconnect: false` ไคลเอนต์ควรเชื่อมต่อใหม่ต่อไปด้วย
  bootstrap token เดิมจนกว่าคำขอจะได้รับอนุมัติหรือโทเค็นจะใช้ไม่ได้
- คง `hello-ok.auth.deviceTokens` ไว้เฉพาะเมื่อการเชื่อมต่อใช้ bootstrap auth
  บน transport ที่เชื่อถือได้ เช่น `wss://` หรือการจับคู่ผ่าน loopback/local
- หากไคลเอนต์ระบุ `deviceToken` หรือ `scopes` แบบ **ชัดเจน** ชุดขอบเขตที่
  ผู้เรียกขอจะยังคงเป็นแหล่งอ้างอิงหลัก ขอบเขตที่แคชไว้จะถูกนำกลับมาใช้
  เฉพาะเมื่อไคลเอนต์กำลังนำโทเค็นต่ออุปกรณ์ที่จัดเก็บไว้กลับมาใช้
- สามารถหมุนเวียน/เพิกถอน device token ได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องมีขอบเขต `operator.pairing`) การหมุนเวียนหรือ
  เพิกถอน Node หรือบทบาทอื่นที่ไม่ใช่ผู้ปฏิบัติการต้องมี `operator.admin` ด้วย
- `device.token.rotate` ส่งคืนเมทาดาทาการหมุนเวียน โดยจะ echo bearer token ตัวแทน
  เฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ยืนยันตัวตนด้วย device token นั้นอยู่แล้ว
  เพื่อให้ไคลเอนต์แบบ token-only สามารถคงตัวแทนไว้ก่อนเชื่อมต่อใหม่ได้
  การหมุนเวียนแบบ shared/admin จะไม่ echo bearer token
- การออกโทเค็น การหมุนเวียน และการเพิกถอนจะยังคงจำกัดอยู่ภายในชุดบทบาทที่อนุมัติแล้ว
  ซึ่งบันทึกในรายการจับคู่ของอุปกรณ์นั้น การเปลี่ยนโทเค็นไม่สามารถขยายหรือ
  กำหนดเป้าหมายบทบาทอุปกรณ์ที่การอนุมัติการจับคู่ไม่เคยให้ไว้
- สำหรับเซสชันโทเค็นของอุปกรณ์ที่จับคู่แล้ว การจัดการอุปกรณ์จะจำกัดอยู่กับตนเอง เว้นแต่
  ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ admin สามารถจัดการได้เฉพาะ
  โทเค็นผู้ปฏิบัติการสำหรับรายการอุปกรณ์ของ **ตนเอง** เท่านั้น การจัดการโทเค็นของ Node
  และโทเค็นอื่นที่ไม่ใช่ผู้ปฏิบัติการเป็น admin-only แม้จะเป็นอุปกรณ์ของผู้เรียกเองก็ตาม
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุดขอบเขตของโทเค็นผู้ปฏิบัติการ
  เป้าหมายเทียบกับขอบเขตเซสชันปัจจุบันของผู้เรียกด้วย ผู้เรียกที่ไม่ใช่ admin
  ไม่สามารถหมุนเวียนหรือเพิกถอนโทเค็นผู้ปฏิบัติการที่กว้างกว่าที่ตนมีอยู่แล้ว
- ความล้มเหลวในการยืนยันตัวตนมี `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลองใหม่แบบมีขอบเขตหนึ่งครั้งด้วยโทเค็นต่ออุปกรณ์ที่แคชไว้
  - หากการลองใหม่นั้นล้มเหลว ไคลเอนต์ควรหยุดลูปการเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำการดำเนินการสำหรับผู้ปฏิบัติการ
- `AUTH_SCOPE_MISMATCH` หมายความว่า device token ถูกจดจำได้แต่ไม่ครอบคลุม
  บทบาท/ขอบเขตที่ร้องขอ ไคลเอนต์ไม่ควรแสดงสิ่งนี้ว่าเป็นโทเค็นไม่ถูกต้อง
  ให้แจ้งผู้ปฏิบัติการให้จับคู่ใหม่ หรืออนุมัติสัญญาขอบเขตที่แคบกว่า/กว้างกว่า

## ข้อมูลระบุตัวตนอุปกรณ์ + การจับคู่

- Node ควรมีข้อมูลระบุตัวตนอุปกรณ์ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  fingerprint ของ keypair
- Gateway ออกโทเค็นต่ออุปกรณ์ + บทบาท
- ต้องมีการอนุมัติการจับคู่สำหรับ ID อุปกรณ์ใหม่ เว้นแต่จะเปิดใช้การอนุมัติอัตโนมัติแบบ local
- การอนุมัติอัตโนมัติสำหรับการจับคู่มีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่แคบสำหรับ
  โฟลว์ตัวช่วย shared-secret ที่เชื่อถือได้
- การเชื่อมต่อ same-host tailnet หรือ LAN ยังคงถือว่าเป็น remote สำหรับการจับคู่และ
  ต้องได้รับการอนุมัติ
- โดยปกติไคลเอนต์ WS จะรวมข้อมูลระบุตัวตน `device` ระหว่าง `connect` (ผู้ปฏิบัติการ +
  Node) ข้อยกเว้นผู้ปฏิบัติการที่ไม่มีอุปกรณ์มีเฉพาะเส้นทางความเชื่อถือแบบชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP ที่ไม่ปลอดภัยแบบ localhost-only
  - การยืนยันตัวตน Control UI ของผู้ปฏิบัติการด้วย `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
  - RPC backend `gateway-client` แบบ direct-loopback บนเส้นทางตัวช่วยภายในที่สงวนไว้
- การละเว้นข้อมูลระบุตัวตนอุปกรณ์มีผลต่อขอบเขต เมื่อการเชื่อมต่อผู้ปฏิบัติการแบบไม่มีอุปกรณ์
  ได้รับอนุญาตผ่านเส้นทางความเชื่อถือแบบชัดเจน OpenClaw จะยังคงล้าง
  ขอบเขตที่ประกาศเองเป็นชุดว่าง เว้นแต่เส้นทางนั้นจะมีข้อยกเว้นการคงขอบเขต
  ที่มีชื่อกำกับ จากนั้นเมธอดที่ถูกควบคุมด้วยขอบเขตจะล้มเหลวด้วย
  `missing scope`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` เป็นเส้นทาง break-glass สำหรับคงขอบเขตของ Control UI
  ไม่ได้ให้ขอบเขตแก่ไคลเอนต์ WebSocket แบบ backend ที่กำหนดเองหรือรูปแบบ CLI โดยพลการ
- เส้นทางตัวช่วย backend `gateway-client` แบบ direct-loopback ที่สงวนไว้จะคง
  ขอบเขตเฉพาะสำหรับ RPC control-plane แบบ local ภายในเท่านั้น ID backend ที่กำหนดเองจะไม่ได้รับ
  ข้อยกเว้นนี้
- การเชื่อมต่อทั้งหมดต้องลงนาม nonce `connect.challenge` ที่เซิร์ฟเวอร์ให้มา

### การวินิจฉัยการย้ายข้อมูล device auth

สำหรับไคลเอนต์ legacy ที่ยังใช้พฤติกรรมการลงนามก่อนมี challenge ตอนนี้ `connect` จะส่งคืน
รหัสรายละเอียด `DEVICE_AUTH_*` ใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวทั่วไปในการย้ายข้อมูล:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ละเว้น `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่า/ผิด                |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ลายเซ็นไม่ตรงกับ payload v2                |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอก skew ที่อนุญาต           |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key   |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/canonicalization ของ public key ล้มเหลว     |

เป้าหมายการย้ายข้อมูล:

- รอ `connect.challenge` เสมอ
- ลงนาม payload v2 ที่มี nonce ของเซิร์ฟเวอร์
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload ลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น legacy `v2` ยังคงยอมรับเพื่อความเข้ากันได้ แต่การ pin เมทาดาทา paired-device
  ยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + pinning

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์อาจเลือก pin fingerprint ของใบรับรอง Gateway ได้ (ดูการกำหนดค่า `gateway.tls`
  พร้อม `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **Gateway API แบบเต็ม** (status, channels, models, chat,
agent, sessions, nodes, approvals ฯลฯ) พื้นผิวที่แน่นอนกำหนดโดย
สคีมา TypeBox ใน `packages/gateway-protocol/src/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [runbook ของ Gateway](/th/gateway)
