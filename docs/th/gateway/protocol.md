---
read_when:
    - การติดตั้งใช้งานหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การแก้ไขข้อบกพร่องของความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - การสร้าง schema/models ของโปรโตคอลใหม่อีกครั้ง
summary: 'โปรโตคอล WebSocket ของ Gateway: การจับมือ เฟรม และการกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-04-26T11:31:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01f873c7051f2a462cbefb50331e04edfdcedadeda8b3d7b7320ceb2462edccc
    source_path: gateway/protocol.md
    workflow: 15
---

โปรโตคอล Gateway WS คือ **control plane + node transport หนึ่งเดียว** สำหรับ
OpenClaw โดยไคลเอนต์ทั้งหมด (CLI, web UI, แอป macOS, โหนด iOS/Android, โหนดแบบ headless)
จะเชื่อมต่อผ่าน WebSocket และประกาศ **role** + **scope** ของตนในช่วง
handshake

## การขนส่ง

- WebSocket, text frames พร้อม JSON payload
- เฟรมแรก **ต้อง** เป็นคำขอ `connect`
- เฟรมก่อนเชื่อมต่อมีขนาดจำกัดที่ 64 KiB หลังจาก handshake สำเร็จแล้ว ไคลเอนต์
  ควรปฏิบัติตามข้อจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้ diagnostics
  เฟรมขาเข้าที่ใหญ่เกินไปและบัฟเฟอร์ขาออกที่ช้าจะปล่อยเหตุการณ์ `payload.large`
  ก่อนที่ gateway จะปิดหรือทิ้งเฟรมที่ได้รับผลกระทบ เหตุการณ์เหล่านี้เก็บ
  ขนาด, ขีดจำกัด, surfaces และ reason codes ที่ปลอดภัยไว้
  โดยจะไม่เก็บเนื้อความข้อความ, เนื้อหาของไฟล์แนบ, เนื้อหาเฟรมดิบ, tokens, cookies หรือค่าลับ

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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` และ `policy` เป็นฟิลด์บังคับทั้งหมดตาม schema
(`src/gateway/protocol/schema/frames.ts`) โดย `canvasHostUrl` เป็นแบบไม่บังคับ `auth`
จะรายงาน role/scopes ที่เจรจาสำเร็จแล้วเมื่อมี และจะรวม `deviceToken`
เมื่อ gateway ออกให้

เมื่อไม่มีการออก device token, `hello-ok.auth` ยังสามารถรายงาน permissions
ที่เจรจาได้:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ไคลเอนต์ backend ที่เชื่อถือได้และอยู่ในโปรเซสเดียวกัน (`client.id: "gateway-client"`,
`client.mode: "backend"`) อาจละ `device` ได้บนการเชื่อมต่อ direct loopback เมื่อ
ยืนยันตัวตนด้วย gateway token/password ที่ใช้ร่วมกัน เส้นทางนี้สงวนไว้
สำหรับ control-plane RPCs ภายใน และช่วยไม่ให้ baseline การจับคู่ CLI/device ที่ล้าสมัย
มาขัดขวางงาน backend ในเครื่อง เช่น การอัปเดตเซสชันของ subagent ไคลเอนต์ระยะไกล,
ไคลเอนต์ที่มาจากเบราว์เซอร์, node clients และไคลเอนต์ที่ใช้
device-token/device-identity แบบ explicit ยังคงใช้การจับคู่และการตรวจสอบการยกระดับ scope แบบปกติ

เมื่อมีการออก device token, `hello-ok` จะรวมข้อมูลดังนี้ด้วย:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

ระหว่าง trusted bootstrap handoff, `hello-ok.auth` อาจรวมรายการ role เพิ่มเติมแบบมีขอบเขตไว้ใน `deviceTokens` ด้วย:

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

สำหรับ flow bootstrap ของ node/operator ที่มาพร้อมระบบ primary node token จะยังคงเป็น
`scopes: []` และ operator token ที่ส่งต่อมาจะถูกจำกัดอยู่ใน bootstrap operator allowlist
(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจสอบ scope ระหว่าง bootstrap ยังคงยึดตามคำนำหน้า role: รายการของ operator จะตอบสนองได้เฉพาะคำขอของ operator และ role ที่ไม่ใช่ operator ยังคงต้องใช้ scopes ภายใต้คำนำหน้า role ของตนเอง

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

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

เมธอดที่มีผลข้างเคียงต้องใช้ **idempotency keys** (ดู schema)

## Roles + scopes

### Roles

- `operator` = ไคลเอนต์ control plane (CLI/UI/automation)
- `node` = โฮสต์ความสามารถ (camera/screen/canvas/system.run)

### Scopes (operator)

scopes ที่ใช้บ่อย:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` ที่มี `includeSecrets: true` ต้องใช้ `operator.talk.secrets`
(หรือ `operator.admin`)

