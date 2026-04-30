---
read_when:
    - การเรียกใช้หรือดีบักกระบวนการ Gateway
summary: คู่มือปฏิบัติการสำหรับบริการ Gateway วงจรชีวิต และการดำเนินงาน
title: คู่มือปฏิบัติการ Gateway
x-i18n:
    generated_at: "2026-04-30T09:53:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

ใช้หน้านี้สำหรับการเริ่มต้นใช้งานวันแรกและการดำเนินงานวันถัด ๆ ไปของบริการ Gateway

<CardGroup cols={2}>
  <Card title="การแก้ไขปัญหาเชิงลึก" icon="siren" href="/th/gateway/troubleshooting">
    การวินิจฉัยโดยเริ่มจากอาการ พร้อมลำดับคำสั่งที่แน่นอนและลายเซ็นของบันทึก
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    คู่มือการตั้งค่าตามงาน + อ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
  <Card title="การจัดการความลับ" icon="key-round" href="/th/gateway/secrets">
    สัญญา SecretRef, พฤติกรรมสแนปช็อตขณะรันไทม์ และการดำเนินการ migrate/reload
  </Card>
  <Card title="สัญญาแผนความลับ" icon="shield-check" href="/th/gateway/secrets-plan-contract">
    กฎ target/path ที่แน่นอนของ `secrets apply` และพฤติกรรม auth-profile แบบ ref-only
  </Card>
</CardGroup>

## การเริ่มต้นภายในเครื่อง 5 นาที

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

  <Step title="ตรวจสอบสุขภาพบริการ">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

ค่าพื้นฐานที่ปกติ: `Runtime: running`, `Connectivity probe: ok` และ `Capability: ...` ที่ตรงกับสิ่งที่คุณคาดไว้ ใช้ `openclaw gateway status --require-rpc` เมื่อคุณต้องการหลักฐาน RPC ขอบเขตการอ่าน ไม่ใช่แค่การเข้าถึงได้

  </Step>

  <Step title="ตรวจสอบความพร้อมของช่องทาง">

```bash
openclaw channels status --probe
```

เมื่อมี gateway ที่เข้าถึงได้ คำสั่งนี้จะเรียกใช้การตรวจสอบช่องทางแบบสดต่อบัญชีและการตรวจสอบเสริม
ถ้าเข้าถึง gateway ไม่ได้ CLI จะถอยกลับไปแสดงสรุปช่องทางจากการกำหนดค่าเท่านั้นแทน
ผลลัพธ์การตรวจสอบแบบสด

  </Step>
</Steps>

<Note>
การโหลดการกำหนดค่า Gateway ใหม่จะเฝ้าดูพาธไฟล์กำหนดค่าที่ใช้งานอยู่ (แก้ไขจากค่าเริ่มต้นของโปรไฟล์/สถานะ หรือ `OPENCLAW_CONFIG_PATH` เมื่อถูกตั้งค่า)
โหมดเริ่มต้นคือ `gateway.reload.mode="hybrid"`
หลังจากโหลดสำเร็จครั้งแรก กระบวนการที่กำลังรันจะให้บริการสแนปช็อตการกำหนดค่าในหน่วยความจำที่ใช้งานอยู่ การโหลดใหม่ที่สำเร็จจะแทนที่สแนปช็อตนั้นแบบอะตอมิก
</Note>

## โมเดลรันไทม์

- กระบวนการที่เปิดตลอดหนึ่งรายการสำหรับการกำหนดเส้นทาง, control plane และการเชื่อมต่อช่องทาง
- พอร์ตแบบมัลติเพล็กซ์เดี่ยวสำหรับ:
  - WebSocket control/RPC
  - HTTP APIs ที่เข้ากันได้กับ OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI และ hooks
- โหมด bind เริ่มต้น: `loopback`
- ต้องมีการยืนยันตัวตนโดยค่าเริ่มต้น การตั้งค่าแบบ shared-secret ใช้
  `gateway.auth.token` / `gateway.auth.password` (หรือ
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) และการตั้งค่า reverse-proxy
  แบบ non-loopback สามารถใช้ `gateway.auth.mode: "trusted-proxy"`

## Endpoint ที่เข้ากันได้กับ OpenAI

พื้นผิวความเข้ากันได้ที่ให้ประโยชน์สูงสุดของ OpenClaw ตอนนี้คือ:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

