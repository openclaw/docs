---
read_when:
    - การพัฒนาหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - กำลังสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การแฮนด์เชก, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-05-01T10:17:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8295e4e416250e7381393c0aa6a0016719f96552485cf9d56bb3896c9704c4a9
    source_path: gateway/protocol.md
    workflow: 16
---

โปรโตคอล WS ของ Gateway คือ **control plane เดียว + การขนส่งของ node** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, UI บนเว็บ, แอป macOS, node iOS/Android, node
แบบ headless) เชื่อมต่อผ่าน WebSocket และประกาศ **role** + **scope** ของตนในเวลา
handshake

## การขนส่ง

- WebSocket, เฟรมข้อความพร้อม payload JSON
- เฟรมแรก **ต้อง** เป็นคำขอ `connect`
- เฟรมก่อนเชื่อมต่อถูกจำกัดที่ 64 KiB หลังจาก handshake สำเร็จ ไคลเอนต์
  ควรทำตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้งาน diagnostics
  เฟรมขาเข้าที่มีขนาดใหญ่เกินและบัฟเฟอร์ขาออกที่ช้าจะส่งเหตุการณ์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้งเฟรมที่ได้รับผลกระทบ เหตุการณ์เหล่านี้เก็บ
  ขนาด, ขีดจำกัด, surfaces และรหัสเหตุผลที่ปลอดภัย โดยไม่เก็บเนื้อหาข้อความ,
  เนื้อหาแนบ, เนื้อหาเฟรมดิบ, tokens, cookies หรือค่าลับ

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

ขณะที่ Gateway ยังเริ่ม sidecars ให้เสร็จอยู่ คำขอ `connect` อาจ
ส่งคืนข้อผิดพลาด `UNAVAILABLE` ที่ลองใหม่ได้ โดยตั้งค่า `details.reason` เป็น
`"startup-sidecars"` และมี `retryAfterMs` ไคลเอนต์ควรลอง response นั้นใหม่
ภายในงบเวลาการเชื่อมต่อโดยรวม แทนที่จะแสดงเป็นความล้มเหลวของ
handshake แบบสิ้นสุด

`server`, `features`, `snapshot` และ `policy` ล้วนเป็นสิ่งที่ schema
(`src/gateway/protocol/schema/frames.ts`) กำหนดให้ต้องมี `auth` ก็จำเป็นเช่นกัน
และรายงาน role/scopes ที่เจรจาได้ `canvasHostUrl` เป็นตัวเลือก

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

ไคลเอนต์ backend แบบ same-process ที่เชื่อถือได้ (`client.id: "gateway-client"`,
`client.mode: "backend"`) อาจละเว้น `device` บนการเชื่อมต่อ loopback โดยตรงเมื่อ
ยืนยันตัวตนด้วย token/password ของ gateway ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้
สำหรับ RPC ภายในของ control-plane และป้องกันไม่ให้ baseline การจับคู่ CLI/device
ที่ล้าสมัยบล็อกงาน backend ภายในเครื่อง เช่น การอัปเดตเซสชัน subagent ไคลเอนต์ระยะไกล,
ไคลเอนต์จาก browser-origin, ไคลเอนต์ node และไคลเอนต์ device-token/device-identity
แบบชัดเจนยังคงใช้การตรวจสอบการจับคู่และการยกระดับ scope ตามปกติ

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

ระหว่างการส่งต่อ trusted bootstrap, `hello-ok.auth` อาจรวมรายการ role แบบจำกัดเพิ่มเติมใน
`deviceTokens` ด้วย:

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

สำหรับ flow bootstrap node/operator ในตัว token หลักของ node จะยังคงเป็น
`scopes: []` และ token ของ operator ที่ส่งต่อใดๆ จะยังจำกัดอยู่ที่ allowlist ของ
operator สำหรับ bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจสอบ scope ของ bootstrap ยังคง
อิง prefix ของ role: รายการ operator ใช้ตอบสนองได้เฉพาะคำขอ operator และ role
ที่ไม่ใช่ operator ยังคงต้องมี scopes ภายใต้ prefix role ของตนเอง

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
- **Response**: `{type:"res", id, ok, payload|error}`
- **เหตุการณ์**: `{type:"event", event, payload, seq?, stateVersion?}`

เมธอดที่มีผลข้างเคียงต้องใช้ **idempotency keys** (ดู schema)

## Roles + scopes

### Roles

- `operator` = ไคลเอนต์ control plane (CLI/UI/automation)
- `node` = โฮสต์ความสามารถ (camera/screen/canvas/system.run)

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

เมธอด RPC ของ gateway ที่ Plugin ลงทะเบียนอาจร้องขอ scope ของ operator ของตนเองได้ แต่
prefix admin หลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะแปลงเป็น `operator.admin` เสมอ

