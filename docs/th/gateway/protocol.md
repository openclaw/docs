---
read_when:
    - การพัฒนาหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - กำลังสร้าง schema/models ของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การแฮนด์เชค, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-07-03T17:48:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

โปรโตคอล Gateway WS คือ **ระนาบควบคุมเดียว + การขนส่งของโหนด** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, UI เว็บ, แอป macOS, โหนด iOS/Android, โหนดแบบไม่มีส่วนหัว)
เชื่อมต่อผ่าน WebSocket และประกาศ **บทบาท** + **ขอบเขต** ของตน
ในช่วง handshake

## การขนส่ง

- WebSocket, เฟรมข้อความพร้อมเพย์โหลด JSON
- เฟรมแรก **ต้อง** เป็นคำขอ `connect`
- เฟรมก่อนเชื่อมต่อถูกจำกัดไว้ที่ 64 KiB หลังจาก handshake สำเร็จแล้ว ไคลเอนต์
  ควรทำตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้การวินิจฉัย
  เฟรมขาเข้าที่ใหญ่เกินและบัฟเฟอร์ขาออกที่ช้าจะปล่อยอีเวนต์ `payload.large`
  ก่อนที่ gateway จะปิดหรือละทิ้งเฟรมที่ได้รับผลกระทบ อีเวนต์เหล่านี้เก็บ
  ขนาด ขีดจำกัด พื้นผิว และโค้ดเหตุผลที่ปลอดภัย แต่ไม่เก็บเนื้อหาข้อความ
  เนื้อหาไฟล์แนบ เนื้อหาเฟรมดิบ โทเค็น คุกกี้ หรือค่าลับ

## Handshake (connect)

Gateway → ไคลเอนต์ (คำท้าก่อนเชื่อมต่อ):

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

ขณะที่ Gateway ยังกำลังเริ่มต้น sidecar ให้เสร็จ คำขอ `connect` อาจ
คืนข้อผิดพลาด `UNAVAILABLE` ที่ลองใหม่ได้ โดยตั้งค่า `details.reason` เป็น
`"startup-sidecars"` และมี `retryAfterMs` ไคลเอนต์ควรลองคำตอบนั้นใหม่
ภายในงบเวลาการเชื่อมต่อโดยรวม แทนที่จะแสดงเป็นความล้มเหลวของ
handshake ขั้นสุดท้าย

`server`, `features`, `snapshot` และ `policy` ทั้งหมดเป็นข้อมูลที่ schema
กำหนดให้มี (`packages/gateway-protocol/src/schema/frames.ts`) `auth` ก็จำเป็นเช่นกันและรายงาน
บทบาท/ขอบเขตที่เจรจาได้ `pluginSurfaceUrls` เป็นตัวเลือก และแมปชื่อพื้นผิวของ plugin
เช่น `canvas` ไปยัง URL ที่โฮสต์แบบมีขอบเขต

URL พื้นผิว plugin แบบมีขอบเขตอาจหมดอายุได้ โหนดสามารถเรียก
`node.pluginSurface.refresh` พร้อม `{ "surface": "canvas" }` เพื่อรับรายการใหม่
ใน `pluginSurfaceUrls` การปรับโครงสร้าง Plugin Canvas รุ่นทดลองไม่รองรับ
เส้นทางความเข้ากันได้ที่เลิกใช้แล้วอย่าง `canvasHostUrl`, `canvasCapability` หรือ
`node.canvas.capability.refresh`; ไคลเอนต์เนทีฟและ gateway ปัจจุบันต้องใช้พื้นผิว plugin

เมื่อไม่มีการออกโทเค็นอุปกรณ์ `hello-ok.auth` จะรายงานสิทธิ์
ที่เจรจาได้โดยไม่มีฟิลด์โทเค็น:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ไคลเอนต์แบ็กเอนด์ในโปรเซสเดียวกันที่เชื่อถือได้ (`client.id: "gateway-client"`,
`client.mode: "backend"`) อาจละ `device` ได้บนการเชื่อมต่อ direct loopback เมื่อ
ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน Gateway ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้
สำหรับ RPC ของระนาบควบคุมภายใน และป้องกันไม่ให้ค่า baseline การจับคู่ CLI/อุปกรณ์ที่ล้าสมัย
บล็อกงานแบ็กเอนด์ภายใน เช่น การอัปเดตเซสชัน subagent ไคลเอนต์ระยะไกล
ไคลเอนต์จากต้นทางเบราว์เซอร์ ไคลเอนต์โหนด และไคลเอนต์ที่ใช้โทเค็นอุปกรณ์/ตัวตนอุปกรณ์อย่างชัดเจน
ยังคงใช้การตรวจสอบการจับคู่และการอัปเกรดขอบเขตตามปกติ

เมื่อมีการออกโทเค็นอุปกรณ์ `hello-ok` จะรวมสิ่งต่อไปนี้ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

การบูตสแตรปด้วย QR/รหัสตั้งค่าในตัวเป็นเส้นทางส่งต่อมือถือแบบใหม่ การเชื่อมต่อ
ด้วยรหัสตั้งค่า baseline ที่สำเร็จจะคืนโทเค็นโหนดหลักพร้อมโทเค็น
operator แบบจำกัดหนึ่งรายการ:

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

การส่งต่อ operator ถูกจำกัดโดยเจตนา เพื่อให้การเริ่มใช้งานผ่าน QR สามารถเริ่ม
ลูป operator บนมือถือและตั้งค่าเนทีฟให้เสร็จได้โดยไม่มอบขอบเขต
การเปลี่ยนแปลงการจับคู่หรือ `operator.admin` โดยมี `operator.talk.secrets` เพื่อให้
ไคลเอนต์เนทีฟอ่านการกำหนดค่า Talk ที่ต้องใช้หลังการบูตสแตรปได้ การเข้าถึง
การจับคู่และผู้ดูแลระบบที่กว้างขึ้นต้องใช้การจับคู่ operator ที่อนุมัติแยกต่างหากหรือ
โฟลว์โทเค็น ไคลเอนต์ควรคงค่า
`hello-ok.auth.deviceTokens` เฉพาะ
เมื่อการเชื่อมต่อใช้ auth สำหรับบูตสแตรปบนการขนส่งที่เชื่อถือได้ เช่น `wss://` หรือ
การจับคู่ผ่าน loopback/local

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

## การจัดเฟรม

- **คำขอ**: `{type:"req", id, method, params}`
- **คำตอบ**: `{type:"res", id, ok, payload|error}`
- **อีเวนต์**: `{type:"event", event, payload, seq?, stateVersion?}`

เมธอดที่มีผลข้างเคียงต้องใช้ **คีย์ idempotency** (ดู schema)

## บทบาท + ขอบเขต

สำหรับโมเดลขอบเขต operator แบบเต็ม การตรวจสอบช่วงอนุมัติ และความหมายของ shared-secret
ดู [ขอบเขต operator](/th/gateway/operator-scopes)

### บทบาท

- `operator` = ไคลเอนต์ระนาบควบคุม (CLI/UI/ระบบอัตโนมัติ)
- `node` = โฮสต์ความสามารถ (camera/screen/canvas/system.run)

### ขอบเขต (operator)

ขอบเขตทั่วไป:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` พร้อม `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)
เมื่อมีการรวม secret ไคลเอนต์ควรอ่านข้อมูลรับรองของผู้ให้บริการ Talk ที่ใช้งานอยู่
จาก `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
ยังคงมีรูปร่างตามแหล่งที่มา และอาจเป็นออบเจกต์ SecretRef หรือสตริงที่ถูกปกปิด

เมธอด RPC ของ gateway ที่ plugin ลงทะเบียนไว้อาจขอขอบเขต operator ของตนเองได้ แต่
คำนำหน้าผู้ดูแลระบบแกนกลางที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะถูกแก้เป็น `operator.admin` เสมอ

ขอบเขตเมธอดเป็นเพียงด่านแรกเท่านั้น คำสั่ง slash บางรายการที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจสอบระดับคำสั่งที่เข้มงวดกว่าเพิ่มเติม ตัวอย่างเช่น การเขียน
`/config set` และ `/config unset` แบบถาวรต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบขอบเขตเพิ่มเติมในช่วงอนุมัติ นอกเหนือจาก
ขอบเขตเมธอดพื้นฐาน:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มีคำสั่งโหนดที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่รวม `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### ความสามารถ/คำสั่ง/สิทธิ์ (โหนด)