เมธอด Gateway RPC ที่ Plugin ลงทะเบียนสามารถขอ operator scope ของตัวเองได้ แต่
prefix ของ core admin ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะ resolve เป็น `operator.admin` เสมอ

scope ของเมธอดเป็นเพียงด่านแรกเท่านั้น slash commands บางตัวที่เข้าถึงผ่าน
`chat.send` จะใช้การตรวจสอบระดับคำสั่งที่เข้มงวดกว่านี้เพิ่มเติม ตัวอย่างเช่น
การเขียนถาวรด้วย `/config set` และ `/config unset` ต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบ scope เพิ่มเติมในช่วงอนุมัติ นอกเหนือจาก
scope พื้นฐานของเมธอด:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มี node commands ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่มี `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes จะประกาศ claims ของความสามารถเมื่อเชื่อมต่อ:

- `caps`: หมวดหมู่ความสามารถระดับสูง
- `commands`: allowlist ของคำสั่งสำหรับการ invoke
- `permissions`: สวิตช์ระดับละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway จะถือว่าสิ่งเหล่านี้เป็น **claims** และบังคับใช้ allowlists ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` จะคืนรายการที่ถูกคีย์ด้วยตัวตนของอุปกรณ์
- รายการ presence จะมี `deviceId`, `roles` และ `scopes` เพื่อให้ UI สามารถแสดงหนึ่งแถวต่อหนึ่งอุปกรณ์ได้
  แม้อุปกรณ์นั้นจะเชื่อมต่อทั้งในบทบาท **operator** และ **node**

## การกำหนดขอบเขตของ broadcast events

broadcast events แบบ WebSocket ที่เซิร์ฟเวอร์ push มาจะถูกกำหนดขอบเขตตาม scope เพื่อไม่ให้เซสชันที่มี scope เฉพาะการจับคู่หรือ node-only ได้รับเนื้อหาของเซสชันแบบ passive

- **Chat, agent และ tool-result frames** (รวมถึงเหตุการณ์ `agent` แบบสตรีมและผลลัพธ์การเรียกเครื่องมือ) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **`plugin.*` broadcasts ที่ Plugin กำหนดเอง** จะถูกกำหนดขอบเขตเป็น `operator.write` หรือ `operator.admin` ตามที่ Plugin ลงทะเบียนไว้
- **Status และ transport events** (`heartbeat`, `presence`, `tick`, วงจรชีวิต connect/disconnect และอื่น ๆ) ยังคงไม่จำกัด เพื่อให้ทุกเซสชันที่ยืนยันตัวตนแล้วสังเกตสถานะของ transport ได้
- **ตระกูล broadcast event ที่ไม่รู้จัก** จะถูกกำหนดขอบเขตตาม scope โดยค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนคลายอย่างชัดเจน

การเชื่อมต่อของไคลเอนต์แต่ละตัวจะเก็บหมายเลขลำดับต่อไคลเอนต์ของตัวเอง ดังนั้น broadcasts จึงคงลำดับแบบ monotonic บน socket นั้นได้ แม้ไคลเอนต์ต่างตัวจะเห็นชุดย่อยของ event stream ที่ผ่านการกรองตาม scope ไม่เหมือนกัน

## ตระกูล RPC methods ที่ใช้บ่อย

พื้นผิว WS สาธารณะมีขอบเขตกว้างกว่าตัวอย่าง handshake/auth ข้างต้น
นี่ไม่ใช่การ dump แบบสร้างอัตโนมัติ — `hello-ok.features.methods` เป็นรายการค้นพบแบบ conservative
ที่สร้างจาก `src/gateway/server-methods-list.ts` พร้อม method exports ของ plugin/channel ที่โหลดแล้ว
ให้ถือว่าเป็นการค้นพบฟีเจอร์ ไม่ใช่รายการครบถ้วนของ `src/gateway/server-methods/*.ts`