Scope ของเมธอดเป็นเพียงด่านแรกเท่านั้น slash commands บางรายการที่เข้าถึงผ่าน
`chat.send` ใช้การตรวจสอบระดับคำสั่งที่เข้มงวดกว่าเพิ่มเติม ตัวอย่างเช่น การเขียนแบบถาวร
`/config set` และ `/config unset` ต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบ scope เพิ่มเติมในเวลาที่อนุมัติ นอกเหนือจาก
scope พื้นฐานของเมธอด:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มีคำสั่ง node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่รวม `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes ประกาศการอ้างสิทธิ์ความสามารถในเวลาเชื่อมต่อ:

- `caps`: หมวดหมู่ความสามารถระดับสูง
- `commands`: allowlist ของคำสั่งสำหรับ invoke
- `permissions`: ตัวสลับแบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือสิ่งเหล่านี้เป็น **claims** และบังคับใช้ allowlists ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` ส่งคืนรายการที่ใช้ device identity เป็น key
- รายการ Presence รวม `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงหนึ่งแถวต่ออุปกรณ์ได้
  แม้เมื่ออุปกรณ์เชื่อมต่อเป็นทั้ง **operator** และ **node**
- `node.list` รวมฟิลด์ตัวเลือก `lastSeenAtMs` และ `lastSeenReason` nodes ที่เชื่อมต่อจะรายงาน
  เวลาเชื่อมต่อปัจจุบันของตนเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; nodes ที่จับคู่แล้วสามารถรายงาน
  presence เบื้องหลังแบบคงทนได้ด้วย เมื่อเหตุการณ์ node ที่เชื่อถือได้อัปเดต metadata การจับคู่ของตน

### เหตุการณ์ Node background alive

Nodes อาจเรียก `node.event` พร้อม `event: "node.presence.alive"` เพื่อบันทึกว่า node ที่จับคู่แล้ว
ยังมีชีวิตระหว่างการปลุกเบื้องหลัง โดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น enum แบบปิด: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` สตริง trigger ที่ไม่รู้จักจะถูกทำให้เป็น
`background` โดย gateway ก่อน persistence เหตุการณ์จะคงทนเฉพาะสำหรับเซสชันอุปกรณ์ node
ที่ยืนยันตัวตนแล้วเท่านั้น; เซสชันที่ไม่มีอุปกรณ์หรือไม่ได้จับคู่จะส่งคืน `handled: false`

Gateways ที่สำเร็จจะส่งคืนผลลัพธ์แบบมีโครงสร้าง:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateways รุ่นเก่าอาจยังส่งคืน `{ "ok": true }` สำหรับ `node.event`; ไคลเอนต์ควรถือว่านั่นเป็น
RPC ที่ได้รับการยืนยันแล้ว ไม่ใช่ persistence ของ presence แบบคงทน

## การกำหนดขอบเขตเหตุการณ์ broadcast

เหตุการณ์ broadcast ของ WebSocket ที่เซิร์ฟเวอร์ push ถูกจำกัดด้วย scope เพื่อให้เซสชันที่มี scope สำหรับ pairing หรือเฉพาะ node ไม่ได้รับเนื้อหาเซสชันแบบ passive

