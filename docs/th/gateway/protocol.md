---
read_when:
    - การพัฒนาหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - การสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: แฮนด์เชก เฟรม และการกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-05-07T13:18:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol เป็น **control plane เดียว + node transport** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, web UI, แอป macOS, node iOS/Android, node แบบ headless)
เชื่อมต่อผ่าน WebSocket และประกาศ **role** + **scope** ของตน
ในช่วง handshake

## การขนส่ง

- WebSocket, text frames พร้อม JSON payloads
- frame แรก **ต้อง** เป็นคำขอ `connect`
- frame ก่อนเชื่อมต่อถูกจำกัดไว้ที่ 64 KiB หลังจาก handshake สำเร็จแล้ว ไคลเอนต์
  ควรปฏิบัติตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้ diagnostics,
  inbound frames ที่ใหญ่เกินไปและ outbound buffers ที่ช้าจะปล่อยเหตุการณ์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้ง frame ที่ได้รับผลกระทบ เหตุการณ์เหล่านี้เก็บ
  ขนาด ขีดจำกัด พื้นผิว และรหัสเหตุผลที่ปลอดภัยไว้ แต่จะไม่เก็บ message
  body, เนื้อหา attachment, raw frame body, tokens, cookies หรือค่าลับ

## Handshake (connect)

Gateway → ไคลเอนต์ (challenge ก่อนเชื่อมต่อ):

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
    "minProtocol": 4,
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

ขณะที่ Gateway ยังเริ่มต้น sidecars ไม่เสร็จ คำขอ `connect` อาจ
ส่งคืนข้อผิดพลาด `UNAVAILABLE` ที่ retry ได้ โดยตั้งค่า `details.reason` เป็น
`"startup-sidecars"` และมี `retryAfterMs` ไคลเอนต์ควร retry response นั้น
ภายในงบเวลาการเชื่อมต่อโดยรวม แทนที่จะแสดงเป็นความล้มเหลวของ handshake
ขั้นสุดท้าย

`server`, `features`, `snapshot` และ `policy` ทั้งหมดเป็นฟิลด์ที่ schema
กำหนดให้ต้องมี (`src/gateway/protocol/schema/frames.ts`) `auth` ก็จำเป็นต้องมีเช่นกัน และรายงาน
role/scopes ที่เจรจาได้ `pluginSurfaceUrls` เป็นฟิลด์ทางเลือกและ map ชื่อพื้นผิวของ plugin
เช่น `canvas` ไปยัง hosted URLs ที่จำกัด scope

URL พื้นผิว plugin ที่จำกัด scope อาจหมดอายุได้ Nodes สามารถเรียก
`node.pluginSurface.refresh` พร้อม `{ "surface": "canvas" }` เพื่อรับรายการใหม่
ใน `pluginSurfaceUrls` การ refactor ของ Plugin Canvas แบบทดลองไม่รองรับ
เส้นทาง compatibility ที่เลิกใช้แล้วของ `canvasHostUrl`, `canvasCapability` หรือ
`node.canvas.capability.refresh`; native clients และ gateways ปัจจุบันต้องใช้พื้นผิว plugin

เมื่อไม่มีการออก device token, `hello-ok.auth` จะรายงาน permissions ที่เจรจาได้
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
`client.mode: "backend"`) อาจละ `device` ได้บนการเชื่อมต่อ loopback โดยตรงเมื่อ
authenticate ด้วย token/password ของ gateway ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้
สำหรับ RPCs ของ control-plane ภายใน และป้องกันไม่ให้ baseline การจับคู่ CLI/device ที่เก่า
ขัดขวางงาน backend ภายในเครื่อง เช่น การอัปเดต session ของ subagent ไคลเอนต์ระยะไกล,
ไคลเอนต์จาก browser-origin, ไคลเอนต์ node และไคลเอนต์ที่ใช้ device-token/device-identity
แบบชัดเจนยังคงใช้การตรวจสอบ pairing และ scope-upgrade ตามปกติ

เมื่อมีการออก device token, `hello-ok` จะรวมข้อมูลนี้ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ระหว่างการส่งต่อ bootstrap ที่เชื่อถือได้, `hello-ok.auth` อาจรวม
รายการ role แบบมีขอบเขตเพิ่มเติมใน `deviceTokens` ด้วย:

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

สำหรับ flow bootstrap ของ node/operator ในตัว, token หลักของ node จะยังคงเป็น
`scopes: []` และ token ของ operator ที่ส่งต่อจะยังถูกจำกัดไว้ที่ allowlist ของ operator
สำหรับ bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจสอบ scope ของ bootstrap ยังคง
ใช้ prefix ตาม role: รายการ operator ตอบสนองเฉพาะคำขอของ operator เท่านั้น และ role ที่ไม่ใช่ operator
ยังต้องมี scopes ภายใต้ prefix ของ role ตนเอง

### ตัวอย่าง Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
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

## Roles + scopes

สำหรับโมเดล scope ของ operator แบบเต็ม การตรวจสอบในเวลา approval และ semantics ของ shared-secret
ดูที่ [Scopes ของ operator](/th/gateway/operator-scopes)

### Roles

- `operator` = ไคลเอนต์ control plane (CLI/UI/automation)
- `node` = host ของ capability (camera/screen/canvas/system.run)

### Scopes (operator)

Scopes ทั่วไป:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` พร้อม `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)

methods ของ gateway RPC ที่ลงทะเบียนโดย Plugin อาจขอ operator scope ของตนเองได้ แต่
prefix admin หลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะ resolve เป็น `operator.admin` เสมอ

