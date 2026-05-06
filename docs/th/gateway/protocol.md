---
read_when:
    - การนำไปใช้งานหรืออัปเดตไคลเอนต์ WS ของ Gateway
    - การดีบักความไม่ตรงกันของโปรโตคอลหรือความล้มเหลวในการเชื่อมต่อ
    - กำลังสร้างสคีมา/โมเดลของโปรโตคอลใหม่
summary: 'โปรโตคอล WebSocket ของ Gateway: การแฮนด์เชก, เฟรม, การกำหนดเวอร์ชัน'
title: โปรโตคอล Gateway
x-i18n:
    generated_at: "2026-05-06T09:15:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

The Gateway WS protocol is the **single control plane + node transport** for
OpenClaw. All clients (CLI, web UI, macOS app, iOS/Android nodes, headless
nodes) connect over WebSocket and declare their **role** + **scope** at
handshake time.

## Transport

- WebSocket, text frames with JSON payloads.
- First frame **must** be a `connect` request.
- Pre-connect frames are capped at 64 KiB. After a successful handshake, clients
  should follow the `hello-ok.policy.maxPayload` and
  `hello-ok.policy.maxBufferedBytes` limits. With diagnostics enabled,
  oversized inbound frames and slow outbound buffers emit `payload.large` events
  before the gateway closes or drops the affected frame. These events keep
  sizes, limits, surfaces, and safe reason codes. They do not keep the message
  body, attachment contents, raw frame body, tokens, cookies, or secret values.

## Handshake (connect)

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

While the Gateway is still finishing startup sidecars, the `connect` request can
return a retryable `UNAVAILABLE` error with `details.reason` set to
`"startup-sidecars"` and `retryAfterMs`. Clients should retry that response
within their overall connection budget instead of surfacing it as a terminal
handshake failure.

`server`, `features`, `snapshot`, and `policy` are all required by the schema
(`src/gateway/protocol/schema/frames.ts`). `auth` is also required and reports
the negotiated role/scopes. `canvasHostUrl` is optional.

When no device token is issued, `hello-ok.auth` reports the negotiated
permissions without token fields:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Trusted same-process backend clients (`client.id: "gateway-client"`,
`client.mode: "backend"`) may omit `device` on direct loopback connections when
they authenticate with the shared gateway token/password. This path is reserved
for internal control-plane RPCs and keeps stale CLI/device pairing baselines from
blocking local backend work such as subagent session updates. Remote clients,
browser-origin clients, node clients, and explicit device-token/device-identity
clients still use the normal pairing and scope-upgrade checks.

When a device token is issued, `hello-ok` also includes:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

During trusted bootstrap handoff, `hello-ok.auth` may also include additional
bounded role entries in `deviceTokens`:

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

For the built-in node/operator bootstrap flow, the primary node token stays
`scopes: []` and any handed-off operator token stays bounded to the bootstrap
operator allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap scope checks stay
role-prefixed: operator entries only satisfy operator requests, and non-operator
roles still need scopes under their own role prefix.

### Node example

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

## Framing

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Side-effecting methods require **idempotency keys** (see schema).

## Roles + scopes

For the full operator scope model, approval-time checks, and shared-secret
semantics, see [Operator scopes](/th/gateway/operator-scopes).

### Roles

- `operator` = control plane client (CLI/UI/automation).
- `node` = capability host (camera/screen/canvas/system.run).

### Scopes (operator)