<AccordionGroup>
  <Accordion title="ระบบและตัวตน">
    - `health` คืนค่า snapshot สุขภาพของ gateway ที่แคชไว้หรือเพิ่งตรวจสอบใหม่
    - `diagnostics.stability` คืนค่าตัวบันทึกเสถียรภาพ diagnostics แบบมีขอบเขตล่าสุด โดยเก็บ metadata เชิงปฏิบัติการ เช่น ชื่อเหตุการณ์ จำนวน ขนาดไบต์ ค่าหน่วยความจำ สถานะคิว/เซสชัน ชื่อ channel/Plugin และ session ids แต่จะไม่เก็บข้อความแชท, webhook bodies, ผลลัพธ์เครื่องมือ, เนื้อหาคำขอหรือคำตอบดิบ, tokens, cookies หรือค่าลับ ต้องใช้ operator read scope
    - `status` คืนค่าสรุป gateway แบบ `/status`; ฟิลด์ที่อ่อนไหวจะรวมอยู่ด้วยเฉพาะสำหรับ operator clients ที่มี admin scope
    - `gateway.identity.get` คืนค่าตัวตนอุปกรณ์ของ gateway ที่ใช้ใน flow ของ relay และ pairing
    - `system-presence` คืนค่า snapshot presence ปัจจุบันสำหรับอุปกรณ์ operator/node ที่เชื่อมต่ออยู่
    - `system-event` จะต่อท้าย system event และสามารถอัปเดต/กระจายบริบท presence ได้
    - `last-heartbeat` คืนค่าเหตุการณ์ Heartbeat ล่าสุดที่บันทึกไว้
    - `set-heartbeats` เปิด/ปิดการประมวลผล Heartbeat บน gateway
  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` คืนค่าแค็ตตาล็อกโมเดลที่อนุญาตในรันไทม์
    - `usage.status` คืนค่าสรุปช่วงเวลาการใช้งาน/โควตาที่เหลือของ provider
    - `usage.cost` คืนค่าสรุปต้นทุนการใช้งานแบบรวมสำหรับช่วงวันที่
    - `doctor.memory.status` คืนค่าสถานะความพร้อมของ vector-memory / embeddings สำหรับ workspace ของเอเจนต์เริ่มต้นที่กำลังใช้งาน
    - `sessions.usage` คืนค่าสรุปการใช้งานต่อเซสชัน
    - `sessions.usage.timeseries` คืนค่า timeseries การใช้งานสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` คืนค่า usage log entries สำหรับหนึ่งเซสชัน
  </Accordion>

  <Accordion title="Channels และตัวช่วยการเข้าสู่ระบบ">
    - `channels.status` คืนค่าสรุปสถานะของ channels/plugins ทั้ง built-in และ bundled
    - `channels.logout` ออกจากระบบ channel/account ที่กำหนด ในกรณีที่ channel นั้นรองรับการ logout
    - `web.login.start` เริ่ม flow การเข้าสู่ระบบแบบ QR/web สำหรับผู้ให้บริการ web channel ปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้ flow การเข้าสู่ระบบแบบ QR/web นั้นเสร็จสิ้น และเริ่ม channel เมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยังโหนด iOS ที่ลงทะเบียนไว้
    - `voicewake.get` คืนค่า wake-word triggers ที่เก็บไว้
    - `voicewake.set` อัปเดต wake-word triggers และกระจายการเปลี่ยนแปลง
  </Accordion>

  <Accordion title="การส่งข้อความและ logs">
    - `send` คือ outbound-delivery RPC โดยตรง สำหรับการส่งแบบระบุ channel/account/thread-target ภายนอก chat runner
    - `logs.tail` คืนค่า file-log tail ของ gateway ที่กำหนดไว้ พร้อมตัวควบคุม cursor/limit และขนาดไบต์สูงสุด
  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.config` คืนค่า payload ของ Talk config ที่มีผลจริง; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.mode` ตั้งค่า/กระจายสถานะ Talk mode ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.speak` สังเคราะห์เสียงผ่าน Talk speech provider ที่กำลังใช้งาน
    - `tts.status` คืนค่าสถานะการเปิดใช้ TTS, provider ที่ใช้งานอยู่, fallback providers และสถานะ config ของ provider
    - `tts.providers` คืนค่าคลัง TTS provider ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` เปิด/ปิดสถานะการตั้งค่า TTS
    - `tts.setProvider` อัปเดต TTS provider ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงแบบครั้งเดียว
  </Accordion>

  <Accordion title="Secrets, config, update และ wizard">
    - `secrets.reload` จะ resolve SecretRefs ที่ใช้งานอยู่ใหม่ และสลับสถานะ secrets ของรันไทม์เฉพาะเมื่อสำเร็จทั้งหมด
    - `secrets.resolve` จะ resolve การกำหนด secrets สำหรับคำสั่ง/ชุดเป้าหมายที่ระบุ
    - `config.get` คืนค่า snapshot และ hash ของ config ปัจจุบัน
    - `config.set` เขียน payload ของ config ที่ผ่านการตรวจสอบความถูกต้องแล้ว
    - `config.patch` merge การอัปเดต config บางส่วน
    - `config.apply` ตรวจสอบความถูกต้อง + แทนที่ payload ของ config ทั้งหมด
    - `config.schema` คืนค่า payload ของ live config schema ที่ใช้โดย Control UI และเครื่องมือ CLI: schema, `uiHints`, เวอร์ชัน และ generation metadata รวมถึง metadata ของ schema จาก Plugin + channel เมื่อรันไทม์สามารถโหลดได้ schema นี้มี metadata `title` / `description` ของฟิลด์ที่ได้มาจาก labels และ help text ชุดเดียวกับที่ UI ใช้ รวมถึงสาขา nested object, wildcard, array-item และ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารของฟิลด์ที่ตรงกัน
    - `config.schema.lookup` คืนค่า payload สำหรับการ lookup แบบกำหนดขอบเขตด้วยพาธสำหรับหนึ่งพาธของ config: normalized path, schema node แบบตื้น, hint ที่ตรงกัน + `hintPath` และสรุปลูกโดยตรงสำหรับ UI/CLI แบบเจาะลึก schema nodes ของ lookup จะคงเอกสารที่ผู้ใช้มองเห็นได้และฟิลด์การตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขตเชิงตัวเลข/สตริง/อาร์เรย์/อ็อบเจ็กต์ และแฟล็กอย่าง `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) ส่วน child summaries จะเปิดเผย `key`, `path` ที่ normalize แล้ว, `type`, `required`, `hasChildren` พร้อม `hint` / `hintPath` ที่ตรงกัน
    - `update.run` จะรัน flow การอัปเดต gateway และกำหนดเวลารีสตาร์ตเฉพาะเมื่อการอัปเดตเองสำเร็จ
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดให้ใช้ onboarding wizard ผ่าน WS RPC
  </Accordion>

  <Accordion title="ตัวช่วยสำหรับเอเจนต์และ workspace">
    - `agents.list` คืนค่ารายการเอเจนต์ที่กำหนดค่าไว้
    - `agents.create`, `agents.update` และ `agents.delete` ใช้จัดการ records ของเอเจนต์และการเชื่อมต่อกับ workspace
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` ใช้จัดการไฟล์ bootstrap workspace ที่เปิดให้เอเจนต์ใช้งาน
    - `agent.identity.get` คืนค่าตัวตนผู้ช่วยที่มีผลจริงสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้การรันเสร็จสิ้น และคืนค่า terminal snapshot เมื่อมี
  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` คืนค่าดัชนีเซสชันปัจจุบัน
    - `sessions.subscribe` และ `sessions.unsubscribe` เปิด/ปิดการสมัครรับเหตุการณ์การเปลี่ยนแปลงของเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` เปิด/ปิดการสมัครรับเหตุการณ์ transcript/message สำหรับหนึ่งเซสชัน
    - `sessions.preview` คืนค่า transcript previews แบบมีขอบเขตสำหรับ session keys ที่ระบุ
    - `sessions.resolve` ใช้ resolve หรือ canonicalize เป้าหมายเซสชัน
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปในเซสชันที่มีอยู่
    - `sessions.steer` เป็นรูปแบบ interrupt-and-steer สำหรับเซสชันที่กำลังทำงานอยู่
    - `sessions.abort` ยกเลิกงานที่กำลังทำอยู่ของเซสชัน
    - `sessions.patch` อัปเดต metadata/overrides ของเซสชัน
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ใช้ดูแลรักษาเซสชัน
    - `sessions.get` คืนค่าแถวเซสชันที่เก็บไว้ทั้งหมด
    - การทำงานของแชทยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` โดย `chat.history` ถูก normalize เพื่อการแสดงผลสำหรับไคลเอนต์ UI: inline directive tags จะถูกตัดออกจากข้อความที่มองเห็นได้, payload ของ plain-text tool-call XML (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน) และ model control tokens แบบ ASCII/full-width ที่รั่วออกมาจะถูกตัดออก, แถวของผู้ช่วยที่เป็น silent-token ล้วน ๆ เช่น `NO_REPLY` / `no_reply` แบบตรงตัวจะถูกละไว้, และแถวที่ใหญ่เกินไปอาจถูกแทนที่ด้วย placeholders
  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และ device tokens">
    - `device.pair.list` คืนค่าอุปกรณ์ที่จับคู่แล้วและที่กำลังรออนุมัติ
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` ใช้จัดการ records การจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียน paired device token ภายในขอบเขต role ที่อนุมัติและขอบเขต scope ของผู้เรียก
    - `device.token.revoke` เพิกถอน paired device token ภายในขอบเขต role ที่อนุมัติและขอบเขต scope ของผู้เรียก
  </Accordion>

  <Accordion title="การจับคู่ Node, invoke และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` และ `node.pair.verify` ครอบคลุมการจับคู่ node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` คืนค่าสถานะ node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายชื่อของ paired node
    - `node.invoke` ส่งต่อคำสั่งไปยัง node ที่เชื่อมต่ออยู่
    - `node.invoke.result` คืนค่าผลลัพธ์สำหรับคำขอ invoke
    - `node.event` ใช้ขนส่งเหตุการณ์ที่มาจาก node กลับเข้าสู่ gateway
    - `node.canvas.capability.refresh` รีเฟรช tokens ของ canvas-capability แบบกำหนดขอบเขต
    - `node.pending.pull` และ `node.pending.ack` คือ connected-node queue APIs
    - `node.pending.enqueue` และ `node.pending.drain` ใช้จัดการงานค้างแบบถาวรสำหรับ nodes ที่ offline/disconnected
  </Accordion>

  <Accordion title="ตระกูลการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการ lookup/replay การอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการตัดสินใจของ exec approval ที่รอดำเนินการหนึ่งรายการ และคืนค่าผลการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` ใช้จัดการ snapshots ของนโยบายการอนุมัติ exec ของ gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` ใช้จัดการนโยบายการอนุมัติ exec ในเครื่องของ node ผ่านคำสั่ง node relay
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุม flows การอนุมัติที่กำหนดโดย Plugin
  </Accordion>

  <Accordion title="ระบบอัตโนมัติ Skills และเครื่องมือ">
    - ระบบอัตโนมัติ: `wake` กำหนดเวลาการ inject ข้อความปลุกแบบทันทีหรือใน Heartbeat ถัดไป; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` ใช้จัดการงานตามกำหนดเวลา
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`
  </Accordion>