โหนดประกาศ claim ความสามารถตอนเชื่อมต่อ:

- `caps`: หมวดหมู่ความสามารถระดับสูง เช่น `camera`, `canvas`, `screen`,
  `location`, `voice` และ `talk`
- `commands`: allowlist คำสั่งสำหรับ invoke
- `permissions`: ตัวสลับแบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือว่าสิ่งเหล่านี้เป็น **claim** และบังคับใช้ allowlist ฝั่งเซิร์ฟเวอร์

## สถานะการปรากฏ

- `system-presence` คืนรายการที่ใช้ตัวตนอุปกรณ์เป็นคีย์
- รายการสถานะการปรากฏมี `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงแถวเดียวต่ออุปกรณ์ได้
  แม้เมื่ออุปกรณ์เชื่อมต่อเป็นทั้ง **operator** และ **node**
- `node.list` มีฟิลด์ตัวเลือก `lastSeenAtMs` และ `lastSeenReason` โหนดที่เชื่อมต่อจะรายงาน
  เวลาเชื่อมต่อปัจจุบันเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; โหนดที่จับคู่แล้วยังสามารถรายงาน
  สถานะการปรากฏเบื้องหลังแบบถาวรได้เมื่ออีเวนต์โหนดที่เชื่อถือได้อัปเดตเมทาดาทาการจับคู่

### อีเวนต์โหนดยังมีชีวิตอยู่เบื้องหลัง

โหนดอาจเรียก `node.event` พร้อม `event: "node.presence.alive"` เพื่อบันทึกว่าโหนดที่จับคู่แล้ว
ยังมีชีวิตอยู่ระหว่างการปลุกเบื้องหลัง โดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น enum แบบปิด: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` สตริง trigger ที่ไม่รู้จักจะถูก gateway ทำให้เป็น
`background` ก่อนคงค่า อีเวนต์จะถาวรเฉพาะสำหรับเซสชันอุปกรณ์โหนดที่ยืนยันตัวตนแล้ว
เท่านั้น; เซสชันที่ไม่มีอุปกรณ์หรือยังไม่จับคู่จะคืน `handled: false`

gateway ที่สำเร็จจะคืนผลลัพธ์แบบมีโครงสร้าง:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

gateway รุ่นเก่าอาจยังคงคืน `{ "ok": true }` สำหรับ `node.event`; ไคลเอนต์ควรมองว่านั่นเป็น
RPC ที่ได้รับการยืนยันแล้ว ไม่ใช่การคงค่าสถานะการปรากฏแบบถาวร

## การกำหนดขอบเขตอีเวนต์ broadcast

อีเวนต์ broadcast ของ WebSocket ที่เซิร์ฟเวอร์ส่งจะถูกกั้นด้วยขอบเขต เพื่อไม่ให้เซสชันที่มีขอบเขตการจับคู่หรือเฉพาะโหนดรับเนื้อหาเซสชันแบบ passive

- **เฟรมแชต เอเจนต์ และผลลัพธ์เครื่องมือ** (รวมถึงอีเวนต์ `agent` แบบสตรีมและผลลัพธ์การเรียกเครื่องมือ) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcast `plugin.*` ที่ Plugin กำหนด** ถูกกั้นด้วย `operator.write` หรือ `operator.admin` ขึ้นอยู่กับวิธีที่ Plugin ลงทะเบียนไว้
- **อีเวนต์สถานะและการขนส่ง** (`heartbeat`, `presence`, `tick`, วงจรชีวิตการเชื่อมต่อ/ตัดการเชื่อมต่อ ฯลฯ) ยังคงไม่ถูกจำกัด เพื่อให้ทุกเซสชันที่ยืนยันตัวตนแล้วสังเกตสุขภาพการขนส่งได้
- **ตระกูลอีเวนต์ broadcast ที่ไม่รู้จัก** จะถูกกั้นด้วยขอบเขตโดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนคลายอย่างชัดเจน

การเชื่อมต่อของไคลเอนต์แต่ละรายการจะเก็บหมายเลขลำดับต่อไคลเอนต์ของตนเอง เพื่อให้ broadcast รักษาลำดับแบบเพิ่มขึ้นบนซ็อกเก็ตนั้น แม้เมื่อไคลเอนต์ต่างกันเห็นชุดย่อยของสตรีมอีเวนต์ที่ถูกกรองด้วยขอบเขตต่างกัน