Common scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` with `includeSecrets: true` requires `operator.talk.secrets`
(or `operator.admin`).

Plugin-registered gateway RPC methods may request their own operator scope, but
reserved core admin prefixes (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) always resolve to `operator.admin`.

Method scope is only the first gate. Some slash commands reached through
`chat.send` apply stricter command-level checks on top. For example, persistent
`/config set` and `/config unset` writes require `operator.admin`.

`node.pair.approve` also has an extra approval-time scope check on top of the
base method scope:

- commandless requests: `operator.pairing`
- requests with non-exec node commands: `operator.pairing` + `operator.write`
- requests that include `system.run`, `system.run.prepare`, or `system.which`:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declare capability claims at connect time:

- `caps`: high-level capability categories such as `camera`, `canvas`, `screen`,
  `location`, `voice`, and `talk`.
- `commands`: command allowlist for invoke.
- `permissions`: granular toggles (e.g. `screen.record`, `camera.capture`).

The Gateway treats these as **claims** and enforces server-side allowlists.

## Presence

- `system-presence` returns entries keyed by device identity.
- Presence entries include `deviceId`, `roles`, and `scopes` so UIs can show a single row per device
  even when it connects as both **operator** and **node**.
- `node.list` includes optional `lastSeenAtMs` and `lastSeenReason` fields. Connected nodes report
  their current connection time as `lastSeenAtMs` with reason `connect`; paired nodes can also report
  durable background presence when a trusted node event updates their pairing metadata.

### Node background alive event

Nodes may call `node.event` with `event: "node.presence.alive"` to record that a paired node was
alive during a background wake without marking it connected.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is a closed enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, or `connect`. Unknown trigger strings are normalized to
`background` by the gateway before persistence. The event is durable only for authenticated node
device sessions; device-less or unpaired sessions return `handled: false`.

Successful gateways return a structured result:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Older gateways may still return `{ "ok": true }` for `node.event`; clients should treat that as an
acknowledged RPC, not as durable presence persistence.

## Broadcast event scoping

Server-pushed WebSocket broadcast events are scope-gated so that pairing-scoped or node-only sessions do not passively receive session content.

- **Chat, agent, and tool-result frames** (including streamed `agent` events and tool call results) require at least `operator.read`. Sessions without `operator.read` skip these frames entirely.
- **Plugin-defined `plugin.*` broadcasts** are gated to `operator.write` or `operator.admin`, depending on how the plugin registered them.
- **Status and transport events** (`heartbeat`, `presence`, `tick`, connect/disconnect lifecycle, etc.) remain unrestricted so transport health stays observable to every authenticated session.
- **Unknown broadcast event families** are scope-gated by default (fail-closed) unless a registered handler explicitly relaxes them.

Each client connection keeps its own per-client sequence number so broadcasts preserve monotonic ordering on that socket even when different clients see different scope-filtered subsets of the event stream.

## Common RPC method families

The public WS surface is broader than the handshake/auth examples above. This
is not a generated dump — `hello-ok.features.methods` is a conservative
discovery list built from `src/gateway/server-methods-list.ts` plus loaded
plugin/channel method exports. Treat it as feature discovery, not a full
enumeration of `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` returns the cached or freshly probed gateway health snapshot.
    - `diagnostics.stability` returns the recent bounded diagnostic stability recorder. It keeps operational metadata such as event names, counts, byte sizes, memory readings, queue/session state, channel/plugin names, and session ids. It does not keep chat text, webhook bodies, tool outputs, raw request or response bodies, tokens, cookies, or secret values. Operator read scope is required.
    - `status` returns the `/status`-style gateway summary; sensitive fields are included only for admin-scoped operator clients.
    - `gateway.identity.get` returns the gateway device identity used by relay and pairing flows.
    - `system-presence` returns the current presence snapshot for connected operator/node devices.
    - `system-event` appends a system event and can update/broadcast presence context.
    - `last-heartbeat` returns the latest persisted heartbeat event.
    - `set-heartbeats` toggles heartbeat processing on the gateway.

  </Accordion>

  <Accordion title="โมเดลและการใช้งาน">
    - `models.list` ส่งคืนแค็ตตาล็อกโมเดลที่ runtime อนุญาต ส่ง `{ "view": "configured" }` สำหรับโมเดลที่กำหนดค่าแล้วในขนาดเหมาะกับตัวเลือก (`agents.defaults.models` ก่อน แล้วตามด้วย `models.providers.*.models`) หรือ `{ "view": "all" }` สำหรับแค็ตตาล็อกทั้งหมด
    - `usage.status` ส่งคืนสรุปหน้าต่างการใช้งาน/โควตาที่เหลือของผู้ให้บริการ
    - `usage.cost` ส่งคืนสรุปการใช้งานค่าใช้จ่ายแบบรวมสำหรับช่วงวันที่
    - `doctor.memory.status` ส่งคืนความพร้อมของ vector-memory / cached embedding สำหรับเวิร์กสเปซของ agent ค่าเริ่มต้นที่ใช้งานอยู่ ส่ง `{ "probe": true }` หรือ `{ "deep": true }` เฉพาะเมื่อผู้เรียกต้องการ ping ผู้ให้บริการ embedding แบบสดอย่างชัดเจนเท่านั้น
    - `doctor.memory.remHarness` ส่งคืนตัวอย่างฮาร์เนส REM แบบจำกัดขอบเขตและอ่านอย่างเดียวสำหรับไคลเอนต์ control-plane ระยะไกล ซึ่งอาจรวมเส้นทางเวิร์กสเปซ ส่วนย่อยของหน่วยความจำ Markdown ที่เรนเดอร์พร้อมฐานอ้างอิง และตัวเลือกการเลื่อนระดับเชิงลึก ดังนั้นผู้เรียกจึงต้องมี `operator.read`
    - `sessions.usage` ส่งคืนสรุปการใช้งานรายเซสชัน
    - `sessions.usage.timeseries` ส่งคืนการใช้งานแบบอนุกรมเวลาสำหรับหนึ่งเซสชัน
    - `sessions.usage.logs` ส่งคืนรายการบันทึกการใช้งานสำหรับหนึ่งเซสชัน

  </Accordion>

  <Accordion title="ช่องทางและตัวช่วยเข้าสู่ระบบ">
    - `channels.status` ส่งคืนสรุปสถานะช่องทาง/Plugin ในตัวและที่บันเดิลมา
    - `channels.logout` ออกจากระบบช่องทาง/บัญชีที่ระบุเมื่อช่องทางรองรับการออกจากระบบ
    - `web.login.start` เริ่มโฟลว์เข้าสู่ระบบด้วย QR/เว็บสำหรับผู้ให้บริการช่องทางเว็บปัจจุบันที่รองรับ QR
    - `web.login.wait` รอให้โฟลว์เข้าสู่ระบบด้วย QR/เว็บนั้นเสร็จสิ้นและเริ่มช่องทางเมื่อสำเร็จ
    - `push.test` ส่ง APNs push ทดสอบไปยัง Node iOS ที่ลงทะเบียนไว้
    - `voicewake.get` ส่งคืนทริกเกอร์ wake-word ที่จัดเก็บไว้
    - `voicewake.set` อัปเดตทริกเกอร์ wake-word และกระจายการเปลี่ยนแปลง

  </Accordion>

  <Accordion title="การส่งข้อความและบันทึก">
    - `send` คือ RPC ส่งออกโดยตรงสำหรับการส่งที่กำหนดเป้าหมายตามช่องทาง/บัญชี/เธรดภายนอกตัวเรียกแชต
    - `logs.tail` ส่งคืนส่วนท้ายไฟล์บันทึกของ Gateway ที่กำหนดค่าไว้ พร้อมตัวควบคุมเคอร์เซอร์/ขีดจำกัดและจำนวนไบต์สูงสุด

  </Accordion>

  <Accordion title="Talk และ TTS">
    - `talk.catalog` ส่งคืนแค็ตตาล็อกผู้ให้บริการ Talk แบบอ่านอย่างเดียวสำหรับเสียงพูด การถอดเสียงแบบสตรีม และเสียงเรียลไทม์ โดยรวม id ผู้ให้บริการ ป้ายกำกับ สถานะที่กำหนดค่าแล้ว id โมเดล/เสียงที่เปิดเผย โหมดมาตรฐาน ทรานสปอร์ต กลยุทธ์ brain และแฟล็กเสียง/ความสามารถแบบเรียลไทม์ โดยไม่ส่งคืนความลับของผู้ให้บริการหรือเปลี่ยนแปลงการกำหนดค่าส่วนกลาง
    - `talk.config` ส่งคืนเพย์โหลดการกำหนดค่า Talk ที่มีผล; `includeSecrets` ต้องใช้ `operator.talk.secrets` (หรือ `operator.admin`)
    - `talk.session.create` สร้างเซสชัน Talk ที่ Gateway เป็นเจ้าของสำหรับ `realtime/gateway-relay`, `transcription/gateway-relay` หรือ `stt-tts/managed-room` `brain: "direct-tools"` ต้องใช้ `operator.admin`
    - `talk.session.join` ตรวจสอบโทเค็นเซสชัน managed-room ส่งเหตุการณ์ `session.ready` หรือ `session.replaced` ตามที่จำเป็น และส่งคืนเมตาดาต้าห้อง/เซสชันพร้อมเหตุการณ์ Talk ล่าสุด โดยไม่มีโทเค็นข้อความล้วนหรือแฮชโทเค็นที่จัดเก็บไว้
    - `talk.session.appendAudio` ต่อท้ายเสียงอินพุต PCM แบบ base64 ไปยังเซสชันรีเลย์เรียลไทม์และการถอดเสียงที่ Gateway เป็นเจ้าของ
    - `talk.session.startTurn`, `talk.session.endTurn` และ `talk.session.cancelTurn` ขับเคลื่อนวงจรชีวิตเทิร์นของ managed-room พร้อมการปฏิเสธเทิร์นที่ล้าสมัยก่อนล้างสถานะ
    - `talk.session.cancelOutput` หยุดเอาต์พุตเสียงของ assistant โดยหลักใช้สำหรับการแทรกพูดที่ควบคุมด้วย VAD ในเซสชันรีเลย์ของ Gateway
    - `talk.session.submitToolResult` ทำให้การเรียกเครื่องมือของผู้ให้บริการที่ปล่อยโดยเซสชันรีเลย์เรียลไทม์ที่ Gateway เป็นเจ้าของเสร็จสมบูรณ์
    - `talk.session.close` ปิดเซสชันรีเลย์ การถอดเสียง หรือ managed-room ที่ Gateway เป็นเจ้าของ และปล่อยเหตุการณ์ Talk สุดท้าย
    - `talk.mode` ตั้งค่า/กระจายสถานะโหมด Talk ปัจจุบันสำหรับไคลเอนต์ WebChat/Control UI
    - `talk.client.create` สร้างเซสชันผู้ให้บริการเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของโดยใช้ `webrtc` หรือ `provider-websocket` ในขณะที่ Gateway เป็นเจ้าของการกำหนดค่า ข้อมูลรับรอง คำสั่ง และนโยบายเครื่องมือ
    - `talk.client.toolCall` ให้ทรานสปอร์ตเรียลไทม์ที่ไคลเอนต์เป็นเจ้าของส่งต่อการเรียกเครื่องมือของผู้ให้บริการไปยังนโยบายของ Gateway เครื่องมือแรกที่รองรับคือ `openclaw_agent_consult`; ไคลเอนต์จะได้รับ run id และรอเหตุการณ์วงจรชีวิตแชตปกติก่อนส่งผลลัพธ์เครื่องมือเฉพาะผู้ให้บริการ
    - `talk.event` คือช่องเหตุการณ์ Talk เดียวสำหรับอะแดปเตอร์เรียลไทม์ การถอดเสียง STT/TTS, managed-room, โทรศัพท์ และการประชุม
    - `talk.speak` สังเคราะห์เสียงพูดผ่านผู้ให้บริการเสียงพูด Talk ที่ใช้งานอยู่
    - `tts.status` ส่งคืนสถานะเปิดใช้ TTS ผู้ให้บริการที่ใช้งานอยู่ ผู้ให้บริการ fallback และสถานะการกำหนดค่าผู้ให้บริการ
    - `tts.providers` ส่งคืนรายการผู้ให้บริการ TTS ที่มองเห็นได้
    - `tts.enable` และ `tts.disable` สลับสถานะการตั้งค่า TTS
    - `tts.setProvider` อัปเดตผู้ให้บริการ TTS ที่ต้องการ
    - `tts.convert` เรียกใช้การแปลงข้อความเป็นเสียงพูดแบบครั้งเดียว

  </Accordion>

  <Accordion title="ความลับ การกำหนดค่า การอัปเดต และวิซาร์ด">
    - `secrets.reload` แก้ไข SecretRefs ที่ใช้งานอยู่อีกครั้งและสลับสถานะความลับของ runtime เฉพาะเมื่อสำเร็จทั้งหมด
    - `secrets.resolve` แก้ไขการกำหนดความลับเป้าหมายคำสั่งสำหรับชุดคำสั่ง/เป้าหมายที่ระบุ
    - `config.get` ส่งคืนสแนปช็อตและแฮชการกำหนดค่าปัจจุบัน
    - `config.set` เขียนเพย์โหลดการกำหนดค่าที่ผ่านการตรวจสอบแล้ว
    - `config.patch` ผสานการอัปเดตการกำหนดค่าแบบบางส่วน
    - `config.apply` ตรวจสอบ + แทนที่เพย์โหลดการกำหนดค่าทั้งหมด
    - `config.schema` ส่งคืนเพย์โหลด schema การกำหนดค่าแบบสดที่ใช้โดยเครื่องมือ Control UI และ CLI: schema, `uiHints`, เวอร์ชัน และเมตาดาต้าการสร้าง รวมถึงเมตาดาต้า schema ของ Plugin + ช่องทางเมื่อ runtime สามารถโหลดได้ schema รวมเมตาดาต้าฟิลด์ `title` / `description` ที่ได้มาจากป้ายกำกับและข้อความช่วยเหลือเดียวกับที่ UI ใช้ รวมถึงกิ่งของอ็อบเจกต์ซ้อน wildcard รายการอาร์เรย์ และองค์ประกอบ `anyOf` / `oneOf` / `allOf` เมื่อมีเอกสารฟิลด์ที่ตรงกัน
    - `config.schema.lookup` ส่งคืนเพย์โหลดการค้นหาแบบจำกัดขอบเขตตามเส้นทางสำหรับหนึ่งเส้นทางการกำหนดค่า: เส้นทางที่ทำให้เป็นมาตรฐาน โหนด schema ระดับตื้น hint ที่ตรงกัน + `hintPath` และสรุปลูกโดยตรงสำหรับการเจาะลึกใน UI/CLI โหนด schema การค้นหายังคงเอกสารสำหรับผู้ใช้และฟิลด์ตรวจสอบทั่วไป (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, ขอบเขตตัวเลข/สตริง/อาร์เรย์/อ็อบเจกต์ และแฟล็กเช่น `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) สรุปลูกเปิดเผย `key`, `path` ที่ทำให้เป็นมาตรฐาน, `type`, `required`, `hasChildren` รวมถึง `hint` / `hintPath` ที่ตรงกัน
    - `update.run` เรียกใช้โฟลว์อัปเดต Gateway และกำหนดเวลาการรีสตาร์ตเฉพาะเมื่อการอัปเดตสำเร็จเอง; ผู้เรียกที่มีเซสชันสามารถรวม `continuationMessage` เพื่อให้การเริ่มต้นทำงานต่อหนึ่งเทิร์น agent ติดตามผ่านคิวการดำเนินต่อหลังรีสตาร์ต การอัปเดตตัวจัดการแพ็กเกจบังคับให้รีสตาร์ตอัปเดตแบบไม่เลื่อนเวลาและไม่มี cooldown หลังการสลับแพ็กเกจ เพื่อไม่ให้กระบวนการ Gateway เก่ายังคง lazy-load จากต้นไม้ `dist` ที่ถูกแทนที่
    - `update.status` ส่งคืน sentinel รีสตาร์ตอัปเดตที่แคชล่าสุด รวมถึงเวอร์ชันที่ทำงานหลังรีสตาร์ตเมื่อมี
    - `wizard.start`, `wizard.next`, `wizard.status` และ `wizard.cancel` เปิดเผยวิซาร์ด onboarding ผ่าน WS RPC

  </Accordion>

  <Accordion title="ตัวช่วย agent และเวิร์กสเปซ">
    - `agents.list` ส่งคืนรายการ agent ที่กำหนดค่าไว้ รวมถึงโมเดลที่มีผลและเมตาดาต้า runtime
    - `agents.create`, `agents.update` และ `agents.delete` จัดการระเบียน agent และการเดินสายเวิร์กสเปซ
    - `agents.files.list`, `agents.files.get` และ `agents.files.set` จัดการไฟล์เวิร์กสเปซ bootstrap ที่เปิดเผยสำหรับ agent
    - `artifacts.list`, `artifacts.get` และ `artifacts.download` เปิดเผยสรุป artifact และการดาวน์โหลดที่ได้จาก transcript สำหรับขอบเขต `sessionKey`, `runId` หรือ `taskId` ที่ระบุชัดเจน คิวรี run และ task จะแก้ไขเซสชันเจ้าของฝั่งเซิร์ฟเวอร์และส่งคืนเฉพาะสื่อ transcript ที่มี provenance ตรงกัน; แหล่ง URL ที่ไม่ปลอดภัยหรือเป็นโลคัลจะส่งคืนการดาวน์โหลดที่ไม่รองรับแทนการดึงข้อมูลฝั่งเซิร์ฟเวอร์
    - `environments.list` และ `environments.status` เปิดเผยการค้นพบสภาพแวดล้อม Gateway-local และ Node แบบอ่านอย่างเดียวสำหรับไคลเอนต์ SDK
    - `agent.identity.get` ส่งคืนตัวตน assistant ที่มีผลสำหรับ agent หรือเซสชัน
    - `agent.wait` รอให้ run เสร็จสิ้นและส่งคืนสแนปช็อตสุดท้ายเมื่อมี

  </Accordion>

  <Accordion title="การควบคุมเซสชัน">
    - `sessions.list` ส่งคืนดัชนีเซสชันปัจจุบัน รวมถึงเมตาดาต้า `agentRuntime` ต่อแถวเมื่อมีการกำหนดค่าแบ็กเอนด์ runtime ของ agent
    - `sessions.subscribe` และ `sessions.unsubscribe` สลับการสมัครรับเหตุการณ์การเปลี่ยนแปลงเซสชันสำหรับไคลเอนต์ WS ปัจจุบัน
    - `sessions.messages.subscribe` และ `sessions.messages.unsubscribe` สลับการสมัครรับเหตุการณ์ transcript/ข้อความสำหรับหนึ่งเซสชัน
    - `sessions.preview` ส่งคืนตัวอย่าง transcript แบบจำกัดขอบเขตสำหรับคีย์เซสชันที่ระบุ
    - `sessions.describe` ส่งคืนหนึ่งแถวเซสชัน Gateway สำหรับคีย์เซสชันที่ตรงแบบ exact
    - `sessions.resolve` แก้ไขหรือทำให้เป้าหมายเซสชันเป็นรูปแบบมาตรฐาน
    - `sessions.create` สร้างรายการเซสชันใหม่
    - `sessions.send` ส่งข้อความเข้าไปในเซสชันที่มีอยู่
    - `sessions.steer` คือรูปแบบ interrupt-and-steer สำหรับเซสชันที่ใช้งานอยู่
    - `sessions.abort` ยกเลิกงานที่ใช้งานอยู่สำหรับเซสชัน ผู้เรียกอาจส่ง `key` พร้อม `runId` ที่ไม่บังคับ หรือส่งเฉพาะ `runId` สำหรับ run ที่ใช้งานอยู่ซึ่ง Gateway สามารถแก้ไขเป็นเซสชันได้
    - `sessions.patch` อัปเดตเมตาดาต้า/การ override ของเซสชันและรายงานโมเดลมาตรฐานที่แก้ไขแล้วพร้อม `agentRuntime` ที่มีผล
    - `sessions.reset`, `sessions.delete` และ `sessions.compact` ดำเนินการบำรุงรักษาเซสชัน
    - `sessions.get` ส่งคืนแถวเซสชันที่จัดเก็บไว้ทั้งหมด
    - การเรียกใช้แชตยังคงใช้ `chat.history`, `chat.send`, `chat.abort` และ `chat.inject` `chat.history` ถูกทำให้เป็นมาตรฐานสำหรับแสดงผลแก่ไคลเอนต์ UI: แท็ก directive แบบ inline จะถูกตัดออกจากข้อความที่มองเห็นได้ เพย์โหลด XML การเรียกเครื่องมือแบบข้อความล้วน (รวมถึง `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` และบล็อกการเรียกเครื่องมือที่ถูกตัดทอน) และโทเค็นควบคุมโมเดล ASCII/เต็มความกว้างที่รั่วไหลจะถูกตัดออก แถว assistant ที่เป็นโทเค็นเงียบล้วน เช่น `NO_REPLY` / `no_reply` แบบ exact จะถูกละเว้น และแถวขนาดใหญ่เกินไปอาจถูกแทนที่ด้วย placeholders

  </Accordion>

  <Accordion title="การจับคู่อุปกรณ์และโทเค็นอุปกรณ์">
    - `device.pair.list` ส่งคืนอุปกรณ์ที่จับคู่แล้วซึ่งรอดำเนินการและได้รับอนุมัติ
    - `device.pair.approve`, `device.pair.reject` และ `device.pair.remove` จัดการระเบียนการจับคู่อุปกรณ์
    - `device.token.rotate` หมุนเวียนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก
    - `device.token.revoke` เพิกถอนโทเค็นอุปกรณ์ที่จับคู่แล้วภายในขอบเขตบทบาทที่ได้รับอนุมัติและขอบเขตผู้เรียก

  </Accordion>

  <Accordion title="การจับคู่ Node การเรียกใช้ และงานที่ค้างอยู่">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` และ `node.pair.verify` ครอบคลุมการจับคู่ Node และการตรวจสอบ bootstrap
    - `node.list` และ `node.describe` ส่งคืนสถานะ Node ที่รู้จัก/เชื่อมต่ออยู่
    - `node.rename` อัปเดตป้ายกำกับ Node ที่จับคู่แล้ว
    - `node.invoke` ส่งต่อคำสั่งไปยัง Node ที่เชื่อมต่ออยู่
    - `node.invoke.result` ส่งคืนผลลัพธ์สำหรับคำขอ invoke
    - `node.event` นำเหตุการณ์ที่เกิดจาก Node กลับเข้าสู่ Gateway
    - `node.canvas.capability.refresh` รีเฟรชโทเค็นความสามารถ canvas แบบจำกัดขอบเขต
    - `node.pending.pull` และ `node.pending.ack` คือ API คิวของ Node ที่เชื่อมต่ออยู่
    - `node.pending.enqueue` และ `node.pending.drain` จัดการงานคงทนที่ค้างอยู่สำหรับ Node ที่ออฟไลน์/ถูกตัดการเชื่อมต่อ

  </Accordion>

  <Accordion title="กลุ่มการอนุมัติ">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` และ `exec.approval.resolve` ครอบคลุมคำขออนุมัติ exec แบบครั้งเดียว รวมถึงการค้นหา/เล่นซ้ำการอนุมัติที่รอดำเนินการ
    - `exec.approval.waitDecision` รอการอนุมัติ exec ที่รอดำเนินการหนึ่งรายการ และส่งคืนการตัดสินใจสุดท้าย (หรือ `null` เมื่อหมดเวลา)
    - `exec.approvals.get` และ `exec.approvals.set` จัดการสแนปช็อตนโยบายการอนุมัติ exec ของ Gateway
    - `exec.approvals.node.get` และ `exec.approvals.node.set` จัดการนโยบายการอนุมัติ exec เฉพาะ Node ผ่านคำสั่งรีเลย์ของ Node
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` และ `plugin.approval.resolve` ครอบคลุมโฟลว์การอนุมัติที่กำหนดโดย Plugin

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ Skills และเครื่องมือ">
    - ระบบอัตโนมัติ: `wake` กำหนดการฉีดข้อความปลุกทันทีหรือใน Heartbeat ถัดไป; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` จัดการงานที่กำหนดเวลาไว้
    - Skills และเครื่องมือ: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`

  </Accordion>
</AccordionGroup>

### กลุ่มเหตุการณ์ทั่วไป

- `chat`: การอัปเดตแชท UI เช่น `chat.inject` และเหตุการณ์แชทอื่นที่มีเฉพาะทรานสคริปต์
- `session.message` และ `session.tool`: การอัปเดตทรานสคริปต์/สตรีมเหตุการณ์สำหรับเซสชันที่สมัครรับข้อมูล
- `sessions.changed`: ดัชนีเซสชันหรือเมทาดาทาเปลี่ยนแปลง
- `presence`: การอัปเดตสแนปช็อตสถานะระบบ
- `tick`: เหตุการณ์ keepalive / liveness เป็นระยะ
- `health`: การอัปเดตสแนปช็อตสุขภาพของ Gateway
- `heartbeat`: การอัปเดตสตรีมเหตุการณ์ Heartbeat
- `cron`: เหตุการณ์การเปลี่ยนแปลงงาน/การรัน Cron
- `shutdown`: การแจ้งเตือนการปิด Gateway
- `node.pair.requested` / `node.pair.resolved`: วงจรชีวิตการจับคู่ Node
- `node.invoke.request`: การกระจายคำขอเรียกใช้ Node
- `device.pair.requested` / `device.pair.resolved`: วงจรชีวิตอุปกรณ์ที่จับคู่
- `voicewake.changed`: การกำหนดค่าทริกเกอร์คำปลุกเปลี่ยนแปลง
- `exec.approval.requested` / `exec.approval.resolved`: วงจรชีวิตการอนุมัติ exec
- `plugin.approval.requested` / `plugin.approval.resolved`: วงจรชีวิตการอนุมัติ Plugin

### เมธอดตัวช่วยของ Node

- Node อาจเรียก `skills.bins` เพื่อดึงรายการปัจจุบันของไฟล์ปฏิบัติการ Skill สำหรับการตรวจสอบการอนุญาตอัตโนมัติ

### เมธอดตัวช่วยของผู้ปฏิบัติการ

- ผู้ปฏิบัติการอาจเรียก `commands.list` (`operator.read`) เพื่อดึงคลังคำสั่งรันไทม์สำหรับเอเจนต์
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - `scope` ควบคุมว่าพื้นผิวใดที่ `name` หลักกำหนดเป้าหมาย:
    - `text` ส่งคืนโทเค็นคำสั่งข้อความหลักโดยไม่มี `/` นำหน้า
    - `native` และพาธเริ่มต้น `both` ส่งคืนชื่อแบบ native ที่รับรู้ provider เมื่อมี
  - `textAliases` มี alias แบบสแลชที่ตรงกันทุกตัว เช่น `/model` และ `/m`
  - `nativeName` มีชื่อคำสั่ง native ที่รับรู้ provider เมื่อมีอยู่
  - `provider` เป็นตัวเลือกและมีผลเฉพาะต่อการตั้งชื่อ native รวมถึงความพร้อมใช้งานของคำสั่ง Plugin แบบ native
  - `includeArgs=false` ละเมทาดาทาอาร์กิวเมนต์แบบซีเรียลไลซ์จากการตอบกลับ
- ผู้ปฏิบัติการอาจเรียก `tools.catalog` (`operator.read`) เพื่อดึงแค็ตตาล็อกเครื่องมือรันไทม์สำหรับเอเจนต์ การตอบกลับมีเครื่องมือที่จัดกลุ่มและเมทาดาทาแหล่งที่มา:
  - `source`: `core` หรือ `plugin`
  - `pluginId`: เจ้าของ Plugin เมื่อ `source="plugin"`
  - `optional`: ระบุว่าเครื่องมือ Plugin เป็นแบบไม่บังคับหรือไม่
- ผู้ปฏิบัติการอาจเรียก `tools.effective` (`operator.read`) เพื่อดึงคลังเครื่องมือที่มีผลในรันไทม์สำหรับเซสชัน
  - ต้องมี `sessionKey`
  - Gateway อนุมานบริบทรันไทม์ที่เชื่อถือได้จากเซสชันฝั่งเซิร์ฟเวอร์ แทนที่จะยอมรับบริบท auth หรือการส่งมอบที่ผู้เรียกส่งมา
  - การตอบกลับมีขอบเขตตามเซสชันและสะท้อนสิ่งที่การสนทนาที่ใช้งานอยู่สามารถใช้ได้ในขณะนี้ รวมถึงเครื่องมือ core, Plugin และช่องทาง
- ผู้ปฏิบัติการอาจเรียก `tools.invoke` (`operator.write`) เพื่อเรียกใช้เครื่องมือหนึ่งรายการที่พร้อมใช้งานผ่านพาธนโยบาย Gateway เดียวกับ `/tools/invoke`
  - ต้องมี `name` ส่วน `args`, `sessionKey`, `agentId`, `confirm` และ `idempotencyKey` เป็นตัวเลือก
  - หากมีทั้ง `sessionKey` และ `agentId` เอเจนต์ของเซสชันที่ resolve แล้วต้องตรงกับ `agentId`
  - การตอบกลับเป็น envelope ที่มุ่งใช้กับ SDK พร้อมฟิลด์ `ok`, `toolName`, `output` ที่เป็นตัวเลือก และฟิลด์ `error` แบบมีชนิด การอนุมัติหรือการปฏิเสธตามนโยบายจะส่งคืน `ok:false` ใน payload แทนที่จะข้าม pipeline นโยบายเครื่องมือของ Gateway
- ผู้ปฏิบัติการอาจเรียก `skills.status` (`operator.read`) เพื่อดึงคลัง Skill ที่มองเห็นได้สำหรับเอเจนต์
  - `agentId` เป็นตัวเลือก; ละไว้เพื่ออ่านพื้นที่ทำงานเอเจนต์เริ่มต้น
  - การตอบกลับมีสิทธิ์ใช้งาน ข้อกำหนดที่ขาดหาย การตรวจสอบการกำหนดค่า และตัวเลือกการติดตั้งที่ล้างข้อมูลแล้วโดยไม่เปิดเผยค่าความลับดิบ
- ผู้ปฏิบัติการอาจเรียก `skills.search` และ `skills.detail` (`operator.read`) สำหรับเมทาดาทาการค้นพบของ ClawHub
- ผู้ปฏิบัติการอาจเรียก `skills.install` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub: `{ source: "clawhub", slug, version?, force? }` ติดตั้งโฟลเดอร์ Skill ลงในไดเรกทอรี `skills/` ของพื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมดตัวติดตั้ง Gateway: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }` รันการกระทำ `metadata.openclaw.install` ที่ประกาศไว้บนโฮสต์ Gateway
- ผู้ปฏิบัติการอาจเรียก `skills.update` (`operator.admin`) ได้สองโหมด:
  - โหมด ClawHub อัปเดต slug ที่ติดตามหนึ่งรายการหรือการติดตั้ง ClawHub ที่ติดตามทั้งหมดในพื้นที่ทำงานเอเจนต์เริ่มต้น
  - โหมดการกำหนดค่าแพตช์ค่า `skills.entries.<skillKey>` เช่น `enabled`, `apiKey` และ `env`

