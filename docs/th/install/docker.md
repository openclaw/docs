---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์แทนการติดตั้งในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของขั้นตอนการทำงานของ Docker
summary: การตั้งค่าและเริ่มต้นใช้งาน OpenClaw ผ่าน Docker (ไม่บังคับ)
title: Docker
x-i18n:
    generated_at: "2026-05-10T19:43:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 810ad901cafda4adad477ea3aeb5940e0bc2bd4a24b15d5f9ab0c172ed943a94
    source_path: install/docker.md
    workflow: 16
---

Docker เป็น **ทางเลือก** ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบคอนเทนเนอร์ หรือต้องการตรวจสอบขั้นตอนการทำงานของ Docker

## Docker เหมาะกับฉันหรือไม่?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway ที่แยกโดดเดี่ยวและทิ้งได้ หรือต้องการรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งในเครื่อง
- **ไม่**: คุณกำลังรันบนเครื่องของคุณเองและต้องการวงจรพัฒนาที่เร็วที่สุดเท่านั้น ให้ใช้ขั้นตอนการติดตั้งปกติแทน
- **หมายเหตุเรื่องแซนด์บ็อกซ์**: แบ็กเอนด์แซนด์บ็อกซ์เริ่มต้นใช้ Docker เมื่อเปิดใช้แซนด์บ็อกซ์ แต่แซนด์บ็อกซ์ปิดอยู่โดยค่าเริ่มต้น และ **ไม่** ต้องให้ Gateway ทั้งหมดรันใน Docker นอกจากนี้ยังมีแบ็กเอนด์แซนด์บ็อกซ์ SSH และ OpenShell ดู [แซนด์บ็อกซ์](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการสร้างอิมเมจ (`pnpm install` อาจถูกหยุดเพราะ OOM บนโฮสต์ 1 GB พร้อมรหัสออก 137)
- พื้นที่ดิสก์เพียงพอสำหรับอิมเมจและบันทึก
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ
  [การเสริมความปลอดภัยสำหรับการเปิดเผยบนเครือข่าย](/th/gateway/security)
  โดยเฉพาะนโยบายไฟร์วอลล์ Docker `DOCKER-USER`

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="Build the image">
    จากรูทของรีโป ให้รันสคริปต์ตั้งค่า:

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

  <Step title="Complete onboarding">
    สคริปต์ตั้งค่าจะรันการเริ่มต้นใช้งานโดยอัตโนมัติ โดยจะ:

    - ขอคีย์ API ของผู้ให้บริการ
    - สร้างโทเค็น Gateway และเขียนลงใน `.env`
    - เริ่ม Gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า การเริ่มต้นใช้งานก่อนเริ่มระบบและการเขียนค่าคอนฟิกจะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` ใช้สำหรับคำสั่งที่คุณรันหลังจาก
    คอนเทนเนอร์ Gateway มีอยู่แล้ว

  </Step>

  <Step title="Open the Control UI">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ของคุณ แล้ววาง shared secret
    ที่ตั้งค่าไว้ลงใน Settings โดยค่าเริ่มต้น สคริปต์ตั้งค่าจะเขียนโทเค็นลงใน `.env`;
    หากคุณเปลี่ยนคอนฟิกคอนเทนเนอร์ไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้
    รหัสผ่านนั้นแทน

    ต้องการ URL อีกครั้งหรือไม่?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    ใช้คอนเทนเนอร์ CLI เพื่อเพิ่มช่องทางรับส่งข้อความ:

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

### ขั้นตอนแบบ manual

หากคุณต้องการรันแต่ละขั้นตอนด้วยตนเองแทนการใช้สคริปต์ตั้งค่า:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
รัน `docker compose` จากรูทของรีโป หากคุณเปิดใช้ `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ตั้งค่าจะเขียน `docker-compose.extra.yml`;
ให้รวมไฟล์นั้นด้วย `-f docker-compose.yml -f docker-compose.extra.yml`
</Note>

<Note>
เนื่องจาก `openclaw-cli` แชร์เนมสเปซเครือข่ายของ `openclaw-gateway` จึงเป็น
เครื่องมือหลังเริ่มระบบ ก่อน `docker compose up -d openclaw-gateway` ให้รันการเริ่มต้นใช้งาน
และการเขียนคอนฟิกในช่วงตั้งค่าผ่าน `openclaw-gateway` พร้อม
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ตั้งค่ารองรับตัวแปรสภาพแวดล้อมเสริมเหล่านี้:

| ตัวแปร                                   | วัตถุประสงค์                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ใช้อิมเมจระยะไกลแทนการสร้างในเครื่อง                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่างการสร้าง (คั่นด้วยช่องว่าง)       |
| `OPENCLAW_EXTENSIONS`                      | รวมตัวช่วย Plugin ที่บันเดิลไว้ซึ่งเลือกไว้ในช่วงสร้าง           |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mount เพิ่มเติมจากโฮสต์ (คั่นด้วยจุลภาค `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | เก็บ `/home/node` ไว้ถาวรใน named Docker volume                   |
| `OPENCLAW_SANDBOX`                         | เลือกใช้การบูตสแตรปแซนด์บ็อกซ์ (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | ข้ามขั้นตอนการเริ่มต้นใช้งานแบบโต้ตอบ (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | แทนที่พาธ Docker socket                                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | ปิดการโฆษณา Bonjour/mDNS (ค่าเริ่มต้นคือ `1` สำหรับ Docker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | ปิด bundled plugin source bind-mount overlays               |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | เอนด์พอยต์ collector OTLP/HTTP ที่แชร์สำหรับการส่งออก OpenTelemetry    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | เอนด์พอยต์ OTLP เฉพาะสัญญาณสำหรับ traces, metrics หรือ logs     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | การแทนที่โปรโตคอล OTLP ปัจจุบันรองรับเฉพาะ `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | ชื่อบริการที่ใช้สำหรับทรัพยากร OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | เลือกใช้แอตทริบิวต์เชิงความหมาย GenAI รุ่นทดลองล่าสุด         |
| `OPENCLAW_OTEL_PRELOADED`                  | ข้ามการเริ่ม OpenTelemetry SDK ตัวที่สองเมื่อมีตัวหนึ่งโหลดไว้ล่วงหน้า  |

ผู้ดูแลสามารถทดสอบซอร์สของ Plugin ที่บันเดิลไว้กับอิมเมจแบบแพ็กเกจได้โดยเมานต์
ไดเรกทอรีซอร์สของ Plugin หนึ่งรายการทับพาธซอร์สแบบแพ็กเกจของมัน เช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ไดเรกทอรีซอร์สที่เมานต์นั้นจะแทนที่บันเดิลที่คอมไพล์แล้วที่ตรงกัน
`/app/dist/extensions/synology-chat` สำหรับ id ของ Plugin เดียวกัน

### ความสามารถในการสังเกต

การส่งออก OpenTelemetry เป็นขาออกจากคอนเทนเนอร์ Gateway ไปยัง OTLP
collector ของคุณ ไม่ต้องใช้พอร์ต Docker ที่เผยแพร่ หากคุณสร้างอิมเมจ
ในเครื่องและต้องการให้ exporter ของ OpenTelemetry ที่บันเดิลไว้พร้อมใช้งานภายในอิมเมจ
ให้รวม runtime dependencies ของมัน:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ติดตั้ง Plugin ทางการ `@openclaw/diagnostics-otel` จาก ClawHub ใน
การติดตั้ง Docker แบบแพ็กเกจก่อนเปิดใช้การส่งออก อิมเมจที่สร้างจากซอร์สแบบกำหนดเองยังคง
รวมซอร์ส Plugin ในเครื่องได้ด้วย
`OPENCLAW_EXTENSIONS=diagnostics-otel` หากต้องการเปิดใช้การส่งออก ให้อนุญาตและเปิดใช้
Plugin `diagnostics-otel` ในคอนฟิก จากนั้นตั้งค่า
`diagnostics.otel.enabled=true` หรือใช้ตัวอย่างคอนฟิกใน [การส่งออก OpenTelemetry
](/th/gateway/opentelemetry) ส่วนหัวสำหรับการยืนยันตัวตนกับ collector ตั้งค่าผ่าน
`diagnostics.otel.headers` ไม่ใช่ผ่านตัวแปรสภาพแวดล้อมของ Docker

เมตริก Prometheus ใช้พอร์ต Gateway ที่เผยแพร่อยู่แล้ว ติดตั้ง
`clawhub:@openclaw/diagnostics-prometheus`, เปิดใช้
Plugin `diagnostics-prometheus` แล้ว scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

เส้นทางนี้ได้รับการป้องกันด้วยการยืนยันตัวตนของ Gateway อย่าเปิดเผยพอร์ต
สาธารณะ `/metrics` แยกต่างหาก หรือพาธ reverse-proxy ที่ไม่ต้องยืนยันตัวตน ดู
[เมตริก Prometheus](/th/gateway/prometheus)

### การตรวจสอบสุขภาพ

เอนด์พอยต์ตรวจสอบคอนเทนเนอร์ (ไม่ต้องยืนยันตัวตน):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

อิมเมจ Docker มี `HEALTHCHECK` ในตัวที่ ping `/healthz`
หากการตรวจสอบล้มเหลวต่อเนื่อง Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy` และ
ระบบ orchestration สามารถรีสตาร์ตหรือแทนที่คอนเทนเนอร์ได้

สแนปช็อตสุขภาพเชิงลึกที่ต้องยืนยันตัวตน:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับลูปแบ็ก

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` ทำงานได้กับการเผยแพร่พอร์ตของ Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์ของโฮสต์และ CLI ของโฮสต์เข้าถึงพอร์ต Gateway ที่เผยแพร่ได้
- `loopback`: เฉพาะโปรเซสภายในเนมสเปซเครือข่ายของคอนเทนเนอร์เท่านั้นที่เข้าถึง
  Gateway โดยตรงได้

<Note>
ใช้ค่าของโหมด bind ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่ alias ของโฮสต์อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### ผู้ให้บริการในเครื่องบนโฮสต์

เมื่อ OpenClaw รันใน Docker, `127.0.0.1` ภายในคอนเทนเนอร์คือคอนเทนเนอร์
เอง ไม่ใช่เครื่องโฮสต์ของคุณ ใช้ `host.docker.internal` สำหรับผู้ให้บริการ AI ที่
รันบนโฮสต์:

| ผู้ให้บริการ  | URL เริ่มต้นของโฮสต์         | URL สำหรับการตั้งค่า Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่า Docker ที่บันเดิลไว้ใช้ URL ของโฮสต์เหล่านั้นเป็นค่าเริ่มต้นในการเริ่มต้นใช้งาน
ของ LM Studio และ Ollama และ `docker-compose.yml` แมป `host.docker.internal` ไปยัง
Gateway ของโฮสต์ Docker สำหรับ Linux Docker Engine โดย Docker Desktop มี
ชื่อโฮสต์เดียวกันให้อยู่แล้วบน macOS และ Windows

บริการบนโฮสต์ต้อง listen บนที่อยู่ที่ Docker เข้าถึงได้ด้วย:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

หากคุณใช้ไฟล์ Compose ของคุณเองหรือคำสั่ง `docker run` ให้เพิ่มการแมปโฮสต์เดียวกัน
ด้วยตัวเอง เช่น
`--add-host=host.docker.internal:host-gateway`

### Bonjour / mDNS

เครือข่าย bridge ของ Docker มักไม่ส่งต่อ multicast ของ Bonjour/mDNS
(`224.0.0.251:5353`) ได้อย่างเชื่อถือได้ ดังนั้นการตั้งค่า Compose ที่บันเดิลไว้จึงตั้งค่าเริ่มต้น
`OPENCLAW_DISABLE_BONJOUR=1` เพื่อไม่ให้ Gateway crash-loop หรือรีสตาร์ต
การโฆษณาซ้ำๆ เมื่อ bridge ทิ้งทราฟฟิก multicast

ใช้ URL ของ Gateway ที่เผยแพร่แล้ว, Tailscale หรือ wide-area DNS-SD สำหรับโฮสต์ Docker
ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วย host networking, macvlan
หรือเครือข่ายอื่นที่ทราบว่า multicast ของ mDNS ทำงานได้

สำหรับข้อควรระวังและการแก้ไขปัญหา ดู [การค้นพบ Bonjour](/th/gateway/bonjour)

### พื้นที่จัดเก็บและการคงอยู่ถาวร

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw` และ
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` ดังนั้นพาธเหล่านั้น
จึงอยู่รอดหลังการแทนที่คอนเทนเนอร์ เมื่อตัวแปรใดตัวแปรหนึ่งไม่ได้ตั้งค่า ไฟล์
`docker-compose.yml` ที่บันเดิลไว้จะ fallback ไปที่ `${HOME}/.openclaw` (และ
`${HOME}/.openclaw/workspace` สำหรับการเมานต์ workspace) หรือ `/tmp/.openclaw`
เมื่อ `HOME` เองก็หายไปด้วย สิ่งนี้ช่วยให้ `docker compose up` ไม่ปล่อย
volume spec ที่มี source ว่างในสภาพแวดล้อมเปล่า

ไดเรกทอรีคอนฟิกที่เมานต์ไว้นั้นเป็นที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับคอนฟิกพฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับการยืนยันตัวตน OAuth/API-key ของผู้ให้บริการที่จัดเก็บไว้
- `.env` สำหรับ secret รันไทม์ที่อิง env เช่น `OPENCLAW_GATEWAY_TOKEN`

Plugin แบบดาวน์โหลดได้ที่ติดตั้งแล้วจะเก็บสถานะแพ็กเกจภายใต้ OpenClaw home
ที่เมานต์ไว้ ดังนั้นบันทึกการติดตั้ง Plugin และรากแพ็กเกจจึงอยู่รอดหลังการ
แทนที่คอนเทนเนอร์ การเริ่มต้น Gateway จะไม่สร้าง dependency trees ของ bundled-plugin

สำหรับรายละเอียดการคงอยู่ถาวรทั้งหมดบนการปรับใช้ VM ดู
[Docker VM Runtime - สิ่งใดคงอยู่ที่ใด](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ดิสก์มักโตเร็ว:** เฝ้าดู `media/`, ไฟล์ JSONL ของเซสชัน,
`cron/runs/*.jsonl`, รากแพ็กเกจ Plugin ที่ติดตั้งแล้ว และไฟล์ล็อกแบบหมุนเวียน
ใต้ `/tmp/openclaw/`

### ตัวช่วย Shell (ไม่บังคับ)

เพื่อให้จัดการ Docker รายวันได้ง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จากพาธ raw เดิม `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้ง เพื่อให้ไฟล์ตัวช่วยในเครื่องของคุณติดตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` และอื่นๆ รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดูคู่มือตัวช่วยฉบับเต็มที่ [ClawDock](/th/install/clawdock)

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
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

    สคริปต์จะเมานต์ `docker.sock` เฉพาะหลังจากข้อกำหนดเบื้องต้นของ sandbox ผ่านแล้ว หาก
    ตั้งค่า sandbox ไม่สำเร็จ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    เป็น `off`

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    ปิดใช้งานการจัดสรร pseudo-TTY ของ Compose ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` เพื่อให้คำสั่ง CLI
    เข้าถึง Gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความเชื่อถือที่ใช้ร่วมกัน
    คอนฟิก compose จะลดสิทธิ์ `NET_RAW`/`NET_ADMIN` และเปิดใช้งาน
    `no-new-privileges` ทั้งบน `openclaw-gateway` และ `openclaw-cli`
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    การตั้งค่า Docker Desktop บางแบบค้นหา DNS จาก sidecar `openclaw-cli`
    ที่ใช้เครือข่ายร่วมกันไม่สำเร็จหลังจากลดสิทธิ์ `NET_RAW` ซึ่งจะแสดงเป็น
    `EAI_AGAIN` ระหว่างคำสั่งที่พึ่งพา npm เช่น `openclaw plugins install`
    ให้ใช้ไฟล์ compose เริ่มต้นที่เสริมความแข็งแรงไว้สำหรับการทำงาน Gateway ปกติ
    override ในเครื่องด้านล่างจะผ่อนคลายท่าทีด้านความปลอดภัยของคอนเทนเนอร์ CLI โดย
    คืนความสามารถเริ่มต้นของ Docker ดังนั้นให้ใช้เฉพาะกับคำสั่ง CLI แบบครั้งเดียว
    ที่ต้องเข้าถึง package registry เท่านั้น ไม่ใช่เป็นการเรียก Compose เริ่มต้นของคุณ:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    หากคุณสร้างคอนเทนเนอร์ `openclaw-cli` ที่รันระยะยาวไว้แล้ว ให้สร้างใหม่
    ด้วย override เดียวกัน `docker compose exec` และ `docker exec` ไม่สามารถ
    เปลี่ยน Linux capabilities บนคอนเทนเนอร์ที่สร้างไว้แล้วได้

  </Accordion>

  <Accordion title="Permissions and EACCES">
    อิมเมจรันเป็น `node` (uid 1000) หากคุณเห็นข้อผิดพลาดสิทธิ์บน
    `/home/node/.openclaw` ให้ตรวจสอบว่า bind mount บนโฮสต์ของคุณเป็นของ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    ความไม่ตรงกันแบบเดียวกันอาจแสดงเป็นคำเตือน Plugin เช่น
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    ตามด้วย `plugin present but blocked` นั่นหมายความว่า uid ของโปรเซสและเจ้าของ
    ไดเรกทอรี Plugin ที่เมานต์ไม่ตรงกัน ควรรันคอนเทนเนอร์ด้วย uid 1000 เริ่มต้นและแก้
    ownership ของ bind mount ให้ถูกต้อง chown
    `/path/to/openclaw-config/npm` เป็น `root:root` เฉพาะเมื่อคุณตั้งใจรัน
    OpenClaw เป็น root ระยะยาวเท่านั้น

  </Accordion>

  <Accordion title="Faster rebuilds">
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

  <Accordion title="Power-user container options">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยเป็นอันดับแรก และรันเป็น `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์
    ที่มีความสามารถครบขึ้น:

    1. **คงอยู่ `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง dependency ของระบบ**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ติดตั้งเบราว์เซอร์ Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **คงอยู่ไฟล์ดาวน์โหลดของเบราว์เซอร์**: ใช้ `OPENCLAW_HOME_VOLUME` หรือ
       `OPENCLAW_EXTRA_MOUNTS` OpenClaw ตรวจจับ Chromium ที่จัดการโดย Playwright
       ของอิมเมจ Docker บน Linux โดยอัตโนมัติ

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    หากคุณเลือก OpenAI Codex OAuth ในวิซาร์ด ระบบจะเปิด URL ของเบราว์เซอร์ ใน
    Docker หรือการตั้งค่าแบบไม่มีหน้าจอ ให้คัดลอก URL redirect แบบเต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปในวิซาร์ดเพื่อทำการยืนยันตัวตนให้เสร็จ
  </Accordion>

  <Accordion title="Base image metadata">
    อิมเมจรันไทม์ Docker หลักใช้ `node:24-bookworm-slim` และมี `tini` เป็นกระบวนการ init ของ entrypoint (PID 1) เพื่อให้แน่ใจว่าโปรเซส zombie ถูกเก็บกวาดและสัญญาณถูกจัดการอย่างถูกต้องในคอนเทนเนอร์ที่รันระยะยาว อิมเมจเผยแพร่ annotation ของ OCI base-image รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และอื่นๆ digest ของ Node base จะถูก
    รีเฟรชผ่าน PR ของ Dependabot Docker base-image; release build จะไม่รัน
    เลเยอร์อัปเกรด distro ดู
    [annotation ของอิมเมจ OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### รันบน VPS?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอนการ deploy VM ที่ใช้ร่วมกัน
รวมถึงการฝัง binary, persistence และการอัปเดต

## Sandbox ของเอเจนต์

เมื่อเปิดใช้งาน `agents.defaults.sandbox` ด้วย backend ของ Docker, Gateway
จะรันการดำเนินการเครื่องมือของเอเจนต์ (shell, อ่าน/เขียนไฟล์ และอื่นๆ) ภายในคอนเทนเนอร์ Docker
ที่แยกออกจากกัน ขณะที่ Gateway เองยังอยู่บนโฮสต์ วิธีนี้ให้กำแพงแข็งแรง
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือมีผู้เช่าหลายราย โดยไม่ต้องทำให้ Gateway ทั้งหมด
อยู่ในคอนเทนเนอร์

ขอบเขต sandbox สามารถเป็นรายเอเจนต์ (ค่าเริ่มต้น), รายเซสชัน หรือแบบใช้ร่วมกัน แต่ละขอบเขต
จะมี workspace ของตัวเองที่เมานต์ไว้ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบายอนุญาต/ปฏิเสธเครื่องมือ, การแยกเครือข่าย, ขีดจำกัดทรัพยากร และคอนเทนเนอร์
เบราว์เซอร์ได้

สำหรับคอนฟิกแบบเต็ม อิมเมจ หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ โปรดดู:

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง sandbox ฉบับสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึง shell แบบโต้ตอบไปยังคอนเทนเนอร์ sandbox
- [Sandbox และเครื่องมือหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- override รายเอเจนต์

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

สร้างอิมเมจ sandbox เริ่มต้น (จาก source checkout):

```bash
scripts/sandbox-setup.sh
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout ดู [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    สร้างอิมเมจ sandbox ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) หรือคำสั่ง `docker build` แบบ inline จาก [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) (การติดตั้ง npm),
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็นอิมเมจกำหนดเองของคุณ
    คอนเทนเนอร์จะถูกสร้างอัตโนมัติรายเซสชันเมื่อต้องการ
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับ ownership ของ workspace ที่เมานต์ของคุณ
    หรือ chown โฟลเดอร์ workspace
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่ง source
    `/etc/profile` และอาจรีเซ็ต PATH ตั้งค่า `docker.env.PATH` เพื่อเติมพาธ
    เครื่องมือกำหนดเองไว้ข้างหน้า หรือเพิ่มสคริปต์ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ใช้ class เครื่องที่ใหญ่ขึ้นแล้วลองอีกครั้ง
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    ดึงลิงก์แดชบอร์ดใหม่และอนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    รายละเอียดเพิ่มเติม: [Dashboard](/th/web/dashboard), [Devices](/th/cli/devices)

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
    รีเซ็ตโหมดและ bind ของ Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีติดตั้งทั้งหมด
- [Podman](/th/install/podman) — ทางเลือก Podman แทน Docker
- [ClawDock](/th/install/clawdock) — การตั้งค่า Docker Compose โดยชุมชน
- [การอัปเดต](/th/install/updating) — การทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ
- [การกำหนดค่า](/th/gateway/configuration) — การกำหนดค่า Gateway หลังติดตั้ง
