---
read_when:
    - การเรียกใช้หรือดีบักกระบวนการ Gateway
summary: รันบุ๊กสำหรับบริการ Gateway วงจรชีวิต และการดำเนินงาน
title: คู่มือปฏิบัติการ Gateway
x-i18n:
    generated_at: "2026-05-06T09:13:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

ใช้หน้านี้สำหรับการเริ่มต้นใช้งานวันแรกและการดำเนินงานวันที่สองของบริการ Gateway

<CardGroup cols={2}>
  <Card title="การแก้ปัญหาเชิงลึก" icon="siren" href="/th/gateway/troubleshooting">
    การวินิจฉัยโดยเริ่มจากอาการ พร้อมลำดับคำสั่งและลายเซ็นล็อกที่แน่นอน
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    คู่มือตั้งค่าแบบมุ่งตามงาน + เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
  <Card title="การจัดการความลับ" icon="key-round" href="/th/gateway/secrets">
    สัญญา SecretRef, พฤติกรรมสแนปช็อตขณะรันไทม์ และการดำเนินการ migrate/reload
  </Card>
  <Card title="สัญญาแผนความลับ" icon="shield-check" href="/th/gateway/secrets-plan-contract">
    กฎ target/path ที่แน่นอนของ `secrets apply` และพฤติกรรม auth-profile แบบ ref-only
  </Card>
</CardGroup>

## การเริ่มต้นแบบโลคัลใน 5 นาที

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

ค่าพื้นฐานที่สุขภาพดี: `Runtime: running`, `Connectivity probe: ok` และ `Capability: ...` ที่ตรงกับสิ่งที่คุณคาดหวัง ใช้ `openclaw gateway status --require-rpc` เมื่อคุณต้องการหลักฐาน RPC ระดับขอบเขตการอ่าน ไม่ใช่แค่การเข้าถึงได้

  </Step>

  <Step title="ตรวจสอบความพร้อมของช่องทาง">

```bash
openclaw channels status --probe
```

เมื่อ Gateway เข้าถึงได้ คำสั่งนี้จะรันการตรวจสอบช่องทางแบบสดรายบัญชีและการตรวจสอบเสริม
หาก Gateway เข้าถึงไม่ได้ CLI จะถอยกลับไปใช้สรุปช่องทางจากการกำหนดค่าเท่านั้นแทน
ผลลัพธ์การตรวจสอบแบบสด

  </Step>
</Steps>

<Note>
การโหลด config ของ Gateway ใหม่จะเฝ้าดูพาธไฟล์ config ที่ใช้งานอยู่ (resolve จากค่าเริ่มต้นของ profile/state หรือ `OPENCLAW_CONFIG_PATH` เมื่อกำหนดไว้)
โหมดเริ่มต้นคือ `gateway.reload.mode="hybrid"`
หลังจากโหลดสำเร็จครั้งแรก โปรเซสที่กำลังรันจะให้บริการสแนปช็อต config ในหน่วยความจำที่ใช้งานอยู่ การโหลดใหม่ที่สำเร็จจะสลับสแนปช็อตนั้นแบบอะตอมิก
</Note>

## โมเดลรันไทม์

- โปรเซสที่ทำงานตลอดเวลาหนึ่งตัวสำหรับการกำหนดเส้นทาง, control plane และการเชื่อมต่อช่องทาง
- พอร์ตแบบมัลติเพล็กซ์เดียวสำหรับ:
  - WebSocket control/RPC
  - HTTP APIs ที่เข้ากันได้กับ OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI และ hooks
- โหมด bind เริ่มต้น: `loopback`
- โดยค่าเริ่มต้นต้องมี auth การตั้งค่าแบบ shared-secret ใช้
  `gateway.auth.token` / `gateway.auth.password` (หรือ
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) และการตั้งค่า reverse-proxy
  ที่ไม่ใช่ local loopback สามารถใช้ `gateway.auth.mode: "trusted-proxy"` ได้

## เอนด์พอยต์ที่เข้ากันได้กับ OpenAI

พื้นผิวความเข้ากันได้ที่ให้ประโยชน์สูงสุดของ OpenClaw ตอนนี้คือ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

เหตุผลที่ชุดนี้สำคัญ:

- การผสานรวม Open WebUI, LobeChat และ LibreChat ส่วนใหญ่จะ probe `/v1/models` ก่อน
- ไปป์ไลน์ RAG และหน่วยความจำจำนวนมากคาดหวัง `/v1/embeddings`
- ไคลเอนต์แบบ agent-native นิยมใช้ `/v1/responses` มากขึ้น

หมายเหตุการวางแผน:

- `/v1/models` เป็นแบบ agent-first: ส่งคืน `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
- `openclaw/default` คือ alias ที่เสถียรซึ่ง map ไปยัง agent เริ่มต้นที่กำหนดค่าไว้เสมอ
- ใช้ `x-openclaw-model` เมื่อคุณต้องการ override backend provider/model มิฉะนั้นโมเดลปกติและการตั้งค่า embedding ของ agent ที่เลือกจะยังคงควบคุมอยู่

ทั้งหมดนี้รันบนพอร์ต Gateway หลักและใช้ขอบเขต auth ของผู้ปฏิบัติการที่เชื่อถือได้เดียวกับส่วนอื่นของ Gateway HTTP API

### ลำดับความสำคัญของพอร์ตและ bind

| การตั้งค่า      | ลำดับการ resolve                                             |
| ------------ | ------------------------------------------------------------- |
| พอร์ต Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| โหมด bind    | CLI/override → `gateway.bind` → `loopback`                    |

บริการ Gateway ที่ติดตั้งแล้วจะบันทึก `--port` ที่ resolve แล้วไว้ในเมทาดาตาของ supervisor หลังจากเปลี่ยน `gateway.port` ให้รัน `openclaw doctor --fix` หรือ `openclaw gateway install --force` เพื่อให้ launchd/systemd/schtasks เริ่มโปรเซสบนพอร์ตใหม่

การเริ่มต้น Gateway ใช้พอร์ตและ bind ที่มีผลเดียวกันเมื่อ seed origin ของ
Control UI แบบโลคัลสำหรับ bind ที่ไม่ใช่ local loopback ตัวอย่างเช่น `--bind lan --port 3000`
จะ seed `http://localhost:3000` และ `http://127.0.0.1:3000` ก่อนที่การตรวจสอบ
รันไทม์จะทำงาน เพิ่ม origin ของเบราว์เซอร์ระยะไกลใดๆ เช่น URL ของ HTTPS proxy ลงใน
`gateway.controlUi.allowedOrigins` อย่างชัดเจน

### โหมด hot reload

| `gateway.reload.mode` | พฤติกรรม                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | ไม่โหลด config ใหม่                        |
| `hot`                 | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยต่อ hot   |
| `restart`             | รีสตาร์ตเมื่อมีการเปลี่ยนแปลงที่ต้อง reload |
| `hybrid` (ค่าเริ่มต้น)    | ใช้แบบ hot เมื่อปลอดภัย รีสตาร์ตเมื่อจำเป็น |

## ชุดคำสั่งของผู้ปฏิบัติการ

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

`gateway status --deep` ใช้สำหรับการค้นพบบริการเพิ่มเติม (LaunchDaemons/systemd system
units/schtasks) ไม่ใช่การตรวจสุขภาพ RPC ที่ลึกกว่า

## หลาย Gateway (โฮสต์เดียวกัน)

การติดตั้งส่วนใหญ่ควรรัน Gateway หนึ่งตัวต่อเครื่อง Gateway เดียวสามารถโฮสต์
agent และช่องทางได้หลายรายการ

คุณต้องมีหลาย Gateway เฉพาะเมื่อคุณตั้งใจต้องการการแยกหรือบอตกู้คืนเท่านั้น

การตรวจสอบที่มีประโยชน์:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

สิ่งที่คาดหวัง:

- `gateway status --deep` อาจรายงาน `Other gateway-like services detected (best effort)`
  และพิมพ์คำแนะนำการล้างข้อมูลเมื่อยังมีการติดตั้ง launchd/systemd/schtasks เก่าค้างอยู่
- `gateway probe` อาจเตือนเกี่ยวกับ `multiple reachable gateways` เมื่อมีเป้าหมายมากกว่าหนึ่งรายการ
  ตอบกลับ
- หากเป็นความตั้งใจ ให้แยกพอร์ต, config/state และราก workspace ต่อ Gateway

เช็กลิสต์ต่อ instance:

- `gateway.port` ไม่ซ้ำกัน
- `OPENCLAW_CONFIG_PATH` ไม่ซ้ำกัน
- `OPENCLAW_STATE_DIR` ไม่ซ้ำกัน
- `agents.defaults.workspace` ไม่ซ้ำกัน

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

จากนั้นเชื่อมต่อไคลเอนต์แบบโลคัลไปที่ `ws://127.0.0.1:18789`

<Warning>
SSH tunnel ไม่ข้าม auth ของ Gateway สำหรับ auth แบบ shared-secret ไคลเอนต์ยังคง
ต้องส่ง `token`/`password` แม้อยู่บน tunnel สำหรับโหมดที่มี identity
คำขอยังคงต้องผ่าน auth path นั้น
</Warning>

ดู: [Remote Gateway](/th/gateway/remote), [Authentication](/th/gateway/authentication), [Tailscale](/th/gateway/tailscale)

## การกำกับดูแลและวงจรชีวิตบริการ

ใช้การรันภายใต้การกำกับดูแลเพื่อความน่าเชื่อถือระดับใกล้เคียงโปรดักชัน

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

ใช้ `openclaw gateway restart` สำหรับการรีสตาร์ต อย่าต่อคำสั่ง `openclaw gateway stop` กับ `openclaw gateway start`; บน macOS, `gateway stop` จะปิดใช้งาน LaunchAgent ก่อนหยุดโดยตั้งใจ

ป้ายกำกับ LaunchAgent คือ `ai.openclaw.gateway` (ค่าเริ่มต้น) หรือ `ai.openclaw.<profile>` (profile ที่ตั้งชื่อ) `openclaw doctor` ตรวจสอบและซ่อมแซมการ drift ของ config บริการ

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