scope ของ method เป็นเพียงด่านแรกเท่านั้น คำสั่ง slash บางรายการที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจสอบระดับคำสั่งที่เข้มงวดกว่าเพิ่มเติม ตัวอย่างเช่น การเขียน
`/config set` และ `/config unset` แบบถาวรต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบ scope เพิ่มเติมในเวลา approval เหนือ
scope method พื้นฐาน:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มีคำสั่ง node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่รวม `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes ประกาศ capability claims ในเวลาที่เชื่อมต่อ:

- `caps`: หมวดหมู่ capability ระดับสูง เช่น `camera`, `canvas`, `screen`,
  `location`, `voice` และ `talk`
- `commands`: allowlist ของคำสั่งสำหรับ invoke
- `permissions`: toggles แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือว่าสิ่งเหล่านี้เป็น **claims** และบังคับใช้ allowlists ฝั่ง server

## Presence

- `system-presence` ส่งคืนรายการที่ key ตาม device identity
- รายการ presence รวม `deviceId`, `roles` และ `scopes` เพื่อให้ UIs แสดงหนึ่งแถวต่อ device ได้
  แม้ว่าจะเชื่อมต่อทั้งเป็น **operator** และ **node**
- `node.list` รวมฟิลด์ทางเลือก `lastSeenAtMs` และ `lastSeenReason` nodes ที่เชื่อมต่ออยู่จะรายงาน
  เวลาเชื่อมต่อปัจจุบันเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; nodes ที่ paired แล้วอาจรายงาน
  durable background presence ได้เช่นกัน เมื่อเหตุการณ์ node ที่เชื่อถือได้อัปเดต pairing metadata ของตน

### เหตุการณ์ Node background alive

Nodes อาจเรียก `node.event` พร้อม `event: "node.presence.alive"` เพื่อบันทึกว่า node ที่ paired แล้ว
ยัง alive ระหว่าง background wake โดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น enum แบบปิด: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` string ของ trigger ที่ไม่รู้จักจะถูก normalize เป็น
`background` โดย gateway ก่อน persistence เหตุการณ์นี้ durable เฉพาะสำหรับ session ของ node device
ที่ authenticated แล้วเท่านั้น; session ที่ไม่มี device หรือยังไม่ paired จะส่งคืน `handled: false`

Gateways ที่สำเร็จจะส่งคืนผลลัพธ์ที่มีโครงสร้าง:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateways รุ่นเก่าอาจยังส่งคืน `{ "ok": true }` สำหรับ `node.event`; ไคลเอนต์ควรถือว่านั่นเป็น
RPC ที่รับทราบแล้ว ไม่ใช่ persistence ของ durable presence

## การจำกัด scope ของ broadcast event

เหตุการณ์ broadcast ผ่าน WebSocket ที่ server push จะถูก gate ตาม scope เพื่อให้ session ที่มี scope เฉพาะ pairing หรือเฉพาะ node ไม่ได้รับเนื้อหา session แบบ passive

