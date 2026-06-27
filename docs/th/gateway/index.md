---
read_when:
    - การเรียกใช้หรือดีบักกระบวนการ Gateway
summary: คู่มือปฏิบัติการสำหรับบริการ Gateway วงจรชีวิต และการดำเนินงาน
title: คู่มือปฏิบัติการ Gateway
x-i18n:
    generated_at: "2026-06-27T17:34:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

ใช้หน้านี้สำหรับการเริ่มต้นวันแรกและการปฏิบัติการวันที่สองของบริการ Gateway

<CardGroup cols={2}>
  <Card title="การแก้ปัญหาเชิงลึก" icon="siren" href="/th/gateway/troubleshooting">
    การวินิจฉัยตามอาการก่อน พร้อมลำดับคำสั่งที่แน่นอนและรูปแบบลายเซ็นของล็อก
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    คู่มือตั้งค่าตามงาน + เอกสารอ้างอิงการกำหนดค่าแบบครบถ้วน
  </Card>
  <Card title="การจัดการความลับ" icon="key-round" href="/th/gateway/secrets">
    สัญญา SecretRef, พฤติกรรมสแนปช็อตขณะรันไทม์ และการดำเนินการย้าย/โหลดใหม่
  </Card>
  <Card title="สัญญาแผนความลับ" icon="shield-check" href="/th/gateway/secrets-plan-contract">
    กฎเป้าหมาย/พาธของ `secrets apply` ที่แน่นอน และพฤติกรรมโปรไฟล์การยืนยันตัวตนแบบ ref-only
  </Card>
</CardGroup>

## การเริ่มต้นในเครื่องภายใน 5 นาที

<Steps>
  <Step title="เริ่ม Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="ตรวจสอบสุขภาพของบริการ">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

ค่าพื้นฐานที่ดี: `Runtime: running`, `Connectivity probe: ok` และ `Capability: ...` ที่ตรงกับสิ่งที่คุณคาดไว้ ใช้ `openclaw gateway status --require-rpc` เมื่อคุณต้องการหลักฐาน RPC ในขอบเขตการอ่าน ไม่ใช่แค่การเข้าถึงได้

  </Step>

  <Step title="ตรวจสอบความพร้อมของช่องทาง">

```bash
openclaw channels status --probe
```

เมื่อ Gateway เข้าถึงได้ คำสั่งนี้จะรันการตรวจสอบช่องทางแบบสดต่อบัญชีและการตรวจสอบเพิ่มเติมที่เป็นตัวเลือก
หาก Gateway เข้าถึงไม่ได้ CLI จะถอยกลับไปใช้สรุปช่องทางจากการกำหนดค่าเท่านั้นแทน
ผลลัพธ์การตรวจสอบแบบสด

  </Step>
</Steps>

<Note>
การโหลดการกำหนดค่า Gateway ใหม่จะเฝ้าดูพาธไฟล์การกำหนดค่าที่ใช้งานอยู่ (แก้จากค่าเริ่มต้นของโปรไฟล์/สถานะ หรือ `OPENCLAW_CONFIG_PATH` เมื่อกำหนดไว้)
โหมดเริ่มต้นคือ `gateway.reload.mode="hybrid"`
หลังจากโหลดสำเร็จครั้งแรก กระบวนการที่กำลังรันจะให้บริการสแนปช็อตการกำหนดค่าในหน่วยความจำที่ใช้งานอยู่; การโหลดใหม่ที่สำเร็จจะสลับสแนปช็อตนั้นแบบอะตอมิก
</Note>

## โมเดลรันไทม์