</AccordionGroup>

### ตระกูลเหตุการณ์ที่พบบ่อย

- `chat`: การอัปเดตแชทของ UI เช่น `chat.inject` และเหตุการณ์แชทอื่น ๆ
  ที่เป็น transcript-only
- `session.message` และ `session.tool`: การอัปเดต transcript/event-stream สำหรับ
  เซสชันที่สมัครรับข้อมูลไว้
- `sessions.changed`: ดัชนีเซสชันหรือ metadata มีการเปลี่ยนแปลง
- `presence`: การอัปเดต snapshot ของ system presence
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดต snapshot สุขภาพของ gateway
- `heartbeat`: การอัปเดต event stream ของ Heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลงของ cron run/job
- `shutdown`: การแจ้งเตือนการปิด gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตของการจับคู่ node
- `node.invoke.request`: การกระจายคำขอ node invoke
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตของ paired-device
- `voicewake.changed`: การกำหนดค่า wake-word trigger เปลี่ยน
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตของ
  exec approval
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตของ
  plugin approval

### Node helper methods

- Nodes สามารถเรียก `skills.bins` เพื่อดึงรายการล่าสุดของ skill executables
  สำหรับการตรวจสอบ auto-allow

### Operator helper methods

- Operators สามารถเรียก `commands.list` (`operator.read`) เพื่อดึงคลังคำสั่งของรันไทม์
  สำหรับเอเจนต์
  - `agentId` เป็นแบบไม่บังคับ; หากละไว้จะอ่าน workspace ของเอเจนต์เริ่มต้น
  - `scope` ควบคุมว่าพื้นผิวใดที่ `name` หลักจะชี้ไป:
    - `text` จะคืนค่า text command token หลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางเริ่มต้น `both` จะคืนค่า native names ที่รับรู้ provider
      เมื่อมี
  - `textAliases` มี slash aliases แบบตรงตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่ง native ที่รับรู้ provider เมื่อมีอยู่
  - `provider` เป็นแบบไม่บังคับ และมีผลเฉพาะกับการตั้งชื่อ native และความพร้อมใช้งานของ native plugin command
  - `includeArgs=false` จะละ serialized argument metadata ออกจากคำตอบ
