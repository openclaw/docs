---
read_when:
    - การพัฒนาหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - กำลังสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การจับมือ, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-05-03T21:32:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol เป็น **control plane + node transport เดียว** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, web UI, แอป macOS, โหนด iOS/Android, โหนด
headless) เชื่อมต่อผ่าน WebSocket และประกาศ **บทบาท** + **ขอบเขต** ของตน
ในเวลาทำ handshake

## การส่งข้อมูล

- WebSocket, text frames ที่มี JSON payloads
- เฟรมแรก **ต้อง** เป็นคำขอ `connect`
- เฟรมก่อนเชื่อมต่อถูกจำกัดที่ 64 KiB หลังจาก handshake สำเร็จแล้ว ไคลเอนต์
  ควรปฏิบัติตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้ diagnostics
  เฟรมขาเข้าที่ใหญ่เกินกำหนดและบัฟเฟอร์ขาออกที่ช้าจะปล่อยอีเวนต์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้งเฟรมที่ได้รับผลกระทบ อีเวนต์เหล่านี้เก็บ
  ขนาด ขีดจำกัด surface และรหัสเหตุผลที่ปลอดภัย อีเวนต์เหล่านี้ไม่เก็บ body
  ของข้อความ เนื้อหา attachment, raw frame body, tokens, cookies หรือค่าลับ

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

Gateway → ไคลเอนต์:

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

ขณะที่ Gateway ยังคงเริ่ม sidecar ตอน startup ให้เสร็จ คำขอ `connect`
อาจคืนข้อผิดพลาด `UNAVAILABLE` ที่ลองใหม่ได้ โดยมี `details.reason` ตั้งเป็น
`"startup-sidecars"` และ `retryAfterMs` ไคลเอนต์ควรลอง response นั้นใหม่
ภายในงบเวลาการเชื่อมต่อโดยรวมของตน แทนที่จะแสดงเป็นความล้มเหลวของ handshake
แบบสิ้นสุด

`server`, `features`, `snapshot` และ `policy` ทั้งหมดเป็นค่าที่ schema
กำหนดให้มี (`src/gateway/protocol/schema/frames.ts`) `auth` ก็เป็นค่าที่ต้องมี
เช่นกัน และรายงานบทบาท/ขอบเขตที่เจรจาแล้ว `canvasHostUrl` เป็นค่าทางเลือก

เมื่อไม่มีการออก device token, `hello-ok.auth` จะรายงานสิทธิ์ที่เจรจาแล้ว
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
`client.mode: "backend"`) อาจละ `device` ในการเชื่อมต่อ loopback โดยตรงได้เมื่อ
ยืนยันตัวตนด้วย gateway token/password ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้สำหรับ
RPC ของ control-plane ภายใน และป้องกันไม่ให้ baseline การจับคู่ CLI/device
ที่เก่าค้างบล็อกงาน backend ภายในเครื่อง เช่น การอัปเดต subagent session
ไคลเอนต์ระยะไกล ไคลเอนต์ที่มาจาก browser, node clients และไคลเอนต์
device-token/device-identity แบบชัดเจนยังคงใช้การจับคู่และการตรวจ scope-upgrade
ตามปกติ

เมื่อมีการออก device token, `hello-ok` จะมีข้อมูลนี้เพิ่มเติมด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ระหว่าง handoff ของ trusted bootstrap, `hello-ok.auth` อาจมีรายการบทบาทที่ถูกจำกัด
เพิ่มเติมใน `deviceTokens` ด้วย:

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

สำหรับโฟลว์ bootstrap node/operator ในตัว token หลักของ node จะคง
`scopes: []` และ operator token ใดๆ ที่ handoff แล้วจะยังถูกจำกัดไว้ที่ bootstrap
operator allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจ scope ของ bootstrap ยังคง
มี prefix ตามบทบาท: รายการ operator จะตอบสนองได้เฉพาะคำขอ operator เท่านั้น
และบทบาทที่ไม่ใช่ operator ยังคงต้องมี scopes ภายใต้ prefix บทบาทของตนเอง

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

## การจัดเฟรม

- **คำขอ**: `{type:"req", id, method, params}`
- **การตอบกลับ**: `{type:"res", id, ok, payload|error}`
- **อีเวนต์**: `{type:"event", event, payload, seq?, stateVersion?}`

เมธอดที่มีผลข้างเคียงต้องใช้ **idempotency keys** (ดู schema)

## บทบาท + ขอบเขต

สำหรับโมเดล operator scope ทั้งหมด การตรวจในเวลาขออนุมัติ และความหมายของ
shared-secret โปรดดู [ขอบเขต Operator](/th/gateway/operator-scopes)

### บทบาท

- `operator` = ไคลเอนต์ control plane (CLI/UI/automation)
- `node` = capability host (camera/screen/canvas/system.run)

### ขอบเขต (operator)

ขอบเขตทั่วไป:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` ที่มี `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)

เมธอด Gateway RPC ที่ Plugin ลงทะเบียนไว้อาจขอ operator scope ของตนเองได้ แต่
prefix core admin ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะ resolve เป็น `operator.admin` เสมอ