## กลุ่มเมธอด RPC ทั่วไป

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ข้างต้น นี่
ไม่ใช่ dump ที่สร้างขึ้น — `hello-ok.features.methods` เป็นรายการค้นพบ
แบบอนุรักษนิยมที่สร้างจาก `src/gateway/server-methods-list.ts` บวกกับ export เมธอด
ของ plugin/channel ที่โหลดแล้ว ให้ถือว่าเป็นการค้นพบฟีเจอร์ ไม่ใช่การแจกแจงเต็ม
ของ `src/gateway/server-methods/*.ts`

  <AccordionGroup>
  <Accordion title="ระบบและตัวตน">
    - `health` คืนค่าสแนปชอตสถานะสุขภาพของ Gateway ที่แคชไว้หรือเพิ่งตรวจสอบใหม่
    - `diagnostics.stability` คืนค่าตัวบันทึกเสถียรภาพการวินิจฉัยล่าสุดแบบจำกัดขอบเขต โดยเก็บเมทาดาทาการปฏิบัติงาน เช่น ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าหน่วยความจำ สถานะคิว/เซสชัน ชื่อช่องทาง/Plugin และรหัสเซสชัน ไม่เก็บข้อความแชท เนื้อหา Webhook เอาต์พุตของเครื่องมือ เนื้อหาคำขอหรือคำตอบดิบ โทเค็น คุกกี้ หรือค่าลับ ต้องมีขอบเขตการอ่านของผู้ปฏิบัติงาน
    - `status` คืนค่าสรุป Gateway ในรูปแบบ `/status`; ฟิลด์ที่ละเอียดอ่อนจะรวมไว้เฉพาะสำหรับไคลเอนต์ผู้ปฏิบัติงานที่มีขอบเขตผู้ดูแลระบบ
    - `gateway.identity.get` คืนค่าตัวตนอุปกรณ์ Gateway ที่ใช้โดยโฟลว์รีเลย์และการจับคู่
    - `system-presence` คืนค่าสแนปชอตสถานะปรากฏตัวปัจจุบันสำหรับอุปกรณ์ผู้ปฏิบัติงาน/Node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่มเหตุการณ์ระบบและสามารถอัปเดต/ออกอากาศบริบทสถานะปรากฏตัวได้
    - `last-heartbeat` คืนค่าเหตุการณ์ Heartbeat ล่าสุดที่คงอยู่
    - `set-heartbeats` สลับการประมวลผล Heartbeat บน Gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` คืนค่าแคตตาล็อกโมเดลที่รันไทม์อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าไว้ในขนาดตัวเลือก (`agents.defaults.models` ก่อน แล้วจึง `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแคตตาล็อกเต็ม
    - `usage.status` คืนค่าสรุปหน้าต่างการใช้งาน/โควตาคงเหลือของผู้ให้บริการ
    - `usage.cost` คืนค่าสรุปการใช้งานต้นทุนแบบรวมสำหรับช่วงวันที่
      ส่ง `agentId` สำหรับเอเจนต์เดียว หรือ `agentScope: "all"` เพื่อรวมเอเจนต์ที่กำหนดค่าไว้
    - `doctor.memory.status` คืนค่าความพร้อมของหน่วยความจำเวกเตอร์ / embedding ที่แคชไว้สำหรับพื้นที่ทำงานเอเจนต์เริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจน ไคลเอนต์ที่รองรับ Dreaming อาจส่ง `{ "agentId": "agent-id" }` เพื่อจำกัดสถิติที่เก็บ Dreaming ให้กับพื้นที่ทำงานเอเจนต์ที่เลือกได้ด้วย; หากละ `agentId` จะคงการถอยกลับไปยังเอเจนต์เริ่มต้นและรวมพื้นที่ทำงาน Dreaming ที่กำหนดค่าไว้
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` และ `doctor.memory.dedupeDreamDiary` รับพารามิเตอร์ `{ "agentId": "agent-id" }` ที่เป็นตัวเลือกสำหรับมุมมอง/การกระทำ Dreaming ของเอเจนต์ที่เลือก เมื่อละ `agentId` จะทำงานบนพื้นที่ทำงานเอเจนต์เริ่มต้นที่กำหนดค่าไว้
    - `doctor.memory.remHarness` คืนค่าตัวอย่าง REM harness แบบอ่านอย่างเดียวและจำกัดขอบเขตสำหรับไคลเอนต์ control-plane ระยะไกล อาจรวมพาธพื้นที่ทำงาน ส่วนย่อยหน่วยความจำ Markdown แบบ grounded ที่เรนเดอร์แล้ว และตัวเลือกการโปรโมตเชิงลึก ดังนั้นผู้เรียกจึงต้องมี `operator.read`
    - `sessions.usage` คืนค่าสรุปการใช้งานรายเซสชัน ส่ง `agentId` สำหรับเอเจนต์เดียว
      หรือ `agentScope: "all"` เพื่อแสดงเอเจนต์ที่กำหนดค่าไว้ร่วมกัน
    - `sessions.usage.timeseries` คืนค่าการใช้งานแบบอนุกรมเวลาสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` คืนค่ารายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="ช่องทางและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` คืนค่าสรุปสถานะช่องทาง/Plugin ในตัว + ที่บันเดิลไว้
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีเฉพาะเมื่อช่องทางรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบ QR/เว็บสำหรับผู้ให้บริการช่องทางเว็บปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบ QR/เว็บนั้นเสร็จสิ้นและเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง Node iOS ที่ลงทะเบียนไว้
    - `voicewake.get` คืนค่าทริกเกอร์คำปลุกที่จัดเก็บไว้
    - `voicewake.set` อัปเดตทริกเกอร์คำปลุกและออกอากาศการเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การส่งข้อความและบันทึก">
    - `send` คือ RPC สำหรับส่งออกโดยตรงไปยังช่องทาง/บัญชี/เธรดเป้าหมายภายนอกตัวรันแชท
    - `logs.tail` คืนค่าท้ายบันทึกไฟล์ Gateway ที่กำหนดค่าไว้ พร้อมการควบคุมเคอร์เซอร์/ขีดจำกัดและจำนวนไบต์สูงสุด

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.catalog` คืนค่าแคตตาล็อกผู้ให้บริการ Talk แบบอ่านอย่างเดียวสำหรับเสียงพูด การถอดเสียงแบบสตรีม และเสียงแบบเรียลไทม์ โดยรวมรหัสผู้ให้บริการแบบมาตรฐาน นามแฝงในรีจิสทรี ป้ายกำกับ สถานะการกำหนดค่า ผลลัพธ์ `ready` ระดับกลุ่มที่เป็นตัวเลือก รหัสโมเดล/เสียงที่เปิดเผย โหมดมาตรฐาน การขนส่ง กลยุทธ์สมอง และแฟล็กเสียง/ความสามารถแบบเรียลไทม์ โดยไม่คืนค่าความลับของผู้ให้บริการหรือเปลี่ยนแปลงการกำหนดค่าส่วนกลาง Gateway ปัจจุบันตั้งค่า `ready` หลังจากใช้การเลือกผู้ให้บริการรันไทม์แล้ว; ไคลเอนต์ควรมองว่าการไม่มีค่านี้ยังไม่ได้รับการตรวจสอบเพื่อความเข้ากันได้กับ Gateway รุ่นเก่า
    - `talk.config` คืนค่าเพย์โหลดการกำหนดค่า Talk ที่มีผล; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.session.create` สร้างเซสชัน Talk ที่ Gateway เป็นเจ้าของสำหรับ `realtime/gateway-relay`, `transcription/gateway-relay` หรือ `stt-tts/managed-room` สำหรับ `stt-tts/managed-room` ผู้เรียก `operator.write` ที่ส่ง `sessionKey` ต้องส่ง `spawnedBy` ด้วยเพื่อให้มองเห็นคีย์เซสชันตามขอบเขต; การสร้าง `sessionKey` แบบไม่มีขอบเขตและ `brain: "direct-tools"` ต้องใช้ `operator.admin`
    - `talk.session.join` ตรวจสอบโทเค็นเซสชัน managed-room ปล่อยเหตุการณ์ `session.ready` หรือ `session.replaced` ตามจำเป็น และคืนค่าเมทาดาทาห้อง/เซสชันพร้อมเหตุการณ์ Talk ล่าสุด โดยไม่มีโทเค็นแบบข้อความธรรมดาหรือแฮชโทเค็นที่จัดเก็บไว้
    - `talk.session.appendAudio` เพิ่มเสียงอินพุต PCM แบบ base64 ไปยังเซสชันรีเลย์และถอดเสียงแบบเรียลไทม์ที่ Gateway เป็นเจ้าของ
    - `talk.session.startTurn`, `talk.session.endTurn` และ `talk.session.cancelTurn` ขับเคลื่อนวงจรชีวิตเทิร์นของ managed-room พร้อมปฏิเสธเทิร์นที่ค้างก่อนล้างสถานะ
    - `talk.session.cancelOutput` หยุดเอาต์พุตเสียงของผู้ช่วย โดยหลักสำหรับการแทรกพูดที่ควบคุมด้วย VAD ในเซสชันรีเลย์ของ Gateway
    - `talk.session.submitToolResult` ทำให้การเรียกเครื่องมือของผู้ให้บริการที่ปล่อยโดยเซสชันรีเลย์แบบเรียลไทม์ที่ Gateway เป็นเจ้าของเสร็จสมบูรณ์ ส่ง `options: { willContinue: true }` สำหรับเอาต์พุตเครื่องมือชั่วคราวเมื่อจะมีผลลัพธ์สุดท้ายตามมา หรือ `options: { suppressResponse: true }` เมื่อผลลัพธ์เครื่องมือควรทำให้การเรียกผู้ให้บริการเสร็จสิ้นโดยไม่เริ่มคำตอบผู้ช่วยแบบเรียลไทม์อีกครั้ง
    - `talk.session.steer` ส่งการควบคุมเสียงของรันที่ใช้งานอยู่เข้าสู่เซสชัน Talk ที่หนุนด้วยเอเจนต์และ Gateway เป็นเจ้าของ รับ `{ sessionId, text, mode? }` โดย `mode` คือ `status`, `steer`, `cancel` หรือ `followup`; โหมดที่ละไว้จะถูกจัดประเภทจากข้อความที่พูด
    - `talk.session.close` ปิดเซสชันรีเลย์ การถอดเสียง หรือ managed-room ที่ Gateway เป็นเจ้าของ และปล่อยเหตุการณ์ Talk ปลายทาง
    - `talk.mode` ตั้งค่า/ออกอากาศสถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.client.create` สร้างเซสชันผู้ให้บริการแบบเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของโดยใช้ `webrtc` หรือ `provider-websocket` ขณะที่ Gateway เป็นเจ้าของการกำหนดค่า ข้อมูลประจำตัว คำสั่ง และนโยบายเครื่องมือ
    - `talk.client.toolCall` ให้การขนส่งแบบเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของส่งต่อการเรียกเครื่องมือของผู้ให้บริการไปยังนโยบาย Gateway เครื่องมือแรกที่รองรับคือ `openclaw_agent_consult`; ไคลเอนต์จะได้รับรหัสรันและรอเหตุการณ์วงจรชีวิตแชทปกติก่อนส่งผลลัพธ์เครื่องมือเฉพาะผู้ให้บริการ
    - `talk.client.steer` ส่งการควบคุมเสียงของรันที่ใช้งานอยู่สำหรับการขนส่งแบบเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของ Gateway จะแก้รันแบบฝังที่ใช้งานอยู่จาก `sessionKey` และคืนค่าผลลัพธ์ที่มีโครงสร้างว่า accepted/rejected แทนการทิ้งการควบคุมไปเงียบ ๆ
    - `talk.event` คือช่องทางเหตุการณ์ Talk เดียวสำหรับอะแดปเตอร์เรียลไทม์ การถอดเสียง STT/TTS, managed-room, โทรศัพท์ และการประชุม
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` คืนค่าสถานะเปิดใช้งาน TTS ผู้ให้บริการที่ใช้งานอยู่ ผู้ให้บริการสำรอง และสถานะการกำหนดค่าผู้ให้บริการ
    - `tts.providers` คืนค่าคลังผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะค่ากำหนด TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงพูดแบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ การกำหนดค่า การอัปเดต และวิซาร์ด">
    - `secrets.reload` แก้ SecretRefs ที่ใช้งานอยู่อีกครั้งและสลับสถานะความลับรันไทม์เฉพาะเมื่อสำเร็จทั้งหมด
    - `secrets.resolve` แก้การกำหนดความลับเป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายเฉพาะ
    - `config.get` คืนค่าสแนปชอตการกำหนดค่าปัจจุบันและแฮช
    - `config.set` เขียนเพย์โหลดการกำหนดค่าที่ผ่านการตรวจสอบแล้ว
    - `config.patch` รวมการอัปเดตการกำหนดค่าบางส่วน การแทนที่อาร์เรย์แบบทำลายข้อมูล
      ต้องมีพาธที่ได้รับผลกระทบใน `replacePaths`; อาร์เรย์ซ้อน
      ใต้รายการอาร์เรย์ใช้พาธ `[]` เช่น `agents.list[].skills`
    - `config.apply` ตรวจสอบ + แทนที่เพย์โหลดการกำหนดค่าเต็ม
    - `config.schema` คืนค่าเพย์โหลดสคีมาการกำหนดค่าสดที่ใช้โดยเครื่องมือ Control UI และ CLI: สคีมา, `uiHints`, เวอร์ชัน และเมทาดาทาการสร้าง รวมถึงเมทาดาทาสคีมา Plugin + ช่องทางเมื่อรันไทม์โหลดได้ สคีมารวมเมทาดาทาฟิลด์ `title` / `description` ที่ได้จากป้ายกำกับและข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึงอ็อบเจกต์ซ้อน wildcard รายการอาร์เรย์ และสาขาการประกอบ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` คืนค่าเพย์โหลดการค้นหาแบบจำกัดพาธสำหรับพาธการกำหนดค่าหนึ่งรายการ: พาธที่ทำให้เป็นมาตรฐาน โหนดสคีมาแบบตื้น hint ที่ตรงกัน + `hintPath`, `reloadKind` ที่เป็นตัวเลือก และสรุปลูกโดยตรงสำหรับการเจาะลึก UI/CLI `reloadKind` เป็นหนึ่งใน `restart`, `hot` หรือ `none` และสะท้อนตัววางแผนโหลดการกำหนดค่า Gateway ใหม่สำหรับพาธที่ขอ โหนดสคีมาค้นหาจะคงเอกสารที่ผู้ใช้เห็นและฟิลด์ตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขตตัวเลข/สตริง/อาร์เรย์/อ็อบเจกต์ และแฟล็กเช่น `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกเปิดเผย `key`, `path` ที่ทำให้เป็นมาตรฐาน, `type`, `required`, `hasChildren`, `reloadKind` ที่เป็นตัวเลือก รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รันโฟลว์อัปเดต Gateway และกำหนดเวลาการรีสตาร์ตเฉพาะเมื่อการอัปเดตเองสำเร็จ; ผู้เรียกที่มีเซสชันสามารถรวม `continuationMessage` เพื่อให้การเริ่มต้นทำงานต่อด้วยเทิร์นเอเจนต์ติดตามผลหนึ่งครั้งผ่านคิวการดำเนินต่อหลังรีสตาร์ต การอัปเดตผ่านตัวจัดการแพ็กเกจและการอัปเดต git-checkout ภายใต้การกำกับจาก control plane ใช้การส่งต่อ managed-service แบบแยกตัว แทนการแทนที่ต้นไม้แพ็กเกจหรือเปลี่ยนแปลงเอาต์พุต checkout/build ภายใน Gateway ที่กำลังทำงาน การส่งต่อที่เริ่มแล้วคืนค่า `ok: true` พร้อม `result.reason: "managed-service-handoff-started"` และ `handoff.status: "started"`; การส่งต่อที่ใช้งานไม่ได้หรือล้มเหลวคืนค่า `ok: false` พร้อม `managed-service-handoff-unavailable` หรือ `managed-service-handoff-failed` รวมถึง `handoff.command` เมื่อจำเป็นต้องอัปเดตเชลล์ด้วยตนเอง การส่งต่อที่ใช้งานไม่ได้หมายความว่า OpenClaw ไม่มีขอบเขตตัวกำกับที่ปลอดภัยหรือตัวตนบริการที่คงทน เช่น `OPENCLAW_SYSTEMD_UNIT` สำหรับ systemd ระหว่างการส่งต่อที่เริ่มแล้ว sentinel การรีสตาร์ตอาจรายงาน `stats.reason: "restart-health-pending"` ชั่วครู่; การดำเนินต่อจะถูกหน่วงไว้จนกว่า CLI จะตรวจสอบ Gateway ที่รีสตาร์ตแล้วและเขียน sentinel `ok` สุดท้าย
    - `update.status` รีเฟรชและคืนค่า sentinel การรีสตาร์ตอัปเดตล่าสุด รวมถึงเวอร์ชันที่กำลังทำงานหลังรีสตาร์ตเมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผยวิซาร์ด onboarding ผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วย Agent และเวิร์กสเปซ">
    - `agents.list` ส่งคืนรายการ Agent ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลใช้งานและเมทาดาทารันไทม์
    - `agents.create`, `agents.update`, และ `agents.delete` จัดการระเบียน Agent และการเชื่อมต่อเวิร์กสเปซ
    - `agents.files.list`, `agents.files.get`, และ `agents.files.set` จัดการไฟล์เวิร์กสเปซเริ่มต้นที่เปิดเผยให้ Agent ใช้
    - `tasks.list`, `tasks.get`, และ `tasks.cancel` เปิดเผยบัญชีรายการงานของ Gateway ให้กับไคลเอนต์ SDK และผู้ปฏิบัติงาน
    - `artifacts.list`, `artifacts.get`, และ `artifacts.download` เปิดเผยสรุปอาร์ทิแฟกต์ที่ได้จากทรานสคริปต์และการดาวน์โหลดสำหรับขอบเขต `sessionKey`, `runId`, หรือ `taskId` ที่ระบุอย่างชัดเจน คิวรี Run และงานจะแก้ค่าเซสชันเจ้าของที่ฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อทรานสคริปต์ที่มีแหล่งที่มาตรงกัน แหล่ง URL ที่ไม่ปลอดภัยหรือเป็นแบบ local จะส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการดึงข้อมูลฝั่งเซิร์ฟเวอร์
    - `environments.list` และ `environments.status` เปิดเผยการค้นพบสภาพแวดล้อมแบบอ่านอย่างเดียวของ Gateway-local และ Node สำหรับไคลเอนต์ SDK
    - `agent.identity.get` ส่งคืนอัตลักษณ์ผู้ช่วยที่มีผลใช้งานสำหรับ Agent หรือเซสชัน
    - `agent.wait` รอให้ Run เสร็จสิ้นและส่งคืนสแนปช็อตปลายทางเมื่อมีให้ใช้งาน

  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึงเมทาดาทา `agentRuntime` ต่อแถวเมื่อมีการกำหนดค่าแบ็กเอนด์รันไทม์ของ Agent
    - `sessions.subscribe` และ `sessions.unsubscribe` เปิดหรือปิดการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` เปิดหรือปิดการสมัครรับเหตุการณ์ทรานสคริปต์/ข้อความสำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนตัวอย่างทรานสคริปต์แบบจำกัดขอบเขตสำหรับคีย์เซสชันที่ระบุ
    - `sessions.describe` ส่งคืนแถวเซสชัน Gateway หนึ่งแถวสำหรับคีย์เซสชันที่ตรงกันพอดี
    - `sessions.resolve` แก้ค่าหรือทำให้เป้าหมายเซสชันเป็นรูปแบบมาตรฐาน
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปในเซสชันที่มีอยู่
    - `sessions.steer` เป็นตัวแปรแบบ interrupt-and-steer สำหรับเซสชันที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่เป็นทางเลือก หรือส่งเฉพาะ `runId` สำหรับ Run ที่ใช้งานอยู่ซึ่ง Gateway สามารถแก้ค่าเป็นเซสชันได้
    - `sessions.patch` อัปเดตเมทาดาทา/การเขียนทับของเซสชัน และรายงานโมเดลมาตรฐานที่แก้ค่าแล้วพร้อม `agentRuntime` ที่มีผลใช้งาน
    - `sessions.reset`, `sessions.delete`, และ `sessions.compact` ดำเนินการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้ทั้งหมด
    - การดำเนินการแชทยังคงใช้ `chat.history`, `chat.send`, `chat.abort`, และ `chat.inject` `chat.history` ถูกปรับให้เป็นรูปแบบแสดงผลสำหรับไคลเอนต์ UI: แท็กคำสั่งแบบอินไลน์ถูกตัดออกจากข้อความที่มองเห็นได้, เพย์โหลด XML การเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) และโทเคนควบคุมโมเดล ASCII/เต็มความกว้างที่รั่วไหลจะถูกตัดออก, แถวผู้ช่วยที่เป็นโทเคนเงียบล้วน เช่น `NO_REPLY` / `no_reply` ที่ตรงพอดีจะถูกละไว้, และแถวที่มีขนาดใหญ่เกินไปอาจถูกแทนที่ด้วยตัวยึดตำแหน่ง
    - `chat.message.get` เป็นตัวอ่านข้อความเต็มแบบจำกัดขอบเขตที่เพิ่มเข้ามาสำหรับรายการทรานสคริปต์ที่มองเห็นได้รายการเดียว ไคลเอนต์ส่ง `sessionKey`, `agentId` ที่เป็นทางเลือกเมื่อการเลือกเซสชันมีขอบเขตตาม Agent, พร้อม `messageId` ของทรานสคริปต์ที่เคยถูกเปิดเผยผ่าน `chat.history` และ Gateway จะส่งคืนโปรเจกชันที่ปรับให้เป็นรูปแบบแสดงผลเดียวกันโดยไม่มีเพดานการตัดทอนประวัติแบบเบา เมื่อรายการที่จัดเก็บไว้ยังมีอยู่และไม่ใหญ่เกินไป
    - `chat.send` รับ `fastMode: "auto"` แบบหนึ่งรอบเพื่อใช้โหมดเร็วกับการเรียกโมเดลที่เริ่มก่อนจุดตัดอัตโนมัติ จากนั้นเริ่มการเรียก retry, fallback, tool-result, หรือ continuation ในภายหลังโดยไม่ใช้โหมดเร็ว จุดตัดมีค่าเริ่มต้นเป็น 60 วินาทีและกำหนดค่าต่อโมเดลได้ด้วย `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ผู้เรียก `chat.send` สามารถส่ง `fastAutoOnSeconds` แบบหนึ่งรอบเพื่อเขียนทับจุดตัดสำหรับคำขอนั้นได้

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และโทเคนอุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วซึ่งรอดำเนินการและได้รับอนุมัติ
    - `device.pair.approve`, `device.pair.reject`, และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียนโทเคนอุปกรณ์ที่จับคู่แล้วภายในบทบาทที่ได้รับอนุมัติและขอบเขตของผู้เรียก
    - `device.token.revoke` เพิกถอนโทเคนอุปกรณ์ที่จับคู่แล้วภายในบทบาทที่ได้รับอนุมัติและขอบเขตของผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่ Node, การเรียกใช้, และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, และ `node.pair.verify` ครอบคลุมการจับคู่ Node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` ส่งคืนสถานะ Node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับ Node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง Node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอเรียกใช้
    - `node.event` นำเหตุการณ์ที่เกิดจาก Node กลับเข้าสู่ Gateway
    - `node.pending.pull` และ `node.pending.ack` เป็น API คิวของ Node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบคงทนสำหรับ Node ที่ออฟไลน์/ถูกตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="ตระกูลการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบใช้ครั้งเดียว รวมถึงการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการ และส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการสแนปช็อตนโยบายการอนุมัติ exec ของ Gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec ในเครื่องของ Node ผ่านคำสั่ง relay ของ Node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่ Plugin กำหนด

  </Accordion>

  <Accordion title="Automation, Skills, และเครื่องมือ">
    - Automation: `wake` กำหนดเวลาการฉีดข้อความปลุกทันทีหรือใน Heartbeat ถัดไป; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานตามกำหนดเวลา
    - `cron.run` ยังคงเป็น RPC แบบเข้าคิวสำหรับการเรียกใช้ด้วยตนเอง ไคลเอนต์ที่ต้องการความหมายเชิงการเสร็จสิ้นควรอ่าน `runId` ที่ส่งคืนและ poll `cron.runs`
    - `cron.runs` รับตัวกรอง `runId` ที่ไม่ว่างซึ่งเป็นทางเลือก เพื่อให้ไคลเอนต์ติดตามการเรียกใช้ด้วยตนเองหนึ่งรายการที่เข้าคิวอยู่ได้โดยไม่แข่งกับรายการประวัติอื่นสำหรับงานเดียวกัน
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### ตระกูลเหตุการณ์ทั่วไป

- `chat`: การอัปเดตแชท UI เช่น `chat.inject` และเหตุการณ์แชทอื่นที่เป็นเฉพาะทรานสคริปต์
  ใน protocol v4 เพย์โหลด delta มี `deltaText`; `message` ยังคงเป็น
  สแนปช็อตผู้ช่วยแบบสะสม การแทนที่ที่ไม่ใช่ prefix ตั้งค่า `replace=true`
  และใช้ `deltaText` เป็นข้อความแทนที่
- `session.message`, `session.operation`, และ `session.tool`: การอัปเดตทรานสคริปต์,
  การดำเนินการเซสชันที่กำลังทำงาน, และ event-stream สำหรับเซสชัน
  ที่สมัครรับไว้
- `sessions.changed`: ดัชนีเซสชันหรือเมทาดาทาเปลี่ยนแปลง
- `presence`: การอัปเดตสแนปช็อตสถานะการปรากฏของระบบ
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดตสแนปช็อตสถานะสุขภาพของ Gateway
- `heartbeat`: การอัปเดต event stream ของ Heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลง Run/งาน Cron
- `shutdown`: การแจ้งเตือนการปิด Gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ Node
- `node.invoke.request`: การกระจายคำขอเรียกใช้ Node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตอุปกรณ์ที่จับคู่แล้ว
- `voicewake.changed`: การกำหนดค่าทริกเกอร์ wake-word เปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ Plugin

### เมธอดตัวช่วย Node

- Node อาจเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของไฟล์ปฏิบัติการ Skills
  สำหรับการตรวจสอบ auto-allow

### RPC บัญชีรายการงาน

ไคลเอนต์ผู้ปฏิบัติงานอาจตรวจสอบและยกเลิกระเบียนงานพื้นหลังของ Gateway ผ่าน
RPC บัญชีรายการงาน เมธอดเหล่านี้ส่งคืนสรุปงานที่ผ่านการทำความสะอาดแล้ว ไม่ใช่
สถานะรันไทม์ดิบ

- `tasks.list` ต้องใช้ `operator.read`
  - Params: `status` ที่เป็นทางเลือก (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, หรือ `"timed_out"`) หรืออาร์เรย์ของสถานะเหล่านั้น,
    `agentId` ที่เป็นทางเลือก, `sessionKey` ที่เป็นทางเลือก, `limit` ที่เป็นทางเลือกตั้งแต่ `1` ถึง
    `500`, และสตริง `cursor` ที่เป็นทางเลือก
  - Result: `{ "tasks": TaskSummary[], "nextCursor"?: string }`
- `tasks.get` ต้องใช้ `operator.read`
  - Params: `{ "taskId": string }`
  - Result: `{ "task": TaskSummary }`
  - id งานที่หายไปจะส่งคืนรูปแบบข้อผิดพลาด not-found ของ Gateway
- `tasks.cancel` ต้องใช้ `operator.write`
  - Params: `{ "taskId": string, "reason"?: string }`
  - Result:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`
  - `found` รายงานว่าบัญชีรายการมีงานที่ตรงกันหรือไม่ `cancelled`
    รายงานว่ารันไทม์ยอมรับหรือบันทึกการยกเลิกหรือไม่