### มุมมอง `models.list`

`models.list` รับพารามิเตอร์ `view` ที่เป็นตัวเลือก:

- ละไว้หรือ `"default"`: พฤติกรรมรันไทม์ปัจจุบัน หากกำหนดค่า `agents.defaults.models` ไว้ การตอบกลับคือแค็ตตาล็อกที่อนุญาต มิฉะนั้นการตอบกลับคือแค็ตตาล็อก Gateway ทั้งหมด
- `"configured"`: พฤติกรรมขนาดพอดีกับตัวเลือก หากกำหนดค่า `agents.defaults.models` ไว้ ค่านั้นยังคงชนะ มิฉะนั้นการตอบกลับใช้รายการ `models.providers.*.models` ที่ระบุอย่างชัดเจน และ fallback ไปยังแค็ตตาล็อกทั้งหมดเฉพาะเมื่อไม่มีแถวโมเดลที่กำหนดค่าไว้
- `"all"`: แค็ตตาล็อก Gateway ทั้งหมด โดยข้าม `agents.defaults.models` ใช้สำหรับการวินิจฉัยและ UI การค้นพบ ไม่ใช่ตัวเลือกโมเดลปกติ

## การอนุมัติ exec

- เมื่อคำขอ exec ต้องได้รับการอนุมัติ Gateway จะกระจาย `exec.approval.requested`
- ไคลเอนต์ผู้ปฏิบัติการ resolve โดยเรียก `exec.approval.resolve` (ต้องใช้ scope `operator.approvals`)
- สำหรับ `host=node`, `exec.approval.request` ต้องมี `systemRunPlan` (ข้อมูลเมทาดาทา `argv`/`cwd`/`rawCommand`/เซสชันแบบ canonical) คำขอที่ไม่มี `systemRunPlan` จะถูกปฏิเสธ
- หลังอนุมัติ การเรียก `node.invoke system.run` ที่ส่งต่อจะใช้ `systemRunPlan` แบบ canonical นั้นซ้ำเป็นบริบทคำสั่ง/cwd/เซสชันที่มีอำนาจตัดสิน
- หากผู้เรียกเปลี่ยนแปลง `command`, `rawCommand`, `cwd`, `agentId` หรือ `sessionKey` ระหว่างการเตรียมและการส่งต่อ `system.run` ที่ได้รับอนุมัติขั้นสุดท้าย Gateway จะปฏิเสธการรันแทนที่จะเชื่อถือ payload ที่ถูกเปลี่ยนแปลง