- กระบวนการที่เปิดตลอดหนึ่งกระบวนการสำหรับการกำหนดเส้นทาง, control plane และการเชื่อมต่อช่องทาง
- พอร์ตเดียวแบบ multiplex สำหรับ:
  - การควบคุม/RPC ผ่าน WebSocket
  - HTTP APIs (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - เส้นทาง HTTP ของ Plugin เช่น `/api/v1/admin/rpc` ที่เป็นตัวเลือก
  - Control UI และ hook
- โหมด bind เริ่มต้น: `loopback`
- ต้องมีการยืนยันตัวตนโดยค่าเริ่มต้น การตั้งค่าแบบ shared-secret ใช้
  `gateway.auth.token` / `gateway.auth.password` (หรือ
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) และการตั้งค่า reverse-proxy
  แบบ non-loopback สามารถใช้ `gateway.auth.mode: "trusted-proxy"` ได้

## เอนด์พอยต์ที่เข้ากันได้กับ OpenAI

พื้นผิวความเข้ากันได้ที่ให้ประโยชน์สูงสุดของ OpenClaw ตอนนี้คือ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

เหตุผลที่ชุดนี้สำคัญ:

- การผสานรวม Open WebUI, LobeChat และ LibreChat ส่วนใหญ่มักตรวจสอบ `/v1/models` ก่อน
- pipeline ของ RAG และหน่วยความจำจำนวนมากคาดหวัง `/v1/embeddings`
- ไคลเอนต์แบบ agent-native นิยมใช้ `/v1/responses` มากขึ้น

หมายเหตุการวางแผน:

- `/v1/models` ให้ความสำคัญกับเอเจนต์ก่อน: ส่งคืน `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
- `openclaw/default` เป็น alias ที่เสถียรซึ่งแมปไปยังเอเจนต์เริ่มต้นที่กำหนดค่าไว้เสมอ
- ใช้ `x-openclaw-model` เมื่อคุณต้องการ override provider/model ของ backend; มิฉะนั้น การตั้งค่าโมเดลและ embedding ปกติของเอเจนต์ที่เลือกจะยังคงควบคุมอยู่

ทั้งหมดนี้รันบนพอร์ต Gateway หลักและใช้ขอบเขตการยืนยันตัวตนของผู้ปฏิบัติการที่เชื่อถือได้เดียวกันกับส่วนที่เหลือของ Gateway HTTP API

Admin HTTP RPC (`POST /api/v1/admin/rpc`) เป็นเส้นทาง Plugin แยกต่างหากที่ปิดโดยค่าเริ่มต้น สำหรับเครื่องมือโฮสต์ที่ใช้ WebSocket RPC ไม่ได้ ดู [Admin HTTP RPC](/th/plugins/admin-http-rpc)

### ลำดับความสำคัญของพอร์ตและ bind

| การตั้งค่า | ลำดับการแก้ค่า |
| ------------ | ------------------------------------------------------------- |
| พอร์ต Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| โหมด Bind | CLI/override → `gateway.bind` → `loopback` |

บริการ Gateway ที่ติดตั้งแล้วจะบันทึก `--port` ที่แก้ค่าแล้วไว้ใน metadata ของ supervisor หลังจากเปลี่ยน `gateway.port` ให้รัน `openclaw doctor --fix` หรือ `openclaw gateway install --force` เพื่อให้ launchd/systemd/schtasks เริ่มกระบวนการบนพอร์ตใหม่

การเริ่มต้น Gateway ใช้พอร์ตและ bind ที่มีผลเดียวกันเมื่อ seed origin ของ
Control UI ในเครื่องสำหรับ bind แบบ non-loopback ตัวอย่างเช่น `--bind lan --port 3000`
จะ seed `http://localhost:3000` และ `http://127.0.0.1:3000` ก่อนที่การตรวจสอบ
รันไทม์จะรัน เพิ่ม origin ของเบราว์เซอร์ระยะไกล เช่น HTTPS proxy URLs ลงใน
`gateway.controlUi.allowedOrigins` อย่างชัดเจน

### โหมด hot reload

| `gateway.reload.mode` | พฤติกรรม |
| --------------------- | ------------------------------------------ |
| `off` | ไม่มีการโหลดการกำหนดค่าใหม่ |
| `hot` | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยสำหรับ hot reload |
| `restart` | รีสตาร์ตเมื่อมีการเปลี่ยนแปลงที่ต้องโหลดใหม่ด้วยการรีสตาร์ต |
| `hybrid` (ค่าเริ่มต้น) | ใช้ hot-apply เมื่อปลอดภัย และรีสตาร์ตเมื่อจำเป็น |

## ชุดคำสั่งสำหรับผู้ปฏิบัติการ

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` ใช้สำหรับการค้นพบบริการเพิ่มเติม (LaunchDaemons/หน่วย systemd system
/schtasks) ไม่ใช่การตรวจสอบสุขภาพ RPC ที่ลึกขึ้น

## Gateway หลายตัว (โฮสต์เดียวกัน)

การติดตั้งส่วนใหญ่ควรรันหนึ่ง Gateway ต่อเครื่อง Gateway เดียวสามารถโฮสต์
เอเจนต์และช่องทางได้หลายรายการ

คุณต้องมี Gateway หลายตัวเฉพาะเมื่อคุณตั้งใจต้องการการแยกส่วนหรือบอทกู้คืน

การตรวจสอบที่มีประโยชน์:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

สิ่งที่คาดหวัง:

- `gateway status --deep` อาจรายงาน `Other gateway-like services detected (best effort)`
  และพิมพ์คำแนะนำการล้างข้อมูลเมื่อยังมีการติดตั้ง launchd/systemd/schtasks เก่าค้างอยู่
- `gateway probe` อาจเตือนเกี่ยวกับ `multiple reachable gateway identities` เมื่อ Gateway
  ที่แตกต่างกันตอบกลับ หรือเมื่อ OpenClaw พิสูจน์ไม่ได้ว่าเป้าหมายที่เข้าถึงได้เป็น Gateway เดียวกัน
  SSH tunnel, proxy URL หรือ URL ระยะไกลที่กำหนดค่าไว้ไปยัง Gateway เดียวกันนับเป็น
  Gateway เดียวที่มีหลาย transport แม้พอร์ต transport จะแตกต่างกัน
- หากเป็นความตั้งใจ ให้แยกพอร์ต, config/state และ workspace root ต่อ Gateway

รายการตรวจสอบต่อ instance:

- `gateway.port` ที่ไม่ซ้ำกัน
- `OPENCLAW_CONFIG_PATH` ที่ไม่ซ้ำกัน
- `OPENCLAW_STATE_DIR` ที่ไม่ซ้ำกัน
- `agents.defaults.workspace` ที่ไม่ซ้ำกัน

ตัวอย่าง:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

การตั้งค่าโดยละเอียด: [/gateway/multiple-gateways](/th/gateway/multiple-gateways)

## การเข้าถึงระยะไกล

แนะนำ: Tailscale/VPN
ทางเลือกสำรอง: SSH tunnel

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

จากนั้นเชื่อมต่อไคลเอนต์ภายในเครื่องไปที่ `ws://127.0.0.1:18789`

<Warning>
SSH tunnels ไม่ได้ข้ามการยืนยันตัวตนของ Gateway สำหรับการยืนยันตัวตนแบบ shared-secret ไคลเอนต์ยังคง
ต้องส่ง `token`/`password` แม้ผ่าน tunnel สำหรับโหมดที่มีข้อมูลประจำตัว
คำขอยังคงต้องผ่านพาธการยืนยันตัวตนนั้น
</Warning>

ดู: [Remote Gateway](/th/gateway/remote), [Authentication](/th/gateway/authentication), [Tailscale](/th/gateway/tailscale)

## การควบคุมดูแลและวงจรชีวิตบริการ

ใช้การรันแบบมี supervisor เพื่อความน่าเชื่อถือระดับใกล้ production

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

ใช้ `openclaw gateway restart` สำหรับการรีสตาร์ต อย่าต่อคำสั่ง `openclaw gateway stop` และ `openclaw gateway start` เพื่อใช้แทนการรีสตาร์ต

บน macOS, `gateway stop` ใช้ `launchctl bootout` โดยค่าเริ่มต้น — การดำเนินการนี้ลบ LaunchAgent ออกจากเซสชันบูตปัจจุบันโดยไม่บันทึกการปิดใช้งานถาวร ดังนั้นการกู้คืนอัตโนมัติของ KeepAlive ยังทำงานหลังจากเกิดการล่มที่ไม่คาดคิด และ `gateway start` เปิดใช้งานใหม่ได้อย่างสะอาด หากต้องการระงับการเกิดใหม่อัตโนมัติข้ามการรีบูตแบบถาวร ให้ส่ง `--disable`: `openclaw gateway stop --disable`

label ของ LaunchAgent คือ `ai.openclaw.gateway` (ค่าเริ่มต้น) หรือ `ai.openclaw.<profile>` (โปรไฟล์ที่มีชื่อ) `openclaw doctor` ตรวจสอบและซ่อมแซมความคลาดเคลื่อนของการกำหนดค่าบริการ

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

เพื่อให้คงอยู่หลังออกจากระบบ ให้เปิดใช้ lingering:

```bash
sudo loginctl enable-linger <user>
```

ตัวอย่าง user-unit แบบ manual เมื่อคุณต้องการพาธติดตั้งที่กำหนดเอง:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

การเริ่มต้นที่จัดการโดย Windows native ใช้ Scheduled Task ชื่อ `OpenClaw Gateway`
(หรือ `OpenClaw Gateway (<profile>)` สำหรับโปรไฟล์ที่มีชื่อ) หากการสร้าง Scheduled Task
ถูกปฏิเสธ OpenClaw จะถอยกลับไปใช้ตัวเรียกจาก Startup-folder ต่อผู้ใช้
ที่ชี้ไปยัง `gateway.cmd` ภายในไดเรกทอรีสถานะ

  </Tab>

  <Tab title="Linux (system service)">

ใช้ system unit สำหรับโฮสต์แบบหลายผู้ใช้/เปิดตลอดเวลา

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ใช้เนื้อหา service เดียวกับ user unit แต่ติดตั้งไว้ใต้
`/etc/systemd/system/openclaw-gateway[-<profile>].service` และปรับ
`ExecStart=` หาก binary `openclaw` ของคุณอยู่ที่อื่น

อย่าให้ `openclaw doctor --fix` ติดตั้งบริการ Gateway ระดับผู้ใช้สำหรับโปรไฟล์/พอร์ตเดียวกันด้วย Doctor จะปฏิเสธการติดตั้งอัตโนมัตินั้นเมื่อพบบริการ OpenClaw Gateway ระดับระบบ; ใช้ `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system unit เป็นเจ้าของวงจรชีวิต

  </Tab>
</Tabs>

## เส้นทางด่วนสำหรับโปรไฟล์ Dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

ค่าเริ่มต้นรวมถึง state/config ที่แยกไว้ และพอร์ต Gateway พื้นฐาน `19001`

## เอกสารอ้างอิงย่อของโปรโตคอล (มุมมองผู้ปฏิบัติการ)

- เฟรมแรกของไคลเอนต์ต้องเป็น `connect`
- Gateway ส่งคืนสแนปช็อต `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)
- `hello-ok.features.methods` / `events` เป็นรายการค้นพบแบบอนุรักษ์นิยม ไม่ใช่
  dump ที่สร้างจากทุกเส้นทาง helper ที่เรียกได้