`TaskSummary` มี `id`, `status`, และเมทาดาทาที่เป็นทางเลือก เช่น `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamp, ความคืบหน้า,
สรุปปลายทาง, และข้อความข้อผิดพลาดที่ผ่านการทำความสะอาดแล้ว `agentId` ระบุ Agent
ที่ดำเนินการงาน; `sessionKey` และ `ownerKey` เก็บรักษาบริบทของผู้ร้องขอและการควบคุม

### เมธอดตัวช่วยผู้ปฏิบัติงาน

- ผู้ปฏิบัติการสามารถเรียก `commands.list` (`operator.read`) เพื่อดึงคลังคำสั่งรันไทม์สำหรับเอเจนต์ได้
  - `agentId` เป็นทางเลือก; ละไว้เพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - `scope` ควบคุมว่าพื้นผิวใดที่ `name` หลักชี้เป้า:
    - `text` ส่งคืนโทเค็นคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางเริ่มต้น `both` ส่งคืนชื่อเนทีฟที่รับรู้ผู้ให้บริการเมื่อมี
  - `textAliases` เก็บนามแฝงสแลชแบบตรงตัว เช่น `/model` และ `/m`
  - `nativeName` เก็บชื่อคำสั่งเนทีฟที่รับรู้ผู้ให้บริการเมื่อมี
  - `provider` เป็นทางเลือก และมีผลเฉพาะกับการตั้งชื่อเนทีฟและความพร้อมใช้งานของคำสั่ง Plugin แบบเนทีฟ
  - `includeArgs=false` ละเมตาดาต้าอาร์กิวเมนต์ที่ซีเรียลไลซ์แล้วออกจากการตอบกลับ
- ผู้ปฏิบัติการสามารถเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือรันไทม์สำหรับเอเจนต์ได้ การตอบกลับมีเครื่องมือที่จัดกลุ่มและเมตาดาต้าแหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: ระบุว่าเครื่องมือ Plugin เป็นทางเลือกหรือไม่
- ผู้ปฏิบัติการสามารถเรียก `tools.effective` (`operator.read`) เพื่อดึงคลังเครื่องมือที่มีผลในรันไทม์สำหรับเซสชันได้
  - ต้องมี `sessionKey`
  - Gateway อนุมานบริบทรันไทม์ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนที่จะยอมรับบริบทการยืนยันตัวตนหรือการนำส่งที่ผู้เรียกส่งมา
  - การตอบกลับเป็นภาพฉายที่เซิร์ฟเวอร์อนุมานและจำกัดขอบเขตตามเซสชันของคลังที่ใช้งานอยู่ ซึ่งรวมเครื่องมือ core, plugin, channel และเครื่องมือเซิร์ฟเวอร์ MCP ที่ค้นพบแล้ว
  - `tools.effective` เป็นแบบอ่านอย่างเดียวสำหรับ MCP: อาจฉายแค็ตตาล็อก MCP ของเซสชันที่อุ่นอยู่ผ่านนโยบายเครื่องมือขั้นสุดท้าย แต่จะไม่สร้างรันไทม์ MCP, เชื่อมต่อทรานสปอร์ต หรือส่ง `tools/list` หากไม่มีแค็ตตาล็อกอุ่นที่ตรงกัน การตอบกลับอาจมีประกาศ เช่น `mcp-not-yet-connected`, `mcp-not-yet-listed` หรือ `mcp-stale-catalog`
  - รายการเครื่องมือที่มีผลใช้ `source="core"`, `source="plugin"`, `source="channel"` หรือ `source="mcp"`
- ผู้ปฏิบัติการสามารถเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือที่พร้อมใช้งานหนึ่งรายการผ่านเส้นทางนโยบาย Gateway เดียวกับ `/tools/invoke`
  - ต้องมี `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ `idempotencyKey` เป็นทางเลือก
  - หากมีทั้ง `sessionKey` และ `agentId` เอเจนต์ของเซสชันที่แก้ได้ต้องตรงกับ `agentId`
  - ตัวห่อ core ที่ใช้ได้เฉพาะเจ้าของ เช่น `cron`, `gateway` และ `nodes` ต้องมีตัวตนเจ้าของ/ผู้ดูแล (`operator.admin`) แม้ว่าเมธอด `tools.invoke` เองจะเป็น `operator.write`
  - การตอบกลับเป็น envelope สำหรับ SDK พร้อมฟิลด์ `ok`, `toolName`, `output` ที่เป็นทางเลือก และ `error` ที่มีชนิดกำกับ การอนุมัติหรือการปฏิเสธตามนโยบายจะส่งคืน `ok:false` ใน payload แทนการข้าม pipeline นโยบายเครื่องมือของ Gateway