- Operators สามารถเรียก `tools.catalog` (`operator.read`) เพื่อดึงคลังเครื่องมือของรันไทม์สำหรับ
  เอเจนต์ โดยคำตอบจะมีเครื่องมือที่จัดกลุ่มไว้และ provenance metadata:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: ระบุว่าเครื่องมือของ Plugin เป็นแบบ optional หรือไม่
- Operators สามารถเรียก `tools.effective` (`operator.read`) เพื่อดึงคลังเครื่องมือที่มีผลจริงของรันไทม์
  สำหรับเซสชัน
  - `sessionKey` เป็นฟิลด์บังคับ
  - gateway จะอนุมาน trusted runtime context จากฝั่งเซิร์ฟเวอร์ตามเซสชัน แทนการรับ
    auth หรือ delivery context ที่ผู้เรียกส่งมา
  - คำตอบมีขอบเขตตามเซสชัน และสะท้อนสิ่งที่การสนทนาที่กำลังใช้งานสามารถใช้ได้ในตอนนี้
    รวมถึงเครื่องมือของ core, Plugin และ channel
- Operators สามารถเรียก `skills.status` (`operator.read`) เพื่อดึงคลัง Skills ที่มองเห็นได้
  สำหรับเอเจนต์
  - `agentId` เป็นแบบไม่บังคับ; หากละไว้จะอ่าน workspace ของเอเจนต์เริ่มต้น
  - คำตอบจะรวมสถานะการเข้าเกณฑ์ ข้อกำหนดที่ขาด การตรวจสอบ config และ
    install options ที่ผ่านการทำให้ปลอดภัยแล้ว โดยไม่เปิดเผยค่าลับดิบ