## fallback การส่งมอบของเอเจนต์

- คำขอ `agent` สามารถมี `deliver=true` เพื่อขอการส่งมอบขาออก
- `bestEffortDeliver=false` คงพฤติกรรมแบบเข้มงวด: เป้าหมายการส่งมอบที่ resolve ไม่ได้หรือเฉพาะภายในจะส่งคืน `INVALID_REQUEST`
- `bestEffortDeliver=true` อนุญาตให้ fallback ไปเป็นการดำเนินการเฉพาะเซสชันเมื่อไม่สามารถ resolve เส้นทางที่ส่งมอบภายนอกได้ (เช่น เซสชันภายใน/webchat หรือการกำหนดค่าหลายช่องทางที่กำกวม)

## การกำหนดเวอร์ชัน

- `PROTOCOL_VERSION` อยู่ใน `src/gateway/protocol/schema/protocol-schemas.ts`
- ไคลเอนต์ส่ง `minProtocol` + `maxProtocol`; เซิร์ฟเวอร์ปฏิเสธเมื่อไม่ตรงกัน
- Schema + โมเดลสร้างจากนิยาม TypeBox:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### ค่าคงที่ของไคลเอนต์

ไคลเอนต์อ้างอิงใน `src/gateway/client.ts` ใช้ค่าเริ่มต้นเหล่านี้ ค่าต่างๆ มีเสถียรภาพใน protocol v3 และเป็น baseline ที่คาดหวังสำหรับไคลเอนต์บุคคลที่สาม