- ผู้ปฏิบัติการสามารถเรียก `skills.status` (`operator.read`) เพื่อดึงคลัง skill ที่มองเห็นได้สำหรับเอเจนต์
  - `agentId` เป็นทางเลือก; ละไว้เพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - การตอบกลับมีคุณสมบัติความพร้อมใช้งาน ข้อกำหนดที่ขาด การตรวจสอบ config และตัวเลือกการติดตั้งที่ผ่านการทำให้ปลอดภัยแล้ว โดยไม่เปิดเผยค่าความลับดิบ
- ผู้ปฏิบัติการสามารถเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับเมตาดาต้าการค้นพบ ClawHub
- ผู้ปฏิบัติการสามารถเรียก `skills.upload.begin`, `skills.upload.chunk` และ `skills.upload.commit` (`operator.admin`) เพื่อจัดเตรียมคลัง skill ส่วนตัวก่อนติดตั้งได้ นี่เป็นเส้นทางอัปโหลดสำหรับผู้ดูแลแยกต่างหากสำหรับไคลเอนต์ที่เชื่อถือได้ ไม่ใช่โฟลว์ติดตั้ง skill ปกติของ ClawHub และถูกปิดใช้งานโดยค่าเริ่มต้น เว้นแต่เปิดใช้ `skills.install.allowUploadedArchives`
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    สร้างการอัปโหลดที่ผูกกับ slug และค่า force นั้น
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` ต่อท้ายไบต์ที่ offset ที่ถอดรหัสแล้วแบบตรงตัว
  - `skills.upload.commit({ uploadId, sha256? })` ตรวจสอบขนาดสุดท้ายและ SHA-256 การ commit ทำให้การอัปโหลดเสร็จสมบูรณ์เท่านั้น; ไม่ได้ติดตั้ง skill
  - คลัง skill ที่อัปโหลดเป็น zip archive ที่มี `SKILL.md` ที่รูท ชื่อไดเรกทอรีภายใน archive จะไม่เลือกเป้าหมายการติดตั้ง
- ผู้ปฏิบัติการสามารถเรียก `skills.install` (`operator.admin`) ได้สามโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้งโฟลเดอร์ skill ลงในไดเรกทอรี `skills/` ของพื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมดอัปโหลด: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    ติดตั้งการอัปโหลดที่ commit แล้วลงในไดเรกทอรี `skills/<slug>` ของพื้นที่ทำงานเอเจนต์เริ่มต้น ค่า slug และ force ต้องตรงกับคำขอ `skills.upload.begin` เดิม โหมดนี้จะถูกปฏิเสธ เว้นแต่เปิดใช้ `skills.install.allowUploadedArchives` การตั้งค่านี้ไม่มีผลต่อการติดตั้ง ClawHub
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, timeoutMs? }`
    รันแอ็กชัน `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ Gateway ไคลเอนต์รุ่นเก่าอาจยังส่ง `dangerouslyForceUnsafeInstall`; ฟิลด์นี้เลิกใช้แล้ว ยอมรับเฉพาะเพื่อความเข้ากันได้ของโปรโตคอล และจะถูกละเว้น ใช้ `security.installPolicy` สำหรับการตัดสินใจติดตั้งที่ผู้ปฏิบัติการเป็นเจ้าของ
- ผู้ปฏิบัติการสามารถเรียก `skills.update` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามอยู่หนึ่งรายการหรือการติดตั้ง ClawHub ที่ติดตามอยู่ทั้งหมดในพื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมด config แพตช์ค่า `skills.entries.<skillKey>` เช่น `enabled`, `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` รับพารามิเตอร์ `view` ที่เป็นทางเลือก:

- ละไว้หรือ `"default"`: พฤติกรรมรันไทม์ปัจจุบัน หากมีการกำหนดค่า `agents.defaults.models` การตอบกลับคือแค็ตตาล็อกที่อนุญาต รวมถึงโมเดลที่ค้นพบแบบไดนามิกสำหรับรายการ `provider/*` มิฉะนั้นการตอบกลับคือแค็ตตาล็อก Gateway เต็มรูปแบบ
- `"configured"`: พฤติกรรมขนาดพอดีกับตัวเลือก หากมีการกำหนดค่า `agents.defaults.models` ค่านี้ยังคงมีผลเหนือกว่า รวมถึงการค้นพบแบบจำกัดขอบเขตตามผู้ให้บริการสำหรับรายการ `provider/*` หากไม่มี allowlist การตอบกลับจะใช้รายการ `models.providers.*.models` ที่ระบุไว้อย่างชัดเจน และถอยกลับไปใช้แค็ตตาล็อกเต็มรูปแบบเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แค็ตตาล็อก Gateway เต็มรูปแบบ โดยข้าม `agents.defaults.models` ใช้ค่านี้สำหรับ UI การวินิจฉัยและการค้นพบ ไม่ใช่ตัวเลือกโมเดลปกติ

## การอนุมัติ Exec

- เมื่อคำขอ exec ต้องมีการอนุมัติ Gateway จะกระจาย `exec.approval.requested`
- ไคลเอนต์ผู้ปฏิบัติการแก้ไขโดยเรียก `exec.approval.resolve` (ต้องมี scope `operator.approvals`)
- สำหรับ `host=node` `exec.approval.request` ต้องมี `systemRunPlan` (`argv`/`cwd`/`rawCommand`/เมตาดาต้าเซสชันแบบ canonical) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังการอนุมัติ การเรียก `node.invoke system.run` ที่ส่งต่อจะนำ `systemRunPlan` แบบ canonical นั้นกลับมาใช้เป็นบริบทคำสั่ง/cwd/เซสชันที่เป็นแหล่งอ้างอิง
- หากผู้เรียกเปลี่ยนแปลง `command`, `rawCommand`, `cwd`, `agentId` หรือ `sessionKey` ระหว่างการ prepare และการส่งต่อ `system.run` ขั้นสุดท้ายที่อนุมัติแล้ว Gateway จะปฏิเสธการรันแทนที่จะเชื่อถือ payload ที่ถูกเปลี่ยนแปลง

## การถอยกลับของการนำส่งเอเจนต์

- คำขอ `agent` สามารถใส่ `deliver=true` เพื่อขอการนำส่งขาออก
- `bestEffortDeliver=false` คงพฤติกรรมที่เข้มงวด: เป้าหมายการนำส่งที่แก้ไม่ได้หรือใช้ได้เฉพาะภายในจะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ถอยกลับไปเป็นการดำเนินการเฉพาะเซสชันเมื่อไม่สามารถแก้เส้นทางภายนอกที่นำส่งได้ (เช่น เซสชันภายใน/เว็บแชต หรือ config หลายช่องทางที่กำกวม)
- ผลลัพธ์ `agent` ขั้นสุดท้ายอาจมี `result.deliveryStatus` เมื่อมีการขอการนำส่ง โดยใช้สถานะ `sent`, `suppressed`, `partial_failed` และ `failed` เดียวกับที่บันทึกไว้สำหรับ [`openclaw agent --json --deliver`](/th/cli/agent#json-delivery-status)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `packages/gateway-protocol/src/version.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธช่วงที่ไม่มีโปรโตคอลปัจจุบันของตน ไคลเอนต์และเซิร์ฟเวอร์ปัจจุบันต้องใช้โปรโตคอล v4
- สคีมา + โมเดลถูกสร้างจากนิยาม TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

ไคลเอนต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าเสถียรตลอดโปรโตคอล v4 และเป็น baseline ที่คาดหวังสำหรับไคลเอนต์ภายนอก

| ค่าคงที่                                  | ค่าเริ่มต้น                                               | แหล่งที่มา                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| หมดเวลาคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| หมดเวลา Preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่มงบประมาณเซิร์ฟเวอร์/ไคลเอนต์ที่จับคู่กันได้) |
| backoff การเชื่อมต่อใหม่เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| backoff การเชื่อมต่อใหม่สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp retry เร็วหลังปิด device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ระยะผ่อนผัน force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| หมดเวลาเริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| ปิดเมื่อ tick หมดเวลา                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศค่า `policy.tickIntervalMs`, `policy.maxPayload` และ `policy.maxBufferedBytes` ที่มีผลใน `hello-ok`; ไคลเอนต์ควรเคารพค่าเหล่านั้นแทนค่าเริ่มต้นก่อน handshake

## การยืนยันตัวตน

- การยืนยันตัวตน Gateway ด้วย shared secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมดการยืนยันตัวตนที่กำหนดค่าไว้.
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ non-loopback
  `gateway.auth.mode: "trusted-proxy"` จะผ่านการตรวจสอบการยืนยันตัวตนของ connect จาก
  ส่วนหัวคำขอแทน `connect.params.auth.*`.
- private-ingress `gateway.auth.mode: "none"` จะข้ามการยืนยันตัวตน connect แบบ shared secret
  ทั้งหมด; อย่าเปิดใช้โหมดนั้นบน ingress สาธารณะ/ไม่น่าเชื่อถือ.
- หลังจากจับคู่แล้ว Gateway จะออก **โทเค็นอุปกรณ์** ที่จำกัดตามบทบาทการเชื่อมต่อ
  + ขอบเขต. โทเค็นจะถูกส่งกลับใน `hello-ok.auth.deviceToken` และไคลเอนต์ควร
  จัดเก็บไว้สำหรับการเชื่อมต่อในอนาคต.
- ไคลเอนต์ควรจัดเก็บ `hello-ok.auth.deviceToken` หลักหลังจากการเชื่อมต่อสำเร็จทุกครั้ง.
- การเชื่อมต่อใหม่ด้วยโทเค็นอุปกรณ์ที่ **จัดเก็บไว้** ควรใช้ชุดขอบเขตที่อนุมัติแล้ว
  ซึ่งจัดเก็บไว้สำหรับโทเค็นนั้นด้วย. วิธีนี้จะรักษาสิทธิ์อ่าน/ตรวจสอบ/สถานะ
  ที่ได้รับอนุญาตแล้ว และหลีกเลี่ยงการลดการเชื่อมต่อใหม่แบบเงียบ ๆ ให้เหลือ
  ขอบเขต implicit admin-only ที่แคบกว่า.
- การประกอบการยืนยันตัวตน connect ฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากส่วนอื่นและจะถูกส่งต่อเสมอเมื่อมีการตั้งค่า.
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: shared token ที่ระบุชัดเจนก่อน,
    จากนั้น `deviceToken` ที่ระบุชัดเจน, แล้วจึงเป็นโทเค็นต่ออุปกรณ์ที่จัดเก็บไว้
    (ผูกกับ `deviceId` + `role`).
  - `auth.bootstrapToken` จะถูกส่งก็ต่อเมื่อไม่มีรายการข้างต้นใด resolve เป็น
    `auth.token`. shared token หรือ device token ใด ๆ ที่ resolve ได้จะระงับการส่งค่านี้.
  - การเลื่อนสถานะอัตโนมัติของโทเค็นอุปกรณ์ที่จัดเก็บไว้ในการลองใหม่แบบครั้งเดียวของ
    `AUTH_TOKEN_MISMATCH` จำกัดไว้เฉพาะ **endpoint ที่เชื่อถือได้เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบ pin ไว้. `wss://` สาธารณะ
    ที่ไม่มีการ pin ไม่เข้าเกณฑ์.
- setup-code bootstrap ในตัวจะส่งคืน
  `hello-ok.auth.deviceToken` ของโหนดหลักพร้อมโทเค็นผู้ปฏิบัติการแบบจำกัดใน
  `hello-ok.auth.deviceTokens` สำหรับการส่งต่อให้มือถือที่เชื่อถือได้. โทเค็นผู้ปฏิบัติการ
  รวม `operator.talk.secrets` สำหรับการอ่านการกำหนดค่า Talk แบบ native แต่
  ไม่รวมขอบเขตการแก้ไขการจับคู่และ `operator.admin`.
- ขณะที่ setup-code bootstrap ที่ไม่ใช่ baseline กำลังรอการอนุมัติ รายละเอียด `PAIRING_REQUIRED`
  จะมี `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  และ `pauseReconnect: false`. ไคลเอนต์ควรเชื่อมต่อใหม่ด้วย bootstrap token เดิมต่อไป
  จนกว่าคำขอจะได้รับอนุมัติหรือโทเค็นจะใช้ไม่ได้.
- จัดเก็บ `hello-ok.auth.deviceTokens` เฉพาะเมื่อการเชื่อมต่อใช้ bootstrap auth
  บน transport ที่เชื่อถือได้ เช่น `wss://` หรือการจับคู่ผ่าน loopback/local.
- หากไคลเอนต์ส่ง `deviceToken` แบบ **ระบุชัดเจน** หรือ `scopes` แบบระบุชัดเจน
  ชุดขอบเขตที่ผู้เรียกขอตั้งไว้จะยังเป็นแหล่งอ้างอิงหลัก; ขอบเขตที่แคชไว้จะถูกใช้ซ้ำ
  เฉพาะเมื่อไคลเอนต์ใช้โทเค็นต่ออุปกรณ์ที่จัดเก็บไว้ซ้ำเท่านั้น.
- โทเค็นอุปกรณ์สามารถ rotate/revoke ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องมีขอบเขต `operator.pairing`). การ rotate หรือ
  revoke โหนดหรือบทบาทอื่นที่ไม่ใช่ผู้ปฏิบัติการยังต้องมี `operator.admin`.
- `device.token.rotate` ส่งคืน metadata การ rotate. โดยจะ echo bearer token ทดแทน
  เฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ยืนยันตัวตนด้วยโทเค็นอุปกรณ์นั้นอยู่แล้ว
  เพื่อให้ไคลเอนต์แบบ token-only สามารถจัดเก็บโทเค็นทดแทนก่อนเชื่อมต่อใหม่ได้.
  การ rotate ด้วย shared/admin จะไม่ echo bearer token.
- การออก การ rotate และการ revoke โทเค็นยังคงจำกัดอยู่กับชุดบทบาทที่อนุมัติแล้ว
  ซึ่งบันทึกไว้ในรายการจับคู่ของอุปกรณ์นั้น; การแก้ไขโทเค็นไม่สามารถขยายหรือกำหนดเป้าหมาย
  ไปยังบทบาทอุปกรณ์ที่การอนุมัติการจับคู่ไม่เคยให้ไว้.
- สำหรับเซสชันโทเค็นของอุปกรณ์ที่จับคู่แล้ว การจัดการอุปกรณ์จะจำกัดอยู่กับตัวเอง
  เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ admin จัดการได้เฉพาะ
  โทเค็นผู้ปฏิบัติการสำหรับรายการอุปกรณ์ **ของตนเอง**. การจัดการโทเค็นของโหนด
  และบทบาทอื่นที่ไม่ใช่ผู้ปฏิบัติการเป็น admin-only แม้จะเป็นอุปกรณ์ของผู้เรียกเองก็ตาม.
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุดขอบเขตโทเค็นผู้ปฏิบัติการ
  เป้าหมายเทียบกับขอบเขตเซสชันปัจจุบันของผู้เรียก. ผู้เรียกที่ไม่ใช่ admin ไม่สามารถ
  rotate หรือ revoke โทเค็นผู้ปฏิบัติการที่มีขอบเขตกว้างกว่าที่ตนถืออยู่.
- ความล้มเหลวในการยืนยันตัวตนจะมี `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลองใหม่หนึ่งครั้งแบบจำกัดด้วยโทเค็นต่ออุปกรณ์ที่แคชไว้.
  - หากการลองใหม่นั้นล้มเหลว ไคลเอนต์ควรหยุดลูปการเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำให้ผู้ปฏิบัติการดำเนินการ.
- `AUTH_SCOPE_MISMATCH` หมายความว่าโทเค็นอุปกรณ์ถูกจดจำได้แต่ไม่ครอบคลุม
  บทบาท/ขอบเขตที่ร้องขอ. ไคลเอนต์ไม่ควรแสดงสิ่งนี้ว่าเป็นโทเค็นที่ไม่ถูกต้อง;
  ให้แจ้งผู้ปฏิบัติการให้จับคู่ใหม่หรืออนุมัติสัญญาขอบเขตที่แคบกว่า/กว้างกว่า.

## ข้อมูลระบุตัวตนอุปกรณ์ + การจับคู่

- โหนดควรมีข้อมูลระบุตัวตนอุปกรณ์ที่เสถียร (`device.id`) ซึ่งมาจาก
  fingerprint ของ keypair.
- Gateway ออกโทเค็นต่ออุปกรณ์ + บทบาท.
- ต้องมีการอนุมัติการจับคู่สำหรับ ID อุปกรณ์ใหม่ เว้นแต่เปิดใช้งานการอนุมัติอัตโนมัติในเครื่อง.
- การอนุมัติอัตโนมัติของการจับคู่มีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง.
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่แคบสำหรับ
  flow ตัวช่วย shared-secret ที่เชื่อถือได้.
- การเชื่อมต่อ tailnet หรือ LAN บนโฮสต์เดียวกันยังคงถูกมองเป็น remote สำหรับการจับคู่และ
  ต้องได้รับอนุมัติ.
- โดยปกติไคลเอนต์ WS จะใส่ข้อมูลระบุตัวตน `device` ระหว่าง `connect` (ผู้ปฏิบัติการ +
  โหนด). ข้อยกเว้นผู้ปฏิบัติการที่ไม่มีอุปกรณ์มีเฉพาะเส้นทางความเชื่อถือที่ระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้ของ HTTP ที่ไม่ปลอดภัยแบบ localhost-only.
  - การยืนยันตัวตน Control UI ของผู้ปฏิบัติการ `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง).
  - RPC backend `gateway-client` ผ่าน direct-loopback บนเส้นทางตัวช่วยภายในที่สงวนไว้.
- การละเว้นข้อมูลระบุตัวตนอุปกรณ์มีผลต่อขอบเขต. เมื่ออนุญาตการเชื่อมต่อผู้ปฏิบัติการ
  แบบไม่มีอุปกรณ์ผ่านเส้นทางความเชื่อถือที่ระบุชัดเจน OpenClaw ยังล้างขอบเขตที่ประกาศเอง
  ให้เป็นชุดว่าง เว้นแต่เส้นทางนั้นมีข้อยกเว้นการรักษาขอบเขตที่ตั้งชื่อไว้.
  จากนั้น method ที่ gate ด้วยขอบเขตจะล้มเหลวด้วย `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` เป็นเส้นทาง break-glass ของ Control UI
  สำหรับการรักษาขอบเขต. มันไม่ได้ให้ขอบเขตแก่ backend แบบกำหนดเองหรือไคลเอนต์ WebSocket
  รูปแบบ CLI ใด ๆ ตามอำเภอใจ.
- เส้นทางตัวช่วย backend `gateway-client` แบบ direct-loopback ที่สงวนไว้จะรักษาขอบเขต
  เฉพาะสำหรับ RPC control-plane ภายในเครื่องเท่านั้น; ID backend แบบกำหนดเองจะไม่ได้รับ
  ข้อยกเว้นนี้.
- ทุกการเชื่อมต่อต้องลงนาม nonce `connect.challenge` ที่เซิร์ฟเวอร์ให้มา.

### diagnostics การย้าย device auth

สำหรับไคลเอนต์ legacy ที่ยังใช้พฤติกรรมการลงนามก่อน challenge ตอนนี้ `connect` จะส่งคืน
รหัสรายละเอียด `DEVICE_AUTH_*` ภายใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร.

ความล้มเหลวในการย้ายที่พบบ่อย:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ละเว้น `device.nonce` (หรือส่งค่าว่าง).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่า/ผิด.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ลายเซ็นไม่ตรงกับ payload v2.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอก skew ที่อนุญาต.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/canonicalization ของ public key ล้มเหลว.         |

เป้าหมายการย้าย:

- รอ `connect.challenge` เสมอ.
- ลงนาม payload v2 ที่มี nonce ของเซิร์ฟเวอร์.
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`.
- payload ลายเซ็นที่แนะนำคือ `v3` ซึ่ง bind `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce.
- ลายเซ็น legacy `v2` ยังได้รับการยอมรับเพื่อความเข้ากันได้ แต่การ pin metadata
  ของอุปกรณ์ที่จับคู่แล้วยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่.

## TLS + pinning

- รองรับ TLS สำหรับการเชื่อมต่อ WS.
- ไคลเอนต์อาจเลือก pin fingerprint ใบรับรองของ gateway ได้ (ดูการกำหนดค่า `gateway.tls`
  รวมถึง `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`).

## ขอบเขต

โปรโตคอลนี้เปิดเผย **API ของ gateway แบบเต็ม** (สถานะ, ช่องทาง, โมเดล, แชต,
agent, เซสชัน, โหนด, การอนุมัติ ฯลฯ). พื้นผิวที่แน่นอนถูกกำหนดโดย
schema TypeBox ใน `packages/gateway-protocol/src/schema.ts`.

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [runbook ของ Gateway](/th/gateway)