- Operators สามารถเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ
  metadata การค้นพบจาก ClawHub
- Operators สามารถเรียก `skills.install` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้ง
    โฟลเดอร์ skill ลงในไดเรกทอรี `skills/` ของ workspace เอเจนต์เริ่มต้น
  - โหมด Gateway installer: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    รัน action `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ gateway
- Operators สามารถเรียก `skills.update` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub จะอัปเดต slug ที่ติดตามอยู่หนึ่งรายการ หรืออัปเดต ClawHub installs ทั้งหมดที่ติดตามอยู่ใน
    workspace ของเอเจนต์เริ่มต้น
  - โหมด Config จะ patch ค่าใน `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

## Exec approvals

- เมื่อคำขอ exec ต้องการการอนุมัติ gateway จะกระจาย `exec.approval.requested`
- ไคลเอนต์ operator จะทำการ resolve โดยเรียก `exec.approval.resolve` (ต้องใช้ `operator.approvals` scope)
- สำหรับ `host=node`, `exec.approval.request` ต้องมี `systemRunPlan` (ข้อมูลมาตรฐานของ `argv`/`cwd`/`rawCommand`/metadata ของเซสชัน) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังจากอนุมัติแล้ว การเรียก `node.invoke system.run` ที่ถูกส่งต่อจะใช้
  `systemRunPlan` แบบ canonical นั้นซ้ำในฐานะบริบทของ command/cwd/session ที่เชื่อถือได้
- หากผู้เรียกแก้ไข `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่าง prepare กับการส่ง `system.run` ที่ได้รับอนุมัติขั้นสุดท้าย
  gateway จะปฏิเสธการรัน แทนที่จะเชื่อ payload ที่ถูกแก้ไขนั้น

## Agent delivery fallback

- คำขอ `agent` สามารถมี `deliver=true` เพื่อร้องขอการส่งออกภายนอก
- `bestEffortDeliver=false` จะคงพฤติกรรมแบบเข้มงวด: เป้าหมายการส่งที่ resolve ไม่ได้หรือส่งได้เฉพาะภายในจะคืนค่า `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback ไปสู่การทำงานในเซสชันเท่านั้น เมื่อไม่สามารถ resolve เส้นทางการส่งภายนอกได้ (เช่น เซสชันภายใน/webchat หรือ config แบบหลายช่องทางที่กำกวม)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema/protocol-schemas.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์จะปฏิเสธเมื่อไม่ตรงกัน
- schemas + models ถูกสร้างจาก TypeBox definitions:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

reference client ใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ โดยค่าเหล่านี้
คงที่ตลอด protocol v3 และเป็น baseline ที่คาดหวังสำหรับไคลเอนต์ภายนอกบุคคลที่สาม

