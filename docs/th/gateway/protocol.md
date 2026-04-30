---
read_when:
    - การนำไคลเอนต์ WS ของ Gateway ไปใช้หรืออัปเดต
    - การแก้ไขข้อบกพร่องเมื่อโปรโตคอลไม่ตรงกันหรือการเชื่อมต่อล้มเหลว
    - การสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การแฮนด์เชค, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-04-30T09:55:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol คือ **control plane เดียว + การขนส่งของ node** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, web UI, แอป macOS, node iOS/Android, node แบบ headless)
เชื่อมต่อผ่าน WebSocket และประกาศ **บทบาท** + **ขอบเขต** ของตน
ในช่วง handshake

## การขนส่ง

- WebSocket, text frames ที่มี payload เป็น JSON
- เฟรมแรก **ต้อง** เป็นคำขอ `connect`
- เฟรมก่อนเชื่อมต่อถูกจำกัดไว้ที่ 64 KiB หลังจาก handshake สำเร็จ ไคลเอนต์
  ควรทำตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้ diagnostics
  เฟรมขาเข้าที่มีขนาดเกินกำหนดและบัฟเฟอร์ขาออกที่ช้าจะปล่อยอีเวนต์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้งเฟรมที่ได้รับผลกระทบ อีเวนต์เหล่านี้เก็บ
  ขนาด ขีดจำกัด พื้นผิว และรหัสเหตุผลที่ปลอดภัย แต่ไม่เก็บเนื้อหาข้อความ
  เนื้อหาไฟล์แนบ เนื้อหาเฟรมดิบ token, cookie หรือค่าลับ

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

ขณะที่ Gateway ยังดำเนินการเริ่มต้น sidecar ให้เสร็จ คำขอ `connect` อาจ
ส่งคืนข้อผิดพลาด `UNAVAILABLE` ที่ลองใหม่ได้ โดยตั้ง `details.reason` เป็น
`"startup-sidecars"` และมี `retryAfterMs` ไคลเอนต์ควรลองใหม่สำหรับการตอบกลับนั้น
ภายในงบเวลาการเชื่อมต่อโดยรวม แทนที่จะแสดงเป็นความล้มเหลวของ handshake แบบสิ้นสุด

`server`, `features`, `snapshot` และ `policy` ล้วนจำเป็นตาม schema
(`src/gateway/protocol/schema/frames.ts`) `auth` ก็จำเป็นเช่นกัน และรายงาน
บทบาท/ขอบเขตที่เจรจาได้ `canvasHostUrl` เป็นทางเลือก

เมื่อไม่มีการออก device token, `hello-ok.auth` จะรายงานสิทธิ์อนุญาตที่เจรจาได้
โดยไม่มีฟิลด์ token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ไคลเอนต์ backend ในกระบวนการเดียวกันที่เชื่อถือได้ (`client.id: "gateway-client"`,
`client.mode: "backend"`) อาจละเว้น `device` ได้บนการเชื่อมต่อ loopback โดยตรงเมื่อ
ตรวจสอบสิทธิ์ด้วย token/password ของ gateway ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้
สำหรับ RPC ของ control-plane ภายใน และช่วยไม่ให้ baseline การจับคู่ CLI/device ที่เก่า
ขัดขวางงาน backend ภายในเครื่อง เช่น การอัปเดตเซสชัน subagent ไคลเอนต์ระยะไกล
ไคลเอนต์จาก browser origin ไคลเอนต์ node และไคลเอนต์ device-token/device-identity
แบบชัดเจนยังคงใช้การจับคู่และการตรวจสอบการยกระดับขอบเขตตามปกติ

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

ระหว่างการส่งต่อ bootstrap ที่เชื่อถือได้ `hello-ok.auth` อาจรวมรายการบทบาท
ที่มีขอบเขตจำกัดเพิ่มเติมใน `deviceTokens` ด้วย:

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

สำหรับโฟลว์ bootstrap ของ node/operator ในตัว token หลักของ node จะคง
`scopes: []` ไว้ และ token ของ operator ที่ถูกส่งต่อจะยังถูกจำกัดไว้กับ allowlist
ของ operator สำหรับ bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจสอบขอบเขตของ bootstrap ยังคง
อิงคำนำหน้าบทบาท: รายการ operator จะตอบสนองได้เฉพาะคำขอ operator เท่านั้น และ
บทบาทที่ไม่ใช่ operator ยังคงต้องมีขอบเขตภายใต้คำนำหน้าบทบาทของตนเอง

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

เมธอดที่ก่อให้เกิดผลข้างเคียงต้องใช้ **idempotency keys** (ดู schema)

## บทบาท + ขอบเขต

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

