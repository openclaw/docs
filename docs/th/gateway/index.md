---
read_when:
    - การเรียกใช้หรือแก้ไขข้อบกพร่องของกระบวนการ Gateway
summary: คู่มือการปฏิบัติงานสำหรับบริการ Gateway วงจรชีวิต และการดำเนินงาน
title: คู่มือปฏิบัติการ Gateway
x-i18n:
    generated_at: "2026-07-16T19:15:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

ใช้หน้านี้สำหรับการเริ่มต้นบริการ Gateway ในวันแรกและการดำเนินงานตั้งแต่วันที่สองเป็นต้นไป

<CardGroup cols={2}>
  <Card title="การแก้ไขปัญหาเชิงลึก" icon="siren" href="/th/gateway/troubleshooting">
    การวินิจฉัยโดยเริ่มจากอาการ พร้อมลำดับคำสั่งและรูปแบบบันทึกที่แน่นอน
  </Card>
  <Card title="การกำหนดค่า" icon="sliders" href="/th/gateway/configuration">
    คู่มือการตั้งค่าตามงาน + เอกสารอ้างอิงการกำหนดค่าฉบับเต็ม
  </Card>
  <Card title="การจัดการข้อมูลลับ" icon="key-round" href="/th/gateway/secrets">
    สัญญา SecretRef, พฤติกรรมสแนปช็อตขณะรันไทม์ และการดำเนินการย้าย/โหลดใหม่
  </Card>
  <Card title="สัญญาแผนข้อมูลลับ" icon="shield-check" href="/th/gateway/secrets-plan-contract">
    กฎเป้าหมาย/พาธ `secrets apply` ที่แน่นอน และพฤติกรรมโปรไฟล์การยืนยันตัวตนแบบอ้างอิงเท่านั้น
  </Card>
</CardGroup>

## การเริ่มต้นภายในเครื่องใน 5 นาที

<Steps>
  <Step title="เริ่ม Gateway">

```bash
openclaw gateway --port 18789
# สะท้อน debug/trace ไปยัง stdio
openclaw gateway --port 18789 --verbose
# บังคับยุติตัวรับฟังบนพอร์ตที่เลือก แล้วเริ่มทำงาน
openclaw gateway --force
```

  </Step>

  <Step title="ตรวจสอบสถานะบริการ">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

ค่าพื้นฐานที่สมบูรณ์: `Runtime: running`, `Connectivity probe: ok` และบรรทัด `Capability` ที่ตรงตามที่คาดไว้ ใช้ `openclaw gateway status --require-rpc` เพื่อพิสูจน์ RPC ขอบเขตการอ่าน ไม่ใช่แค่การเข้าถึงได้

  </Step>

  <Step title="ตรวจสอบความพร้อมของช่องทาง">

```bash
openclaw channels status --probe
```

เมื่อเข้าถึง Gateway ได้ คำสั่งนี้จะเรียกใช้โพรบช่องทางแบบสดแยกตามบัญชีและการตรวจสอบเสริม หากเข้าถึง Gateway ไม่ได้ CLI จะกลับไปใช้สรุปช่องทางจากการกำหนดค่าเท่านั้น

  </Step>
</Steps>

<Note>
การโหลดการกำหนดค่า Gateway ใหม่จะเฝ้าดูพาธไฟล์การกำหนดค่าที่ใช้งานอยู่ (ซึ่งแก้ไขจากค่าเริ่มต้นของโปรไฟล์/สถานะ หรือ `OPENCLAW_CONFIG_PATH` เมื่อตั้งค่าไว้) โหมดเริ่มต้นคือ `gateway.reload.mode="hybrid"` หลังจากโหลดสำเร็จครั้งแรก กระบวนการที่ทำงานอยู่จะให้บริการจากสแนปช็อตการกำหนดค่าในหน่วยความจำที่ใช้งานอยู่ และการโหลดใหม่ที่สำเร็จจะสลับสแนปช็อตนั้นแบบอะตอมมิก
</Note>

## โมเดลรันไทม์

