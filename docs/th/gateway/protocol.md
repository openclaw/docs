---
read_when:
    - การพัฒนาหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - กำลังสร้างสคีมา/โมเดลโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การจับมือ, เฟรม, การจัดการเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-05-02T20:44:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc8bd6bae485f13bbd0e8762d30abdfab7e2aee635f8ebac1a38798493239798
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol เป็น **ระนาบควบคุมเดียว + การขนส่งของ Node** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, web UI, แอป macOS, Node iOS/Android, Node แบบ headless)
เชื่อมต่อผ่าน WebSocket และประกาศ **role** + **scope** ของตนในช่วง
handshake

## การขนส่ง

- WebSocket, text frames พร้อม payload แบบ JSON
- frame แรก **ต้อง** เป็นคำขอ `connect`
- frame ก่อนการเชื่อมต่อถูกจำกัดไว้ที่ 64 KiB หลังจาก handshake สำเร็จ ไคลเอนต์
  ควรทำตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้ diagnostics,
  frame ขาเข้าที่มีขนาดเกินกำหนดและ outbound buffers ที่ช้าจะปล่อย event `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้ง frame ที่ได้รับผลกระทบ event เหล่านี้เก็บ
  ขนาด ขีดจำกัด พื้นผิว และ reason code ที่ปลอดภัย โดยไม่เก็บเนื้อหาข้อความ
  เนื้อหา attachment, raw frame body, tokens, cookies หรือค่าลับ

## Handshake (`connect`)

Gateway → Client (pre-connect challenge):

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
    "maxProtocol": 3,
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
    "protocol": 3,
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

ขณะที่ Gateway ยังคงเริ่ม sidecar ตอน startup ให้เสร็จ คำขอ `connect` อาจ
คืนข้อผิดพลาด `UNAVAILABLE` ที่ลองใหม่ได้ โดยมี `details.reason` ตั้งเป็น
`"startup-sidecars"` และ `retryAfterMs` ไคลเอนต์ควรลอง response นั้นใหม่
ภายในงบเวลาการเชื่อมต่อรวมของตน แทนที่จะแสดงเป็นความล้มเหลวของ
handshake แบบสิ้นสุด

`server`, `features`, `snapshot` และ `policy` ทั้งหมดเป็นค่าที่ schema กำหนดให้ต้องมี
(`src/gateway/protocol/schema/frames.ts`) `auth` ก็จำเป็นเช่นกัน และรายงาน
role/scopes ที่เจรจาได้ `canvasHostUrl` เป็นค่าทางเลือก

เมื่อไม่มีการออก device token, `hello-ok.auth` จะรายงาน permissions ที่เจรจาได้
โดยไม่มี token fields:

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
ยืนยันตัวตนด้วย gateway token/password ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้สำหรับ
RPC ของ control-plane ภายใน และป้องกันไม่ให้ baseline การจับคู่ CLI/device ที่ล้าสมัย
บล็อกงาน backend ในเครื่อง เช่น การอัปเดต session ของ subagent ไคลเอนต์ระยะไกล,
ไคลเอนต์จาก browser origin, ไคลเอนต์ node และไคลเอนต์ที่ระบุ device-token/device-identity
อย่างชัดเจนยังคงใช้การจับคู่และการตรวจสอบ scope-upgrade ตามปกติ

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

ระหว่าง trusted bootstrap handoff, `hello-ok.auth` อาจรวมรายการ role ที่มีขอบเขตเพิ่มเติม
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

สำหรับ flow bootstrap ของ node/operator ที่มีมาให้ในตัว token หลักของ node จะยังคงเป็น
`scopes: []` และ token ของ operator ที่ส่งมอบต่อจะยังคงถูกจำกัดไว้ที่ allowlist ของ bootstrap
operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจสอบ bootstrap scope ยังคง
มี prefix ตาม role: รายการ operator จะตอบสนองเฉพาะคำขอของ operator เท่านั้น และ role
ที่ไม่ใช่ operator ยังต้องมี scopes ภายใต้ prefix ของ role ของตนเอง

### ตัวอย่าง Node

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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
- **response**: `{type:"res", id, ok, payload|error}`
- **event**: `{type:"event", event, payload, seq?, stateVersion?}`

method ที่มี side effect ต้องใช้ **idempotency keys** (ดู schema)

## Roles + scopes

### Roles

- `operator` = ไคลเอนต์ control plane (CLI/UI/automation)
- `node` = host ของความสามารถ (camera/screen/canvas/system.run)

### Scopes (operator)

Scopes ทั่วไป:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` ที่มี `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)

method ของ gateway RPC ที่ Plugin ลงทะเบียนอาจขอ operator scope ของตนเองได้ แต่
prefix core admin ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะ resolve เป็น `operator.admin` เสมอ

method scope เป็นเพียง gate แรกเท่านั้น slash commands บางรายการที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจสอบระดับ command ที่เข้มงวดกว่าเพิ่มเข้ามา ตัวอย่างเช่น การเขียน
`/config set` และ `/config unset` แบบคงอยู่ต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบ scope เพิ่มเติมในช่วง approval นอกเหนือจาก
base method scope:

- คำขอที่ไม่มี command: `operator.pairing`
- คำขอที่มี command ของ node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่รวม `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### caps/commands/permissions (node)