| ค่าคงที่                                  | ค่าเริ่มต้น                                               | แหล่งที่มา                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| หมดเวลาคำขอ (ต่อ RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| หมดเวลา Preauth / connect-challenge       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env สามารถเพิ่มงบประมาณเซิร์ฟเวอร์/ไคลเอนต์ที่จับคู่) |
| backoff การเชื่อมต่อใหม่เริ่มต้น                 | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| backoff การเชื่อมต่อใหม่สูงสุด                     | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| การ clamp ลองใหม่เร็วหลังปิด device-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| ระยะผ่อนผัน force-stop ก่อน `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| หมดเวลาเริ่มต้นของ `stopAndWait()`           | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| ช่วงเวลา tick เริ่มต้น (ก่อน `hello-ok`)    | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| การปิดเมื่อ tick-timeout                        | code `4000` เมื่อความเงียบเกิน `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

เซิร์ฟเวอร์ประกาศค่า `policy.tickIntervalMs`, `policy.maxPayload` และ `policy.maxBufferedBytes` ที่มีผลใน `hello-ok`; ไคลเอนต์ควรปฏิบัติตามค่าเหล่านั้นแทนค่าเริ่มต้นก่อน handshake

## Auth

- การยืนยันตัวตนของ Gateway แบบความลับที่ใช้ร่วมกันใช้ `connect.params.auth.token` หรือ
  `connect.params.auth.password` ตามโหมดการยืนยันตัวตนที่กำหนดค่าไว้