`talk.config` ที่มี `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)

เมธอด RPC ของ gateway ที่ลงทะเบียนโดย Plugin อาจร้องขอขอบเขต operator ของตนเอง
แต่คำนำหน้า admin หลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะ resolve เป็น `operator.admin` เสมอ

ขอบเขตของเมธอดเป็นเพียงด่านแรก คำสั่ง slash บางรายการที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจสอบระดับคำสั่งที่เข้มงวดกว่าเพิ่มเติม ตัวอย่างเช่น การเขียน
`/config set` และ `/config unset` แบบถาวรต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบขอบเขตเพิ่มเติม ณ เวลาการอนุมัติ นอกเหนือจาก
ขอบเขตพื้นฐานของเมธอด:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มีคำสั่ง node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่รวม `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### ความสามารถ/คำสั่ง/สิทธิ์อนุญาต (node)

Node ประกาศการอ้างสิทธิ์ความสามารถตอนเชื่อมต่อ:

- `caps`: หมวดหมู่ความสามารถระดับสูง
- `commands`: allowlist ของคำสั่งสำหรับ invoke
- `permissions`: ตัวสลับแบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ปฏิบัติต่อสิ่งเหล่านี้เป็น **การอ้างสิทธิ์** และบังคับใช้ allowlist ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` ส่งคืนรายการที่ใช้ device identity เป็นคีย์
- รายการ Presence มี `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงหนึ่งแถวต่ออุปกรณ์ได้
  แม้เมื่ออุปกรณ์เชื่อมต่อเป็นทั้ง **operator** และ **node**
- `node.list` มีฟิลด์ทางเลือก `lastSeenAtMs` และ `lastSeenReason` node ที่เชื่อมต่ออยู่จะรายงาน
  เวลาเชื่อมต่อปัจจุบันของตนเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; node ที่จับคู่แล้วสามารถรายงาน
  Presence เบื้องหลังแบบคงทนได้เช่นกันเมื่ออีเวนต์ node ที่เชื่อถือได้อัปเดต metadata การจับคู่ของตน

### อีเวนต์ Node background alive

