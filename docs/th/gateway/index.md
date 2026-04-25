---
read_when:
    - การรันหรือดีบักโปรเซส Gateway
summary: คู่มือปฏิบัติการสำหรับบริการ Gateway, วงจรชีวิต และการดำเนินงาน
title: คู่มือปฏิบัติการ Gateway
x-i18n:
    generated_at: "2026-04-25T13:48:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

ใช้หน้านี้สำหรับการเริ่มต้นใช้งานวันแรกและการปฏิบัติงานวันถัดไปของบริการ Gateway

<CardGroup cols={2}>
  <Card title="การแก้ปัญหาเชิงลึก" icon="siren" href="/th/gateway/troubleshooting">
    การวินิจฉัยโดยยึดตามอาการ พร้อมลำดับคำสั่งที่แน่นอนและลายเซ็นในบันทึก
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    คู่มือการตั้งค่าแบบอิงงาน + เอกสารอ้างอิงการกำหนดค่าแบบเต็ม
  </Card>
  <Card title="การจัดการความลับ" icon="key-round" href="/th/gateway/secrets">
    สัญญา SecretRef, พฤติกรรม runtime snapshot และการดำเนินการย้าย/รีโหลด
  </Card>
  <Card title="สัญญาแผนความลับ" icon="shield-check" href="/th/gateway/secrets-plan-contract">
    กฎ `secrets apply` สำหรับ target/path ที่แน่นอน และพฤติกรรม auth-profile แบบ ref-only
  </Card>
</CardGroup>

## การเริ่มต้นภายในเครื่องใน 5 นาที

<Steps>
  <Step title="เริ่ม Gateway">

```bash
openclaw gateway --port 18789
# ดีบัก/ติดตามที่มิเรอร์ไปยัง stdio
openclaw gateway --port 18789 --verbose
# บังคับ kill ตัวรับฟังบนพอร์ตที่เลือก แล้วเริ่มใหม่
openclaw gateway --force
```

  </Step>

  <Step title="ตรวจสอบสุขภาพของบริการ">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

ค่า baseline ที่ถือว่าปกติ: `Runtime: running`, `Connectivity probe: ok` และ `Capability: ...` ที่ตรงกับสิ่งที่คุณคาดหวัง ใช้ `openclaw gateway status --require-rpc` เมื่อต้องการหลักฐาน RPC ระดับสิทธิ์อ่าน ไม่ใช่แค่การเข้าถึงได้

  </Step>

  <Step title="ตรวจสอบความพร้อมของแชนเนล">

```bash
openclaw channels status --probe
```

เมื่อ Gateway เข้าถึงได้ คำสั่งนี้จะรัน live per-account channel probes และ audits แบบเลือกได้
หากเข้าถึง Gateway ไม่ได้ CLI จะ fallback ไปใช้สรุปแชนเนลจาก config เท่านั้น
แทนผลลัพธ์จาก live probe

  </Step>
</Steps>

<Note>
การรีโหลด config ของ Gateway จะเฝ้าดูพาธไฟล์ config ที่ใช้งานอยู่ (resolve จากค่าเริ่มต้นของ profile/state หรือจาก `OPENCLAW_CONFIG_PATH` เมื่อมีการตั้งค่าไว้)
โหมดค่าเริ่มต้นคือ `gateway.reload.mode="hybrid"`
หลังจากโหลดสำเร็จครั้งแรก โปรเซสที่กำลังรันจะให้บริการ active in-memory config snapshot; การรีโหลดสำเร็จจะสลับ snapshot นั้นแบบอะตอมมิก
</Note>

## โมเดลรันไทม์

- หนึ่งโปรเซสที่เปิดตลอดเวลาสำหรับ routing, control plane และการเชื่อมต่อแชนเนล
- พอร์ต multiplexed เดียวสำหรับ:
  - WebSocket control/RPC
  - HTTP APIs ที่เข้ากันได้กับ OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI และ hooks