เหตุผลที่ชุดนี้สำคัญ:

- การผสานรวม Open WebUI, LobeChat และ LibreChat ส่วนใหญ่ตรวจสอบ `/v1/models` ก่อน
- ไปป์ไลน์ RAG และหน่วยความจำจำนวนมากคาดหวัง `/v1/embeddings`
- ไคลเอนต์แบบ agent-native นิยมใช้ `/v1/responses` มากขึ้น

หมายเหตุการวางแผน:

- `/v1/models` เป็น agent-first: ส่งคืน `openclaw`, `openclaw/default` และ `openclaw/<agentId>`
- `openclaw/default` เป็น alias ที่เสถียรซึ่งแมปไปยัง agent เริ่มต้นที่กำหนดค่าไว้เสมอ
- ใช้ `x-openclaw-model` เมื่อคุณต้องการ override ผู้ให้บริการ/โมเดล backend; มิฉะนั้นโมเดลปกติและการตั้งค่า embedding ของ agent ที่เลือกจะยังคงควบคุมอยู่

ทั้งหมดนี้ทำงานบนพอร์ต Gateway หลักและใช้ขอบเขตการยืนยันตัวตนของผู้ปฏิบัติงานที่เชื่อถือได้เดียวกับส่วนที่เหลือของ Gateway HTTP API

### ลำดับความสำคัญของพอร์ตและ bind

| การตั้งค่า      | ลำดับการแก้ไข                                              |
| ------------ | ------------------------------------------------------------- |
| พอร์ต Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| โหมด Bind    | CLI/override → `gateway.bind` → `loopback`                    |

บริการ gateway ที่ติดตั้งแล้วจะบันทึก `--port` ที่แก้ไขแล้วไว้ในเมตาดาทา supervisor หลังจากเปลี่ยน `gateway.port` ให้รัน `openclaw doctor --fix` หรือ `openclaw gateway install --force` เพื่อให้ launchd/systemd/schtasks เริ่มกระบวนการบนพอร์ตใหม่

การเริ่มต้น Gateway ใช้พอร์ตและ bind ที่มีผลเดียวกันเมื่อ seed origin ของ
Control UI ภายในเครื่องสำหรับ bind แบบ non-loopback ตัวอย่างเช่น `--bind lan --port 3000`
จะ seed `http://localhost:3000` และ `http://127.0.0.1:3000` ก่อนที่การตรวจสอบ
ขณะรันไทม์จะทำงาน เพิ่ม origin ของเบราว์เซอร์ระยะไกล เช่น URL ของพร็อกซี HTTPS ไปยัง
`gateway.controlUi.allowedOrigins` อย่างชัดเจน

### โหมด Hot reload

| `gateway.reload.mode` | พฤติกรรม                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | ไม่มีการโหลดการกำหนดค่าใหม่                           |
| `hot`                 | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยสำหรับ hot                |
| `restart`             | รีสตาร์ทเมื่อมีการเปลี่ยนแปลงที่ต้องโหลดใหม่         |
| `hybrid` (ค่าเริ่มต้น)    | ใช้แบบ hot เมื่อปลอดภัย รีสตาร์ทเมื่อจำเป็น |

## ชุดคำสั่งผู้ปฏิบัติงาน

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

`gateway status --deep` ใช้สำหรับการค้นหาบริการเพิ่มเติม (LaunchDaemons/systemd system
units/schtasks) ไม่ใช่การตรวจสอบสุขภาพ RPC ที่ลึกกว่า

## Gateway หลายตัว (โฮสต์เดียวกัน)

การติดตั้งส่วนใหญ่ควรรันหนึ่ง gateway ต่อเครื่อง gateway เดียวสามารถโฮสต์
agents และช่องทางหลายรายการได้

คุณต้องใช้หลาย gateway เฉพาะเมื่อคุณตั้งใจต้องการการแยกส่วนหรือบอทกู้คืนเท่านั้น

การตรวจสอบที่มีประโยชน์:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

สิ่งที่คาดหวัง:

- `gateway status --deep` สามารถรายงาน `Other gateway-like services detected (best effort)`
  และพิมพ์คำแนะนำการล้างข้อมูลเมื่อยังมีการติดตั้ง launchd/systemd/schtasks เก่าค้างอยู่
- `gateway probe` สามารถเตือนเกี่ยวกับ `multiple reachable gateways` เมื่อมี target มากกว่าหนึ่งรายการ
  ตอบกลับ
