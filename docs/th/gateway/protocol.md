---
read_when:
    - การนำไคลเอนต์ WS ของ Gateway ไปใช้หรืออัปเดต
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - กำลังสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การจับมือ, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-07-01T08:47:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS protocol คือ **ระนาบควบคุมเดียว + ทรานสปอร์ตของโหนด** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, UI เว็บ, แอป macOS, โหนด iOS/Android, โหนดแบบ headless)
เชื่อมต่อผ่าน WebSocket และประกาศ **บทบาท** + **ขอบเขต** ของตนใน
ช่วง handshake

## ทรานสปอร์ต

- WebSocket, เฟรมข้อความพร้อม payload แบบ JSON
- เฟรมแรก **ต้อง** เป็นคำขอ `connect`
- เฟรมก่อนเชื่อมต่อถูกจำกัดที่ 64 KiB หลังจาก handshake สำเร็จ ไคลเอนต์
  ควรทำตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้ diagnostics
  เฟรมขาเข้าที่มีขนาดเกินและบัฟเฟอร์ขาออกที่ช้าจะปล่อยอีเวนต์ `payload.large`
  ก่อนที่ gateway จะปิดหรือละทิ้งเฟรมที่ได้รับผลกระทบ อีเวนต์เหล่านี้เก็บ
  ขนาด ขีดจำกัด พื้นผิว และรหัสเหตุผลที่ปลอดภัย แต่ไม่เก็บเนื้อหาข้อความ
  เนื้อหาไฟล์แนบ เนื้อหาเฟรมดิบ โทเค็น คุกกี้ หรือค่าลับ

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

ขณะที่ Gateway ยังเริ่มต้น sidecar ต่าง ๆ ไม่เสร็จ คำขอ `connect` อาจ
ส่งคืนข้อผิดพลาด `UNAVAILABLE` ที่ลองใหม่ได้ โดยมี `details.reason` ตั้งเป็น
`"startup-sidecars"` และ `retryAfterMs` ไคลเอนต์ควรลองคำตอบนั้นใหม่
ภายในงบประมาณการเชื่อมต่อโดยรวมของตน แทนที่จะแสดงเป็นความล้มเหลวของ
handshake ขั้นสุดท้าย

`server`, `features`, `snapshot` และ `policy` ล้วนเป็นฟิลด์ที่ schema
ต้องการ (`packages/gateway-protocol/src/schema/frames.ts`) `auth` ก็เป็นฟิลด์ที่จำเป็นเช่นกันและรายงาน
บทบาท/ขอบเขตที่เจรจาได้ `pluginSurfaceUrls` เป็นฟิลด์ไม่บังคับ และแมปชื่อพื้นผิวของ plugin
เช่น `canvas` ไปยัง URL ที่โฮสต์แบบมีขอบเขต

URL พื้นผิวของ plugin แบบมีขอบเขตอาจหมดอายุได้ โหนดสามารถเรียก
`node.pluginSurface.refresh` พร้อม `{ "surface": "canvas" }` เพื่อรับรายการใหม่
ใน `pluginSurfaceUrls` การ refactor Plugin Canvas แบบทดลองไม่รองรับ
เส้นทางความเข้ากันได้ของ `canvasHostUrl`, `canvasCapability` หรือ
`node.canvas.capability.refresh` ที่เลิกใช้แล้ว ไคลเอนต์และ gateway แบบ native ปัจจุบัน
ต้องใช้พื้นผิวของ plugin

เมื่อไม่มีการออกโทเค็นอุปกรณ์ `hello-ok.auth` จะรายงานสิทธิ์ที่เจรจาได้
โดยไม่มีฟิลด์โทเค็น:

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
ยืนยันตัวตนด้วยโทเค็น/รหัสผ่าน gateway ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้
สำหรับ RPC ระนาบควบคุมภายใน และช่วยไม่ให้ baseline การจับคู่ CLI/อุปกรณ์ที่ล้าสมัย
ปิดกั้นงาน backend ภายในเครื่อง เช่น การอัปเดตเซสชัน subagent ไคลเอนต์ระยะไกล
ไคลเอนต์จากต้นทางเบราว์เซอร์ ไคลเอนต์โหนด และไคลเอนต์ที่ใช้โทเค็นอุปกรณ์/ตัวตนอุปกรณ์
อย่างชัดเจนยังคงใช้การตรวจสอบการจับคู่และการอัปเกรดขอบเขตตามปกติ

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

การ bootstrap ด้วย QR/setup-code ในตัวเป็นเส้นทางส่งต่อมือถือแบบใหม่
การเชื่อมต่อ baseline setup-code ที่สำเร็จจะส่งคืนโทเค็นโหนดหลักพร้อม
โทเค็นผู้ปฏิบัติการแบบมีขอบเขตหนึ่งรายการ:

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

การส่งต่อผู้ปฏิบัติการถูกจำกัดอย่างตั้งใจ เพื่อให้ onboarding ด้วย QR สามารถเริ่ม
ลูปผู้ปฏิบัติการบนมือถือได้โดยไม่ให้สิทธิ์ `operator.admin` หรือ `operator.pairing`
แต่มี `operator.talk.secrets` เพื่อให้ไคลเอนต์ native อ่านการกำหนดค่า Talk
ที่ต้องใช้หลัง bootstrap ได้ ขอบเขต admin และ pairing ที่กว้างกว่านี้ต้องใช้
การจับคู่ผู้ปฏิบัติการที่ได้รับอนุมัติแยกต่างหาก หรือ flow โทเค็นแยกต่างหาก ไคลเอนต์ควร persist
`hello-ok.auth.deviceTokens` เฉพาะ
เมื่อการเชื่อมต่อใช้ bootstrap auth บนทรานสปอร์ตที่เชื่อถือได้ เช่น `wss://` หรือ
loopback/local pairing

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

เมธอดที่มีผลข้างเคียงต้องใช้ **idempotency keys** (ดู schema)

## บทบาท + ขอบเขต

สำหรับโมเดลขอบเขตของผู้ปฏิบัติการแบบเต็ม การตรวจสอบ ณ เวลาการอนุมัติ และ
semantic ของ shared secret โปรดดู [ขอบเขตของผู้ปฏิบัติการ](/th/gateway/operator-scopes)

### บทบาท

- `operator` = ไคลเอนต์ระนาบควบคุม (CLI/UI/automation)
- `node` = โฮสต์ความสามารถ (camera/screen/canvas/system.run)

### ขอบเขต (ผู้ปฏิบัติการ)

ขอบเขตทั่วไป:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` พร้อม `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)
เมื่อรวม secret ไว้ด้วย ไคลเอนต์ควรอ่าน credential ของผู้ให้บริการ Talk ที่ใช้งานอยู่
จาก `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
ยังคงมีรูปร่างตามแหล่งที่มา และอาจเป็นอ็อบเจ็กต์ SecretRef หรือสตริงที่ถูก redacted

เมธอด Gateway RPC ที่ Plugin ลงทะเบียนอาจขอขอบเขตผู้ปฏิบัติการของตัวเองได้ แต่
คำนำหน้า admin หลักที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะ resolve เป็น `operator.admin` เสมอ

ขอบเขตของเมธอดเป็นเพียงด่านแรก คำสั่ง slash บางรายการที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจสอบระดับคำสั่งที่เข้มงวดกว่าเพิ่มเข้ามา ตัวอย่างเช่น การเขียนแบบถาวร
ด้วย `/config set` และ `/config unset` ต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบขอบเขตเพิ่มเติม ณ เวลาการอนุมัติ นอกเหนือจาก
ขอบเขตเมธอดพื้นฐาน:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มีคำสั่งโหนดที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่มี `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### ความสามารถ/คำสั่ง/สิทธิ์ (โหนด)

โหนดประกาศ claim ความสามารถในช่วงเชื่อมต่อ:

- `caps`: หมวดหมู่ความสามารถระดับสูง เช่น `camera`, `canvas`, `screen`,
  `location`, `voice` และ `talk`