- โหมด bind ค่าเริ่มต้น: `loopback`
- ต้องมี auth ตามค่าเริ่มต้น การตั้งค่า shared-secret ใช้
  `gateway.auth.token` / `gateway.auth.password` (หรือ
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) และการตั้งค่า
  reverse-proxy แบบ non-loopback สามารถใช้ `gateway.auth.mode: "trusted-proxy"` ได้

## endpoints ที่เข้ากันได้กับ OpenAI

พื้นผิวความเข้ากันได้ที่สำคัญที่สุดของ OpenClaw ตอนนี้คือ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

เหตุผลที่ชุดนี้สำคัญ:

- การเชื่อมต่อกับ Open WebUI, LobeChat และ LibreChat ส่วนใหญ่มัก probe `/v1/models` ก่อน
- ไปป์ไลน์ RAG และ memory จำนวนมากคาดหวัง `/v1/embeddings`
- ไคลเอนต์ที่เป็น agent-native มีแนวโน้มจะเลือกใช้ `/v1/responses` มากขึ้น

หมายเหตุด้านการวางแผน:

- `/v1/models` เป็นแบบ agent-first: จะคืนค่า `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
- `openclaw/default` คือ alias ที่เสถียร ซึ่งแมปไปยังเอเจนต์ค่าเริ่มต้นที่กำหนดค่าไว้เสมอ
- ใช้ `x-openclaw-model` เมื่อต้องการ override backend provider/model; มิฉะนั้นโมเดลปกติและการตั้งค่า embedding ของเอเจนต์ที่เลือกจะยังคงเป็นตัวควบคุม

ทั้งหมดนี้ทำงานบนพอร์ตหลักของ Gateway และใช้ขอบเขต auth ของโอเปอเรเตอร์ที่เชื่อถือได้เดียวกันกับส่วนอื่นของ Gateway HTTP API

### ลำดับความสำคัญของพอร์ตและ bind

| การตั้งค่า | ลำดับการ resolve |
| ------------ | ------------------------------------------------------------- |
| พอร์ต Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| โหมด bind | CLI/override → `gateway.bind` → `loopback` |

### โหมด hot reload

| `gateway.reload.mode` | พฤติกรรม |
| --------------------- | ------------------------------------------ |
| `off`                 | ไม่รีโหลด config |
| `hot`                 | ใช้เฉพาะการเปลี่ยนแปลงที่ hot-safe |
| `restart`             | รีสตาร์ตเมื่อมีการเปลี่ยนแปลงที่ต้องรีโหลด |
| `hybrid` (ค่าเริ่มต้น)    | ใช้แบบ hot เมื่อปลอดภัย และรีสตาร์ตเมื่อจำเป็น |

## ชุดคำสั่งสำหรับโอเปอเรเตอร์

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

`gateway status --deep` มีไว้สำหรับการค้นหาบริการเพิ่มเติม (LaunchDaemons/systemd system
units/schtasks) ไม่ใช่สำหรับการ probe สุขภาพ RPC ที่ลึกขึ้น

## หลาย Gateway (โฮสต์เดียวกัน)

การติดตั้งส่วนใหญ่ควรรันหนึ่ง gateway ต่อหนึ่งเครื่อง หนึ่ง gateway สามารถโฮสต์ได้หลาย
agents และ channels

คุณต้องใช้หลาย gateways ก็ต่อเมื่อคุณตั้งใจต้องการการแยกขาดหรือ rescue bot

การตรวจสอบที่มีประโยชน์:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

สิ่งที่ควรคาดหวัง:

- `gateway status --deep` อาจรายงาน `Other gateway-like services detected (best effort)`
  และพิมพ์คำแนะนำในการล้าง เมื่อยังมีการติดตั้ง launchd/systemd/schtasks เก่าค้างอยู่
- `gateway probe` อาจเตือนว่า `multiple reachable gateways` เมื่อมีมากกว่าหนึ่ง target
  ที่ตอบกลับ
- หากเป็นสิ่งที่ตั้งใจไว้ ให้แยกพอร์ต, config/state และราก workspace ต่อ gateway

เช็กลิสต์ต่อหนึ่งอินสแตนซ์:

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

## endpoint สมองแบบเรียลไทม์ของ VoiceClaw

OpenClaw เปิดเผย WebSocket endpoint แบบเรียลไทม์ที่เข้ากันได้กับ VoiceClaw ที่
`/voiceclaw/realtime` ใช้สิ่งนี้เมื่อไคลเอนต์เดสก์ท็อป VoiceClaw ควรพูดคุย
โดยตรงกับสมอง OpenClaw แบบเรียลไทม์ แทนการผ่านโปรเซส relay แยก

endpoint นี้ใช้ Gemini Live สำหรับเสียงแบบเรียลไทม์ และเรียก OpenClaw เป็น
สมองโดยเปิดเผยเครื่องมือของ OpenClaw ให้ Gemini Live โดยตรง การเรียกเครื่องมือจะคืน
ผลลัพธ์ `working` ทันทีเพื่อให้เทิร์นเสียงยังตอบสนองได้ จากนั้น OpenClaw
จะรันเครื่องมือจริงแบบ asynchronous และ inject ผลลัพธ์กลับเข้าสู่
live session ตั้งค่า `GEMINI_API_KEY` ในสภาพแวดล้อมของโปรเซส gateway หาก
เปิดใช้ gateway auth ไคลเอนต์เดสก์ท็อปจะส่ง gateway token หรือ password
ในข้อความ `session.config` แรกของมัน

การเข้าถึงสมองแบบเรียลไทม์จะรันคำสั่งเอเจนต์ของ OpenClaw ที่ได้รับอนุญาตจากเจ้าของ จำกัด
`gateway.auth.mode: "none"` ไว้เฉพาะอินสแตนซ์ทดสอบแบบ loopback-only เท่านั้น การเชื่อมต่อสมองแบบเรียลไทม์ที่ไม่ใช่ local ต้องใช้ gateway auth

สำหรับ gateway ทดสอบแบบแยก ให้รันอินสแตนซ์แยกด้วยพอร์ต, config
และ state ของตัวเอง:

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
Fallback: SSH tunnel

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

จากนั้นเชื่อมต่อไคลเอนต์ภายในเครื่องไปที่ `ws://127.0.0.1:18789`