- หากตั้งใจให้เป็นแบบนั้น ให้แยกพอร์ต, config/state และราก workspace ต่อ gateway

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

## Endpoint สมองแบบเรียลไทม์ของ VoiceClaw

OpenClaw เปิดเผย endpoint WebSocket แบบเรียลไทม์ที่เข้ากันได้กับ VoiceClaw ที่
`/voiceclaw/realtime` ใช้เมื่อไคลเอนต์เดสก์ท็อป VoiceClaw ควรสื่อสาร
โดยตรงกับสมอง OpenClaw แบบเรียลไทม์แทนที่จะผ่านกระบวนการ relay แยกต่างหาก

Endpoint ใช้ Gemini Live สำหรับเสียงแบบเรียลไทม์และเรียก OpenClaw เป็น
สมองโดยเปิดเผยเครื่องมือ OpenClaw ให้ Gemini Live โดยตรง การเรียกเครื่องมือจะส่งคืนผลลัพธ์
`working` ทันทีเพื่อให้รอบเสียงตอบสนองได้ดี จากนั้น OpenClaw
จะเรียกใช้เครื่องมือจริงแบบอะซิงโครนัสและฉีดผลลัพธ์กลับเข้าสู่
เซสชัน live ตั้งค่า `GEMINI_API_KEY` ในสภาพแวดล้อมกระบวนการ gateway ถ้า
เปิดใช้การยืนยันตัวตนของ gateway ไคลเอนต์เดสก์ท็อปจะส่งโทเค็นหรือรหัสผ่าน gateway
ในข้อความ `session.config` แรก

การเข้าถึงสมองแบบเรียลไทม์จะเรียกใช้คำสั่ง agent ของ OpenClaw ที่เจ้าของอนุญาต ให้จำกัด
`gateway.auth.mode: "none"` ไว้กับ instance ทดสอบแบบ loopback-only เท่านั้น การเชื่อมต่อ
สมองแบบเรียลไทม์ที่ไม่ใช่ภายในเครื่องต้องใช้การยืนยันตัวตนของ gateway

สำหรับ gateway ทดสอบที่แยกออกมา ให้รัน instance แยกพร้อมพอร์ต, config,
และสถานะของตัวเอง:

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

จากนั้นเชื่อมต่อไคลเอนต์ภายในเครื่องไปยัง `ws://127.0.0.1:18789`

<Warning>
SSH tunnels ไม่ได้ข้ามการยืนยันตัวตนของ gateway สำหรับการยืนยันตัวตนแบบ shared-secret ไคลเอนต์ยังคง
ต้องส่ง `token`/`password` แม้ผ่าน tunnel สำหรับโหมดที่มีข้อมูลยืนยันตัวตน
คำขอยังคงต้องผ่าน auth path นั้น
</Warning>

ดู: [Gateway ระยะไกล](/th/gateway/remote), [การยืนยันตัวตน](/th/gateway/authentication), [Tailscale](/th/gateway/tailscale)

## การกำกับดูแลและวงจรชีวิตบริการ

ใช้การรันภายใต้การกำกับดูแลเพื่อความน่าเชื่อถือระดับใกล้เคียง production

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

ใช้ `openclaw gateway restart` สำหรับการรีสตาร์ท อย่า chain `openclaw gateway stop` และ `openclaw gateway start`; บน macOS, `gateway stop` จะปิดใช้งาน LaunchAgent โดยตั้งใจก่อนหยุดมัน

ป้ายกำกับ LaunchAgent คือ `ai.openclaw.gateway` (ค่าเริ่มต้น) หรือ `ai.openclaw.<profile>` (โปรไฟล์ที่มีชื่อ) `openclaw doctor` ตรวจสอบและซ่อมแซมความคลาดเคลื่อนของ config บริการ

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

ตัวอย่าง user-unit แบบ manual เมื่อคุณต้องการพาธติดตั้งแบบกำหนดเอง:

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

การเริ่มต้นแบบจัดการของ Windows native ใช้ Scheduled Task ชื่อ `OpenClaw Gateway`
(หรือ `OpenClaw Gateway (<profile>)` สำหรับโปรไฟล์ที่มีชื่อ) หากการสร้าง Scheduled Task
ถูกปฏิเสธ OpenClaw จะถอยกลับไปใช้ launcher ใน Startup-folder ต่อผู้ใช้
ที่ชี้ไปยัง `gateway.cmd` ภายในไดเรกทอรีสถานะ

  </Tab>

  <Tab title="Linux (system service)">

