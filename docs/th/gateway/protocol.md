---
read_when:
    - การใช้งานหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การแก้ไขปัญหาโปรโตคอลไม่ตรงกันหรือการเชื่อมต่อล้มเหลว
    - กำลังสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การจับมือ, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-07-03T10:05:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

โปรโตคอล Gateway WS คือ **ระนาบควบคุมเดียว + การขนส่งของ Node** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, เว็บ UI, แอป macOS, Node iOS/Android, Node แบบ headless)
เชื่อมต่อผ่าน WebSocket และประกาศ **บทบาท** + **ขอบเขต** ของตน
ในเวลาทำ handshake

## การขนส่ง

- WebSocket, เฟรมข้อความพร้อม payload แบบ JSON
- เฟรมแรก **ต้อง** เป็นคำขอ `connect`
- เฟรมก่อนเชื่อมต่อถูกจำกัดไว้ที่ 64 KiB หลังจาก handshake สำเร็จแล้ว ไคลเอนต์
  ควรปฏิบัติตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้การวินิจฉัย
  เฟรมขาเข้าที่ใหญ่เกินและบัฟเฟอร์ขาออกที่ช้าจะปล่อยเหตุการณ์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้งเฟรมที่ได้รับผลกระทบ เหตุการณ์เหล่านี้เก็บ
  ขนาด ขีดจำกัด พื้นผิว และรหัสเหตุผลที่ปลอดภัย แต่จะไม่เก็บเนื้อหาข้อความ
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

ขณะที่ Gateway ยังคงทำ sidecar ตอนเริ่มต้นให้เสร็จ คำขอ `connect` อาจ
ส่งกลับข้อผิดพลาด `UNAVAILABLE` ที่ลองใหม่ได้ โดยตั้ง `details.reason` เป็น
`"startup-sidecars"` และมี `retryAfterMs` ไคลเอนต์ควรลองตอบสนองนั้นใหม่
ภายในงบเวลาการเชื่อมต่อโดยรวม แทนที่จะแสดงเป็นความล้มเหลวของ handshake
แบบสิ้นสุด

`server`, `features`, `snapshot` และ `policy` ล้วนเป็นฟิลด์ที่ schema กำหนดให้ต้องมี
(`packages/gateway-protocol/src/schema/frames.ts`) `auth` ก็จำเป็นเช่นกัน และรายงาน
บทบาท/ขอบเขตที่เจรจาได้ `pluginSurfaceUrls` เป็นตัวเลือก และแมปชื่อพื้นผิวของ plugin
เช่น `canvas` ไปยัง URL ที่โฮสต์แบบมีขอบเขต

URL พื้นผิว plugin แบบมีขอบเขตอาจหมดอายุได้ Node สามารถเรียก
`node.pluginSurface.refresh` พร้อม `{ "surface": "canvas" }` เพื่อรับรายการใหม่
ใน `pluginSurfaceUrls` การรีแฟกเตอร์ Plugin Canvas แบบทดลองไม่รองรับ
เส้นทางความเข้ากันได้ที่เลิกใช้แล้วอย่าง `canvasHostUrl`, `canvasCapability` หรือ
`node.canvas.capability.refresh`; ไคลเอนต์เนทีฟและ gateway ปัจจุบันต้องใช้พื้นผิว plugin

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

ไคลเอนต์ backend ในกระบวนการเดียวกันที่เชื่อถือได้ (`client.id: "gateway-client"`,
`client.mode: "backend"`) อาจละ `device` ได้ในการเชื่อมต่อ local loopback โดยตรง
เมื่อยืนยันตัวตนด้วย token/password ของ gateway ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้
สำหรับ RPC ระนาบควบคุมภายใน และป้องกันไม่ให้ baseline การจับคู่ CLI/อุปกรณ์ที่เก่า
ไปบล็อกงาน backend ในเครื่อง เช่น การอัปเดตเซสชัน subagent ไคลเอนต์ระยะไกล
ไคลเอนต์ที่มีต้นทางจากเบราว์เซอร์ ไคลเอนต์ Node และไคลเอนต์ device-token/device-identity
แบบชัดเจนยังคงใช้การจับคู่และการตรวจ scope-upgrade ตามปกติ

เมื่อมีการออก token ของอุปกรณ์ `hello-ok` จะรวมสิ่งต่อไปนี้ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

การ bootstrap ด้วย QR/setup-code ในตัวเป็นเส้นทาง handoff มือถือแบบสดใหม่ การเชื่อมต่อ
setup-code baseline ที่สำเร็จจะส่งกลับ token ของ Node หลัก พร้อม token ของ operator
หนึ่งรายการที่มีขอบเขตจำกัด:

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

การ handoff ของ operator ถูกจำกัดโดยตั้งใจ เพื่อให้การ onboarding ด้วย QR เริ่ม
วงจร operator บนมือถือได้โดยไม่ให้ `operator.admin` หรือ `operator.pairing`
แต่รวม `operator.talk.secrets` เพื่อให้ไคลเอนต์เนทีฟอ่านการกำหนดค่า Talk
ที่ต้องใช้หลัง bootstrap ได้ ขอบเขต admin และการจับคู่ที่กว้างกว่านี้ต้องใช้
การจับคู่ operator ที่ได้รับอนุมัติแยกต่างหาก หรือ flow token แยกต่างหาก ไคลเอนต์ควรคงอยู่
`hello-ok.auth.deviceTokens` เฉพาะเมื่อ
การเชื่อมต่อใช้ bootstrap auth บนการขนส่งที่เชื่อถือได้ เช่น `wss://` หรือ
การจับคู่แบบ loopback/local

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
- **การตอบกลับ**: `{type:"res", id, ok, payload|error}`
- **เหตุการณ์**: `{type:"event", event, payload, seq?, stateVersion?}`

เมธอดที่มีผลข้างเคียงต้องใช้ **idempotency keys** (ดู schema)

## บทบาท + ขอบเขต

สำหรับโมเดลขอบเขต operator แบบเต็ม การตรวจในเวลาการอนุมัติ และ semantics ของ shared-secret
ดู [ขอบเขต Operator](/th/gateway/operator-scopes)

### บทบาท

- `operator` = ไคลเอนต์ระนาบควบคุม (CLI/UI/automation)
- `node` = โฮสต์ความสามารถ (camera/screen/canvas/system.run)

### ขอบเขต (operator)

ขอบเขตที่ใช้บ่อย:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` พร้อม `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)
เมื่อมีการรวมความลับ ไคลเอนต์ควรอ่าน credential ของผู้ให้บริการ Talk ที่ใช้งานอยู่
จาก `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
ยังคงมีรูปทรงตามแหล่งที่มา และอาจเป็นออบเจ็กต์ SecretRef หรือสตริงที่ถูกปกปิด

เมธอด RPC ของ gateway ที่ plugin ลงทะเบียนไว้อาจขอขอบเขต operator ของตัวเองได้ แต่
prefix admin หลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะแก้เป็น `operator.admin` เสมอ

ขอบเขตของเมธอดเป็นเพียง gate แรกเท่านั้น คำสั่ง slash บางคำสั่งที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจระดับคำสั่งที่เข้มงวดกว่าเพิ่มเติม ตัวอย่างเช่น การเขียน
`/config set` และ `/config unset` แบบคงอยู่ต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจขอบเขตเพิ่มเติมในเวลาการอนุมัติ เหนือ
ขอบเขตเมธอดพื้นฐาน:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มีคำสั่ง Node ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่รวม `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node ประกาศการอ้างสิทธิ์ความสามารถในเวลาเชื่อมต่อ:

- `caps`: หมวดหมู่ความสามารถระดับสูง เช่น `camera`, `canvas`, `screen`,
  `location`, `voice` และ `talk`
- `commands`: allowlist คำสั่งสำหรับ invoke
- `permissions`: toggle แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือสิ่งเหล่านี้เป็น **การอ้างสิทธิ์** และบังคับใช้ allowlist ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` ส่งกลับรายการที่ key ตามตัวตนอุปกรณ์
- รายการ Presence รวม `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงแถวเดียวต่ออุปกรณ์ได้
  แม้อุปกรณ์นั้นจะเชื่อมต่อเป็นทั้ง **operator** และ **node**
