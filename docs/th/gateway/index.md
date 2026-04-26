---
read_when:
    - การรันหรือการแก้ไขข้อบกพร่องของโปรเซส gateway
summary: คู่มือปฏิบัติการสำหรับบริการ Gateway วงจรชีวิต และการดำเนินงาน
title: คู่มือปฏิบัติการ Gateway
x-i18n:
    generated_at: "2026-04-26T11:29:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

ใช้หน้านี้สำหรับการเริ่มต้นใช้งานวันแรกและการปฏิบัติการในวันถัดไปของบริการ Gateway

<CardGroup cols={2}>
  <Card title="การแก้ไขปัญหาเชิงลึก" icon="siren" href="/th/gateway/troubleshooting">
    การวินิจฉัยโดยยึดตามอาการ พร้อมลำดับคำสั่งและลายเซ็น log แบบตรงตัว
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    คู่มือการตั้งค่าแบบเน้นงาน + ข้อมูลอ้างอิงการกำหนดค่าแบบเต็ม
  </Card>
  <Card title="การจัดการ secrets" icon="key-round" href="/th/gateway/secrets">
    สัญญา SecretRef, พฤติกรรม snapshot ของรันไทม์ และการดำเนินการย้าย/รีโหลด
  </Card>
  <Card title="สัญญาแผน secrets" icon="shield-check" href="/th/gateway/secrets-plan-contract">
    กฎ target/path ของ `secrets apply` แบบตรงตัว และพฤติกรรม auth-profile แบบอ้างอิงเท่านั้น
  </Card>
</CardGroup>

## การเริ่มต้นในเครื่องภายใน 5 นาที

<Steps>
  <Step title="เริ่มต้น Gateway">

```bash
openclaw gateway --port 18789
# mirror debug/trace ไปยัง stdio
openclaw gateway --port 18789 --verbose
# บังคับ kill ตัวฟังบนพอร์ตที่เลือก แล้วจึงเริ่มต้น
openclaw gateway --force
```

  </Step>

  <Step title="ตรวจสอบสถานะสุขภาพของบริการ">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

ค่าพื้นฐานเมื่อปกติ: `Runtime: running`, `Connectivity probe: ok` และ `Capability: ...` ที่ตรงกับสิ่งที่คุณคาดไว้ ใช้ `openclaw gateway status --require-rpc` เมื่อต้องการหลักฐาน RPC ระดับสิทธิ์อ่าน ไม่ใช่เพียงการเข้าถึงได้เท่านั้น

  </Step>

  <Step title="ตรวจสอบความพร้อมของช่องทาง">

```bash
openclaw channels status --probe
```

เมื่อเข้าถึง gateway ได้ คำสั่งนี้จะรันการ probe ช่องทางแบบ live แยกรายบัญชีและการตรวจสอบเพิ่มเติมตามต้องการ
หากเข้าถึง gateway ไม่ได้ CLI จะ fallback ไปใช้สรุปช่องทางจาก config เท่านั้น
แทนเอาต์พุต probe แบบ live

  </Step>
</Steps>

<Note>
การรีโหลด config ของ Gateway จะเฝ้าดูพาธไฟล์ config ที่ active (resolve จากค่าเริ่มต้นของ profile/state หรือ `OPENCLAW_CONFIG_PATH` เมื่อมีการตั้งค่า)
โหมดเริ่มต้นคือ `gateway.reload.mode="hybrid"`
หลังจากโหลดสำเร็จครั้งแรก โปรเซสที่กำลังรันจะให้บริการ snapshot config ในหน่วยความจำที่ active; การรีโหลดที่สำเร็จจะสลับ snapshot นั้นแบบอะตอมมิก
</Note>

## โมเดลรันไทม์

- หนึ่งโปรเซสที่ทำงานตลอดเวลาสำหรับ routing, control plane และการเชื่อมต่อช่องทาง
- พอร์ต multiplexed เดียวสำหรับ:
  - WebSocket control/RPC
  - HTTP APIs, รองรับแบบ OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI และ hooks
- โหมด bind เริ่มต้น: `loopback`
- ต้องมี auth เป็นค่าเริ่มต้น การตั้งค่าแบบ shared-secret ใช้
  `gateway.auth.token` / `gateway.auth.password` (หรือ
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) และการตั้งค่า
  reverse-proxy แบบ non-loopback สามารถใช้ `gateway.auth.mode: "trusted-proxy"` ได้