Nodes ประกาศ capability claims ในช่วง connect:

- `caps`: หมวดหมู่ความสามารถระดับสูง
- `commands`: allowlist ของ command สำหรับ invoke
- `permissions`: toggle แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway มองสิ่งเหล่านี้เป็น **claims** และบังคับใช้ allowlist ฝั่ง server

## Presence

- `system-presence` คืนรายการที่ keyed ตาม device identity
- รายการ Presence มี `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงหนึ่งแถวต่อ device ได้
  แม้เมื่อ device นั้นเชื่อมต่อเป็นทั้ง **operator** และ **node**
- `node.list` มี field ทางเลือก `lastSeenAtMs` และ `lastSeenReason` nodes ที่เชื่อมต่ออยู่รายงาน
  เวลาเชื่อมต่อปัจจุบันของตนเป็น `lastSeenAtMs` พร้อม reason `connect`; nodes ที่จับคู่แล้วสามารถรายงาน
  durable background presence ได้ด้วย เมื่อ event ของ node ที่เชื่อถือได้อัปเดต metadata การจับคู่ของตน

### event background alive ของ Node

Nodes อาจเรียก `node.event` ด้วย `event: "node.presence.alive"` เพื่อบันทึกว่า node ที่จับคู่แล้ว
ยัง alive ระหว่าง background wake โดยไม่ทำเครื่องหมายว่า connected

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น closed enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` string trigger ที่ไม่รู้จักจะถูก normalize เป็น
`background` โดย gateway ก่อน persistence event จะ durable เฉพาะสำหรับ session ของ device node
ที่ยืนยันตัวตนแล้วเท่านั้น; session ที่ไม่มี device หรือไม่ได้จับคู่จะคืน `handled: false`

Gateway ที่สำเร็จจะคืนผลลัพธ์แบบมีโครงสร้าง:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway รุ่นเก่าอาจยังคงคืน `{ "ok": true }` สำหรับ `node.event`; ไคลเอนต์ควรมองว่านั่นเป็น
RPC ที่ได้รับ acknowledgement แล้ว ไม่ใช่การ persist presence แบบ durable

## การกำหนด scope ของ broadcast event

event broadcast ของ WebSocket ที่ server push ถูก gate ด้วย scope เพื่อไม่ให้ session ที่มีเพียง pairing scope หรือ node-only รับเนื้อหา session แบบ passive