- `node.list` รวมฟิลด์ตัวเลือก `lastSeenAtMs` และ `lastSeenReason` Node ที่เชื่อมต่ออยู่รายงาน
  เวลาเชื่อมต่อปัจจุบันเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; Node ที่จับคู่แล้วสามารถรายงาน
  Presence เบื้องหลังแบบคงอยู่ได้เช่นกัน เมื่อเหตุการณ์ Node ที่เชื่อถือได้อัปเดต metadata การจับคู่ของตน

### เหตุการณ์ Node background alive

Node อาจเรียก `node.event` พร้อม `event: "node.presence.alive"` เพื่อบันทึกว่า Node ที่จับคู่แล้ว
ยังมีชีวิตอยู่ระหว่างการปลุกเบื้องหลัง โดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น enum แบบปิด: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` สตริง trigger ที่ไม่รู้จักจะถูก normalize เป็น
`background` โดย gateway ก่อนการคงอยู่ เหตุการณ์นี้คงอยู่เฉพาะสำหรับเซสชันอุปกรณ์ Node
ที่ยืนยันตัวตนแล้ว; เซสชันที่ไม่มีอุปกรณ์หรือยังไม่จับคู่จะส่งกลับ `handled: false`

Gateway ที่สำเร็จจะส่งกลับผลลัพธ์แบบมีโครงสร้าง:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Gateway รุ่นเก่าอาจยังคงส่งกลับ `{ "ok": true }` สำหรับ `node.event`; ไคลเอนต์ควรถือว่านั่นเป็น
RPC ที่ได้รับการตอบรับแล้ว ไม่ใช่การคงอยู่ของ Presence แบบทนทาน

## การกำหนดขอบเขตเหตุการณ์ broadcast

เหตุการณ์ broadcast ของ WebSocket ที่เซิร์ฟเวอร์ push ถูก gate ตามขอบเขต เพื่อให้เซสชันที่มีขอบเขตการจับคู่หรือเฉพาะ Node ไม่ได้รับเนื้อหาเซสชันแบบ passive

- **เฟรม chat, agent และ tool-result** (รวมถึงเหตุการณ์ `agent` แบบ streamed และผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcast `plugin.*` ที่ Plugin กำหนด** ถูก gate เป็น `operator.write` หรือ `operator.admin` ขึ้นอยู่กับวิธีที่ plugin ลงทะเบียนไว้
- **เหตุการณ์สถานะและการขนส่ง** (`heartbeat`, `presence`, `tick`, วงจรชีวิต connect/disconnect เป็นต้น) ยังคงไม่ถูกจำกัด เพื่อให้ทุกเซสชันที่ยืนยันตัวตนแล้วสังเกตสุขภาพการขนส่งได้
- **กลุ่มเหตุการณ์ broadcast ที่ไม่รู้จัก** ถูก gate ตามขอบเขตโดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนปรนอย่างชัดเจน

การเชื่อมต่อไคลเอนต์แต่ละรายการเก็บหมายเลข sequence ต่อไคลเอนต์ของตนเอง เพื่อให้ broadcast รักษาลำดับแบบ monotonic บน socket นั้น แม้ไคลเอนต์แต่ละตัวจะเห็น subset ของ event stream ที่ถูกกรองตามขอบเขตแตกต่างกัน

## กลุ่มเมธอด RPC ที่ใช้บ่อย

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ด้านบน สิ่งนี้
ไม่ใช่ dump ที่สร้างขึ้น — `hello-ok.features.methods` เป็นรายการ discovery
แบบระมัดระวังที่สร้างจาก `src/gateway/server-methods-list.ts` รวมกับ export ของเมธอด
plugin/channel ที่โหลดแล้ว ให้ถือว่าเป็น feature discovery ไม่ใช่รายการครบถ้วน
ของ `src/gateway/server-methods/*.ts`

  <AccordionGroup>
  <Accordion title="ระบบและตัวตน">
    - `health` ส่งคืนสแนปช็อตสุขภาพของ Gateway ที่แคชไว้หรือเพิ่งตรวจสอบใหม่
    - `diagnostics.stability` ส่งคืนตัวบันทึกเสถียรภาพการวินิจฉัยแบบมีขอบเขตล่าสุด โดยเก็บเมตาดาต้าการปฏิบัติงาน เช่น ชื่ออีเวนต์ จำนวน ขนาดไบต์ ค่าการใช้หน่วยความจำ สถานะคิว/เซสชัน ชื่อช่องทาง/Plugin และรหัสเซสชัน ไม่เก็บข้อความแชต เนื้อหา Webhook เอาต์พุตเครื่องมือ เนื้อหาคำขอหรือคำตอบดิบ โทเค็น คุกกี้ หรือค่าลับ ต้องมีขอบเขตสิทธิ์อ่านของผู้ปฏิบัติงาน
    - `status` ส่งคืนสรุป Gateway แบบ `/status`; ฟิลด์ที่ละเอียดอ่อนจะรวมไว้เฉพาะสำหรับไคลเอนต์ผู้ปฏิบัติงานที่มีขอบเขตผู้ดูแลระบบ
    - `gateway.identity.get` ส่งคืนตัวตนอุปกรณ์ Gateway ที่ใช้โดยโฟลว์รีเลย์และการจับคู่
    - `system-presence` ส่งคืนสแนปช็อตสถานะปัจจุบันสำหรับอุปกรณ์ผู้ปฏิบัติงาน/Node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่มอีเวนต์ระบบและสามารถอัปเดต/กระจายบริบทสถานะได้
    - `last-heartbeat` ส่งคืนอีเวนต์ Heartbeat ที่คงอยู่ล่าสุด
    - `set-heartbeats` สลับการประมวลผล Heartbeat บน Gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแค็ตตาล็อกโมเดลที่รันไทม์อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าแล้วในขนาดเหมาะกับตัวเลือก (`agents.defaults.models` ก่อน แล้วตามด้วย `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแค็ตตาล็อกทั้งหมด
    - `usage.status` ส่งคืนหน้าต่างการใช้งานผู้ให้บริการ/สรุปโควตาที่เหลือ
    - `usage.cost` ส่งคืนสรุปการใช้งานค่าใช้จ่ายแบบรวมสำหรับช่วงวันที่
      ส่ง `agentId` สำหรับเอเจนต์เดียว หรือ `agentScope: "all"` เพื่อรวมเอเจนต์ที่กำหนดค่าไว้
    - `doctor.memory.status` ส่งคืนความพร้อมของ vector-memory / cached embedding สำหรับพื้นที่ทำงานเอเจนต์เริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจน ไคลเอนต์ที่รองรับ Dreaming ยังสามารถส่ง `{ "agentId": "agent-id" }` เพื่อจำกัดสถิติพื้นที่จัดเก็บ Dreaming ไปยังพื้นที่ทำงานเอเจนต์ที่เลือก; การละ `agentId` จะคง fallback ไปยังเอเจนต์เริ่มต้นและรวมพื้นที่ทำงาน Dreaming ที่กำหนดค่าไว้
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, และ `doctor.memory.dedupeDreamDiary` รับพารามิเตอร์ `{ "agentId": "agent-id" }` แบบไม่บังคับสำหรับมุมมอง/การกระทำ Dreaming ของเอเจนต์ที่เลือก เมื่อละ `agentId` รายการเหล่านี้จะทำงานบนพื้นที่ทำงานเอเจนต์เริ่มต้นที่กำหนดค่าไว้
    - `doctor.memory.remHarness` ส่งคืนตัวอย่าง REM harness แบบอ่านอย่างเดียวและมีขอบเขตสำหรับไคลเอนต์ control-plane ระยะไกล อาจรวมพาธพื้นที่ทำงาน ส่วนย่อยหน่วยความจำ markdown ที่เรนเดอร์แบบ grounded และผู้สมัครสำหรับการเลื่อนระดับเชิงลึก ดังนั้นผู้เรียกต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานรายเซสชัน ส่ง `agentId` สำหรับหนึ่ง
      เอเจนต์ หรือ `agentScope: "all"` เพื่อแสดงรายการเอเจนต์ที่กำหนดค่าไว้ร่วมกัน
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบอนุกรมเวลาสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="ช่องทางและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะของช่องทาง/Plugin แบบในตัว + แบบที่รวมมาให้
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีที่ระบุเมื่อช่องทางนั้นรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบผ่าน QR/เว็บสำหรับผู้ให้บริการช่องทางเว็บปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบผ่าน QR/เว็บนั้นเสร็จสมบูรณ์ และเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยังโหนด iOS ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืนทริกเกอร์คำปลุกที่จัดเก็บไว้
    - `voicewake.set` อัปเดตทริกเกอร์คำปลุกและกระจายการเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การรับส่งข้อความและบันทึก">
    - `send` คือ RPC สำหรับการส่งออกโดยตรงไปยังช่องทาง/บัญชี/เธรดเป้าหมายภายนอกตัวรันแชต
    - `logs.tail` ส่งคืนส่วนท้ายของไฟล์บันทึก Gateway ที่กำหนดค่าไว้ พร้อมตัวควบคุมเคอร์เซอร์/ขีดจำกัด และจำนวนไบต์สูงสุด

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.catalog` ส่งคืนแค็ตตาล็อกผู้ให้บริการ Talk แบบอ่านอย่างเดียวสำหรับเสียงพูด การถอดเสียงแบบสตรีม และเสียงแบบเรียลไทม์ โดยมี id ผู้ให้บริการแบบมาตรฐาน นามแฝงในรีจิสทรี ป้ายกำกับ สถานะที่กำหนดค่า ผลลัพธ์ `ready` ระดับกลุ่มที่เป็นทางเลือก id โมเดล/เสียงที่เปิดเผย โหมดมาตรฐาน ทรานสปอร์ต กลยุทธ์ brain และแฟล็กเสียง/ความสามารถแบบเรียลไทม์ โดยไม่ส่งคืนความลับของผู้ให้บริการหรือเปลี่ยนแปลงการกำหนดค่าส่วนกลาง Gateway ปัจจุบันตั้งค่า `ready` หลังจากใช้การเลือกผู้ให้บริการของรันไทม์แล้ว ไคลเอนต์ควรมองว่าการไม่มีค่านี้คือยังไม่ได้ตรวจสอบ เพื่อให้เข้ากันได้กับ Gateway รุ่นเก่า
    - `talk.config` ส่งคืนเพย์โหลดการกำหนดค่า Talk ที่มีผลอยู่ `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.session.create` สร้างเซสชัน Talk ที่ Gateway เป็นเจ้าของสำหรับ `realtime/gateway-relay`, `transcription/gateway-relay` หรือ `stt-tts/managed-room` สำหรับ `stt-tts/managed-room` ผู้เรียก `operator.write` ที่ส่ง `sessionKey` ต้องส่ง `spawnedBy` ด้วยเพื่อการมองเห็นคีย์เซสชันตามขอบเขต การสร้าง `sessionKey` แบบไม่มีขอบเขตและ `brain: "direct-tools"` ต้องใช้ `operator.admin`
    - `talk.session.join` ตรวจสอบโทเค็นเซสชันห้องที่จัดการ ปล่อยเหตุการณ์ `session.ready` หรือ `session.replaced` ตามจำเป็น และส่งคืนเมทาดาทาห้อง/เซสชันพร้อมเหตุการณ์ Talk ล่าสุด โดยไม่มีโทเค็นข้อความธรรมดาหรือแฮชโทเค็นที่จัดเก็บไว้
    - `talk.session.appendAudio` ต่อท้ายเสียงอินพุต PCM แบบ base64 ไปยังเซสชันรีเลย์เรียลไทม์และเซสชันถอดเสียงที่ Gateway เป็นเจ้าของ
    - `talk.session.startTurn`, `talk.session.endTurn` และ `talk.session.cancelTurn` ขับเคลื่อนวงจรชีวิตเทิร์นของห้องที่จัดการ พร้อมการปฏิเสธเทิร์นที่ค้างก่อนล้างสถานะ
    - `talk.session.cancelOutput` หยุดเอาต์พุตเสียงของผู้ช่วย โดยหลักใช้สำหรับการพูดแทรกที่ควบคุมด้วย VAD ในเซสชันรีเลย์ของ Gateway
    - `talk.session.submitToolResult` ทำให้การเรียกเครื่องมือของผู้ให้บริการที่ปล่อยโดยเซสชันรีเลย์เรียลไทม์ที่ Gateway เป็นเจ้าของเสร็จสมบูรณ์ ส่ง `options: { willContinue: true }` สำหรับเอาต์พุตเครื่องมือระหว่างทางเมื่อจะมีผลลัพธ์สุดท้ายตามมา หรือ `options: { suppressResponse: true }` เมื่อผลลัพธ์เครื่องมือควรตอบสนองการเรียกของผู้ให้บริการโดยไม่เริ่มการตอบกลับผู้ช่วยแบบเรียลไทม์อีกครั้ง
    - `talk.session.steer` ส่งการควบคุมเสียงของรันที่กำลังทำงานไปยังเซสชัน Talk ที่มีเอเจนต์หนุนหลังและ Gateway เป็นเจ้าของ โดยรับ `{ sessionId, text, mode? }` ซึ่ง `mode` คือ `status`, `steer`, `cancel` หรือ `followup`; หากละเว้นโหมด ระบบจะจำแนกจากข้อความที่พูด
    - `talk.session.close` ปิดเซสชันรีเลย์ การถอดเสียง หรือห้องที่จัดการที่ Gateway เป็นเจ้าของ และปล่อยเหตุการณ์ Talk ปลายทาง
    - `talk.mode` ตั้งค่า/กระจายสถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.client.create` สร้างเซสชันผู้ให้บริการเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของโดยใช้ `webrtc` หรือ `provider-websocket` ขณะที่ Gateway เป็นเจ้าของการกำหนดค่า ข้อมูลประจำตัว คำสั่ง และนโยบายเครื่องมือ
    - `talk.client.toolCall` ให้ทรานสปอร์ตเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของส่งต่อการเรียกเครื่องมือของผู้ให้บริการไปยังนโยบายของ Gateway เครื่องมือแรกที่รองรับคือ `openclaw_agent_consult`; ไคลเอนต์จะได้รับ id รันและรอเหตุการณ์วงจรชีวิตแชตปกติก่อนส่งผลลัพธ์เครื่องมือเฉพาะผู้ให้บริการ
    - `talk.client.steer` ส่งการควบคุมเสียงของรันที่กำลังทำงานสำหรับทรานสปอร์ตเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของ Gateway จะแก้หารันแบบฝังที่กำลังทำงานจาก `sessionKey` และส่งคืนผลลัพธ์ยอมรับ/ปฏิเสธแบบมีโครงสร้างแทนการทิ้งคำสั่ง steer อย่างเงียบ ๆ
    - `talk.event` คือช่องเหตุการณ์ Talk เดียวสำหรับอะแดปเตอร์เรียลไทม์ การถอดเสียง STT/TTS ห้องที่จัดการ โทรศัพท์ และการประชุม
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะเปิดใช้งาน TTS ผู้ให้บริการที่ใช้งานอยู่ ผู้ให้บริการสำรอง และสถานะการกำหนดค่าผู้ให้บริการ
    - `tts.providers` ส่งคืนรายการผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะ prefs ของ TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงพูดแบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ การกำหนดค่า การอัปเดต และตัวช่วยตั้งค่า">
    - `secrets.reload` แก้หา SecretRefs ที่ใช้งานอยู่อีกครั้ง และสลับสถานะความลับของรันไทม์เฉพาะเมื่อสำเร็จทั้งหมด
    - `secrets.resolve` แก้หาการกำหนดค่าความลับสำหรับคำสั่งเป้าหมายในชุดคำสั่ง/เป้าหมายที่ระบุ
    - `config.get` ส่งคืนสแนปช็อตการกำหนดค่าปัจจุบันและแฮช
    - `config.set` เขียนเพย์โหลดการกำหนดค่าที่ผ่านการตรวจสอบแล้ว
    - `config.patch` ผสานการอัปเดตการกำหนดค่าบางส่วน การแทนที่อาร์เรย์แบบทำลายข้อมูล
      ต้องมีพาธที่ได้รับผลกระทบใน `replacePaths`; อาร์เรย์ซ้อน
      ภายใต้รายการอาร์เรย์ใช้พาธ `[]` เช่น `agents.list[].skills`
    - `config.apply` ตรวจสอบ + แทนที่เพย์โหลดการกำหนดค่าทั้งหมด
    - `config.schema` ส่งคืนเพย์โหลดสคีมาการกำหนดค่าแบบสดที่ Control UI และเครื่องมือ CLI ใช้: สคีมา, `uiHints`, เวอร์ชัน และเมทาดาทาการสร้าง รวมถึงเมทาดาทาสคีมาของ Plugin + ช่องทางเมื่อรันไทม์โหลดได้ สคีมามีเมทาดาทาฟิลด์ `title` / `description` ที่ได้จากป้ายกำกับและข้อความช่วยเหลือชุดเดียวกับที่ UI ใช้ รวมถึงอ็อบเจกต์ซ้อน ไวลด์การ์ด รายการอาร์เรย์ และกิ่งการประกอบ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืนเพย์โหลดค้นหาแบบจำกัดขอบเขตพาธสำหรับพาธการกำหนดค่าหนึ่งรายการ: พาธที่ทำให้เป็นมาตรฐาน โหนดสคีมาแบบตื้น hint ที่ตรงกัน + `hintPath`, `reloadKind` ที่เป็นทางเลือก และสรุปลูกโดยตรงสำหรับการเจาะลึกของ UI/CLI `reloadKind` เป็นหนึ่งใน `restart`, `hot` หรือ `none` และสะท้อนตัววางแผนโหลดการกำหนดค่า Gateway ใหม่สำหรับพาธที่ขอ โหนดสคีมาค้นหาจะเก็บเอกสารที่ผู้ใช้เห็นและฟิลด์ตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขตตัวเลข/สตริง/อาร์เรย์/อ็อบเจกต์ และแฟล็กอย่าง `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกเปิดเผย `key`, `path` ที่ทำให้เป็นมาตรฐาน, `type`, `required`, `hasChildren`, `reloadKind` ที่เป็นทางเลือก รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รันโฟลว์อัปเดต Gateway และกำหนดเวลาการรีสตาร์ตเฉพาะเมื่อการอัปเดตสำเร็จเอง ผู้เรียกที่มีเซสชันสามารถใส่ `continuationMessage` เพื่อให้การเริ่มต้นระบบกลับมาทำงานต่อด้วยเทิร์นเอเจนต์ติดตามผลหนึ่งครั้งผ่านคิวการทำงานต่อหลังรีสตาร์ต การอัปเดตผ่านตัวจัดการแพ็กเกจและการอัปเดต git-checkout ที่มีผู้ควบคุมจาก control plane ใช้การส่งต่องานไปยังบริการที่จัดการแบบแยกตัว แทนการแทนที่แผนผังแพ็กเกจหรือเปลี่ยนแปลงเอาต์พุต checkout/build ภายใน Gateway ที่กำลังทำงาน การส่งต่องานที่เริ่มแล้วส่งคืน `ok: true` พร้อม `result.reason: "managed-service-handoff-started"` และ `handoff.status: "started"`; การส่งต่องานที่ไม่พร้อมใช้งานหรือล้มเหลวส่งคืน `ok: false` พร้อม `managed-service-handoff-unavailable` หรือ `managed-service-handoff-failed` รวมถึง `handoff.command` เมื่อจำเป็นต้องอัปเดตผ่านเชลล์ด้วยตนเอง การส่งต่องานที่ไม่พร้อมใช้งานหมายความว่า OpenClaw ไม่มีขอบเขตผู้ควบคุมที่ปลอดภัยหรืออัตลักษณ์บริการที่คงทน เช่น `OPENCLAW_SYSTEMD_UNIT` สำหรับ systemd ระหว่างการส่งต่องานที่เริ่มแล้ว restart sentinel อาจรายงาน `stats.reason: "restart-health-pending"` ชั่วครู่; การทำงานต่อจะถูกหน่วงจนกว่า CLI จะตรวจสอบ Gateway ที่รีสตาร์ตแล้วและเขียน sentinel `ok` สุดท้าย
    - `update.status` รีเฟรชและส่งคืน restart sentinel การอัปเดตล่าสุด รวมถึงเวอร์ชันที่กำลังทำงานหลังรีสตาร์ตเมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผยตัวช่วยตั้งค่าเริ่มต้นผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วยสำหรับเอเจนต์และเวิร์กสเปซ">
    - `agents.list` ส่งคืนรายการเอเจนต์ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลและเมทาดาตารันไทม์
    - `agents.create`, `agents.update`, และ `agents.delete` จัดการระเบียนเอเจนต์และการเชื่อมต่อเวิร์กสเปซ
    - `agents.files.list`, `agents.files.get`, และ `agents.files.set` จัดการไฟล์เวิร์กสเปซเริ่มต้นที่เปิดเผยให้เอเจนต์ใช้
    - `tasks.list`, `tasks.get`, และ `tasks.cancel` เปิดเผยบัญชีรายการงานของ Gateway ให้ SDK และไคลเอนต์ผู้ปฏิบัติการใช้
    - `artifacts.list`, `artifacts.get`, และ `artifacts.download` เปิดเผยสรุปอาร์ติแฟกต์ที่ได้จากทรานสคริปต์และการดาวน์โหลดสำหรับขอบเขต `sessionKey`, `runId`, หรือ `taskId` ที่ระบุอย่างชัดเจน คิวรีรันและงานจะ resolve เซสชันเจ้าของฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อทรานสคริปต์ที่มีที่มาตรงกันเท่านั้น แหล่ง URL ที่ไม่ปลอดภัยหรือเป็น local จะส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการดึงข้อมูลฝั่งเซิร์ฟเวอร์
    - `environments.list` และ `environments.status` เปิดเผยการค้นพบสภาพแวดล้อมแบบอ่านอย่างเดียวของ Gateway-local และ Node ให้ไคลเอนต์ SDK ใช้
    - `agent.identity.get` ส่งคืนตัวตนผู้ช่วยที่มีผลสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้รันเสร็จสิ้นและส่งคืนสแนปช็อตปลายทางเมื่อมี

  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึงเมทาดาตา `agentRuntime` ต่อแถวเมื่อกำหนดค่าแบ็กเอนด์รันไทม์ของเอเจนต์ไว้
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับเหตุการณ์ทรานสคริปต์/ข้อความสำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนตัวอย่างทรานสคริปต์แบบมีขอบเขตสำหรับคีย์เซสชันที่ระบุ
    - `sessions.describe` ส่งคืนหนึ่งแถวเซสชันของ Gateway สำหรับคีย์เซสชันที่ตรงกันพอดี
    - `sessions.resolve` resolve หรือทำให้เป้าหมายเซสชันเป็นรูปแบบมาตรฐาน
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปยังเซสชันที่มีอยู่
    - `sessions.steer` เป็นตัวแปรแบบ interrupt-and-steer สำหรับเซสชันที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่เป็นตัวเลือก หรือส่งเฉพาะ `runId` สำหรับรันที่ใช้งานอยู่ซึ่ง Gateway สามารถ resolve ไปยังเซสชันได้
    - `sessions.patch` อัปเดตเมทาดาตา/การแทนที่ของเซสชัน และรายงานโมเดลมาตรฐานที่ resolve แล้วพร้อม `agentRuntime` ที่มีผล
    - `sessions.reset`, `sessions.delete`, และ `sessions.compact` ทำการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้ทั้งหมด
    - การดำเนินการแชทยังคงใช้ `chat.history`, `chat.send`, `chat.abort`, และ `chat.inject` `chat.history` ถูกปรับให้เป็นรูปแบบการแสดงผลสำหรับไคลเอนต์ UI: แท็ก directive แบบอินไลน์จะถูกตัดออกจากข้อความที่มองเห็นได้, เพย์โหลด XML ของการเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) และโทเค็นควบคุมโมเดลแบบ ASCII/เต็มความกว้างที่รั่วไหลจะถูกตัดออก, แถวผู้ช่วยที่เป็นโทเค็นเงียบล้วน เช่น `NO_REPLY` / `no_reply` ที่ตรงทุกตัวอักษรจะถูกละไว้, และแถวที่ใหญ่เกินไปอาจถูกแทนที่ด้วย placeholder
    - `chat.message.get` เป็นตัวอ่านข้อความเต็มแบบมีขอบเขตที่เพิ่มเข้ามาสำหรับรายการทรานสคริปต์ที่มองเห็นได้รายการเดียว ไคลเอนต์ส่ง `sessionKey`, `agentId` ที่เป็นตัวเลือกเมื่อการเลือกเซสชันอยู่ในขอบเขตของเอเจนต์, พร้อม `messageId` ของทรานสคริปต์ที่เคยแสดงผ่าน `chat.history` และ Gateway จะส่งคืน projection ที่ปรับให้เป็นรูปแบบการแสดงผลเดียวกันโดยไม่มีขีดจำกัดการตัดทอนแบบเบาของประวัติ เมื่อรายการที่จัดเก็บไว้ยังพร้อมใช้งานและไม่ใหญ่เกินไป
    - `chat.send` รับ `fastMode: "auto"` แบบหนึ่งเทิร์นเพื่อใช้โหมดเร็วสำหรับการเรียกโมเดลที่เริ่มก่อนจุดตัดอัตโนมัติ จากนั้นเริ่มการเรียกแบบ retry, fallback, tool-result, หรือ continuation ภายหลังโดยไม่ใช้โหมดเร็ว จุดตัดมีค่าเริ่มต้นเป็น 60 วินาที และสามารถกำหนดค่าต่อโมเดลได้ด้วย `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ผู้เรียก `chat.send` สามารถส่ง `fastAutoOnSeconds` แบบหนึ่งเทิร์นเพื่อแทนที่จุดตัดสำหรับคำขอนั้น

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และโทเค็นอุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วซึ่งรอดำเนินการและได้รับการอนุมัติ
    - `device.pair.approve`, `device.pair.reject`, และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก
    - `device.token.revoke` เพิกถอนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่ Node, การ invoke, และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, และ `node.pair.verify` ครอบคลุมการจับคู่ Node และการตรวจสอบการเริ่มต้น
    - `node.list` และ `node.describe` ส่งคืนสถานะ Node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับ Node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง Node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอ invoke
    - `node.event` นำเหตุการณ์ที่เกิดจาก Node กลับเข้าสู่ Gateway
    - `node.pending.pull` และ `node.pending.ack` เป็น API คิวของ Node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบคงทนสำหรับ Node ที่ออฟไลน์/ไม่ได้เชื่อมต่อ

  </Accordion>

  <Accordion title="ตระกูลการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการและส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการสแนปช็อตนโยบายการอนุมัติ exec ของ Gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec แบบ Node-local ผ่านคำสั่งรีเลย์ของ Node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่กำหนดโดย Plugin

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ, Skills, และเครื่องมือ">
    - ระบบอัตโนมัติ: `wake` จัดกำหนดการการฉีดข้อความปลุกทันทีหรือใน Heartbeat ถัดไป; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่จัดกำหนดการไว้
    - `cron.run` ยังคงเป็น RPC แบบ enqueue-style สำหรับรันด้วยตนเอง ไคลเอนต์ที่ต้องการความหมายเชิงการเสร็จสิ้นควรอ่าน `runId` ที่ส่งคืนและ poll `cron.runs`
    - `cron.runs` รับตัวกรอง `runId` ที่ไม่ว่างซึ่งเป็นตัวเลือก เพื่อให้ไคลเอนต์ติดตามรันด้วยตนเองหนึ่งรายการที่อยู่ในคิวได้โดยไม่แข่งกับรายการประวัติอื่นของงานเดียวกัน
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### ตระกูลเหตุการณ์ทั่วไป

- `chat`: การอัปเดตแชทของ UI เช่น `chat.inject` และเหตุการณ์แชทอื่นที่เป็นเฉพาะทรานสคริปต์
  ใน protocol v4 เพย์โหลด delta มี `deltaText`; `message` ยังคงเป็น
  สแนปช็อตผู้ช่วยแบบสะสม การแทนที่ที่ไม่ใช่ prefix ตั้งค่า `replace=true`
  และใช้ `deltaText` เป็นข้อความแทนที่
- `session.message`, `session.operation`, และ `session.tool`: การอัปเดตทรานสคริปต์,
  การดำเนินการเซสชันที่กำลังดำเนินอยู่, และ event-stream สำหรับเซสชัน
  ที่สมัครรับไว้
- `sessions.changed`: ดัชนีเซสชันหรือเมทาดาตาเปลี่ยนแปลง
- `presence`: การอัปเดตสแนปช็อตสถานะระบบ
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดตสแนปช็อตสุขภาพของ Gateway
- `heartbeat`: การอัปเดตสตรีมเหตุการณ์ Heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลงรัน/งาน Cron
- `shutdown`: การแจ้งเตือนการปิด Gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ Node
- `node.invoke.request`: การกระจายคำขอ invoke ของ Node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตอุปกรณ์ที่จับคู่แล้ว
- `voicewake.changed`: การกำหนดค่าทริกเกอร์คำปลุกเปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ Plugin

### เมธอดตัวช่วยของ Node

- Node อาจเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของไฟล์ปฏิบัติการ Skills
  สำหรับการตรวจสอบ auto-allow

### RPC ของบัญชีรายการงาน

ไคลเอนต์ผู้ปฏิบัติการอาจตรวจสอบและยกเลิกระเบียนงานเบื้องหลังของ Gateway ผ่าน
RPC ของบัญชีรายการงาน เมธอดเหล่านี้ส่งคืนสรุปงานที่ผ่านการ sanitize แล้ว ไม่ใช่
สถานะรันไทม์ดิบ

- `tasks.list` ต้องใช้ `operator.read`
  - พารามิเตอร์: `status` ที่เป็นตัวเลือก (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, หรือ `"timed_out"`) หรืออาร์เรย์ของสถานะเหล่านั้น,
    `agentId` ที่เป็นตัวเลือก, `sessionKey` ที่เป็นตัวเลือก, `limit` ที่เป็นตัวเลือกตั้งแต่ `1` ถึง
    `500`, และสตริง `cursor` ที่เป็นตัวเลือก
  - ผลลัพธ์: `{ "tasks": TaskSummary[], "nextCursor"?: string }`
- `tasks.get` ต้องใช้ `operator.read`
  - พารามิเตอร์: `{ "taskId": string }`
  - ผลลัพธ์: `{ "task": TaskSummary }`
  - ID งานที่หายไปจะส่งคืนรูปแบบข้อผิดพลาด not-found ของ Gateway
- `tasks.cancel` ต้องใช้ `operator.write`
  - พารามิเตอร์: `{ "taskId": string, "reason"?: string }`
  - ผลลัพธ์:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`
  - `found` รายงานว่าบัญชีรายการมีงานที่ตรงกันหรือไม่ `cancelled`
    รายงานว่ารันไทม์ยอมรับหรือบันทึกการยกเลิกหรือไม่

`TaskSummary` มี `id`, `status`, และเมทาดาตาที่เป็นตัวเลือก เช่น `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, progress,
สรุปปลายทาง, และข้อความข้อผิดพลาดที่ผ่านการ sanitize แล้ว `agentId` ระบุเอเจนต์
ที่กำลังดำเนินงาน; `sessionKey` และ `ownerKey` เก็บบริบทผู้ร้องขอและการควบคุมไว้

### เมธอดตัวช่วยของผู้ปฏิบัติการ

- ผู้ปฏิบัติการสามารถเรียก `commands.list` (`operator.read`) เพื่อดึงรายการคำสั่งรันไทม์
  สำหรับเอเจนต์ได้
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านเวิร์กสเปซเอเจนต์เริ่มต้น
  - `scope` ควบคุมพื้นผิวที่ `name` หลักชี้ไป:
    - `text` ส่งคืนโทเคนคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางเริ่มต้น `both` ส่งคืนชื่อเนทีฟที่รับรู้ผู้ให้บริการ
      เมื่อมี
  - `textAliases` มีนามแฝงสแลชแบบตรงตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่งเนทีฟที่รับรู้ผู้ให้บริการเมื่อมีอยู่
  - `provider` เป็นตัวเลือก และมีผลเฉพาะกับการตั้งชื่อเนทีฟรวมถึงความพร้อมใช้งานของคำสั่ง Plugin
    แบบเนทีฟเท่านั้น
  - `includeArgs=false` ละเว้นเมทาดาทาอาร์กิวเมนต์ที่ซีเรียลไลซ์จากการตอบกลับ
- ผู้ปฏิบัติการสามารถเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือรันไทม์สำหรับ
  เอเจนต์ได้ การตอบกลับมีเครื่องมือที่จัดกลุ่มและเมทาดาทาแหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: เครื่องมือของ Plugin เป็นตัวเลือกหรือไม่
- ผู้ปฏิบัติการสามารถเรียก `tools.effective` (`operator.read`) เพื่อดึงรายการเครื่องมือที่มีผลจริงในรันไทม์
  สำหรับเซสชันได้
  - ต้องมี `sessionKey`
  - Gateway อนุมานบริบทรันไทม์ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนที่จะยอมรับ
    บริบทการยืนยันตัวตนหรือการส่งมอบที่ผู้เรียกส่งมา
  - การตอบกลับเป็นการฉายภาพที่อนุมานจากเซิร์ฟเวอร์ตามขอบเขตเซสชันของรายการที่ใช้งานอยู่
    รวมถึงเครื่องมือของแกนหลัก, Plugin, ช่องทาง และเซิร์ฟเวอร์ MCP ที่ค้นพบแล้ว
  - `tools.effective` เป็นแบบอ่านอย่างเดียวสำหรับ MCP: อาจฉายแค็ตตาล็อก MCP ของเซสชันที่อุ่นอยู่ผ่าน
    นโยบายเครื่องมือขั้นสุดท้าย แต่จะไม่สร้างรันไทม์ MCP, เชื่อมต่อทรานสปอร์ต, หรือออก
    `tools/list` หากไม่มีแค็ตตาล็อกอุ่นที่ตรงกัน การตอบกลับอาจมีประกาศ เช่น
    `mcp-not-yet-connected`, `mcp-not-yet-listed`, หรือ `mcp-stale-catalog`
  - รายการเครื่องมือที่มีผลจริงใช้ `source="core"`, `source="plugin"`, `source="channel"`, หรือ
    `source="mcp"`
- ผู้ปฏิบัติการสามารถเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือที่พร้อมใช้งานหนึ่งรายการผ่าน
  เส้นทางนโยบาย Gateway เดียวกับ `/tools/invoke`
  - ต้องมี `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm`, และ
    `idempotencyKey` เป็นตัวเลือก
  - หากมีทั้ง `sessionKey` และ `agentId` เอเจนต์ของเซสชันที่ resolve แล้วต้องตรงกับ
    `agentId`
  - ตัวห่อแกนหลักที่ใช้ได้เฉพาะเจ้าของ เช่น `cron`, `gateway`, และ `nodes` ต้องมี
    ตัวตนเจ้าของ/ผู้ดูแลระบบ (`operator.admin`) แม้ว่าเมธอด `tools.invoke`
    เองจะเป็น `operator.write`
  - การตอบกลับเป็น envelope สำหรับ SDK ที่มี `ok`, `toolName`, `output` ที่เป็นตัวเลือก, และฟิลด์
    `error` แบบมีชนิด การอนุมัติหรือการปฏิเสธตามนโยบายจะส่งคืน `ok:false` ใน payload แทนที่จะ
    ข้ามไปป์ไลน์นโยบายเครื่องมือของ Gateway
- ผู้ปฏิบัติการสามารถเรียก `skills.status` (`operator.read`) เพื่อดึงรายการ Skills
  ที่มองเห็นได้สำหรับเอเจนต์
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านเวิร์กสเปซเอเจนต์เริ่มต้น
  - การตอบกลับมีความเข้าเกณฑ์, ข้อกำหนดที่ขาดหาย, การตรวจสอบคอนฟิก, และ
    ตัวเลือกการติดตั้งที่ผ่านการทำให้ปลอดภัยโดยไม่เปิดเผยค่าความลับดิบ
- ผู้ปฏิบัติการสามารถเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ
  เมทาดาทาการค้นพบของ ClawHub
- ผู้ปฏิบัติการสามารถเรียก `skills.upload.begin`, `skills.upload.chunk`, และ
  `skills.upload.commit` (`operator.admin`) เพื่อจัดเตรียมอาร์ไคฟ์ Skills ส่วนตัว
  ก่อนติดตั้งได้ นี่เป็นเส้นทางอัปโหลดของผู้ดูแลระบบแยกต่างหากสำหรับไคลเอนต์ที่เชื่อถือได้
  ไม่ใช่โฟลว์ติดตั้ง Skills ของ ClawHub ตามปกติ และถูกปิดใช้งานโดยค่าเริ่มต้น เว้นแต่
  เปิดใช้ `skills.install.allowUploadedArchives`
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    สร้างการอัปโหลดที่ผูกกับ slug และค่า force นั้น
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` ต่อท้ายไบต์ที่
    ออฟเซ็ตที่ถอดรหัสแล้วแบบตรงตัว
  - `skills.upload.commit({ uploadId, sha256? })` ตรวจสอบขนาดสุดท้ายและ
    SHA-256 การ commit จะสรุปการอัปโหลดเท่านั้น; ไม่ได้ติดตั้ง Skills
  - อาร์ไคฟ์ Skills ที่อัปโหลดเป็นอาร์ไคฟ์ zip ที่มีราก `SKILL.md` ชื่อไดเรกทอรีภายใน
    ของอาร์ไคฟ์จะไม่เลือกเป้าหมายการติดตั้ง
- ผู้ปฏิบัติการสามารถเรียก `skills.install` (`operator.admin`) ได้สามโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้ง
    โฟลเดอร์ Skills ลงในไดเรกทอรี `skills/` ของเวิร์กสเปซเอเจนต์เริ่มต้น
  - โหมดอัปโหลด: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    ติดตั้งการอัปโหลดที่ commit แล้วลงในไดเรกทอรี `skills/<slug>`
    ของเวิร์กสเปซเอเจนต์เริ่มต้น slug และค่า force ต้องตรงกับคำขอ
    `skills.upload.begin` เดิม โหมดนี้จะถูกปฏิเสธเว้นแต่
    เปิดใช้ `skills.install.allowUploadedArchives` การตั้งค่านี้ไม่มีผลต่อ
    การติดตั้งจาก ClawHub
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, timeoutMs? }`
    เรียกใช้การกระทำ `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ Gateway
    ไคลเอนต์รุ่นเก่าอาจยังส่ง `dangerouslyForceUnsafeInstall`; ฟิลด์นี้
    เลิกใช้แล้ว ยอมรับเฉพาะเพื่อความเข้ากันได้ของโปรโตคอล และถูกละเว้น ใช้
    `security.installPolicy` สำหรับการตัดสินใจติดตั้งที่ผู้ปฏิบัติการเป็นเจ้าของ
- ผู้ปฏิบัติการสามารถเรียก `skills.update` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามอยู่หนึ่งรายการ หรือการติดตั้ง ClawHub ที่ติดตามอยู่ทั้งหมดใน
    เวิร์กสเปซเอเจนต์เริ่มต้น
  - โหมดคอนฟิกแพตช์ค่า `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey`, และ `env`

### มุมมองของ `models.list`

`models.list` รับพารามิเตอร์ `view` แบบตัวเลือก:

- ละไว้หรือ `"default"`: พฤติกรรมรันไทม์ปัจจุบัน หากกำหนดค่า `agents.defaults.models` ไว้ การตอบกลับคือแค็ตตาล็อกที่อนุญาต รวมถึงโมเดลที่ค้นพบแบบไดนามิกสำหรับรายการ `provider/*` มิฉะนั้นการตอบกลับคือแค็ตตาล็อก Gateway เต็มรูปแบบ
- `"configured"`: พฤติกรรมขนาดเหมาะกับตัวเลือก หากกำหนดค่า `agents.defaults.models` ไว้ ค่านั้นยังมีผลเหนือกว่า รวมถึงการค้นพบตามขอบเขตผู้ให้บริการสำหรับรายการ `provider/*` หากไม่มี allowlist การตอบกลับจะใช้รายการ `models.providers.*.models` แบบชัดเจน และ fallback ไปยังแค็ตตาล็อกเต็มรูปแบบเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แค็ตตาล็อก Gateway เต็มรูปแบบ โดยข้าม `agents.defaults.models` ใช้สำหรับ UI วินิจฉัยและค้นพบ ไม่ใช่ตัวเลือกโมเดลตามปกติ

## การอนุมัติ exec

- เมื่อคำขอ exec ต้องได้รับการอนุมัติ Gateway จะกระจาย `exec.approval.requested`
- ไคลเอนต์ผู้ปฏิบัติการ resolve โดยเรียก `exec.approval.resolve` (ต้องมี scope `operator.approvals`)
- สำหรับ `host=node`, `exec.approval.request` ต้องมี `systemRunPlan` (`argv`/`cwd`/`rawCommand`/เมทาดาทาเซสชันแบบ canonical) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังการอนุมัติ การเรียก `node.invoke system.run` ที่ส่งต่อจะใช้ `systemRunPlan`
  แบบ canonical นั้นซ้ำเป็นบริบทคำสั่ง/cwd/เซสชันที่มีอำนาจ
- หากผู้เรียกเปลี่ยน `command`, `rawCommand`, `cwd`, `agentId`, หรือ
  `sessionKey` ระหว่างการเตรียมและการส่งต่อ `system.run` ขั้นสุดท้ายที่อนุมัติแล้ว
  Gateway จะปฏิเสธการรันแทนที่จะเชื่อถือ payload ที่ถูกเปลี่ยน

## การ fallback การส่งมอบของเอเจนต์

- คำขอ `agent` สามารถใส่ `deliver=true` เพื่อขอการส่งมอบขาออกได้
- `bestEffortDeliver=false` คงพฤติกรรมแบบเข้มงวด: เป้าหมายการส่งมอบที่ resolve ไม่ได้หรือใช้ได้เฉพาะภายในจะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback ไปเป็นการดำเนินการเฉพาะเซสชันเมื่อไม่สามารถ resolve เส้นทางที่ส่งมอบภายนอกได้ (เช่น เซสชันภายใน/webchat หรือคอนฟิกหลายช่องทางที่กำกวม)
- ผลลัพธ์ `agent` ขั้นสุดท้ายอาจมี `result.deliveryStatus` เมื่อมีการขอการส่งมอบ
  โดยใช้สถานะ `sent`, `suppressed`, `partial_failed`, และ `failed`
  เดียวกับที่บันทึกไว้สำหรับ [`openclaw agent --json --deliver`](/th/cli/agent#json-delivery-status)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `packages/gateway-protocol/src/version.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธช่วงที่
  ไม่รวมโปรโตคอลปัจจุบันของตัวเอง ไคลเอนต์และเซิร์ฟเวอร์ปัจจุบันต้องใช้
  โปรโตคอล v4
- สคีมา + โมเดลถูกสร้างจากนิยาม TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

ไคลเอนต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่า
คงที่ตลอดโปรโตคอล v4 และเป็น baseline ที่คาดไว้สำหรับไคลเอนต์บุคคลที่สาม

| ค่าคงที่                                  | ค่าเริ่มต้น                                               | แหล่งที่มา                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| ระยะหมดเวลาคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| ระยะหมดเวลา Preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (คอนฟิก/env สามารถเพิ่มงบประมาณเซิร์ฟเวอร์/ไคลเอนต์แบบคู่ได้) |
| backoff การเชื่อมต่อใหม่เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| backoff การเชื่อมต่อใหม่สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| แคลมป์ fast-retry หลังการปิด device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ช่วงผ่อนผัน force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| ระยะหมดเวลาเริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| การปิดเมื่อ tick หมดเวลา                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศค่า `policy.tickIntervalMs`, `policy.maxPayload`,
และ `policy.maxBufferedBytes` ที่มีผลจริงใน `hello-ok`; ไคลเอนต์ควรเคารพค่าเหล่านั้น
แทนค่าเริ่มต้นก่อน handshake

## การยืนยันตัวตน

- การยืนยันตัวตน Gateway ด้วย shared-secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมดการยืนยันตัวตนที่กำหนดค่าไว้
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ non-loopback
  `gateway.auth.mode: "trusted-proxy"` จะผ่านการตรวจสอบการยืนยันตัวตนของ connect จาก
  request headers แทน `connect.params.auth.*`
- Private-ingress `gateway.auth.mode: "none"` จะข้ามการยืนยันตัวตน connect แบบ shared-secret
  ทั้งหมด; ห้ามเปิดโหมดนั้นบน ingress สาธารณะ/ที่ไม่น่าเชื่อถือ
- หลังจากจับคู่แล้ว Gateway จะออก **device token** ที่จำกัดขอบเขตตามบทบาทของการเชื่อมต่อ
  + scopes โดยจะส่งกลับใน `hello-ok.auth.deviceToken` และ client ควรเก็บไว้ใช้
  สำหรับการเชื่อมต่อในอนาคต
- Client ควรเก็บ `hello-ok.auth.deviceToken` หลักหลังจาก connect สำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วย device token **ที่เก็บไว้** นั้นควรใช้ชุด scope ที่อนุมัติและเก็บไว้
  สำหรับ token นั้นซ้ำด้วย วิธีนี้จะคงสิทธิ์อ่าน/ตรวจสอบ/สถานะที่ได้รับอนุญาตไว้แล้ว
  และหลีกเลี่ยงการลด reconnect ลงเป็น scope แบบ admin-only ที่แคบกว่าโดยนัยอย่างเงียบๆ
- การประกอบการยืนยันตัวตน connect ฝั่ง client (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระต่อกันและจะถูกส่งต่อเสมอเมื่อกำหนดไว้
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: shared token ที่ระบุโดยตรงก่อน,
    จากนั้น `deviceToken` ที่ระบุโดยตรง, แล้วจึงเป็น token ต่อ device ที่เก็บไว้ (อ้างอิงด้วย
    `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งก็ต่อเมื่อไม่มีรายการข้างต้นใด resolve เป็น
    `auth.token` ได้ shared token หรือ device token ใดๆ ที่ resolve ได้จะระงับการส่งค่านี้
  - การโปรโมต device token ที่เก็บไว้โดยอัตโนมัติในการ retry แบบ one-shot สำหรับ
    `AUTH_TOKEN_MISMATCH` ถูกจำกัดไว้สำหรับ **trusted endpoints เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` ตรึงไว้ `wss://` สาธารณะที่ไม่มีการตรึง
    จะไม่เข้าเงื่อนไข
- การ bootstrap ด้วย setup-code ในตัวจะส่งกลับ node หลัก
  `hello-ok.auth.deviceToken` พร้อม operator token แบบจำกัดขอบเขตใน
  `hello-ok.auth.deviceTokens` สำหรับการ handoff ไปยัง mobile ที่เชื่อถือได้ operator token
  จะรวม `operator.talk.secrets` สำหรับการอ่านการกำหนดค่า Talk แบบ native และไม่รวม
  `operator.admin` กับ `operator.pairing`
- ขณะที่การ bootstrap ด้วย setup-code แบบ non-baseline กำลังรอการอนุมัติ รายละเอียด `PAIRING_REQUIRED`
  จะรวม `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  และ `pauseReconnect: false` Client ควรเชื่อมต่อใหม่ต่อไปด้วย bootstrap token เดิม
  จนกว่าคำขอจะได้รับอนุมัติหรือ token จะไม่ถูกต้อง
- เก็บ `hello-ok.auth.deviceTokens` เฉพาะเมื่อ connect ใช้การยืนยันตัวตนแบบ bootstrap
  บน transport ที่เชื่อถือได้ เช่น `wss://` หรือการจับคู่ผ่าน loopback/local
- หาก client ส่ง `deviceToken` **ที่ระบุโดยตรง** หรือ `scopes` ที่ระบุโดยตรง
  ชุด scope ที่ caller ขอจะยังคงเป็นแหล่งอ้างอิงหลัก; scope ที่ cache ไว้จะถูกใช้ซ้ำ
  เฉพาะเมื่อ client ใช้ token ต่อ device ที่เก็บไว้ซ้ำเท่านั้น
- device token สามารถหมุนเวียน/เพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องมี scope `operator.pairing`) การหมุนเวียนหรือเพิกถอน node
  หรือบทบาทอื่นที่ไม่ใช่ operator ต้องมี `operator.admin` ด้วย
- `device.token.rotate` จะส่งกลับ metadata การหมุนเวียน โดยจะ echo bearer token ทดแทน
  เฉพาะสำหรับการเรียกจาก device เดียวกันที่ยืนยันตัวตนด้วย device token นั้นอยู่แล้ว
  เพื่อให้ client แบบ token-only สามารถเก็บ token ทดแทนก่อนเชื่อมต่อใหม่ได้
  การหมุนเวียนแบบ shared/admin จะไม่ echo bearer token
- การออก token การหมุนเวียน และการเพิกถอน จะยังคงจำกัดอยู่กับชุดบทบาทที่อนุมัติ
  ซึ่งบันทึกไว้ในรายการจับคู่ของ device นั้น; การเปลี่ยนแปลง token ไม่สามารถขยายหรือกำหนดเป้าหมาย
  บทบาทของ device ที่การอนุมัติการจับคู่ไม่เคยให้ไว้
- สำหรับ session ของ token ของ paired-device การจัดการ device จะจำกัดอยู่กับตัวเองเว้นแต่
  caller จะมี `operator.admin` ด้วย: caller ที่ไม่ใช่ admin จัดการได้เฉพาะ
  operator token สำหรับรายการ device **ของตนเอง** เท่านั้น การจัดการ token ของ node
  และ non-operator อื่นๆ เป็นแบบ admin-only แม้จะเป็น device ของ caller เองก็ตาม
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุด scope ของ operator token
  เป้าหมายเทียบกับ scope ของ session ปัจจุบันของ caller ด้วย caller ที่ไม่ใช่ admin
  ไม่สามารถหมุนเวียนหรือเพิกถอน operator token ที่กว้างกว่าที่ตนถืออยู่แล้วได้
- ความล้มเหลวในการยืนยันตัวตนจะรวม `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมของ client สำหรับ `AUTH_TOKEN_MISMATCH`:
  - client ที่เชื่อถือได้อาจลอง retry แบบจำกัดหนึ่งครั้งด้วย token ต่อ device ที่ cache ไว้
  - หาก retry นั้นล้มเหลว client ควรหยุด loop reconnect อัตโนมัติและแสดงแนวทางการดำเนินการของ operator
- `AUTH_SCOPE_MISMATCH` หมายความว่า device token ถูกจดจำได้แต่ไม่ครอบคลุม
  บทบาท/scopes ที่ร้องขอ Client ไม่ควรแสดงสิ่งนี้ว่าเป็น token ที่ผิด;
  ให้แจ้ง operator เพื่อจับคู่ใหม่หรืออนุมัติสัญญา scope ที่แคบกว่า/กว้างกว่า

## ข้อมูลระบุตัวตนของ device + การจับคู่

- Node ควรรวมข้อมูลระบุตัวตน device ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  fingerprint ของ keypair
- Gateway ออก token ต่อ device + บทบาท
- ต้องมีการอนุมัติการจับคู่สำหรับ device ID ใหม่ เว้นแต่เปิดใช้งานการอนุมัติอัตโนมัติแบบ local
- การอนุมัติการจับคู่อัตโนมัติมีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่แคบสำหรับ
  flow helper แบบ shared-secret ที่เชื่อถือได้
- การเชื่อมต่อ tailnet หรือ LAN บน host เดียวกันยังถือเป็น remote สำหรับการจับคู่และ
  ต้องมีการอนุมัติ
- โดยปกติ WS client จะรวมข้อมูลระบุตัวตน `device` ระหว่าง `connect` (operator +
  node) ข้อยกเว้น operator ที่ไม่มี device มีเฉพาะเส้นทางความเชื่อถือที่ระบุโดยตรง:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP ที่ไม่ปลอดภัยเฉพาะ localhost
  - การยืนยันตัวตน Control UI ของ operator แบบ `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
  - RPC backend `gateway-client` แบบ direct-loopback บนเส้นทาง helper ภายในที่สงวนไว้
- การละเว้นข้อมูลระบุตัวตนของ device มีผลต่อ scope เมื่อการเชื่อมต่อ operator
  ที่ไม่มี device ได้รับอนุญาตผ่านเส้นทางความเชื่อถือที่ระบุโดยตรง OpenClaw ยังจะล้าง
  scope ที่ประกาศเองให้เป็นชุดว่าง เว้นแต่เส้นทางนั้นมีข้อยกเว้นการรักษา scope
  ที่มีชื่อกำกับไว้ จากนั้นเมธอดที่ถูกควบคุมด้วย scope จะล้มเหลวด้วย
  `missing scope`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` เป็นเส้นทางรักษา scope
  แบบ break-glass ของ Control UI ไม่ได้ให้ scope แก่ client WebSocket
  backend แบบกำหนดเองหรือรูปแบบ CLI โดยพลการ
- เส้นทาง helper backend `gateway-client` แบบ direct-loopback ที่สงวนไว้จะรักษา
  scope เฉพาะสำหรับ RPC ของ control-plane ภายในแบบ local เท่านั้น; backend ID แบบกำหนดเอง
  จะไม่ได้รับข้อยกเว้นนี้
- การเชื่อมต่อทั้งหมดต้องลงนาม nonce `connect.challenge` ที่ server ให้มา

### การวินิจฉัยการย้ายการยืนยันตัวตนของ device

สำหรับ client รุ่นเก่าที่ยังใช้พฤติกรรมการลงนามก่อน challenge ตอนนี้ `connect` จะส่งกลับ
รหัสรายละเอียด `DEVICE_AUTH_*` ใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวทั่วไปในการย้าย:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client ละเว้น `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ลงนามด้วย nonce ที่เก่าหรือผิด            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ลายเซ็นไม่ตรงกับ payload v2       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอก skew ที่อนุญาต          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/canonicalization ของ public key ล้มเหลว         |

เป้าหมายการย้าย:

- รอ `connect.challenge` เสมอ
- ลงนาม payload v2 ที่รวม nonce ของ server
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload ลายเซ็นที่แนะนำคือ `v3` ซึ่ง bind `platform` และ `deviceFamily`
  เพิ่มเติมจาก field device/client/role/scopes/token/nonce
- ลายเซ็น `v2` รุ่นเก่ายังคงยอมรับเพื่อความเข้ากันได้ แต่การ pin metadata
  ของ paired-device ยังคงควบคุมนโยบายคำสั่งเมื่อ reconnect

## TLS + การตรึง

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- Client อาจเลือกตรึง fingerprint ของใบรับรอง Gateway (ดู config `gateway.tls`
  รวมถึง `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## Scope

โปรโตคอลนี้เปิดเผย **API ของ Gateway แบบเต็ม** (สถานะ, channels, models, chat,
agent, sessions, nodes, approvals ฯลฯ) พื้นผิวที่แน่นอนถูกกำหนดโดย
schema TypeBox ใน `packages/gateway-protocol/src/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [runbook ของ Gateway](/th/gateway)
