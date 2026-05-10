---
read_when:
    - การเรียกใช้หรือการดีบักกระบวนการ Gateway
summary: คู่มือปฏิบัติการสำหรับบริการ Gateway วงจรชีวิต และการดำเนินงาน
title: คู่มือปฏิบัติการ Gateway
x-i18n:
    generated_at: "2026-05-10T19:38:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54f868e0b263e346876fb5c4f6a359e8a6f6802871f6931668ebe57140ca2711
    source_path: gateway/index.md
    workflow: 16
---

ใช้หน้านี้สำหรับการเริ่มต้นใช้งาน Gateway service ในวันแรก และการดำเนินงานในวันที่สอง

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/th/gateway/troubleshooting">
    การวินิจฉัยโดยเริ่มจากอาการ พร้อมลำดับคำสั่งที่แน่นอนและลายเซ็นของบันทึก
  </Card>
  <Card title="Configuration" icon="sliders" href="/th/gateway/configuration">
    คู่มือการตั้งค่าตามงาน + เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
  <Card title="Secrets management" icon="key-round" href="/th/gateway/secrets">
    สัญญา SecretRef, พฤติกรรมสแนปช็อตขณะรันไทม์ และการดำเนินการย้าย/โหลดใหม่
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/th/gateway/secrets-plan-contract">
    กฎ target/path ที่แน่นอนของ `secrets apply` และพฤติกรรม auth-profile แบบอ้างอิงเท่านั้น
  </Card>
</CardGroup>

## การเริ่มต้นในเครื่องภายใน 5 นาที

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

ค่าพื้นฐานที่ปกติ: `Runtime: running`, `Connectivity probe: ok` และ `Capability: ...` ที่ตรงกับสิ่งที่คุณคาดไว้ ใช้ `openclaw gateway status --require-rpc` เมื่อคุณต้องการหลักฐาน RPC ขอบเขตการอ่าน ไม่ใช่แค่การเข้าถึงได้

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

เมื่อมี Gateway ที่เข้าถึงได้ คำสั่งนี้จะรันการตรวจสอบ channel แบบสดต่อบัญชี และการ audit เพิ่มเติม
หาก Gateway เข้าถึงไม่ได้ CLI จะถอยกลับไปแสดงสรุป channel จากการกำหนดค่าเท่านั้นแทน
ผลลัพธ์จากการตรวจสอบสด

  </Step>
</Steps>

<Note>
การโหลด config ของ Gateway ใหม่จะเฝ้าดูพาธไฟล์ config ที่ใช้งานอยู่ (แก้ค่าจากค่าเริ่มต้นของ profile/state หรือ `OPENCLAW_CONFIG_PATH` เมื่อกำหนดไว้)
โหมดเริ่มต้นคือ `gateway.reload.mode="hybrid"`
หลังจากโหลดสำเร็จครั้งแรก process ที่กำลังรันจะให้บริการจากสแนปช็อต config ในหน่วยความจำที่ใช้งานอยู่ การโหลดใหม่ที่สำเร็จจะแทนที่สแนปช็อตนั้นแบบอะตอมมิก
</Note>

## โมเดลรันไทม์

- process ที่ทำงานตลอดเวลาหนึ่งตัวสำหรับการ routing, control plane และการเชื่อมต่อ channel
- พอร์ตเดียวแบบ multiplexed สำหรับ:
  - WebSocket control/RPC
  - HTTP API ที่เข้ากันได้กับ OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI และ hooks
- โหมด bind เริ่มต้น: `loopback`
- ต้องมีการยืนยันตัวตนโดยค่าเริ่มต้น การตั้งค่า shared-secret ใช้
  `gateway.auth.token` / `gateway.auth.password` (หรือ
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) และการตั้งค่า reverse-proxy
  แบบไม่ใช่ loopback สามารถใช้ `gateway.auth.mode: "trusted-proxy"` ได้

## endpoint ที่เข้ากันได้กับ OpenAI