- **frame ของ chat, agent และ tool-result** (รวมถึง event `agent` แบบ streamed และผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` session ที่ไม่มี `operator.read` จะข้าม frame เหล่านี้ทั้งหมด
- **broadcast `plugin.*` ที่ Plugin กำหนด** ถูก gate ไปที่ `operator.write` หรือ `operator.admin` ขึ้นอยู่กับวิธีที่ Plugin ลงทะเบียน
- **event ของ status และ transport** (`heartbeat`, `presence`, `tick`, lifecycle connect/disconnect ฯลฯ) ยังคงไม่ถูกจำกัด เพื่อให้ทุก session ที่ยืนยันตัวตนแล้วสังเกตเห็นสุขภาพของ transport ได้
- **ตระกูล broadcast event ที่ไม่รู้จัก** ถูก gate ด้วย scope เป็นค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนจะผ่อนคลายอย่างชัดเจน

การเชื่อมต่อของไคลเอนต์แต่ละตัวเก็บหมายเลข sequence ต่อไคลเอนต์ของตนเอง ดังนั้น broadcast จึงรักษาการเรียงลำดับแบบ monotonic บน socket นั้น แม้ว่าไคลเอนต์ต่างกันจะเห็น subset ของ event stream ที่ถูกกรองด้วย scope ต่างกัน

## ตระกูล method RPC ทั่วไป

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ด้านบน นี่
ไม่ใช่ dump ที่สร้างขึ้น — `hello-ok.features.methods` เป็นรายการ discovery แบบอนุรักษ์นิยม
ที่สร้างจาก `src/gateway/server-methods-list.ts` รวมกับ method exports ของ
plugin/channel ที่โหลดแล้ว ให้มองว่าเป็น feature discovery ไม่ใช่การแจกแจงทั้งหมดของ
`src/gateway/server-methods/*.ts`

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` คืน snapshot สุขภาพของ gateway ที่ cache ไว้หรือ probe ใหม่
    - `diagnostics.stability` คืน diagnostic stability recorder ล่าสุดที่มีขอบเขตจำกัด โดยเก็บ operational metadata เช่นชื่อ event, จำนวน, ขนาด byte, ค่า memory, สถานะ queue/session, ชื่อ channel/plugin และ session ids โดยไม่เก็บข้อความ chat, webhook bodies, tool outputs, raw request หรือ response bodies, tokens, cookies หรือค่าลับ ต้องใช้ operator read scope
    - `status` คืน summary ของ gateway แบบ `/status`; field ที่ละเอียดอ่อนจะรวมเฉพาะสำหรับไคลเอนต์ operator ที่มี admin scope
    - `gateway.identity.get` คืน device identity ของ gateway ที่ใช้โดย relay และ flow การจับคู่
    - `system-presence` คืน snapshot presence ปัจจุบันสำหรับ device operator/node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่ม system event และสามารถอัปเดต/broadcast context ของ presence ได้
    - `last-heartbeat` คืน heartbeat event ล่าสุดที่ persist แล้ว
    - `set-heartbeats` toggle การประมวลผล heartbeat บน gateway

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` ส่งคืนแคตตาล็อกโมเดลที่รันไทม์อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าแล้วขนาดเหมาะกับตัวเลือก (`agents.defaults.models` ก่อน แล้วตามด้วย `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแคตตาล็อกทั้งหมด
    - `usage.status` ส่งคืนหน้าต่างการใช้งานของผู้ให้บริการ/สรุปโควตาคงเหลือ
    - `usage.cost` ส่งคืนสรุปต้นทุนการใช้งานแบบรวมสำหรับช่วงวันที่
    - `doctor.memory.status` ส่งคืนความพร้อมของหน่วยความจำเวกเตอร์ / embedding ที่แคชไว้สำหรับพื้นที่ทำงานของเอเจนต์ค่าเริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจนเท่านั้น
    - `doctor.memory.remHarness` ส่งคืนตัวอย่าง REM harness แบบอ่านอย่างเดียวที่มีขอบเขตสำหรับไคลเอนต์ control-plane ระยะไกล โดยอาจรวมพาธพื้นที่ทำงาน ชิ้นส่วนหน่วยความจำ markdown ที่เรนเดอร์พร้อมการอ้างอิง และตัวเลือกการเลื่อนระดับเชิงลึก ดังนั้นผู้เรียกจึงต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานรายเซสชัน
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบอนุกรมเวลาสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` ส่งคืนสรุปสถานะของช่องทาง/Plugin ในตัวและที่มาพร้อมแพ็กเกจ
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีที่ระบุเมื่อช่องทางรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบผ่าน QR/เว็บสำหรับผู้ให้บริการช่องทางเว็บที่รองรับ QR ในปัจจุบัน
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบผ่าน QR/เว็บนั้นเสร็จสิ้นและเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง Node iOS ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืนทริกเกอร์ wake-word ที่เก็บไว้
    - `voicewake.set` อัปเดตทริกเกอร์ wake-word และกระจายการเปลี่ยนแปลง

  </Accordion>

  <Accordion title="Messaging and logs">
    - `send` คือ RPC สำหรับการส่งขาออกโดยตรงที่เจาะจงช่องทาง/บัญชี/เธรดภายนอกตัวรันแชต
    - `logs.tail` ส่งคืนส่วนท้ายของบันทึกไฟล์ Gateway ที่กำหนดค่าไว้ พร้อมการควบคุมเคอร์เซอร์/ขีดจำกัดและจำนวนไบต์สูงสุด

  </Accordion>

  <Accordion title="Talk and TTS">
    - `talk.config` ส่งคืน payload การกำหนดค่า Talk ที่มีผลจริง; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.mode` ตั้งค่า/กระจายสถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะการเปิดใช้ TTS ผู้ให้บริการที่ใช้งานอยู่ ผู้ให้บริการสำรอง และสถานะการกำหนดค่าผู้ให้บริการ
    - `tts.providers` ส่งคืนรายการผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะค่ากำหนด TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` เรียกใช้การแปลงข้อความเป็นเสียงแบบครั้งเดียว

  </Accordion>

  <Accordion title="Secrets, config, update, and wizard">
    - `secrets.reload` resolve `SecretRefs` ที่ใช้งานอยู่อีกครั้ง และสลับสถานะ secret ของรันไทม์เฉพาะเมื่อสำเร็จทั้งหมดเท่านั้น
    - `secrets.resolve` resolve การกำหนด secret เป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายที่ระบุ
    - `config.get` ส่งคืน snapshot และ hash ของการกำหนดค่าปัจจุบัน
    - `config.set` เขียน payload การกำหนดค่าที่ผ่านการตรวจสอบแล้ว
    - `config.patch` รวมการอัปเดตการกำหนดค่าบางส่วน
    - `config.apply` ตรวจสอบ + แทนที่ payload การกำหนดค่าทั้งหมด
    - `config.schema` ส่งคืน payload schema การกำหนดค่าแบบสดที่ใช้โดย Control UI และเครื่องมือ CLI: schema, `uiHints`, เวอร์ชัน และเมทาดาทาการสร้าง รวมถึงเมทาดาทา schema ของ Plugin + ช่องทางเมื่อรันไทม์สามารถโหลดได้ schema มีเมทาดาทาฟิลด์ `title` / `description` ที่ได้จากป้ายกำกับและข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึงสาขาการประกอบอ็อบเจ็กต์ซ้อน wildcard รายการอาร์เรย์ และ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืน payload lookup ที่จำกัดตามพาธสำหรับพาธการกำหนดค่าหนึ่งรายการ: พาธที่ทำให้เป็นมาตรฐานแล้ว โหนด schema แบบตื้น hint ที่ตรงกัน + `hintPath` และสรุปลูกโดยตรงสำหรับการเจาะดูใน UI/CLI โหนด schema ของ lookup เก็บเอกสารสำหรับผู้ใช้และฟิลด์ตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขตตัวเลข/สตริง/อาร์เรย์/อ็อบเจ็กต์ และแฟล็กอย่าง `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกเปิดเผย `key`, `path` ที่ทำให้เป็นมาตรฐานแล้ว, `type`, `required`, `hasChildren` รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` เรียกใช้โฟลว์อัปเดต Gateway และกำหนดเวลาการรีสตาร์ทเฉพาะเมื่อการอัปเดตเองสำเร็จเท่านั้น การอัปเดตผ่าน package manager บังคับให้รีสตาร์ทการอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังสลับแพ็กเกจ เพื่อไม่ให้โปรเซส Gateway เก่ายังคง lazy-load จาก tree `dist` ที่ถูกแทนที่แล้ว
    - `update.status` ส่งคืน sentinel การรีสตาร์ทอัปเดตที่แคชล่าสุด รวมถึงเวอร์ชันที่กำลังรันหลังรีสตาร์ทเมื่อมีให้ใช้
    - `wizard.start`, `wizard.next`, `wizard.status`, และ `wizard.cancel` เปิดเผย wizard การเริ่มใช้งานผ่าน WS RPC

  </Accordion>

  <Accordion title="Agent and workspace helpers">
    - `agents.list` ส่งคืนรายการเอเจนต์ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลจริงและเมทาดาทารันไทม์
    - `agents.create`, `agents.update`, และ `agents.delete` จัดการระเบียนเอเจนต์และการเชื่อมต่อพื้นที่ทำงาน
    - `agents.files.list`, `agents.files.get`, และ `agents.files.set` จัดการไฟล์พื้นที่ทำงาน bootstrap ที่เปิดเผยสำหรับเอเจนต์
    - `artifacts.list`, `artifacts.get`, และ `artifacts.download` เปิดเผยสรุป artifact และการดาวน์โหลดที่ได้จาก transcript สำหรับขอบเขต `sessionKey`, `runId`, หรือ `taskId` ที่ระบุอย่างชัดเจน query ของการรันและงานจะ resolve เซสชันเจ้าของฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อ transcript ที่มี provenance ตรงกัน แหล่ง URL ที่ไม่ปลอดภัยหรือเป็น local จะส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการ fetch ฝั่งเซิร์ฟเวอร์
    - `agent.identity.get` ส่งคืน identity ของผู้ช่วยที่มีผลจริงสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้การรันเสร็จสิ้นและส่งคืน snapshot สุดท้ายเมื่อมีให้ใช้

  </Accordion>

  <Accordion title="Session control">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึงเมทาดาทา `agentRuntime` ต่อแถวเมื่อมีการกำหนดค่า backend รันไทม์ของเอเจนต์
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับ event การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับ event transcript/ข้อความสำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนตัวอย่าง transcript แบบมีขอบเขตสำหรับคีย์เซสชันที่ระบุ
    - `sessions.describe` ส่งคืนแถวเซสชัน Gateway หนึ่งแถวสำหรับคีย์เซสชันที่ตรงแบบ exact
    - `sessions.resolve` resolve หรือทำให้เป้าหมายเซสชันเป็น canonical
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าสู่เซสชันที่มีอยู่
    - `sessions.steer` คือ variant interrupt-and-steer สำหรับเซสชันที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่เป็นทางเลือก หรือส่งเฉพาะ `runId` สำหรับการรันที่ใช้งานอยู่ซึ่ง Gateway สามารถ resolve เป็นเซสชันได้
    - `sessions.patch` อัปเดตเมทาดาทา/override ของเซสชัน และรายงานโมเดล canonical ที่ resolve แล้วพร้อม `agentRuntime` ที่มีผลจริง
    - `sessions.reset`, `sessions.delete`, และ `sessions.compact` ดำเนินการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้ทั้งหมด
    - การดำเนินการแชตยังคงใช้ `chat.history`, `chat.send`, `chat.abort`, และ `chat.inject` `chat.history` ถูกทำให้เป็นมาตรฐานสำหรับการแสดงผลให้ไคลเอนต์ UI: แท็ก directive แบบ inline จะถูกลบออกจากข้อความที่มองเห็นได้, payload XML ของ tool-call แบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน) และ token ควบคุมโมเดลแบบ ASCII/full-width ที่รั่วออกมาจะถูกลบออก, แถวผู้ช่วยที่เป็น silent-token ล้วน เช่น `NO_REPLY` / `no_reply` แบบ exact จะถูกละไว้ และแถวที่ใหญ่เกินไปอาจถูกแทนที่ด้วย placeholder

  </Accordion>

  <Accordion title="Device pairing and device tokens">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วซึ่งรอดำเนินการและได้รับอนุมัติ
    - `device.pair.approve`, `device.pair.reject`, และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` หมุน token ของอุปกรณ์ที่จับคู่แล้วภายใน role ที่อนุมัติและขอบเขตของผู้เรียก
    - `device.token.revoke` เพิกถอน token ของอุปกรณ์ที่จับคู่แล้วภายใน role ที่อนุมัติและขอบเขตของผู้เรียก

  </Accordion>

  <Accordion title="Node pairing, invoke, and pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, และ `node.pair.verify` ครอบคลุมการจับคู่ Node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` ส่งคืนสถานะ Node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับ Node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง Node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอ invoke
    - `node.event` ส่ง event ที่มาจาก Node กลับเข้าสู่ gateway
    - `node.canvas.capability.refresh` รีเฟรช token ของความสามารถ canvas ที่จำกัดขอบเขต
    - `node.pending.pull` และ `node.pending.ack` คือ API คิวของ Node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบ durable สำหรับ Node ที่ออฟไลน์/ตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="Approval families">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการ lookup/replay การอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการ และส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการ snapshot นโยบายการอนุมัติ exec ของ gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec แบบ local ของ Node ผ่านคำสั่ง relay ของ Node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่กำหนดโดย Plugin

  </Accordion>

  <Accordion title="Automation, skills, and tools">
    - ระบบอัตโนมัติ: `wake` กำหนดเวลาการฉีดข้อความ wake แบบทันทีหรือใน Heartbeat ถัดไป; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่กำหนดเวลาไว้
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### กลุ่ม event ทั่วไป

- `chat`: การอัปเดตแชตของ UI เช่น `chat.inject` และ event แชตอื่นที่เป็นเฉพาะ transcript
- `session.message` และ `session.tool`: การอัปเดต transcript/event-stream สำหรับเซสชันที่สมัครรับ
- `sessions.changed`: ดัชนีเซสชันหรือเมทาดาทาเปลี่ยนแปลง
- `presence`: การอัปเดต snapshot การมีอยู่ของระบบ
- `tick`: event keepalive / liveness เป็นระยะ
- `health`: การอัปเดต snapshot สุขภาพของ gateway
- `heartbeat`: การอัปเดตสตรีม event Heartbeat
- `cron`: event การเปลี่ยนแปลงการรัน/งาน Cron
- `shutdown`: การแจ้งปิด gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ Node
- `node.invoke.request`: broadcast คำขอ invoke ของ Node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตของอุปกรณ์ที่จับคู่แล้ว
- `voicewake.changed`: การกำหนดค่าทริกเกอร์ wake-word เปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ Plugin

### เมธอด helper ของ Node

- Node อาจเรียก `skills.bins` เพื่อดึงรายการ executable ของ skill ปัจจุบันสำหรับการตรวจสอบ auto-allow

### เมธอด helper ของผู้ปฏิบัติการ

- ผู้ปฏิบัติการสามารถเรียก `commands.list` (`operator.read`) เพื่อดึงรายการคำสั่งรันไทม์
  สำหรับเอเจนต์ได้
  - `agentId` เป็นค่าไม่บังคับ; ละเว้นเพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - `scope` ควบคุมพื้นผิวที่ `name` หลักชี้เป้า:
    - `text` ส่งคืนโทเคนคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางเริ่มต้น `both` ส่งคืนชื่อเนทีฟที่รับรู้ผู้ให้บริการ
      เมื่อพร้อมใช้งาน
  - `textAliases` เก็บนามแฝงแบบสแลชที่ตรงกันทุกตัว เช่น `/model` และ `/m`
  - `nativeName` เก็บชื่อคำสั่งเนทีฟที่รับรู้ผู้ให้บริการเมื่อมีอยู่
  - `provider` เป็นค่าไม่บังคับและมีผลเฉพาะกับการตั้งชื่อแบบเนทีฟ รวมถึงความพร้อมใช้งานของคำสั่ง Plugin
    แบบเนทีฟ
  - `includeArgs=false` ละเว้นเมทาดาทาอาร์กิวเมนต์ที่ซีเรียลไลซ์แล้วจากการตอบกลับ
- ผู้ปฏิบัติการสามารถเรียก `tools.catalog` (`operator.read`) เพื่อดึงแคตตาล็อกเครื่องมือรันไทม์สำหรับ
  เอเจนต์ได้ การตอบกลับมีเครื่องมือที่จัดกลุ่มและเมทาดาทาแหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ plugin เมื่อ `source="plugin"`
  - `optional`: เครื่องมือของ plugin เป็นค่าไม่บังคับหรือไม่
- ผู้ปฏิบัติการสามารถเรียก `tools.effective` (`operator.read`) เพื่อดึงรายการเครื่องมือที่มีผลจริงในรันไทม์
  สำหรับเซสชันได้
  - ต้องมี `sessionKey`
  - gateway อนุมานบริบทรันไทม์ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนที่จะยอมรับบริบทการยืนยันตัวตนหรือการส่งมอบ
    ที่ผู้เรียกส่งมา
  - การตอบกลับอยู่ในขอบเขตเซสชันและสะท้อนสิ่งที่การสนทนาที่ใช้งานอยู่สามารถใช้ได้ตอนนี้
    รวมถึงเครื่องมือ core, plugin และ channel
- ผู้ปฏิบัติการสามารถเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือที่มีอยู่หนึ่งรายการผ่าน
  เส้นทางนโยบาย gateway เดียวกับ `/tools/invoke`
  - ต้องมี `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ
    `idempotencyKey` เป็นค่าไม่บังคับ
  - หากมีทั้ง `sessionKey` และ `agentId` เอเจนต์ของเซสชันที่ resolve แล้วต้องตรงกับ
    `agentId`
  - การตอบกลับเป็นเอนเวโลปสำหรับ SDK ที่มี `ok`, `toolName`, `output` แบบไม่บังคับ และฟิลด์
    `error` ที่มีชนิดกำกับ การอนุมัติหรือการปฏิเสธตามนโยบายจะส่งคืน `ok:false` ในเพย์โหลด แทนที่จะ
    ข้ามไปป์ไลน์นโยบายเครื่องมือของ gateway
- ผู้ปฏิบัติการสามารถเรียก `skills.status` (`operator.read`) เพื่อดึงรายการ skill ที่มองเห็นได้
  สำหรับเอเจนต์
  - `agentId` เป็นค่าไม่บังคับ; ละเว้นเพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - การตอบกลับมีคุณสมบัติความมีสิทธิ์ ข้อกำหนดที่ขาดหายไป การตรวจสอบ config และ
    ตัวเลือกการติดตั้งที่ผ่านการทำให้ปลอดภัยแล้วโดยไม่เปิดเผยค่าความลับดิบ
- ผู้ปฏิบัติการสามารถเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ
  เมทาดาทาการค้นพบของ ClawHub
- ผู้ปฏิบัติการสามารถเรียก `skills.install` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้ง
    โฟลเดอร์ skill ลงในไดเรกทอรี `skills/` ของพื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    เรียกใช้การกระทำ `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ gateway
- ผู้ปฏิบัติการสามารถเรียก `skills.update` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามหนึ่งรายการหรือการติดตั้ง ClawHub ที่ติดตามทั้งหมดใน
    พื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมด config แพตช์ค่า `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` รับพารามิเตอร์ `view` แบบไม่บังคับ:

- ละเว้นหรือ `"default"`: พฤติกรรมรันไทม์ปัจจุบัน หากกำหนดค่า `agents.defaults.models` ไว้ การตอบกลับคือแคตตาล็อกที่อนุญาต; มิฉะนั้นการตอบกลับคือแคตตาล็อก Gateway ทั้งหมด
- `"configured"`: พฤติกรรมขนาดเท่าตัวเลือก หากกำหนดค่า `agents.defaults.models` ไว้ ค่านั้นยังคงชนะ มิฉะนั้นการตอบกลับจะใช้รายการ `models.providers.*.models` ที่ระบุไว้ชัดเจน โดยย้อนกลับไปใช้แคตตาล็อกทั้งหมดเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แคตตาล็อก Gateway ทั้งหมด โดยข้าม `agents.defaults.models` ใช้สำหรับ UI การวินิจฉัยและการค้นพบ ไม่ใช่ตัวเลือกโมเดลปกติ

## การอนุมัติ exec

- เมื่อคำขอ exec ต้องการการอนุมัติ gateway จะกระจาย `exec.approval.requested`
- ไคลเอ็นต์ผู้ปฏิบัติการ resolve โดยเรียก `exec.approval.resolve` (ต้องมี scope `operator.approvals`)
- สำหรับ `host=node` นั้น `exec.approval.request` ต้องมี `systemRunPlan` (`argv`/`cwd`/`rawCommand`/เมทาดาทาเซสชันแบบบัญญัติ) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังอนุมัติแล้ว การเรียก `node.invoke system.run` ที่ส่งต่อจะนำ
  `systemRunPlan` แบบบัญญัตินั้นกลับมาใช้เป็นบริบทคำสั่ง/cwd/เซสชันที่มีอำนาจตัดสิน
- หากผู้เรียกเปลี่ยนแปลง `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่างการเตรียมและการส่งต่อ `system.run` ขั้นสุดท้ายที่ได้รับอนุมัติ
  gateway จะปฏิเสธการรันแทนที่จะเชื่อถือเพย์โหลดที่ถูกเปลี่ยนแปลง

## การสำรองการส่งมอบของเอเจนต์

- คำขอ `agent` สามารถมี `deliver=true` เพื่อร้องขอการส่งมอบขาออก
- `bestEffortDeliver=false` คงพฤติกรรมแบบเข้มงวด: เป้าหมายการส่งมอบที่ resolve ไม่ได้หรือมีไว้ใช้ภายในเท่านั้นจะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ย้อนกลับไปดำเนินการเฉพาะในเซสชันเมื่อไม่สามารถ resolve เส้นทางที่ส่งมอบภายนอกได้ (เช่น เซสชันภายใน/webchat หรือ config หลาย channel ที่กำกวม)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema/protocol-schemas.ts`
- ไคลเอ็นต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธรายการที่ไม่ตรงกัน
- schema + model สร้างจากนิยาม TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอ็นต์

ไคลเอ็นต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าต่างๆ
เสถียรตลอด protocol v3 และเป็น baseline ที่คาดหวังสำหรับไคลเอ็นต์ของบุคคลที่สาม

| ค่าคงที่                                  | ค่าเริ่มต้น                                               | แหล่งที่มา                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| หมดเวลาคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| หมดเวลา preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่มงบประมาณเซิร์ฟเวอร์/ไคลเอ็นต์ที่จับคู่กันได้) |
| backoff การเชื่อมต่อใหม่เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| backoff การเชื่อมต่อใหม่สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| ขีดจำกัดการลองซ้ำเร็วหลังปิด device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ช่วงผ่อนผัน force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| หมดเวลาเริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| การปิดเมื่อ tick หมดเวลา                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศ `policy.tickIntervalMs`, `policy.maxPayload`,
และ `policy.maxBufferedBytes` ที่มีผลจริงใน `hello-ok`; ไคลเอ็นต์ควรเคารพค่าเหล่านั้น
แทนค่าเริ่มต้นก่อน handshake

## การยืนยันตัวตน

- การตรวจสอบสิทธิ์ Gateway แบบความลับที่ใช้ร่วมกันใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมดการตรวจสอบสิทธิ์ที่กำหนดค่าไว้
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ non-loopback
  `gateway.auth.mode: "trusted-proxy"` จะผ่านการตรวจสอบ connect auth จาก
  request headers แทน `connect.params.auth.*`
- `gateway.auth.mode: "none"` สำหรับ private-ingress จะข้าม shared-secret connect auth
  ทั้งหมด; อย่าเปิดเผยโหมดนั้นบน ingress สาธารณะ/ไม่น่าเชื่อถือ
- หลังจากจับคู่แล้ว Gateway จะออก **device token** ที่จำกัดขอบเขตตาม role +
  scopes ของการเชื่อมต่อ โดยจะส่งคืนใน `hello-ok.auth.deviceToken` และไคลเอนต์ควร
  บันทึกไว้สำหรับการเชื่อมต่อในอนาคต
- ไคลเอนต์ควรบันทึก `hello-ok.auth.deviceToken` หลักหลังจาก connect สำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วย device token ที่ **บันทึกไว้** นั้นควรใช้ชุด scope ที่อนุมัติแล้ว
  ซึ่งบันทึกไว้สำหรับ token นั้นซ้ำด้วย วิธีนี้จะรักษาสิทธิ์ read/probe/status
  ที่ได้รับอนุมัติไปแล้ว และหลีกเลี่ยงการลดขอบเขตการเชื่อมต่อใหม่อย่างเงียบ ๆ
  ให้เหลือ scope admin-only แบบโดยนัยที่แคบกว่า
- การประกอบ connect auth ฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากกันและจะถูกส่งต่อเสมอเมื่อมีการตั้งค่า
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: shared token ที่ระบุชัดเจนก่อน,
    จากนั้น `deviceToken` ที่ระบุชัดเจน, แล้วจึงเป็น token รายอุปกรณ์ที่บันทึกไว้
    (ผูกกับ `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อรายการข้างต้นไม่มีรายการใด resolve เป็น
    `auth.token` ได้ shared token หรือ device token ใด ๆ ที่ resolve ได้จะระงับการส่งค่านี้
  - การโปรโมต device token ที่บันทึกไว้โดยอัตโนมัติในการลองใหม่แบบ one-shot สำหรับ
    `AUTH_TOKEN_MISMATCH` จะถูกจำกัดไว้เฉพาะ **trusted endpoints** เท่านั้น —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบ pinned `wss://` สาธารณะ
    ที่ไม่มีการ pin จะไม่เข้าเงื่อนไข
- รายการ `hello-ok.auth.deviceTokens` เพิ่มเติมคือ bootstrap handoff tokens
  ให้บันทึกเฉพาะเมื่อ connect ใช้ bootstrap auth บน transport ที่เชื่อถือได้
  เช่น `wss://` หรือ loopback/การจับคู่แบบ local
- หากไคลเอนต์ส่ง `deviceToken` แบบ **explicit** หรือ `scopes` แบบ explicit
  ชุด scope ที่ caller ขอจะยังคงเป็น authoritative; cached scopes จะถูกใช้ซ้ำเฉพาะ
  เมื่อไคลเอนต์ใช้ token รายอุปกรณ์ที่บันทึกไว้ซ้ำเท่านั้น
- Device tokens สามารถ rotate/revoke ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องมี scope `operator.pairing`)
- `device.token.rotate` ส่งคืน rotation metadata โดยจะ echo bearer token ทดแทน
  เฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ผ่านการตรวจสอบสิทธิ์ด้วย device token นั้นอยู่แล้ว
  เพื่อให้ไคลเอนต์แบบ token-only บันทึกค่าทดแทนก่อนเชื่อมต่อใหม่ได้ การ rotate โดย
  shared/admin จะไม่ echo bearer token
- การออก token, การ rotate และการ revoke จะยังถูกจำกัดอยู่ภายในชุด role ที่อนุมัติ
  ซึ่งบันทึกไว้ในรายการ pairing ของอุปกรณ์นั้น; การ mutate token ไม่สามารถขยายหรือ
  กำหนดเป้าหมาย role ของอุปกรณ์ที่การอนุมัติ pairing ไม่เคยให้สิทธิ์ได้
- สำหรับ paired-device token sessions การจัดการอุปกรณ์จะจำกัดอยู่กับตัวเอง เว้นแต่
  caller จะมี `operator.admin` ด้วย: caller ที่ไม่ใช่ admin สามารถ remove/revoke/rotate
  ได้เฉพาะรายการอุปกรณ์ **ของตนเอง** เท่านั้น
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุด scope ของ operator
  token เป้าหมายเทียบกับ session scopes ปัจจุบันของ caller ด้วย caller ที่ไม่ใช่ admin
  ไม่สามารถ rotate หรือ revoke operator token ที่กว้างกว่าที่ตนมีอยู่แล้วได้
- ความล้มเหลวในการตรวจสอบสิทธิ์มี `error.details.code` พร้อม recovery hints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลองใหม่แบบมีขอบเขตหนึ่งครั้งด้วย cached per-device token
  - หากการลองใหม่นั้นล้มเหลว ไคลเอนต์ควรหยุดลูปการเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำการดำเนินการสำหรับ operator

## ข้อมูลระบุตัวตนอุปกรณ์ + การจับคู่

- Nodes ควรมีข้อมูลระบุตัวตนอุปกรณ์ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  keypair fingerprint
- Gateways ออก tokens ตามอุปกรณ์ + role
- ต้องมีการอนุมัติ pairing สำหรับ device IDs ใหม่ เว้นแต่จะเปิดใช้งาน local auto-approval
- Pairing auto-approval มีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่แคบ สำหรับ
  trusted shared-secret helper flows
- การเชื่อมต่อ tailnet หรือ LAN บนโฮสต์เดียวกันยังคงถือเป็น remote สำหรับ pairing และ
  ต้องมีการอนุมัติ
- โดยปกติ WS clients จะใส่ข้อมูลระบุตัวตน `device` ระหว่าง `connect` (operator +
  node) ข้อยกเว้นของ operator ที่ไม่มี device มีเฉพาะ trust paths ที่ระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ insecure HTTP แบบ localhost-only
  - operator Control UI auth ผ่าน `gateway.auth.mode: "trusted-proxy"` สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
  - RPC ของ backend `gateway-client` แบบ direct-loopback ที่ผ่านการตรวจสอบสิทธิ์ด้วย shared
    gateway token/password
- การเชื่อมต่อทั้งหมดต้อง sign nonce `connect.challenge` ที่ server ให้มา

### การวินิจฉัยการย้าย device auth

สำหรับไคลเอนต์เดิมที่ยังใช้พฤติกรรม signing ก่อนมี challenge ตอนนี้ `connect` จะส่งคืน
detail codes `DEVICE_AUTH_*` ภายใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวในการย้ายที่พบบ่อย:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ละเว้น `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ sign ด้วย nonce ที่เก่า/ผิด               |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature payload ไม่ตรงกับ v2 payload             |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ sign อยู่นอก skew ที่อนุญาต          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ public key fingerprint       |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/canonicalization ของ public key ล้มเหลว     |

เป้าหมายการย้าย:

- รอ `connect.challenge` เสมอ
- Sign v2 payload ที่มี server nonce
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- Signature payload ที่แนะนำคือ `v3` ซึ่ง bind `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce
- Signature `v2` เดิมยังคงยอมรับเพื่อความเข้ากันได้ แต่ metadata pinning ของ paired-device
  ยังคงควบคุม command policy เมื่อเชื่อมต่อใหม่

## TLS + การ pinning

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์อาจเลือก pin gateway cert fingerprint ได้ (ดู config `gateway.tls`
  พร้อม `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **full gateway API** (status, channels, models, chat,
agent, sessions, nodes, approvals ฯลฯ) surface ที่แน่นอนถูกกำหนดโดย
TypeBox schemas ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [Gateway runbook](/th/gateway)