- กระบวนการที่ทำงานตลอดเวลาหนึ่งกระบวนการสำหรับการกำหนดเส้นทาง ระนาบควบคุม และการเชื่อมต่อช่องทาง
- พอร์ตมัลติเพล็กซ์เดียวสำหรับ:
  - การควบคุม/RPC ผ่าน WebSocket
  - HTTP API (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - เส้นทาง HTTP ของ Plugin เช่น `/api/v1/admin/rpc` ที่เลือกใช้ได้
  - UI ควบคุมและฮุก
- โหมดผูกค่าเริ่มต้น: `loopback` ภายในสภาพแวดล้อมคอนเทนเนอร์ที่ตรวจพบ ค่าเริ่มต้นที่มีผลคือ `auto` (แก้ไขเป็น `0.0.0.0` สำหรับการส่งต่อพอร์ต) เว้นแต่ Tailscale serve/funnel จะทำงานอยู่ ซึ่งจะบังคับใช้ `loopback` เสมอ
- ต้องมีการยืนยันตัวตนโดยค่าเริ่มต้น การตั้งค่าแบบข้อมูลลับที่ใช้ร่วมกันใช้ `gateway.auth.token` / `gateway.auth.password` (หรือ `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`) และการตั้งค่า reverse proxy ที่ไม่ใช่ loopback สามารถใช้ `gateway.auth.mode: "trusted-proxy"`

## ปลายทางที่เข้ากันได้กับ OpenAI

พื้นผิวความเข้ากันได้ที่ให้ประโยชน์สูงสุดของ OpenClaw:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

เหตุผลที่ชุดนี้สำคัญ:

- การผสานรวม Open WebUI, LobeChat และ LibreChat ส่วนใหญ่จะตรวจสอบ `/v1/models` ก่อน
- ไปป์ไลน์ RAG และหน่วยความจำจำนวนมากคาดหวัง `/v1/embeddings`
- ไคลเอนต์แบบเนทีฟสำหรับเอเจนต์นิยมใช้ `/v1/responses` มากขึ้นเรื่อย ๆ

`/v1/models` ให้ความสำคัญกับเอเจนต์เป็นอันดับแรก โดยจะส่งคืน `openclaw`, `openclaw/default` และ `openclaw/<agentId>` สำหรับทุกเอเจนต์ที่กำหนดค่าไว้ `openclaw/default` คือชื่อแทนที่เสถียรซึ่งแมปกับเอเจนต์เริ่มต้นที่กำหนดค่าไว้เสมอ ส่ง `x-openclaw-model` เมื่อต้องการแทนที่ผู้ให้บริการ/โมเดลแบ็กเอนด์ มิฉะนั้นโมเดลปกติและการตั้งค่าการฝังของเอเจนต์ที่เลือกจะยังคงเป็นตัวควบคุม

ทั้งหมดนี้ทำงานบนพอร์ต Gateway หลักและใช้ขอบเขตการยืนยันตัวตนของผู้ควบคุมที่เชื่อถือได้เดียวกับส่วนอื่นของ Gateway HTTP API

RPC ผู้ดูแลระบบผ่าน HTTP (`POST /api/v1/admin/rpc`) เป็นเส้นทาง Plugin แยกต่างหากที่ปิดไว้โดยค่าเริ่มต้น สำหรับเครื่องมือโฮสต์ที่ไม่สามารถใช้ WebSocket RPC ได้ ดู [RPC ผู้ดูแลระบบผ่าน HTTP](/th/plugins/admin-http-rpc)

### ลำดับความสำคัญของพอร์ตและการผูก

| การตั้งค่า      | ลำดับการแก้ไขค่า                                                     |
| ------------ | -------------------------------------------------------------------- |
| พอร์ต Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`        |
| โหมดการผูก    | CLI/ค่าที่แทนที่ → `gateway.bind` → `loopback` (หรือ `auto` ในคอนเทนเนอร์) |

บริการ Gateway ที่ติดตั้งไว้จะบันทึก `--port` ที่แก้ไขค่าแล้วในข้อมูลเมตาของตัวควบคุมกระบวนการ หลังจากเปลี่ยน `gateway.port` ให้เรียกใช้ `openclaw doctor --fix` หรือ `openclaw gateway install --force` เพื่อให้ launchd/systemd/schtasks เริ่มกระบวนการบนพอร์ตใหม่

การเริ่มต้น Gateway ใช้พอร์ตและการผูกที่มีผลเดียวกันเมื่อสร้างค่าเริ่มต้นของต้นทาง UI ควบคุมภายในเครื่องสำหรับการผูกที่ไม่ใช่ loopback ตัวอย่างเช่น `--bind lan --port 3000` จะสร้างค่าเริ่มต้น `http://localhost:3000` และ `http://127.0.0.1:3000` ก่อนการตรวจสอบรันไทม์ เพิ่มต้นทางเบราว์เซอร์ระยะไกล เช่น URL พร็อกซี HTTPS ลงใน `gateway.controlUi.allowedOrigins` อย่างชัดเจน

### โหมดโหลดใหม่แบบทันที

| `gateway.reload.mode` | พฤติกรรม                                   |
| --------------------- | ------------------------------------------ |
| `off`                 | ไม่โหลดการกำหนดค่าใหม่                           |
| `hot`                 | ใช้เฉพาะการเปลี่ยนแปลงที่ปลอดภัยต่อการโหลดทันที                |
| `restart`             | เริ่มใหม่เมื่อมีการเปลี่ยนแปลงที่ต้องโหลดใหม่         |
| `hybrid` (ค่าเริ่มต้น)    | ใช้แบบทันทีเมื่อปลอดภัย และเริ่มใหม่เมื่อจำเป็น |

## ชุดคำสั่งสำหรับผู้ควบคุม

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

`gateway status --deep` ใช้สำหรับการค้นหาบริการเพิ่มเติม (LaunchDaemons/ยูนิตระบบ systemd/schtasks) ไม่ใช่โพรบสถานะ RPC ที่ลึกขึ้น

## Gateway หลายรายการ (โฮสต์เดียวกัน)

การติดตั้งส่วนใหญ่ควรเรียกใช้ Gateway หนึ่งรายการต่อเครื่อง Gateway รายการเดียวสามารถโฮสต์เอเจนต์และช่องทางหลายรายการได้ คุณต้องใช้ Gateway หลายรายการเฉพาะเมื่อตั้งใจแยกการทำงานหรือต้องการบอตกู้คืน

การตรวจสอบที่เป็นประโยชน์:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

สิ่งที่ควรคาดหวัง:

- `gateway status --deep` สามารถรายงาน `Other gateway-like services detected (best effort)` และแสดงคำแนะนำการล้างข้อมูลเมื่อยังมีการติดตั้ง launchd/systemd/schtasks ที่ล้าสมัยอยู่
- `gateway probe` สามารถเตือนเกี่ยวกับ `multiple reachable gateway identities` เมื่อ Gateway คนละรายการตอบกลับ หรือเมื่อ OpenClaw ไม่สามารถพิสูจน์ได้ว่าเป้าหมายที่เข้าถึงได้เป็น Gateway รายการเดียวกัน อุโมงค์ SSH, URL พร็อกซี หรือ URL ระยะไกลที่กำหนดค่าไปยัง Gateway เดียวกัน ถือเป็น Gateway หนึ่งรายการที่มีการรับส่งหลายรูปแบบ แม้ว่าพอร์ตการรับส่งจะแตกต่างกัน
- หากตั้งใจให้เป็นเช่นนั้น ให้แยกพอร์ต การกำหนดค่า/สถานะ และรากของเวิร์กสเปซสำหรับแต่ละ Gateway

รายการตรวจสอบต่ออินสแตนซ์:

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
ทางเลือกสำรอง: อุโมงค์ SSH

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

จากนั้นเชื่อมต่อไคลเอนต์ภายในเครื่องไปยัง `ws://127.0.0.1:18789`

<Warning>
อุโมงค์ SSH ไม่ได้ข้ามการยืนยันตัวตนของ Gateway สำหรับการยืนยันตัวตนแบบข้อมูลลับที่ใช้ร่วมกัน ไคลเอนต์ยังคง
ต้องส่ง `token`/`password` แม้ผ่านอุโมงค์ สำหรับโหมดที่มีข้อมูลระบุตัวตน
คำขอยังคงต้องผ่านเส้นทางการยืนยันตัวตนนั้น
</Warning>

ดู: [Gateway ระยะไกล](/th/gateway/remote), [การยืนยันตัวตน](/th/gateway/authentication), [Tailscale](/th/gateway/tailscale)

## การควบคุมและวงจรชีวิตบริการ

ใช้การทำงานภายใต้ตัวควบคุมกระบวนการเพื่อความน่าเชื่อถือระดับใกล้เคียงการใช้งานจริง

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

ใช้ `openclaw gateway restart` สำหรับการเริ่มใหม่ อย่าต่อคำสั่ง `openclaw gateway stop` และ `openclaw gateway start` เพื่อใช้แทนการเริ่มใหม่

บน macOS, `gateway stop` ใช้ `launchctl bootout` โดยค่าเริ่มต้น การดำเนินการนี้จะนำ LaunchAgent ออกจากเซสชันการบูตปัจจุบันโดยไม่บันทึกการปิดใช้งานอย่างถาวร ทำให้การกู้คืนอัตโนมัติของ KeepAlive ยังคงทำงานหลังจากเกิดข้อขัดข้องโดยไม่คาดคิด และ `gateway start` สามารถเปิดใช้งานใหม่ได้อย่างเรียบร้อย หากต้องการระงับการเกิดกระบวนการใหม่อัตโนมัติข้ามการรีบูตอย่างถาวร ให้ส่ง `--disable`: `openclaw gateway stop --disable`

ป้ายกำกับ LaunchAgent คือ `ai.openclaw.gateway` (ค่าเริ่มต้น) หรือ `ai.openclaw.<profile>` (โปรไฟล์ที่มีชื่อ) `openclaw doctor` จะตรวจสอบและซ่อมแซมความคลาดเคลื่อนของการกำหนดค่าบริการ

  </Tab>

  <Tab title="Linux (systemd ผู้ใช้)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

หากต้องการให้ทำงานต่อหลังออกจากระบบ ให้เปิดใช้งาน lingering:

```bash
sudo loginctl enable-linger $(whoami)
```

บนเซิร์ฟเวอร์แบบไม่มีส่วนแสดงผลที่ไม่มีเซสชันเดสก์ท็อป ให้ตรวจสอบด้วยว่าได้ตั้งค่า `XDG_RUNTIME_DIR` (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`) ก่อนลองคำสั่ง `systemctl --user` อีกครั้ง

ตัวอย่างยูนิตผู้ใช้แบบกำหนดเองเมื่อต้องการพาธการติดตั้งเฉพาะ:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (เนทีฟ)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

การเริ่มต้นภายใต้การจัดการแบบเนทีฟของ Windows ใช้งาน Scheduled Task ชื่อ `OpenClaw Gateway`
(หรือ `OpenClaw Gateway (<profile>)` สำหรับโปรไฟล์ที่มีชื่อ) หากการสร้าง Scheduled Task
ถูกปฏิเสธ OpenClaw จะกลับไปใช้ตัวเรียกใช้งานในโฟลเดอร์ Startup สำหรับผู้ใช้แต่ละราย
ซึ่งชี้ไปยัง `gateway.cmd` ภายในไดเรกทอรีสถานะ

  </Tab>

  <Tab title="Linux (บริการระบบ)">

ใช้ยูนิตระบบสำหรับโฮสต์ที่มีผู้ใช้หลายคน/ทำงานตลอดเวลา

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

ใช้เนื้อหาบริการเดียวกับยูนิตผู้ใช้ แต่ติดตั้งไว้ภายใต้
`/etc/systemd/system/openclaw-gateway[-<profile>].service` และปรับ
`ExecStart=` หากไบนารี `openclaw` อยู่ที่อื่น

อย่าให้ `openclaw doctor --fix` ติดตั้งบริการ Gateway ระดับผู้ใช้สำหรับโปรไฟล์/พอร์ตเดียวกันด้วย Doctor จะปฏิเสธการติดตั้งอัตโนมัตินั้นเมื่อตรวจพบบริการ Gateway ของ OpenClaw ระดับระบบ ให้ใช้ `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อยูนิตระบบเป็นเจ้าของวงจรชีวิต

  </Tab>
</Tabs>

ข้อผิดพลาดจากการกำหนดค่าที่ไม่ถูกต้องจะออกด้วยรหัส `78` ยูนิต systemd ของ Linux ใช้ `RestartPreventExitStatus=78` เพื่อหยุดการเรียกใช้ซ้ำจนกว่าจะแก้ไขการกำหนดค่า launchd และ Windows Task Scheduler ไม่มีกฎหยุดตามรหัสออกที่เทียบเท่า ดังนั้น Gateway จึงบันทึกประวัติการบูตที่ไม่สมบูรณ์อย่างรวดเร็วไว้ด้วย และระงับการเริ่มต้นบัญชีช่องทาง/ผู้ให้บริการโดยอัตโนมัติหลังจากเริ่มต้นล้มเหลวซ้ำ ๆ ในโหมดปลอดภัยดังกล่าว ระนาบควบคุมยังคงเริ่มทำงานเพื่อให้ตรวจสอบและซ่อมแซมได้ การโหลดการกำหนดค่าใหม่แบบทันทีและ `secrets.reload` จะปฏิเสธการเริ่มช่องทางใหม่โดยอัตโนมัติ และคำขอ `channels.start` จากผู้ควบคุมอย่างชัดเจนสามารถแทนที่การระงับนี้ได้

## เส้นทางด่วนสำหรับโปรไฟล์พัฒนา

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

ค่าเริ่มต้นประกอบด้วยสถานะ/การกำหนดค่าที่แยกจากกัน และพอร์ต Gateway พื้นฐาน `19001`

## เอกสารอ้างอิงด่วนของโปรโตคอล (มุมมองผู้ควบคุม)

- เฟรมแรกของไคลเอ็นต์ต้องเป็น `connect`
- Gateway ส่งคืนเฟรม `hello-ok` พร้อม `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`) รวมถึงขีดจำกัด `policy` (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`)
- `hello-ok.features.methods` / `events` เป็นรายการสำหรับการค้นหาแบบอนุรักษนิยม ไม่ใช่
  รายการที่สร้างขึ้นจากทุกเส้นทางตัวช่วยที่เรียกใช้ได้
- คำขอ: `req(method, params)` → `res(ok/payload|error)`
- เหตุการณ์ทั่วไปประกอบด้วย `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, เหตุการณ์ที่ต้องเลือกรับ
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, เหตุการณ์วงจรชีวิตการจับคู่/การอนุมัติ และ `shutdown`

การเรียกใช้เอเจนต์มีสองขั้นตอน:

1. การตอบรับทันทีว่าได้รับคำขอแล้ว (`status:"accepted"`)
2. การตอบกลับเมื่อเสร็จสมบูรณ์ขั้นสุดท้าย (`status:"ok"|"error"`) โดยมีการสตรีมเหตุการณ์ `agent` ในระหว่างนั้น

ดูเอกสารโปรโตคอลฉบับเต็ม: [โปรโตคอล Gateway](/th/gateway/protocol)

## การตรวจสอบการทำงาน

### การยังทำงานอยู่

- เปิด WS และส่ง `connect`
- คาดว่าจะได้รับการตอบกลับ `hello-ok` พร้อมสแนปช็อต

### ความพร้อมใช้งาน

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### การกู้คืนเมื่อมีช่องว่าง

เหตุการณ์จะไม่ถูกเล่นซ้ำ เมื่อพบช่องว่างในลำดับ ให้รีเฟรชสถานะ (`health`, `system-presence`) ก่อนดำเนินการต่อ

## รูปแบบความล้มเหลวที่พบบ่อย

| รูปแบบ                                                         | ปัญหาที่เป็นไปได้                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | ผูกกับอินเทอร์เฟซที่ไม่ใช่ลูปแบ็กโดยไม่มีเส้นทางการยืนยันตัวตน Gateway ที่ถูกต้อง |
| `another gateway instance is already listening` / `EADDRINUSE` | พอร์ตขัดแย้ง                                                                  |
| `Gateway start blocked: set gateway.mode=local`                | กำหนดค่าคอนฟิกเป็นโหมดระยะไกล หรือ `gateway.mode` หายไปจากคอนฟิกที่เสียหาย |
| `unauthorized` ระหว่างการเชื่อมต่อ                                  | การยืนยันตัวตนระหว่างไคลเอ็นต์กับ Gateway ไม่ตรงกัน                           |

สำหรับลำดับขั้นการวินิจฉัยฉบับเต็ม โปรดดู [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)

## การรับประกันด้านความปลอดภัย

- ไคลเอ็นต์โปรโตคอล Gateway จะล้มเหลวทันทีเมื่อ Gateway ไม่พร้อมใช้งาน (ไม่มีการย้อนกลับไปใช้ช่องทางโดยตรงโดยปริยาย)
- เฟรมแรกที่ไม่ถูกต้องหรือไม่ใช่เฟรมเชื่อมต่อจะถูกปฏิเสธและปิดการเชื่อมต่อ
- การปิดระบบอย่างเหมาะสมจะส่งเหตุการณ์ `shutdown` ก่อนปิดซ็อกเก็ต

## ที่เกี่ยวข้อง

- [การกำหนดค่า](/th/gateway/configuration)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
- [กระบวนการเบื้องหลัง](/th/gateway/background-process)
- [สถานะระบบ](/th/gateway/health)
- [Doctor](/th/gateway/doctor)
- [การยืนยันตัวตน](/th/gateway/authentication)
- [การเข้าถึงจากระยะไกล](/th/gateway/remote)
- [การจัดการข้อมูลลับ](/th/gateway/secrets)