| ค่าคงที่                                  | ค่าเริ่มต้น                                            | แหล่งที่มา                                                  |
| ----------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                    | `src/gateway/protocol/schema/protocol-schemas.ts`           |
| ระยะหมดเวลาของคำขอ (ต่อ RPC)             | `30_000` ms                                            | `src/gateway/client.ts` (`requestTimeoutMs`)                |
| ระยะหมดเวลา preauth / connect-challenge   | `10_000` ms                                            | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`)  |
| ค่า backoff เริ่มต้นสำหรับ reconnect      | `1_000` ms                                             | `src/gateway/client.ts` (`backoffMs`)                       |
| ค่า backoff สูงสุดสำหรับ reconnect        | `30_000` ms                                            | `src/gateway/client.ts` (`scheduleReconnect`)               |
| ค่า clamp สำหรับ fast-retry หลัง device-token close | `250` ms                                       | `src/gateway/client.ts`                                     |
| ระยะผ่อนผันก่อนบังคับหยุดด้วย `terminate()` | `250` ms                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                             |
| ระยะหมดเวลาเริ่มต้นของ `stopAndWait()`    | `1_000` ms                                             | `STOP_AND_WAIT_TIMEOUT_MS`                                  |
| ช่วง tick เริ่มต้น (ก่อน `hello-ok`)      | `30_000` ms                                            | `src/gateway/client.ts`                                     |
| การปิดเมื่อ tick timeout                  | โค้ด `4000` เมื่อไม่มีสัญญาณเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                     |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                             | `src/gateway/server-constants.ts`                           |

เซิร์ฟเวอร์จะประกาศค่าที่มีผลจริงของ `policy.tickIntervalMs`, `policy.maxPayload`
และ `policy.maxBufferedBytes` ใน `hello-ok`; ไคลเอนต์ควรยึดค่าดังกล่าว
แทนค่าเริ่มต้นก่อน handshake

## การยืนยันตัวตน

- การยืนยันตัวตนของ gateway แบบ shared-secret ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ขึ้นอยู่กับโหมด auth ที่กำหนดไว้
- โหมดที่มีตัวตนกำกับ เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ `gateway.auth.mode: "trusted-proxy"`
  ที่ไม่ใช่ loopback จะผ่านการตรวจสอบ auth ของ connect จาก
  request headers แทน `connect.params.auth.*`
- `gateway.auth.mode: "none"` สำหรับ private-ingress จะข้าม shared-secret connect auth
  โดยสิ้นเชิง; อย่านำโหมดนี้ไปเปิดบน ingress สาธารณะหรือไม่น่าเชื่อถือ
- หลังจากจับคู่แล้ว Gateway จะออก **device token** ที่ถูกกำหนดขอบเขตตาม
  role + scopes ของการเชื่อมต่อ โดยจะส่งกลับใน `hello-ok.auth.deviceToken`
  และไคลเอนต์ควรบันทึกไว้สำหรับการเชื่อมต่อครั้งต่อไป
- ไคลเอนต์ควรบันทึก `hello-ok.auth.deviceToken` หลักหลังจาก
  การเชื่อมต่อที่สำเร็จทุกครั้ง
- เมื่อต่อใหม่ด้วย device token ที่ **จัดเก็บไว้** ไว้นั้น ก็ควรใช้ชุด scope
  ที่ได้รับอนุมัติและเก็บไว้สำหรับ token นั้นด้วย ซึ่งช่วยคงการเข้าถึงแบบ
  read/probe/status ที่เคยได้รับอนุญาตไว้แล้ว และหลีกเลี่ยงไม่ให้การเชื่อมต่อใหม่
  หดลงอย่างเงียบ ๆ เป็น implicit admin-only scope ที่แคบกว่า
- การประกอบ connect auth ฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระและจะถูกส่งต่อเสมอเมื่อมีการตั้งค่า
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: explicit shared token ก่อน,
    ตามด้วย explicit `deviceToken`, แล้วจึงเป็น stored per-device token (คีย์ตาม
    `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อไม่มีรายการข้างต้นใด resolve เป็น
    `auth.token` ได้ shared token หรือ device token ที่ resolve ได้ใด ๆ จะยับยั้งมัน
  - การ auto-promote stored device token บนการ retry แบบ one-shot ของ
    `AUTH_TOKEN_MISMATCH` ถูกจำกัดไว้เฉพาะ **trusted endpoints** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบ pinned เท่านั้น `wss://` สาธารณะ
    ที่ไม่มี pinning จะไม่เข้าเกณฑ์
- รายการเพิ่มเติมใน `hello-ok.auth.deviceTokens` คือ bootstrap handoff tokens
  ให้บันทึกเฉพาะเมื่อการเชื่อมต่อใช้ bootstrap auth บนทรานสปอร์ตที่เชื่อถือได้
  เช่น `wss://` หรือ loopback/local pairing
- หากไคลเอนต์ส่ง **explicit** `deviceToken` หรือ `scopes` แบบชัดเจน
  ชุด scope ที่ผู้เรียกร้องขอมานั้นจะยังคงเป็นข้อมูลอ้างอิงหลัก; scopes ที่แคชไว้
  จะถูกนำกลับมาใช้ก็ต่อเมื่อไคลเอนต์ใช้ stored per-device token ซ้ำเท่านั้น
