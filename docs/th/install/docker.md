---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์แทนการติดตั้งภายในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของโฟลว์ Docker
summary: การตั้งค่าและการเริ่มต้นใช้งานแบบใช้ Docker ที่เป็นทางเลือกสำหรับ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-05T08:26:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f57db2ec12f1a1fd681ec90cc43b2c945755a9240f571de46688777e957f1b8e
    source_path: install/docker.md
    workflow: 16
---

Docker เป็น **ตัวเลือกเสริม** ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบคอนเทนเนอร์ หรือต้องการตรวจสอบโฟลว์ Docker

## Docker เหมาะกับฉันหรือไม่?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway ที่แยกออกมา ใช้แล้วทิ้งได้ หรือต้องการรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งในเครื่อง
- **ไม่**: คุณกำลังรันบนเครื่องของคุณเองและต้องการลูปพัฒนาที่เร็วที่สุด ให้ใช้โฟลว์การติดตั้งปกติแทน
- **หมายเหตุเรื่อง Sandbox**: แบ็กเอนด์ Sandbox เริ่มต้นจะใช้ Docker เมื่อเปิดใช้ Sandbox แต่ Sandbox ปิดอยู่ตามค่าเริ่มต้น และ **ไม่** ต้องให้ Gateway ทั้งหมดรันใน Docker นอกจากนี้ยังมีแบ็กเอนด์ Sandbox แบบ SSH และ OpenShell ด้วย ดู [การทำ Sandbox](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการสร้างอิมเมจ (`pnpm install` อาจถูก OOM-killed บนโฮสต์ 1 GB พร้อม exit 137)
- พื้นที่ดิสก์เพียงพอสำหรับอิมเมจและล็อก
- หากรันบน VPS/โฮสต์สาธารณะ ให้ทบทวน
  [การเสริมความปลอดภัยสำหรับการเปิดให้เข้าถึงผ่านเครือข่าย](/th/gateway/security)
  โดยเฉพาะนโยบายไฟร์วอลล์ `DOCKER-USER` ของ Docker

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="สร้างอิมเมจ">
    จากรากของ repo ให้รันสคริปต์ตั้งค่า:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะสร้างอิมเมจ Gateway ในเครื่อง หากต้องการใช้อิมเมจที่สร้างไว้ล่วงหน้าแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    อิมเมจที่สร้างไว้ล่วงหน้าถูกเผยแพร่ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    แท็กทั่วไป: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="ทำการเริ่มต้นใช้งานให้เสร็จ">
    สคริปต์ตั้งค่าจะรันการเริ่มต้นใช้งานโดยอัตโนมัติ โดยจะ:

    - แจ้งให้กรอกคีย์ API ของผู้ให้บริการ
    - สร้างโทเค็น Gateway และเขียนลงใน `.env`
    - เริ่ม Gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า การเริ่มต้นใช้งานก่อนเริ่มระบบและการเขียนค่าคอนฟิกจะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` ใช้สำหรับคำสั่งที่คุณรันหลังจาก
    คอนเทนเนอร์ Gateway มีอยู่แล้ว

  </Step>

  <Step title="เปิด Control UI">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ แล้ววางความลับร่วมที่กำหนดค่าไว้
    ใน Settings สคริปต์ตั้งค่าจะเขียนโทเค็นลงใน `.env` ตามค่าเริ่มต้น
    หากคุณเปลี่ยนคอนฟิกคอนเทนเนอร์ไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้
    รหัสผ่านนั้นแทน

    ต้องการ URL อีกครั้งหรือไม่?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="กำหนดค่าช่องทาง (ไม่บังคับ)">
    ใช้คอนเทนเนอร์ CLI เพื่อเพิ่มช่องทางการส่งข้อความ:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Telegram](/th/channels/telegram), [Discord](/th/channels/discord)

  </Step>
</Steps>

### โฟลว์แบบแมนนวล

หากคุณต้องการรันแต่ละขั้นตอนด้วยตัวเองแทนการใช้สคริปต์ตั้งค่า:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
รัน `docker compose` จากรากของ repo หากคุณเปิดใช้ `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ตั้งค่าจะเขียน `docker-compose.extra.yml`;
ให้รวมไฟล์นั้นด้วย `-f docker-compose.yml -f docker-compose.extra.yml`
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้เนมสเปซเครือข่ายร่วมกับ `openclaw-gateway` จึงเป็น
เครื่องมือหลังเริ่มระบบ ก่อน `docker compose up -d openclaw-gateway` ให้รันการเริ่มต้นใช้งาน
และการเขียนคอนฟิกช่วงตั้งค่าผ่าน `openclaw-gateway` ด้วย
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ตั้งค่ารองรับตัวแปรสภาพแวดล้อมเสริมเหล่านี้:

| ตัวแปร                                     | วัตถุประสงค์                                                     |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ใช้อิมเมจระยะไกลแทนการสร้างในเครื่อง                         |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่าง build (คั่นด้วยช่องว่าง)  |
| `OPENCLAW_EXTENSIONS`                      | รวมตัวช่วย Plugin ที่บันเดิลไว้ซึ่งเลือกไว้ในเวลา build       |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mount โฮสต์เพิ่มเติม (คั่นด้วยจุลภาค `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | เก็บ `/home/node` ไว้ใน Docker volume แบบมีชื่อ               |
| `OPENCLAW_SANDBOX`                         | เลือกใช้การบูตสแตรป Sandbox (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_SKIP_ONBOARDING`                 | ข้ามขั้นตอนการเริ่มต้นใช้งานแบบโต้ตอบ (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | แทนที่พาธซ็อกเก็ต Docker                                      |
| `OPENCLAW_DISABLE_BONJOUR`                 | ปิดการประกาศ Bonjour/mDNS (ค่าเริ่มต้นเป็น `1` สำหรับ Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | ปิดโอเวอร์เลย์ bind-mount ของซอร์ส Plugin ที่บันเดิลไว้       |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | เอนด์พอยต์คอลเลกเตอร์ OTLP/HTTP ที่ใช้ร่วมกันสำหรับการส่งออก OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | เอนด์พอยต์ OTLP เฉพาะสัญญาณสำหรับ traces, metrics หรือ logs  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | การแทนที่โปรโตคอล OTLP ปัจจุบันรองรับเฉพาะ `http/protobuf`   |
| `OTEL_SERVICE_NAME`                        | ชื่อบริการที่ใช้สำหรับรีซอร์ส OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | เลือกใช้แอตทริบิวต์เชิงความหมาย GenAI รุ่นทดลองล่าสุด       |
| `OPENCLAW_OTEL_PRELOADED`                  | ข้ามการเริ่ม OpenTelemetry SDK ตัวที่สองเมื่อมีตัวหนึ่งโหลดไว้ล่วงหน้า |

ผู้ดูแลสามารถทดสอบซอร์ส Plugin ที่บันเดิลไว้กับอิมเมจแบบแพ็กเกจได้โดยเมานต์
ไดเรกทอรีซอร์ส Plugin หนึ่งรายการทับพาธซอร์สแบบแพ็กเกจของมัน เช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ไดเรกทอรีซอร์สที่เมานต์นั้นจะแทนที่บันเดิลที่คอมไพล์แล้วซึ่งตรงกันที่
`/app/dist/extensions/synology-chat` สำหรับ Plugin id เดียวกัน

### ความสามารถในการสังเกต

การส่งออก OpenTelemetry เป็นทราฟฟิกขาออกจากคอนเทนเนอร์ Gateway ไปยัง
คอลเลกเตอร์ OTLP ของคุณ ไม่จำเป็นต้องมีพอร์ต Docker ที่เผยแพร่ หากคุณสร้างอิมเมจ
ในเครื่องและต้องการให้ exporter OpenTelemetry ที่บันเดิลไว้พร้อมใช้งานภายในอิมเมจ
ให้รวม runtime dependencies ของมัน:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ติดตั้ง Plugin ทางการ `@openclaw/diagnostics-otel` จาก ClawHub ในการติดตั้ง
Docker แบบแพ็กเกจก่อนเปิดใช้การส่งออก อิมเมจที่สร้างจากซอร์สแบบกำหนดเองยังสามารถ
รวมซอร์ส Plugin ในเครื่องด้วย
`OPENCLAW_EXTENSIONS=diagnostics-otel` ได้ หากต้องการเปิดใช้การส่งออก ให้อนุญาตและเปิดใช้
Plugin `diagnostics-otel` ในคอนฟิก จากนั้นตั้ง
`diagnostics.otel.enabled=true` หรือใช้ตัวอย่างคอนฟิกใน [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)
เฮดเดอร์การยืนยันตัวตนของคอลเลกเตอร์กำหนดค่าผ่าน
`diagnostics.otel.headers` ไม่ใช่ผ่านตัวแปรสภาพแวดล้อม Docker

เมตริก Prometheus ใช้พอร์ต Gateway ที่เผยแพร่อยู่แล้ว ติดตั้ง
`clawhub:@openclaw/diagnostics-prometheus` เปิดใช้
Plugin `diagnostics-prometheus` แล้วจึง scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

เส้นทางนี้ได้รับการป้องกันด้วยการยืนยันตัวตนของ Gateway อย่าเปิดเผยพอร์ต
`/metrics` สาธารณะแยกต่างหาก หรือพาธ reverse-proxy ที่ไม่ผ่านการยืนยันตัวตน ดู
[เมตริก Prometheus](/th/gateway/prometheus)

### การตรวจสอบสุขภาพ

เอนด์พอยต์ probe ของคอนเทนเนอร์ (ไม่ต้องยืนยันตัวตน):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

อิมเมจ Docker มี `HEALTHCHECK` ในตัวที่ ping `/healthz`
หากการตรวจสอบล้มเหลวต่อเนื่อง Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy` และ
ระบบ orchestration สามารถรีสตาร์ตหรือแทนที่คอนเทนเนอร์นั้นได้

สแนปช็อตสุขภาพเชิงลึกที่ต้องยืนยันตัวตน:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับลูปแบ็ก

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` ทำงานกับการเผยแพร่พอร์ต Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์ของโฮสต์และ CLI ของโฮสต์เข้าถึงพอร์ต Gateway ที่เผยแพร่ได้
- `loopback`: เฉพาะกระบวนการภายในเนมสเปซเครือข่ายของคอนเทนเนอร์เท่านั้นที่เข้าถึง
  Gateway ได้โดยตรง

<Note>
ใช้ค่าโหมด bind ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่นามแฝงโฮสต์อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### ผู้ให้บริการในเครื่องโฮสต์

เมื่อ OpenClaw รันใน Docker ค่า `127.0.0.1` ภายในคอนเทนเนอร์คือคอนเทนเนอร์
เอง ไม่ใช่เครื่องโฮสต์ของคุณ ใช้ `host.docker.internal` สำหรับผู้ให้บริการ AI ที่
รันบนโฮสต์:

| ผู้ให้บริการ | URL เริ่มต้นของโฮสต์     | URL สำหรับการตั้งค่า Docker        |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่า Docker ที่บันเดิลไว้ใช้ URL โฮสต์เหล่านั้นเป็นค่าเริ่มต้นของการเริ่มต้นใช้งาน
LM Studio และ Ollama และ `docker-compose.yml` แมป `host.docker.internal` ไปยัง
Gateway ของโฮสต์ Docker สำหรับ Linux Docker Engine โดย Docker Desktop มี
ชื่อโฮสต์เดียวกันนี้บน macOS และ Windows อยู่แล้ว

บริการบนโฮสต์ต้อง listen บนที่อยู่ที่ Docker เข้าถึงได้ด้วย:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

หากคุณใช้ไฟล์ Compose ของคุณเองหรือคำสั่ง `docker run` ให้เพิ่มการแมปโฮสต์เดียวกัน
ด้วยตัวเอง เช่น
`--add-host=host.docker.internal:host-gateway`

### Bonjour / mDNS

เครือข่าย bridge ของ Docker มักไม่ forward มัลติคาสต์ Bonjour/mDNS
(`224.0.0.251:5353`) อย่างเชื่อถือได้ ดังนั้นการตั้งค่า Compose ที่บันเดิลไว้จึงตั้งค่าเริ่มต้น
`OPENCLAW_DISABLE_BONJOUR=1` เพื่อไม่ให้ Gateway crash-loop หรือเริ่มการประกาศซ้ำๆ
เมื่อ bridge ทิ้งทราฟฟิกมัลติคาสต์

ใช้ URL Gateway ที่เผยแพร่ไว้, Tailscale หรือ wide-area DNS-SD สำหรับโฮสต์ Docker
ตั้ง `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วย host networking, macvlan
หรือเครือข่ายอื่นที่ทราบว่า multicast ของ mDNS ทำงานได้

สำหรับข้อควรระวังและการแก้ไขปัญหา ดู [การค้นพบ Bonjour](/th/gateway/bonjour)

### พื้นที่จัดเก็บและการคงอยู่

Docker Compose จะ bind-mount `OPENCLAW_CONFIG_DIR` ไปที่ `/home/node/.openclaw` และ
`OPENCLAW_WORKSPACE_DIR` ไปที่ `/home/node/.openclaw/workspace` ดังนั้นพาธเหล่านี้
จะคงอยู่หลังการแทนที่คอนเทนเนอร์ เมื่อตัวแปรใดตัวแปรหนึ่งไม่ได้ตั้งค่า
`docker-compose.yml` ที่บันเดิลไว้จะ fallback ไปที่ `${HOME}/.openclaw` (และ
`${HOME}/.openclaw/workspace` สำหรับการเมานต์ workspace) หรือ `/tmp/.openclaw`
เมื่อ `HOME` เองก็หายไปด้วย วิธีนี้ทำให้ `docker compose up` ไม่
ปล่อย spec ของ volume ที่มี source ว่างบนสภาพแวดล้อมเปล่า

ไดเรกทอรีคอนฟิกที่เมานต์นี้คือที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับคอนฟิกพฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับ OAuth/API-key auth ของผู้ให้บริการที่จัดเก็บไว้
- `.env` สำหรับความลับ runtime ที่อิง env เช่น `OPENCLAW_GATEWAY_TOKEN`

Plugin ที่ดาวน์โหลดและติดตั้งแล้วจะเก็บสถานะแพ็กเกจไว้ภายใต้ OpenClaw home ที่เมานต์ไว้
ดังนั้นระเบียนการติดตั้ง Plugin และรากแพ็กเกจจะคงอยู่หลังการแทนที่คอนเทนเนอร์
การเริ่มต้น Gateway จะไม่สร้าง dependency trees ของ Plugin ที่บันเดิลไว้

สำหรับรายละเอียดการคงอยู่ฉบับเต็มในการ deploy บน VM ดู
[รันไทม์ VM ของ Docker - สิ่งใดคงอยู่ที่ใด](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ดิสก์มักโตเร็ว:** เฝ้าดู `media/`, ไฟล์ JSONL ของเซสชัน,
`cron/runs/*.jsonl`, รากแพ็กเกจ Plugin ที่ติดตั้งไว้ และไฟล์บันทึกแบบหมุนเวียน
ใต้ `/tmp/openclaw/`

### ตัวช่วย Shell (ไม่บังคับ)

เพื่อให้จัดการ Docker รายวันได้ง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จากพาธ raw เก่า `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้งเพื่อให้ไฟล์ตัวช่วยในเครื่องของคุณติดตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` ฯลฯ รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดู [ClawDock](/th/install/clawdock) สำหรับคู่มือตัวช่วยฉบับเต็ม

<AccordionGroup>
  <Accordion title="เปิดใช้งาน Sandbox ของเอเจนต์สำหรับ Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    พาธซ็อกเก็ตกำหนดเอง (เช่น Docker แบบ rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    สคริปต์จะเมานต์ `docker.sock` เฉพาะหลังจากข้อกำหนดเบื้องต้นของ Sandbox ผ่านแล้ว หาก
    ตั้งค่า Sandbox ให้เสร็จสมบูรณ์ไม่ได้ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    เป็น `off`

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ / CI (ไม่โต้ตอบ)">
    ปิดใช้งานการจัดสรร pseudo-TTY ของ Compose ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="หมายเหตุด้านความปลอดภัยของเครือข่ายที่ใช้ร่วมกัน">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` เพื่อให้คำสั่ง
    CLI เข้าถึง Gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความเชื่อถือร่วมกัน
    คอนฟิก compose จะถอด `NET_RAW`/`NET_ADMIN` และเปิดใช้งาน
    `no-new-privileges` ทั้งบน `openclaw-gateway` และ `openclaw-cli`
  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    อิมเมจทำงานเป็น `node` (uid 1000) หากคุณเห็นข้อผิดพลาดด้านสิทธิ์บน
    `/home/node/.openclaw` ให้ตรวจสอบว่า bind mount ของโฮสต์เป็นของ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="การ rebuild ที่เร็วขึ้น">
    จัดลำดับ Dockerfile ของคุณเพื่อให้เลเยอร์ dependency ถูกแคช วิธีนี้หลีกเลี่ยงการรัน
    `pnpm install` ซ้ำ เว้นแต่ lockfile จะเปลี่ยน:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="ตัวเลือกคอนเทนเนอร์สำหรับผู้ใช้ขั้นสูง">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อน และทำงานเป็น `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์ที่มี
    ฟีเจอร์ครบขึ้น:

    1. **คงอยู่ `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง system deps**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ติดตั้งเบราว์เซอร์ Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **คงอยู่การดาวน์โหลดเบราว์เซอร์**: ตั้งค่า
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` และใช้
       `OPENCLAW_HOME_VOLUME` หรือ `OPENCLAW_EXTRA_MOUNTS`

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบ headless)">
    หากคุณเลือก OpenAI Codex OAuth ในวิซาร์ด ระบบจะเปิด URL ของเบราว์เซอร์ ใน
    Docker หรือการตั้งค่าแบบ headless ให้คัดลอก URL redirect แบบเต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปในวิซาร์ดเพื่อทำ auth ให้เสร็จ
  </Accordion>

  <Accordion title="เมตาดาตาของอิมเมจฐาน">
    อิมเมจรันไทม์ Docker หลักใช้ `node:24-bookworm-slim` และเผยแพร่ annotation ของ OCI
    base-image รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และอื่นๆ digest ของฐาน Node จะถูก
    รีเฟรชผ่าน Dependabot Docker base-image PR; release build ไม่ได้รัน
    เลเยอร์อัปเกรด distro ดู
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### รันบน VPS?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอนการ deploy VM ที่ใช้ร่วมกัน
รวมถึงการฝัง binary, persistence และการอัปเดต

## Sandbox ของเอเจนต์

เมื่อเปิดใช้งาน `agents.defaults.sandbox` ด้วย backend ของ Docker, Gateway
จะรันการปฏิบัติการเครื่องมือของเอเจนต์ (shell, อ่าน/เขียนไฟล์ ฯลฯ) ภายในคอนเทนเนอร์ Docker
ที่แยกออกจากกัน ขณะที่ Gateway เองยังอยู่บนโฮสต์ วิธีนี้ให้กำแพงกั้นที่แข็งแรง
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือมีหลายผู้เช่า โดยไม่ต้องทำให้ Gateway ทั้งหมดเป็นคอนเทนเนอร์

ขอบเขต Sandbox สามารถเป็นต่อเอเจนต์ (ค่าเริ่มต้น), ต่อเซสชัน หรือใช้ร่วมกัน แต่ละขอบเขต
จะมี workspace ของตัวเองที่เมานต์ไว้ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบายอนุญาต/ปฏิเสธเครื่องมือ, การแยกเครือข่าย, ขีดจำกัดทรัพยากร และคอนเทนเนอร์
เบราว์เซอร์ได้

สำหรับคอนฟิกแบบเต็ม อิมเมจ หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ ดู:

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง Sandbox ฉบับสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึง shell แบบโต้ตอบไปยังคอนเทนเนอร์ Sandbox
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การ override ต่อเอเจนต์

### เปิดใช้งานอย่างรวดเร็ว

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

สร้างอิมเมจ Sandbox เริ่มต้น (จาก source checkout):

```bash
scripts/sandbox-setup.sh
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout ดู [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="อิมเมจหายไปหรือคอนเทนเนอร์ Sandbox ไม่เริ่มทำงาน">
    สร้างอิมเมจ Sandbox ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) หรือคำสั่ง `docker build` แบบ inline จาก [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) (ติดตั้ง npm),
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็นอิมเมจกำหนดเองของคุณ
    คอนเทนเนอร์จะถูกสร้างอัตโนมัติต่อเซสชันเมื่อต้องการ
  </Accordion>

  <Accordion title="ข้อผิดพลาดด้านสิทธิ์ใน Sandbox">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับ ownership ของ workspace ที่เมานต์ไว้ของคุณ
    หรือ chown โฟลเดอร์ workspace
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือกำหนดเองใน Sandbox">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่งจะ source
    `/etc/profile` และอาจรีเซ็ต PATH ตั้งค่า `docker.env.PATH` เพื่อเติมพาธ
    เครื่องมือกำหนดเองของคุณไว้ด้านหน้า หรือเพิ่มสคริปต์ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM-killed ระหว่าง build อิมเมจ (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ใช้คลาสเครื่องที่ใหญ่ขึ้นแล้วลองใหม่
  </Accordion>

  <Accordion title="Unauthorized หรือต้อง pairing ใน Control UI">
    ดึงลิงก์แดชบอร์ดใหม่และอนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    รายละเอียดเพิ่มเติม: [Dashboard](/th/web/dashboard), [Devices](/th/cli/devices)

  </Accordion>

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือเกิดข้อผิดพลาด pairing จาก Docker CLI">
    รีเซ็ตโหมด Gateway และ bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [Install Overview](/th/install) — วิธีการติดตั้งทั้งหมด
- [Podman](/th/install/podman) — ทางเลือก Podman แทน Docker
- [ClawDock](/th/install/clawdock) — การตั้งค่า Docker Compose จากชุมชน
- [Updating](/th/install/updating) — การทำให้ OpenClaw เป็นเวอร์ชันล่าสุด
- [Configuration](/th/gateway/configuration) — คอนฟิก Gateway หลังติดตั้ง
