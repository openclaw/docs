---
read_when:
    - การใช้งานหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - การสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: แฮนด์เชก, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-05-03T10:12:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

โปรโตคอล WS ของ Gateway คือ **ระนาบควบคุมเดียว + การขนส่งของ Node** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, UI เว็บ, แอป macOS, โหนด iOS/Android, โหนดแบบไม่มีส่วนติดต่อ)
เชื่อมต่อผ่าน WebSocket และประกาศ **บทบาท** + **ขอบเขต** ของตนในช่วง
handshake

## การขนส่ง

- WebSocket, text frame ที่มี payload เป็น JSON
- frame แรก **ต้อง** เป็นคำขอ `connect`
- frame ก่อนเชื่อมต่อถูกจำกัดที่ 64 KiB หลัง handshake สำเร็จ ไคลเอนต์
  ควรทำตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้ diagnostics
  frame ขาเข้าที่มีขนาดเกินกำหนดและบัฟเฟอร์ขาออกที่ช้าจะปล่อยอีเวนต์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้ง frame ที่ได้รับผลกระทบ อีเวนต์เหล่านี้เก็บ
  ขนาด ขีดจำกัด พื้นผิว และรหัสเหตุผลที่ปลอดภัย ไม่เก็บเนื้อความของข้อความ
  เนื้อหา attachment, raw frame body, token, cookie หรือค่าความลับ

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

ระหว่างที่ Gateway ยังเริ่ม sidecar ตอนเริ่มต้นให้เสร็จอยู่ คำขอ `connect` อาจ
ส่งคืนข้อผิดพลาด `UNAVAILABLE` ที่ลองใหม่ได้ โดยตั้งค่า `details.reason` เป็น
`"startup-sidecars"` และมี `retryAfterMs` ไคลเอนต์ควรลองคำตอบนั้นใหม่
ภายในงบเวลาการเชื่อมต่อโดยรวม แทนที่จะแสดงเป็นความล้มเหลวขั้นสุดท้ายของ
handshake

`server`, `features`, `snapshot` และ `policy` ล้วนจำเป็นตาม schema
(`src/gateway/protocol/schema/frames.ts`) `auth` ก็จำเป็นเช่นกัน และรายงาน
บทบาท/ขอบเขตที่เจรจาได้ `canvasHostUrl` เป็นตัวเลือก

เมื่อไม่มีการออก device token, `hello-ok.auth` จะรายงาน
สิทธิ์ที่เจรจาได้โดยไม่มีฟิลด์ token:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ไคลเอนต์ backend ในกระบวนการเดียวกันที่เชื่อถือได้ (`client.id: "gateway-client"`,
`client.mode: "backend"`) อาจละ `device` ได้บนการเชื่อมต่อ loopback โดยตรงเมื่อ
ยืนยันตัวตนด้วย token/password ของ gateway ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้
สำหรับ RPC ของระนาบควบคุมภายใน และทำให้ baseline การจับคู่ CLI/device ที่ค้างอยู่
ไม่ขัดขวางงาน backend แบบ local เช่นการอัปเดต session ของ subagent ไคลเอนต์ระยะไกล,
ไคลเอนต์จาก origin ของเบราว์เซอร์, ไคลเอนต์ Node และไคลเอนต์ device-token/device-identity
แบบชัดเจนยังคงใช้การจับคู่และการตรวจ scope-upgrade ตามปกติ

เมื่อมีการออก device token, `hello-ok` จะรวมสิ่งนี้ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ระหว่างการส่งต่อ bootstrap ที่เชื่อถือได้ `hello-ok.auth` อาจรวมรายการบทบาทเพิ่มเติม
ที่ถูกจำกัดไว้ใน `deviceTokens` ด้วย:

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
`scopes: []` และ token ของ operator ที่ส่งต่อใดๆ ยังคงถูกจำกัดไว้ที่ allowlist
ของ bootstrap operator (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจ scope ของ bootstrap ยังคง
ขึ้นต้นตามบทบาท: รายการ operator ตอบสนองได้เฉพาะคำขอ operator และบทบาทที่ไม่ใช่ operator
ยังต้องมี scope ภายใต้ prefix ของบทบาทตนเอง

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
- **คำตอบ**: `{type:"res", id, ok, payload|error}`
- **อีเวนต์**: `{type:"event", event, payload, seq?, stateVersion?}`

เมธอดที่มี side effect ต้องใช้ **idempotency key** (ดู schema)

## บทบาท + scope

สำหรับโมเดล scope ของ operator ฉบับเต็ม การตรวจตอนอนุมัติ และความหมายของ shared-secret
ให้ดู [scope ของ operator](/th/gateway/operator-scopes)

### บทบาท

- `operator` = ไคลเอนต์ระนาบควบคุม (CLI/UI/automation)
- `node` = โฮสต์ความสามารถ (camera/screen/canvas/system.run)

### Scope (operator)

scope ทั่วไป:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` ที่มี `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)

เมธอด RPC ของ gateway ที่ Plugin ลงทะเบียนอาจขอ scope ของ operator ของตัวเองได้ แต่
prefix admin หลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะแปลงเป็น `operator.admin` เสมอ