- `commands`: allowlist คำสั่งสำหรับ invoke
- `permissions`: toggle แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway ถือค่าสิ่งเหล่านี้เป็น **claim** และบังคับใช้ allowlist ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` ส่งคืนรายการที่ key ด้วยตัวตนอุปกรณ์
- รายการ Presence มี `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงหนึ่งแถวต่ออุปกรณ์ได้
  แม้เมื่ออุปกรณ์เชื่อมต่อเป็นทั้ง **ผู้ปฏิบัติการ** และ **โหนด**
- `node.list` มีฟิลด์ไม่บังคับ `lastSeenAtMs` และ `lastSeenReason` โหนดที่เชื่อมต่อจะรายงาน
  เวลาเชื่อมต่อปัจจุบันของตนเป็น `lastSeenAtMs` พร้อมเหตุผล `connect`; โหนดที่จับคู่แล้วสามารถรายงาน
  Presence พื้นหลังแบบ durable ได้เช่นกัน เมื่ออีเวนต์โหนดที่เชื่อถือได้อัปเดต metadata การจับคู่ของตน

### อีเวนต์โหนดที่ยังมีชีวิตในพื้นหลัง

โหนดอาจเรียก `node.event` พร้อม `event: "node.presence.alive"` เพื่อบันทึกว่าโหนดที่จับคู่แล้ว
ยังมีชีวิตอยู่ระหว่างการ wake ในพื้นหลัง โดยไม่ทำเครื่องหมายว่าเชื่อมต่ออยู่

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` เป็น enum แบบปิด: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` หรือ `connect` สตริง trigger ที่ไม่รู้จักจะถูกทำให้เป็น
`background` โดย gateway ก่อน persist อีเวนต์นี้ durable เฉพาะสำหรับเซสชันอุปกรณ์โหนด
ที่ยืนยันตัวตนแล้วเท่านั้น เซสชันที่ไม่มีอุปกรณ์หรือไม่ได้จับคู่จะส่งคืน `handled: false`

gateway ที่สำเร็จจะส่งคืนผลลัพธ์แบบมีโครงสร้าง:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

gateway รุ่นเก่าอาจยังส่งคืน `{ "ok": true }` สำหรับ `node.event`; ไคลเอนต์ควรถือว่าสิ่งนั้นเป็น
RPC ที่ได้รับการ acknowledge แล้ว ไม่ใช่การ persist Presence แบบ durable

## การกำหนดขอบเขตอีเวนต์ broadcast

อีเวนต์ broadcast ของ WebSocket ที่เซิร์ฟเวอร์ push ถูกจำกัดตามขอบเขต เพื่อให้เซสชันที่มีขอบเขตเฉพาะการจับคู่หรือเฉพาะโหนดไม่รับเนื้อหาเซสชันแบบ passively

- **เฟรมแชต agent และผลลัพธ์เครื่องมือ** (รวมถึงอีเวนต์ `agent` แบบสตรีมและผลลัพธ์การเรียกเครื่องมือ) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcast `plugin.*` ที่ Plugin กำหนด** ถูก gate ด้วย `operator.write` หรือ `operator.admin` ขึ้นอยู่กับวิธีที่ plugin ลงทะเบียนไว้
- **อีเวนต์สถานะและทรานสปอร์ต** (`heartbeat`, `presence`, `tick`, lifecycle การเชื่อมต่อ/ตัดการเชื่อมต่อ ฯลฯ) ยังคงไม่ถูกจำกัด เพื่อให้สุขภาพของทรานสปอร์ตยังสังเกตได้สำหรับทุกเซสชันที่ยืนยันตัวตนแล้ว
- **ตระกูลอีเวนต์ broadcast ที่ไม่รู้จัก** จะถูก gate ตามขอบเขตโดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนคลายอย่างชัดเจน

การเชื่อมต่อไคลเอนต์แต่ละรายการเก็บหมายเลข sequence ต่อไคลเอนต์ของตัวเอง เพื่อให้ broadcast รักษาลำดับแบบ monotonic บน socket นั้น แม้เมื่อไคลเอนต์ต่าง ๆ เห็น subset ที่ถูกกรองตามขอบเขตต่างกันของ event stream