## endpoints ที่รองรับแบบ OpenAI

พื้นผิวความเข้ากันได้ที่มี leverage สูงที่สุดของ OpenClaw ตอนนี้คือ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

เหตุผลที่ชุดนี้สำคัญ:

- การผสานรวม Open WebUI, LobeChat และ LibreChat ส่วนใหญ่จะ probe `/v1/models` ก่อน
- pipeline แบบ RAG และ memory จำนวนมากคาดหวัง `/v1/embeddings`
- ไคลเอนต์ที่เน้นเอเจนต์แบบเนทีฟเริ่มเลือกใช้ `/v1/responses` มากขึ้น

หมายเหตุด้านการวางแผน:

- `/v1/models` เป็นแบบ agent-first: จะส่งคืน `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
- `openclaw/default` คือ alias แบบเสถียรที่แมปไปยังเอเจนต์เริ่มต้นที่กำหนดค่าไว้เสมอ
- ใช้ `x-openclaw-model` เมื่อต้องการแทนที่ backend provider/model; มิฉะนั้นการตั้งค่าโมเดลและ embedding ปกติของเอเจนต์ที่เลือกจะยังคงเป็นตัวควบคุม

ทั้งหมดนี้รันบนพอร์ตหลักของ Gateway และใช้ขอบเขต auth ของ trusted operator เดียวกันกับ HTTP API ส่วนที่เหลือของ Gateway

### ลำดับความสำคัญของพอร์ตและ bind

| Setting      | ลำดับการ resolve |
| ------------ | ---------------- |
| พอร์ต Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| โหมด bind    | CLI/override → `gateway.bind` → `loopback` |

การเริ่มต้น Gateway ใช้พอร์ตและ bind ที่มีผลจริงแบบเดียวกันเมื่อสร้าง local
Control UI origins สำหรับ bind แบบ non-loopback ตัวอย่างเช่น `--bind lan --port 3000`
จะสร้าง `http://localhost:3000` และ `http://127.0.0.1:3000` ก่อนที่การตรวจสอบขณะรัน
จะเริ่มขึ้น เพิ่ม origins ของเบราว์เซอร์ระยะไกล เช่น HTTPS proxy URLs ลงใน
`gateway.controlUi.allowedOrigins` อย่างชัดเจน

### โหมด hot reload

| `gateway.reload.mode` | พฤติกรรม |
| --------------------- | --------- |
| `off`                 | ไม่รีโหลด config |
| `hot`                 | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยต่อ hot |
| `restart`             | รีสตาร์ตเมื่อมีการเปลี่ยนแปลงที่ต้องรีโหลด |
| `hybrid` (ค่าเริ่มต้น)    | ใช้แบบ hot เมื่อปลอดภัย และรีสตาร์ตเมื่อจำเป็น |

## ชุดคำสั่ง operator

```bash
openclaw gateway status
openclaw gateway status --deep   # เพิ่มการสแกนบริการระดับระบบ
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` ใช้สำหรับการค้นหาบริการเพิ่มเติม (LaunchDaemons/systemd system
units/schtasks) ไม่ใช่การ probe สุขภาพ RPC ที่ลึกขึ้น

## หลาย Gateway (โฮสต์เดียวกัน)

การติดตั้งส่วนใหญ่ควรรันหนึ่ง gateway ต่อหนึ่งเครื่อง Gateway เดียวสามารถโฮสต์หลาย
agents และ channels ได้

คุณจำเป็นต้องมีหลาย gateway ก็ต่อเมื่อคุณต้องการการแยกออกจากกันหรือ rescue bot โดยตั้งใจเท่านั้น

การตรวจสอบที่มีประโยชน์:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

สิ่งที่ควรคาดหวัง:

- `gateway status --deep` อาจรายงาน `Other gateway-like services detected (best effort)`
  และพิมพ์คำแนะนำการ cleanup เมื่อยังมีการติดตั้ง launchd/systemd/schtasks เก่าค้างอยู่
- `gateway probe` อาจเตือนว่า `multiple reachable gateways` เมื่อมีมากกว่าหนึ่งเป้าหมาย
  ที่ตอบกลับ
- หากเป็นสิ่งที่ตั้งใจไว้ ให้แยกพอร์ต, config/state และรากของ workspace ต่อ gateway