Node อาจเรียก `node.event` พร้อม `event: "node.presence.alive"` เพื่อบันทึกว่า node ที่จับคู่แล้ว
ยังมีชีวิตอยู่ระหว่างการปลุกเบื้องหลัง โดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น enum แบบปิด: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` สตริง trigger ที่ไม่รู้จักจะถูก normalize เป็น
`background` โดย gateway ก่อนบันทึกถาวร อีเวนต์จะคงทนเฉพาะสำหรับเซสชันอุปกรณ์ node
ที่ตรวจสอบสิทธิ์แล้วเท่านั้น; เซสชันที่ไม่มีอุปกรณ์หรือไม่ได้จับคู่จะส่งคืน `handled: false`

Gateway ที่สำเร็จจะส่งคืนผลลัพธ์แบบมีโครงสร้าง:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway รุ่นเก่าอาจยังส่งคืน `{ "ok": true }` สำหรับ `node.event`; ไคลเอนต์ควรมองว่านั่นเป็น
RPC ที่ได้รับการยืนยันแล้ว ไม่ใช่การบันทึก Presence แบบคงทน

## การกำหนดขอบเขตอีเวนต์ broadcast

อีเวนต์ broadcast ผ่าน WebSocket ที่ server push จะถูก gate ด้วยขอบเขต เพื่อไม่ให้เซสชันที่มีขอบเขตเฉพาะการจับคู่หรือเฉพาะ node ได้รับเนื้อหาเซสชันแบบ passive

- **เฟรม chat, agent และผลลัพธ์เครื่องมือ** (รวมถึงอีเวนต์ `agent` แบบสตรีมและผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcast `plugin.*` ที่ Plugin กำหนด** ถูก gate ไปที่ `operator.write` หรือ `operator.admin` ขึ้นอยู่กับวิธีที่ Plugin ลงทะเบียนไว้
- **อีเวนต์สถานะและการขนส่ง** (`heartbeat`, `presence`, `tick`, วงจรชีวิต connect/disconnect เป็นต้น) ยังคงไม่ถูกจำกัด เพื่อให้ทุกเซสชันที่ตรวจสอบสิทธิ์แล้วสังเกตสถานะการขนส่งได้
- **ตระกูลอีเวนต์ broadcast ที่ไม่รู้จัก** จะถูก gate ด้วยขอบเขตโดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนคลายอย่างชัดเจน

การเชื่อมต่อของไคลเอนต์แต่ละรายการจะเก็บหมายเลขลำดับต่อไคลเอนต์ของตนเอง เพื่อให้ broadcast รักษาการเรียงลำดับแบบเพิ่มขึ้นต่อเนื่องบน socket นั้น แม้ว่าไคลเอนต์ต่าง ๆ จะเห็นชุดย่อยที่ถูกกรองตามขอบเขตของ event stream แตกต่างกัน

## กลุ่มเมธอด RPC ทั่วไป

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ด้านบน นี่
ไม่ใช่ dump ที่สร้างขึ้น — `hello-ok.features.methods` เป็นรายการ discovery
แบบอนุรักษนิยมที่สร้างจาก `src/gateway/server-methods-list.ts` รวมกับ export เมธอด
ของ plugin/channel ที่โหลดไว้ ให้ถือว่าเป็น feature discovery ไม่ใช่การแจกแจงทั้งหมดของ
`src/gateway/server-methods/*.ts`

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` ส่งคืน snapshot สุขภาพของ gateway ที่ cache ไว้หรือ probe ใหม่
    - `diagnostics.stability` ส่งคืนตัวบันทึกเสถียรภาพ diagnostics แบบจำกัดล่าสุด โดยเก็บ metadata เชิงปฏิบัติการ เช่น ชื่ออีเวนต์ จำนวน ขนาด byte ค่าการอ่าน memory สถานะ queue/session ชื่อ channel/plugin และ session id แต่ไม่เก็บข้อความ chat, webhook body, ผลลัพธ์เครื่องมือ, เนื้อหาคำขอหรือการตอบกลับดิบ, token, cookie หรือค่าลับ ต้องมีขอบเขต operator read
    - `status` ส่งคืนสรุป gateway แบบ `/status`; ฟิลด์ที่ละเอียดอ่อนจะรวมเฉพาะสำหรับไคลเอนต์ operator ที่มีขอบเขต admin
    - `gateway.identity.get` ส่งคืน device identity ของ gateway ที่ใช้โดยโฟลว์ relay และการจับคู่
    - `system-presence` ส่งคืน snapshot Presence ปัจจุบันสำหรับอุปกรณ์ operator/node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่มอีเวนต์ระบบและสามารถอัปเดต/broadcast บริบท Presence ได้
    - `last-heartbeat` ส่งคืนอีเวนต์ Heartbeat ล่าสุดที่บันทึกถาวรไว้
    - `set-heartbeats` เปิดหรือปิดการประมวลผล Heartbeat บน gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแคตตาล็อกโมเดลที่ runtime อนุญาตให้ใช้ได้ ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าไว้ในขนาดที่เหมาะกับตัวเลือก (`agents.defaults.models` ก่อน แล้วจึง `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแคตตาล็อกเต็ม
    - `usage.status` ส่งคืนหน้าต่างการใช้งานของผู้ให้บริการ/สรุปโควตาที่เหลือ
    - `usage.cost` ส่งคืนสรุปการใช้งานค่าใช้จ่ายแบบรวมสำหรับช่วงวันที่
    - `doctor.memory.status` ส่งคืนความพร้อมของ vector-memory / cached embedding สำหรับ workspace ของ agent ค่าเริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจนเท่านั้น
    - `doctor.memory.remHarness` ส่งคืนตัวอย่าง REM harness แบบอ่านอย่างเดียวที่มีขอบเขตจำกัดสำหรับไคลเอนต์ control-plane ระยะไกล ซึ่งอาจรวม path ของ workspace, ส่วนย่อยของ memory, markdown ที่เรนเดอร์พร้อมหลักฐานอ้างอิง และตัวเลือกสำหรับ deep promotion ดังนั้นผู้เรียกต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานราย session
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบ timeseries สำหรับหนึ่ง session
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่ง session

  </Accordion>

  <Accordion title="Channel และตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะของ channel/plugin ที่มากับระบบ + ที่ bundled มา
    - `channels.logout` ออกจากระบบของ channel/account ที่ระบุเมื่อ channel นั้นรองรับการออกจากระบบ
    - `web.login.start` เริ่ม flow การเข้าสู่ระบบด้วย QR/web สำหรับผู้ให้บริการ web channel ปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้ flow การเข้าสู่ระบบด้วย QR/web นั้นเสร็จสิ้น และเริ่ม channel เมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง iOS node ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืน wake-word trigger ที่เก็บไว้
    - `voicewake.set` อัปเดต wake-word trigger และ broadcast การเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การส่งข้อความและบันทึก">
    - `send` คือ RPC สำหรับการส่งออกโดยตรงแบบระบุ channel/account/thread นอก chat runner
    - `logs.tail` ส่งคืน tail ของ file-log ของ Gateway ที่กำหนดค่าไว้ พร้อมตัวควบคุม cursor/limit และ max-byte

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.config` ส่งคืน payload การกำหนดค่า Talk ที่มีผลจริง; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.mode` ตั้งค่า/broadcast สถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะเปิดใช้งาน TTS, ผู้ให้บริการที่ใช้งานอยู่, ผู้ให้บริการ fallback และสถานะการกำหนดค่าผู้ให้บริการ
    - `tts.providers` ส่งคืนรายการผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะการตั้งค่า TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงพูดแบบครั้งเดียว

  </Accordion>

  <Accordion title="Secret, การกำหนดค่า, การอัปเดต และ wizard">
    - `secrets.reload` resolve `SecretRefs` ที่ใช้งานอยู่ใหม่ และสลับสถานะ secret ของ runtime เฉพาะเมื่อสำเร็จครบถ้วนเท่านั้น
    - `secrets.resolve` resolve การกำหนด secret ของ command-target สำหรับชุด command/target ที่ระบุ
    - `config.get` ส่งคืน snapshot และ hash ของการกำหนดค่าปัจจุบัน
    - `config.set` เขียน payload การกำหนดค่าที่ผ่านการตรวจสอบแล้ว
    - `config.patch` merge การอัปเดตการกำหนดค่าบางส่วน
    - `config.apply` ตรวจสอบ + แทนที่ payload การกำหนดค่าทั้งหมด
    - `config.schema` ส่งคืน payload schema การกำหนดค่าแบบ live ที่ Control UI และเครื่องมือ CLI ใช้: schema, `uiHints`, version และ metadata การสร้าง รวมถึง metadata ของ schema สำหรับ plugin + channel เมื่อ runtime โหลดได้ schema รวม metadata ของฟิลด์ `title` / `description` ที่ได้มาจาก label และข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึง object ซ้อน, wildcard, array-item และ branch ของ composition `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืน payload lookup ที่จำกัดตาม path สำหรับ path การกำหนดค่าหนึ่งรายการ: path ที่ normalize แล้ว, node ของ schema แบบตื้น, hint ที่ตรงกัน + `hintPath` และสรุปลูกชั้นถัดไปสำหรับการ drill-down ของ UI/CLI node ของ lookup schema จะเก็บเอกสารที่แสดงต่อผู้ใช้และฟิลด์ validation ทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขตของตัวเลข/string/array/object และ flag เช่น `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกจะแสดง `key`, `path` ที่ normalize แล้ว, `type`, `required`, `hasChildren` รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รัน flow การอัปเดต Gateway และกำหนดเวลา restart เฉพาะเมื่อการอัปเดตสำเร็จเอง
    - `update.status` ส่งคืน sentinel การ restart จากการอัปเดตที่ cache ล่าสุด รวมถึง version ที่กำลังรันหลัง restart เมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผย onboarding wizard ผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วย agent และ workspace">
    - `agents.list` ส่งคืนรายการ agent ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลจริงและ metadata ของ runtime
    - `agents.create`, `agents.update` และ `agents.delete` จัดการ record ของ agent และการเชื่อมต่อ workspace
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการไฟล์ bootstrap workspace ที่เปิดเผยสำหรับ agent
    - `agent.identity.get` ส่งคืนตัวตน assistant ที่มีผลจริงสำหรับ agent หรือ session
    - `agent.wait` รอให้การรันเสร็จสิ้นและส่งคืน snapshot สุดท้ายเมื่อมี

  </Accordion>

  <Accordion title="การควบคุม session">
    - `sessions.list` ส่งคืนดัชนี session ปัจจุบัน รวมถึง metadata `agentRuntime` รายแถวเมื่อกำหนดค่า backend ของ runtime agent ไว้
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับ event การเปลี่ยนแปลง session สำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับ event transcript/message สำหรับหนึ่ง session
    - `sessions.preview` ส่งคืนตัวอย่าง transcript ที่มีขอบเขตจำกัดสำหรับ key ของ session ที่ระบุ
    - `sessions.resolve` resolve หรือ canonicalize target ของ session
    - `sessions.create` สร้างรายการ session ใหม่
    - `sessions.send` ส่งข้อความเข้าไปใน session ที่มีอยู่
    - `sessions.steer` คือ variant แบบ interrupt-and-steer สำหรับ session ที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่กำลังทำงานสำหรับ session ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่เป็นตัวเลือก หรือส่งเฉพาะ `runId` สำหรับการรันที่ใช้งานอยู่ซึ่ง Gateway สามารถ resolve เป็น session ได้
    - `sessions.patch` อัปเดต metadata/override ของ session และรายงานโมเดล canonical ที่ resolve แล้ว พร้อม `agentRuntime` ที่มีผลจริง
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ดำเนินการบำรุงรักษา session
    - `sessions.get` ส่งคืนแถว session ที่เก็บไว้ทั้งหมด
    - การดำเนินการ chat ยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` `chat.history` ถูก normalize สำหรับการแสดงผลให้ไคลเอนต์ UI: tag คำสั่ง inline จะถูกตัดออกจากข้อความที่มองเห็นได้, payload XML ของ tool-call แบบ plain-text (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และ block ของ tool-call ที่ถูกตัดทอน) และ token ควบคุมโมเดล ASCII/full-width ที่หลุดออกมาจะถูกตัดออก, แถว assistant ที่เป็น silent-token ล้วน เช่น `NO_REPLY` / `no_reply` แบบตรงตัวจะถูกละไว้ และแถวที่ใหญ่เกินไปสามารถถูกแทนที่ด้วย placeholder

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และ token ของอุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วซึ่งรอดำเนินการและได้รับอนุมัติ
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการ record การจับคู่อุปกรณ์
    - `device.token.rotate` rotate token ของอุปกรณ์ที่จับคู่แล้วภายในขอบเขต role ที่อนุมัติและขอบเขตผู้เรียก
    - `device.token.revoke` revoke token ของอุปกรณ์ที่จับคู่แล้วภายในขอบเขต role ที่อนุมัติและขอบเขตผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่ Node, invoke และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` และ `node.pair.verify` ครอบคลุมการจับคู่ node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` ส่งคืนสถานะ node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดต label ของ node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อ command ไปยัง node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอ invoke
    - `node.event` ส่ง event ที่มาจาก node กลับเข้าสู่ gateway
    - `node.canvas.capability.refresh` refresh token ของ canvas-capability ที่จำกัด scope
    - `node.pending.pull` และ `node.pending.ack` คือ API queue ของ node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบ durable สำหรับ node ที่ offline/ตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="กลุ่ม approval">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขอ approval สำหรับ exec แบบครั้งเดียว รวมถึงการ lookup/replay approval ที่รอดำเนินการ
    - `exec.approval.waitDecision` รอ approval สำหรับ exec ที่รอดำเนินการหนึ่งรายการ และส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อ timeout)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการ snapshot นโยบาย approval สำหรับ exec ของ Gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบาย approval สำหรับ exec ที่เป็น node-local ผ่าน command relay ของ node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุม flow approval ที่ Plugin กำหนด

  </Accordion>

  <Accordion title="Automation, Skills และเครื่องมือ">
    - Automation: `wake` กำหนดเวลาการฉีดข้อความ wake ทันทีหรือใน Heartbeat ถัดไป; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่กำหนดเวลาไว้
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### กลุ่ม event ทั่วไป

- `chat`: การอัปเดต chat ของ UI เช่น `chat.inject` และ event chat อื่นที่เป็น transcript เท่านั้น
- `session.message` และ `session.tool`: การอัปเดต transcript/event-stream สำหรับ session ที่สมัครรับไว้
- `sessions.changed`: ดัชนี session หรือ metadata เปลี่ยนแปลง
- `presence`: การอัปเดต snapshot ของ presence ระบบ
- `tick`: event keepalive / liveness เป็นระยะ
- `health`: การอัปเดต snapshot health ของ gateway
- `heartbeat`: การอัปเดต event stream ของ Heartbeat
- `cron`: event การเปลี่ยนแปลง run/job ของ Cron
- `shutdown`: การแจ้งเตือนการปิด gateway
- `node.pair.requested` / `node.pair.resolved`: lifecycle การจับคู่ node
- `node.invoke.request`: การ broadcast คำขอ invoke ของ node
- `device.pair.requested` / `device.pair.resolved`: lifecycle ของอุปกรณ์ที่จับคู่แล้ว
- `voicewake.changed`: การกำหนดค่า wake-word trigger เปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: lifecycle approval สำหรับ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: lifecycle approval สำหรับ plugin

### เมธอดตัวช่วยของ Node

- Node อาจเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของ executable ของ skill สำหรับการตรวจสอบ auto-allow

### เมธอดตัวช่วยของ operator

- ผู้ปฏิบัติการสามารถเรียก `commands.list` (`operator.read`) เพื่อดึงคลังคำสั่ง runtime สำหรับเอเจนต์ได้
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่าน workspace ของเอเจนต์เริ่มต้น
  - `scope` ควบคุมว่า primary `name` จะชี้ไปที่พื้นผิวใด:
    - `text` ส่งคืนโทเค็นคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางเริ่มต้น `both` ส่งคืนชื่อ native ที่รับรู้ provider
      เมื่อมีให้ใช้งาน
  - `textAliases` มี alias แบบ slash ที่ตรงตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่ง native ที่รับรู้ provider เมื่อมีอยู่
  - `provider` เป็นตัวเลือกและมีผลเฉพาะกับการตั้งชื่อ native รวมถึงความพร้อมใช้งานของคำสั่ง Plugin แบบ native
  - `includeArgs=false` ละ metadata ของอาร์กิวเมนต์แบบ serialized ออกจาก response
- ผู้ปฏิบัติการสามารถเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือ runtime สำหรับเอเจนต์ได้ response มีเครื่องมือที่จัดกลุ่มและ metadata แหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: ระบุว่าเครื่องมือของ Plugin เป็นตัวเลือกหรือไม่
- ผู้ปฏิบัติการสามารถเรียก `tools.effective` (`operator.read`) เพื่อดึงคลังเครื่องมือที่มีผลใน runtime สำหรับเซสชันได้
  - ต้องมี `sessionKey`
  - Gateway อนุมานบริบท runtime ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนการรับบริบท auth หรือ delivery ที่ผู้เรียกส่งมา
  - response ถูกจำกัดขอบเขตตามเซสชันและสะท้อนสิ่งที่บทสนทนาที่ใช้งานอยู่สามารถใช้ได้ในขณะนี้ รวมถึงเครื่องมือ core, Plugin และ channel
- ผู้ปฏิบัติการสามารถเรียก `skills.status` (`operator.read`) เพื่อดึงคลัง skill ที่มองเห็นได้สำหรับเอเจนต์ได้
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่าน workspace ของเอเจนต์เริ่มต้น
  - response มี eligibility, requirements ที่ขาด, การตรวจ config และตัวเลือกการติดตั้งที่ผ่านการ sanitize โดยไม่เปิดเผยค่าความลับดิบ
- ผู้ปฏิบัติการสามารถเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ metadata การค้นพบ ClawHub ได้
- ผู้ปฏิบัติการสามารถเรียก `skills.install` (`operator.admin`) ได้ในสองโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้งโฟลเดอร์ skill ลงในไดเรกทอรี `skills/` ของ workspace เอเจนต์เริ่มต้น
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    เรียกใช้ action `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ Gateway
- ผู้ปฏิบัติการสามารถเรียก `skills.update` (`operator.admin`) ได้ในสองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามอยู่หนึ่งรายการหรือการติดตั้ง ClawHub ที่ติดตามอยู่ทั้งหมดใน workspace เอเจนต์เริ่มต้น
  - โหมด Config patch ค่า `skills.entries.<skillKey>` เช่น `enabled`, `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` รับพารามิเตอร์ `view` แบบตัวเลือก:

- ละไว้หรือ `"default"`: พฤติกรรม runtime ปัจจุบัน หากกำหนดค่า `agents.defaults.models` ไว้ response จะเป็นแค็ตตาล็อกที่อนุญาต; มิฉะนั้น response จะเป็นแค็ตตาล็อก Gateway ทั้งหมด
- `"configured"`: พฤติกรรมขนาดพอดีกับตัวเลือก หากกำหนดค่า `agents.defaults.models` ไว้ ค่านั้นยังคงมีผลก่อน มิฉะนั้น response จะใช้รายการ `models.providers.*.models` ที่ระบุไว้ชัดเจน โดย fallback ไปยังแค็ตตาล็อกทั้งหมดเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แค็ตตาล็อก Gateway ทั้งหมด โดยข้าม `agents.defaults.models` ใช้สำหรับ diagnostics และ UI การค้นพบ ไม่ใช่ตัวเลือกโมเดลตามปกติ

## การอนุมัติ Exec

- เมื่อคำขอ exec ต้องการการอนุมัติ Gateway จะ broadcast `exec.approval.requested`
- client ฝั่งผู้ปฏิบัติการ resolve โดยเรียก `exec.approval.resolve` (ต้องมี scope `operator.approvals`)
- สำหรับ `host=node`, `exec.approval.request` ต้องมี `systemRunPlan` (`argv`/`cwd`/`rawCommand`/metadata เซสชันแบบ canonical) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังการอนุมัติ การเรียก `node.invoke system.run` ที่ forward แล้วจะใช้ `systemRunPlan` แบบ canonical นั้นซ้ำเป็นบริบท command/cwd/session ที่ถือเป็นแหล่งจริง
- หากผู้เรียก mutate `command`, `rawCommand`, `cwd`, `agentId` หรือ `sessionKey` ระหว่าง prepare กับการ forward `system.run` ที่ได้รับอนุมัติสุดท้าย Gateway จะปฏิเสธการรันแทนที่จะเชื่อ payload ที่ถูก mutate

## Fallback การส่งมอบของเอเจนต์

- คำขอ `agent` สามารถมี `deliver=true` เพื่อขอ outbound delivery
- `bestEffortDeliver=false` คงพฤติกรรมแบบเข้มงวด: เป้าหมาย delivery ที่ resolve ไม่ได้หรือเป็น internal-only จะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback เป็นการดำเนินการเฉพาะเซสชันเมื่อไม่สามารถ resolve route ที่ส่งออกภายนอกได้ (เช่น เซสชัน internal/webchat หรือ config หลาย channel ที่กำกวม)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema/protocol-schemas.ts`
- client ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธรายการที่ไม่ตรงกัน
- schema + model สร้างจากคำจำกัดความ TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของ client

client อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าต่าง ๆ มีความเสถียรใน protocol v3 และเป็น baseline ที่คาดหวังสำหรับ client ภายนอก

| ค่าคงที่                                  | ค่าเริ่มต้น                                             | แหล่งที่มา                                                                                 |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| timeout ของคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| timeout ของ Preauth / connect-challenge   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่ม budget เซิร์ฟเวอร์/client ที่จับคู่กันได้) |
| backoff การ reconnect เริ่มต้น            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| backoff การ reconnect สูงสุด              | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp fast-retry หลัง device-token close  | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| grace ของ force-stop ก่อน `terminate()`   | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| timeout เริ่มต้นของ `stopAndWait()`       | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)      | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| tick-timeout close                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2`   | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศ `policy.tickIntervalMs`, `policy.maxPayload` และ `policy.maxBufferedBytes` ที่มีผลจริงใน `hello-ok`; client ควรปฏิบัติตามค่าเหล่านั้นแทนค่าเริ่มต้นก่อน handshake

## Auth

- shared-secret gateway auth ใช้ `connect.params.auth.token` หรือ `connect.params.auth.password` ขึ้นอยู่กับโหมด auth ที่กำหนดค่าไว้
- โหมดที่มี identity เช่น Tailscale Serve (`gateway.auth.allowTailscale: true`) หรือ `gateway.auth.mode: "trusted-proxy"` ที่ไม่ใช่ loopback จะผ่านการตรวจ connect auth จาก header ของคำขอแทน `connect.params.auth.*`
- `gateway.auth.mode: "none"` สำหรับ private-ingress จะข้าม shared-secret connect auth ทั้งหมด; อย่าเปิดเผยโหมดนี้บน ingress สาธารณะ/ไม่น่าเชื่อถือ
- หลัง pairing แล้ว Gateway จะออก **device token** ที่จำกัดขอบเขตตาม role + scopes ของการเชื่อมต่อ โดยส่งคืนใน `hello-ok.auth.deviceToken` และ client ควร persist ไว้สำหรับการเชื่อมต่อในอนาคต
- client ควร persist `hello-ok.auth.deviceToken` หลักหลังการ connect ที่สำเร็จทุกครั้ง
- การ reconnect ด้วย device token ที่ **จัดเก็บไว้** นั้นควรใช้ชุด scope ที่อนุมัติและจัดเก็บไว้สำหรับ token นั้นซ้ำด้วย สิ่งนี้รักษาสิทธิ์ read/probe/status ที่ได้รับไปแล้ว และหลีกเลี่ยงการทำให้ reconnect แคบลงเหลือ scope admin-only โดยปริยายอย่างเงียบ ๆ
- การประกอบ connect auth ฝั่ง client (`selectConnectAuth` ใน `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากกันและจะถูก forward เสมอเมื่อมีการตั้งค่า
  - `auth.token` ถูกเติมตามลำดับความสำคัญ: shared token ที่ระบุชัดเจนก่อน จากนั้น `deviceToken` ที่ระบุชัดเจน แล้วจึงเป็น token ต่อ device ที่จัดเก็บไว้ (keyed ด้วย `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อข้างต้นไม่มีรายการใด resolve เป็น `auth.token` ได้ shared token หรือ device token ใด ๆ ที่ resolve ได้จะ suppress ค่านี้
  - การ auto-promotion ของ device token ที่จัดเก็บไว้ในการ retry แบบ one-shot สำหรับ `AUTH_TOKEN_MISMATCH` ถูก gate ไว้เฉพาะ **endpoint ที่เชื่อถือได้เท่านั้น** ได้แก่ loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบ pinned `wss://` สาธารณะที่ไม่มีการ pin ไม่เข้าเงื่อนไข
- รายการ `hello-ok.auth.deviceTokens` เพิ่มเติมเป็น token สำหรับ bootstrap handoff ให้ persist เฉพาะเมื่อการ connect ใช้ bootstrap auth บน transport ที่เชื่อถือได้ เช่น `wss://` หรือ loopback/local pairing
- หาก client ส่ง `deviceToken` หรือ `scopes` แบบ **ชัดเจน** ชุด scope ที่ผู้เรียกขอจะยังคงเป็น authoritative; cached scopes จะถูกใช้ซ้ำเฉพาะเมื่อ client ใช้ token ต่อ device ที่จัดเก็บไว้ซ้ำเท่านั้น
- device token สามารถ rotate/revoke ได้ผ่าน `device.token.rotate` และ `device.token.revoke` (ต้องมี scope `operator.pairing`)
- `device.token.rotate` ส่งคืน metadata ของ rotation โดย echo bearer token ทดแทนเฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ authenticate ด้วย device token นั้นอยู่แล้ว เพื่อให้ client แบบ token-only สามารถ persist ตัวทดแทนก่อน reconnect ได้ การ rotate แบบ shared/admin จะไม่ echo bearer token
- การออก token, rotation และ revocation จะยังคงถูกจำกัดอยู่ในชุด role ที่อนุมัติซึ่งบันทึกไว้ในรายการ pairing ของอุปกรณ์นั้น; การ mutate token ไม่สามารถขยายหรือกำหนดเป้าหมายไปยัง role ของอุปกรณ์ที่การอนุมัติ pairing ไม่เคยให้สิทธิ์ไว้ได้
- สำหรับเซสชัน token ของ paired-device การจัดการอุปกรณ์จะเป็น self-scoped เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ admin สามารถ remove/revoke/rotate ได้เฉพาะรายการอุปกรณ์ **ของตนเอง** เท่านั้น
- `device.token.rotate` และ `device.token.revoke` ตรวจสอบชุด scope ของ operator token เป้าหมายกับ scope เซสชันปัจจุบันของผู้เรียกด้วย ผู้เรียกที่ไม่ใช่ admin ไม่สามารถ rotate หรือ revoke operator token ที่กว้างกว่าที่ตนถืออยู่แล้วได้
- ความล้มเหลวของ Auth มี `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรม client สำหรับ `AUTH_TOKEN_MISMATCH`:
  - client ที่เชื่อถือได้อาจลอง retry แบบมีขอบเขตหนึ่งครั้งด้วย token ต่อ device ที่ cached ไว้
  - หาก retry นั้นล้มเหลว client ควรหยุด loop การ reconnect อัตโนมัติและแสดงคำแนะนำการดำเนินการสำหรับผู้ปฏิบัติการ

## identity ของอุปกรณ์ + pairing

- Node ควรมีข้อมูลระบุตัวตนอุปกรณ์ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  ลายนิ้วมือของ keypair
- Gateway ออกโทเค็นต่ออุปกรณ์ + บทบาท
- ต้องมีการอนุมัติการจับคู่สำหรับ ID อุปกรณ์ใหม่ เว้นแต่จะเปิดใช้การอนุมัติอัตโนมัติภายในเครื่อง
- การอนุมัติอัตโนมัติสำหรับการจับคู่มีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบแคบภายใน backend/container-local สำหรับ
  โฟลว์ตัวช่วย shared-secret ที่เชื่อถือได้
- การเชื่อมต่อ tailnet หรือ LAN บนโฮสต์เดียวกันยังคงถูกปฏิบัติเป็นการเชื่อมต่อระยะไกลสำหรับการจับคู่ และ
  ต้องมีการอนุมัติ
- โดยปกติไคลเอนต์ WS จะรวมข้อมูลระบุตัวตน `device` ระหว่าง `connect` (operator +
  node) ข้อยกเว้นของ operator ที่ไม่มีอุปกรณ์มีเฉพาะเส้นทางความเชื่อถือที่ระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP ที่ไม่ปลอดภัยเฉพาะ localhost
  - การยืนยันตัวตน Control UI ของ operator ด้วย `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
  - RPC ของ backend `gateway-client` ผ่าน direct-loopback ที่ยืนยันตัวตนด้วย
    โทเค็น/รหัสผ่าน Gateway แบบ shared
- ทุกการเชื่อมต่อต้องลงนาม nonce `connect.challenge` ที่เซิร์ฟเวอร์ให้มา

### การวินิจฉัยการย้ายข้อมูลการยืนยันตัวตนอุปกรณ์

สำหรับไคลเอนต์รุ่นเก่าที่ยังใช้พฤติกรรมการลงนามแบบก่อนมี challenge ตอนนี้ `connect` จะส่งคืน
รหัสรายละเอียด `DEVICE_AUTH_*` ภายใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวที่พบบ่อยในการย้ายข้อมูล:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ละเว้น `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่าหรือผิด            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | เพย์โหลดลายเซ็นไม่ตรงกับเพย์โหลด v2       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอกช่วง skew ที่อนุญาต          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับลายนิ้วมือของกุญแจสาธารณะ |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/การ canonicalization ของกุญแจสาธารณะล้มเหลว         |

เป้าหมายการย้ายข้อมูล:

- รอ `connect.challenge` เสมอ
- ลงนามเพย์โหลด v2 ที่มี nonce ของเซิร์ฟเวอร์
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- เพย์โหลดลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` รุ่นเก่ายังได้รับการยอมรับเพื่อความเข้ากันได้ แต่
  การ pin metadata ของอุปกรณ์ที่จับคู่แล้วยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + การ pin

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์อาจเลือก pin ลายนิ้วมือใบรับรองของ Gateway ได้ (ดูคอนฟิก `gateway.tls`
  รวมถึง `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **API ของ Gateway แบบเต็ม** (สถานะ, ช่องทาง, โมเดล, แชต,
agent, เซสชัน, node, การอนุมัติ ฯลฯ) พื้นผิวที่แน่นอนถูกกำหนดโดย
สคีมา TypeBox ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [Runbook ของ Gateway](/th/gateway)