## ตระกูลเมธอด RPC ทั่วไป

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ข้างต้น
นี่ไม่ใช่ dump ที่ generated มา — `hello-ok.features.methods` เป็นรายการ discovery
แบบอนุรักษนิยมที่สร้างจาก `src/gateway/server-methods-list.ts` รวมกับ export เมธอด
plugin/channel ที่โหลดไว้ ให้ถือว่าเป็น feature discovery ไม่ใช่รายการครบถ้วน
ของ `src/gateway/server-methods/*.ts`

  <AccordionGroup>
  <Accordion title="ระบบและตัวตน">
    - `health` ส่งคืนสแนปช็อตสุขภาพของ Gateway ที่แคชไว้หรือเพิ่งตรวจสอบใหม่
    - `diagnostics.stability` ส่งคืนตัวบันทึกความเสถียรของการวินิจฉัยล่าสุดแบบมีขอบเขต โดยเก็บเมทาดาทาด้านการปฏิบัติงาน เช่น ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าการใช้หน่วยความจำ สถานะคิว/เซสชัน ชื่อช่องทาง/Plugin และรหัสเซสชัน โดยไม่เก็บข้อความแชต เนื้อหา Webhook เอาต์พุตของเครื่องมือ เนื้อหาคำขอหรือคำตอบดิบ โทเค็น คุกกี้ หรือค่าลับ ต้องมีขอบเขตการอ่านของผู้ปฏิบัติการ
    - `status` ส่งคืนสรุป Gateway แบบ `/status`; ฟิลด์ที่ละเอียดอ่อนจะรวมไว้เฉพาะสำหรับไคลเอนต์ผู้ปฏิบัติการที่มีขอบเขตผู้ดูแลระบบเท่านั้น
    - `gateway.identity.get` ส่งคืนตัวตนอุปกรณ์ Gateway ที่ใช้โดยโฟลว์รีเลย์และการจับคู่
    - `system-presence` ส่งคืนสแนปช็อตสถานะปัจจุบันสำหรับอุปกรณ์ผู้ปฏิบัติการ/Node ที่เชื่อมต่ออยู่
    - `system-event` เพิ่มเหตุการณ์ระบบและสามารถอัปเดต/กระจายบริบทสถานะได้
    - `last-heartbeat` ส่งคืนเหตุการณ์ Heartbeat ล่าสุดที่บันทึกถาวรไว้
    - `set-heartbeats` สลับการประมวลผล Heartbeat บน Gateway

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแค็ตตาล็อกโมเดลที่รันไทม์อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าไว้ในขนาดเหมาะกับตัวเลือก (`agents.defaults.models` ก่อน แล้วตามด้วย `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแค็ตตาล็อกทั้งหมด
    - `usage.status` ส่งคืนสรุปหน้าต่างการใช้งาน/โควตาคงเหลือของผู้ให้บริการ
    - `usage.cost` ส่งคืนสรุปการใช้งานต้นทุนแบบรวมสำหรับช่วงวันที่
      ส่ง `agentId` สำหรับเอเจนต์หนึ่งตัว หรือ `agentScope: "all"` เพื่อรวมเอเจนต์ที่กำหนดค่าไว้
    - `doctor.memory.status` ส่งคืนความพร้อมของ vector-memory / embedding ที่แคชไว้สำหรับเวิร์กสเปซเอเจนต์ค่าเริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจนเท่านั้น ไคลเอนต์ที่รองรับ Dreaming ยังสามารถส่ง `{ "agentId": "agent-id" }` เพื่อจำกัดขอบเขตสถิติที่เก็บ Dreaming ไปยังเวิร์กสเปซเอเจนต์ที่เลือกได้; การละ `agentId` ไว้จะคงการย้อนกลับไปยังเอเจนต์ค่าเริ่มต้นและรวมเวิร์กสเปซ Dreaming ที่กำหนดค่าไว้
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, และ `doctor.memory.dedupeDreamDiary` รับพารามิเตอร์เสริม `{ "agentId": "agent-id" }` สำหรับมุมมอง/การดำเนินการ Dreaming ของเอเจนต์ที่เลือก เมื่อไม่ได้ระบุ `agentId` รายการเหล่านี้จะทำงานบนเวิร์กสเปซเอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้
    - `doctor.memory.remHarness` ส่งคืนตัวอย่าง REM harness แบบอ่านอย่างเดียวและมีขอบเขตสำหรับไคลเอนต์ระนาบควบคุมระยะไกล ซึ่งอาจรวมพาธเวิร์กสเปซ ส่วนย่อยหน่วยความจำ มาร์กดาวน์แบบ grounded ที่เรนเดอร์แล้ว และผู้สมัครสำหรับการเลื่อนระดับเชิงลึก ดังนั้นผู้เรียกจึงต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานต่อเซสชัน ส่ง `agentId` สำหรับหนึ่ง
      เอเจนต์ หรือ `agentScope: "all"` เพื่อแสดงรายการเอเจนต์ที่กำหนดค่าไว้ร่วมกัน
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบอนุกรมเวลาสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="ช่องทางและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะช่องทาง/Plugin แบบ built-in + bundled
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีที่ระบุ เมื่อช่องทางนั้นรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบแบบ QR/เว็บสำหรับผู้ให้บริการช่องทางเว็บปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบแบบ QR/เว็บนั้นเสร็จสมบูรณ์ และเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยังโหนด iOS ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืนตัวเรียกคำปลุกที่จัดเก็บไว้
    - `voicewake.set` อัปเดตตัวเรียกคำปลุกและกระจายการเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การส่งข้อความและบันทึก">
    - `send` คือ RPC สำหรับการส่งออกโดยตรง สำหรับการส่งที่เจาะจงช่องทาง/บัญชี/เธรดเป้าหมาย นอก chat runner
    - `logs.tail` ส่งคืนส่วนท้ายของไฟล์บันทึก Gateway ที่กำหนดค่าไว้ พร้อมตัวควบคุม cursor/limit และจำนวนไบต์สูงสุด

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.catalog` ส่งคืนแค็ตตาล็อกผู้ให้บริการ Talk แบบอ่านอย่างเดียวสำหรับเสียงพูด การถอดเสียงแบบสตรีม และเสียงเรียลไทม์ โดยรวม id ของผู้ให้บริการ ป้ายกำกับ สถานะที่กำหนดค่าไว้ id ของโมเดล/เสียงที่เปิดเผย โหมดมาตรฐาน ทรานสปอร์ต กลยุทธ์ของ brain และแฟล็กเสียง/ความสามารถแบบเรียลไทม์ โดยไม่ส่งคืนความลับของผู้ให้บริการหรือแก้ไข config ส่วนกลาง
    - `talk.config` ส่งคืนเพย์โหลด config ของ Talk ที่มีผลอยู่; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.session.create` สร้างเซสชัน Talk ที่ Gateway เป็นเจ้าของสำหรับ `realtime/gateway-relay`, `transcription/gateway-relay` หรือ `stt-tts/managed-room` สำหรับ `stt-tts/managed-room` ผู้เรียก `operator.write` ที่ส่ง `sessionKey` ต้องส่ง `spawnedBy` ด้วย เพื่อให้มองเห็น session-key แบบมีขอบเขต; การสร้าง `sessionKey` แบบไม่มีขอบเขตและ `brain: "direct-tools"` ต้องใช้ `operator.admin`
    - `talk.session.join` ตรวจสอบโทเค็นเซสชัน managed-room ปล่อยเหตุการณ์ `session.ready` หรือ `session.replaced` ตามจำเป็น และส่งคืนเมตาดาต้าของห้อง/เซสชันพร้อมเหตุการณ์ Talk ล่าสุด โดยไม่มีโทเค็นข้อความธรรมดาหรือแฮชโทเค็นที่จัดเก็บไว้
    - `talk.session.appendAudio` เพิ่มเสียงอินพุต PCM แบบ base64 ต่อท้ายเซสชัน realtime relay และ transcription ที่ Gateway เป็นเจ้าของ
    - `talk.session.startTurn`, `talk.session.endTurn` และ `talk.session.cancelTurn` ขับเคลื่อนวงจรชีวิตของ turn ใน managed-room พร้อมปฏิเสธ turn ที่ล้าสมัยก่อนล้างสถานะ
    - `talk.session.cancelOutput` หยุดเอาต์พุตเสียงของผู้ช่วย โดยหลักใช้สำหรับการแทรกพูดที่ถูกควบคุมด้วย VAD ในเซสชัน Gateway relay
    - `talk.session.submitToolResult` ทำให้การเรียกเครื่องมือของผู้ให้บริการที่ปล่อยโดยเซสชัน realtime relay ที่ Gateway เป็นเจ้าของเสร็จสมบูรณ์ ส่ง `options: { willContinue: true }` สำหรับเอาต์พุตเครื่องมือระหว่างทางเมื่อจะมีผลลัพธ์สุดท้ายตามมา หรือ `options: { suppressResponse: true }` เมื่อผลลัพธ์เครื่องมือควรตอบสนองการเรียกของผู้ให้บริการโดยไม่เริ่มการตอบกลับของผู้ช่วยแบบเรียลไทม์อีกครั้ง
    - `talk.session.steer` ส่งการควบคุมเสียงของรันที่กำลังทำงานไปยังเซสชัน Talk ที่มีเอเจนต์หนุนหลังและ Gateway เป็นเจ้าของ โดยรับ `{ sessionId, text, mode? }` ซึ่ง `mode` คือ `status`, `steer`, `cancel` หรือ `followup`; หากละเว้นโหมด จะจำแนกจากข้อความที่พูด
    - `talk.session.close` ปิดเซสชัน relay, transcription หรือ managed-room ที่ Gateway เป็นเจ้าของ และปล่อยเหตุการณ์ Talk สิ้นสุด
    - `talk.mode` ตั้งค่า/กระจายสถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.client.create` สร้างเซสชันผู้ให้บริการ realtime ที่ไคลเอนต์เป็นเจ้าของโดยใช้ `webrtc` หรือ `provider-websocket` ขณะที่ Gateway เป็นเจ้าของ config, credentials, instructions และนโยบายเครื่องมือ
    - `talk.client.toolCall` ให้ทรานสปอร์ต realtime ที่ไคลเอนต์เป็นเจ้าของส่งต่อการเรียกเครื่องมือของผู้ให้บริการไปยังนโยบาย Gateway เครื่องมือแรกที่รองรับคือ `openclaw_agent_consult`; ไคลเอนต์จะได้รับ run id และรอเหตุการณ์วงจรชีวิตแชตตามปกติก่อนส่งผลลัพธ์เครื่องมือเฉพาะผู้ให้บริการ
    - `talk.client.steer` ส่งการควบคุมเสียงของรันที่กำลังทำงานสำหรับทรานสปอร์ต realtime ที่ไคลเอนต์เป็นเจ้าของ Gateway จะแก้หา embedded run ที่กำลังทำงานจาก `sessionKey` และส่งคืนผลลัพธ์ accepted/rejected แบบมีโครงสร้าง แทนการทิ้งคำสั่งควบคุมไปเงียบ ๆ
    - `talk.event` คือช่องทางเหตุการณ์ Talk เดียวสำหรับ realtime, transcription, STT/TTS, managed-room, telephony และอะแดปเตอร์ meeting
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะการเปิดใช้ TTS ผู้ให้บริการที่ใช้งานอยู่ ผู้ให้บริการสำรอง และสถานะ config ของผู้ให้บริการ
    - `tts.providers` ส่งคืนรายการผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะ prefs ของ TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงพูดแบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ, config, การอัปเดต และวิซาร์ด">
    - `secrets.reload` แก้หา SecretRefs ที่ใช้งานอยู่อีกครั้ง และสลับสถานะความลับของ runtime เฉพาะเมื่อสำเร็จทั้งหมด
    - `secrets.resolve` แก้หาการกำหนดความลับเป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายเฉพาะ
    - `config.get` ส่งคืนสแนปชอต config ปัจจุบันและแฮช
    - `config.set` เขียนเพย์โหลด config ที่ผ่านการตรวจสอบแล้ว
    - `config.patch` ผสานการอัปเดต config บางส่วน การแทนที่อาร์เรย์
      แบบทำลายข้อมูลต้องมีพาธที่ได้รับผลกระทบใน `replacePaths`; อาร์เรย์ซ้อน
      ภายใต้รายการอาร์เรย์ใช้พาธ `[]` เช่น `agents.list[].skills`
    - `config.apply` ตรวจสอบ + แทนที่เพย์โหลด config ทั้งหมด
    - `config.schema` ส่งคืนเพย์โหลดสคีมา config แบบสดที่ใช้โดยเครื่องมือ Control UI และ CLI: schema, `uiHints`, เวอร์ชัน และเมตาดาต้าการสร้าง รวมถึงเมตาดาต้าสคีมาของ plugin + channel เมื่อ runtime โหลดได้ สคีมามีเมตาดาต้าฟิลด์ `title` / `description` ที่ได้จากป้ายกำกับและข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึง object ซ้อน, wildcard, array-item และกิ่งการประกอบ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืนเพย์โหลด lookup ที่จำกัดขอบเขตตามพาธสำหรับพาธ config หนึ่งรายการ: พาธที่ปรับมาตรฐานแล้ว โหนดสคีมาแบบตื้น hint ที่ตรงกัน + `hintPath`, `reloadKind` ที่ไม่บังคับ และสรุปลูกโดยตรงสำหรับการเจาะดูใน UI/CLI `reloadKind` เป็นหนึ่งใน `restart`, `hot` หรือ `none` และสะท้อนตัววางแผนการโหลด config ใหม่ของ Gateway สำหรับพาธที่ร้องขอ โหนดสคีมา lookup เก็บเอกสารที่ผู้ใช้เห็นและฟิลด์ตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขต numeric/string/array/object และแฟล็กอย่าง `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกเปิดเผย `key`, `path` ที่ปรับมาตรฐานแล้ว, `type`, `required`, `hasChildren`, `reloadKind` ที่ไม่บังคับ รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รันโฟลว์อัปเดตของ gateway และกำหนดเวลา restart เฉพาะเมื่อการอัปเดตเองสำเร็จ; ผู้เรียกที่มีเซสชันสามารถใส่ `continuationMessage` เพื่อให้การเริ่มต้นระบบกลับมาดำเนินการ turn ติดตามผลของเอเจนต์หนึ่งครั้งผ่านคิว restart continuation การอัปเดตด้วย package-manager และการอัปเดต git-checkout แบบมี supervisor จาก control plane ใช้การส่งต่อ managed-service แบบแยกออก แทนการแทนที่ package tree หรือแก้ไขเอาต์พุต checkout/build ภายใน Gateway ที่กำลังทำงานอยู่ การส่งต่อที่เริ่มแล้วจะส่งคืน `ok: true` พร้อม `result.reason: "managed-service-handoff-started"` และ `handoff.status: "started"`; การส่งต่อที่ไม่พร้อมใช้งานหรือล้มเหลวจะส่งคืน `ok: false` พร้อม `managed-service-handoff-unavailable` หรือ `managed-service-handoff-failed` รวมถึง `handoff.command` เมื่อจำเป็นต้องอัปเดตด้วย shell เอง การส่งต่อที่ไม่พร้อมใช้งานหมายถึง OpenClaw ไม่มีขอบเขต supervisor ที่ปลอดภัยหรือ identity ของบริการที่คงทน เช่น `OPENCLAW_SYSTEMD_UNIT` สำหรับ systemd ระหว่างการส่งต่อที่เริ่มแล้ว restart sentinel อาจรายงาน `stats.reason: "restart-health-pending"` ชั่วครู่; continuation จะถูกหน่วงจนกว่า CLI จะตรวจสอบ Gateway ที่ restart แล้วและเขียน sentinel `ok` สุดท้าย
    - `update.status` รีเฟรชและส่งคืน restart sentinel ล่าสุดของการอัปเดต รวมถึงเวอร์ชันที่ทำงานอยู่หลัง restart เมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผย onboarding wizard ผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วยสำหรับเอเจนต์และเวิร์กสเปซ">
    - `agents.list` ส่งคืนรายการเอเจนต์ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลและเมทาดาทาของรันไทม์
    - `agents.create`, `agents.update`, และ `agents.delete` จัดการเรคคอร์ดเอเจนต์และการเชื่อมต่อเวิร์กสเปซ
    - `agents.files.list`, `agents.files.get`, และ `agents.files.set` จัดการไฟล์เวิร์กสเปซบูตสแตรปที่เปิดเผยให้เอเจนต์ใช้
    - `tasks.list`, `tasks.get`, และ `tasks.cancel` เปิดเผยบัญชีแยกประเภทงานของ Gateway ให้ไคลเอนต์ SDK และผู้ปฏิบัติงานใช้
    - `artifacts.list`, `artifacts.get`, และ `artifacts.download` เปิดเผยสรุปอาร์ติแฟกต์และการดาวน์โหลดที่ได้จากทรานสคริปต์สำหรับขอบเขต `sessionKey`, `runId`, หรือ `taskId` ที่ระบุชัดเจน คิวรีรันและงานจะแก้หาเซสชันเจ้าของที่ฝั่งเซิร์ฟเวอร์ และส่งคืนเฉพาะสื่อทรานสคริปต์ที่มีที่มาตรงกัน แหล่ง URL ที่ไม่ปลอดภัยหรือเป็นโลคัลจะส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการดึงข้อมูลที่ฝั่งเซิร์ฟเวอร์
    - `environments.list` และ `environments.status` เปิดเผยการค้นพบสภาพแวดล้อมแบบอ่านอย่างเดียวของ Gateway-local และโหนดสำหรับไคลเอนต์ SDK
    - `agent.identity.get` ส่งคืนอัตลักษณ์ผู้ช่วยที่มีผลสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้รันเสร็จสิ้นและส่งคืนสแนปช็อตสุดท้ายเมื่อมีให้ใช้

  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึงเมทาดาทา `agentRuntime` ต่อแถวเมื่อมีการกำหนดค่าแบ็กเอนด์รันไทม์ของเอเจนต์
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับเหตุการณ์ทรานสคริปต์/ข้อความสำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนตัวอย่างทรานสคริปต์แบบมีขอบเขตสำหรับคีย์เซสชันที่ระบุ
    - `sessions.describe` ส่งคืนแถวเซสชันของ Gateway หนึ่งแถวสำหรับคีย์เซสชันที่ตรงกันทุกประการ
    - `sessions.resolve` แก้หาหรือทำให้เป้าหมายเซสชันเป็นรูปแบบบัญญัติ
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าสู่เซสชันที่มีอยู่
    - `sessions.steer` เป็นตัวแปรแบบขัดจังหวะและบังคับทิศทางสำหรับเซสชันที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` แบบไม่บังคับ หรือส่งเฉพาะ `runId` สำหรับรันที่ใช้งานอยู่ซึ่ง Gateway สามารถแก้หาเป็นเซสชันได้
    - `sessions.patch` อัปเดตเมทาดาทา/ค่าทับของเซสชัน และรายงานโมเดลบัญญัติที่แก้ได้พร้อม `agentRuntime` ที่มีผล
    - `sessions.reset`, `sessions.delete`, และ `sessions.compact` ทำการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้แบบเต็ม
    - การดำเนินการแชทยังคงใช้ `chat.history`, `chat.send`, `chat.abort`, และ `chat.inject` `chat.history` ถูกทำให้เป็นมาตรฐานสำหรับการแสดงผลให้ไคลเอนต์ UI: แท็กคำสั่งแบบอินไลน์จะถูกตัดออกจากข้อความที่มองเห็นได้, เพย์โหลด XML ของการเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) และโทเค็นควบคุมโมเดล ASCII/เต็มความกว้างที่รั่วไหลจะถูกตัดออก, แถวผู้ช่วยที่เป็นโทเค็นเงียบล้วน เช่น `NO_REPLY` / `no_reply` ที่ตรงกันทุกประการจะถูกละไว้, และแถวที่มีขนาดใหญ่เกินไปอาจถูกแทนที่ด้วยตัวยึดตำแหน่ง
    - `chat.message.get` เป็นตัวอ่านข้อความเต็มแบบมีขอบเขตที่เพิ่มเข้ามาสำหรับรายการทรานสคริปต์ที่มองเห็นได้หนึ่งรายการ ไคลเอนต์ส่ง `sessionKey`, `agentId` แบบไม่บังคับเมื่อการเลือกเซสชันอยู่ในขอบเขตของเอเจนต์, พร้อม `messageId` ของทรานสคริปต์ที่เคยเปิดเผยผ่าน `chat.history` และ Gateway จะส่งคืนโปรเจกชันที่ทำให้เป็นมาตรฐานสำหรับการแสดงผลเดียวกันโดยไม่มีเพดานการตัดทอนประวัติแบบเบา เมื่อรายการที่จัดเก็บไว้ยังมีอยู่และไม่ใหญ่เกินไป
    - `chat.send` ยอมรับ `fastMode: "auto"` แบบหนึ่งเทิร์นเพื่อใช้โหมดเร็วสำหรับการเรียกโมเดลที่เริ่มก่อนจุดตัดอัตโนมัติ จากนั้นเริ่มการเรียก retry, fallback, ผลลัพธ์เครื่องมือ, หรือการดำเนินต่อในภายหลังโดยไม่มีโหมดเร็ว จุดตัดมีค่าเริ่มต้นเป็น 60 วินาทีและสามารถกำหนดค่าแยกตามโมเดลด้วย `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` ผู้เรียก `chat.send` สามารถส่ง `fastAutoOnSeconds` แบบหนึ่งเทิร์นเพื่อแทนที่จุดตัดสำหรับคำขอนั้นได้

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และโทเค็นอุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วซึ่งรอดำเนินการและได้รับอนุมัติ
    - `device.pair.approve`, `device.pair.reject`, และ `device.pair.remove` จัดการเรคคอร์ดการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก
    - `device.token.revoke` เพิกถอนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่โหนด การเรียกใช้ และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, และ `node.pair.verify` ครอบคลุมการจับคู่โหนดและการยืนยันบูตสแตรป
    - `node.list` และ `node.describe` ส่งคืนสถานะโหนดที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับโหนดที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยังโหนดที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอเรียกใช้
    - `node.event` นำเหตุการณ์ที่เกิดจากโหนดกลับเข้าสู่ Gateway
    - `node.pending.pull` และ `node.pending.ack` เป็น API คิวของโหนดที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบคงทนสำหรับโหนดที่ออฟไลน์/ตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="กลุ่มการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการและส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการสแนปช็อตนโยบายการอนุมัติ exec ของ gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec ภายในโหนดผ่านคำสั่งรีเลย์โหนด
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่ Plugin กำหนด

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ, Skills, และเครื่องมือ">
    - ระบบอัตโนมัติ: `wake` กำหนดเวลาการแทรกข้อความปลุกแบบทันทีหรือใน Heartbeat ถัดไป; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่กำหนดเวลาไว้
    - `cron.run` ยังคงเป็น RPC แบบเข้าคิวสำหรับการรันด้วยตนเอง ไคลเอนต์ที่ต้องการความหมายเชิงการเสร็จสิ้นควรอ่าน `runId` ที่ส่งคืนและโพล `cron.runs`
    - `cron.runs` ยอมรับตัวกรอง `runId` แบบไม่ว่างที่ไม่บังคับ เพื่อให้ไคลเอนต์สามารถติดตามการรันด้วยตนเองที่เข้าคิวไว้หนึ่งรายการได้โดยไม่แข่งกับรายการประวัติอื่นสำหรับงานเดียวกัน
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### กลุ่มเหตุการณ์ทั่วไป