- โหมดที่มีข้อมูลระบุตัวตน เช่น Tailscale Serve
  (`gateway.auth.allowTailscale: true`) หรือ non-loopback
  `gateway.auth.mode: "trusted-proxy"` จะผ่านการตรวจสอบการยืนยันตัวตนของ connect จาก
  ส่วนหัวคำขอแทน `connect.params.auth.*`
- Private-ingress `gateway.auth.mode: "none"` จะข้ามการยืนยันตัวตนของ connect แบบความลับที่ใช้ร่วมกัน
  ทั้งหมด อย่าเปิดโหมดนั้นบน ingress สาธารณะ/ไม่น่าเชื่อถือ
- หลังจากจับคู่แล้ว Gateway จะออก **device token** ที่จำกัดขอบเขตตามบทบาทการเชื่อมต่อ
  + scopes โดยจะส่งกลับใน `hello-ok.auth.deviceToken` และไคลเอนต์ควร
  บันทึกไว้เพื่อใช้เชื่อมต่อในอนาคต
- ไคลเอนต์ควรบันทึก `hello-ok.auth.deviceToken` หลักหลังจาก
  เชื่อมต่อสำเร็จทุกครั้ง
- การเชื่อมต่อใหม่ด้วย device token ที่ **จัดเก็บไว้** นั้นควรใช้ชุด scope ที่อนุมัติแล้วซึ่งจัดเก็บไว้
  สำหรับ token นั้นซ้ำด้วย วิธีนี้จะรักษาสิทธิ์อ่าน/probe/status
  ที่เคยได้รับอนุญาตแล้ว และหลีกเลี่ยงการลดขอบเขตการเชื่อมต่อใหม่แบบเงียบๆ ให้เหลือ
  scope แบบนัยที่แคบกว่าเฉพาะผู้ดูแลระบบเท่านั้น