พื้นผิวความเข้ากันได้ที่ให้ประโยชน์สูงสุดของ OpenClaw ตอนนี้คือ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

เหตุผลที่ชุดนี้สำคัญ:

- การผสานรวม Open WebUI, LobeChat และ LibreChat ส่วนใหญ่จะตรวจสอบ `/v1/models` ก่อน
- ไปป์ไลน์ RAG และ memory จำนวนมากคาดหวัง `/v1/embeddings`
- client แบบ agent-native นิยมใช้ `/v1/responses` มากขึ้นเรื่อย ๆ

หมายเหตุการวางแผน:

- `/v1/models` เน้น agent เป็นอันดับแรก: ส่งคืน `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
- `openclaw/default` เป็น alias ที่เสถียร ซึ่งแมปไปยัง agent เริ่มต้นที่กำหนดค่าไว้เสมอ
- ใช้ `x-openclaw-model` เมื่อต้องการ override backend provider/model มิฉะนั้น model และการตั้งค่า embedding ปกติของ agent ที่เลือกจะยังเป็นตัวควบคุม

ทั้งหมดนี้รันบนพอร์ต Gateway หลัก และใช้ขอบเขตการยืนยันตัวตนของ operator ที่เชื่อถือได้เดียวกันกับส่วนที่เหลือของ HTTP API ของ Gateway

### ลำดับความสำคัญของพอร์ตและ bind

| การตั้งค่า      | ลำดับการแก้ค่า                                              |
| ------------ | ------------------------------------------------------------- |
| พอร์ต Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| โหมด Bind    | CLI/override → `gateway.bind` → `loopback`                    |

Gateway service ที่ติดตั้งแล้วจะบันทึกค่า `--port` ที่แก้แล้วไว้ใน metadata ของ supervisor หลังจากเปลี่ยน `gateway.port` ให้รัน `openclaw doctor --fix` หรือ `openclaw gateway install --force` เพื่อให้ launchd/systemd/schtasks เริ่ม process บนพอร์ตใหม่

การเริ่มต้น Gateway ใช้พอร์ตและ bind ที่มีผลเดียวกันเมื่อ seed
origin ของ Control UI ในเครื่องสำหรับ bind แบบไม่ใช่ loopback ตัวอย่างเช่น `--bind lan --port 3000`
จะ seed `http://localhost:3000` และ `http://127.0.0.1:3000` ก่อนที่การตรวจสอบ
รันไทม์จะทำงาน เพิ่ม origin ของเบราว์เซอร์ระยะไกลใด ๆ เช่น HTTPS proxy URLs ไปยัง
`gateway.controlUi.allowedOrigins` อย่างชัดเจน

### โหมด Hot reload

| `gateway.reload.mode` | พฤติกรรม                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | ไม่มีการโหลด config ใหม่                           |
| `hot`                 | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยสำหรับ hot                |
| `restart`             | รีสตาร์ตเมื่อมีการเปลี่ยนแปลงที่ต้องโหลดใหม่         |
| `hybrid` (ค่าเริ่มต้น)    | hot-apply เมื่อปลอดภัย และรีสตาร์ตเมื่อจำเป็น |

## ชุดคำสั่งของ operator

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

`gateway status --deep` ใช้สำหรับการค้นหา service เพิ่มเติม (LaunchDaemons/systemd system
units/schtasks) ไม่ใช่การตรวจสอบสุขภาพ RPC ที่ลึกกว่า

## Gateway หลายตัว (โฮสต์เดียวกัน)

การติดตั้งส่วนใหญ่ควรรัน Gateway หนึ่งตัวต่อเครื่อง Gateway เดียวสามารถโฮสต์
agent และ channel ได้หลายรายการ

คุณต้องใช้ Gateway หลายตัวเฉพาะเมื่อคุณตั้งใจต้องการการแยกส่วนหรือบอทช่วยกู้คืน

การตรวจสอบที่มีประโยชน์:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