<Warning>
SSH tunnels ไม่ได้ข้าม gateway auth สำหรับ shared-secret auth ไคลเอนต์ยังคง
ต้องส่ง `token`/`password` แม้จะผ่าน tunnel ก็ตาม สำหรับโหมดที่มีการระบุอัตลักษณ์
คำขอยังคงต้องผ่านเส้นทาง auth นั้นอยู่ดี
</Warning>

ดู: [Remote Gateway](/th/gateway/remote), [Authentication](/th/gateway/authentication), [Tailscale](/th/gateway/tailscale)

## การกำกับดูแลและวงจรชีวิตของบริการ

ใช้การรันแบบมีผู้กำกับดูแลเพื่อความเชื่อถือได้ในระดับ production-like

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

ป้าย LaunchAgent คือ `ai.openclaw.gateway` (ค่าเริ่มต้น) หรือ `ai.openclaw.<profile>` (named profile) `openclaw doctor` จะตรวจสอบและซ่อมแซมความคลาดเคลื่อนของ config บริการ

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

สำหรับการคงอยู่หลังออกจากระบบ ให้เปิดใช้ lingering:

```bash
sudo loginctl enable-linger <user>
```

ตัวอย่าง user-unit แบบกำหนดเองเมื่อคุณต้องการพาธการติดตั้งเฉพาะ:

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

การเริ่มอัตโนมัติแบบมีการจัดการบน Windows แบบเนทีฟใช้ Scheduled Task ชื่อ `OpenClaw Gateway`
(หรือ `OpenClaw Gateway (<profile>)` สำหรับ named profiles) หากการสร้าง Scheduled Task
ถูกปฏิเสธ OpenClaw จะ fallback ไปใช้ตัวเปิดผ่าน Startup-folder ต่อผู้ใช้
ซึ่งชี้ไปยัง `gateway.cmd` ภายใน state directory

  </Tab>

  <Tab title="Linux (system service)">