- การประกอบการยืนยันตัวตนฝั่งไคลเอนต์สำหรับ connect (`selectConnectAuth` ใน
  `src/gateway/client.ts`):
  - `auth.password` เป็นอิสระจากส่วนอื่น และจะถูกส่งต่อเสมอเมื่อกำหนดค่าไว้
  - `auth.token` ถูกเติมตามลำดับความสำคัญ: token ที่ใช้ร่วมกันแบบระบุชัดเจนก่อน,
    จากนั้น `deviceToken` แบบระบุชัดเจน, แล้วจึงเป็น token ต่ออุปกรณ์ที่จัดเก็บไว้ (อ้างอิงด้วย
    `deviceId` + `role`)
  - `auth.bootstrapToken` จะถูกส่งเฉพาะเมื่อไม่มีรายการข้างต้นใดแก้เป็น
    `auth.token` ได้ token ที่ใช้ร่วมกันหรือ device token ใดๆ ที่แก้ได้จะยับยั้งไม่ให้ส่งค่านี้
  - การเลื่อนระดับอัตโนมัติของ device token ที่จัดเก็บไว้ในการลองใหม่ครั้งเดียวจาก
    `AUTH_TOKEN_MISMATCH` ถูกจำกัดให้ใช้กับ **ปลายทางที่เชื่อถือได้เท่านั้น** —
    loopback หรือ `wss://` ที่มี `tlsFingerprint` ตรึงไว้ `wss://` สาธารณะ
    ที่ไม่มีการตรึงจะไม่นับว่าเข้าเงื่อนไข
- รายการ `hello-ok.auth.deviceTokens` เพิ่มเติมคือ token ส่งต่อช่วงบูตสแตรป
  ให้บันทึกไว้เฉพาะเมื่อ connect ใช้การยืนยันตัวตนแบบบูตสแตรปบนทรานสปอร์ตที่เชื่อถือได้
  เช่น `wss://` หรือการจับคู่ผ่าน loopback/local
- หากไคลเอนต์ระบุ `deviceToken` หรือ `scopes` อย่าง **ชัดเจน** ชุด scope ที่ผู้เรียกขอ
  จะยังคงเป็นแหล่งอำนาจตัดสินใจหลัก scope ที่แคชไว้จะถูกใช้ซ้ำเฉพาะ
  เมื่อไคลเอนต์กำลังใช้ token ต่ออุปกรณ์ที่จัดเก็บไว้ซ้ำเท่านั้น
- device token สามารถหมุนเวียน/เพิกถอนได้ผ่าน `device.token.rotate` และ
  `device.token.revoke` (ต้องมี scope `operator.pairing`)
- `device.token.rotate` ส่งคืนข้อมูลเมทาดาทาการหมุนเวียน โดยจะ echo bearer token
  ตัวแทนกลับมาเฉพาะสำหรับการเรียกจากอุปกรณ์เดียวกันที่ยืนยันตัวตนด้วย
  device token นั้นอยู่แล้ว เพื่อให้ไคลเอนต์แบบ token-only บันทึกตัวแทนของตนก่อน
  เชื่อมต่อใหม่ได้ การหมุนเวียนแบบ shared/admin จะไม่ echo bearer token
- การออก token, การหมุนเวียน และการเพิกถอนยังคงถูกจำกัดไว้กับชุดบทบาทที่อนุมัติแล้ว
  ซึ่งบันทึกในรายการจับคู่ของอุปกรณ์นั้น การเปลี่ยนแปลง token ไม่สามารถขยายหรือ
  กำหนดเป้าหมายบทบาทอุปกรณ์ที่การอนุมัติการจับคู่ไม่เคยมอบให้ได้