method scope เป็นเพียง gate แรกเท่านั้น คำสั่ง slash บางคำสั่งที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจระดับคำสั่งที่เข้มงวดกว่าเพิ่มเติม ตัวอย่างเช่น การเขียน
`/config set` และ `/config unset` แบบคงอยู่ต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจ scope เพิ่มเติมในเวลาขออนุมัติ นอกเหนือจาก
scope พื้นฐานของเมธอด:

- คำขอที่ไม่มี command: `operator.pairing`
- คำขอที่มี non-exec node commands: `operator.pairing` + `operator.write`
- คำขอที่มี `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes ประกาศ capability claims ตอนเชื่อมต่อ:

- `caps`: หมวดความสามารถระดับสูง
- `commands`: command allowlist สำหรับ invoke
- `permissions`: toggle แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือว่าสิ่งเหล่านี้เป็น **claims** และบังคับใช้ allowlist ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` คืน entries ที่ใช้ device identity เป็น key
- รายการ presence มี `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงหนึ่งแถวต่ออุปกรณ์ได้
  แม้เมื่ออุปกรณ์นั้นเชื่อมต่อเป็นทั้ง **operator** และ **node**
- `node.list` มีฟิลด์ทางเลือก `lastSeenAtMs` และ `lastSeenReason` Nodes ที่เชื่อมต่ออยู่จะรายงาน
  เวลาเชื่อมต่อปัจจุบันของตนเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; nodes ที่จับคู่แล้วสามารถรายงาน
  durable background presence ได้ด้วยเมื่อ trusted node event อัปเดต pairing metadata ของตน

### อีเวนต์ node background alive

Nodes อาจเรียก `node.event` พร้อม `event: "node.presence.alive"` เพื่อบันทึกว่า node ที่จับคู่แล้ว
ยังมีชีวิตอยู่ระหว่าง background wake โดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น enum แบบปิด: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` สตริง trigger ที่ไม่รู้จักจะถูก normalize เป็น
`background` โดย gateway ก่อน persistence อีเวนต์จะ durable เฉพาะสำหรับ session ของ node
device ที่ยืนยันตัวตนแล้วเท่านั้น; session ที่ไม่มี device หรือไม่ได้จับคู่จะคืน `handled: false`

Gateway ที่สำเร็จจะคืนผลลัพธ์แบบมีโครงสร้าง:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway รุ่นเก่าอาจยังคืน `{ "ok": true }` สำหรับ `node.event`; ไคลเอนต์ควรถือว่านั่นเป็น
RPC ที่ได้รับการยืนยันแล้ว ไม่ใช่ durable presence persistence

## การกำหนดขอบเขตอีเวนต์ broadcast

อีเวนต์ WebSocket broadcast ที่ server push จะถูก gate ตาม scope เพื่อไม่ให้ session ที่มีเพียง pairing scope หรือ node-only รับเนื้อหา session แบบ passive