เช็กลิสต์ต่อหนึ่งอินสแตนซ์:

- `gateway.port` ต้องไม่ซ้ำกัน
- `OPENCLAW_CONFIG_PATH` ต้องไม่ซ้ำกัน
- `OPENCLAW_STATE_DIR` ต้องไม่ซ้ำกัน
- `agents.defaults.workspace` ต้องไม่ซ้ำกัน

ตัวอย่าง:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

การตั้งค่าโดยละเอียด: [/gateway/multiple-gateways](/th/gateway/multiple-gateways)

## endpoint สมองแบบเรียลไทม์ของ VoiceClaw

OpenClaw เปิดเผย endpoint WebSocket แบบเรียลไทม์ที่เข้ากันได้กับ VoiceClaw ที่
`/voiceclaw/realtime` ใช้เมื่อต้องการให้ไคลเอนต์เดสก์ท็อป VoiceClaw คุย
โดยตรงกับสมอง OpenClaw แบบเรียลไทม์แทนการผ่านโปรเซส relay แยกต่างหาก

endpoint นี้ใช้ Gemini Live สำหรับเสียงแบบเรียลไทม์และเรียก OpenClaw เป็น
สมองโดยเปิดเผยเครื่องมือ OpenClaw ให้ Gemini Live โดยตรง การเรียกเครื่องมือจะส่งผลลัพธ์
`working` กลับทันทีเพื่อให้เทิร์นเสียงยังคงตอบสนองได้ จากนั้น OpenClaw จะรันเครื่องมือ
จริงแบบอะซิงโครนัสและแทรกผลลัพธ์กลับเข้าไปใน live session ตั้งค่า `GEMINI_API_KEY`
ใน environment ของโปรเซส gateway หากเปิดใช้ gateway auth ไคลเอนต์เดสก์ท็อปจะส่ง
gateway token หรือ password ในข้อความ `session.config` แรกของมัน

การเข้าถึงสมองแบบเรียลไทม์จะรันคำสั่งเอเจนต์ OpenClaw ที่เจ้าของอนุญาต จำกัด
`gateway.auth.mode: "none"` ไว้เฉพาะอินสแตนซ์ทดสอบแบบ loopback เท่านั้น การเชื่อมต่อ
สมองแบบเรียลไทม์จากภายนอกต้องใช้ gateway auth

สำหรับ gateway ทดสอบแบบแยก ให้รันอินสแตนซ์แยกพร้อมพอร์ต, config และ state ของตัวเอง:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

จากนั้นกำหนดค่า VoiceClaw ให้ใช้:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## การเข้าถึงระยะไกล

แนะนำ: Tailscale/VPN
ทางเลือกสำรอง: SSH tunnel

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

จากนั้นเชื่อมต่อไคลเอนต์ในเครื่องไปที่ `ws://127.0.0.1:18789`

<Warning>
SSH tunnels ไม่ได้ข้าม gateway auth สำหรับ auth แบบ shared-secret ไคลเอนต์ยังคง
ต้องส่ง `token`/`password` แม้จะผ่าน tunnel ก็ตาม สำหรับโหมดที่มีข้อมูลประจำตัว
คำขอยังคงต้องผ่านเส้นทาง auth นั้น
</Warning>

ดู: [Remote Gateway](/th/gateway/remote), [Authentication](/th/gateway/authentication), [Tailscale](/th/gateway/tailscale)

## การกำกับดูแลและวงจรชีวิตของบริการ

ใช้การรันแบบมีตัวกำกับดูแลเพื่อความเชื่อถือได้ในระดับ production

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

ใช้ `openclaw gateway restart` สำหรับการรีสตาร์ต อย่าต่อ `openclaw gateway stop` และ `openclaw gateway start` เข้าด้วยกัน; บน macOS `gateway stop` จะปิด LaunchAgent โดยตั้งใจก่อนหยุดมัน

label ของ LaunchAgent คือ `ai.openclaw.gateway` (ค่าเริ่มต้น) หรือ `ai.openclaw.<profile>` (named profile) `openclaw doctor` จะตรวจสอบและซ่อมแซม config drift ของบริการ

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

หากต้องการให้คงอยู่หลัง logout ให้เปิดใช้ lingering:

```bash
sudo loginctl enable-linger <user>
```