ใช้ system unit สำหรับโฮสต์แบบหลายผู้ใช้/เปิดตลอดเวลา

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ใช้เนื้อหา service เดียวกับ user unit แต่ติดตั้งไว้ภายใต้
`/etc/systemd/system/openclaw-gateway[-<profile>].service` และปรับ
`ExecStart=` หากไบนารี `openclaw` ของคุณอยู่ที่อื่น

  </Tab>
</Tabs>

## เส้นทางลัดสำหรับ dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

ค่าเริ่มต้นรวมถึง state/config ที่แยกจากกันและพอร์ตฐานของ Gateway คือ `19001`

## ข้อมูลอ้างอิงโปรโตคอลแบบรวดเร็ว (มุมมองโอเปอเรเตอร์)

- เฟรมแรกของไคลเอนต์ต้องเป็น `connect`
- Gateway จะส่ง snapshot `hello-ok` กลับ (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)
- `hello-ok.features.methods` / `events` เป็นรายการค้นพบแบบอนุรักษ์นิยม ไม่ใช่
  dump ที่สร้างขึ้นของทุก helper route ที่เรียกใช้ได้
- คำขอ: `req(method, params)` → `res(ok/payload|error)`
- events ทั่วไปได้แก่ `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, events ของวงจรชีวิต pairing/approval และ `shutdown`

การรันเอเจนต์เป็นแบบสองขั้น:

1. accepted ack ทันที (`status:"accepted"`)
2. การตอบกลับเมื่อเสร็จสิ้นขั้นสุดท้าย (`status:"ok"|"error"`), พร้อม `agent` events ที่สตรีมคั่นอยู่ระหว่างนั้น

ดูเอกสารโปรโตคอลฉบับเต็ม: [Gateway Protocol](/th/gateway/protocol)

## การตรวจสอบการปฏิบัติงาน

### Liveness

- เปิด WS และส่ง `connect`
- คาดว่าจะได้รับการตอบกลับ `hello-ok` พร้อม snapshot

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap recovery

events จะไม่ถูกเล่นซ้ำ เมื่อมี sequence gaps ให้รีเฟรชสถานะ (`health`, `system-presence`) ก่อนจึงค่อยดำเนินการต่อ

## ลายเซ็นความล้มเหลวที่พบบ่อย

| ลายเซ็น | ปัญหาที่น่าจะเป็นไปได้ |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | bind แบบ non-loopback โดยไม่มีเส้นทาง gateway auth ที่ถูกต้อง |
| `another gateway instance is already listening` / `EADDRINUSE` | พอร์ตชนกัน |
| `Gateway start blocked: set gateway.mode=local`                | config ถูกตั้งเป็นโหมด remote หรือ local-mode stamp หายไปจาก config ที่เสียหาย |
| `unauthorized` during connect                                  | auth ของไคลเอนต์กับ Gateway ไม่ตรงกัน |

สำหรับลำดับการวินิจฉัยแบบเต็ม ให้ใช้ [Gateway Troubleshooting](/th/gateway/troubleshooting)

## การรับประกันด้านความปลอดภัย

- ไคลเอนต์โปรโตคอล Gateway จะล้มเหลวอย่างรวดเร็วเมื่อ Gateway ไม่พร้อมใช้งาน (ไม่มี direct-channel fallback แบบโดยนัย)
- เฟรมแรกที่ไม่ถูกต้อง/ไม่ใช่ `connect` จะถูกปฏิเสธและปิดการเชื่อมต่อ
- graceful shutdown จะส่ง event `shutdown` ก่อนปิด socket

---

ที่เกี่ยวข้อง:

- [การแก้ปัญหา](/th/gateway/troubleshooting)
- [Background Process](/th/gateway/background-process)
- [การกำหนดค่า](/th/gateway/configuration)
- [Health](/th/gateway/health)
- [Doctor](/th/gateway/doctor)
- [Authentication](/th/gateway/authentication)

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [Gateway troubleshooting](/th/gateway/troubleshooting)
- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [การจัดการความลับ](/th/gateway/secrets)