scope ของเมธอดเป็นเพียงด่านแรก คำสั่ง slash บางคำสั่งที่เข้าถึงผ่าน
`chat.send` ใช้การตรวจระดับคำสั่งที่เข้มงวดกว่าเพิ่มเติม ตัวอย่างเช่น การเขียนถาวร
`/config set` และ `/config unset` ต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจ scope ตอนอนุมัติเพิ่มเติมเหนือ
scope พื้นฐานของเมธอด:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มีคำสั่ง Node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่รวม `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node ประกาศคำกล่าวอ้างความสามารถในเวลาที่เชื่อมต่อ:

- `caps`: หมวดหมู่ความสามารถระดับสูง
- `commands`: allowlist ของคำสั่งสำหรับ invoke
- `permissions`: toggle แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือว่าสิ่งเหล่านี้เป็น **คำกล่าวอ้าง** และบังคับใช้ allowlist ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` ส่งคืนรายการที่ใช้ device identity เป็นคีย์
- รายการ presence รวม `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงแถวเดียวต่อ device ได้
  แม้จะเชื่อมต่อทั้งในฐานะ **operator** และ **node**
- `node.list` รวมฟิลด์ตัวเลือก `lastSeenAtMs` และ `lastSeenReason` Node ที่เชื่อมต่ออยู่รายงาน
  เวลาเชื่อมต่อปัจจุบันเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; Node ที่จับคู่แล้วอาจรายงาน
  background presence แบบคงทนได้ด้วยเมื่ออีเวนต์ Node ที่เชื่อถือได้อัปเดต metadata การจับคู่

### อีเวนต์ Node background alive

Node อาจเรียก `node.event` ด้วย `event: "node.presence.alive"` เพื่อบันทึกว่า Node ที่จับคู่แล้ว
ยังมีชีวิตอยู่ระหว่างการปลุกในเบื้องหลังโดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น enum แบบปิด: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` สตริง trigger ที่ไม่รู้จักจะถูก normalize เป็น
`background` โดย gateway ก่อนการ persist อีเวนต์จะคงทนเฉพาะสำหรับ session ของ device Node
ที่ยืนยันตัวตนแล้ว; session ที่ไม่มี device หรือไม่ได้จับคู่จะส่งคืน `handled: false`

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
RPC ที่ได้รับการยืนยันแล้ว ไม่ใช่การ persist presence แบบคงทน

## การกำหนด scope ของอีเวนต์ broadcast

อีเวนต์ broadcast ของ WebSocket ที่เซิร์ฟเวอร์ push จะถูก gate ด้วย scope เพื่อให้ session ที่มีเพียง pairing-scope หรือเฉพาะ Node ไม่ได้รับเนื้อหา session แบบ passive