ตัวอย่าง user-unit แบบกำหนดเองเมื่อคุณต้องการพาธติดตั้งเฉพาะ:

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

การเริ่มต้นแบบจัดการโดยระบบของ Windows แบบ native ใช้ Scheduled Task ชื่อ `OpenClaw Gateway`
(หรือ `OpenClaw Gateway (<profile>)` สำหรับ named profiles) หากถูกปฏิเสธการสร้าง Scheduled Task
OpenClaw จะ fallback ไปใช้ตัวเปิดแบบ per-user ใน Startup folder ที่ชี้ไปยัง `gateway.cmd` ภายใน state directory

  </Tab>

  <Tab title="Linux (system service)">

ใช้ system unit สำหรับโฮสต์แบบหลายผู้ใช้/เปิดตลอดเวลา

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ใช้เนื้อหา service เดียวกับ user unit แต่ติดตั้งไว้ใต้
`/etc/systemd/system/openclaw-gateway[-<profile>].service` และปรับ
`ExecStart=` หากไบนารี `openclaw` ของคุณอยู่ที่อื่น

  </Tab>
</Tabs>

## เส้นทางด่วนสำหรับ dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

ค่าเริ่มต้นจะรวม state/config ที่แยกออกจากกันและพอร์ต gateway พื้นฐาน `19001`

## ข้อมูลอ้างอิงโปรโตคอลแบบย่อ (มุมมอง operator)

- เฟรมแรกของไคลเอนต์ต้องเป็น `connect`
- Gateway ส่งคืน snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)
- `hello-ok.features.methods` / `events` เป็นรายการค้นพบแบบอนุรักษ์นิยม ไม่ใช่
  รายการที่สร้างอัตโนมัติของทุก helper route ที่เรียกได้
- คำขอ: `req(method, params)` → `res(ok/payload|error)`
- events ที่พบบ่อยได้แก่ `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, events ของวงจรชีวิต pairing/approval และ `shutdown`

การรันเอเจนต์มีสองขั้นตอน:

1. accepted ack ทันที (`status:"accepted"`)
2. การตอบกลับตอนเสร็จสิ้นขั้นสุดท้าย (`status:"ok"|"error"`), พร้อม streamed `agent` events ระหว่างทาง

ดูเอกสารโปรโตคอลฉบับเต็ม: [Gateway Protocol](/th/gateway/protocol)

## การตรวจสอบเชิงปฏิบัติการ

### Liveness

- เปิด WS และส่ง `connect`
- ควรได้รับการตอบกลับ `hello-ok` พร้อม snapshot

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### การกู้คืนช่องว่าง

events จะไม่ถูก replay เมื่อเกิด sequence gaps ให้รีเฟรช state (`health`, `system-presence`) ก่อนดำเนินการต่อ

## ลายเซ็นความล้มเหลวที่พบบ่อย

| ลายเซ็น | ปัญหาที่น่าจะเป็น |
| ------- | ------------------ |
| `refusing to bind gateway ... without auth` | bind แบบ non-loopback โดยไม่มีเส้นทาง gateway auth ที่ถูกต้อง |
| `another gateway instance is already listening` / `EADDRINUSE` | พอร์ตชนกัน |
| `Gateway start blocked: set gateway.mode=local` | config ถูกตั้งเป็นโหมด remote หรือ local-mode stamp หายไปจาก config ที่เสียหาย |
| `unauthorized` during connect | auth ระหว่างไคลเอนต์กับ gateway ไม่ตรงกัน |

สำหรับลำดับการวินิจฉัยแบบเต็ม ให้ใช้ [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)

## การรับประกันด้านความปลอดภัย

- ไคลเอนต์โปรโตคอล Gateway จะล้มเหลวอย่างรวดเร็วเมื่อ Gateway ไม่พร้อมใช้งาน (ไม่มี direct-channel fallback แบบอัตโนมัติ)
- เฟรมแรกที่ไม่ถูกต้อง/ไม่ใช่ connect จะถูกปฏิเสธและปิดการเชื่อมต่อ
- การปิดระบบแบบ graceful จะส่ง event `shutdown` ก่อนปิด socket

---

ที่เกี่ยวข้อง:

- [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- [Background Process](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Health](/th/gateway/health)
- [Doctor](/th/gateway/doctor)
- [Authentication](/th/gateway/authentication)

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การจัดการ secrets](/th/gateway/secrets)