- `chat`: การอัปเดตแชทของ UI เช่น `chat.inject` และเหตุการณ์แชทอื่นที่เป็นเฉพาะทรานสคริปต์
  ในโปรโตคอล v4 เพย์โหลดเดลตาจะมี `deltaText`; `message` ยังคงเป็น
  สแนปช็อตผู้ช่วยแบบสะสม การแทนที่ที่ไม่ใช่คำนำหน้าจะตั้ง `replace=true`
  และใช้ `deltaText` เป็นข้อความแทนที่
- `session.message`, `session.operation`, และ `session.tool`: ทรานสคริปต์,
  การดำเนินการเซสชันที่กำลังทำงาน, และการอัปเดตสตรีมเหตุการณ์สำหรับเซสชัน
  ที่สมัครรับอยู่
- `sessions.changed`: ดัชนีเซสชันหรือเมทาดาทาเปลี่ยนแปลง
- `presence`: การอัปเดตสแนปช็อตสถานะปรากฏของระบบ
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดตสแนปช็อตสุขภาพของ gateway
- `heartbeat`: การอัปเดตสตรีมเหตุการณ์ Heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลงงาน/รันของ Cron
- `shutdown`: การแจ้งเตือนการปิด Gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่โหนด
- `node.invoke.request`: การบรอดแคสต์คำขอเรียกใช้โหนด
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตอุปกรณ์ที่จับคู่แล้ว
- `voicewake.changed`: การกำหนดค่าทริกเกอร์คำปลุกเปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ Plugin