- **เฟรม chat, agent และ tool-result** (รวมถึงเหตุการณ์ `agent` แบบ streamed และผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcasts `plugin.*` ที่ Plugin กำหนด** ถูกจำกัดไว้ที่ `operator.write` หรือ `operator.admin` ขึ้นอยู่กับวิธีที่ Plugin ลงทะเบียนไว้
- **เหตุการณ์ status และ transport** (`heartbeat`, `presence`, `tick`, lifecycle connect/disconnect เป็นต้น) ยังคงไม่ถูกจำกัด เพื่อให้ทุกเซสชันที่ยืนยันตัวตนแล้วสังเกตสุขภาพของ transport ได้
- **ตระกูลเหตุการณ์ broadcast ที่ไม่รู้จัก** ถูกจำกัดด้วย scope ตามค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนจะผ่อนคลายอย่างชัดเจน

การเชื่อมต่อไคลเอนต์แต่ละรายการเก็บหมายเลขลำดับต่อไคลเอนต์ของตนเอง เพื่อให้ broadcasts รักษาลำดับแบบเพิ่มขึ้นทางเดียวบน socket นั้น แม้เมื่อไคลเอนต์ต่างกันเห็น subset ของ event stream ที่ถูกกรองด้วย scope ต่างกัน

## ตระกูลเมธอด RPC ทั่วไป

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ด้านบน นี่
ไม่ใช่ dump ที่สร้างขึ้น — `hello-ok.features.methods` เป็นรายการ discovery แบบอนุรักษ์นิยม
ที่สร้างจาก `src/gateway/server-methods-list.ts` รวมกับ exports ของเมธอด
plugin/channel ที่โหลดแล้ว ให้ถือว่าเป็น feature discovery ไม่ใช่การแจกแจงทั้งหมด
ของ `src/gateway/server-methods/*.ts`

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` ส่งคืน snapshot สุขภาพของ gateway ที่แคชไว้หรือเพิ่ง probe ใหม่
    - `diagnostics.stability` ส่งคืนตัวบันทึกเสถียรภาพ diagnostic แบบจำกัดล่าสุด โดยเก็บ metadata ด้านการปฏิบัติงาน เช่น ชื่อเหตุการณ์, จำนวน, ขนาด byte, ค่าหน่วยความจำ, สถานะคิว/เซสชัน, ชื่อ channel/plugin และ session ids โดยไม่เก็บข้อความ chat, webhook bodies, tool outputs, request หรือ response bodies ดิบ, tokens, cookies หรือค่าลับ ต้องใช้ scope operator read
    - `status` ส่งคืนสรุป gateway แบบ `/status`; ฟิลด์ที่ละเอียดอ่อนจะรวมเฉพาะสำหรับไคลเอนต์ operator ที่มี scope admin
    - `gateway.identity.get` ส่งคืน device identity ของ gateway ที่ใช้โดย flow relay และ pairing
    - `system-presence` ส่งคืน snapshot presence ปัจจุบันสำหรับอุปกรณ์ operator/node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่ม system event และสามารถอัปเดต/broadcast context ของ presence
    - `last-heartbeat` ส่งคืนเหตุการณ์ heartbeat ล่าสุดที่ persist แล้ว
    - `set-heartbeats` เปิด/ปิดการประมวลผล heartbeat บน gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแค็ตตาล็อกโมเดลที่รันไทม์อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าแล้วในขนาดเหมาะกับตัวเลือก (`agents.defaults.models` ก่อน แล้วตามด้วย `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแค็ตตาล็อกแบบเต็ม
    - `usage.status` ส่งคืนหน้าต่างการใช้งานของผู้ให้บริการ/สรุปโควตาคงเหลือ
    - `usage.cost` ส่งคืนสรุปการใช้งานค่าใช้จ่ายแบบรวมสำหรับช่วงวันที่
    - `doctor.memory.status` ส่งคืนความพร้อมของ vector-memory / cached embedding สำหรับ workspace ของเอเจนต์ค่าเริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจน
    - `doctor.memory.remHarness` ส่งคืนตัวอย่าง REM harness แบบจำกัดขอบเขตและอ่านอย่างเดียวสำหรับไคลเอนต์ control-plane ระยะไกล อาจรวม path ของ workspace, memory snippet, markdown ที่เรนเดอร์พร้อมหลักฐานอ้างอิง และ candidate สำหรับ deep promotion ดังนั้นผู้เรียกจึงต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานราย session
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบ timeseries สำหรับหนึ่ง session
    - `sessions.usage.logs` ส่งคืนรายการ log การใช้งานสำหรับหนึ่ง session

  </Accordion>

  <Accordion title="ช่องทางและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะช่องทาง/Plugin แบบ built-in + bundled
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีเฉพาะเมื่อช่องทางรองรับการออกจากระบบ
    - `web.login.start` เริ่ม flow เข้าสู่ระบบแบบ QR/web สำหรับผู้ให้บริการช่องทาง web ปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้ flow เข้าสู่ระบบแบบ QR/web นั้นเสร็จสิ้น และเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง Node iOS ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืน trigger wake-word ที่จัดเก็บไว้
    - `voicewake.set` อัปเดต trigger wake-word และ broadcast การเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การส่งข้อความและ log">
    - `send` คือ RPC สำหรับส่งออกโดยตรงไปยังช่องทาง/บัญชี/thread นอก chat runner
    - `logs.tail` ส่งคืน tail ของ file-log Gateway ที่กำหนดค่าไว้ พร้อมตัวควบคุม cursor/limit และ max-byte

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.config` ส่งคืน payload การกำหนดค่า Talk ที่มีผลอยู่; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.mode` ตั้งค่า/broadcast สถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.speak` สังเคราะห์เสียงผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะการเปิดใช้ TTS, ผู้ให้บริการที่ใช้งานอยู่, ผู้ให้บริการ fallback และสถานะการกำหนดค่าผู้ให้บริการ
    - `tts.providers` ส่งคืน inventory ผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะ prefs ของ TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` รันการแปลง text-to-speech แบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ การกำหนดค่า การอัปเดต และ wizard">
    - `secrets.reload` resolve SecretRefs ที่ใช้งานอยู่ใหม่ และสลับสถานะ secret ของรันไทม์เฉพาะเมื่อสำเร็จครบถ้วน
    - `secrets.resolve` resolve การกำหนด secret เป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายเฉพาะ
    - `config.get` ส่งคืน snapshot และ hash ของการกำหนดค่าปัจจุบัน
    - `config.set` เขียน payload การกำหนดค่าที่ผ่านการตรวจสอบแล้ว
    - `config.patch` รวมการอัปเดตการกำหนดค่าบางส่วน
    - `config.apply` ตรวจสอบ + แทนที่ payload การกำหนดค่าเต็ม
    - `config.schema` ส่งคืน payload schema การกำหนดค่าแบบสดที่ Control UI และเครื่องมือ CLI ใช้: schema, `uiHints`, version และ metadata การสร้าง รวมถึง metadata schema ของ Plugin + ช่องทางเมื่อรันไทม์โหลดได้ schema รวม metadata ฟิลด์ `title` / `description` ที่ได้จาก label และข้อความช่วยเหลือชุดเดียวกับที่ UI ใช้ รวมถึง object ซ้อน, wildcard, array-item และ branch ของ composition `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืน payload lookup ตามขอบเขต path สำหรับ config path หนึ่งรายการ: path ที่ normalize แล้ว, schema node แบบตื้น, hint ที่ตรงกัน + `hintPath` และสรุปลูกโดยตรงสำหรับการเจาะลึกใน UI/CLI node ของ lookup schema ยังคงเอกสารที่แสดงต่อผู้ใช้และฟิลด์ validation ทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขต numeric/string/array/object และ flag เช่น `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกแสดง `key`, `path` ที่ normalize แล้ว, `type`, `required`, `hasChildren` รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รัน flow อัปเดต Gateway และกำหนดเวลา restart เฉพาะเมื่อการอัปเดตสำเร็จเอง การอัปเดตผ่าน package-manager บังคับ restart การอัปเดตแบบไม่ defer และไม่มี cooldown หลังจากสลับ package เพื่อให้ process Gateway เก่าไม่ lazy-load ต่อจาก tree `dist` ที่ถูกแทนที่แล้ว
    - `update.status` ส่งคืน sentinel restart การอัปเดตที่ cache ล่าสุด รวมถึง version ที่รันหลัง restart เมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผย onboarding wizard ผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วยเอเจนต์และ workspace">
    - `agents.list` ส่งคืนรายการเอเจนต์ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลและ runtime metadata
    - `agents.create`, `agents.update` และ `agents.delete` จัดการระเบียนเอเจนต์และการเชื่อม wiring ของ workspace
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการไฟล์ bootstrap workspace ที่เปิดเผยสำหรับเอเจนต์
    - `artifacts.list`, `artifacts.get` และ `artifacts.download` เปิดเผยสรุป artifact ที่ได้จาก transcript และการดาวน์โหลดสำหรับขอบเขต `sessionKey`, `runId` หรือ `taskId` ที่ระบุชัดเจน query ของ run และ task จะ resolve session เจ้าของฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อ transcript ที่มี provenance ตรงกัน แหล่ง URL ที่ไม่ปลอดภัยหรือเป็น local จะส่งคืนการดาวน์โหลดแบบไม่รองรับแทนการ fetch ฝั่งเซิร์ฟเวอร์
    - `agent.identity.get` ส่งคืน identity ของผู้ช่วยที่มีผลสำหรับเอเจนต์หรือ session
    - `agent.wait` รอให้ run เสร็จสิ้นและส่งคืน terminal snapshot เมื่อมี

  </Accordion>

  <Accordion title="การควบคุม session">
    - `sessions.list` ส่งคืนดัชนี session ปัจจุบัน รวมถึง metadata `agentRuntime` ต่อแถวเมื่อมีการกำหนดค่า backend runtime ของเอเจนต์
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการ subscribe event การเปลี่ยนแปลง session สำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการ subscribe event transcript/message สำหรับหนึ่ง session
    - `sessions.preview` ส่งคืนตัวอย่าง transcript แบบจำกัดขอบเขตสำหรับ session key ที่ระบุ
    - `sessions.resolve` resolve หรือ canonicalize เป้าหมาย session
    - `sessions.create` สร้างรายการ session ใหม่
    - `sessions.send` ส่งข้อความเข้าไปยัง session ที่มีอยู่
    - `sessions.steer` คือ variant แบบ interrupt-and-steer สำหรับ session ที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับ session ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่ไม่บังคับ หรือส่ง `runId` เพียงอย่างเดียวสำหรับ run ที่ใช้งานอยู่ซึ่ง Gateway สามารถ resolve เป็น session ได้
    - `sessions.patch` อัปเดต metadata/override ของ session และรายงานโมเดล canonical ที่ resolve แล้วพร้อม `agentRuntime` ที่มีผล
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ทำการบำรุงรักษา session
    - `sessions.get` ส่งคืนแถว session ที่จัดเก็บไว้ทั้งหมด
    - การประมวลผล chat ยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` `chat.history` ถูก normalize สำหรับการแสดงผลให้ไคลเอนต์ UI: directive tag แบบ inline จะถูกตัดออกจากข้อความที่มองเห็น, payload XML ของ tool-call แบบ plain-text (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูก truncate) และ token ควบคุมโมเดล ASCII/full-width ที่รั่วไหลจะถูกตัดออก, แถว assistant ที่เป็น silent-token ล้วน เช่น `NO_REPLY` / `no_reply` แบบตรงทั้งหมดจะถูกละไว้ และแถวที่มีขนาดใหญ่เกินไปอาจถูกแทนที่ด้วย placeholder

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และ token อุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วทั้งที่รออนุมัติและอนุมัติแล้ว
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` rotate token อุปกรณ์ที่จับคู่แล้วภายในขอบเขต role ที่อนุมัติและขอบเขตผู้เรียก
    - `device.token.revoke` revoke token อุปกรณ์ที่จับคู่แล้วภายในขอบเขต role ที่อนุมัติและขอบเขตผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่ Node, invoke และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` และ `node.pair.verify` ครอบคลุมการจับคู่ Node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` ส่งคืนสถานะ Node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดต label ของ Node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง Node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอ invoke
    - `node.event` นำ event ที่มาจาก Node กลับเข้าไปใน Gateway
    - `node.canvas.capability.refresh` refresh token canvas-capability ตามขอบเขต
    - `node.pending.pull` และ `node.pending.ack` คือ API คิวของ Node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบ durable สำหรับ Node ที่ offline/ตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="กลุ่มการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการ lookup/replay การอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการและส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อ timeout)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการ snapshot นโยบายการอนุมัติ exec ของ Gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec แบบ local ของ Node ผ่านคำสั่ง relay ของ Node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุม flow การอนุมัติที่ Plugin กำหนด

  </Accordion>

  <Accordion title="Automation, Skills และเครื่องมือ">
    - Automation: `wake` กำหนดเวลาการ inject ข้อความ wake ทันทีหรือใน Heartbeat ถัดไป; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานตามกำหนดเวลา
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### กลุ่ม event ทั่วไป

- `chat`: การอัปเดต chat ของ UI เช่น `chat.inject` และ event chat อื่นที่มีเฉพาะ transcript
- `session.message` และ `session.tool`: การอัปเดต transcript/event-stream สำหรับ session ที่ subscribe แล้ว
- `sessions.changed`: ดัชนี session หรือ metadata เปลี่ยนแปลง
- `presence`: การอัปเดต snapshot presence ของระบบ
- `tick`: event keepalive / liveness เป็นระยะ
- `health`: การอัปเดต snapshot health ของ Gateway
- `heartbeat`: การอัปเดต event stream ของ Heartbeat
- `cron`: event การเปลี่ยนแปลง run/job ของ Cron
- `shutdown`: การแจ้งปิด Gateway
- `node.pair.requested` / `node.pair.resolved`: lifecycle การจับคู่ Node
- `node.invoke.request`: broadcast คำขอ invoke ของ Node
- `device.pair.requested` / `device.pair.resolved`: lifecycle ของอุปกรณ์ที่จับคู่แล้ว
- `voicewake.changed`: การกำหนดค่า trigger wake-word เปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: lifecycle การอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: lifecycle การอนุมัติ Plugin

### เมธอดตัวช่วยของ Node

- Node อาจเรียก `skills.bins` เพื่อ fetch รายการปัจจุบันของ executable ของ skill สำหรับการตรวจสอบ auto-allow

### เมธอดตัวช่วยของ operator

- ผู้ปฏิบัติงานสามารถเรียก `commands.list` (`operator.read`) เพื่อดึงคลังคำสั่ง runtime สำหรับ agent ได้
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่าน workspace ของ agent เริ่มต้น
  - `scope` ควบคุมว่า `name` หลักจะชี้ไปยังพื้นผิวใด:
    - `text` คืนค่า token คำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางเริ่มต้น `both` คืนค่าชื่อ native ที่รับรู้ provider
      เมื่อมีให้ใช้
  - `textAliases` มี alias แบบ slash ที่ตรงตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่ง native ที่รับรู้ provider เมื่อมีอยู่
  - `provider` เป็นตัวเลือก และมีผลเฉพาะกับการตั้งชื่อ native รวมถึงความพร้อมใช้งานของคำสั่ง Plugin native
  - `includeArgs=false` ละเว้น metadata ของอาร์กิวเมนต์แบบ serialized จากการตอบกลับ
- ผู้ปฏิบัติงานสามารถเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือ runtime สำหรับ
  agent ได้ การตอบกลับมีเครื่องมือที่จัดกลุ่มแล้วและ metadata แหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ plugin เมื่อ `source="plugin"`
  - `optional`: ระบุว่าเครื่องมือของ plugin เป็นตัวเลือกหรือไม่
- ผู้ปฏิบัติงานสามารถเรียก `tools.effective` (`operator.read`) เพื่อดึงคลังเครื่องมือที่มีผลใน runtime
  สำหรับ session ได้
  - ต้องมี `sessionKey`
  - Gateway อนุมานบริบท runtime ที่เชื่อถือได้จาก session ฝั่งเซิร์ฟเวอร์ แทนการยอมรับ
    auth หรือบริบทการส่งมอบที่ผู้เรียกส่งมา
  - การตอบกลับจำกัดตาม session และสะท้อนสิ่งที่บทสนทนาที่ใช้งานอยู่สามารถใช้ได้ในตอนนี้
    รวมถึงเครื่องมือ core, plugin และ channel
- ผู้ปฏิบัติงานสามารถเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือที่มีอยู่หนึ่งรายการผ่าน
  เส้นทางนโยบาย Gateway เดียวกับ `/tools/invoke`
  - ต้องมี `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ
    `idempotencyKey` เป็นตัวเลือก
  - หากมีทั้ง `sessionKey` และ `agentId` agent ของ session ที่ resolve แล้วต้องตรงกับ
    `agentId`
  - การตอบกลับเป็น envelope สำหรับ SDK โดยมีฟิลด์ `ok`, `toolName`, `output` ที่เป็นตัวเลือก และ
    `error` แบบ typed การอนุมัติหรือการปฏิเสธตามนโยบายจะคืนค่า `ok:false` ใน payload แทนที่จะ
    ข้าม pipeline นโยบายเครื่องมือของ Gateway
- ผู้ปฏิบัติงานสามารถเรียก `skills.status` (`operator.read`) เพื่อดึงคลัง
  skill ที่มองเห็นได้สำหรับ agent
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่าน workspace ของ agent เริ่มต้น
  - การตอบกลับมี eligibility, requirements ที่ขาดหาย, การตรวจ config และ
    ตัวเลือกการติดตั้งที่ sanitize แล้วโดยไม่เปิดเผยค่า secret ดิบ
- ผู้ปฏิบัติงานสามารถเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ
  metadata การค้นพบของ ClawHub
- ผู้ปฏิบัติงานสามารถเรียก `skills.install` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้ง
    โฟลเดอร์ skill ลงในไดเรกทอรี `skills/` ของ workspace agent เริ่มต้น
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    รัน action `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ Gateway
- ผู้ปฏิบัติงานสามารถเรียก `skills.update` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามหนึ่งรายการ หรือการติดตั้ง ClawHub ที่ติดตามทั้งหมดใน
    workspace agent เริ่มต้น
  - โหมด Config patch ค่า `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` ยอมรับพารามิเตอร์ `view` ที่เป็นตัวเลือก:

- ละไว้หรือ `"default"`: พฤติกรรม runtime ปัจจุบัน หากกำหนดค่า `agents.defaults.models` ไว้ การตอบกลับคือแค็ตตาล็อกที่อนุญาต; มิฉะนั้นการตอบกลับคือแค็ตตาล็อก Gateway แบบเต็ม
- `"configured"`: พฤติกรรมขนาดเท่า picker หากกำหนดค่า `agents.defaults.models` ไว้ ค่านั้นยังคงมีผลเหนือกว่า มิฉะนั้นการตอบกลับใช้รายการ `models.providers.*.models` ที่ระบุไว้อย่างชัดเจน โดย fallback ไปยังแค็ตตาล็อกเต็มเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แค็ตตาล็อก Gateway แบบเต็ม โดยข้าม `agents.defaults.models` ใช้สำหรับ UI การวินิจฉัยและการค้นพบ ไม่ใช่ picker โมเดลทั่วไป

## การอนุมัติ exec

- เมื่อคำขอ exec ต้องได้รับการอนุมัติ Gateway จะ broadcast `exec.approval.requested`
- client ฝั่งผู้ปฏิบัติงาน resolve โดยเรียก `exec.approval.resolve` (ต้องมี scope `operator.approvals`)
- สำหรับ `host=node` คำขอ `exec.approval.request` ต้องมี `systemRunPlan` (metadata `argv`/`cwd`/`rawCommand`/session แบบ canonical) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังการอนุมัติ การเรียก `node.invoke system.run` ที่ forward ไปจะใช้ `systemRunPlan` แบบ canonical นั้นซ้ำ
  เป็นบริบท command/cwd/session ที่มีอำนาจกำหนด
- หากผู้เรียก mutate `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่างการเตรียมและการ forward `system.run` ขั้นสุดท้ายที่ได้รับอนุมัติแล้ว
  Gateway จะปฏิเสธการรันแทนที่จะเชื่อถือ payload ที่ถูก mutate

## fallback การส่งมอบของ agent

- คำขอ `agent` สามารถใส่ `deliver=true` เพื่อขอการส่งมอบขาออก
- `bestEffortDeliver=false` คงพฤติกรรมแบบเข้มงวด: เป้าหมายการส่งมอบที่ resolve ไม่ได้หรือเป็น internal-only จะคืนค่า `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback เป็นการดำเนินการเฉพาะ session เมื่อไม่สามารถ resolve route ที่ส่งมอบภายนอกได้ (เช่น session internal/webchat หรือ config หลาย channel ที่กำกวม)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema/protocol-schemas.ts`
- client ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธกรณีไม่ตรงกัน
- schema + model สร้างจาก definition ของ TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของ client

client อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าเหล่านี้
คงที่ตลอด protocol v3 และเป็น baseline ที่คาดหวังสำหรับ client บุคคลที่สาม

| ค่าคงที่                                  | ค่าเริ่มต้น                                               | แหล่งที่มา                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| timeout ของคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| timeout ของ preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่ม budget server/client ที่จับคู่กันได้) |
| backoff การ reconnect เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| backoff การ reconnect สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp fast-retry หลัง device-token close | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ช่วง grace ของ force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| timeout เริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| การ close จาก tick-timeout                        | code `4000` เมื่อ silence เกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศค่า `policy.tickIntervalMs`, `policy.maxPayload`,
และ `policy.maxBufferedBytes` ที่มีผลจริงใน `hello-ok`; client ควรเคารพค่าเหล่านั้น
แทนค่าเริ่มต้นก่อน handshake

## Auth

- การยืนยันตัวตน Gateway ด้วยความลับร่วมใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมดการยืนยันตัวตนที่กำหนดค่าไว้
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ non-loopback
  `gateway.auth.mode: "trusted-proxy"` จะผ่านการตรวจสอบยืนยันตัวตนของ connect จาก
  ส่วนหัวคำขอแทน `connect.params.auth.*`
- `gateway.auth.mode: "none"` สำหรับทางเข้าแบบส่วนตัวจะข้ามการยืนยันตัวตน connect
  ด้วยความลับร่วมทั้งหมด ห้ามเปิดโหมดนั้นบนทางเข้าสาธารณะหรือที่ไม่น่าเชื่อถือ
- หลังจากจับคู่แล้ว Gateway จะออก **โทเค็นอุปกรณ์** ที่จำกัดขอบเขตตาม role +
  scopes ของการเชื่อมต่อ โดยจะส่งกลับใน `hello-ok.auth.deviceToken` และไคลเอนต์ควร
  บันทึกไว้สำหรับการเชื่อมต่อครั้งต่อไป
- ไคลเอนต์ควรบันทึก `hello-ok.auth.deviceToken` หลักหลังจากการเชื่อมต่อสำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วยโทเค็นอุปกรณ์ที่ **บันทึกไว้** ควรใช้ชุด scope ที่อนุมัติแล้ว
  ซึ่งบันทึกไว้สำหรับโทเค็นนั้นด้วย วิธีนี้จะรักษาสิทธิ์เข้าถึง read/probe/status
  ที่ได้รับอนุญาตแล้ว และหลีกเลี่ยงการยุบการเชื่อมต่อใหม่โดยไม่แจ้งให้เหลือเพียง
  scope แบบ admin เท่านั้นที่แคบกว่าโดยนัย
- การประกอบการยืนยันตัวตน connect ฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` แยกเป็นอิสระและจะถูกส่งต่อเสมอเมื่อตั้งค่าไว้
  - `auth.token` ถูกเติมตามลำดับความสำคัญ: โทเค็นร่วมที่ระบุชัดเจนก่อน จากนั้นเป็น
    `deviceToken` ที่ระบุชัดเจน แล้วจึงเป็นโทเค็นต่ออุปกรณ์ที่บันทึกไว้ (ผูกคีย์ด้วย
    `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อรายการข้างต้นไม่สามารถหา `auth.token`
    ได้ โทเค็นร่วมหรือโทเค็นอุปกรณ์ใดๆ ที่หาได้จะระงับการส่งค่านี้
  - การเลื่อนระดับอัตโนมัติของโทเค็นอุปกรณ์ที่บันทึกไว้ในการลองซ้ำแบบครั้งเดียว
    `AUTH_TOKEN_MISMATCH` ถูกจำกัดให้ใช้กับ **endpoint ที่เชื่อถือได้เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบปักหมุดไว้ `wss://`
    สาธารณะที่ไม่มีการปักหมุดจะไม่เข้าเกณฑ์
- รายการ `hello-ok.auth.deviceTokens` เพิ่มเติมคือโทเค็นส่งต่อ bootstrap
  ให้บันทึกเฉพาะเมื่อการเชื่อมต่อใช้การยืนยันตัวตน bootstrap บนทรานสปอร์ตที่เชื่อถือได้
  เช่น `wss://` หรือการจับคู่ผ่าน loopback/local
- หากไคลเอนต์ส่ง `deviceToken` หรือ `scopes` แบบ **ระบุชัดเจน** ชุด scope
  ที่ผู้เรียกขอยังคงเป็นแหล่งอ้างอิงหลัก scope ที่แคชไว้จะถูกใช้ซ้ำเฉพาะเมื่อไคลเอนต์
  ใช้โทเค็นต่ออุปกรณ์ที่บันทึกไว้เท่านั้น
- โทเค็นอุปกรณ์สามารถหมุนเวียน/เพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องมี scope `operator.pairing`)
- `device.token.rotate` ส่งคืนข้อมูลเมตาการหมุนเวียน โดยจะสะท้อนโทเค็น bearer
  ที่ใช้แทนกลับมาเฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ยืนยันตัวตนด้วยโทเค็นอุปกรณ์นั้นอยู่แล้ว
  เพื่อให้ไคลเอนต์ที่ใช้เฉพาะโทเค็นสามารถบันทึกโทเค็นทดแทนก่อนเชื่อมต่อใหม่ได้
  การหมุนเวียนแบบ shared/admin จะไม่สะท้อนโทเค็น bearer กลับมา
- การออกโทเค็น การหมุนเวียน และการเพิกถอนจะถูกจำกัดอยู่ในชุด role ที่อนุมัติแล้ว
  ซึ่งบันทึกไว้ในรายการจับคู่ของอุปกรณ์นั้น การแก้ไขโทเค็นไม่สามารถขยายหรือกำหนดเป้าหมาย
  role ของอุปกรณ์ที่การอนุมัติการจับคู่ไม่เคยให้ไว้
- สำหรับเซสชันโทเค็นของอุปกรณ์ที่จับคู่แล้ว การจัดการอุปกรณ์จะจำกัดอยู่กับตนเอง
  เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย ผู้เรียกที่ไม่ใช่ admin สามารถลบ/เพิกถอน/หมุนเวียน
  ได้เฉพาะรายการอุปกรณ์ **ของตนเอง** เท่านั้น
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุด scope
  ของโทเค็น operator เป้าหมายเทียบกับ scope เซสชันปัจจุบันของผู้เรียก ผู้เรียกที่ไม่ใช่
  admin ไม่สามารถหมุนเวียนหรือเพิกถอนโทเค็น operator ที่กว้างกว่าที่ตนถืออยู่แล้วได้
- ความล้มเหลวในการยืนยันตัวตนมี `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (บูลีน)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลองซ้ำหนึ่งครั้งแบบมีขอบเขตด้วยโทเค็นต่ออุปกรณ์ที่แคชไว้
  - หากการลองซ้ำนั้นล้มเหลว ไคลเอนต์ควรหยุดลูปการเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำการดำเนินการสำหรับ operator

## ตัวตนอุปกรณ์ + การจับคู่

- Node ควรมีตัวตนอุปกรณ์ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  ลายนิ้วมือของคู่กุญแจ
- Gateway ออกโทเค็นตามอุปกรณ์ + role
- ต้องมีการอนุมัติการจับคู่สำหรับ ID อุปกรณ์ใหม่ เว้นแต่เปิดใช้การอนุมัติอัตโนมัติแบบ local
- การอนุมัติอัตโนมัติของการจับคู่มีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่แคบสำหรับ
  โฟลว์ตัวช่วยความลับร่วมที่เชื่อถือได้
- การเชื่อมต่อ tailnet หรือ LAN บนโฮสต์เดียวกันยังคงถูกถือว่าเป็นรีโมตสำหรับการจับคู่และ
  ต้องได้รับการอนุมัติ
- โดยปกติไคลเอนต์ WS จะส่งตัวตน `device` ระหว่าง `connect` (operator +
  node) ข้อยกเว้นของ operator ที่ไม่มีอุปกรณ์มีเฉพาะเส้นทางความเชื่อถือที่ระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP ที่ไม่ปลอดภัยเฉพาะ localhost
  - การยืนยันตัวตน Control UI ของ operator ด้วย `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
  - RPC backend ของ `gateway-client` ผ่าน direct-loopback ที่ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน Gateway ร่วม
- การเชื่อมต่อทั้งหมดต้องลงนาม nonce `connect.challenge` ที่เซิร์ฟเวอร์ให้มา

### การวินิจฉัยการย้ายระบบการยืนยันตัวตนอุปกรณ์

สำหรับไคลเอนต์เดิมที่ยังใช้พฤติกรรมการลงนามก่อนมี challenge ตอนนี้ `connect` จะส่งคืน
รหัสรายละเอียด `DEVICE_AUTH_*` ใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวทั่วไปในการย้ายระบบ:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ละเว้น `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่า/ผิด               |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | เพย์โหลดลายเซ็นไม่ตรงกับเพย์โหลด v2               |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | เวลาที่ลงนามอยู่นอกช่วงคลาดเคลื่อนที่อนุญาต      |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับลายนิ้วมือของกุญแจสาธารณะ |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/การทำให้เป็นมาตรฐานของกุญแจสาธารณะล้มเหลว |

เป้าหมายการย้ายระบบ:

- รอ `connect.challenge` เสมอ
- ลงนามเพย์โหลด v2 ที่มี nonce จากเซิร์ฟเวอร์
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- เพย์โหลดลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` เดิมยังคงยอมรับเพื่อความเข้ากันได้ แต่การปักหมุดข้อมูลเมตาของอุปกรณ์ที่จับคู่แล้ว
  ยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + การปักหมุด

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์อาจเลือกปักหมุดลายนิ้วมือใบรับรอง Gateway ได้ (ดูการกำหนดค่า `gateway.tls`
  พร้อม `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **API Gateway แบบเต็ม** (status, channels, models, chat,
agent, sessions, nodes, approvals ฯลฯ) พื้นผิวที่แน่นอนถูกกำหนดโดย
สกีมา TypeBox ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [Runbook ของ Gateway](/th/gateway)