- **frame ของ chat, agent และ tool-result** (รวมถึงอีเวนต์ `agent` แบบ stream และผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` session ที่ไม่มี `operator.read` จะข้าม frame เหล่านี้ทั้งหมด
- **broadcast `plugin.*` ที่ Plugin กำหนด** ถูก gate ไปยัง `operator.write` หรือ `operator.admin` ตามวิธีที่ Plugin ลงทะเบียนไว้
- **อีเวนต์ status และ transport** (`heartbeat`, `presence`, `tick`, lifecycle การเชื่อมต่อ/ตัดการเชื่อมต่อ ฯลฯ) ยังคงไม่ถูกจำกัด เพื่อให้ทุก session ที่ยืนยันตัวตนแล้วสังเกตสุขภาพของ transport ได้
- **ตระกูลอีเวนต์ broadcast ที่ไม่รู้จัก** จะถูก gate ด้วย scope โดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนปรนอย่างชัดเจน

การเชื่อมต่อของไคลเอนต์แต่ละรายการเก็บหมายเลขลำดับต่อไคลเอนต์ของตนเอง ดังนั้น broadcast จึงรักษาการเรียงลำดับแบบ monotonic บน socket นั้น แม้ไคลเอนต์แต่ละรายจะเห็น subset ของสตรีมอีเวนต์ที่ถูกกรองด้วย scope ต่างกัน

## ตระกูลเมธอด RPC ทั่วไป

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ข้างต้น นี่
ไม่ใช่ dump ที่สร้างขึ้น — `hello-ok.features.methods` เป็นรายการค้นพบ
แบบระมัดระวังที่สร้างจาก `src/gateway/server-methods-list.ts` รวมกับ export ของเมธอด
Plugin/channel ที่โหลดแล้ว ให้ถือว่าเป็นการค้นพบฟีเจอร์ ไม่ใช่การแจกแจงแบบเต็ม
ของ `src/gateway/server-methods/*.ts`

<AccordionGroup>
  <Accordion title="ระบบและตัวตน">
    - `health` ส่งคืน snapshot สุขภาพ gateway ที่แคชไว้หรือ probe สดใหม่
    - `diagnostics.stability` ส่งคืนตัวบันทึกเสถียรภาพ diagnostics แบบจำกัดล่าสุด โดยเก็บ metadata การปฏิบัติงาน เช่น ชื่ออีเวนต์ จำนวน ขนาด byte ค่าอ่านหน่วยความจำ สถานะ queue/session ชื่อ channel/plugin และ session id ไม่เก็บข้อความ chat, เนื้อหา webhook, เอาต์พุต tool, เนื้อความ raw request หรือ response, token, cookie หรือค่าความลับ ต้องใช้ scope operator read
    - `status` ส่งคืนสรุป gateway แบบ `/status`; ฟิลด์ที่อ่อนไหวจะถูกรวมไว้เฉพาะสำหรับไคลเอนต์ operator ที่มี scope admin
    - `gateway.identity.get` ส่งคืน device identity ของ gateway ที่ใช้โดย flow relay และ pairing
    - `system-presence` ส่งคืน snapshot presence ปัจจุบันสำหรับ device operator/node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่มอีเวนต์ system และสามารถอัปเดต/broadcast บริบท presence ได้
    - `last-heartbeat` ส่งคืนอีเวนต์ Heartbeat ล่าสุดที่ persist ไว้
    - `set-heartbeats` เปิด/ปิดการประมวลผล Heartbeat บน gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแค็ตตาล็อกโมเดลที่รันไทม์อนุญาตให้ใช้ ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าไว้ในขนาดเหมาะกับตัวเลือก (`agents.defaults.models` ก่อน แล้วตามด้วย `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแค็ตตาล็อกทั้งหมด
    - `usage.status` ส่งคืนสรุปช่วงเวลาการใช้งาน/โควตาคงเหลือของผู้ให้บริการ
    - `usage.cost` ส่งคืนสรุปการใช้งานค่าใช้จ่ายแบบรวมสำหรับช่วงวันที่
    - `doctor.memory.status` ส่งคืนความพร้อมของหน่วยความจำเวกเตอร์ / embedding ที่แคชไว้สำหรับพื้นที่ทำงานของเอเจนต์ค่าเริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจน
    - `doctor.memory.remHarness` ส่งคืนตัวอย่าง harness REM แบบอ่านอย่างเดียวและมีขอบเขตสำหรับไคลเอนต์ control-plane ระยะไกล อาจรวมเส้นทางพื้นที่ทำงาน ส่วนย่อยของหน่วยความจำ Markdown ที่เรนเดอร์พร้อม grounding และตัวเลือกการโปรโมตเชิงลึก ดังนั้นผู้เรียกต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานรายเซสชัน
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบอนุกรมเวลาสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="แชนเนลและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะของแชนเนล/Plugin แบบในตัว + ที่บันเดิลมา
    - `channels.logout` ออกจากระบบแชนเนล/บัญชีที่ระบุ เมื่อแชนเนลรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบด้วย QR/เว็บสำหรับผู้ให้บริการแชนเนลเว็บปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบด้วย QR/เว็บนั้นเสร็จสิ้น และเริ่มแชนเนลเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง Node iOS ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืนทริกเกอร์คำปลุกที่จัดเก็บไว้
    - `voicewake.set` อัปเดตทริกเกอร์คำปลุกและกระจายการเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การส่งข้อความและบันทึก">
    - `send` คือ RPC สำหรับการส่งออกโดยตรงสำหรับการส่งที่กำหนดเป้าหมายตามแชนเนล/บัญชี/เธรดภายนอก chat runner
    - `logs.tail` ส่งคืนส่วนท้ายของไฟล์บันทึก Gateway ที่กำหนดค่าไว้ พร้อมการควบคุมเคอร์เซอร์/ขีดจำกัดและจำนวนไบต์สูงสุด

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.config` ส่งคืน payload การกำหนดค่า Talk ที่มีผลอยู่; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.mode` ตั้งค่า/กระจายสถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะการเปิดใช้งาน TTS, ผู้ให้บริการที่ใช้งานอยู่, ผู้ให้บริการสำรอง และสถานะการกำหนดค่าผู้ให้บริการ
    - `tts.providers` ส่งคืนรายการผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะ prefs ของ TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงพูดแบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ การกำหนดค่า การอัปเดต และวิซาร์ด">
    - `secrets.reload` แก้ไข SecretRefs ที่ใช้งานอยู่อีกครั้งและสลับสถานะความลับของรันไทม์เมื่อสำเร็จทั้งหมดเท่านั้น
    - `secrets.resolve` แก้ไขการกำหนดความลับเป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายที่ระบุ
    - `config.get` ส่งคืน snapshot และ hash ของการกำหนดค่าปัจจุบัน
    - `config.set` เขียน payload การกำหนดค่าที่ผ่านการตรวจสอบแล้ว
    - `config.patch` รวมการอัปเดตการกำหนดค่าบางส่วน
    - `config.apply` ตรวจสอบ + แทนที่ payload การกำหนดค่าทั้งหมด
    - `config.schema` ส่งคืน payload schema การกำหนดค่าแบบสดที่ใช้โดย Control UI และเครื่องมือ CLI: schema, `uiHints`, เวอร์ชัน และ metadata การสร้าง รวมถึง metadata ของ schema ของ Plugin + แชนเนลเมื่อรันไทม์สามารถโหลดได้ schema รวม metadata ของฟิลด์ `title` / `description` ที่ได้มาจากป้ายกำกับและข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึงอ็อบเจ็กต์ซ้อน, wildcard, รายการอาร์เรย์ และแขนงการประกอบ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืน payload การค้นหาแบบกำหนดขอบเขตตามเส้นทางสำหรับหนึ่งเส้นทางการกำหนดค่า: เส้นทางที่ปรับเป็นมาตรฐาน, โหนด schema แบบตื้น, hint ที่ตรงกัน + `hintPath` และสรุปลูกโดยตรงสำหรับการเจาะลึกใน UI/CLI โหนด schema ของการค้นหาจะเก็บเอกสารที่ผู้ใช้เห็นและฟิลด์ตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขตตัวเลข/สตริง/อาร์เรย์/อ็อบเจ็กต์ และแฟล็กอย่าง `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกจะแสดง `key`, `path` ที่ปรับเป็นมาตรฐาน, `type`, `required`, `hasChildren` รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รันโฟลว์อัปเดต Gateway และตั้งเวลาเริ่มใหม่เฉพาะเมื่อการอัปเดตสำเร็จเอง การอัปเดตตัวจัดการแพ็กเกจจะบังคับให้เริ่มใหม่เพื่ออัปเดตแบบไม่เลื่อนเวลาและไม่มีคูลดาวน์หลังการสลับแพ็กเกจ เพื่อให้โปรเซส Gateway เก่าไม่โหลดแบบ lazy จากทรี `dist` ที่ถูกแทนที่แล้วต่อไป
    - `update.status` ส่งคืน sentinel การเริ่มใหม่หลังอัปเดตที่แคชล่าสุด รวมถึงเวอร์ชันที่กำลังรันหลังเริ่มใหม่เมื่อมีให้ใช้
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผยวิซาร์ด onboarding ผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วยเอเจนต์และพื้นที่ทำงาน">
    - `agents.list` ส่งคืนรายการเอเจนต์ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลและ metadata ของรันไทม์
    - `agents.create`, `agents.update` และ `agents.delete` จัดการระเบียนเอเจนต์และการเชื่อมโยงพื้นที่ทำงาน
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการไฟล์พื้นที่ทำงาน bootstrap ที่เปิดเผยสำหรับเอเจนต์
    - `artifacts.list`, `artifacts.get` และ `artifacts.download` เปิดเผยสรุป artifact ที่ได้จาก transcript และการดาวน์โหลดสำหรับขอบเขต `sessionKey`, `runId` หรือ `taskId` ที่ระบุอย่างชัดเจน การค้นหา run และ task จะแก้ไขเซสชันเจ้าของฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อ transcript ที่มี provenance ตรงกัน; แหล่งที่มา URL ที่ไม่ปลอดภัยหรือเป็น local จะส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการ fetch ฝั่งเซิร์ฟเวอร์
    - `agent.identity.get` ส่งคืนตัวตนผู้ช่วยที่มีผลสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้ run เสร็จสิ้นและส่งคืน snapshot ปลายทางเมื่อมีให้ใช้

  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึง metadata `agentRuntime` รายแถวเมื่อกำหนดค่า backend รันไทม์ของเอเจนต์ไว้
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับเหตุการณ์ transcript/ข้อความสำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนตัวอย่าง transcript แบบมีขอบเขตสำหรับคีย์เซสชันที่ระบุ
    - `sessions.describe` ส่งคืนหนึ่งแถวเซสชัน Gateway สำหรับคีย์เซสชันที่ตรงกันทุกประการ
    - `sessions.resolve` แก้ไขหรือทำให้เป้าหมายเซสชันเป็น canonical
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปยังเซสชันที่มีอยู่
    - `sessions.steer` คือ variant สำหรับขัดจังหวะและ steer สำหรับเซสชันที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่ไม่บังคับ หรือส่งเฉพาะ `runId` สำหรับ run ที่ใช้งานอยู่ซึ่ง Gateway สามารถแก้ไขเป็นเซสชันได้
    - `sessions.patch` อัปเดต metadata/overrides ของเซสชัน และรายงานโมเดล canonical ที่แก้ไขแล้วพร้อม `agentRuntime` ที่มีผล
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ดำเนินการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้ทั้งหมด
    - การดำเนินการแชทยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` `chat.history` ถูกปรับมาตรฐานการแสดงผลสำหรับไคลเอนต์ UI: แท็กคำสั่ง inline จะถูกตัดออกจากข้อความที่มองเห็นได้, payload XML ของ tool-call แบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน) และโทเค็นควบคุมโมเดล ASCII/เต็มความกว้างที่รั่วไหลจะถูกตัดออก, แถวผู้ช่วยที่เป็น silent-token ล้วน เช่น `NO_REPLY` / `no_reply` ที่ตรงกันทุกประการจะถูกละเว้น และแถวที่ใหญ่เกินไปสามารถถูกแทนที่ด้วย placeholder ได้

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และโทเค็นอุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วซึ่งรอดำเนินการและได้รับอนุมัติ
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก
    - `device.token.revoke` เพิกถอนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่ Node, invoke และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` และ `node.pair.verify` ครอบคลุมการจับคู่ Node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` ส่งคืนสถานะ Node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับ Node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง Node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอ invoke
    - `node.event` นำเหตุการณ์ที่มาจาก Node กลับเข้าสู่ Gateway
    - `node.canvas.capability.refresh` รีเฟรชโทเค็นความสามารถ canvas แบบกำหนดขอบเขต
    - `node.pending.pull` และ `node.pending.ack` คือ API คิวของ Node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบคงทนสำหรับ Node ที่ออฟไลน์/ตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="ตระกูลการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการและส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการ snapshot นโยบายการอนุมัติ exec ของ Gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec ภายใน Node ผ่านคำสั่ง relay ของ Node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่กำหนดโดย Plugin

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ, Skills และเครื่องมือ">
    - ระบบอัตโนมัติ: `wake` ตั้งเวลาการแทรกข้อความปลุกแบบทันทีหรือใน Heartbeat ถัดไป; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่ตั้งเวลาไว้
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### ตระกูลเหตุการณ์ทั่วไป

- `chat`: การอัปเดตแชท UI เช่น `chat.inject` และเหตุการณ์แชทอื่นที่เป็น transcript เท่านั้น
- `session.message` และ `session.tool`: การอัปเดต transcript/event-stream สำหรับเซสชันที่สมัครรับ
- `sessions.changed`: ดัชนีเซสชันหรือ metadata เปลี่ยนแปลง
- `presence`: การอัปเดต snapshot สถานะ presence ของระบบ
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดต snapshot สุขภาพของ Gateway
- `heartbeat`: การอัปเดตสตรีมเหตุการณ์ Heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลง run/job ของ Cron
- `shutdown`: การแจ้งเตือนการปิด Gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ Node
- `node.invoke.request`: การกระจายคำขอ invoke ของ Node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตของอุปกรณ์ที่จับคู่แล้ว
- `voicewake.changed`: การกำหนดค่าทริกเกอร์คำปลุกเปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ Plugin

### เมธอดตัวช่วย Node

- Node อาจเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของไฟล์ปฏิบัติการ skill
  สำหรับการตรวจสอบ auto-allow

### เมธอดตัวช่วยผู้ปฏิบัติการ

- ผู้ปฏิบัติการอาจเรียก `commands.list` (`operator.read`) เพื่อดึงรายการคำสั่งขณะรันสำหรับเอเจนต์
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - `scope` ควบคุมว่าพื้นผิวใดที่ `name` หลักกำหนดเป้าหมาย:
    - `text` ส่งคืนโทเค็นคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางเริ่มต้น `both` ส่งคืนชื่อเนทีฟที่รับรู้ผู้ให้บริการ
      เมื่อมีให้ใช้
  - `textAliases` มีนามแฝงแบบสแลชที่ตรงกันทุกตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่งเนทีฟที่รับรู้ผู้ให้บริการเมื่อมีอยู่
  - `provider` เป็นตัวเลือกและมีผลเฉพาะกับการตั้งชื่อเนทีฟรวมถึงความพร้อมใช้งานของคำสั่ง Plugin
    แบบเนทีฟ
  - `includeArgs=false` ละเว้นเมทาดาทาอาร์กิวเมนต์ที่ซีเรียลไลซ์แล้วจากการตอบกลับ
- ผู้ปฏิบัติการอาจเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือขณะรันสำหรับ
  เอเจนต์ การตอบกลับมีเครื่องมือที่จัดกลุ่มและเมทาดาทาที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: ระบุว่าเครื่องมือ Plugin เป็นตัวเลือกหรือไม่
- ผู้ปฏิบัติการอาจเรียก `tools.effective` (`operator.read`) เพื่อดึงรายการเครื่องมือที่มีผลขณะรัน
  สำหรับเซสชัน
  - ต้องมี `sessionKey`
  - Gateway อนุมานบริบทขณะรันที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนการยอมรับ
    บริบทการยืนยันตัวตนหรือการส่งมอบที่ผู้เรียกส่งมา
  - การตอบกลับมีขอบเขตตามเซสชันและสะท้อนสิ่งที่บทสนทนาที่กำลังใช้งานอยู่สามารถใช้ได้ในตอนนี้
    รวมถึงเครื่องมือของคอร์, Plugin และช่องทาง
- ผู้ปฏิบัติการอาจเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือที่พร้อมใช้งานผ่าน
  เส้นทางนโยบาย Gateway เดียวกับ `/tools/invoke`
  - ต้องมี `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ
    `idempotencyKey` เป็นตัวเลือก
  - หากมีทั้ง `sessionKey` และ `agentId` เอเจนต์ของเซสชันที่ resolve ได้ต้องตรงกับ
    `agentId`
  - การตอบกลับเป็น envelope สำหรับ SDK ที่มีฟิลด์ `ok`, `toolName`, `output` ที่เป็นตัวเลือก และ
    `error` แบบมีชนิด การอนุมัติหรือการปฏิเสธตามนโยบายจะส่งคืน `ok:false` ใน payload แทนที่จะ
    ข้ามไปป์ไลน์นโยบายเครื่องมือของ Gateway
- ผู้ปฏิบัติการอาจเรียก `skills.status` (`operator.read`) เพื่อดึงรายการ Skills ที่มองเห็นได้
  สำหรับเอเจนต์
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - การตอบกลับประกอบด้วยคุณสมบัติการมีสิทธิ์ ข้อกำหนดที่ขาดหาย การตรวจสอบ config และ
    ตัวเลือกการติดตั้งที่ผ่านการทำให้ปลอดภัยแล้วโดยไม่เปิดเผยค่าความลับดิบ
- ผู้ปฏิบัติการอาจเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ
  เมทาดาทาการค้นพบของ ClawHub
- ผู้ปฏิบัติการอาจเรียก `skills.install` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้ง
    โฟลเดอร์ Skills ลงในไดเรกทอรี `skills/` ของพื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    รันการกระทำ `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ Gateway
- ผู้ปฏิบัติการอาจเรียก `skills.update` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามรายการเดียวหรือการติดตั้ง ClawHub ที่ติดตามทั้งหมดใน
    พื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมด Config แพตช์ค่า `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` ยอมรับพารามิเตอร์ `view` ที่เป็นตัวเลือก:

- ละไว้หรือ `"default"`: พฤติกรรมขณะรันปัจจุบัน หากมีการกำหนดค่า `agents.defaults.models` การตอบกลับจะเป็นแค็ตตาล็อกที่อนุญาต; ไม่เช่นนั้นการตอบกลับจะเป็นแค็ตตาล็อก Gateway ทั้งหมด
- `"configured"`: พฤติกรรมขนาดตัวเลือก หากมีการกำหนดค่า `agents.defaults.models` ค่านั้นยังคงมีผลเหนือกว่า ไม่เช่นนั้นการตอบกลับจะใช้รายการ `models.providers.*.models` ที่ระบุชัดเจน โดย fallback ไปยังแค็ตตาล็อกทั้งหมดเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แค็ตตาล็อก Gateway ทั้งหมด โดยข้าม `agents.defaults.models` ใช้สำหรับการวินิจฉัยและ UI การค้นพบ ไม่ใช่ตัวเลือกโมเดลปกติ

## การอนุมัติ Exec

- เมื่อคำขอ exec ต้องได้รับการอนุมัติ Gateway จะ broadcast `exec.approval.requested`
- ไคลเอนต์ผู้ปฏิบัติการ resolve โดยเรียก `exec.approval.resolve` (ต้องมี scope `operator.approvals`)
- สำหรับ `host=node` นั้น `exec.approval.request` ต้องมี `systemRunPlan` (`argv`/`cwd`/`rawCommand`/เมทาดาทาเซสชันแบบ canonical) คำขอที่ขาด `systemRunPlan` จะถูกปฏิเสธ
- หลังอนุมัติแล้ว การเรียก `node.invoke system.run` ที่ส่งต่อจะใช้ `systemRunPlan`
  แบบ canonical นั้นซ้ำเป็นบริบทคำสั่ง/cwd/เซสชันที่เชื่อถือได้
- หากผู้เรียกแก้ไข `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่างขั้นตอนเตรียมและการส่งต่อ `system.run` ที่ได้รับอนุมัติขั้นสุดท้าย
  Gateway จะปฏิเสธการรันแทนที่จะเชื่อถือ payload ที่ถูกแก้ไข

## Fallback การส่งมอบเอเจนต์

- คำขอ `agent` สามารถมี `deliver=true` เพื่อขอการส่งมอบขาออก
- `bestEffortDeliver=false` คงพฤติกรรมแบบเข้มงวด: เป้าหมายการส่งมอบที่ resolve ไม่ได้หรือใช้ภายในเท่านั้นจะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback เป็นการดำเนินการเฉพาะเซสชันเมื่อไม่สามารถ resolve เส้นทางภายนอกที่ส่งมอบได้ (เช่น เซสชันภายใน/webchat หรือ config หลายช่องทางที่กำกวม)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema/protocol-schemas.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์จะปฏิเสธเมื่อไม่ตรงกัน
- สคีมา + โมเดลถูกสร้างจากนิยาม TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

ไคลเอนต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าเหล่านี้
คงที่ตลอด protocol v3 และเป็น baseline ที่คาดหวังสำหรับไคลเอนต์ภายนอก

| ค่าคงที่                                  | ค่าเริ่มต้น                                           | แหล่งที่มา                                                                                |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| เวลาหมดเวลาคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| เวลาหมดเวลา Preauth / connect-challenge   | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่มงบฝั่งเซิร์ฟเวอร์/ไคลเอนต์คู่กันได้) |
| backoff การเชื่อมต่อใหม่เริ่มต้น          | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| backoff การเชื่อมต่อใหม่สูงสุด            | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp การลองซ้ำอย่างรวดเร็วหลังการปิด device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ช่วงผ่อนปรน force-stop ก่อน `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| เวลาหมดเวลาเริ่มต้นของ `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)       | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| การปิดเมื่อ tick หมดเวลา                  | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศค่า `policy.tickIntervalMs`, `policy.maxPayload`
และ `policy.maxBufferedBytes` ที่มีผลใน `hello-ok`; ไคลเอนต์ควรเคารพค่าเหล่านั้น
แทนค่าเริ่มต้นก่อน handshake

## Auth

- การยืนยันตัวตนของ Gateway ด้วย shared secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมดการยืนยันตัวตนที่กำหนดค่าไว้
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ `gateway.auth.mode: "trusted-proxy"`
  ที่ไม่ใช่ loopback จะผ่านการตรวจสอบการยืนยันตัวตนของ connect จาก
  ส่วนหัวคำขอแทน `connect.params.auth.*`
- `gateway.auth.mode: "none"` สำหรับ ingress ส่วนตัวจะข้ามการยืนยันตัวตน connect
  ด้วย shared secret ทั้งหมด ห้ามเปิดเผยโหมดนั้นบน ingress สาธารณะ/ไม่น่าเชื่อถือ
- หลังจากจับคู่แล้ว Gateway จะออก **โทเค็นอุปกรณ์** ที่จำกัดขอบเขตตาม
  บทบาทการเชื่อมต่อ + scopes โทเค็นนี้จะถูกส่งกลับใน `hello-ok.auth.deviceToken`
  และไคลเอนต์ควรบันทึกไว้สำหรับการเชื่อมต่อในอนาคต
- ไคลเอนต์ควรบันทึก `hello-ok.auth.deviceToken` หลักหลังจาก connect สำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วยโทเค็นอุปกรณ์ที่ **บันทึกไว้** นั้นควรใช้ชุด scope ที่อนุมัติแล้ว
  ซึ่งบันทึกไว้สำหรับโทเค็นนั้นซ้ำด้วย วิธีนี้คงสิทธิ์เข้าถึง read/probe/status
  ที่ได้รับไปแล้ว และหลีกเลี่ยงไม่ให้การเชื่อมต่อใหม่ถูกลดเหลือ scope แบบ admin-only
  โดยนัยที่แคบกว่าอย่างเงียบ ๆ
- การประกอบการยืนยันตัวตน connect ฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากกัน และจะถูกส่งต่อเสมอเมื่อกำหนดไว้
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: โทเค็น shared ที่ระบุชัดเจนก่อน
    จากนั้น `deviceToken` ที่ระบุชัดเจน แล้วจึงเป็นโทเค็นต่ออุปกรณ์ที่บันทึกไว้
    (อ้างอิงด้วย `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อรายการข้างต้นไม่มีรายการใดแก้ค่าเป็น
    `auth.token` ได้ โทเค็น shared หรือโทเค็นอุปกรณ์ใด ๆ ที่แก้ค่าได้จะยับยั้งไม่ให้ส่ง
  - การเลื่อนระดับอัตโนมัติของโทเค็นอุปกรณ์ที่บันทึกไว้ในการลองซ้ำครั้งเดียวของ
    `AUTH_TOKEN_MISMATCH` ถูกจำกัดให้ใช้ได้กับ **ปลายทางที่เชื่อถือได้เท่านั้น** -
    loopback หรือ `wss://` ที่มี `tlsFingerprint` ที่ปักหมุดไว้ `wss://` สาธารณะ
    ที่ไม่มีการปักหมุดจะไม่เข้าเกณฑ์
- รายการ `hello-ok.auth.deviceTokens` เพิ่มเติมคือโทเค็นส่งต่อ bootstrap
  ให้บันทึกเฉพาะเมื่อ connect ใช้การยืนยันตัวตน bootstrap บนทรานสปอร์ตที่เชื่อถือได้
  เช่น `wss://` หรือการจับคู่แบบ loopback/local
- หากไคลเอนต์ระบุ `deviceToken` หรือ `scopes` อย่าง **ชัดเจน**
  ชุด scope ที่ผู้เรียกขอจะยังคงเป็นแหล่งอ้างอิงหลัก scopes ที่แคชไว้จะถูกใช้ซ้ำ
  เฉพาะเมื่อไคลเอนต์กำลังใช้โทเค็นต่ออุปกรณ์ที่บันทึกไว้ซ้ำเท่านั้น
- โทเค็นอุปกรณ์สามารถหมุนเวียน/เพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องมี scope `operator.pairing`)
- `device.token.rotate` ส่งคืนข้อมูลเมตาการหมุนเวียน โดยจะสะท้อนโทเค็น bearer
  ทดแทนเฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ยืนยันตัวตนด้วยโทเค็นอุปกรณ์นั้นแล้ว
  เพื่อให้ไคลเอนต์ที่ใช้เฉพาะโทเค็นสามารถบันทึกโทเค็นทดแทนก่อนเชื่อมต่อใหม่ได้
  การหมุนเวียนด้วย shared/admin จะไม่สะท้อนโทเค็น bearer
- การออกโทเค็น การหมุนเวียน และการเพิกถอนยังคงถูกจำกัดอยู่กับชุดบทบาทที่อนุมัติแล้ว
  ซึ่งบันทึกไว้ในรายการจับคู่ของอุปกรณ์นั้น การกลายพันธุ์ของโทเค็นไม่สามารถขยาย
  หรือกำหนดเป้าหมายบทบาทอุปกรณ์ที่การอนุมัติการจับคู่ไม่เคยให้ไว้ได้
- สำหรับเซสชันโทเค็นของอุปกรณ์ที่จับคู่แล้ว การจัดการอุปกรณ์จะจำกัดกับตัวเอง
  เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ admin สามารถลบ/เพิกถอน/หมุนเวียน
  ได้เฉพาะรายการอุปกรณ์ **ของตนเอง** เท่านั้น
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุด scope ของโทเค็น operator
  เป้าหมายเทียบกับ scopes ของเซสชันปัจจุบันของผู้เรียก ผู้เรียกที่ไม่ใช่ admin
  ไม่สามารถหมุนเวียนหรือเพิกถอนโทเค็น operator ที่กว้างกว่าที่ตนมีอยู่แล้วได้
- ความล้มเหลวของการยืนยันตัวตนมี `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (บูลีน)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลองซ้ำแบบจำกัดหนึ่งครั้งด้วยโทเค็นต่ออุปกรณ์ที่แคชไว้
  - หากการลองซ้ำนั้นล้มเหลว ไคลเอนต์ควรหยุดลูปเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำการดำเนินการสำหรับผู้ควบคุม

## ข้อมูลระบุตัวตนอุปกรณ์ + การจับคู่

- Nodes ควรมีข้อมูลระบุตัวตนอุปกรณ์ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  ลายนิ้วมือของคู่กุญแจ
- Gateways ออกโทเค็นต่ออุปกรณ์ + บทบาท
- ต้องมีการอนุมัติการจับคู่สำหรับ ID อุปกรณ์ใหม่ เว้นแต่จะเปิดใช้การอนุมัติอัตโนมัติภายในเครื่อง
- การอนุมัติอัตโนมัติของการจับคู่มีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่จำกัด
  สำหรับโฟลว์ตัวช่วย shared secret ที่เชื่อถือได้
- การเชื่อมต่อ tailnet หรือ LAN บนโฮสต์เดียวกันยังคงถูกปฏิบัติเป็นระยะไกลสำหรับการจับคู่
  และต้องได้รับการอนุมัติ
- โดยปกติไคลเอนต์ WS จะรวมข้อมูลระบุตัวตน `device` ระหว่าง `connect` (operator +
  node) ข้อยกเว้น operator ที่ไม่มีอุปกรณ์มีเฉพาะเส้นทางความเชื่อถือที่ระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP ที่ไม่ปลอดภัยแบบ localhost-only
  - การยืนยันตัวตน Control UI ของ operator ด้วย `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
  - RPC backend ของ `gateway-client` แบบ direct-loopback ที่ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน
    Gateway แบบ shared
- การเชื่อมต่อทั้งหมดต้องลงนาม nonce `connect.challenge` ที่เซิร์ฟเวอร์ให้มา

### การวินิจฉัยการย้ายข้อมูลการยืนยันตัวตนอุปกรณ์

สำหรับไคลเอนต์เดิมที่ยังใช้พฤติกรรมการลงนามก่อน challenge ตอนนี้ `connect` จะส่งคืน
โค้ดรายละเอียด `DEVICE_AUTH_*` ใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวในการย้ายข้อมูลที่พบบ่อย:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ละเว้น `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่า/ผิด            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ลายเซ็นไม่ตรงกับ payload v2       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอกช่วง skew ที่อนุญาต          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับลายนิ้วมือกุญแจสาธารณะ |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/การทำให้เป็น canonical ของกุญแจสาธารณะล้มเหลว         |

เป้าหมายการย้ายข้อมูล:

- รอ `connect.challenge` เสมอ
- ลงนาม payload v2 ที่มี nonce จากเซิร์ฟเวอร์
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload ลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` เดิมยังคงยอมรับเพื่อความเข้ากันได้ แต่การปักหมุดข้อมูลเมตา
  ของอุปกรณ์ที่จับคู่แล้วยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + การปักหมุด

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์อาจเลือกปักหมุดลายนิ้วมือใบรับรอง Gateway ได้ (ดูการกำหนดค่า `gateway.tls`
  รวมถึง `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **API Gateway แบบเต็ม** (status, channels, models, chat,
agent, sessions, nodes, approvals และอื่น ๆ) พื้นผิวที่แน่นอนถูกกำหนดโดย
schema ของ TypeBox ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [runbook ของ Gateway](/th/gateway)