### เมธอดตัวช่วยโหนด

- โหนดอาจเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของไฟล์ปฏิบัติการ Skills
  สำหรับการตรวจสอบการอนุญาตอัตโนมัติ

### RPC บัญชีแยกประเภทงาน

ไคลเอนต์ผู้ปฏิบัติงานอาจตรวจสอบและยกเลิกเรคคอร์ดงานเบื้องหลังของ Gateway ผ่าน
RPC บัญชีแยกประเภทงาน เมธอดเหล่านี้ส่งคืนสรุปงานที่ผ่านการล้างข้อมูลแล้ว ไม่ใช่
สถานะรันไทม์ดิบ

- `tasks.list` ต้องใช้ `operator.read`
  - พารามิเตอร์: `status` แบบไม่บังคับ (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"`, หรือ `"timed_out"`) หรืออาร์เรย์ของสถานะเหล่านั้น,
    `agentId` แบบไม่บังคับ, `sessionKey` แบบไม่บังคับ, `limit` แบบไม่บังคับตั้งแต่ `1` ถึง
    `500`, และสตริง `cursor` แบบไม่บังคับ
  - ผลลัพธ์: `{ "tasks": TaskSummary[], "nextCursor"?: string }`
- `tasks.get` ต้องใช้ `operator.read`
  - พารามิเตอร์: `{ "taskId": string }`
  - ผลลัพธ์: `{ "task": TaskSummary }`
  - ID งานที่หายไปจะส่งคืนรูปแบบข้อผิดพลาด not-found ของ Gateway
- `tasks.cancel` ต้องใช้ `operator.write`
  - พารามิเตอร์: `{ "taskId": string, "reason"?: string }`
  - ผลลัพธ์:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`
  - `found` รายงานว่าบัญชีแยกประเภทมีงานที่ตรงกันหรือไม่ `cancelled`
    รายงานว่ารันไทม์ยอมรับหรือบันทึกการยกเลิกหรือไม่

`TaskSummary` รวม `id`, `status`, และเมทาดาทาแบบไม่บังคับ เช่น `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, เวลา, ความคืบหน้า,
สรุปสถานะสุดท้าย, และข้อความข้อผิดพลาดที่ผ่านการล้างข้อมูลแล้ว `agentId` ระบุเอเจนต์
ที่กำลังดำเนินงาน; `sessionKey` และ `ownerKey` เก็บรักษาบริบทของผู้ร้องขอและการควบคุม

### เมธอดตัวช่วยผู้ปฏิบัติงาน

- ผู้ปฏิบัติงานอาจเรียก `commands.list` (`operator.read`) เพื่อดึงคลังคำสั่งรันไทม์สำหรับเอเจนต์
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านเวิร์กสเปซเอเจนต์เริ่มต้น
  - `scope` ควบคุมว่าพื้นผิวใดที่ `name` หลักกำหนดเป้าหมาย:
    - `text` ส่งคืนโทเค็นคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และพาธเริ่มต้น `both` ส่งคืนชื่อเนทีฟที่รับรู้ผู้ให้บริการเมื่อมี
  - `textAliases` มีนามแฝง slash ที่ตรงกันทุกประการ เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่งเนทีฟที่รับรู้ผู้ให้บริการเมื่อมีอยู่
  - `provider` เป็นตัวเลือกและมีผลเฉพาะต่อการตั้งชื่อเนทีฟรวมถึงความพร้อมใช้งานของคำสั่ง Plugin เนทีฟ
  - `includeArgs=false` ละเว้นเมทาดาทาอาร์กิวเมนต์ที่ซีเรียลไลซ์แล้วจากการตอบกลับ
- ผู้ปฏิบัติงานอาจเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือรันไทม์สำหรับเอเจนต์ การตอบกลับรวมเครื่องมือที่จัดกลุ่มและเมทาดาทาแหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: เครื่องมือ Plugin เป็นตัวเลือกหรือไม่
- ผู้ปฏิบัติงานอาจเรียก `tools.effective` (`operator.read`) เพื่อดึงคลังเครื่องมือที่มีผลในรันไทม์สำหรับเซสชัน
  - ต้องระบุ `sessionKey`
  - Gateway อนุมานบริบทรันไทม์ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนการยอมรับบริบทการยืนยันตัวตนหรือการส่งมอบที่ผู้เรียกส่งมา
  - การตอบกลับเป็นโปรเจกชันที่อนุมานจากเซิร์ฟเวอร์และจำกัดขอบเขตตามเซสชันของคลังที่ใช้งานอยู่ รวมถึงเครื่องมือ core, Plugin, channel และเครื่องมือเซิร์ฟเวอร์ MCP ที่ค้นพบแล้ว
  - `tools.effective` เป็นแบบอ่านอย่างเดียวสำหรับ MCP: อาจโปรเจกต์แค็ตตาล็อก MCP ของเซสชันที่อุ่นอยู่ผ่านนโยบายเครื่องมือขั้นสุดท้าย แต่จะไม่สร้างรันไทม์ MCP, เชื่อมต่อทรานสปอร์ต หรือออก `tools/list` หากไม่มีแค็ตตาล็อกที่อุ่นอยู่และตรงกัน การตอบกลับอาจมีประกาศ เช่น `mcp-not-yet-connected`, `mcp-not-yet-listed` หรือ `mcp-stale-catalog`
  - รายการเครื่องมือที่มีผลใช้ `source="core"`, `source="plugin"`, `source="channel"` หรือ `source="mcp"`
- ผู้ปฏิบัติงานอาจเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือหนึ่งที่พร้อมใช้งานผ่านพาธนโยบาย Gateway เดียวกับ `/tools/invoke`
  - ต้องระบุ `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ `idempotencyKey` เป็นตัวเลือก
  - หากมีทั้ง `sessionKey` และ `agentId` เอเจนต์ของเซสชันที่แก้ไขได้ต้องตรงกับ `agentId`
  - แรปเปอร์ core เฉพาะเจ้าของ เช่น `cron`, `gateway` และ `nodes` ต้องใช้ตัวตนเจ้าของ/ผู้ดูแลระบบ (`operator.admin`) แม้ว่าเมธอด `tools.invoke` เองจะเป็น `operator.write`
  - การตอบกลับเป็น envelope สำหรับ SDK พร้อมฟิลด์ `ok`, `toolName`, `output` ที่เป็นตัวเลือก และ `error` แบบมีชนิด การอนุมัติหรือการปฏิเสธตามนโยบายจะส่งคืน `ok:false` ในเพย์โหลด แทนการข้ามไปป์ไลน์นโยบายเครื่องมือของ Gateway
- ผู้ปฏิบัติงานอาจเรียก `skills.status` (`operator.read`) เพื่อดึงคลัง Skills ที่มองเห็นได้สำหรับเอเจนต์
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านเวิร์กสเปซเอเจนต์เริ่มต้น
  - การตอบกลับรวมคุณสมบัติการเข้าเกณฑ์ ข้อกำหนดที่ขาดหาย การตรวจสอบคอนฟิก และตัวเลือกการติดตั้งที่ล้างข้อมูลแล้วโดยไม่เปิดเผยค่าความลับดิบ
- ผู้ปฏิบัติงานอาจเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับเมทาดาทาการค้นพบ ClawHub
- ผู้ปฏิบัติงานอาจเรียก `skills.upload.begin`, `skills.upload.chunk` และ `skills.upload.commit` (`operator.admin`) เพื่อเตรียมไฟล์เก็บถาวรของ skill ส่วนตัวก่อนติดตั้ง นี่เป็นพาธอัปโหลดของผู้ดูแลระบบแยกต่างหากสำหรับไคลเอนต์ที่เชื่อถือได้ ไม่ใช่โฟลว์ติดตั้ง skill ของ ClawHub ตามปกติ และถูกปิดใช้งานเป็นค่าเริ่มต้น เว้นแต่เปิดใช้ `skills.install.allowUploadedArchives`
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    สร้างการอัปโหลดที่ผูกกับ slug และค่า force นั้น
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` ต่อท้ายไบต์ที่ออฟเซ็ตที่ถอดรหัสแล้วตรงกันทุกประการ
  - `skills.upload.commit({ uploadId, sha256? })` ตรวจสอบขนาดสุดท้ายและ SHA-256 การ commit จะทำให้การอัปโหลดเสร็จสมบูรณ์เท่านั้น; ไม่ได้ติดตั้ง skill
  - ไฟล์เก็บถาวรของ skill ที่อัปโหลดเป็นไฟล์ zip ที่มีรูท `SKILL.md` ชื่อไดเรกทอรีภายในของไฟล์เก็บถาวรจะไม่เลือกเป้าหมายการติดตั้ง
- ผู้ปฏิบัติงานอาจเรียก `skills.install` (`operator.admin`) ได้ในสามโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้งโฟลเดอร์ skill ลงในไดเรกทอรี `skills/` ของเวิร์กสเปซเอเจนต์เริ่มต้น
  - โหมดอัปโหลด: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    ติดตั้งการอัปโหลดที่ commit แล้วลงในไดเรกทอรี `skills/<slug>` ของเวิร์กสเปซเอเจนต์เริ่มต้น ค่า slug และ force ต้องตรงกับคำขอ `skills.upload.begin` เดิม โหมดนี้จะถูกปฏิเสธ เว้นแต่เปิดใช้ `skills.install.allowUploadedArchives` การตั้งค่านี้ไม่มีผลต่อการติดตั้ง ClawHub
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, timeoutMs? }`
    เรียกใช้แอ็กชัน `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ Gateway ไคลเอนต์รุ่นเก่าอาจยังส่ง `dangerouslyForceUnsafeInstall`; ฟิลด์นี้เลิกใช้แล้ว ยอมรับเฉพาะเพื่อความเข้ากันได้ของโปรโตคอล และถูกละเว้น ใช้ `security.installPolicy` สำหรับการตัดสินใจติดตั้งที่ผู้ปฏิบัติงานเป็นเจ้าของ