- device tokens สามารถหมุนเวียน/เพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องใช้ `operator.pairing` scope)
- การออก token การหมุนเวียน และการเพิกถอน จะยังคงถูกจำกัดตามชุด role ที่ได้รับอนุมัติ
  ซึ่งถูกบันทึกไว้ใน pairing entry ของอุปกรณ์นั้น; การเปลี่ยน token ไม่สามารถขยาย
  หรือกำหนดเป้าหมาย role ของอุปกรณ์ที่ pairing approval ไม่เคยอนุมัติได้
- สำหรับเซสชัน paired-device token การจัดการอุปกรณ์จะมีขอบเขตที่ตัวเอง เว้นแต่
  ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ admin จะสามารถ remove/revoke/rotate
  ได้เฉพาะรายการอุปกรณ์ของ **ตัวเอง** เท่านั้น
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุด scope ของ operator token เป้าหมาย
  เทียบกับ scopes ของเซสชันปัจจุบันของผู้เรียกด้วย ผู้เรียกที่ไม่ใช่ admin
  จะไม่สามารถหมุนเวียนหรือเพิกถอน operator token ที่กว้างกว่าสิ่งที่ตนมีอยู่แล้วได้
- ความล้มเหลวของ auth จะมี `error.details.code` พร้อม recovery hints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมของไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลอง retry แบบมีขอบเขตหนึ่งครั้งด้วย cached per-device token
  - หาก retry นั้นล้มเหลว ไคลเอนต์ควรหยุด automatic reconnect loops และแสดงคำแนะนำให้ผู้ปฏิบัติงานดำเนินการ

## ตัวตนอุปกรณ์ + การจับคู่

- Nodes ควรมีตัวตนอุปกรณ์ที่คงที่ (`device.id`) ซึ่งได้มาจาก
  fingerprint ของ keypair
- Gateways จะออก tokens ต่ออุปกรณ์ + role
- ต้องมีการอนุมัติ pairing สำหรับ device IDs ใหม่ เว้นแต่จะเปิดใช้ local auto-approval
- pairing auto-approval มีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local แบบแคบ
  สำหรับ trusted shared-secret helper flows
- การเชื่อมต่อ tailnet หรือ LAN บนโฮสต์เดียวกันยังคงถูกมองว่าเป็น remote สำหรับ pairing และ
  ต้องได้รับการอนุมัติ
- โดยปกติไคลเอนต์ WS จะรวมตัวตน `device` ระหว่าง `connect` (ทั้ง operator +
  node) ข้อยกเว้นของ operator ที่ไม่มี device มีเฉพาะเส้นทางเชื่อถือได้แบบ explicit:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ insecure HTTP ที่ใช้ localhost เท่านั้น
  - การยืนยันตัวตน operator ของ Control UI ที่สำเร็จภายใต้ `gateway.auth.mode: "trusted-proxy"`
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
  - backend RPCs แบบ `gateway-client` ที่เป็น direct-loopback และยืนยันตัวตนด้วย
    gateway token/password ที่ใช้ร่วมกัน
- ทุกการเชื่อมต่อต้องลงนาม nonce ของ `connect.challenge` ที่เซิร์ฟเวอร์ให้มา

### diagnostics สำหรับการย้ายระบบ device auth

สำหรับไคลเอนต์รุ่นเก่าที่ยังใช้พฤติกรรมการลงนามก่อน challenge `connect` จะคืนค่า
detail codes แบบ `DEVICE_AUTH_*` ภายใต้ `error.details.code` พร้อม `error.details.reason` ที่คงที่

ความล้มเหลวระหว่างการย้ายระบบที่พบบ่อย:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                           |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ไม่ได้ส่ง `device.nonce` (หรือส่งค่าว่าง) |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่าหรือผิด            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ของลายเซ็นไม่ตรงกับ payload v2           |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอกขอบเขต skew ที่อนุญาต   |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key  |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/การทำ canonicalization ของ public key ล้มเหลว |

เป้าหมายของการย้ายระบบ:

- รอ `connect.challenge` เสมอ
- ลงนาม payload v2 ที่มี server nonce อยู่ด้วย
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload ของลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` แบบ legacy ยังคงยอมรับได้เพื่อความเข้ากันได้ แต่การตรึง metadata ของ paired-device
  ยังคงควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + pinning

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์สามารถ pin fingerprint ของใบรับรอง gateway ได้แบบเลือกได้ (ดู config `gateway.tls`
  พร้อม `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **API ของ gateway ทั้งหมด** (status, channels, models, chat,
agent, sessions, nodes, approvals และอื่น ๆ) โดยพื้นผิวที่แน่นอนถูกกำหนดโดย
TypeBox schemas ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