ใช้ system unit สำหรับโฮสต์แบบหลายผู้ใช้/เปิดตลอด

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ใช้เนื้อหา service เดียวกับ user unit แต่ติดตั้งไว้ใต้
`/etc/systemd/system/openclaw-gateway[-<profile>].service` และปรับ
`ExecStart=` หาก binary `openclaw` ของคุณอยู่ที่อื่น

อย่าให้ `openclaw doctor --fix` ติดตั้งบริการ gateway ระดับผู้ใช้สำหรับโปรไฟล์/พอร์ตเดียวกันด้วย Doctor จะปฏิเสธการติดตั้งอัตโนมัตินั้นเมื่อพบบริการ OpenClaw gateway ระดับระบบ ใช้ `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ system unit เป็นเจ้าของวงจรชีวิต

  </Tab>
</Tabs>

## เส้นทางด่วนสำหรับโปรไฟล์ Dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

ค่าเริ่มต้นรวมถึง state/config ที่แยกออกมาและพอร์ต gateway พื้นฐาน `19001`

## อ้างอิง Protocol แบบด่วน (มุมมองผู้ปฏิบัติงาน)

- เฟรมไคลเอนต์แรกต้องเป็น `connect`
- Gateway ส่งคืนสแนปช็อต `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy)
- `hello-ok.features.methods` / `events` เป็นรายการค้นพบแบบอนุรักษนิยม ไม่ใช่
  dump ที่สร้างขึ้นของ helper route ทุกตัวที่เรียกได้
- คำขอ: `req(method, params)` → `res(ok/payload|error)`
- เหตุการณ์ทั่วไปได้แก่ `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, เหตุการณ์วงจรชีวิต pairing/approval และ `shutdown`

การรัน Agent มีสองขั้นตอน:

1. ack การยอมรับทันที (`status:"accepted"`)
2. การตอบกลับเมื่อเสร็จสมบูรณ์สุดท้าย (`status:"ok"|"error"`) พร้อมเหตุการณ์ `agent` ที่สตรีมระหว่างนั้น

ดูเอกสาร Protocol ฉบับเต็ม: [Gateway Protocol](/th/gateway/protocol)

## การตรวจสอบด้านปฏิบัติการ

### ความมีชีวิต

- เปิด WS แล้วส่ง `connect`
- คาดว่าจะได้รับการตอบกลับ `hello-ok` พร้อมสแนปช็อต

### ความพร้อมใช้งาน

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### การกู้คืนเมื่อมีช่องว่าง

เหตุการณ์จะไม่ถูกเล่นซ้ำ เมื่อมีช่องว่างของลำดับ ให้รีเฟรชสถานะ (`health`, `system-presence`) ก่อนดำเนินการต่อ

## รูปแบบความล้มเหลวที่พบบ่อย

| ลักษณะ                                                         | ปัญหาที่เป็นไปได้                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | การ bind ที่ไม่ใช่ loopback โดยไม่มีพาธ auth ของ Gateway ที่ถูกต้อง             |
| `another gateway instance is already listening` / `EADDRINUSE` | พอร์ตขัดแย้ง                                                                   |
| `Gateway start blocked: set gateway.mode=local`                | ตั้งค่าคอนฟิกเป็นโหมด remote หรือ stamp โหมด local หายไปจากคอนฟิกที่เสียหาย |
| `unauthorized` during connect                                  | auth ไม่ตรงกันระหว่างไคลเอนต์กับ Gateway                                      |

สำหรับลำดับขั้นการวินิจฉัยฉบับเต็ม ให้ใช้ [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)

## การรับประกันความปลอดภัย

- ไคลเอนต์โปรโตคอล Gateway จะล้มเหลวทันทีเมื่อ Gateway ใช้งานไม่ได้ (ไม่มี fallback ไปยังช่องทางโดยตรงโดยนัย)
- เฟรมแรกที่ไม่ถูกต้อง/ไม่ใช่ connect จะถูกปฏิเสธและปิด
- การปิดระบบอย่างเรียบร้อยจะส่งเหตุการณ์ `shutdown` ก่อนปิดซ็อกเก็ต

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