- ผู้ปฏิบัติงานอาจเรียก `skills.update` (`operator.admin`) ได้ในสองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามหนึ่งรายการหรือการติดตั้ง ClawHub ที่ติดตามทั้งหมดในเวิร์กสเปซเอเจนต์เริ่มต้น
  - โหมดคอนฟิกแพตช์ค่า `skills.entries.<skillKey>` เช่น `enabled`, `apiKey` และ `env`

### มุมมองของ `models.list`

`models.list` ยอมรับพารามิเตอร์ `view` ที่เป็นตัวเลือก:

- ละไว้หรือ `"default"`: พฤติกรรมรันไทม์ปัจจุบัน หากคอนฟิก `agents.defaults.models` ไว้ การตอบกลับคือแค็ตตาล็อกที่อนุญาต รวมถึงโมเดลที่ค้นพบแบบไดนามิกสำหรับรายการ `provider/*` มิฉะนั้นการตอบกลับคือแค็ตตาล็อก Gateway ทั้งหมด
- `"configured"`: พฤติกรรมขนาดพอดีกับตัวเลือก หากคอนฟิก `agents.defaults.models` ไว้ ค่านั้นยังคงมีลำดับความสำคัญ รวมถึงการค้นพบตามขอบเขตผู้ให้บริการสำหรับรายการ `provider/*` หากไม่มี allowlist การตอบกลับจะใช้รายการ `models.providers.*.models` ที่ระบุชัดเจน โดยย้อนกลับไปใช้แค็ตตาล็อกทั้งหมดเฉพาะเมื่อไม่มีแถวโมเดลที่คอนฟิกไว้
- `"all"`: แค็ตตาล็อก Gateway ทั้งหมด โดยข้าม `agents.defaults.models` ใช้สำหรับการวินิจฉัยและ UI การค้นพบ ไม่ใช่ตัวเลือกโมเดลตามปกติ