- **เฟรม chat, agent และ tool-result** (รวมถึงอีเวนต์ `agent` แบบ streamed และผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` Session ที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcasts `plugin.*` ที่ Plugin กำหนด** จะถูก gate ไปที่ `operator.write` หรือ `operator.admin` ขึ้นอยู่กับวิธีที่ Plugin ลงทะเบียนไว้
- **อีเวนต์สถานะและ transport** (`heartbeat`, `presence`, `tick`, lifecycle ของการเชื่อมต่อ/ตัดการเชื่อมต่อ ฯลฯ) ยังคงไม่ถูกจำกัด เพื่อให้ transport health สังเกตได้สำหรับทุก session ที่ยืนยันตัวตนแล้ว
- **ตระกูลอีเวนต์ broadcast ที่ไม่รู้จัก** จะถูก gate ตาม scope โดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนปรนอย่างชัดเจน

การเชื่อมต่อของไคลเอนต์แต่ละตัวเก็บหมายเลข sequence ต่อไคลเอนต์ของตนเอง ดังนั้น broadcasts จึงรักษาลำดับแบบ monotonic บน socket นั้น แม้เมื่อไคลเอนต์ต่างตัวเห็น subset ของ event stream ที่ถูกกรองตาม scope แตกต่างกัน

## ตระกูลเมธอด RPC ทั่วไป

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ด้านบน นี่ไม่ใช่
dump ที่ generated — `hello-ok.features.methods` เป็นรายการ discovery
แบบอนุรักษนิยมที่สร้างจาก `src/gateway/server-methods-list.ts` พร้อม exports
ของเมธอด Plugin/channel ที่โหลดแล้ว ให้ถือว่าเป็น feature discovery ไม่ใช่
การแจกแจงทั้งหมดของ `src/gateway/server-methods/*.ts`

<AccordionGroup>
  <Accordion title="ระบบและ identity">
    - `health` คืน gateway health snapshot ที่ cache ไว้หรือ probe ใหม่
    - `diagnostics.stability` คืน recent bounded diagnostic stability recorder โดยเก็บ operational metadata เช่น ชื่ออีเวนต์ จำนวน byte sizes, memory readings, queue/session state, ชื่อ channel/plugin และ session ids แต่ไม่เก็บ chat text, webhook bodies, tool outputs, raw request หรือ response bodies, tokens, cookies หรือค่าลับ ต้องใช้ operator read scope
    - `status` คืน gateway summary แบบ `/status`; ฟิลด์ sensitive จะถูกรวมไว้เฉพาะสำหรับไคลเอนต์ operator ที่มี admin scope
    - `gateway.identity.get` คืน gateway device identity ที่ใช้โดย relay และ pairing flows
    - `system-presence` คืน presence snapshot ปัจจุบันสำหรับอุปกรณ์ operator/node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่ม system event และสามารถอัปเดต/broadcast presence context
    - `last-heartbeat` คืน persisted heartbeat event ล่าสุด
    - `set-heartbeats` toggle การประมวลผล heartbeat บน gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแค็ตตาล็อกโมเดลที่ runtime อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าไว้ในขนาดเหมาะกับตัวเลือก (`agents.defaults.models` ก่อน แล้วตามด้วย `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแค็ตตาล็อกทั้งหมด
    - `usage.status` ส่งคืนสรุปหน้าต่างการใช้งาน/โควตาคงเหลือของผู้ให้บริการ
    - `usage.cost` ส่งคืนสรุปการใช้งานต้นทุนแบบรวมสำหรับช่วงวันที่
    - `doctor.memory.status` ส่งคืนความพร้อมของ vector-memory / cached embedding สำหรับพื้นที่ทำงานของเอเจนต์เริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจน
    - `doctor.memory.remHarness` ส่งคืนพรีวิว REM harness แบบอ่านอย่างเดียวและมีขอบเขตสำหรับไคลเอนต์ control-plane ระยะไกล อาจรวมเส้นทางพื้นที่ทำงาน ส่วนย่อยของหน่วยความจำ markdown แบบ grounded ที่เรนเดอร์แล้ว และตัวเลือก deep promotion ดังนั้นผู้เรียกต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานต่อเซสชัน
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบอนุกรมเวลาสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="ช่องทางและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะของช่องทาง/Plugin ในตัว + ที่บันเดิลมา
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีที่ระบุ เมื่อช่องทางนั้นรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบผ่าน QR/เว็บสำหรับผู้ให้บริการช่องทางเว็บปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบผ่าน QR/เว็บนั้นเสร็จสมบูรณ์ และเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง iOS node ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืนทริกเกอร์ wake-word ที่จัดเก็บไว้
    - `voicewake.set` อัปเดตทริกเกอร์ wake-word และกระจายการเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การส่งข้อความและบันทึก">
    - `send` คือ RPC การส่งออกโดยตรงสำหรับการส่งที่กำหนดเป้าหมายเป็นช่องทาง/บัญชี/เธรดภายนอก chat runner
    - `logs.tail` ส่งคืน tail ของไฟล์บันทึก Gateway ที่กำหนดค่าไว้ พร้อมตัวควบคุม cursor/limit และจำนวนไบต์สูงสุด

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.config` ส่งคืน payload การกำหนดค่า Talk ที่มีผลใช้งานจริง; `includeSecrets` ต้องมี `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.mode` ตั้งค่า/กระจายสถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.speak` สังเคราะห์เสียงผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะการเปิดใช้งาน TTS, ผู้ให้บริการที่ใช้งานอยู่, ผู้ให้บริการสำรอง และสถานะการกำหนดค่าผู้ให้บริการ
    - `tts.providers` ส่งคืนรายการผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะการตั้งค่า TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` เรียกใช้การแปลงข้อความเป็นเสียงแบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ การกำหนดค่า การอัปเดต และวิซาร์ด">
    - `secrets.reload` แก้ไข SecretRefs ที่ใช้งานอยู่อีกครั้ง และสลับสถานะความลับของ runtime เฉพาะเมื่อสำเร็จทั้งหมด
    - `secrets.resolve` แก้ไขการกำหนดความลับเป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายที่ระบุ
    - `config.get` ส่งคืน snapshot และ hash ของการกำหนดค่าปัจจุบัน
    - `config.set` เขียน payload การกำหนดค่าที่ผ่านการตรวจสอบแล้ว
    - `config.patch` ผสานการอัปเดตการกำหนดค่าบางส่วน
    - `config.apply` ตรวจสอบ + แทนที่ payload การกำหนดค่าทั้งหมด
    - `config.schema` ส่งคืน payload schema การกำหนดค่าสดที่ Control UI และเครื่องมือ CLI ใช้: schema, `uiHints`, เวอร์ชัน และเมทาดาทาการสร้าง รวมถึงเมทาดาทา schema ของ Plugin + ช่องทางเมื่อ runtime โหลดได้ schema รวมเมทาดาทาฟิลด์ `title` / `description` ที่ได้จากป้ายกำกับและข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึง object ซ้อน, wildcard, array-item และสาขาการประกอบ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืน payload การค้นหาแบบจำกัดขอบเขตตามเส้นทางสำหรับเส้นทางการกำหนดค่าหนึ่งรายการ: เส้นทางที่ทำให้เป็นมาตรฐานแล้ว, โหนด schema แบบตื้น, hint ที่ตรงกัน + `hintPath`, และสรุปลูกโดยตรงสำหรับการเจาะลึกใน UI/CLI โหนด schema การค้นหาจะเก็บเอกสารที่ผู้ใช้เห็นและฟิลด์การตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขต numeric/string/array/object และ flag เช่น `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกจะแสดง `key`, `path` ที่ทำให้เป็นมาตรฐานแล้ว, `type`, `required`, `hasChildren` รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` เรียกใช้โฟลว์อัปเดต Gateway และจัดกำหนดการรีสตาร์ทเฉพาะเมื่อการอัปเดตเองสำเร็จ ผู้เรียกที่มีเซสชันสามารถใส่ `continuationMessage` เพื่อให้การเริ่มต้นทำงานต่อด้วยเทิร์นเอเจนต์ติดตามผลหนึ่งครั้งผ่านคิว restart continuation การอัปเดตผ่านตัวจัดการแพ็กเกจจะบังคับการรีสตาร์ทอัปเดตแบบไม่เลื่อนเวลาและไม่มีคูลดาวน์หลังสลับแพ็กเกจ เพื่อไม่ให้โปรเซส Gateway เก่ายังคง lazy-load จากต้นไม้ `dist` ที่ถูกแทนที่แล้ว
    - `update.status` ส่งคืน sentinel การรีสตาร์ทอัปเดตล่าสุดที่แคชไว้ รวมถึงเวอร์ชันที่กำลังทำงานหลังรีสตาร์ทเมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status`, และ `wizard.cancel` เปิดเผยวิซาร์ด onboarding ผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วยเอเจนต์และพื้นที่ทำงาน">
    - `agents.list` ส่งคืนรายการเอเจนต์ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลใช้งานจริงและเมทาดาทา runtime
    - `agents.create`, `agents.update`, และ `agents.delete` จัดการระเบียนเอเจนต์และการเชื่อมต่อพื้นที่ทำงาน
    - `agents.files.list`, `agents.files.get`, และ `agents.files.set` จัดการไฟล์พื้นที่ทำงาน bootstrap ที่เปิดเผยให้เอเจนต์
    - `artifacts.list`, `artifacts.get`, และ `artifacts.download` เปิดเผยสรุป artifact ที่ได้จาก transcript และการดาวน์โหลดสำหรับขอบเขต `sessionKey`, `runId`, หรือ `taskId` ที่ระบุอย่างชัดเจน การค้นหา run และ task จะแก้ไขเซสชันเจ้าของฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อ transcript ที่มี provenance ตรงกันเท่านั้น แหล่งที่มา URL ที่ไม่ปลอดภัยหรือเป็น local จะส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการดึงข้อมูลฝั่งเซิร์ฟเวอร์
    - `agent.identity.get` ส่งคืน identity ของผู้ช่วยที่มีผลใช้งานจริงสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้ run เสร็จสิ้น และส่งคืน snapshot สุดท้ายเมื่อมี

  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึงเมทาดาทา `agentRuntime` ต่อแถวเมื่อมีการกำหนดค่า backend runtime ของเอเจนต์
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับเหตุการณ์ transcript/ข้อความสำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนพรีวิว transcript แบบมีขอบเขตสำหรับคีย์เซสชันที่ระบุ
    - `sessions.describe` ส่งคืนแถวเซสชัน Gateway หนึ่งแถวสำหรับคีย์เซสชันที่ตรงกันแน่นอน
    - `sessions.resolve` แก้ไขหรือทำให้เป้าหมายเซสชันเป็น canonical
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าสู่เซสชันที่มีอยู่
    - `sessions.steer` คือรูปแบบ interrupt-and-steer สำหรับเซสชันที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่ไม่บังคับ หรือส่งเฉพาะ `runId` สำหรับ run ที่ใช้งานอยู่ซึ่ง Gateway สามารถแก้ไขเป็นเซสชันได้
    - `sessions.patch` อัปเดตเมทาดาทา/override ของเซสชัน และรายงานโมเดล canonical ที่แก้ไขแล้วพร้อม `agentRuntime` ที่มีผลใช้งานจริง
    - `sessions.reset`, `sessions.delete`, และ `sessions.compact` ดำเนินการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้ทั้งหมด
    - การประมวลผลแชทยังคงใช้ `chat.history`, `chat.send`, `chat.abort`, และ `chat.inject` `chat.history` ถูกปรับให้เป็นมาตรฐานสำหรับการแสดงผลในไคลเอนต์ UI: แท็ก directive แบบ inline จะถูกลบออกจากข้อความที่มองเห็น, payload XML การเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) และ token ควบคุมโมเดล ASCII/full-width ที่รั่วไหลจะถูกลบออก, แถวผู้ช่วยที่เป็น silent-token ล้วน เช่น `NO_REPLY` / `no_reply` แบบตรงตัวจะถูกละเว้น และแถวที่มีขนาดใหญ่เกินไปอาจถูกแทนที่ด้วย placeholder

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และ token อุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วซึ่งรอดำเนินการและได้รับอนุมัติ
    - `device.pair.approve`, `device.pair.reject`, และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียน token ของอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก
    - `device.token.revoke` เพิกถอน token ของอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่ Node การเรียกใช้ และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, และ `node.pair.verify` ครอบคลุมการจับคู่ node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` ส่งคืนสถานะ node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับ node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอ invoke
    - `node.event` นำเหตุการณ์ที่มาจาก node กลับเข้าสู่ Gateway
    - `node.canvas.capability.refresh` รีเฟรช token ความสามารถ canvas แบบจำกัดขอบเขต
    - `node.pending.pull` และ `node.pending.ack` คือ API คิวของ node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบคงทนสำหรับ node ที่ออฟไลน์/ตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="กลุ่มการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการ และส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการ snapshot นโยบายการอนุมัติ exec ของ Gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec ภายใน node ผ่านคำสั่ง relay ของ node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่ Plugin กำหนด

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ Skills และเครื่องมือ">
    - ระบบอัตโนมัติ: `wake` จัดกำหนดการการฉีดข้อความ wake ทันทีหรือใน Heartbeat ถัดไป; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่จัดกำหนดการไว้
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### กลุ่มเหตุการณ์ทั่วไป

- `chat`: การอัปเดตแชท UI เช่น `chat.inject` และเหตุการณ์แชทอื่น ๆ ที่มีเฉพาะ transcript
- `session.message` และ `session.tool`: การอัปเดต transcript/event-stream สำหรับเซสชันที่สมัครรับ
- `sessions.changed`: ดัชนีเซสชันหรือเมทาดาทาเปลี่ยนแปลง
- `presence`: การอัปเดต snapshot สถานะระบบ
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดต snapshot สุขภาพของ Gateway
- `heartbeat`: การอัปเดตสตรีมเหตุการณ์ Heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลง run/job ของ Cron
- `shutdown`: การแจ้งเตือนการปิด Gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ node
- `node.invoke.request`: การกระจายคำขอ invoke ของ node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตอุปกรณ์ที่จับคู่แล้ว
- `voicewake.changed`: การกำหนดค่าทริกเกอร์ wake-word เปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ Plugin

### เมธอดตัวช่วย Node

- Node อาจเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของ executable ของ skill สำหรับการตรวจสอบ auto-allow

### เมธอดตัวช่วย Operator

- ผู้ปฏิบัติงานสามารถเรียก `commands.list` (`operator.read`) เพื่อดึงรายการคำสั่งรันไทม์สำหรับเอเจนต์ได้
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - `scope` ควบคุมว่าส่วนติดต่อใดที่ `name` หลักจะกำหนดเป้าหมาย:
    - `text` ส่งคืนโทเค็นคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางเริ่มต้น `both` ส่งคืนชื่อแบบเนทีฟที่รับรู้ผู้ให้บริการ
      เมื่อมี
  - `textAliases` เก็บนามแฝงแบบสแลชที่ตรงกันทุกประการ เช่น `/model` และ `/m`
  - `nativeName` เก็บชื่อคำสั่งเนทีฟที่รับรู้ผู้ให้บริการเมื่อมีอยู่
  - `provider` เป็นตัวเลือกและมีผลเฉพาะต่อการตั้งชื่อแบบเนทีฟ รวมถึงความพร้อมใช้งานของคำสั่ง Plugin
    แบบเนทีฟ
  - `includeArgs=false` ละเว้นเมทาดาทาอาร์กิวเมนต์ที่ซีเรียลไลซ์แล้วจากการตอบกลับ
- ผู้ปฏิบัติงานสามารถเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือรันไทม์สำหรับ
  เอเจนต์ได้ การตอบกลับรวมเครื่องมือที่จัดกลุ่มและเมทาดาทาแหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ plugin เมื่อ `source="plugin"`
  - `optional`: ระบุว่าเครื่องมือ plugin เป็นตัวเลือกหรือไม่
- ผู้ปฏิบัติงานสามารถเรียก `tools.effective` (`operator.read`) เพื่อดึงรายการเครื่องมือที่มีผลในรันไทม์
  สำหรับเซสชันได้
  - ต้องระบุ `sessionKey`
  - gateway อนุมานบริบทรันไทม์ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนที่จะยอมรับ
    บริบทการยืนยันตัวตนหรือการส่งมอบที่ผู้เรียกส่งมา
  - การตอบกลับผูกกับเซสชันและสะท้อนสิ่งที่การสนทนาที่ใช้งานอยู่สามารถใช้ได้ในขณะนี้
    รวมถึงเครื่องมือหลัก, plugin และช่องทาง
- ผู้ปฏิบัติงานสามารถเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือหนึ่งรายการที่พร้อมใช้งานผ่าน
  เส้นทางนโยบาย gateway เดียวกับ `/tools/invoke`
  - ต้องระบุ `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ
    `idempotencyKey` เป็นตัวเลือก
  - หากมีทั้ง `sessionKey` และ `agentId` เอเจนต์ของเซสชันที่แก้ไขได้ต้องตรงกับ
    `agentId`
  - การตอบกลับเป็นเอนเวโลปสำหรับ SDK ที่มีฟิลด์ `ok`, `toolName`, `output` แบบตัวเลือก และ
    `error` แบบมีชนิด การอนุมัติหรือการปฏิเสธตามนโยบายจะคืน `ok:false` ในเพย์โหลด แทนที่จะ
    ข้ามไปป์ไลน์นโยบายเครื่องมือของ gateway
- ผู้ปฏิบัติงานสามารถเรียก `skills.status` (`operator.read`) เพื่อดึงรายการ skill ที่มองเห็นได้
  สำหรับเอเจนต์
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - การตอบกลับรวมความมีสิทธิ์ ข้อกำหนดที่ขาดหาย การตรวจสอบคอนฟิก และ
    ตัวเลือกการติดตั้งที่ทำให้ปลอดภัยแล้วโดยไม่เปิดเผยค่าความลับดิบ
- ผู้ปฏิบัติงานสามารถเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ
  เมทาดาทาการค้นพบ ClawHub
- ผู้ปฏิบัติงานสามารถเรียก `skills.install` (`operator.admin`) ได้ในสองโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้ง
    โฟลเดอร์ skill ลงในไดเรกทอรี `skills/` ของพื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    เรียกใช้แอ็กชัน `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ gateway
- ผู้ปฏิบัติงานสามารถเรียก `skills.update` (`operator.admin`) ได้ในสองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามหนึ่งรายการหรือการติดตั้ง ClawHub ทั้งหมดที่ติดตามอยู่ใน
    พื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมดคอนฟิกแพตช์ค่า `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` รับพารามิเตอร์ `view` แบบตัวเลือก:

- ละไว้หรือ `"default"`: พฤติกรรมรันไทม์ปัจจุบัน หากตั้งค่า `agents.defaults.models` ไว้ การตอบกลับคือแค็ตตาล็อกที่อนุญาต; มิฉะนั้น การตอบกลับคือแค็ตตาล็อก Gateway ทั้งหมด
- `"configured"`: พฤติกรรมขนาดพอดีกับตัวเลือก หากตั้งค่า `agents.defaults.models` ไว้ ค่านั้นยังคงมีผลเหนือกว่า มิฉะนั้น การตอบกลับใช้รายการ `models.providers.*.models` ที่ระบุชัดเจน และถอยกลับไปยังแค็ตตาล็อกทั้งหมดเฉพาะเมื่อไม่มีแถวโมเดลที่ตั้งค่าไว้
- `"all"`: แค็ตตาล็อก Gateway ทั้งหมด โดยข้าม `agents.defaults.models` ใช้สำหรับการวินิจฉัยและ UI สำหรับการค้นพบ ไม่ใช่ตัวเลือกโมเดลตามปกติ

## การอนุมัติ Exec

- เมื่อคำขอ exec ต้องการการอนุมัติ gateway จะกระจาย `exec.approval.requested`
- ไคลเอนต์ผู้ปฏิบัติงานแก้ไขโดยเรียก `exec.approval.resolve` (ต้องมีสโคป `operator.approvals`)
- สำหรับ `host=node` คำขอ `exec.approval.request` ต้องมี `systemRunPlan` (ข้อมูลมาตรฐาน `argv`/`cwd`/`rawCommand`/เมทาดาทาเซสชัน) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังอนุมัติ การเรียก `node.invoke system.run` ที่ส่งต่อจะนำ `systemRunPlan`
  มาตรฐานนั้นกลับมาใช้เป็นบริบทคำสั่ง/cwd/เซสชันที่มีอำนาจอ้างอิง
- หากผู้เรียกแก้ไข `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่างการเตรียมและการส่งต่อ `system.run` ที่อนุมัติขั้นสุดท้าย
  gateway จะปฏิเสธการรัน แทนที่จะเชื่อถือเพย์โหลดที่ถูกแก้ไข

## ทางเลือกสำรองการส่งมอบของเอเจนต์

- คำขอ `agent` สามารถรวม `deliver=true` เพื่อขอการส่งมอบขาออก
- `bestEffortDeliver=false` คงพฤติกรรมแบบเข้มงวด: เป้าหมายการส่งมอบที่แก้ไขไม่ได้หรือเป็นภายในเท่านั้นจะคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ถอยกลับไปใช้การดำเนินการเฉพาะเซสชันเมื่อไม่สามารถแก้ไขเส้นทางที่ส่งมอบภายนอกได้ (เช่น เซสชันภายใน/webchat หรือคอนฟิกหลายช่องทางที่กำกวม)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema/protocol-schemas.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธค่าที่ไม่ตรงกัน
- สคีมา + โมเดลถูกสร้างจากนิยาม TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

ไคลเอนต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าเหล่านี้
เสถียรใน protocol v3 และเป็นฐานที่คาดหวังสำหรับไคลเอนต์บุคคลที่สาม

| ค่าคงที่                                  | ค่าเริ่มต้น                                               | แหล่งที่มา                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| หมดเวลาคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| หมดเวลา Preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่มงบเวลาฝั่งเซิร์ฟเวอร์/ไคลเอนต์ที่จับคู่กันได้) |
| แบ็กออฟการเชื่อมต่อใหม่เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| แบ็กออฟการเชื่อมต่อใหม่สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| แคลมป์ลองซ้ำเร็วหลัง device-token ปิด | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ช่วงผ่อนผัน force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| หมดเวลาเริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| การปิดเมื่อ tick หมดเวลา                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศค่า `policy.tickIntervalMs`, `policy.maxPayload`,
และ `policy.maxBufferedBytes` ที่มีผลใน `hello-ok`; ไคลเอนต์ควรเคารพค่าเหล่านั้น
แทนค่าเริ่มต้นก่อนแฮนด์เชก

## การยืนยันตัวตน

- การยืนยันตัวตน Gateway ด้วย shared-secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` โดยขึ้นอยู่กับโหมดการยืนยันตัวตนที่กำหนดค่าไว้
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ `gateway.auth.mode: "trusted-proxy"`
  แบบ non-loopback จะผ่านการตรวจสอบการยืนยันตัวตนสำหรับ connect จาก
  ส่วนหัวของคำขอแทน `connect.params.auth.*`
- `gateway.auth.mode: "none"` สำหรับ private-ingress จะข้ามการยืนยันตัวตน
  connect แบบ shared-secret ทั้งหมด อย่าเปิดเผยโหมดนี้บน ingress สาธารณะหรือไม่น่าเชื่อถือ
- หลังจากจับคู่แล้ว Gateway จะออก **device token** ที่จำกัดตามบทบาทการเชื่อมต่อ
  + scopes โดยจะส่งกลับใน `hello-ok.auth.deviceToken` และไคลเอนต์ควร
  เก็บไว้ใช้สำหรับการเชื่อมต่อในอนาคต
- ไคลเอนต์ควรเก็บ `hello-ok.auth.deviceToken` หลักหลังจาก connect สำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วย device token ที่ **จัดเก็บไว้** ควรใช้ชุด scope ที่อนุมัติและจัดเก็บไว้
  สำหรับโทเคนนั้นซ้ำด้วย วิธีนี้จะรักษาสิทธิ์ read/probe/status ที่ได้รับอนุญาตแล้ว
  และหลีกเลี่ยงไม่ให้การเชื่อมต่อใหม่ถูกลดเหลือ scope แบบ implicit admin-only
  ที่แคบกว่าโดยเงียบ ๆ
- การประกอบการยืนยันตัวตน connect ฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากรายการอื่นและจะถูกส่งต่อเสมอเมื่อตั้งค่าไว้
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: shared token ที่ระบุชัดเจนก่อน
    จากนั้น `deviceToken` ที่ระบุชัดเจน แล้วจึงเป็น token ต่ออุปกรณ์ที่จัดเก็บไว้
    (ใช้คีย์จาก `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อรายการข้างต้นไม่สามารถระบุ
    `auth.token` ได้ shared token หรือ device token ใด ๆ ที่ระบุได้จะระงับการส่งค่านี้
  - การเลื่อนใช้ device token ที่จัดเก็บไว้โดยอัตโนมัติในการลองใหม่แบบครั้งเดียวเมื่อเกิด
    `AUTH_TOKEN_MISMATCH` จะถูกจำกัดไว้เฉพาะ **ปลายทางที่เชื่อถือได้เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบ pinned `wss://` สาธารณะ
    ที่ไม่มีการ pin จะไม่เข้าเกณฑ์
- รายการเพิ่มเติมใน `hello-ok.auth.deviceTokens` เป็น token สำหรับ bootstrap handoff
  ให้เก็บไว้เฉพาะเมื่อการ connect ใช้การยืนยันตัวตนแบบ bootstrap บน transport
  ที่เชื่อถือได้ เช่น `wss://` หรือการจับคู่แบบ loopback/local
- หากไคลเอนต์ส่ง `deviceToken` หรือ `scopes` แบบ **ระบุชัดเจน** ชุด scope ที่ผู้เรียกขอ
  จะยังเป็นแหล่งอ้างอิงหลัก ส่วน scopes ที่แคชไว้จะถูกใช้ซ้ำเฉพาะเมื่อไคลเอนต์
  ใช้ token ต่ออุปกรณ์ที่จัดเก็บไว้ซ้ำเท่านั้น
- device token สามารถหมุนเวียนหรือเพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องมี scope `operator.pairing`)
- `device.token.rotate` ส่งคืน metadata ของการหมุนเวียน โดยจะสะท้อน bearer token
  ตัวแทนกลับมาเฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ยืนยันตัวตนด้วย device token
  นั้นอยู่แล้ว เพื่อให้ไคลเอนต์ที่ใช้เฉพาะ token สามารถเก็บตัวแทนไว้ก่อนเชื่อมต่อใหม่
  การหมุนเวียนแบบ shared/admin จะไม่สะท้อน bearer token กลับมา
- การออก การหมุนเวียน และการเพิกถอน token จะถูกจำกัดอยู่ในชุดบทบาทที่อนุมัติ
  ซึ่งบันทึกไว้ในรายการ pairing ของอุปกรณ์นั้น การแก้ไข token ไม่สามารถขยายหรือ
  เล็งไปยังบทบาทของอุปกรณ์ที่การอนุมัติ pairing ไม่เคยอนุญาต
- สำหรับเซสชัน token ของอุปกรณ์ที่จับคู่แล้ว การจัดการอุปกรณ์จะถูกจำกัดเฉพาะตนเอง
  เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ admin สามารถลบ/เพิกถอน/หมุนเวียน
  ได้เฉพาะรายการอุปกรณ์ของ **ตนเอง** เท่านั้น
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุด scope ของ operator
  token เป้าหมายเทียบกับ scopes ของเซสชันปัจจุบันของผู้เรียก ผู้เรียกที่ไม่ใช่ admin
  ไม่สามารถหมุนเวียนหรือเพิกถอน operator token ที่กว้างกว่าที่ตนมีอยู่แล้วได้
- ความล้มเหลวในการยืนยันตัวตนจะมี `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลองใหม่แบบจำกัดหนึ่งครั้งด้วย token ต่ออุปกรณ์ที่แคชไว้
  - หากการลองใหม่นั้นล้มเหลว ไคลเอนต์ควรหยุดลูปการเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำการดำเนินการสำหรับ operator

## อัตลักษณ์อุปกรณ์ + การจับคู่

- Node ควรรวมอัตลักษณ์อุปกรณ์ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  fingerprint ของ keypair
- Gateway ออก token ต่ออุปกรณ์ + บทบาท
- ต้องมีการอนุมัติ pairing สำหรับ ID อุปกรณ์ใหม่ เว้นแต่เปิดใช้การอนุมัติอัตโนมัติแบบ local
- การอนุมัติ pairing อัตโนมัติยึดตามการ connect ผ่าน local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่แคบ
  สำหรับโฟลว์ตัวช่วย shared-secret ที่เชื่อถือได้
- การ connect ผ่าน tailnet หรือ LAN บนโฮสต์เดียวกันยังถือเป็นแบบ remote สำหรับ pairing
  และต้องได้รับการอนุมัติ
- โดยปกติไคลเอนต์ WS จะรวมอัตลักษณ์ `device` ระหว่าง `connect` (operator +
  node) ข้อยกเว้นสำหรับ operator ที่ไม่มีอุปกรณ์มีเฉพาะเส้นทาง trust ที่ระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP ที่ไม่ปลอดภัยแบบ localhost-only
  - การยืนยันตัวตน Control UI ของ operator ผ่าน `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass ลดระดับความปลอดภัยอย่างรุนแรง)
  - RPC ของ backend `gateway-client` ผ่าน direct-loopback ที่ยืนยันตัวตนด้วย
    gateway token/password แบบ shared
- การเชื่อมต่อทั้งหมดต้องลงนาม nonce `connect.challenge` ที่เซิร์ฟเวอร์ให้มา

### การวินิจฉัยการย้ายข้อมูลการยืนยันตัวตนอุปกรณ์

สำหรับไคลเอนต์ legacy ที่ยังใช้พฤติกรรมการลงนามก่อนมี challenge ตอนนี้ `connect` จะส่งคืน
รหัสรายละเอียด `DEVICE_AUTH_*` ใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวในการย้ายข้อมูลที่พบบ่อย:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ละเว้น `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่าหรือผิด             |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ลายเซ็นไม่ตรงกับ payload v2                |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอกค่า skew ที่อนุญาต        |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key   |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบหรือ canonicalization ของ public key ล้มเหลว |

เป้าหมายการย้ายข้อมูล:

- รอ `connect.challenge` เสมอ
- ลงนาม payload v2 ที่รวม server nonce
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload ลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` แบบ legacy ยังยอมรับเพื่อความเข้ากันได้ แต่การ pin metadata
  ของอุปกรณ์ที่จับคู่แล้วยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + การ pin

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์สามารถเลือก pin fingerprint ของใบรับรอง gateway ได้ (ดูการกำหนดค่า `gateway.tls`
  รวมถึง `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## Scope

โปรโตคอลนี้เปิดเผย **API ของ gateway แบบเต็ม** (สถานะ ช่องทาง โมเดล แชต
agent เซสชัน Node การอนุมัติ และอื่น ๆ) พื้นผิวที่แน่นอนถูกกำหนดโดย
TypeBox schemas ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [runbook ของ Gateway](/th/gateway)