ตัวอย่าง user-unit แบบแมนนวลเมื่อคุณต้องการพาธติดตั้งแบบกำหนดเอง:

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

การเริ่มต้นแบบ managed ของ Windows native ใช้ Scheduled Task ชื่อ `OpenClaw Gateway`
(หรือ `OpenClaw Gateway (<profile>)` สำหรับ profile ที่ตั้งชื่อ) หากการสร้าง Scheduled Task
ถูกปฏิเสธ OpenClaw จะถอยกลับไปใช้ตัวเรียกใช้งานในโฟลเดอร์ Startup ต่อผู้ใช้
ซึ่งชี้ไปที่ `gateway.cmd` ภายในไดเรกทอรี state

  </Tab>

  <Tab title="Linux (system service)">

ใช้ system unit สำหรับโฮสต์แบบหลายผู้ใช้/ทำงานตลอดเวลา

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ใช้เนื้อหา service เดียวกับ user unit แต่ติดตั้งไว้ภายใต้
`/etc/systemd/system/openclaw-gateway[-<profile>].service` และปรับ
`ExecStart=` หาก binary `openclaw` ของคุณอยู่ที่อื่น

อย่าให้ `openclaw doctor --fix` ติดตั้งบริการ Gateway ระดับผู้ใช้สำหรับ profile/port เดียวกันด้วย Doctor จะปฏิเสธการติดตั้งอัตโนมัตินั้นเมื่อพบบริการ OpenClaw Gateway ระดับระบบ ใช้ `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system unit เป็นเจ้าของวงจรชีวิต

  </Tab>
</Tabs>

## เส้นทางด่วนสำหรับ dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

ค่าเริ่มต้นรวม state/config ที่แยกกันและพอร์ต Gateway ฐาน `19001`

## เอกสารอ้างอิงย่อของโปรโตคอล (มุมมองผู้ปฏิบัติการ)

- เฟรมแรกของไคลเอนต์ต้องเป็น `connect`
- Gateway ส่งคืนสแนปช็อต `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)
- `hello-ok.features.methods` / `events` เป็นรายการค้นพบแบบอนุรักษนิยม ไม่ใช่
  dump ที่สร้างขึ้นของทุก helper route ที่เรียกได้
- คำขอ: `req(method, params)` → `res(ok/payload|error)`
- อีเวนต์ทั่วไปประกอบด้วย `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, อีเวนต์วงจรชีวิต pairing/approval และ `shutdown`

การรัน agent มีสองขั้น:

1. ack ว่ายอมรับทันที (`status:"accepted"`)
2. การตอบกลับเสร็จสิ้นสุดท้าย (`status:"ok"|"error"`) โดยมีอีเวนต์ `agent` ที่สตรีมอยู่ระหว่างนั้น

ดูเอกสารโปรโตคอลฉบับเต็ม: [Gateway Protocol](/th/gateway/protocol)

## การตรวจสอบเชิงปฏิบัติการ

### Liveness

- เปิด WS และส่ง `connect`
- คาดหวังการตอบกลับ `hello-ok` พร้อมสแนปช็อต

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### การกู้คืนช่องว่าง

อีเวนต์จะไม่ถูก replay เมื่อมีช่องว่างของลำดับ ให้ refresh state (`health`, `system-presence`) ก่อนดำเนินการต่อ

## ลายเซ็นความล้มเหลวที่พบบ่อย

| ลายเซ็น                                                      | ปัญหาที่เป็นไปได้                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | bind ที่ไม่ใช่ local loopback โดยไม่มี auth path ของ Gateway ที่ถูกต้อง          |
| `another gateway instance is already listening` / `EADDRINUSE` | พอร์ตชนกัน                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | config ถูกตั้งเป็นโหมด remote หรือ stamp โหมด local หายไปจาก config ที่เสียหาย |
| `unauthorized` ระหว่าง connect                                  | auth ระหว่างไคลเอนต์กับ Gateway ไม่ตรงกัน                                        |

สำหรับลำดับการวินิจฉัยฉบับเต็ม ใช้ [Gateway Troubleshooting](/th/gateway/troubleshooting)

## การรับประกันความปลอดภัย

- ไคลเอนต์โปรโตคอล Gateway จะล้มเหลวอย่างรวดเร็วเมื่อ Gateway ไม่พร้อมใช้งาน (ไม่มีการถอยกลับไปใช้ช่องทางตรงโดยนัย)
- เฟรมแรกที่ไม่ถูกต้อง/ไม่ใช่การเชื่อมต่อจะถูกปฏิเสธและปิด
- การปิดระบบอย่างนุ่มนวลจะส่งเหตุการณ์ `shutdown` ก่อนปิดซ็อกเก็ต

---

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- [กระบวนการเบื้องหลัง](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [สถานะสุขภาพ](/th/gateway/health)
- [Doctor](/th/gateway/doctor)
- [การยืนยันตัวตน](/th/gateway/authentication)

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การจัดการความลับ](/th/gateway/secrets)