สิ่งที่ควรคาดหวัง:

- `gateway status --deep` สามารถรายงาน `Other gateway-like services detected (best effort)`
  และพิมพ์คำแนะนำการล้างข้อมูลเมื่อยังมีการติดตั้ง launchd/systemd/schtasks ที่ค้างอยู่
- `gateway probe` สามารถเตือนเกี่ยวกับ `multiple reachable gateways` เมื่อมี target มากกว่าหนึ่งตัว
  ตอบกลับ
- หากตั้งใจให้เป็นเช่นนั้น ให้แยกพอร์ต, config/state และราก workspace ต่อ Gateway

Checklist ต่อ instance:

- `gateway.port` ที่ไม่ซ้ำ
- `OPENCLAW_CONFIG_PATH` ที่ไม่ซ้ำ
- `OPENCLAW_STATE_DIR` ที่ไม่ซ้ำ
- `agents.defaults.workspace` ที่ไม่ซ้ำ

ตัวอย่าง:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

การตั้งค่าโดยละเอียด: [/gateway/multiple-gateways](/th/gateway/multiple-gateways).

## การเข้าถึงระยะไกล

แนะนำ: Tailscale/VPN.
ทางเลือกสำรอง: SSH tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

จากนั้นเชื่อมต่อ client ในเครื่องไปยัง `ws://127.0.0.1:18789`

<Warning>
SSH tunnel ไม่ข้ามการยืนยันตัวตนของ Gateway สำหรับการยืนยันตัวตนแบบ shared-secret client ยังคง
ต้องส่ง `token`/`password` แม้ผ่าน tunnel สำหรับโหมดที่มี identity
คำขอยังต้องผ่าน auth path นั้น
</Warning>

ดู: [Remote Gateway](/th/gateway/remote), [Authentication](/th/gateway/authentication), [Tailscale](/th/gateway/tailscale).

## การกำกับดูแลและ lifecycle ของ service

ใช้การรันแบบ supervised เพื่อความน่าเชื่อถือใกล้เคียง production

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

ใช้ `openclaw gateway restart` สำหรับการรีสตาร์ต อย่า chain `openclaw gateway stop` และ `openclaw gateway start` เพื่อใช้แทนการรีสตาร์ต

บน macOS, `gateway stop` ใช้ `launchctl bootout` โดยค่าเริ่มต้น — วิธีนี้จะลบ LaunchAgent ออกจาก boot session ปัจจุบันโดยไม่คงการ disable ไว้ ดังนั้นการกู้คืนอัตโนมัติของ KeepAlive จึงยังทำงานได้หลังจาก crash ที่ไม่คาดคิด และ `gateway start` จะเปิดใช้งานใหม่ได้อย่างสะอาด หากต้องการระงับ auto-respawn ข้ามการ reboot อย่างถาวร ให้ส่ง `--disable`: `openclaw gateway stop --disable`

label ของ LaunchAgent คือ `ai.openclaw.gateway` (ค่าเริ่มต้น) หรือ `ai.openclaw.<profile>` (profile ที่ตั้งชื่อ) `openclaw doctor` จะ audit และซ่อม drift ของ config service

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

เพื่อให้คงอยู่หลัง logout ให้เปิดใช้ lingering:

```bash
sudo loginctl enable-linger <user>
```

ตัวอย่าง user-unit แบบ manual เมื่อคุณต้องการพาธการติดตั้งแบบกำหนดเอง:

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

การเริ่มต้นแบบ managed บน Windows native ใช้ Scheduled Task ชื่อ `OpenClaw Gateway`
(หรือ `OpenClaw Gateway (<profile>)` สำหรับ profile ที่ตั้งชื่อ) หากการสร้าง Scheduled Task
ถูกปฏิเสธ OpenClaw จะถอยกลับไปใช้ตัวเรียกใช้งานใน Startup-folder ต่อผู้ใช้
ที่ชี้ไปยัง `gateway.cmd` ภายใน state directory

  </Tab>

  <Tab title="Linux (system service)">