## การอนุมัติ exec

- เมื่อคำขอ exec ต้องการการอนุมัติ Gateway จะกระจาย `exec.approval.requested`
- ไคลเอนต์ผู้ปฏิบัติงานแก้ไขโดยเรียก `exec.approval.resolve` (ต้องใช้ขอบเขต `operator.approvals`)
- สำหรับ `host=node` นั้น `exec.approval.request` ต้องมี `systemRunPlan` (เมทาดาทา `argv`/`cwd`/`rawCommand`/เซสชันแบบ canonical) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังอนุมัติแล้ว การเรียก `node.invoke system.run` ที่ส่งต่อจะใช้ `systemRunPlan` แบบ canonical นั้นซ้ำเป็นบริบทคำสั่ง/cwd/เซสชันที่มีอำนาจ
- หากผู้เรียกแก้ไข `command`, `rawCommand`, `cwd`, `agentId` หรือ `sessionKey` ระหว่างการเตรียมและการส่งต่อ `system.run` ที่อนุมัติแล้วขั้นสุดท้าย Gateway จะปฏิเสธการรันแทนที่จะเชื่อถือเพย์โหลดที่ถูกแก้ไข

## fallback การส่งมอบเอเจนต์

- คำขอ `agent` สามารถรวม `deliver=true` เพื่อขอการส่งมอบขาออก
- `bestEffortDeliver=false` คงพฤติกรรมเข้มงวดไว้: เป้าหมายการส่งมอบที่แก้ไขไม่ได้หรือเป็นภายในเท่านั้นจะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback เป็นการดำเนินการเฉพาะเซสชันเมื่อไม่สามารถแก้ไขเส้นทางที่ส่งมอบภายนอกได้ (เช่น เซสชันภายใน/webchat หรือคอนฟิกหลาย channel ที่กำกวม)
- ผลลัพธ์ `agent` ขั้นสุดท้ายอาจมี `result.deliveryStatus` เมื่อมีการขอการส่งมอบ โดยใช้สถานะ `sent`, `suppressed`, `partial_failed` และ `failed` เดียวกับที่บันทึกไว้สำหรับ [`openclaw agent --json --deliver`](/th/cli/agent#json-delivery-status)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `packages/gateway-protocol/src/version.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธช่วงที่ไม่รวมโปรโตคอลปัจจุบันของตน ไคลเอนต์และเซิร์ฟเวอร์ปัจจุบันต้องใช้โปรโตคอล v4
- สคีมา + โมเดลถูกสร้างจากคำจำกัดความ TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

ไคลเอนต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าเหล่านี้เสถียรตลอดโปรโตคอล v4 และเป็นฐานที่คาดหวังสำหรับไคลเอนต์บุคคลที่สาม

| ค่าคงที่                                  | ค่าเริ่มต้น                                             | แหล่งที่มา                                                                                |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| หมดเวลาคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| หมดเวลา preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่มงบประมาณเซิร์ฟเวอร์/ไคลเอนต์ที่จับคู่กันได้) |
| backoff การเชื่อมต่อใหม่เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| backoff การเชื่อมต่อใหม่สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| clamp การลองซ้ำเร็วหลังปิด device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ระยะผ่อนผัน force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| หมดเวลาเริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| การปิดจาก tick-timeout                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศ `policy.tickIntervalMs`, `policy.maxPayload` และ `policy.maxBufferedBytes` ที่มีผลใน `hello-ok`; ไคลเอนต์ควรเคารพค่าเหล่านั้นแทนค่าเริ่มต้นก่อน handshake

## Auth

- การยืนยันตัวตน Gateway ด้วย shared-secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมด auth ที่กำหนดค่าไว้.
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ `gateway.auth.mode: "trusted-proxy"`
  แบบไม่ใช่ local loopback จะผ่านการตรวจ auth ของ connect จาก
  ส่วนหัวคำขอแทน `connect.params.auth.*`.
- private-ingress `gateway.auth.mode: "none"` ข้าม shared-secret connect auth
  ทั้งหมด; อย่าเปิดใช้โหมดนั้นบน ingress สาธารณะ/ไม่น่าเชื่อถือ.
- หลังการจับคู่ Gateway จะออก **โทเค็นอุปกรณ์** ที่จำกัดตามบทบาทการเชื่อมต่อ
  + ขอบเขต. โทเค็นนี้ถูกส่งกลับใน `hello-ok.auth.deviceToken` และไคลเอนต์ควร
  บันทึกไว้สำหรับการเชื่อมต่อในอนาคต.
- ไคลเอนต์ควรบันทึก `hello-ok.auth.deviceToken` หลักหลังจากการเชื่อมต่อที่สำเร็จทุกครั้ง.
- การเชื่อมต่อใหม่ด้วยโทเค็นอุปกรณ์ที่ **บันทึกไว้** ควรใช้ชุดขอบเขตที่อนุมัติแล้ว
  ซึ่งบันทึกไว้สำหรับโทเค็นนั้นด้วย. สิ่งนี้รักษาสิทธิ์อ่าน/ตรวจสอบ/สถานะ
  ที่ได้รับอนุญาตไปแล้ว และหลีกเลี่ยงการทำให้การเชื่อมต่อใหม่ยุบลงอย่างเงียบๆ
  เหลือเพียงขอบเขต implicit แบบ admin-only ที่แคบกว่า.
- การประกอบ connect auth ฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากส่วนอื่น และจะถูกส่งต่อเสมอเมื่อมีการตั้งค่า.
  - `auth.token` ถูกเติมตามลำดับความสำคัญ: shared token ที่ระบุชัดเจนก่อน,
    จากนั้น `deviceToken` ที่ระบุชัดเจน, แล้วจึงเป็นโทเค็นต่ออุปกรณ์ที่บันทึกไว้
    (ใช้คีย์จาก `deviceId` + `role`).
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อไม่มีรายการข้างต้นใด resolve เป็น
    `auth.token`. shared token หรือ device token ใดๆ ที่ resolve ได้จะกดการส่งค่านี้ไว้.
  - การเลื่อนระดับอัตโนมัติของโทเค็นอุปกรณ์ที่บันทึกไว้ในการลองซ้ำแบบ one-shot
    `AUTH_TOKEN_MISMATCH` ถูกจำกัดไว้เฉพาะ **trusted endpoints** เท่านั้น —
    local loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบ pinned. `wss://`
    สาธารณะที่ไม่มี pinning จะไม่เข้าเกณฑ์.
- bootstrap ด้วย setup-code ในตัวจะส่งคืน Node หลัก
  `hello-ok.auth.deviceToken` พร้อมโทเค็นผู้ปฏิบัติงานแบบมีขอบเขตใน
  `hello-ok.auth.deviceTokens` สำหรับการส่งต่อมือถือที่เชื่อถือได้. โทเค็นผู้ปฏิบัติงาน
  รวม `operator.talk.secrets` สำหรับการอ่านการกำหนดค่า Talk แบบ native และไม่รวม
  `operator.admin` กับ `operator.pairing`.
- ขณะที่ bootstrap ด้วย setup-code แบบ non-baseline กำลังรอการอนุมัติ รายละเอียด
  `PAIRING_REQUIRED` จะมี `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  และ `pauseReconnect: false`. ไคลเอนต์ควรเชื่อมต่อใหม่ต่อไปด้วย bootstrap token
  เดิมจนกว่าคำขอจะได้รับอนุมัติหรือโทเค็นจะไม่ถูกต้อง.
- บันทึก `hello-ok.auth.deviceTokens` เฉพาะเมื่อการเชื่อมต่อใช้ bootstrap auth
  บน transport ที่เชื่อถือได้ เช่น `wss://` หรือการจับคู่ผ่าน loopback/local.