- **เฟรม chat, agent และ tool-result** (รวมถึงเหตุการณ์ `agent` แบบ streamed และผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` session ที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcasts `plugin.*` ที่กำหนดโดย Plugin** จะถูก gate เป็น `operator.write` หรือ `operator.admin` ขึ้นอยู่กับวิธีที่ plugin ลงทะเบียนไว้
- **เหตุการณ์ status และ transport** (`heartbeat`, `presence`, `tick`, lifecycle connect/disconnect เป็นต้น) ยังคงไม่ถูกจำกัด เพื่อให้ทุก session ที่ authenticated แล้วสังเกตสุขภาพของ transport ได้
- **ตระกูล broadcast event ที่ไม่รู้จัก** จะถูก gate ตาม scope โดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนคลายอย่างชัดเจน

การเชื่อมต่อไคลเอนต์แต่ละรายการรักษา sequence number ต่อไคลเอนต์ของตนเอง ดังนั้น broadcasts จึงรักษาลำดับแบบ monotonic บน socket นั้น แม้ว่าไคลเอนต์ต่างกันจะเห็น subset ของ event stream ที่ถูกกรองตาม scope ต่างกัน

## ตระกูล method RPC ทั่วไป

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ด้านบน นี่
ไม่ใช่ generated dump — `hello-ok.features.methods` เป็น discovery list แบบอนุรักษ์นิยม
ที่สร้างจาก `src/gateway/server-methods-list.ts` ร่วมกับ exports ของ method จาก plugin/channel ที่โหลดไว้
ให้ถือว่าเป็น feature discovery ไม่ใช่ enumeration เต็มของ `src/gateway/server-methods/*.ts`

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` ส่งคืน snapshot สุขภาพของ gateway ที่ cached หรือ probe ใหม่
    - `diagnostics.stability` ส่งคืนตัวบันทึก diagnostic stability แบบ bounded ล่าสุด โดยเก็บ metadata เชิงปฏิบัติการ เช่น ชื่อเหตุการณ์ จำนวน ขนาด byte การอ่าน memory สถานะ queue/session ชื่อ channel/plugin และ session ids แต่ไม่เก็บ chat text, webhook bodies, tool outputs, raw request หรือ response bodies, tokens, cookies หรือค่าลับ ต้องมี operator read scope
    - `status` ส่งคืนสรุป gateway แบบ `/status`; ฟิลด์ที่ sensitive จะถูกรวมเฉพาะสำหรับไคลเอนต์ operator ที่มี admin scope
    - `gateway.identity.get` ส่งคืน device identity ของ gateway ที่ใช้โดย relay และ pairing flows
    - `system-presence` ส่งคืน snapshot presence ปัจจุบันสำหรับ devices operator/node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่ม system event และสามารถอัปเดต/broadcast context ของ presence ได้
    - `last-heartbeat` ส่งคืนเหตุการณ์ heartbeat ล่าสุดที่ persisted ไว้
    - `set-heartbeats` toggle การประมวลผล heartbeat บน gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแค็ตตาล็อกโมเดลที่รันไทม์อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่ตั้งค่าไว้ขนาดเหมาะกับตัวเลือก (`agents.defaults.models` ก่อน จากนั้น `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแค็ตตาล็อกทั้งหมด
    - `usage.status` ส่งคืนสรุปหน้าต่างการใช้งาน/โควตาที่เหลือของผู้ให้บริการ
    - `usage.cost` ส่งคืนสรุปการใช้งานค่าใช้จ่ายแบบรวมสำหรับช่วงวันที่
    - `doctor.memory.status` ส่งคืนความพร้อมของหน่วยความจำเวกเตอร์ / embedding ที่แคชไว้สำหรับเวิร์กสเปซของ agent ค่าเริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจน
    - `doctor.memory.remHarness` ส่งคืนตัวอย่าง REM harness แบบจำกัดขอบเขตและอ่านอย่างเดียวสำหรับไคลเอนต์ control-plane ระยะไกล โดยอาจรวมพาธเวิร์กสเปซ ส่วนย่อยหน่วยความจำ Markdown แบบ grounded ที่เรนเดอร์แล้ว และผู้สมัครสำหรับการเลื่อนระดับเชิงลึก ดังนั้นผู้เรียกต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานรายเซสชัน
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบอนุกรมเวลาสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="ช่องทางและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะช่องทาง/Plugin แบบ built-in + bundled
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีที่ระบุเมื่อช่องทางรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบ QR/เว็บสำหรับผู้ให้บริการช่องทางเว็บปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบ QR/เว็บนั้นเสร็จสิ้น และเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยังโหนด iOS ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืนทริกเกอร์คำปลุกที่จัดเก็บไว้
    - `voicewake.set` อัปเดตทริกเกอร์คำปลุกและกระจายการเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การส่งข้อความและบันทึก">
    - `send` คือ RPC สำหรับการส่งออกโดยตรงสำหรับการส่งที่ระบุช่องทาง/บัญชี/thread นอก chat runner
    - `logs.tail` ส่งคืนส่วนท้ายบันทึกไฟล์ของ gateway ที่ตั้งค่าไว้ พร้อมการควบคุม cursor/limit และจำนวนไบต์สูงสุด

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.catalog` ส่งคืนแค็ตตาล็อกผู้ให้บริการ Talk แบบอ่านอย่างเดียวสำหรับเสียงพูด การถอดเสียงแบบสตรีม และเสียงแบบเรียลไทม์ โดยรวม ID ผู้ให้บริการ ป้ายกำกับ สถานะการตั้งค่า ID โมเดล/เสียงที่เปิดเผย โหมดมาตรฐาน ทรานสปอร์ต กลยุทธ์ brain และแฟล็กเสียง/ความสามารถแบบเรียลไทม์ โดยไม่ส่งคืนความลับของผู้ให้บริการหรือเปลี่ยนแปลง config ส่วนกลาง
    - `talk.config` ส่งคืน payload config ของ Talk ที่มีผลอยู่; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.session.create` สร้างเซสชัน Talk ที่ Gateway เป็นเจ้าของสำหรับ `realtime/gateway-relay`, `transcription/gateway-relay` หรือ `stt-tts/managed-room` `brain: "direct-tools"` ต้องใช้ `operator.admin`
    - `talk.session.join` ตรวจสอบโทเค็นเซสชัน managed-room, ส่งเหตุการณ์ `session.ready` หรือ `session.replaced` ตามจำเป็น และส่งคืนเมทาดาทาห้อง/เซสชันพร้อมเหตุการณ์ Talk ล่าสุด โดยไม่มีโทเค็นข้อความธรรมดาหรือแฮชโทเค็นที่จัดเก็บไว้
    - `talk.session.appendAudio` ผนวกเสียงอินพุต PCM แบบ base64 ไปยังเซสชัน realtime relay และ transcription ที่ Gateway เป็นเจ้าของ
    - `talk.session.startTurn`, `talk.session.endTurn` และ `talk.session.cancelTurn` ขับเคลื่อนวงจรชีวิต turn ของ managed-room พร้อมการปฏิเสธ turn ที่ล้าสมัยก่อนล้างสถานะ
    - `talk.session.cancelOutput` หยุดเอาต์พุตเสียงของ assistant โดยหลักใช้สำหรับการแทรกพูดที่ควบคุมด้วย VAD ในเซสชัน Gateway relay
    - `talk.session.submitToolResult` ทำให้การเรียกเครื่องมือของผู้ให้บริการที่เซสชัน realtime relay ที่ Gateway เป็นเจ้าของปล่อยออกมาเสร็จสมบูรณ์
    - `talk.session.close` ปิดเซสชัน relay, transcription หรือ managed-room ที่ Gateway เป็นเจ้าของ และส่งเหตุการณ์ Talk สิ้นสุด
    - `talk.mode` ตั้งค่า/กระจายสถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.client.create` สร้างเซสชันผู้ให้บริการเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของโดยใช้ `webrtc` หรือ `provider-websocket` ขณะที่ Gateway เป็นเจ้าของ config, ข้อมูลประจำตัว, instructions และนโยบายเครื่องมือ
    - `talk.client.toolCall` ให้ทรานสปอร์ตเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของส่งต่อการเรียกเครื่องมือของผู้ให้บริการไปยังนโยบายของ Gateway เครื่องมือที่รองรับตัวแรกคือ `openclaw_agent_consult`; ไคลเอนต์จะได้รับ run id และรอเหตุการณ์วงจรชีวิตแชทปกติก่อนส่งผลลัพธ์เครื่องมือเฉพาะผู้ให้บริการ
    - `talk.event` คือช่องทางเหตุการณ์ Talk เดียวสำหรับอะแดปเตอร์เรียลไทม์ transcription, STT/TTS, managed-room, โทรศัพท์ และการประชุม
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะการเปิดใช้ TTS ผู้ให้บริการที่ใช้งานอยู่ ผู้ให้บริการสำรอง และสถานะ config ของผู้ให้บริการ
    - `tts.providers` ส่งคืนรายการผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะ prefs ของ TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงพูดแบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ config การอัปเดต และวิซาร์ด">
    - `secrets.reload` resolve SecretRefs ที่ใช้งานอยู่อีกครั้ง และสลับสถานะความลับของรันไทม์เฉพาะเมื่อสำเร็จทั้งหมด
    - `secrets.resolve` resolve การกำหนดความลับเป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายที่ระบุ
    - `config.get` ส่งคืน snapshot และ hash ของ config ปัจจุบัน
    - `config.set` เขียน payload config ที่ผ่านการตรวจสอบแล้ว
    - `config.patch` ผสานการอัปเดต config บางส่วน
    - `config.apply` ตรวจสอบ + แทนที่ payload config ทั้งหมด
    - `config.schema` ส่งคืน payload schema config สดที่ใช้โดย Control UI และเครื่องมือ CLI: schema, `uiHints`, เวอร์ชัน และเมทาดาทาการสร้าง รวมถึงเมทาดาทา schema ของ plugin + ช่องทางเมื่อรันไทม์โหลดได้ schema มีเมทาดาทาฟิลด์ `title` / `description` ที่ได้จากป้ายกำกับและข้อความช่วยเหลือชุดเดียวกับที่ UI ใช้ รวมถึง object ซ้อน, wildcard, array-item และกิ่ง composition ของ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืน payload lookup ที่จำกัดขอบเขตตามพาธสำหรับหนึ่งพาธ config: พาธที่ normalized แล้ว, node schema แบบตื้น, hint ที่ตรงกัน + `hintPath` และสรุปลูกโดยตรงสำหรับ UI/CLI drill-down node schema ของ lookup เก็บเอกสารสำหรับผู้ใช้และฟิลด์ validation ทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขต numeric/string/array/object และแฟล็กอย่าง `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกเปิดเผย `key`, `path` ที่ normalized แล้ว, `type`, `required`, `hasChildren` รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รันโฟลว์อัปเดตของ gateway และกำหนดเวลา restart เฉพาะเมื่อการอัปเดตสำเร็จเอง; ผู้เรียกที่มีเซสชันสามารถใส่ `continuationMessage` เพื่อให้ startup กลับมาทำ turn agent ติดตามผลหนึ่งครั้งผ่านคิว restart continuation การอัปเดต package-manager บังคับให้ restart การอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังสลับแพ็กเกจ เพื่อไม่ให้โปรเซส Gateway เก่ายังคง lazy-load จาก tree `dist` ที่ถูกแทนที่แล้ว
    - `update.status` ส่งคืน sentinel การ restart การอัปเดตล่าสุดที่แคชไว้ รวมถึงเวอร์ชันที่รันหลัง restart เมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผยวิซาร์ด onboarding ผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วย Agent และเวิร์กสเปซ">
    - `agents.list` ส่งคืนรายการ agent ที่ตั้งค่าไว้ รวมถึงโมเดลที่มีผลและเมทาดาทารันไทม์
    - `agents.create`, `agents.update` และ `agents.delete` จัดการระเบียน agent และการเชื่อมต่อเวิร์กสเปซ
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการไฟล์เวิร์กสเปซ bootstrap ที่เปิดเผยให้กับ agent
    - `artifacts.list`, `artifacts.get` และ `artifacts.download` เปิดเผยสรุป artifact และการดาวน์โหลดที่ได้จาก transcript สำหรับขอบเขต `sessionKey`, `runId` หรือ `taskId` ที่ระบุอย่างชัดเจน คิวรี run และ task จะ resolve เซสชันเจ้าของฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อ transcript ที่มี provenance ตรงกัน; แหล่งที่มาที่เป็น URL ไม่ปลอดภัยหรือ URL ภายในเครื่องจะส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการ fetch ฝั่งเซิร์ฟเวอร์
    - `environments.list` และ `environments.status` เปิดเผยการค้นพบสภาพแวดล้อมแบบอ่านอย่างเดียวของ Gateway-local และโหนดสำหรับไคลเอนต์ SDK
    - `agent.identity.get` ส่งคืนตัวตน assistant ที่มีผลสำหรับ agent หรือเซสชัน
    - `agent.wait` รอให้ run จบและส่งคืน snapshot สุดท้ายเมื่อมี

  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึงเมทาดาทา `agentRuntime` รายแถวเมื่อมีการตั้งค่า backend รันไทม์ agent
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับเหตุการณ์ transcript/message สำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนตัวอย่าง transcript แบบจำกัดขอบเขตสำหรับคีย์เซสชันที่ระบุ
    - `sessions.describe` ส่งคืนหนึ่งแถวเซสชัน Gateway สำหรับคีย์เซสชันแบบตรงตัว
    - `sessions.resolve` resolve หรือ canonicalize เป้าหมายเซสชัน
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปในเซสชันที่มีอยู่
    - `sessions.steer` คือ variant แบบ interrupt-and-steer สำหรับเซสชันที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่เป็น optional หรือส่งเฉพาะ `runId` สำหรับ run ที่ใช้งานอยู่ซึ่ง Gateway สามารถ resolve ไปยังเซสชันได้
    - `sessions.patch` อัปเดตเมทาดาทา/overrides ของเซสชัน และรายงานโมเดล canonical ที่ resolve แล้วพร้อม `agentRuntime` ที่มีผล
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ดำเนินการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้ทั้งหมด
    - การดำเนินการแชทยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` `chat.history` ถูกปรับ normalized สำหรับการแสดงผลให้กับไคลเอนต์ UI: แท็ก directive แบบ inline ถูกตัดออกจากข้อความที่มองเห็น, payload XML ของการเรียกเครื่องมือแบบ plain-text (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) และโทเค็นควบคุมโมเดล ASCII/full-width ที่หลุดออกมาจะถูกตัดออก, แถว assistant ที่เป็น silent-token ล้วน เช่น `NO_REPLY` / `no_reply` แบบตรงตัวจะถูกละเว้น และแถวที่ใหญ่เกินไปอาจถูกแทนที่ด้วย placeholder

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และโทเค็นอุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่ซึ่งรอดำเนินการและได้รับอนุมัติแล้ว
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียนโทเค็นอุปกรณ์ที่จับคู่ภายใน role ที่ได้รับอนุมัติและขอบเขตผู้เรียก
    - `device.token.revoke` เพิกถอนโทเค็นอุปกรณ์ที่จับคู่ภายใน role ที่ได้รับอนุมัติและขอบเขตผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่โหนด invoke และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` และ `node.pair.verify` ครอบคลุมการจับคู่โหนดและการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` ส่งคืนสถานะโหนดที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับโหนดที่จับคู่
    - `node.invoke` ส่งต่อคำสั่งไปยังโหนดที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอ invoke
    - `node.event` นำเหตุการณ์ที่มาจากโหนดกลับเข้าสู่ gateway
    - `node.pending.pull` และ `node.pending.ack` คือ API คิวของโหนดที่เชื่อมต่อ
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบ durable สำหรับโหนดออฟไลน์/ตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="กลุ่มการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการและส่งคืนคำตัดสินสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการสแนปช็อตนโยบายการอนุมัติ exec ของ Gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec ภายใน Node ผ่านคำสั่งรีเลย์ของ Node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่ Plugin กำหนด

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ, Skills และเครื่องมือ">
    - ระบบอัตโนมัติ: `wake` กำหนดเวลาการแทรกข้อความปลุกทันทีหรือใน Heartbeat ถัดไป; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่กำหนดเวลาไว้
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### กลุ่มเหตุการณ์ทั่วไป

- `chat`: การอัปเดตแชทของ UI เช่น `chat.inject` และเหตุการณ์แชทอื่นๆ
  ที่มีเฉพาะทรานสคริปต์
- `session.message` และ `session.tool`: การอัปเดตทรานสคริปต์/สตรีมเหตุการณ์สำหรับ
  เซสชันที่สมัครรับข้อมูล
- `sessions.changed`: ดัชนีเซสชันหรือเมทาดาทามีการเปลี่ยนแปลง
- `presence`: การอัปเดตสแนปช็อตสถานะการมีอยู่ของระบบ
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดตสแนปช็อตสุขภาพของ Gateway
- `heartbeat`: การอัปเดตสตรีมเหตุการณ์ Heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลงการรัน/งาน Cron
- `shutdown`: การแจ้งเตือนการปิด Gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ Node
- `node.invoke.request`: การบรอดแคสต์คำขอเรียกใช้ Node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตอุปกรณ์ที่จับคู่แล้ว
- `voicewake.changed`: การกำหนดค่าทริกเกอร์คำปลุกมีการเปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ Plugin

### เมธอดตัวช่วยของ Node

- Node อาจเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของไฟล์ปฏิบัติการของ Skills
  สำหรับการตรวจสอบ auto-allow

### เมธอดตัวช่วยของผู้ปฏิบัติงาน

- ผู้ปฏิบัติงานอาจเรียก `commands.list` (`operator.read`) เพื่อดึงอินเวนทอรีคำสั่งรันไทม์
  สำหรับเอเจนต์
  - `agentId` เป็นทางเลือก; ละไว้เพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - `scope` ควบคุมว่า `name` หลักจะกำหนดเป้าหมายพื้นผิวใด:
    - `text` ส่งคืนโทเค็นคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางเริ่มต้น `both` ส่งคืนชื่อแบบเนทีฟที่รับรู้ผู้ให้บริการ
      เมื่อมีให้ใช้งาน
  - `textAliases` มีนามแฝงสแลชแบบตรงตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่งแบบเนทีฟที่รับรู้ผู้ให้บริการเมื่อมีอยู่
  - `provider` เป็นทางเลือกและมีผลต่อการตั้งชื่อแบบเนทีฟรวมถึงความพร้อมใช้งานของคำสั่ง Plugin
    แบบเนทีฟเท่านั้น
  - `includeArgs=false` ละเว้นเมทาดาทาอาร์กิวเมนต์ที่ซีเรียลไลซ์จากการตอบกลับ
- ผู้ปฏิบัติงานอาจเรียก `tools.catalog` (`operator.read`) เพื่อดึงแคตตาล็อกเครื่องมือรันไทม์สำหรับ
  เอเจนต์ การตอบกลับมีเครื่องมือที่จัดกลุ่มแล้วและเมทาดาทาแหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: เครื่องมือ Plugin เป็นทางเลือกหรือไม่
- ผู้ปฏิบัติงานอาจเรียก `tools.effective` (`operator.read`) เพื่อดึงอินเวนทอรีเครื่องมือที่มีผลจริงในรันไทม์
  สำหรับเซสชัน
  - ต้องระบุ `sessionKey`
  - Gateway อนุมานบริบทรันไทม์ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนที่จะยอมรับ
    บริบทการยืนยันตัวตนหรือการส่งมอบที่ผู้เรียกส่งมา
  - การตอบกลับอยู่ในขอบเขตของเซสชันและสะท้อนสิ่งที่การสนทนาที่ใช้งานอยู่สามารถใช้ได้ตอนนี้
    รวมถึงเครื่องมือหลัก, Plugin และช่องทาง
- ผู้ปฏิบัติงานอาจเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือหนึ่งรายการที่พร้อมใช้งานผ่าน
  เส้นทางนโยบาย Gateway เดียวกับ `/tools/invoke`
  - ต้องระบุ `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ
    `idempotencyKey` เป็นทางเลือก
  - หากมีทั้ง `sessionKey` และ `agentId` เอเจนต์ของเซสชันที่ resolve แล้วต้องตรงกับ
    `agentId`
  - การตอบกลับเป็นซองสำหรับ SDK พร้อมฟิลด์ `ok`, `toolName`, `output` ที่เป็นทางเลือก และ
    `error` ที่มีชนิดกำกับ การปฏิเสธจากการอนุมัติหรือนโยบายจะส่งคืน `ok:false` ในเพย์โหลด แทนที่จะ
    ข้ามไปป์ไลน์นโยบายเครื่องมือของ Gateway
- ผู้ปฏิบัติงานอาจเรียก `skills.status` (`operator.read`) เพื่อดึงอินเวนทอรี Skills
  ที่มองเห็นได้สำหรับเอเจนต์
  - `agentId` เป็นทางเลือก; ละไว้เพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - การตอบกลับมีคุณสมบัติการมีสิทธิ์ ข้อกำหนดที่ขาดหาย การตรวจสอบการกำหนดค่า และ
    ตัวเลือกการติดตั้งที่ล้างข้อมูลแล้วโดยไม่เปิดเผยค่าความลับดิบ
- ผู้ปฏิบัติงานอาจเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ
  เมทาดาทาการค้นพบ ClawHub
- ผู้ปฏิบัติงานอาจเรียก `skills.install` (`operator.admin`) ได้ในสองโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้ง
    โฟลเดอร์ Skills ลงในไดเรกทอรี `skills/` ของพื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    รันแอ็กชัน `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ Gateway
- ผู้ปฏิบัติงานอาจเรียก `skills.update` (`operator.admin`) ได้ในสองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามหนึ่งรายการหรือการติดตั้ง ClawHub ที่ติดตามทั้งหมดใน
    พื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมดการกำหนดค่าแพตช์ค่า `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` รับพารามิเตอร์ `view` ที่เป็นทางเลือก:

- ละไว้หรือ `"default"`: พฤติกรรมรันไทม์ปัจจุบัน หากมีการกำหนดค่า `agents.defaults.models` การตอบกลับจะเป็นแคตตาล็อกที่อนุญาต; มิฉะนั้นการตอบกลับจะเป็นแคตตาล็อก Gateway ทั้งหมด
- `"configured"`: พฤติกรรมขนาดพอดีกับตัวเลือก หากมีการกำหนดค่า `agents.defaults.models` ค่านั้นยังคงมีสิทธิ์เหนือกว่า มิฉะนั้นการตอบกลับจะใช้รายการ `models.providers.*.models` ที่ระบุไว้อย่างชัดเจน และย้อนกลับไปใช้แคตตาล็อกทั้งหมดเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แคตตาล็อก Gateway ทั้งหมด โดยข้าม `agents.defaults.models` ใช้สำหรับการวินิจฉัยและ UI สำหรับการค้นพบ ไม่ใช่ตัวเลือกโมเดลทั่วไป

## การอนุมัติ exec

- เมื่อคำขอ exec ต้องการการอนุมัติ Gateway จะบรอดแคสต์ `exec.approval.requested`
- ไคลเอนต์ผู้ปฏิบัติงาน resolve โดยเรียก `exec.approval.resolve` (ต้องมีขอบเขต `operator.approvals`)
- สำหรับ `host=node` `exec.approval.request` ต้องมี `systemRunPlan` (เมทาดาทา `argv`/`cwd`/`rawCommand`/เซสชันแบบ canonical) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังการอนุมัติ การเรียก `node.invoke system.run` ที่ส่งต่อจะใช้ `systemRunPlan`
  แบบ canonical นั้นเป็นบริบทคำสั่ง/cwd/เซสชันที่มีอำนาจอ้างอิง
- หากผู้เรียกเปลี่ยนแปลง `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่างการเตรียมกับการส่งต่อ `system.run` ครั้งสุดท้ายที่อนุมัติแล้ว
  Gateway จะปฏิเสธการรันแทนที่จะเชื่อถือเพย์โหลดที่ถูกเปลี่ยนแปลง

## การย้อนกลับการส่งมอบของเอเจนต์

- คำขอ `agent` สามารถมี `deliver=true` เพื่อขอการส่งมอบขาออก
- `bestEffortDeliver=false` คงพฤติกรรมแบบเข้มงวด: เป้าหมายการส่งมอบที่ resolve ไม่ได้หรือใช้ได้เฉพาะภายในจะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ย้อนกลับไปใช้การดำเนินการเฉพาะเซสชันเมื่อไม่สามารถ resolve เส้นทางที่ส่งมอบภายนอกได้ (ตัวอย่างเช่น เซสชันภายใน/เว็บแชท หรือการกำหนดค่าหลายช่องทางที่กำกวม)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/version.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธเมื่อไม่ตรงกัน
- สกีมา + โมเดลสร้างจากคำจำกัดความ TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

ไคลเอนต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าต่างๆ
เสถียรตลอด protocol v4 และเป็น baseline ที่คาดหวังสำหรับไคลเอนต์บุคคลที่สาม

| ค่าคงที่                                  | ค่าเริ่มต้น                                               | แหล่งที่มา                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| ระยะหมดเวลาคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| ระยะหมดเวลา preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่มงบเซิร์ฟเวอร์/ไคลเอนต์ที่จับคู่แล้วได้) |
| backoff การเชื่อมต่อใหม่เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| backoff การเชื่อมต่อใหม่สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| การ clamp สำหรับลองใหม่เร็วหลัง device-token close | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ระยะผ่อนผัน force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| ระยะหมดเวลาเริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วงเวลา tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| การปิดเมื่อ tick หมดเวลา                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศค่า `policy.tickIntervalMs`, `policy.maxPayload`
และ `policy.maxBufferedBytes` ที่มีผลจริงใน `hello-ok`; ไคลเอนต์ควรเคารพค่าเหล่านั้น
แทนค่าเริ่มต้นก่อน handshake

## การยืนยันตัวตน

- การยืนยันตัวตน Gateway ด้วยความลับร่วมใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมดการยืนยันตัวตนที่กำหนดค่าไว้
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ non-loopback
  `gateway.auth.mode: "trusted-proxy"` จะผ่านการตรวจสอบการยืนยันตัวตนของการเชื่อมต่อจาก
  เฮดเดอร์คำขอแทน `connect.params.auth.*`
- private-ingress `gateway.auth.mode: "none"` จะข้ามการยืนยันตัวตนการเชื่อมต่อด้วยความลับร่วม
  ทั้งหมด อย่าเปิดเผยโหมดนี้บน ingress สาธารณะ/ที่ไม่น่าเชื่อถือ
- หลังการจับคู่ Gateway จะออก **โทเค็นอุปกรณ์** ที่จำกัดขอบเขตตามบทบาทการเชื่อมต่อ
  + scopes โดยจะถูกส่งคืนใน `hello-ok.auth.deviceToken` และไคลเอนต์ควร
  เก็บไว้สำหรับการเชื่อมต่อในอนาคต
- ไคลเอนต์ควรเก็บ `hello-ok.auth.deviceToken` หลักไว้หลังจาก
  เชื่อมต่อสำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วยโทเค็นอุปกรณ์ที่ **จัดเก็บไว้** นั้นควรใช้ชุด scope ที่ได้รับอนุมัติซึ่งจัดเก็บไว้
  สำหรับโทเค็นนั้นซ้ำด้วย วิธีนี้จะรักษาสิทธิ์เข้าถึง read/probe/status
  ที่ได้รับอนุญาตไปแล้ว และหลีกเลี่ยงการลดขอบเขตการเชื่อมต่อใหม่ลงอย่างเงียบ ๆ เหลือ
  scope เฉพาะผู้ดูแลระบบโดยนัยที่แคบกว่า
- การประกอบข้อมูลยืนยันตัวตนฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากส่วนอื่นและจะถูกส่งต่อเสมอเมื่อมีการตั้งค่า
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: shared token ที่ระบุอย่างชัดเจนก่อน
    จากนั้น `deviceToken` ที่ระบุอย่างชัดเจน แล้วจึงเป็นโทเค็นต่ออุปกรณ์ที่จัดเก็บไว้ (ใช้คีย์ตาม
    `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อไม่มีรายการข้างต้นที่แก้ค่าเป็น
    `auth.token` ได้ shared token หรือโทเค็นอุปกรณ์ใด ๆ ที่แก้ค่าได้จะระงับการส่งค่านี้
  - การเลื่อนระดับโทเค็นอุปกรณ์ที่จัดเก็บไว้โดยอัตโนมัติในการลองใหม่แบบครั้งเดียวสำหรับ
    `AUTH_TOKEN_MISMATCH` ถูกจำกัดไว้ที่ **endpoint ที่น่าเชื่อถือเท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบตรึงไว้ `wss://` สาธารณะ
    ที่ไม่มีการตรึงจะไม่เข้าเงื่อนไข
- รายการ `hello-ok.auth.deviceTokens` เพิ่มเติมคือโทเค็นส่งต่อสำหรับ bootstrap
  ให้เก็บไว้เฉพาะเมื่อการเชื่อมต่อใช้การยืนยันตัวตนแบบ bootstrap บน transport ที่น่าเชื่อถือ
  เช่น `wss://` หรือการจับคู่แบบ loopback/local
- หากไคลเอนต์ระบุ `deviceToken` หรือ `scopes` อย่าง **ชัดเจน** ชุด scope ที่ผู้เรียกขอนั้น
  จะยังเป็นแหล่งอำนาจหลัก; cached scopes จะถูกใช้ซ้ำเฉพาะเมื่อ
  ไคลเอนต์กำลังใช้โทเค็นต่ออุปกรณ์ที่จัดเก็บไว้ซ้ำเท่านั้น
- โทเค็นอุปกรณ์สามารถหมุนเวียน/เพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องใช้ scope `operator.pairing`)
- `device.token.rotate` จะส่งคืนเมตาดาต้าการหมุนเวียน โดยจะสะท้อน bearer token ทดแทน
  เฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ยืนยันตัวตนด้วยโทเค็นอุปกรณ์นั้นอยู่แล้ว
  เพื่อให้ไคลเอนต์ที่ใช้เฉพาะโทเค็นสามารถเก็บโทเค็นทดแทนก่อน
  เชื่อมต่อใหม่ได้ การหมุนเวียนแบบ shared/admin จะไม่สะท้อน bearer token
- การออกโทเค็น การหมุนเวียน และการเพิกถอนจะยังถูกจำกัดไว้กับชุดบทบาทที่ได้รับอนุมัติ
  ซึ่งบันทึกไว้ในรายการจับคู่ของอุปกรณ์นั้น การเปลี่ยนแปลงโทเค็นไม่สามารถขยายหรือ
  กำหนดเป้าหมายบทบาทอุปกรณ์ที่การอนุมัติการจับคู่ไม่เคยให้ไว้ได้
- สำหรับเซสชันโทเค็นของอุปกรณ์ที่จับคู่แล้ว การจัดการอุปกรณ์จะจำกัดขอบเขตอยู่กับตนเอง เว้นแต่
  ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ผู้ดูแลระบบสามารถลบ/เพิกถอน/หมุนเวียน
  ได้เฉพาะรายการอุปกรณ์ของ **ตนเอง** เท่านั้น
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุด scope ของโทเค็น operator
  เป้าหมายเทียบกับ scope ของเซสชันปัจจุบันของผู้เรียก ผู้เรียกที่ไม่ใช่ผู้ดูแลระบบ
  ไม่สามารถหมุนเวียนหรือเพิกถอนโทเค็น operator ที่กว้างกว่าที่ตนมีอยู่ได้
- ความล้มเหลวในการยืนยันตัวตนจะมี `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (บูลีน)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่น่าเชื่อถืออาจลองใหม่แบบจำกัดหนึ่งครั้งด้วยโทเค็นต่ออุปกรณ์ที่แคชไว้
  - หากการลองใหม่นั้นล้มเหลว ไคลเอนต์ควรหยุดลูปเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำการดำเนินการของ operator

## ตัวตนอุปกรณ์ + การจับคู่

- Nodes ควรรวมตัวตนอุปกรณ์ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  fingerprint ของ keypair
- Gateway จะออกโทเค็นต่ออุปกรณ์ + บทบาท
- ต้องมีการอนุมัติการจับคู่สำหรับ ID อุปกรณ์ใหม่ เว้นแต่จะเปิดใช้การอนุมัติอัตโนมัติแบบ local
- การอนุมัติอัตโนมัติของการจับคู่มีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect backend/container-local แบบแคบสำหรับ
  flow ผู้ช่วยด้วยความลับร่วมที่น่าเชื่อถือ
- การเชื่อมต่อ tailnet หรือ LAN บนโฮสต์เดียวกันยังถือว่าเป็น remote สำหรับการจับคู่และ
  ต้องได้รับการอนุมัติ
- โดยปกติไคลเอนต์ WS จะรวมตัวตน `device` ระหว่าง `connect` (operator +
  node) ข้อยกเว้น operator ที่ไม่มีอุปกรณ์เพียงอย่างเดียวคือเส้นทางความเชื่อถือที่ระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้ของ HTTP ที่ไม่ปลอดภัยเฉพาะ localhost เท่านั้น
  - การยืนยันตัวตน Control UI ของ operator ด้วย `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
  - RPC backend ของ `gateway-client` ผ่าน direct-loopback ที่ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน
    Gateway แบบ shared
- การเชื่อมต่อทั้งหมดต้องลงนาม nonce `connect.challenge` ที่เซิร์ฟเวอร์ให้มา

### การวินิจฉัยการย้ายข้อมูลการยืนยันตัวตนอุปกรณ์

สำหรับไคลเอนต์ดั้งเดิมที่ยังใช้พฤติกรรมการลงนามก่อนมี challenge ตอนนี้ `connect` จะส่งคืน
โค้ดรายละเอียด `DEVICE_AUTH_*` ภายใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวทั่วไปในการย้ายข้อมูล:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ละ `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่าหรือผิด            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ลายเซ็นไม่ตรงกับ payload v2       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอก skew ที่อนุญาต          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/canonicalization ของ public key ล้มเหลว         |

เป้าหมายการย้ายข้อมูล:

- รอ `connect.challenge` เสมอ
- ลงนาม payload v2 ที่มี nonce ของเซิร์ฟเวอร์
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload ลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็นดั้งเดิม `v2` ยังคงยอมรับเพื่อความเข้ากันได้ แต่การตรึงเมตาดาต้าอุปกรณ์ที่จับคู่แล้ว
  ยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + การตรึง

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์อาจเลือกตรึง fingerprint ใบรับรองของ gateway ได้ (ดู config `gateway.tls`
  รวมถึง `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **API Gateway เต็มรูปแบบ** (status, channels, models, chat,
agent, sessions, nodes, approvals ฯลฯ) พื้นผิวที่แน่นอนกำหนดโดย
สคีมา TypeBox ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอลบริดจ์](/th/gateway/bridge-protocol)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