ใช้ system unit สำหรับโฮสต์แบบหลายผู้ใช้/ทำงานตลอดเวลา

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ใช้ body ของ service เดียวกับ user unit แต่ติดตั้งไว้ภายใต้
`/etc/systemd/system/openclaw-gateway[-<profile>].service` และปรับ
`ExecStart=` หาก binary `openclaw` ของคุณอยู่ที่อื่น

อย่าให้ `openclaw doctor --fix` ติดตั้ง Gateway service ระดับผู้ใช้สำหรับ profile/port เดียวกันด้วย Doctor จะปฏิเสธการติดตั้งอัตโนมัตินั้นเมื่อพบ Gateway service ของ OpenClaw ระดับระบบ ใช้ `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system unit เป็นเจ้าของ lifecycle

  </Tab>
</Tabs>

## เส้นทางด่วนสำหรับ dev profile

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

ค่าเริ่มต้นรวม state/config ที่แยกไว้ และพอร์ต Gateway พื้นฐาน `19001`

## อ้างอิงย่อของ Protocol (มุมมอง operator)

- frame แรกของ client ต้องเป็น `connect`
- Gateway ส่งคืนสแนปช็อต `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)
- `hello-ok.features.methods` / `events` เป็นรายการ discovery แบบระมัดระวัง ไม่ใช่
  dump ที่สร้างขึ้นของ helper route ทุกตัวที่เรียกได้
- คำขอ: `req(method, params)` → `res(ok/payload|error)`
- event ทั่วไปรวมถึง `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, event ของ lifecycle การ pairing/approval และ `shutdown`

การรัน agent มีสองขั้นตอน:

1. ack accepted ทันที (`status:"accepted"`)
2. response การเสร็จสิ้นขั้นสุดท้าย (`status:"ok"|"error"`) พร้อม event `agent` ที่ stream อยู่ระหว่างนั้น

ดูเอกสาร protocol ฉบับเต็ม: [Gateway Protocol](/th/gateway/protocol).

## การตรวจสอบด้านปฏิบัติการ

### Liveness

- เปิด WS และส่ง `connect`
- คาดหวัง response `hello-ok` พร้อมสแนปช็อต

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### การกู้คืน gap

event จะไม่ถูก replay เมื่อเกิดช่องว่างของ sequence ให้ refresh state (`health`, `system-presence`) ก่อนดำเนินการต่อ

## ลายเซ็นความล้มเหลวที่พบบ่อย

| รูปแบบข้อความ                                                      | ปัญหาที่เป็นไปได้                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | การผูกกับที่อยู่ที่ไม่ใช่ลูปแบ็กโดยไม่มีเส้นทางการยืนยันตัวตนของ Gateway ที่ถูกต้อง                             |
| `another gateway instance is already listening` / `EADDRINUSE` | พอร์ตขัดแย้ง                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | ตั้งค่าคอนฟิกเป็นโหมดระยะไกล หรือสแตมป์โหมดภายในเครื่องหายไปจากคอนฟิกที่เสียหาย |
| `unauthorized` during connect                                  | การยืนยันตัวตนไม่ตรงกันระหว่างไคลเอนต์และ Gateway                                        |

สำหรับลำดับขั้นการวินิจฉัยฉบับเต็ม ให้ใช้ [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)

## การรับประกันด้านความปลอดภัย

- ไคลเอนต์โปรโตคอล Gateway ล้มเหลวอย่างรวดเร็วเมื่อ Gateway ไม่พร้อมใช้งาน (ไม่มีการย้อนกลับไปใช้ช่องทางโดยตรงโดยนัย)
- เฟรมแรกที่ไม่ถูกต้องหรือไม่ใช่การเชื่อมต่อจะถูกปฏิเสธและปิด
- การปิดระบบอย่างนุ่มนวลจะส่งเหตุการณ์ `shutdown` ก่อนปิดซ็อกเก็ต

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
