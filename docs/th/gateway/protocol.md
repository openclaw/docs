---
read_when:
    - การติดตั้งใช้งานหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - การสร้าง schema/models ของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การจับมือ เฟรม และการกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-04-25T13:49:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

โปรโตคอล WS ของ Gateway คือ **control plane + node transport แบบหนึ่งเดียว** สำหรับ
OpenClaw ไคลเอนต์ทั้งหมด (CLI, web UI, แอป macOS, nodes บน iOS/Android,
headless nodes) จะเชื่อมต่อผ่าน WebSocket และประกาศ **role** + **scope** ของตนในขณะ
handshake

## การขนส่ง

- WebSocket, text frames พร้อม JSON payloads
- เฟรมแรก **ต้อง** เป็นคำขอ `connect`
- เฟรมก่อนการเชื่อมต่อถูกจำกัดไว้ที่ 64 KiB หลังจาก handshake สำเร็จแล้ว ไคลเอนต์
  ควรปฏิบัติตามขีดจำกัด `hello-ok.policy.maxPayload` และ
  `hello-ok.policy.maxBufferedBytes` เมื่อเปิดใช้การวินิจฉัย
  เฟรมขาเข้าที่ใหญ่เกินไปและบัฟเฟอร์ขาออกที่ช้าจะปล่อย events `payload.large`
  ก่อนที่ gateway จะปิดหรือตัดเฟรมที่ได้รับผลกระทบ events เหล่านี้จะเก็บ
  ขนาด ขีดจำกัด surfaces และ reason codes ที่ปลอดภัย โดยจะไม่เก็บเนื้อความของข้อความ
  เนื้อหาไฟล์แนบ raw frame body โทเค็น cookies หรือค่าความลับ

## Handshake (`connect`)

Gateway → ไคลเอนต์ (pre-connect challenge):

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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` และ `policy` ล้วนเป็นฟิลด์บังคับตาม schema
(`src/gateway/protocol/schema/frames.ts`) ส่วน `canvasHostUrl` เป็นฟิลด์ไม่บังคับ `auth`
จะรายงาน role/scopes ที่เจรจาตกลงกันเมื่อมีให้ใช้ และจะรวม `deviceToken`
เมื่อ gateway ออกโทเค็นดังกล่าวให้

เมื่อไม่มีการออก device token, `hello-ok.auth` ก็ยังสามารถรายงาน
permissions ที่เจรจาตกลงกันได้:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

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

ระหว่าง trusted bootstrap handoff, `hello-ok.auth` อาจรวมรายการ role เพิ่มเติมแบบมีขอบเขตใน `deviceTokens` ด้วย:

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

สำหรับโฟลว์ bootstrap ของ node/operator ที่มาพร้อมระบบ primary node token จะยังคงเป็น
`scopes: []` และ operator token ที่ถูกส่งมอบจะยังคงถูกจำกัดไว้ตาม bootstrap
operator allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) การตรวจสอบ scope ระหว่าง bootstrap ยังคงยึดตาม
role prefix: รายการ operator จะตอบสนองได้เฉพาะคำขอของ operator เท่านั้น และ roles ที่ไม่ใช่ operator
ยังคงต้องมี scopes ภายใต้ role prefix ของตนเอง

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

scopes ทั่วไป:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` ที่ใช้ `includeSecrets: true` ต้องมี `operator.talk.secrets`
(หรือ `operator.admin`)

เมธอด Gateway RPC ที่ลงทะเบียนโดย Plugin สามารถร้องขอ operator scope ของตัวเองได้ แต่
core admin prefixes ที่สงวนไว้ (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) จะ resolve เป็น `operator.admin` เสมอ

scope ของเมธอดเป็นเพียงด่านแรกเท่านั้น slash commands บางตัวที่เข้าถึงผ่าน
`chat.send` จะมีการตรวจสอบระดับคำสั่งที่เข้มงวดกว่านั้นอีก ตัวอย่างเช่น การเขียนถาวรผ่าน
`/config set` และ `/config unset` ต้องใช้ `operator.admin`

`node.pair.approve` ยังมีการตรวจสอบ scope เพิ่มเติมในตอนอนุมัติ นอกเหนือจาก
scope พื้นฐานของเมธอด:

- คำขอที่ไม่มีคำสั่ง: `operator.pairing`
- คำขอที่มี node commands ที่ไม่ใช่ exec: `operator.pairing` + `operator.write`
- คำขอที่รวม `system.run`, `system.run.prepare` หรือ `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes จะประกาศการอ้างสิทธิ์ความสามารถตอนเชื่อมต่อ:

- `caps`: หมวดหมู่ความสามารถระดับสูง
- `commands`: allowlist ของคำสั่งสำหรับการ invoke
- `permissions`: toggles แบบละเอียด (เช่น `screen.record`, `camera.capture`)

Gateway จะถือว่าสิ่งเหล่านี้เป็น **claims** และบังคับใช้ allowlists ฝั่งเซิร์ฟเวอร์

## Presence

- `system-presence` คืนค่ารายการที่จัดคีย์ตามอัตลักษณ์ของอุปกรณ์
- รายการ presence จะมี `deviceId`, `roles` และ `scopes` เพื่อให้ UI แสดงหนึ่งแถวต่อหนึ่งอุปกรณ์ได้
  แม้ว่าอุปกรณ์นั้นจะเชื่อมต่อทั้งในบทบาท **operator** และ **node**

## การจำกัดขอบเขตของ broadcast events

WebSocket broadcast events ที่เซิร์ฟเวอร์พุชออกไปจะถูกจำกัดตาม scope เพื่อไม่ให้เซสชันที่มีเพียง pairing-scope หรือเป็น node-only ได้รับเนื้อหาเซสชันแบบพาสซีฟ

- **เฟรม chat, agent และ tool-result** (รวมถึง `agent` events ที่สตรีมและผลลัพธ์ tool call) ต้องมีอย่างน้อย `operator.read` เซสชันที่ไม่มี `operator.read` จะข้ามเฟรมเหล่านี้ทั้งหมด
- **broadcasts `plugin.*` ที่ Plugin กำหนด** จะถูกจำกัดไปที่ `operator.write` หรือ `operator.admin` ตามที่ Plugin ลงทะเบียนไว้
- **status และ transport events** (`heartbeat`, `presence`, `tick`, วงจรชีวิต connect/disconnect เป็นต้น) ยังคงไม่ถูกจำกัด เพื่อให้ทุกเซสชันที่ยืนยันตัวตนแล้วสามารถสังเกตสุขภาพของการขนส่งได้
- **ตระกูล broadcast event ที่ไม่รู้จัก** จะถูกจำกัดตาม scope เป็นค่าเริ่มต้น (fail-closed) เว้นแต่ handler ที่ลงทะเบียนไว้จะผ่อนคลายข้อกำหนดนั้นอย่างชัดเจน

การเชื่อมต่อของไคลเอนต์แต่ละตัวจะเก็บหมายเลขลำดับต่อไคลเอนต์ของตนเอง เพื่อให้ broadcasts ยังคงลำดับแบบเพิ่มขึ้นบน socket นั้น แม้ไคลเอนต์แต่ละตัวจะเห็นสับเซตของสตรีม event ที่ผ่านการกรองด้วย scope แตกต่างกันก็ตาม

## ตระกูล RPC methods ที่ใช้บ่อย

พื้นผิว WS สาธารณะกว้างกว่าตัวอย่าง handshake/auth ด้านบน นี่ไม่ใช่
dump ที่สร้างขึ้นอัตโนมัติ — `hello-ok.features.methods` เป็นรายการค้นหาแบบอนุรักษ์นิยม
ที่สร้างจาก `src/gateway/server-methods-list.ts` พร้อม exports ของเมธอดจาก
plugin/channel ที่โหลดแล้ว ให้ถือว่านี่เป็นการค้นหาความสามารถ ไม่ใช่รายการเต็มของ
`src/gateway/server-methods/*.ts`

<AccordionGroup>
  <Accordion title="System และ identity">
    - `health` คืนค่า cached หรือ freshly probed gateway health snapshot
    - `diagnostics.stability` คืนค่า bounded diagnostic stability recorder ล่าสุด โดยจะเก็บข้อมูลเมตาการปฏิบัติงาน เช่น ชื่อ event, จำนวน, ขนาดไบต์, ค่าหน่วยความจำ, สถานะคิว/เซสชัน, ชื่อแชนเนล/Plugin และ session ids โดยจะไม่เก็บข้อความแชต, webhook bodies, ผลลัพธ์ของเครื่องมือ, raw request หรือ response bodies, โทเค็น, cookies หรือค่าความลับ ต้องใช้ operator read scope
    - `status` คืนค่าสรุป gateway แบบ `/status`; ฟิลด์ที่อ่อนไหวจะรวมมาด้วยเฉพาะสำหรับไคลเอนต์ operator ที่มี admin scope
    - `gateway.identity.get` คืนค่า identity ของอุปกรณ์ gateway ที่ใช้โดย relay และ pairing flows
    - `system-presence` คืนค่า presence snapshot ปัจจุบันสำหรับอุปกรณ์ operator/node ที่เชื่อมต่ออยู่
    - `system-event` ผนวก system event และสามารถอัปเดต/กระจายบริบท presence ได้
    - `last-heartbeat` คืนค่า heartbeat event ล่าสุดที่ถูกบันทึกไว้
    - `set-heartbeats` เปิดหรือปิดการประมวลผล Heartbeat บน gateway
  </Accordion>

  <Accordion title="Models และการใช้งาน">
    - `models.list` คืนค่า model catalog ที่อนุญาตในรันไทม์
    - `usage.status` คืนค่าสรุปหน้าต่างการใช้งาน/โควตาคงเหลือของ provider
    - `usage.cost` คืนค่าสรุปการใช้งานต้นทุนแบบรวมสำหรับช่วงวันที่
    - `doctor.memory.status` คืนค่าความพร้อมของ vector-memory / embeddings สำหรับ workspace ของเอเจนต์ค่าเริ่มต้นที่ใช้งานอยู่
    - `sessions.usage` คืนค่าสรุปการใช้งานรายเซสชัน
    - `sessions.usage.timeseries` คืนค่า timeseries ของการใช้งานสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` คืนรายการ usage logs สำหรับหนึ่งเซสชัน
  </Accordion>

  <Accordion title="Channels และตัวช่วยสำหรับการล็อกอิน">
    - `channels.status` คืนค่าสรุปสถานะของแชนเนล/plugins แบบ built-in + bundled
    - `channels.logout` ออกจากระบบของแชนเนล/บัญชีที่ระบุ เมื่อแชนเนลนั้นรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์การล็อกอินแบบ QR/web สำหรับ provider แชนเนลเว็บที่รองรับ QR ที่กำลังใช้งาน
    - `web.login.wait` รอให้โฟลว์การล็อกอินแบบ QR/web นั้นเสร็จสิ้น และเริ่มแชนเนลเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง iOS node ที่ลงทะเบียนไว้
    - `voicewake.get` คืนค่า wake-word triggers ที่จัดเก็บไว้
    - `voicewake.set` อัปเดต wake-word triggers และกระจายการเปลี่ยนแปลง
  </Accordion>

  <Accordion title="Messaging และบันทึก">
    - `send` คือ RPC สำหรับการส่งขาออกโดยตรงไปยัง channel/account/thread target นอก chat runner
    - `logs.tail` คืนค่า tail ของไฟล์บันทึก gateway ที่กำหนดไว้ พร้อมตัวควบคุม cursor/limit และ max-byte
  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.config` คืนค่า effective Talk config payload; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.mode` ตั้งค่า/กระจายสถานะ Talk mode ปัจจุบันให้กับไคลเอนต์ WebChat/Control UI
    - `talk.speak` สังเคราะห์เสียงผ่าน provider เสียงของ Talk ที่กำลังใช้งาน
    - `tts.status` คืนค่าสถานะการเปิดใช้ TTS, provider ที่กำลังใช้งาน, fallback providers และสถานะ config ของ provider
    - `tts.providers` คืนรายการ inventory ของ TTS providers ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะ prefs ของ TTS
    - `tts.setProvider` อัปเดต provider TTS ที่ต้องการ
    - `tts.convert` รันการแปลงข้อความเป็นเสียงแบบครั้งเดียว
  </Accordion>

  <Accordion title="ความลับ config การอัปเดต และ wizard">
    - `secrets.reload` จะ resolve SecretRefs ที่ใช้งานอยู่ใหม่ และสลับสถานะความลับของรันไทม์ก็ต่อเมื่อสำเร็จครบทั้งหมดเท่านั้น
    - `secrets.resolve` จะ resolve การกำหนดค่าความลับสำหรับคำสั่งเป้าหมายสำหรับชุดคำสั่ง/เป้าหมายที่ระบุ
    - `config.get` คืนค่า config snapshot ปัจจุบันและ hash
    - `config.set` เขียน payload config ที่ผ่านการตรวจสอบแล้ว
    - `config.patch` ผสานการอัปเดต config บางส่วน
    - `config.apply` ตรวจสอบ + แทนที่ payload config ทั้งหมด
    - `config.schema` คืนค่า payload schema ของ config แบบสดที่ใช้โดย Control UI และเครื่องมือ CLI: schema, `uiHints`, เวอร์ชัน และข้อมูลเมตาการสร้าง รวมถึงข้อมูลเมตา schema ของ plugin + channel เมื่อรันไทม์สามารถโหลดได้ schema นี้รวมข้อมูลเมตา `title` / `description` ของฟิลด์ซึ่งได้มาจาก labels และข้อความช่วยเหลือชุดเดียวกับที่ UI ใช้ รวมถึงสาขา nested object, wildcard, array-item และองค์ประกอบ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารประกอบฟิลด์ที่ตรงกัน
    - `config.schema.lookup` คืนค่า payload การค้นหาแบบจำกัดตาม path สำหรับหนึ่ง config path: normalized path, shallow schema node, hint ที่ตรงกัน + `hintPath` และสรุปลูกโดยตรงสำหรับการเจาะลึกใน UI/CLI lookup schema nodes จะคงเอกสารแบบที่ผู้ใช้เห็นและฟิลด์การตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขตตัวเลข/สตริง/อาร์เรย์/ออบเจ็กต์ และแฟล็กอย่าง `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกจะแสดง `key`, `path` ที่ normalized แล้ว, `type`, `required`, `hasChildren` พร้อมทั้ง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` รันโฟลว์อัปเดต gateway และกำหนดเวลาการรีสตาร์ตก็ต่อเมื่อการอัปเดตสำเร็จเท่านั้น
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผย onboarding wizard ผ่าน WS RPC
  </Accordion>

  <Accordion title="ตัวช่วยสำหรับเอเจนต์และ workspace">
    - `agents.list` คืนค่ารายการเอเจนต์ที่กำหนดค่าไว้
    - `agents.create`, `agents.update` และ `agents.delete` จัดการระเบียนเอเจนต์และการเชื่อมต่อกับ workspace
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการไฟล์ bootstrap workspace ที่เปิดเผยสำหรับเอเจนต์
    - `agent.identity.get` คืนค่า identity ของผู้ช่วยที่มีผลจริงสำหรับเอเจนต์หรือเซสชัน
    - `agent.wait` รอให้การรันเสร็จสิ้นและคืนค่า terminal snapshot เมื่อมี
  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` คืนค่า session index ปัจจุบัน
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับ session change events สำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับ transcript/message events สำหรับหนึ่งเซสชัน
    - `sessions.preview` คืนค่า transcript previews แบบมีขอบเขตสำหรับ session keys ที่ระบุ
    - `sessions.resolve` resolve หรือ canonicalize เป้าหมายเซสชัน
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปในเซสชันที่มีอยู่
    - `sessions.steer` เป็นรูปแบบ interrupt-and-steer สำหรับเซสชันที่กำลังทำงาน
    - `sessions.abort` ยกเลิกงานที่กำลังทำอยู่ของเซสชัน
    - `sessions.patch` อัปเดตข้อมูลเมตา/overrides ของเซสชัน
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ทำงานบำรุงรักษาเซสชัน
    - `sessions.get` คืนค่าแถวเซสชันที่จัดเก็บไว้แบบเต็ม
    - การประมวลผลแชตยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` โดย `chat.history` ถูก normalize เพื่อการแสดงผลสำหรับไคลเอนต์ UI: inline directive tags จะถูกตัดออกจากข้อความที่มองเห็น, plain-text XML payloads ของ tool-call (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อก tool-call ที่ถูกตัดทอน) และ model control tokens แบบ ASCII/full-width ที่รั่วออกมาจะถูกลบออก, แถว assistant ที่มีเฉพาะ silent-token เช่น `NO_REPLY` / `no_reply` แบบตรงตัวจะถูกละไว้ และแถวที่มีขนาดใหญ่เกินไปอาจถูกแทนที่ด้วย placeholders
  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และ device tokens">
    - `device.pair.list` คืนค่ารายการอุปกรณ์ที่จับคู่ไว้ซึ่งกำลังรออนุมัติและที่ได้รับอนุมัติแล้ว
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` หมุน device token ของอุปกรณ์ที่จับคู่แล้วภายในขอบเขต role และ scope ที่ได้รับอนุมัติ
    - `device.token.revoke` เพิกถอน device token ของอุปกรณ์ที่จับคู่แล้ว
  </Accordion>

  <Accordion title="การจับคู่ node การ invoke และงานที่รอดำเนินการ">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` และ `node.pair.verify` ครอบคลุมการจับคู่ node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` คืนค่าสถานะ node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายชื่อของ node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง node ที่เชื่อมต่ออยู่
    - `node.invoke.result` คืนค่าผลลัพธ์สำหรับคำขอ invoke
    - `node.event` นำ events ที่มาจาก node กลับเข้าสู่ gateway
    - `node.canvas.capability.refresh` รีเฟรช scoped canvas-capability tokens
    - `node.pending.pull` และ `node.pending.ack` คือ APIs ของคิวสำหรับ node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานที่รอดำเนินการแบบคงทนสำหรับ nodes ที่ออฟไลน์/ตัดการเชื่อมต่อ
  </Accordion>

  <Accordion title="ตระกูลการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว พร้อมทั้งการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการตัดสินใจของ exec approval ที่รอดำเนินการหนึ่งรายการ และคืนค่าการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการ snapshots ของนโยบายการอนุมัติ exec ของ gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec ภายใน node ผ่านคำสั่ง node relay
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่ Plugin กำหนด
  </Accordion>

  <Accordion title="Automation, Skills และ tools">
    - Automation: `wake` กำหนดเวลาการ inject ข้อความปลุกให้ทำงานทันทีหรือใน Heartbeat รอบถัดไป; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานตามกำหนดเวลา
    - Skills และ tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`
  </Accordion>
</AccordionGroup>

### ตระกูล events ที่ใช้บ่อย

- `chat`: การอัปเดตแชตของ UI เช่น `chat.inject` และ transcript-only chat
  events อื่น ๆ
- `session.message` และ `session.tool`: การอัปเดต transcript/event-stream สำหรับ
  เซสชันที่สมัครรับข้อมูลอยู่
- `sessions.changed`: session index หรือข้อมูลเมตาเปลี่ยนแปลง
- `presence`: การอัปเดต system presence snapshot
- `tick`: keepalive / liveness event แบบเป็นระยะ
- `health`: การอัปเดต gateway health snapshot
- `heartbeat`: การอัปเดตสตรีม Heartbeat event
- `cron`: event การเปลี่ยนแปลงของ cron run/job
- `shutdown`: การแจ้งเตือนการปิด gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตของการจับคู่ node
- `node.invoke.request`: การกระจายคำขอ node invoke
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตของ paired-device
- `voicewake.changed`: config ของ wake-word trigger เปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตของการอนุมัติ
  exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตของการอนุมัติ Plugin

### Node helper methods

- Nodes สามารถเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของไฟล์ปฏิบัติการ Skill
  สำหรับการตรวจสอบ auto-allow

### Operator helper methods

- Operators สามารถเรียก `commands.list` (`operator.read`) เพื่อดึง runtime
  command inventory สำหรับเอเจนต์
  - `agentId` เป็นค่าทางเลือก; ไม่ต้องระบุก็ได้เพื่ออ่าน default agent workspace
  - `scope` ควบคุมว่าค่า `name` หลักจะชี้ไปยังพื้นผิวใด:
    - `text` คืนค่าโทเค็น text command หลักโดยไม่มี `/` นำหน้า
    - `native` และเส้นทางค่าเริ่มต้น `both` คืนค่า native names ที่รับรู้ provider
      เมื่อมี
  - `textAliases` มี slash aliases แบบตรงตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่งแบบ native ที่รับรู้ provider เมื่อมี
  - `provider` เป็นค่าทางเลือกและมีผลเฉพาะกับการตั้งชื่อแบบ native พร้อมทั้งความพร้อมใช้งานของ native plugin
    command เท่านั้น
  - `includeArgs=false` จะไม่รวมข้อมูลเมตาของอาร์กิวเมนต์ที่ serialize แล้วในคำตอบ
- Operators สามารถเรียก `tools.catalog` (`operator.read`) เพื่อดึง runtime tool catalog สำหรับ
  เอเจนต์ คำตอบจะรวม tools ที่จัดเป็นกลุ่มและข้อมูลเมตาแหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: whether a plugin tool is optional
- Operators สามารถเรียก `tools.effective` (`operator.read`) เพื่อดึง runtime-effective tool
  inventory สำหรับเซสชัน
  - `sessionKey` เป็นค่าบังคับ
  - gateway จะอนุมาน trusted runtime context จากเซสชันฝั่งเซิร์ฟเวอร์แทนการรับ
    auth หรือ delivery context ที่ผู้เรียกส่งมา
  - คำตอบถูกจำกัดตามเซสชันและสะท้อนสิ่งที่บทสนทนาที่กำลังใช้งานสามารถใช้ได้ในขณะนี้
    รวมถึง core, Plugin และ channel tools
- Operators สามารถเรียก `skills.status` (`operator.read`) เพื่อดึง visible
  skill inventory สำหรับเอเจนต์
  - `agentId` เป็นค่าทางเลือก; ไม่ต้องระบุก็ได้เพื่ออ่าน default agent workspace
  - คำตอบจะรวม eligibility, ข้อกำหนดที่ขาดหายไป, การตรวจสอบ config และ
    install options ที่ผ่านการทำให้ปลอดภัยโดยไม่เปิดเผยค่าความลับดิบ
- Operators สามารถเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับ
  ข้อมูลเมตาการค้นพบของ ClawHub
- Operators สามารถเรียก `skills.install` (`operator.admin`) ได้ 2 โหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้ง
    โฟลเดอร์ Skill ลงในไดเรกทอรี `skills/` ของ default agent workspace
  - โหมดติดตั้งผ่าน gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    รันแอ็กชัน `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ gateway
- Operators สามารถเรียก `skills.update` (`operator.admin`) ได้ 2 โหมด:
  - โหมด ClawHub จะอัปเดตหนึ่ง tracked slug หรือ tracked ClawHub installs ทั้งหมดใน
    default agent workspace
  - โหมด Config จะ patch ค่า `skills.entries.<skillKey>` เช่น `enabled`,
    `apiKey` และ `env`

## การอนุมัติ exec

- เมื่อคำขอ exec ต้องการการอนุมัติ gateway จะกระจาย `exec.approval.requested`
- ไคลเอนต์ operator จะ resolve ได้โดยเรียก `exec.approval.resolve` (ต้องใช้ `operator.approvals` scope)
- สำหรับ `host=node`, `exec.approval.request` ต้องรวม `systemRunPlan` (canonical `argv`/`cwd`/`rawCommand`/ข้อมูลเมตาเซสชัน) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังการอนุมัติ การส่งต่อ `node.invoke system.run` จะนำ `systemRunPlan` แบบ canonical นั้นกลับมาใช้ซ้ำ
  เป็นบริบทคำสั่ง/cwd/เซสชันที่เชื่อถือได้
- หากผู้เรียกแก้ไข `command`, `rawCommand`, `cwd`, `agentId` หรือ
  `sessionKey` ระหว่าง prepare กับการส่งต่อ `system.run` ที่ได้รับอนุมัติขั้นสุดท้าย
  gateway จะปฏิเสธการรันนั้นแทนที่จะเชื่อ payload ที่ถูกแก้ไข

## fallback การส่งมอบของเอเจนต์

- คำขอ `agent` สามารถรวม `deliver=true` เพื่อร้องขอการส่งมอบขาออกได้
- `bestEffortDeliver=false` จะคงพฤติกรรมแบบเข้มงวด: เป้าหมายการส่งมอบที่ resolve ไม่ได้หรือเป็นภายในเท่านั้นจะคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback ไปยังการรันเฉพาะเซสชันได้เมื่อไม่สามารถ resolve เส้นทางส่งมอบภายนอกได้ (เช่น เซสชันภายใน/webchat หรือ config แบบหลายแชนเนลที่กำกวม)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema/protocol-schemas.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์จะปฏิเสธหากไม่ตรงกัน
- schemas + models ถูกสร้างจาก TypeBox definitions:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

reference client ใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าต่าง ๆ
มีเสถียรภาพตลอด protocol v3 และเป็น baseline ที่คาดหวังสำหรับไคลเอนต์ภายนอก

| ค่าคงที่ | ค่าเริ่มต้น | แหล่งที่มา |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Request timeout (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Preauth / connect-challenge timeout       | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| Initial reconnect backoff                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Max reconnect backoff                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-retry clamp หลัง device-token close | `250` ms                                              | `src/gateway/client.ts`                                    |
| Force-stop grace ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` default timeout           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Default tick interval (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Tick-timeout close                        | code `4000` เมื่อไม่มีสัญญาณเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

เซิร์ฟเวอร์จะโฆษณาค่า `policy.tickIntervalMs`, `policy.maxPayload`
และ `policy.maxBufferedBytes` ที่มีผลจริงใน `hello-ok`; ไคลเอนต์ควรใช้ค่าดังกล่าว
แทนค่าเริ่มต้นก่อน handshake

## Auth

- shared-secret gateway auth ใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ตามโหมด auth ที่กำหนดค่าไว้
- โหมดที่มีการระบุอัตลักษณ์ เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ
  `gateway.auth.mode: "trusted-proxy"` แบบ non-loopback จะผ่านการตรวจสอบ connect auth จาก
  request headers แทน `connect.params.auth.*`
- `gateway.auth.mode: "none"` สำหรับ private-ingress จะข้าม shared-secret connect auth
  ทั้งหมด; อย่านำโหมดนี้ไปเปิดบน ingress สาธารณะ/ที่ไม่น่าเชื่อถือ
- หลังการจับคู่ Gateway จะออก **device token** ที่จำกัดตาม role + scopes
  ของการเชื่อมต่อนั้น โทเค็นนี้จะถูกส่งกลับใน `hello-ok.auth.deviceToken` และไคลเอนต์
  ควรเก็บถาวรไว้เพื่อใช้เชื่อมต่อครั้งถัดไป
- ไคลเอนต์ควรเก็บ `hello-ok.auth.deviceToken` หลักหลังจาก
  เชื่อมต่อสำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วย device token ที่**จัดเก็บไว้**นั้น ควรนำ
  ชุด scope ที่ได้รับอนุมัติซึ่งจัดเก็บไว้สำหรับโทเค็นนั้นกลับมาใช้ซ้ำด้วย วิธีนี้ช่วยคง
  สิทธิ์ read/probe/status ที่เคยได้รับอนุญาตไว้แล้ว และหลีกเลี่ยงการลดระดับการเชื่อมต่อใหม่แบบเงียบ ๆ ไปเป็น
  implicit admin-only scope ที่แคบกว่า
- การประกอบ connect auth ฝั่งไคลเอนต์ (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากกันและจะถูกส่งต่อเสมอเมื่อมีการตั้งค่า
  - `auth.token` จะถูกเติมตามลำดับความสำคัญ: shared token แบบ explicit ก่อน,
    จากนั้น explicit `deviceToken`, แล้วจึง stored per-device token (อิงตาม
    `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อไม่มีสิ่งข้างต้นที่ resolve เป็น
    `auth.token` shared token หรือ device token ใด ๆ ที่ resolve ได้จะระงับมัน
  - การ auto-promotion ของ stored device token ในการ retry แบบ one-shot สำหรับ
    `AUTH_TOKEN_MISMATCH` ถูกจำกัดไว้ที่ **trusted endpoints เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` แบบ pinned `wss://` สาธารณะ
    ที่ไม่มีการ pin จะไม่เข้าเกณฑ์
- รายการ `hello-ok.auth.deviceTokens` เพิ่มเติมคือ bootstrap handoff tokens
  ให้เก็บถาวรเฉพาะเมื่อการเชื่อมต่อใช้ bootstrap auth บน transport ที่เชื่อถือได้
  เช่น `wss://` หรือ loopback/local pairing
- หากไคลเอนต์ส่ง **`deviceToken` แบบ explicit** หรือ `scopes` แบบ explicit ค่า
  scope set ที่ผู้เรียกร้องขอนั้นจะยังคงเป็นตัวหลัก; scopes ที่แคชไว้จะถูกนำกลับมาใช้ซ้ำก็ต่อเมื่อไคลเอนต์กำลังนำ stored per-device token กลับมาใช้ซ้ำเท่านั้น
- device tokens สามารถหมุนเวียน/เพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องใช้ `operator.pairing` scope)
- การออก/หมุนเวียนโทเค็นจะยังถูกจำกัดอยู่ภายในชุด role ที่ได้รับอนุมัติซึ่งบันทึกไว้ใน
  pairing entry ของอุปกรณ์นั้น; การหมุนโทเค็นไม่สามารถขยายอุปกรณ์ไปยัง
  role ที่การอนุมัติ pairing ไม่เคยให้ไว้ได้
- สำหรับเซสชัน paired-device token การจัดการอุปกรณ์จะถูกจำกัดกับตัวเอง เว้นแต่
  ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ admin สามารถ remove/revoke/rotate
  ได้เฉพาะรายการอุปกรณ์ของ**ตัวเอง**เท่านั้น
- `device.token.rotate` ยังตรวจสอบชุด operator scopes ที่ร้องขอเทียบกับ
  scopes ของเซสชันปัจจุบันของผู้เรียก ผู้เรียกที่ไม่ใช่ admin ไม่สามารถหมุนโทเค็นให้เป็น
  operator scope set ที่กว้างกว่าที่ตนมีอยู่แล้วได้
- ความล้มเหลวด้าน auth จะรวม `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมของไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจพยายาม retry แบบมีขอบเขตหนึ่งครั้งด้วย cached per-device token
  - หาก retry นั้นล้มเหลว ไคลเอนต์ควรหยุดลูปการเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำให้โอเปอเรเตอร์ดำเนินการ

## อัตลักษณ์อุปกรณ์ + การจับคู่

- Nodes ควรรวมอัตลักษณ์อุปกรณ์ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  fingerprint ของ keypair
- Gateways จะออกโทเค็นแยกตามอุปกรณ์ + role
- ต้องมีการอนุมัติการจับคู่สำหรับ device IDs ใหม่ เว้นแต่จะเปิดใช้ local auto-approval
- การ auto-approval ของ pairing มุ่งเน้นไปที่การเชื่อมต่อ direct local loopback
- OpenClaw ยังมีเส้นทาง self-connect แบบแคบสำหรับ backend/container-local สำหรับ
  helper flows ที่ใช้ shared-secret และเชื่อถือได้
- การเชื่อมต่อ tailnet หรือ LAN บนโฮสต์เดียวกันยังคงถูกถือว่าเป็นการเชื่อมต่อระยะไกลสำหรับ pairing และ
  ต้องได้รับการอนุมัติ
- ไคลเอนต์ WS ทั้งหมดต้องรวม `device` identity ระหว่าง `connect` (ทั้ง operator + node)
  Control UI สามารถละเว้นได้เฉพาะในโหมดเหล่านี้:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ insecure HTTP บน localhost เท่านั้น
  - การยืนยันตัวตนของ operator Control UI ที่สำเร็จด้วย `gateway.auth.mode: "trusted-proxy"`
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
- ทุกการเชื่อมต่อต้องลงนาม nonce ของ `connect.challenge` ที่เซิร์ฟเวอร์ส่งมา

### การวินิจฉัยการย้าย device auth

สำหรับไคลเอนต์แบบเดิมที่ยังใช้พฤติกรรมการลงนามก่อน challenge ตอนนี้ `connect` จะคืน
detail codes `DEVICE_AUTH_*` ภายใต้ `error.details.code` พร้อม `error.details.reason` ที่มีเสถียรภาพ

ความล้มเหลวในการย้ายที่พบบ่อย:

| ข้อความ | details.code | details.reason | ความหมาย |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ไม่ได้ส่ง `device.nonce` (หรือส่งค่าว่าง) |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่าหรือผิด |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ของลายเซ็นไม่ตรงกับ payload แบบ v2 |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอกช่วง skew ที่อนุญาต |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับ fingerprint ของ public key |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/canonicalization ของ public key ล้มเหลว |

เป้าหมายของการย้าย:

- รอ `connect.challenge` เสมอ
- ลงนาม payload แบบ v2 ที่รวม server nonce
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload ของลายเซ็นที่แนะนำคือ `v3` ซึ่ง bind `platform` และ `deviceFamily`
  เพิ่มเติมนอกเหนือจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` แบบเดิมยังคงยอมรับได้เพื่อความเข้ากันได้ แต่การ pin ข้อมูลเมตาของ paired-device
  ยังคงเป็นตัวควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + การ pinning

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์สามารถเลือกทำ pin fingerprint ของใบรับรอง gateway ได้ (ดู config `gateway.tls`
  พร้อมทั้ง `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **Gateway API แบบเต็ม** (status, channels, models, chat,
agent, sessions, nodes, approvals ฯลฯ) พื้นผิวที่แน่นอนถูกกำหนดโดย
TypeBox schemas ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [Bridge protocol](/th/gateway/bridge-protocol)
- [คู่มือปฏิบัติการ Gateway](/th/gateway)