- หากไคลเอนต์ส่ง `deviceToken` แบบ **ระบุชัดเจน** หรือ `scopes` แบบระบุชัดเจน
  ชุดขอบเขตที่ผู้เรียกขอยังคงเป็นแหล่งอ้างอิงหลัก; ขอบเขตที่แคชไว้จะถูกนำกลับมาใช้
  เฉพาะเมื่อไคลเอนต์กำลังใช้โทเค็นต่ออุปกรณ์ที่บันทึกไว้ซ้ำ.
- โทเค็นอุปกรณ์สามารถ rotate/revoke ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องมีขอบเขต `operator.pairing`). การ rotate หรือ
  revoke Node หรือบทบาทอื่นที่ไม่ใช่ผู้ปฏิบัติงานต้องมี `operator.admin` ด้วย.
- `device.token.rotate` ส่งคืน metadata การ rotate. จะสะท้อน bearer token
  ทดแทนกลับมาเฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ผ่านการยืนยันตัวตนด้วย
  device token นั้นอยู่แล้ว เพื่อให้ไคลเอนต์แบบ token-only บันทึกตัวทดแทนก่อน
  เชื่อมต่อใหม่ได้. การ rotate แบบ shared/admin จะไม่สะท้อน bearer token กลับมา.
- การออกโทเค็น, การ rotate, และการ revoke ยังคงถูกจำกัดอยู่ในชุดบทบาทที่อนุมัติ
  ซึ่งบันทึกไว้ในรายการจับคู่ของอุปกรณ์นั้น; การแก้ไขโทเค็นไม่สามารถขยายหรือกำหนดเป้าหมาย
  บทบาทอุปกรณ์ที่การอนุมัติการจับคู่ไม่เคยให้ไว้.
- สำหรับเซสชันโทเค็นอุปกรณ์ที่จับคู่แล้ว การจัดการอุปกรณ์จะจำกัดอยู่กับตนเอง
  เว้นแต่ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ admin จัดการได้เฉพาะ
  โทเค็นผู้ปฏิบัติงานสำหรับรายการอุปกรณ์ **ของตนเอง**. การจัดการโทเค็น Node
  และโทเค็นอื่นที่ไม่ใช่ผู้ปฏิบัติงานเป็น admin-only แม้สำหรับอุปกรณ์ของผู้เรียกเอง.
- `device.token.rotate` และ `device.token.revoke` ยังตรวจชุดขอบเขตของโทเค็น
  ผู้ปฏิบัติงานเป้าหมายเทียบกับขอบเขตเซสชันปัจจุบันของผู้เรียก. ผู้เรียกที่ไม่ใช่ admin
  ไม่สามารถ rotate หรือ revoke โทเค็นผู้ปฏิบัติงานที่กว้างกว่าที่ตนถืออยู่แล้ว.
- ความล้มเหลวของ auth มี `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลองซ้ำแบบมีขอบเขตหนึ่งครั้งด้วยโทเค็นต่ออุปกรณ์ที่แคชไว้.
  - หากการลองซ้ำนั้นล้มเหลว ไคลเอนต์ควรหยุดลูปเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำการดำเนินการสำหรับผู้ปฏิบัติงาน.
- `AUTH_SCOPE_MISMATCH` หมายความว่าโทเค็นอุปกรณ์ถูกจดจำได้แต่ไม่ครอบคลุม
  บทบาท/ขอบเขตที่ร้องขอ. ไคลเอนต์ไม่ควรแสดงสิ่งนี้ว่าเป็นโทเค็นเสีย;
  ให้แจ้งผู้ปฏิบัติงานให้จับคู่ใหม่หรืออนุมัติสัญญาขอบเขตที่แคบกว่า/กว้างกว่า.

## ข้อมูลระบุตัวตนอุปกรณ์ + การจับคู่

- Node ควรใส่ข้อมูลระบุตัวตนอุปกรณ์ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  fingerprint ของ keypair.
- Gateway ออกโทเค็นแยกตามอุปกรณ์ + บทบาท.
- ต้องมีการอนุมัติการจับคู่สำหรับ ID อุปกรณ์ใหม่ เว้นแต่จะเปิดใช้การอนุมัติอัตโนมัติแบบ local.
- การอนุมัติอัตโนมัติของการจับคู่มีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง.
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่แคบ
  สำหรับโฟลว์ helper แบบ shared-secret ที่เชื่อถือได้.
- การเชื่อมต่อผ่าน tailnet หรือ LAN บนโฮสต์เดียวกันยังคงถือเป็น remote สำหรับการจับคู่และ
  ต้องได้รับการอนุมัติ.
- ปกติไคลเอนต์ WS จะใส่ข้อมูลระบุตัวตน `device` ระหว่าง `connect` (ผู้ปฏิบัติงาน +
  Node). ข้อยกเว้นผู้ปฏิบัติงานที่ไม่มีอุปกรณ์มีเฉพาะเส้นทางความเชื่อถือที่ระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP ที่ไม่ปลอดภัยแบบ localhost-only.
  - auth ของ Control UI สำหรับผู้ปฏิบัติงานผ่าน `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง).
  - RPC backend `gateway-client` ผ่าน direct-loopback บนเส้นทาง helper ภายในที่สงวนไว้.
- การละเว้นข้อมูลระบุตัวตนอุปกรณ์มีผลต่อขอบเขต. เมื่อการเชื่อมต่อผู้ปฏิบัติงานแบบไม่มีอุปกรณ์
  ได้รับอนุญาตผ่านเส้นทางความเชื่อถือที่ระบุชัดเจน OpenClaw ยังจะล้างขอบเขตที่ประกาศเอง
  ให้เป็นชุดว่าง เว้นแต่เส้นทางนั้นมีข้อยกเว้นการรักษาขอบเขตที่มีชื่อ. เมธอดที่ต้องมีขอบเขต
  จะล้มเหลวด้วย `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` เป็นเส้นทางรักษาขอบเขตแบบ
  break-glass ของ Control UI. เส้นทางนี้ไม่ให้ขอบเขตแก่ไคลเอนต์ WebSocket แบบ
  backend หรือ CLI ที่กำหนดเองโดยพลการ.
- เส้นทาง helper backend `gateway-client` แบบ direct-loopback ที่สงวนไว้จะรักษาขอบเขต
  เฉพาะสำหรับ RPC control-plane ภายในแบบ local; ID backend ที่กำหนดเองไม่ได้รับข้อยกเว้นนี้.
- ทุกการเชื่อมต่อต้องลงนาม nonce `connect.challenge` ที่เซิร์ฟเวอร์ให้มา.

### การวินิจฉัยการย้าย device auth

สำหรับไคลเอนต์ legacy ที่ยังใช้พฤติกรรมการลงนามก่อน challenge ตอนนี้ `connect` จะส่งคืน
รหัสรายละเอียด `DEVICE_AUTH_*` ใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร.

ความล้มเหลวทั่วไปในการย้าย:

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
- ลงนาม payload v2 ที่รวม server nonce.
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`.
- payload ลายเซ็นที่แนะนำคือ `v3` ซึ่ง bind `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce.
- ลายเซ็น legacy `v2` ยังยอมรับเพื่อความเข้ากันได้ แต่การ pin metadata ของอุปกรณ์ที่จับคู่แล้ว
  ยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่.

## TLS + pinning

- รองรับ TLS สำหรับการเชื่อมต่อ WS.
- ไคลเอนต์อาจเลือก pin fingerprint ของใบรับรอง Gateway ได้ (ดูการกำหนดค่า `gateway.tls`
  พร้อม `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`).

## ขอบเขต

โปรโตคอลนี้เปิดเผย **API Gateway แบบเต็ม** (สถานะ, ช่องทาง, โมเดล, แชต,
agent, เซสชัน, Node, การอนุมัติ, ฯลฯ). พื้นผิวที่แน่นอนถูกกำหนดโดย
schema TypeBox ใน `packages/gateway-protocol/src/schema.ts`.

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [runbook ของ Gateway](/th/gateway)
