---
read_when:
    - การพัฒนาหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือการเชื่อมต่อล้มเหลว
    - กำลังสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: แฮนด์เชค, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-05-10T19:39:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

โปรโตคอล WS ของ Gateway คือ **control plane เดียว + การขนส่งของโหนด** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, UI เว็บ, แอป macOS, โหนด iOS/Android, โหนดแบบ headless)
เชื่อมต่อผ่าน WebSocket และประกาศ **role** + **scope** ของตนในช่วง
handshake

## การขนส่ง

- WebSocket, เฟรมข้อความพร้อม payload แบบ JSON
- เฟรมแรก **ต้อง** เป็นคำขอ `connect`
- เฟรมก่อนเชื่อมต่อถูกจำกัดไว้ที่ 64 KiB หลัง handshake สำเร็จ ไคลเอนต์
  ควรปฏิบัติตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้การวินิจฉัย
  เฟรมขาเข้าที่มีขนาดใหญ่เกินไปและบัฟเฟอร์ขาออกที่ช้าจะปล่อยเหตุการณ์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้งเฟรมที่ได้รับผลกระทบ เหตุการณ์เหล่านี้เก็บ
  ขนาด, ขีดจำกัด, พื้นผิว, และรหัสเหตุผลที่ปลอดภัย โดยไม่เก็บเนื้อความของข้อความ
  เนื้อหาไฟล์แนบ, เนื้อความเฟรมดิบ, token, cookie, หรือค่าลับ

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

ขณะที่ Gateway ยังเริ่ม sidecar ตอนสตาร์ทไม่เสร็จ คำขอ `connect` อาจ
ส่งคืนข้อผิดพลาด `UNAVAILABLE` ที่ retry ได้ โดยตั้งค่า `details.reason` เป็น
`"startup-sidecars"` พร้อม `retryAfterMs` ไคลเอนต์ควร retry การตอบกลับนั้น
ภายในงบเวลาการเชื่อมต่อโดยรวม แทนที่จะแสดงเป็นความล้มเหลวของ
handshake ขั้นสุดท้าย

`server`, `features`, `snapshot`, และ `policy` เป็นค่าที่ schema
(`src/gateway/protocol/schema/frames.ts`) กำหนดว่าต้องมีทั้งหมด `auth` ก็จำเป็นเช่นกันและรายงาน
role/scopes ที่เจรจาได้ `pluginSurfaceUrls` เป็นตัวเลือกและแมปชื่อพื้นผิว Plugin
เช่น `canvas` ไปยัง URL ที่โฮสต์แบบมี scope

URL พื้นผิว Plugin แบบมี scope อาจหมดอายุได้ โหนดสามารถเรียก
`node.pluginSurface.refresh` พร้อม `{ "surface": "canvas" }` เพื่อรับรายการใหม่
ใน `pluginSurfaceUrls` การปรับโครงสร้าง Plugin Canvas เชิงทดลองไม่รองรับ
เส้นทางความเข้ากันได้ที่เลิกใช้แล้วอย่าง `canvasHostUrl`, `canvasCapability`, หรือ
`node.canvas.capability.refresh`; ไคลเอนต์ native และ gateway ปัจจุบันต้องใช้พื้นผิว Plugin

เมื่อไม่มีการออก token ของอุปกรณ์ `hello-ok.auth` จะรายงานสิทธิ์ที่เจรจาได้
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
`client.mode: "backend"`) อาจละเว้น `device` บนการเชื่อมต่อ loopback โดยตรงเมื่อ
authenticate ด้วย token/password ของ gateway ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้สำหรับ
RPC ของ control-plane ภายใน และป้องกัน baseline การจับคู่ CLI/อุปกรณ์ที่ล้าสมัย
ไม่ให้บล็อกงาน backend ในเครื่อง เช่น การอัปเดตเซสชัน subagent ไคลเอนต์ระยะไกล,
ไคลเอนต์จาก origin ของเบราว์เซอร์, ไคลเอนต์โหนด, และไคลเอนต์ device-token/device-identity
แบบชัดเจนยังคงใช้การตรวจสอบการจับคู่และการยกระดับ scope ตามปกติ

เมื่อมีการออก token ของอุปกรณ์ `hello-ok` จะรวมสิ่งนี้ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ระหว่างการส่งต่อ bootstrap ที่เชื่อถือได้ `hello-ok.auth` อาจรวมรายการ role
แบบจำกัดเพิ่มเติมใน `deviceTokens` ด้วย:

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

สำหรับ flow bootstrap โหนด/operator ในตัว token โหนดหลักจะคงเป็น
`scopes: []` และ token operator ที่ถูกส่งต่อจะยังถูกจำกัดอยู่ใน allowlist ของ
operator สำหรับ bootstrap (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจสอบ scope ของ bootstrap ยังคง
มี prefix ตาม role: รายการ operator จะตอบสนองเฉพาะคำขอ operator เท่านั้น และ role ที่ไม่ใช่ operator
ยังต้องมี scope ภายใต้ prefix role ของตนเอง

### ตัวอย่างโหนด

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

## การจัดเฟรม

- **คำขอ**: `{type:"req", id, method, params}`
- **การตอบกลับ**: `{type:"res", id, ok, payload|error}`
- **เหตุการณ์**: `{type:"event", event, payload, seq?, stateVersion?}`

เมธอดที่มี side effect ต้องใช้ **idempotency keys** (ดู schema)

## Roles + scopes

สำหรับโมเดล scope ของ operator แบบเต็ม การตรวจสอบในเวลาที่อนุมัติ และ semantics ของ shared-secret
ให้ดู [scope ของ Operator](/th/gateway/operator-scopes)

### Roles

- `operator` = ไคลเอนต์ control plane (CLI/UI/automation)
- `node` = โฮสต์ความสามารถ (camera/screen/canvas/system.run)

### Scopes (operator)

scope ทั่วไป:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` พร้อม `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)

เมธอด RPC ของ gateway ที่ Plugin ลงทะเบียนอาจขอ scope operator ของตนเองได้ แต่
prefix admin หลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะ resolve เป็น `operator.admin` เสมอ