- คำขอ: `req(method, params)` → `res(ok/payload|error)`
- เหตุการณ์ทั่วไปประกอบด้วย `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `sessions.changed`,
  `presence`, `tick`, `health`, `heartbeat`, เหตุการณ์วงจรชีวิตการจับคู่/การอนุมัติ
  และ `shutdown`

การรันเอเจนต์มีสองขั้นตอน:

1. ack ยอมรับทันที (`status:"accepted"`)
2. การตอบกลับเมื่อเสร็จสิ้นสุดท้าย (`status:"ok"|"error"`) พร้อมเหตุการณ์ `agent` แบบสตรีมระหว่างทาง

ดูเอกสารโปรโตคอลฉบับเต็ม: [Gateway Protocol](/th/gateway/protocol)

## การตรวจสอบการปฏิบัติการ

### ความมีชีวิต

- เปิด WS และส่ง `connect`
- คาดหวังการตอบกลับ `hello-ok` พร้อมสแนปช็อต

### ความพร้อม

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### การกู้คืนช่องว่าง

เหตุการณ์จะไม่ถูก replay เมื่อมีช่องว่างของลำดับ ให้รีเฟรชสถานะ (`health`, `system-presence`) ก่อนดำเนินการต่อ

## รูปแบบความล้มเหลวที่พบบ่อย

| ลายเซ็น                                                       | ปัญหาที่เป็นไปได้                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | ผูกกับที่อยู่ที่ไม่ใช่ loopback โดยไม่มีพาธการยืนยันตัวตนของ Gateway ที่ถูกต้อง |
| `another gateway instance is already listening` / `EADDRINUSE` | พอร์ตขัดแย้ง                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | ตั้งค่าคอนฟิกเป็นโหมดระยะไกล หรือสแตมป์โหมด local หายไปจากคอนฟิกที่เสียหาย |
| `unauthorized` during connect                                  | การยืนยันตัวตนไม่ตรงกันระหว่างไคลเอนต์กับ Gateway                            |

สำหรับลำดับขั้นการวินิจฉัยแบบครบถ้วน ให้ใช้ [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)

## การรับประกันด้านความปลอดภัย

- ไคลเอนต์โปรโตคอล Gateway ล้มเหลวอย่างรวดเร็วเมื่อ Gateway ไม่พร้อมใช้งาน (ไม่มี fallback ไปยัง direct-channel โดยนัย)
- เฟรมแรกที่ไม่ถูกต้องหรือไม่ใช่การเชื่อมต่อจะถูกปฏิเสธและปิด
- การปิดระบบอย่างนุ่มนวลจะปล่อยเหตุการณ์ `shutdown` ก่อนปิดซ็อกเก็ต

---

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- [กระบวนการเบื้องหลัง](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [สุขภาพ](/th/gateway/health)
- [Doctor](/th/gateway/doctor)
- [การยืนยันตัวตน](/th/gateway/authentication)

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การจัดการความลับ](/th/gateway/secrets)