- สำหรับเซสชัน token ของอุปกรณ์ที่จับคู่แล้ว การจัดการอุปกรณ์จะจำกัดอยู่กับตนเอง เว้นแต่
  ผู้เรียกจะมี `operator.admin` ด้วย: ผู้เรียกที่ไม่ใช่ผู้ดูแลระบบสามารถลบ/เพิกถอน/หมุนเวียน
  ได้เฉพาะรายการอุปกรณ์ **ของตนเอง** เท่านั้น
- `device.token.rotate` และ `device.token.revoke` ยังตรวจสอบชุด scope ของ operator token
  เป้าหมายเทียบกับ scope เซสชันปัจจุบันของผู้เรียกด้วย ผู้เรียกที่ไม่ใช่ผู้ดูแลระบบ
  ไม่สามารถหมุนเวียนหรือเพิกถอน operator token ที่กว้างกว่าที่ตนมีอยู่แล้วได้
- ความล้มเหลวในการยืนยันตัวตนมี `error.details.code` พร้อมคำแนะนำการกู้คืน:
  - `error.details.canRetryWithDeviceToken` (บูลีน)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- พฤติกรรมไคลเอนต์สำหรับ `AUTH_TOKEN_MISMATCH`:
  - ไคลเอนต์ที่เชื่อถือได้อาจลองใหม่แบบจำกัดหนึ่งครั้งด้วย token ต่ออุปกรณ์ที่แคชไว้
  - หากการลองใหม่นั้นล้มเหลว ไคลเอนต์ควรหยุดลูปเชื่อมต่อใหม่อัตโนมัติและแสดงคำแนะนำให้ operator ดำเนินการ

## ข้อมูลระบุตัวตนอุปกรณ์ + การจับคู่

- Node ควรมีข้อมูลระบุตัวตนอุปกรณ์ที่เสถียร (`device.id`) ซึ่งได้มาจาก
  ลายนิ้วมือของคู่กุญแจ
- Gateway ออก token ต่ออุปกรณ์ + บทบาท
- ต้องมีการอนุมัติการจับคู่สำหรับ ID อุปกรณ์ใหม่ เว้นแต่เปิดใช้การอนุมัติอัตโนมัติแบบ local
- การอนุมัติอัตโนมัติสำหรับการจับคู่มีศูนย์กลางอยู่ที่การเชื่อมต่อ local loopback โดยตรง
- OpenClaw ยังมีเส้นทาง self-connect แบบ backend/container-local ที่แคบสำหรับ
  โฟลว์ตัวช่วยแบบความลับที่ใช้ร่วมกันซึ่งเชื่อถือได้
- การเชื่อมต่อ same-host tailnet หรือ LAN ยังคงถูกถือว่าเป็นระยะไกลสำหรับการจับคู่และ
  ต้องได้รับอนุมัติ
- โดยปกติไคลเอนต์ WS จะส่งข้อมูลระบุตัวตน `device` ระหว่าง `connect` (operator +
  node) ข้อยกเว้น operator ที่ไม่มีอุปกรณ์มีเฉพาะเส้นทาง trust แบบระบุชัดเจน:
  - `gateway.controlUi.allowInsecureAuth=true` สำหรับความเข้ากันได้กับ HTTP ที่ไม่ปลอดภัยเฉพาะ localhost
  - การยืนยันตัวตน Control UI ของ operator ด้วย `gateway.auth.mode: "trusted-proxy"` ที่สำเร็จ
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ลดระดับความปลอดภัยอย่างรุนแรง)
  - RPC backend `gateway-client` ผ่าน direct-loopback ที่ยืนยันตัวตนด้วย token/password
    ของ Gateway ที่ใช้ร่วมกัน
- การเชื่อมต่อทั้งหมดต้องลงนาม nonce `connect.challenge` ที่เซิร์ฟเวอร์ให้มา

### การวินิจฉัยการย้ายข้อมูลการยืนยันตัวตนอุปกรณ์

สำหรับไคลเอนต์เดิมที่ยังใช้พฤติกรรมการลงนามแบบก่อนมี challenge ตอนนี้ `connect` จะส่งคืน
รหัสรายละเอียด `DEVICE_AUTH_*` ภายใต้ `error.details.code` พร้อม `error.details.reason` ที่เสถียร

ความล้มเหลวในการย้ายข้อมูลที่พบบ่อย:

| ข้อความ                     | details.code                     | details.reason           | ความหมาย                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | ไคลเอนต์ละเว้น `device.nonce` (หรือส่งค่าว่าง)     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | ไคลเอนต์ลงนามด้วย nonce ที่เก่า/ผิด            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | payload ลายเซ็นไม่ตรงกับ payload v2       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | timestamp ที่ลงนามอยู่นอกช่วง skew ที่อนุญาต          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` ไม่ตรงกับลายนิ้วมือ public key |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | รูปแบบ/canonicalization ของ public key ล้มเหลว         |

เป้าหมายการย้ายข้อมูล:

- รอ `connect.challenge` เสมอ
- ลงนาม payload v2 ที่รวม server nonce
- ส่ง nonce เดียวกันใน `connect.params.device.nonce`
- payload ลายเซ็นที่แนะนำคือ `v3` ซึ่งผูก `platform` และ `deviceFamily`
  เพิ่มเติมจากฟิลด์ device/client/role/scopes/token/nonce
- ลายเซ็น `v2` เดิมยังคงได้รับการยอมรับเพื่อความเข้ากันได้ แต่การตรึงเมทาดาทาอุปกรณ์ที่จับคู่แล้ว
  ยังควบคุมนโยบายคำสั่งเมื่อเชื่อมต่อใหม่

## TLS + การตรึง

- รองรับ TLS สำหรับการเชื่อมต่อ WS
- ไคลเอนต์อาจเลือกตรึงลายนิ้วมือใบรับรองของ Gateway ได้ (ดูการกำหนดค่า `gateway.tls`
  รวมถึง `gateway.remote.tlsFingerprint` หรือ CLI `--tls-fingerprint`)

## ขอบเขต

โปรโตคอลนี้เปิดเผย **API Gateway แบบเต็ม** (status, channels, models, chat,
agent, sessions, nodes, approvals และอื่นๆ) พื้นผิวที่แน่นอนถูกกำหนดโดย
สคีมา TypeBox ใน `src/gateway/protocol/schema.ts`

## ที่เกี่ยวข้อง

- [โปรโตคอล Bridge](/th/gateway/bridge-protocol)
- [runbook ของ Gateway](/th/gateway)