scope ของเมธอดเป็นเพียงด่านแรกเท่านั้น slash command บางรายการที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจสอบระดับคำสั่งที่เข้มงวดกว่าเพิ่มเติม ตัวอย่างเช่น การเขียน
`/config set` และ `/config unset` แบบถาวรต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบ scope เพิ่มเติมในเวลาที่อนุมัติ นอกเหนือจาก
scope พื้นฐานของเมธอด:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มีคำสั่งโหนดที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่มี `system.run`, `system.run.prepare`, หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

โหนดประกาศการอ้างสิทธิ์ความสามารถในเวลาที่เชื่อมต่อ:

- `caps`: หมวดหมู่ความสามารถระดับสูง เช่น `camera`, `canvas`, `screen`,
  `location`, `voice`, และ `talk`
- `commands`: allowlist ของคำสั่งสำหรับ invoke
- `permissions`: toggle แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือสิ่งเหล่านี้เป็น **การอ้างสิทธิ์** และบังคับใช้ allowlist ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` ส่งคืนรายการที่ key ตามตัวตนอุปกรณ์
- รายการ Presence รวม `deviceId`, `roles`, และ `scopes` เพื่อให้ UI แสดงแถวเดียวต่ออุปกรณ์ได้
  แม้ว่าจะเชื่อมต่อเป็นทั้ง **operator** และ **node**
- `node.list` รวมฟิลด์ตัวเลือก `lastSeenAtMs` และ `lastSeenReason` โหนดที่เชื่อมต่อจะรายงาน
  เวลาเชื่อมต่อปัจจุบันเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; โหนดที่จับคู่แล้วอาจรายงาน
  Presence เบื้องหลังแบบ durable ได้เช่นกันเมื่อเหตุการณ์โหนดที่เชื่อถือได้อัปเดต metadata การจับคู่

### เหตุการณ์ alive เบื้องหลังของโหนด

โหนดอาจเรียก `node.event` พร้อม `event: "node.presence.alive"` เพื่อบันทึกว่าโหนดที่จับคู่แล้ว
ยัง alive ระหว่างการ wake เบื้องหลังโดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น enum แบบปิด: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, หรือ `connect` สตริง trigger ที่ไม่รู้จักจะถูก normalize เป็น
`background` โดย gateway ก่อน persistence เหตุการณ์จะ durable เฉพาะสำหรับเซสชันอุปกรณ์โหนด
ที่ authenticate แล้วเท่านั้น; เซสชันที่ไม่มีอุปกรณ์หรือไม่ได้จับคู่จะส่งคืน `handled: false`

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
RPC ที่ได้รับการยืนยันแล้ว ไม่ใช่ persistence ของ Presence แบบ durable

## การกำหนด scope ของเหตุการณ์ broadcast

เหตุการณ์ broadcast ของ WebSocket ที่เซิร์ฟเวอร์ push จะถูก gate ด้วย scope เพื่อให้เซสชันที่มี scope สำหรับการจับคู่หรือเซสชันเฉพาะโหนดไม่รับเนื้อหาเซสชันแบบ passive

- **เฟรม chat, agent, และ tool-result** (รวมถึงเหตุการณ์ `agent` แบบ streamed และผลลัพธ์การเรียก tool) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcast `plugin.*` ที่ Plugin กำหนด** จะถูก gate ไปยัง `operator.write` หรือ `operator.admin` ขึ้นอยู่กับวิธีที่ Plugin ลงทะเบียนไว้
- **เหตุการณ์สถานะและการขนส่ง** (`heartbeat`, `presence`, `tick`, lifecycle การเชื่อมต่อ/ตัดการเชื่อมต่อ ฯลฯ) ยังคงไม่ถูกจำกัดเพื่อให้ทุกเซสชันที่ authenticate แล้วสังเกตเห็นสุขภาพการขนส่งได้
- **ตระกูลเหตุการณ์ broadcast ที่ไม่รู้จัก** จะถูก gate ด้วย scope ตามค่าเริ่มต้น (fail-closed) เว้นแต่ว่า handler ที่ลงทะเบียนไว้จะผ่อนปรนอย่างชัดเจน

การเชื่อมต่อของไคลเอนต์แต่ละตัวจะเก็บหมายเลขลำดับต่อไคลเอนต์ของตนเอง เพื่อให้ broadcast รักษาลำดับแบบ monotonic บน socket นั้น แม้ว่าไคลเอนต์ต่างกันจะเห็นชุดย่อยของ event stream ที่ถูกกรองด้วย scope ต่างกัน

## ตระกูลเมธอด RPC ทั่วไป

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ด้านบน นี่ไม่ใช่
dump ที่สร้างขึ้นโดยอัตโนมัติ — `hello-ok.features.methods` เป็นรายการ discovery
แบบ conservative ที่สร้างจาก `src/gateway/server-methods-list.ts` รวมกับ export เมธอดของ
Plugin/channel ที่โหลดแล้ว ให้ถือเป็น feature discovery ไม่ใช่ enumeration เต็มของ
`src/gateway/server-methods/*.ts`

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` ส่งคืน snapshot สุขภาพของ gateway ที่ cached ไว้หรือ probed ใหม่
    - `diagnostics.stability` ส่งคืนตัวบันทึกเสถียรภาพการวินิจฉัยล่าสุดแบบมีขอบเขต โดยเก็บ metadata ด้านปฏิบัติการ เช่น ชื่อเหตุการณ์ จำนวน ขนาด byte ค่าหน่วยความจำ สถานะ queue/session ชื่อ channel/plugin และ session id โดยไม่เก็บข้อความ chat, เนื้อความ webhook, output ของ tool, เนื้อความคำขอหรือการตอบกลับดิบ, token, cookie, หรือค่าลับ ต้องมี scope อ่านของ operator
    - `status` ส่งคืนสรุป gateway แบบ `/status`; ฟิลด์ที่ sensitive จะรวมอยู่เฉพาะสำหรับไคลเอนต์ operator ที่มี scope admin
    - `gateway.identity.get` ส่งคืนตัวตนอุปกรณ์ของ gateway ที่ใช้โดย flow relay และการจับคู่
    - `system-presence` ส่งคืน snapshot Presence ปัจจุบันสำหรับอุปกรณ์ operator/node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่มเหตุการณ์ระบบและสามารถอัปเดต/broadcast บริบท Presence ได้
    - `last-heartbeat` ส่งคืนเหตุการณ์ Heartbeat ล่าสุดที่ persist แล้ว
    - `set-heartbeats` toggle การประมวลผล Heartbeat บน gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแค็ตตาล็อกโมเดลที่รันไทม์อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าแล้วในขนาดเหมาะกับตัวเลือก (`agents.defaults.models` ก่อน แล้วตามด้วย `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแค็ตตาล็อกทั้งหมด
    - `usage.status` ส่งคืนหน้าต่างการใช้งาน/สรุปโควตาคงเหลือของผู้ให้บริการ
    - `usage.cost` ส่งคืนสรุปการใช้งานต้นทุนรวมสำหรับช่วงวันที่
    - `doctor.memory.status` ส่งคืนความพร้อมของ vector-memory / cached embedding สำหรับเวิร์กสเปซเอเจนต์เริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจน
    - `doctor.memory.remHarness` ส่งคืนตัวอย่าง REM harness แบบอ่านอย่างเดียวที่มีขอบเขตสำหรับไคลเอนต์ control-plane ระยะไกล อาจรวมพาธเวิร์กสเปซ, ส่วนย่อยของหน่วยความจำ, Markdown ที่อ้างอิงแหล่งแล้วและเรนเดอร์แล้ว และผู้สมัคร deep promotion ดังนั้นผู้เรียกต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานรายเซสชัน
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบอนุกรมเวลาสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="ช่องทางและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะช่องทาง/Plugin แบบ built-in + bundled
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีที่ระบุเมื่อช่องทางรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบ QR/เว็บสำหรับผู้ให้บริการช่องทางเว็บปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบ QR/เว็บนั้นเสร็จสิ้น และเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง Node iOS ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืนตัวกระตุ้น wake-word ที่จัดเก็บไว้
    - `voicewake.set` อัปเดตตัวกระตุ้น wake-word และกระจายการเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การส่งข้อความและบันทึก">
    - `send` คือ RPC สำหรับการส่งออกโดยตรงสำหรับการส่งที่กำหนดเป้าหมายตามช่องทาง/บัญชี/เธรดนอก chat runner
    - `logs.tail` ส่งคืนส่วนท้ายของไฟล์บันทึก Gateway ที่กำหนดค่าไว้ พร้อมการควบคุม cursor/limit และจำนวนไบต์สูงสุด

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.catalog` ส่งคืนแค็ตตาล็อกผู้ให้บริการ Talk แบบอ่านอย่างเดียวสำหรับเสียงพูด การถอดเสียงแบบสตรีม และเสียงแบบเรียลไทม์ โดยรวมถึง ID ผู้ให้บริการ, ป้ายกำกับ, สถานะที่กำหนดค่าแล้ว, ID โมเดล/เสียงที่เปิดเผย, โหมดมาตรฐาน, การขนส่ง, กลยุทธ์ brain และแฟล็กเสียง/ความสามารถแบบเรียลไทม์ โดยไม่ส่งคืนความลับของผู้ให้บริการหรือเปลี่ยน config ส่วนกลาง
    - `talk.config` ส่งคืนเพย์โหลด config ของ Talk ที่มีผลจริง; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.session.create` สร้างเซสชัน Talk ที่ Gateway เป็นเจ้าของสำหรับ `realtime/gateway-relay`, `transcription/gateway-relay` หรือ `stt-tts/managed-room` ค่า `brain: "direct-tools"` ต้องใช้ `operator.admin`
    - `talk.session.join` ตรวจสอบโทเค็นเซสชัน managed-room, ปล่อยเหตุการณ์ `session.ready` หรือ `session.replaced` ตามจำเป็น และส่งคืนเมทาดาทาห้อง/เซสชันพร้อมเหตุการณ์ Talk ล่าสุด โดยไม่มีโทเค็นข้อความล้วนหรือแฮชโทเค็นที่จัดเก็บไว้
    - `talk.session.appendAudio` เพิ่มเสียงอินพุต PCM แบบ base64 ไปยังเซสชัน realtime relay และ transcription ที่ Gateway เป็นเจ้าของ
    - `talk.session.startTurn`, `talk.session.endTurn` และ `talk.session.cancelTurn` ขับเคลื่อนวงจรชีวิตเทิร์นของ managed-room พร้อมปฏิเสธเทิร์นที่หมดอายุก่อนล้างสถานะ
    - `talk.session.cancelOutput` หยุดเอาต์พุตเสียงของผู้ช่วย โดยหลักสำหรับการแทรกพูดที่ควบคุมด้วย VAD ในเซสชัน Gateway relay
    - `talk.session.submitToolResult` ทำให้การเรียกเครื่องมือของผู้ให้บริการที่ปล่อยโดยเซสชัน realtime relay ที่ Gateway เป็นเจ้าของเสร็จสมบูรณ์ ส่ง `options: { willContinue: true }` สำหรับเอาต์พุตเครื่องมือระหว่างทางเมื่อจะมีผลลัพธ์สุดท้ายตามมา หรือ `options: { suppressResponse: true }` เมื่อผลลัพธ์เครื่องมือควรตอบสนองการเรียกของผู้ให้บริการโดยไม่เริ่มคำตอบผู้ช่วยแบบเรียลไทม์อีกครั้ง
    - `talk.session.close` ปิดเซสชัน relay, transcription หรือ managed-room ที่ Gateway เป็นเจ้าของ และปล่อยเหตุการณ์ Talk สิ้นสุด
    - `talk.mode` ตั้งค่า/กระจายสถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.client.create` สร้างเซสชันผู้ให้บริการแบบเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของโดยใช้ `webrtc` หรือ `provider-websocket` ขณะที่ Gateway เป็นเจ้าของ config, ข้อมูลประจำตัว, คำสั่ง และนโยบายเครื่องมือ
    - `talk.client.toolCall` ช่วยให้การขนส่งแบบเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของส่งต่อการเรียกเครื่องมือของผู้ให้บริการไปยังนโยบาย Gateway เครื่องมือแรกที่รองรับคือ `openclaw_agent_consult`; ไคลเอนต์จะได้รับ run id และรอเหตุการณ์วงจรชีวิตแชตตามปกติก่อนส่งผลลัพธ์เครื่องมือเฉพาะผู้ให้บริการ
    - `talk.event` คือช่องทางเหตุการณ์ Talk เดียวสำหรับ realtime, transcription, STT/TTS, managed-room, telephony และ meeting adapters
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะการเปิดใช้ TTS, ผู้ให้บริการที่ใช้งานอยู่, ผู้ให้บริการสำรอง และสถานะ config ของผู้ให้บริการ
    - `tts.providers` ส่งคืนรายการผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะ prefs ของ TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงพูดแบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ, config, การอัปเดต และ wizard">
    - `secrets.reload` resolve `SecretRefs` ที่ใช้งานอยู่ใหม่ และสลับสถานะความลับของรันไทม์เฉพาะเมื่อสำเร็จครบถ้วน
    - `secrets.resolve` resolve การกำหนดความลับเป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายที่ระบุ
    - `config.get` ส่งคืนสแนปชอต config และ hash ปัจจุบัน
    - `config.set` เขียนเพย์โหลด config ที่ผ่านการตรวจสอบแล้ว
    - `config.patch` รวมการอัปเดต config บางส่วน
    - `config.apply` ตรวจสอบ + แทนที่เพย์โหลด config ทั้งหมด
    - `config.schema` ส่งคืนเพย์โหลดสคีมา config สดที่ใช้โดยเครื่องมือ Control UI และ CLI: schema, `uiHints`, version และเมทาดาทาการสร้าง รวมถึงเมทาดาทาสคีมา Plugin + ช่องทางเมื่อรันไทม์โหลดได้ สคีมารวมเมทาดาทาฟิลด์ `title` / `description` ที่ได้จากป้ายกำกับและข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึงอ็อบเจ็กต์ซ้อน, wildcard, รายการอาร์เรย์ และสาขาการประกอบ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืนเพย์โหลด lookup ที่จำกัดตามพาธสำหรับพาธ config หนึ่งรายการ: พาธที่ปรับให้อยู่ในรูปมาตรฐาน, โหนดสคีมาแบบตื้น, hint ที่ตรงกัน + `hintPath` และสรุปลูกโดยตรงสำหรับการ drill-down ใน UI/CLI โหนดสคีมา lookup เก็บเอกสารที่ผู้ใช้เห็นและฟิลด์ตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขตตัวเลข/สตริง/อาร์เรย์/อ็อบเจ็กต์ และแฟล็กเช่น `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกแสดง `key`, `path` ที่ปรับให้อยู่ในรูปมาตรฐาน, `type`, `required`, `hasChildren` พร้อม `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รันโฟลว์อัปเดต Gateway และกำหนดเวลาการรีสตาร์ตเฉพาะเมื่อการอัปเดตเองสำเร็จ; ผู้เรียกที่มีเซสชันสามารถรวม `continuationMessage` เพื่อให้ startup ดำเนินเทิร์นเอเจนต์ถัดไปหนึ่งเทิร์นต่อผ่านคิว restart continuation การอัปเดต package-manager บังคับให้รีสตาร์ตการอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังสลับแพ็กเกจ เพื่อไม่ให้โปรเซส Gateway เก่ายัง lazy-load จาก tree `dist` ที่ถูกแทนที่แล้ว
    - `update.status` ส่งคืน restart sentinel การอัปเดตล่าสุดที่แคชไว้ รวมถึงเวอร์ชันที่กำลังรันหลังรีสตาร์ตเมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผย onboarding wizard ผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วยเอเจนต์และเวิร์กสเปซ">
    - `agents.list` ส่งคืนรายการเอเจนต์ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลจริงและเมทาดาทารันไทม์
    - `agents.create`, `agents.update` และ `agents.delete` จัดการเรคคอร์ดเอเจนต์และการเชื่อมเวิร์กสเปซ
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการไฟล์เวิร์กสเปซ bootstrap ที่เปิดเผยสำหรับเอเจนต์
    - `tasks.list`, `tasks.get` และ `tasks.cancel` เปิดเผย ledger งานของ Gateway ให้ไคลเอนต์ SDK และ operator
    - `artifacts.list`, `artifacts.get` และ `artifacts.download` เปิดเผยสรุปอาร์ทิแฟกต์ที่ได้จาก transcript และการดาวน์โหลดสำหรับ scope `sessionKey`, `runId` หรือ `taskId` ที่ระบุอย่างชัดเจน คิวรี run และ task resolve เซสชันเจ้าของทางฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อ transcript ที่มี provenance ตรงกัน; แหล่ง URL ที่ไม่ปลอดภัยหรือเป็นโลคัลส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการ fetch ทางฝั่งเซิร์ฟเวอร์
    - `environments.list` และ `environments.status` เปิดเผยการค้นพบสภาพแวดล้อม Gateway-local และ Node แบบอ่านอย่างเดียวสำหรับไคลเอนต์ SDK
    - `agent.identity.get` ส่งคืนตัวตนผู้ช่วยที่มีผลจริงสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้ run เสร็จสิ้นและส่งคืนสแนปชอตปลายทางเมื่อมี

  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึงเมทาดาทา `agentRuntime` รายแถวเมื่อมีการกำหนดค่า backend รันไทม์เอเจนต์
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับเหตุการณ์ transcript/ข้อความสำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนตัวอย่าง transcript ที่มีขอบเขตสำหรับคีย์เซสชันที่ระบุ
    - `sessions.describe` ส่งคืนแถวเซสชัน Gateway หนึ่งแถวสำหรับคีย์เซสชันที่ตรงทั้งหมด
    - `sessions.resolve` resolve หรือทำให้เป้าหมายเซสชันเป็นมาตรฐาน
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปในเซสชันที่มีอยู่
    - `sessions.steer` คือรูปแบบ interrupt-and-steer สำหรับเซสชันที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่ไม่บังคับ หรือส่งเฉพาะ `runId` สำหรับ run ที่ใช้งานอยู่ซึ่ง Gateway สามารถ resolve ไปยังเซสชันได้
    - `sessions.patch` อัปเดตเมทาดาทา/override ของเซสชัน และรายงานโมเดลมาตรฐานที่ resolve แล้วพร้อม `agentRuntime` ที่มีผลจริง
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ดำเนินการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้ทั้งหมด
    - การทำงานของแชตยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` `chat.history` ถูกปรับให้อยู่ในรูปแบบสำหรับแสดงผลสำหรับไคลเอนต์ UI: ลบแท็ก directive แบบ inline ออกจากข้อความที่มองเห็น, ลบเพย์โหลด XML การเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) และโทเค็นควบคุมโมเดล ASCII/full-width ที่รั่วไหล, ละเว้นแถวผู้ช่วยที่เป็น silent-token ล้วน เช่น `NO_REPLY` / `no_reply` ที่ตรงทุกตัวอักษร และแถวขนาดใหญ่เกินไปอาจถูกแทนที่ด้วย placeholder

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และโทเค็นอุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วซึ่งอยู่ระหว่างรอและได้รับอนุมัติ
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการเรคคอร์ดการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขต role ที่อนุมัติและ scope ของผู้เรียก
    - `device.token.revoke` เพิกถอนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขต role ที่อนุมัติและ scope ของผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่ Node, การ invoke และงานที่ค้างอยู่">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` และ `node.pair.verify` ครอบคลุมการจับคู่ Node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` ส่งคืนสถานะ Node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับ Node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง Node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอ invoke
    - `node.event` นำเหตุการณ์ที่มาจาก Node กลับเข้าสู่ Gateway
    - `node.pending.pull` และ `node.pending.ack` คือ API คิวของ Node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานค้างอยู่แบบ durable สำหรับ Node ที่ออฟไลน์/ตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="กลุ่มการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการ และส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการสแนปช็อตนโยบายการอนุมัติ exec ของ gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec ภายใน node ผ่านคำสั่ง node relay
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่ plugin กำหนด

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ, Skills และเครื่องมือ">
    - ระบบอัตโนมัติ: `wake` กำหนดเวลาการแทรกข้อความปลุกแบบทันทีหรือที่ heartbeat ถัดไป; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่กำหนดเวลาไว้
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### กลุ่มเหตุการณ์ทั่วไป

- `chat`: การอัปเดตแชทใน UI เช่น `chat.inject` และเหตุการณ์แชทอื่น ๆ
  ที่มีเฉพาะ transcript
- `session.message` และ `session.tool`: การอัปเดต transcript/event-stream สำหรับ
  เซสชันที่สมัครรับข้อมูล
- `sessions.changed`: ดัชนีเซสชันหรือ metadata เปลี่ยนแปลง
- `presence`: การอัปเดตสแนปช็อตสถานะการปรากฏของระบบ
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดตสแนปช็อตสุขภาพของ gateway
- `heartbeat`: การอัปเดตสตรีมเหตุการณ์ heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลงงาน/การรันของ cron
- `shutdown`: การแจ้งเตือนการปิด gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ node
- `node.invoke.request`: การกระจายคำขอเรียกใช้ node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตอุปกรณ์ที่จับคู่
- `voicewake.changed`: การตั้งค่าทริกเกอร์ wake-word เปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ plugin

### เมธอดช่วยเหลือของ Node

- Nodes อาจเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของไฟล์ปฏิบัติการ skill
  สำหรับการตรวจสอบ auto-allow

### RPC ของบัญชีแยกประเภทงาน

ไคลเอนต์ผู้ปฏิบัติการสามารถตรวจสอบและยกเลิกระเบียนงานเบื้องหลังของ Gateway ผ่าน
RPC ของบัญชีแยกประเภทงานได้ เมธอดเหล่านี้ส่งคืนสรุปงานที่ผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่
สถานะ runtime ดิบ

- `tasks.list` ต้องใช้ `operator.read`
  - Params: `status` ที่ไม่บังคับ (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` หรือ `"timed_out"`) หรืออาร์เรย์ของสถานะเหล่านั้น,
    `agentId` ที่ไม่บังคับ, `sessionKey` ที่ไม่บังคับ, `limit` ที่ไม่บังคับตั้งแต่ `1` ถึง
    `500` และสตริง `cursor` ที่ไม่บังคับ
  - Result: `{ "tasks": TaskSummary[], "nextCursor"?: string }`
- `tasks.get` ต้องใช้ `operator.read`
  - Params: `{ "taskId": string }`
  - Result: `{ "task": TaskSummary }`
  - รหัสงานที่ไม่มีอยู่จะส่งคืนรูปแบบข้อผิดพลาด not-found ของ Gateway
- `tasks.cancel` ต้องใช้ `operator.write`
  - Params: `{ "taskId": string, "reason"?: string }`
  - Result:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`
  - `found` รายงานว่าบัญชีแยกประเภทมีงานที่ตรงกันหรือไม่ `cancelled`
    รายงานว่า runtime ยอมรับหรือบันทึกการยกเลิกหรือไม่

`TaskSummary` รวม `id`, `status` และ metadata ที่ไม่บังคับ เช่น `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, ความคืบหน้า,
สรุปปลายทาง และข้อความข้อผิดพลาดที่ผ่านการทำให้ปลอดภัยแล้ว

### เมธอดช่วยเหลือของผู้ปฏิบัติการ

- ผู้ปฏิบัติการอาจเรียก `commands.list` (`operator.read`) เพื่อดึงคลังคำสั่ง runtime
  สำหรับ agent
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่าน workspace ของ agent เริ่มต้น
  - `scope` ควบคุมว่า `name` หลักจะกำหนดเป้าหมาย surface ใด:
    - `text` ส่งคืน token คำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางเริ่มต้น `both` ส่งคืนชื่อ native ที่รับรู้ provider
      เมื่อมีให้ใช้
  - `textAliases` มี alias แบบ slash ที่ตรงตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่ง native ที่รับรู้ provider เมื่อมีอยู่
  - `provider` เป็นตัวเลือกและส่งผลเฉพาะต่อการตั้งชื่อ native รวมถึงความพร้อมใช้งานของคำสั่ง plugin
    แบบ native
  - `includeArgs=false` ละ metadata ของ argument ที่ serialize แล้วจาก response
- ผู้ปฏิบัติการอาจเรียก `tools.catalog` (`operator.read`) เพื่อดึงแคตตาล็อกเครื่องมือ runtime สำหรับ
  agent response รวมเครื่องมือที่จัดกลุ่มและ metadata ที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ plugin เมื่อ `source="plugin"`
  - `optional`: ระบุว่าเครื่องมือ plugin เป็นแบบไม่บังคับหรือไม่
- ผู้ปฏิบัติการอาจเรียก `tools.effective` (`operator.read`) เพื่อดึงคลังเครื่องมือที่มีผลจริงใน runtime
  สำหรับเซสชัน
  - ต้องระบุ `sessionKey`
  - gateway อนุมานบริบท runtime ที่เชื่อถือได้จากเซสชันฝั่ง server แทนการยอมรับ
    บริบท auth หรือ delivery ที่ผู้เรียกส่งมา
  - response มีขอบเขตตามเซสชันและสะท้อนสิ่งที่การสนทนาที่ใช้งานอยู่สามารถใช้ได้ในตอนนี้
    รวมถึงเครื่องมือ core, plugin และ channel
- ผู้ปฏิบัติการอาจเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือที่มีให้ใช้หนึ่งรายการผ่าน
  เส้นทางนโยบาย gateway เดียวกับ `/tools/invoke`
  - ต้องระบุ `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ
    `idempotencyKey` เป็นตัวเลือก
  - หากมีทั้ง `sessionKey` และ `agentId` agent ของเซสชันที่ resolve แล้วต้องตรงกับ
    `agentId`
  - response เป็น envelope สำหรับ SDK ที่มี `ok`, `toolName`, `output` ที่ไม่บังคับ และฟิลด์
    `error` แบบมีชนิด การปฏิเสธจากการอนุมัติหรือนโยบายจะส่งคืน `ok:false` ใน payload แทนที่จะ
    ข้าม pipeline นโยบายเครื่องมือของ gateway
- ผู้ปฏิบัติการอาจเรียก `skills.status` (`operator.read`) เพื่อดึงคลัง skill ที่มองเห็นได้
  สำหรับ agent
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่าน workspace ของ agent เริ่มต้น
  - response รวมคุณสมบัติการมีสิทธิ์, ข้อกำหนดที่ขาดหาย, การตรวจสอบ config และ
    ตัวเลือกการติดตั้งที่ผ่านการทำให้ปลอดภัยแล้วโดยไม่เปิดเผยค่า secret ดิบ
- ผู้ปฏิบัติการอาจเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ
  metadata การค้นพบของ ClawHub
- ผู้ปฏิบัติการอาจเรียก `skills.upload.begin`, `skills.upload.chunk` และ
  `skills.upload.commit` (`operator.admin`) เพื่อเตรียม archive ของ skill ส่วนตัว
  ก่อนติดตั้ง นี่เป็นเส้นทางอัปโหลดสำหรับ admin แยกต่างหากสำหรับไคลเอนต์ที่เชื่อถือได้
  ไม่ใช่โฟลว์การติดตั้ง skill ตามปกติของ ClawHub และถูกปิดใช้งานโดยค่าเริ่มต้น เว้นแต่
  จะเปิดใช้ `skills.install.allowUploadedArchives`
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    สร้างการอัปโหลดที่ผูกกับ slug และค่า force นั้น
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` ต่อท้าย byte ที่
    offset ที่ decode แล้วอย่างตรงตัว
  - `skills.upload.commit({ uploadId, sha256? })` ตรวจสอบขนาดสุดท้ายและ
    SHA-256 Commit จะ finalize เฉพาะการอัปโหลดเท่านั้น; ไม่ได้ติดตั้ง skill
  - archive ของ skill ที่อัปโหลดเป็น archive zip ที่มี root `SKILL.md`
    ชื่อไดเรกทอรีภายใน archive จะไม่เลือกเป้าหมายการติดตั้ง
- ผู้ปฏิบัติการอาจเรียก `skills.install` (`operator.admin`) ในสามโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้ง
    โฟลเดอร์ skill ลงในไดเรกทอรี `skills/` ของ workspace agent เริ่มต้น
  - โหมดอัปโหลด: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    ติดตั้งการอัปโหลดที่ commit แล้วลงในไดเรกทอรี `skills/<slug>`
    ของ workspace agent เริ่มต้น ค่า slug และ force ต้องตรงกับคำขอ
    `skills.upload.begin` เดิม โหมดนี้จะถูกปฏิเสธ เว้นแต่
    จะเปิดใช้ `skills.install.allowUploadedArchives` การตั้งค่านี้ไม่ส่งผลต่อ
    การติดตั้ง ClawHub
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    รัน action `metadata.openclaw.install` ที่ประกาศไว้บน host ของ gateway
- ผู้ปฏิบัติการอาจเรียก `skills.update` (`operator.admin`) ในสองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามอยู่หนึ่งรายการหรือการติดตั้ง ClawHub ที่ติดตามทั้งหมดใน
    workspace agent เริ่มต้น
  - โหมด Config patch ค่า `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` รับพารามิเตอร์ `view` ที่ไม่บังคับ:

- ละไว้หรือ `"default"`: พฤติกรรม runtime ปัจจุบัน หากกำหนดค่า `agents.defaults.models` ไว้ response จะเป็นแคตตาล็อกที่อนุญาต รวมถึงโมเดลที่ค้นพบแบบไดนามิกสำหรับรายการ `provider/*` มิฉะนั้น response จะเป็นแคตตาล็อก Gateway ทั้งหมด
- `"configured"`: พฤติกรรมขนาดเหมาะสำหรับ picker หากกำหนดค่า `agents.defaults.models` ไว้ ค่านั้นยังคงมีผลก่อน รวมถึงการค้นพบที่มีขอบเขตตาม provider สำหรับรายการ `provider/*` หากไม่มี allowlist response จะใช้รายการ `models.providers.*.models` ที่ระบุอย่างชัดเจน และ fallback ไปยังแคตตาล็อกทั้งหมดเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แคตตาล็อก Gateway ทั้งหมด โดยข้าม `agents.defaults.models` ใช้สำหรับ UI วินิจฉัยและค้นพบ ไม่ใช่ picker โมเดลตามปกติ

## การอนุมัติ Exec

- เมื่อคำขอ exec ต้องการการอนุมัติ gateway จะกระจาย `exec.approval.requested`
- ไคลเอนต์ผู้ปฏิบัติการ resolve โดยเรียก `exec.approval.resolve` (ต้องใช้ scope `operator.approvals`)
- สำหรับ `host=node`, `exec.approval.request` ต้องมี `systemRunPlan` (canonical `argv`/`cwd`/`rawCommand`/metadata เซสชัน) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังการอนุมัติ การเรียก `node.invoke system.run` ที่ forward แล้วจะใช้
  `systemRunPlan` canonical นั้นเป็นบริบทคำสั่ง/cwd/เซสชันที่มีอำนาจสูงสุด
- หากผู้เรียกแก้ไข `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่างขั้น prepare กับการ forward `system.run` ที่ได้รับอนุมัติขั้นสุดท้าย
  gateway จะปฏิเสธการรันแทนที่จะเชื่อถือ payload ที่ถูกแก้ไข

## การ fallback ของการส่งมอบให้ Agent

- คำขอ `agent` สามารถมี `deliver=true` เพื่อขอการส่งมอบขาออก
- `bestEffortDeliver=false` คงพฤติกรรมแบบเข้มงวด: เป้าหมาย delivery ที่ resolve ไม่ได้หรือเป็น internal-only จะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback เป็นการดำเนินการเฉพาะเซสชันเมื่อไม่สามารถ resolve route ที่ส่งมอบภายนอกได้ (เช่น เซสชัน internal/webchat หรือ config หลาย channel ที่กำกวม)
- ผลลัพธ์ `agent` ขั้นสุดท้ายอาจมี `result.deliveryStatus` เมื่อมีการขอ delivery
  โดยใช้สถานะ `sent`, `suppressed`, `partial_failed` และ `failed`
  เดียวกับที่บันทึกไว้สำหรับ [`openclaw agent --json --deliver`](/th/cli/agent#json-delivery-status)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/version.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; server ปฏิเสธเมื่อไม่ตรงกัน
- Schema + model ถูกสร้างจาก definition ของ TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

ไคลเอนต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าต่าง ๆ
เสถียรตลอด protocol v4 และเป็น baseline ที่คาดหวังสำหรับไคลเอนต์ third-party.

| ค่าคงที่                                  | ค่าเริ่มต้น                                               | แหล่งที่มา                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| ระยะหมดเวลาของคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| ระยะหมดเวลาของการยืนยันตัวตนล่วงหน้า / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่มงบเวลาฝั่ง server/client ที่จับคู่กันได้) |
| ระยะ backoff การเชื่อมต่อใหม่เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| ระยะ backoff การเชื่อมต่อใหม่สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| ขีดจำกัด fast-retry หลังจากปิดด้วย device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ระยะผ่อนผัน force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| ระยะหมดเวลาเริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วงเวลา tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| การปิดเมื่อ tick หมดเวลา                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

server ประกาศค่า `policy.tickIntervalMs`, `policy.maxPayload`,
และ `policy.maxBufferedBytes` ที่มีผลจริงใน `hello-ok`; client ควรปฏิบัติตามค่าเหล่านั้น
แทนค่าเริ่มต้นก่อน handshake

## การยืนยันตัวตน

- การยืนยันตัวตนของ gateway แบบ shared-secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมดการยืนยันตัวตนที่กำหนดค่าไว้
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ
  `gateway.auth.mode: "trusted-proxy"` ที่ไม่ใช่ loopback
  จะผ่านการตรวจสอบการยืนยันตัวตนของการเชื่อมต่อจาก request headers
  แทน `connect.params.auth.*`
- private-ingress `gateway.auth.mode: "none"` จะข้ามการยืนยันตัวตนแบบ shared-secret สำหรับการเชื่อมต่อ
  ทั้งหมด; อย่าเปิดเผยโหมดนี้บน ingress สาธารณะ/ไม่น่าเชื่อถือ
- หลังจากการจับคู่แล้ว Gateway จะออก **device token** ที่จำกัดตามบทบาทการเชื่อมต่อ
  + ขอบเขต โดยจะส่งคืนใน `hello-ok.auth.deviceToken` และ client ควร
  บันทึกไว้เพื่อใช้เชื่อมต่อในอนาคต
- client ควรบันทึก `hello-ok.auth.deviceToken` หลักหลังจาก
  เชื่อมต่อสำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วย device token ที่ **จัดเก็บไว้** นั้นควรใช้ชุดขอบเขตที่อนุมัติแล้ว
  ซึ่งจัดเก็บไว้สำหรับ token นั้นด้วย วิธีนี้รักษาสิทธิ์ read/probe/status
  ที่ได้รับอนุญาตแล้ว และหลีกเลี่ยงการลดการเชื่อมต่อใหม่อย่างเงียบ ๆ ไปเป็น
  ขอบเขต implicit admin-only ที่แคบกว่า
- การประกอบการยืนยันตัวตนฝั่ง client สำหรับการเชื่อมต่อ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระต่อกันและจะถูกส่งต่อเสมอเมื่อมีการตั้งค่า
  - `auth.token` จะถูกใส่ค่าตามลำดับความสำคัญ: shared token ที่ระบุชัดเจนก่อน,
    จากนั้น `deviceToken` ที่ระบุชัดเจน, แล้วจึงเป็น per-device token ที่จัดเก็บไว้ (คีย์ด้วย
    `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อไม่มีรายการข้างต้นใดแก้เป็น
    `auth.token` ได้ shared token หรือ device token ใด ๆ ที่แก้ได้จะระงับการส่งค่านี้
  - การเลื่อนระดับอัตโนมัติของ device token ที่จัดเก็บไว้ในการลองซ้ำครั้งเดียว
    `AUTH_TOKEN_MISMATCH` จำกัดไว้เฉพาะ **trusted endpoints เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบ pinned public `wss://`
    ที่ไม่มีการ pinning จะไม่เข้าเงื่อนไข
- รายการ `hello-ok.auth.deviceTokens` เพิ่มเติมเป็น token ส่งต่อแบบ bootstrap
  ให้บันทึกไว้เฉพาะเมื่อการเชื่อมต่อใช้การยืนยันตัวตนแบบ bootstrap บน transport ที่น่าเชื่อถือ
  เช่น `wss://` หรือการจับคู่แบบ loopback/local
- หาก client ระบุ `deviceToken` หรือ `scopes` **อย่างชัดเจน**
  ชุดขอบเขตที่ caller ขอจะยังคงเป็นแหล่งอ้างอิงหลัก; scoped ที่ cached จะถูกนำมาใช้ซ้ำ
  เฉพาะเมื่อ client ใช้ per-device token ที่จัดเก็บไว้ซ้ำเท่านั้น
- สามารถ rotate/revoke device token ได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องมีขอบเขต `operator.pairing`)
- `device.token.rotate` ส่งคืน metadata ของการ rotate โดยจะสะท้อน bearer token ตัวแทน
  เฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ยืนยันตัวตนด้วย
  device token นั้นอยู่แล้ว เพื่อให้ client แบบ token-only สามารถบันทึก token ตัวแทนของตนก่อน
  เชื่อมต่อใหม่ การ rotate แบบ shared/admin จะไม่สะท้อน bearer token
- การออก token, การ rotate, และการ revoke ยังคงจำกัดอยู่ในชุดบทบาทที่อนุมัติแล้ว
  ซึ่งบันทึกไว้ในรายการ pairing ของ device นั้น; การเปลี่ยนแปลง token ไม่สามารถขยายหรือ
  กำหนดเป้าหมายบทบาท device ที่การอนุมัติ pairing ไม่เคยให้ไว้
- สำหรับ session token ของ paired-device การจัดการ device จะจำกัดอยู่ที่ตัวเอง เว้นแต่
  caller จะมี `operator.admin` ด้วย: caller ที่ไม่ใช่ admin สามารถ remove/revoke/rotate
  ได้เฉพาะรายการ device **ของตัวเอง** เท่านั้น
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุดขอบเขตของ target operator
  token เทียบกับขอบเขต session ปัจจุบันของ caller ด้วย caller ที่ไม่ใช่ admin
  ไม่สามารถ rotate หรือ revoke operator token ที่กว้างกว่าที่ตนถืออยู่แล้วได้
- ความล้มเหลวในการยืนยันตัวตนมี `error.details.code` พร้อมคำแนะนำในการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรม client สำหรับ `AUTH_TOKEN_MISMATCH`:
  - client ที่น่าเชื่อถืออาจลองซ้ำหนึ่งครั้งแบบมีขอบเขตด้วย per-device token ที่ cached ไว้
  - หากการลองซ้ำนั้นล้มเหลว client ควรหยุด loop การเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำให้ operator ดำเนินการ

## ข้อมูลระบุตัวตนของ device + pairing

- Node ควรมีข้อมูลระบุตัวตน device ที่เสถียร (`device.id`) ซึ่งได้จาก
  fingerprint ของ keypair
- Gateway ออก token ต่อ device + บทบาท
- ต้องมีการอนุมัติ pairing สำหรับ device ID ใหม่ เว้นแต่จะเปิดใช้การอนุมัติอัตโนมัติแบบ local
- การอนุมัติอัตโนมัติของ pairing มีศูนย์กลางอยู่ที่การเชื่อมต่อ direct local loopback
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่แคบสำหรับ
  flow helper แบบ shared-secret ที่น่าเชื่อถือ
- การเชื่อมต่อ same-host tailnet หรือ LAN ยังคงถือว่าเป็น remote สำหรับ pairing และ
  ต้องได้รับอนุมัติ
- โดยปกติ WS client จะรวมข้อมูลระบุตัวตน `device` ระหว่าง `connect` (operator +
  node) ข้อยกเว้น operator ที่ไม่มี device มีเพียงเส้นทาง trust ที่ระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP ที่ไม่ปลอดภัยแบบ localhost-only
  - การยืนยันตัวตน Control UI ของ operator ด้วย `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดความปลอดภัยอย่างรุนแรง)
  - RPC backend `gateway-client` แบบ direct-loopback ที่ยืนยันตัวตนด้วย
    token/password ของ Gateway แบบ shared
- การเชื่อมต่อทั้งหมดต้องลงนาม nonce `connect.challenge` ที่ server ให้มา

### การวินิจฉัยการย้ายข้อมูล device auth

สำหรับ client รุ่นเก่าที่ยังคงใช้พฤติกรรมการลงนามก่อน challenge ตอนนี้ `connect` จะส่งคืน
code รายละเอียด `DEVICE_AUTH_*` ใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวในการย้ายข้อมูลที่พบบ่อย:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | client ละเว้น `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | client ลงนามด้วย nonce ที่เก่า/ผิด            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ลายเซ็นไม่ตรงกับ payload v2       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอก skew ที่อนุญาต          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/canonicalization ของ public key ล้มเหลว         |

เป้าหมายการย้ายข้อมูล:

- รอ `connect.challenge` เสมอ
- ลงนาม payload v2 ที่มี server nonce
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload ลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` รุ่นเก่ายังคงยอมรับเพื่อความเข้ากันได้ แต่การ pin metadata ของ paired-device
  ยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + การ pinning

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- client อาจเลือก pin fingerprint ของ cert gateway ได้ (ดู config `gateway.tls`
  รวมถึง `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **gateway API แบบเต็ม** (status, channels, models, chat,
agent, sessions, nodes, approvals ฯลฯ) พื้นผิวที่แน่นอนกำหนดโดย
schema TypeBox ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
