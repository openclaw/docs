---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์แทนการติดตั้งในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของขั้นตอนการทำงานของ Docker
summary: การตั้งค่าและการเริ่มต้นใช้งาน OpenClaw แบบใช้ Docker ที่เป็นทางเลือก
title: Docker
x-i18n:
    generated_at: "2026-05-06T09:18:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85ef98f0524c018dad280788dc83c7afaadc077ebe4509ae2c0b8b3bea1474df
    source_path: install/docker.md
    workflow: 16
---

Docker เป็น **ตัวเลือกเสริม** ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบคอนเทนเนอร์ หรือต้องการตรวจสอบโฟลว์ Docker

## Docker เหมาะกับฉันไหม?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway ที่แยกขาดและทิ้งได้ หรือต้องการรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งในเครื่อง
- **ไม่ใช่**: คุณกำลังรันบนเครื่องของตัวเองและต้องการลูปพัฒนาที่เร็วที่สุด ใช้โฟลว์ติดตั้งปกติแทน
- **หมายเหตุเรื่องแซนด์บ็อกซ์**: แบ็กเอนด์แซนด์บ็อกซ์เริ่มต้นใช้ Docker เมื่อเปิดใช้แซนด์บ็อกซ์ แต่แซนด์บ็อกซ์ปิดอยู่โดยค่าเริ่มต้น และ **ไม่** จำเป็นต้องให้ Gateway ทั้งหมดรันใน Docker นอกจากนี้ยังมีแบ็กเอนด์แซนด์บ็อกซ์ SSH และ OpenShell ให้ใช้ด้วย ดู [แซนด์บ็อกซ์](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการสร้างอิมเมจ (`pnpm install` อาจถูกหยุดเพราะหน่วยความจำไม่พอบนโฮสต์ 1 GB พร้อมรหัสออก 137)
- พื้นที่ดิสก์เพียงพอสำหรับอิมเมจและบันทึก
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ
  [การเสริมความปลอดภัยสำหรับการเปิดให้เข้าถึงผ่านเครือข่าย](/th/gateway/security)
  โดยเฉพาะนโยบายไฟร์วอลล์ Docker `DOCKER-USER`

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

    อิมเมจที่สร้างไว้ล่วงหน้าเผยแพร่ไว้ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    แท็กที่พบบ่อย: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="ทำ onboarding ให้เสร็จ">
    สคริปต์ตั้งค่าจะรัน onboarding โดยอัตโนมัติ โดยจะ:

    - ขอคีย์ API ของ provider
    - สร้างโทเค็น Gateway และเขียนลงใน `.env`
    - เริ่ม Gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า onboarding ก่อนเริ่ม และการเขียนคอนฟิกจะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` มีไว้สำหรับคำสั่งที่คุณรันหลังจาก
    คอนเทนเนอร์ Gateway มีอยู่แล้ว

  </Step>

  <Step title="เปิด UI ควบคุม">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ของคุณ แล้ววาง secret ที่ใช้ร่วมกันซึ่งตั้งค่าไว้
    ใน Settings สคริปต์ตั้งค่าจะเขียนโทเค็นลงใน `.env` โดยค่าเริ่มต้น
    หากคุณเปลี่ยนคอนฟิกคอนเทนเนอร์ไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

    ต้องการ URL อีกครั้งหรือไม่?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="ตั้งค่าช่องทาง (ตัวเลือกเสริม)">
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
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ตั้งค่าจะเขียน `docker-compose.extra.yml`
ให้รวมไฟล์นี้ด้วย `-f docker-compose.yml -f docker-compose.extra.yml`
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้ namespace เครือข่ายร่วมกับ `openclaw-gateway` จึงเป็น
เครื่องมือหลังเริ่มระบบ ก่อน `docker compose up -d openclaw-gateway` ให้รัน onboarding
และการเขียนคอนฟิกระหว่างตั้งค่าผ่าน `openclaw-gateway` ด้วย
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ตั้งค่ารองรับตัวแปรสภาพแวดล้อมตัวเลือกเสริมเหล่านี้:

| ตัวแปร                                     | วัตถุประสงค์                                                   |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ใช้อิมเมจระยะไกลแทนการสร้างในเครื่อง                         |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่างสร้าง (คั่นด้วยช่องว่าง)   |
| `OPENCLAW_EXTENSIONS`                      | รวมตัวช่วย Plugin แบบ bundled ที่เลือกไว้ตอนสร้าง              |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mount โฮสต์เพิ่มเติม (คั่นด้วยจุลภาค `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | คงสถานะ `/home/node` ไว้ใน Docker volume ที่ตั้งชื่อไว้        |
| `OPENCLAW_SANDBOX`                         | เลือกเปิดใช้การ bootstrap แซนด์บ็อกซ์ (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                 | ข้ามขั้นตอน onboarding แบบโต้ตอบ (`1`, `true`, `yes`, `on`)    |
| `OPENCLAW_DOCKER_SOCKET`                   | เขียนทับพาธ Docker socket                                      |
| `OPENCLAW_DISABLE_BONJOUR`                 | ปิดการโฆษณา Bonjour/mDNS (ค่าเริ่มต้นเป็น `1` สำหรับ Docker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | ปิด source bind-mount overlays ของ Plugin แบบ bundled          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint ตัวรวบรวม OTLP/HTTP ที่ใช้ร่วมกันสำหรับการ export OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpoint OTLP เฉพาะสัญญาณสำหรับ traces, metrics หรือ logs     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | เขียนทับโปรโตคอล OTLP ปัจจุบันรองรับเฉพาะ `http/protobuf`      |
| `OTEL_SERVICE_NAME`                        | ชื่อบริการที่ใช้สำหรับทรัพยากร OpenTelemetry                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | เลือกใช้แอตทริบิวต์เชิงความหมาย GenAI รุ่นทดลองล่าสุด        |
| `OPENCLAW_OTEL_PRELOADED`                  | ข้ามการเริ่ม OpenTelemetry SDK ตัวที่สองเมื่อมีการโหลดไว้ล่วงหน้าแล้ว |

ผู้ดูแลสามารถทดสอบซอร์สของ Plugin แบบ bundled กับอิมเมจแบบแพ็กเกจได้โดย mount
ไดเรกทอรีซอร์สของ Plugin หนึ่งตัวทับพาธซอร์สแบบแพ็กเกจของมัน เช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ไดเรกทอรีซอร์สที่ mount นั้นจะแทนที่ bundle ที่คอมไพล์แล้วซึ่งตรงกันที่
`/app/dist/extensions/synology-chat` สำหรับ id ของ Plugin เดียวกัน

### การสังเกตการณ์

การ export OpenTelemetry เป็นขาออกจากคอนเทนเนอร์ Gateway ไปยังตัวรวบรวม OTLP
ของคุณ โดยไม่ต้องใช้พอร์ต Docker ที่เผยแพร่ไว้ หากคุณสร้างอิมเมจในเครื่อง
และต้องการให้ exporter OpenTelemetry แบบ bundled พร้อมใช้งานในอิมเมจ
ให้รวม dependency รันไทม์ของมันด้วย:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ติดตั้ง Plugin ทางการ `@openclaw/diagnostics-otel` จาก ClawHub ในการติดตั้ง
Docker แบบแพ็กเกจก่อนเปิดใช้การ export อิมเมจที่สร้างจากซอร์สแบบกำหนดเอง
ยังคงรวมซอร์ส Plugin ในเครื่องได้ด้วย
`OPENCLAW_EXTENSIONS=diagnostics-otel` หากต้องการเปิดใช้การ export ให้ allow และ enable
Plugin `diagnostics-otel` ในคอนฟิก จากนั้นตั้ง
`diagnostics.otel.enabled=true` หรือใช้ตัวอย่างคอนฟิกใน [การ export OpenTelemetry](/th/gateway/opentelemetry)
ตั้งค่าส่วนหัวสำหรับการยืนยันตัวตนของตัวรวบรวมผ่าน
`diagnostics.otel.headers` ไม่ใช่ผ่านตัวแปรสภาพแวดล้อมของ Docker

เมตริก Prometheus ใช้พอร์ต Gateway ที่เผยแพร่ไว้แล้ว ติดตั้ง
`clawhub:@openclaw/diagnostics-prometheus` เปิดใช้ Plugin
`diagnostics-prometheus` จากนั้น scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

เส้นทางนี้ได้รับการป้องกันด้วยการยืนยันตัวตนของ Gateway อย่าเปิดพอร์ต
`/metrics` สาธารณะแยกต่างหาก หรือพาธ reverse proxy ที่ไม่ผ่านการยืนยันตัวตน ดู
[เมตริก Prometheus](/th/gateway/prometheus)

### การตรวจสอบสุขภาพ

endpoint สำหรับ probe คอนเทนเนอร์ (ไม่ต้องใช้การยืนยันตัวตน):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

อิมเมจ Docker มี `HEALTHCHECK` ในตัวที่ ping `/healthz`
หากการตรวจสอบยังคงล้มเหลว Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy`
และระบบจัดการ orchestration สามารถรีสตาร์ทหรือแทนที่คอนเทนเนอร์ได้

สแนปช็อตสุขภาพเชิงลึกแบบยืนยันตัวตนแล้ว:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN กับ loopback

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` ทำงานได้กับการเผยแพร่พอร์ตของ Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์บนโฮสต์และ CLI บนโฮสต์เข้าถึงพอร์ต Gateway ที่เผยแพร่ไว้ได้
- `loopback`: เฉพาะโปรเซสภายใน namespace เครือข่ายของคอนเทนเนอร์เท่านั้นที่เข้าถึง
  Gateway ได้โดยตรง

<Note>
ใช้ค่าโหมด bind ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่ alias ของโฮสต์อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### Provider ในเครื่องของโฮสต์

เมื่อ OpenClaw รันใน Docker, `127.0.0.1` ภายในคอนเทนเนอร์คือคอนเทนเนอร์
นั้นเอง ไม่ใช่เครื่องโฮสต์ของคุณ ใช้ `host.docker.internal` สำหรับ provider AI ที่
รันบนโฮสต์:

| Provider  | URL เริ่มต้นของโฮสต์      | URL สำหรับตั้งค่า Docker            |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่า Docker แบบ bundled ใช้ URL โฮสต์เหล่านั้นเป็นค่าเริ่มต้น onboarding
ของ LM Studio และ Ollama และ `docker-compose.yml` map `host.docker.internal` ไปยัง
Gateway โฮสต์ของ Docker สำหรับ Linux Docker Engine ส่วน Docker Desktop มี
ชื่อโฮสต์เดียวกันให้ใช้อยู่แล้วบน macOS และ Windows

บริการบนโฮสต์ต้องฟังบนที่อยู่ที่ Docker เข้าถึงได้ด้วย:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

หากคุณใช้ไฟล์ Compose หรือคำสั่ง `docker run` ของคุณเอง ให้เพิ่ม mapping โฮสต์
เดียวกันด้วยตัวเอง เช่น
`--add-host=host.docker.internal:host-gateway`

### Bonjour / mDNS

เครือข่าย bridge ของ Docker มักไม่ส่งต่อ multicast ของ Bonjour/mDNS
(`224.0.0.251:5353`) ได้อย่างน่าเชื่อถือ ดังนั้นการตั้งค่า Compose แบบ bundled จึงตั้งค่าเริ่มต้น
`OPENCLAW_DISABLE_BONJOUR=1` เพื่อไม่ให้ Gateway crash-loop หรือเริ่มการโฆษณาซ้ำๆ
เมื่อ bridge ทิ้งทราฟฟิก multicast

ใช้ URL Gateway ที่เผยแพร่ไว้, Tailscale หรือ DNS-SD แบบ wide-area สำหรับโฮสต์ Docker
ตั้ง `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วย host networking, macvlan
หรือเครือข่ายอื่นที่ทราบว่า multicast mDNS ทำงานได้

สำหรับข้อควรระวังและการแก้ปัญหา ดู [การค้นหา Bonjour](/th/gateway/bonjour)

### พื้นที่จัดเก็บและการคงสถานะ

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw` และ
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` ดังนั้นพาธเหล่านั้น
จะอยู่รอดหลังการแทนที่คอนเทนเนอร์ เมื่อไม่ได้ตั้งค่าตัวแปรใดตัวแปรหนึ่ง
`docker-compose.yml` แบบ bundled จะ fallback ไปที่ `${HOME}/.openclaw` (และ
`${HOME}/.openclaw/workspace` สำหรับ workspace mount) หรือ `/tmp/.openclaw`
เมื่อ `HOME` เองก็หายไปด้วย วิธีนี้ทำให้ `docker compose up` ไม่ส่งออก
volume spec ที่มี source ว่างเปล่าในสภาพแวดล้อมเปล่า

ไดเรกทอรีคอนฟิกที่ mount นั้นคือที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับคอนฟิกพฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับการยืนยันตัวตน OAuth/API-key ของ provider ที่จัดเก็บไว้
- `.env` สำหรับ secret รันไทม์ที่อิง env เช่น `OPENCLAW_GATEWAY_TOKEN`

Plugin แบบดาวน์โหลดได้ที่ติดตั้งแล้วจะเก็บสถานะแพ็กเกจไว้ใต้ OpenClaw home ที่ mount
ดังนั้นระเบียนการติดตั้ง Plugin และรากแพ็กเกจจะอยู่รอดหลังการแทนที่คอนเทนเนอร์
การเริ่มต้น Gateway จะไม่สร้าง dependency tree ของ Plugin แบบ bundled

สำหรับรายละเอียดการคงสถานะทั้งหมดบนการปรับใช้ VM ดู
[Docker VM Runtime - สิ่งใดคงอยู่ที่ไหน](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ดิสก์โตเร็ว:** เฝ้าดู `media/`, ไฟล์ JSONL ของเซสชัน,
`cron/runs/*.jsonl`, รากแพ็กเกจ Plugin ที่ติดตั้งแล้ว และล็อกไฟล์แบบหมุนเวียน
ภายใต้ `/tmp/openclaw/`.

### ตัวช่วย Shell (ไม่บังคับ)

เพื่อให้จัดการ Docker ในแต่ละวันได้ง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จากพาธ raw เดิม `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้ง เพื่อให้ไฟล์ตัวช่วยในเครื่องของคุณติดตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` และอื่น ๆ รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดู [ClawDock](/th/install/clawdock) สำหรับคู่มือตัวช่วยฉบับเต็ม

<AccordionGroup>
  <Accordion title="เปิดใช้งานแซนด์บ็อกซ์ของเอเจนต์สำหรับ Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    พาธซ็อกเก็ตแบบกำหนดเอง (เช่น Docker แบบ rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    สคริปต์จะเมานต์ `docker.sock` หลังจากข้อกำหนดเบื้องต้นของแซนด์บ็อกซ์ผ่านแล้วเท่านั้น หาก
    การตั้งค่าแซนด์บ็อกซ์ทำไม่สำเร็จ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    เป็น `off`

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ / CI (ไม่โต้ตอบ)">
    ปิดการจัดสรร pseudo-TTY ของ Compose ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="หมายเหตุด้านความปลอดภัยของเครือข่ายที่ใช้ร่วมกัน">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` เพื่อให้คำสั่ง CLI
    เข้าถึง Gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความเชื่อถือที่ใช้ร่วมกัน
    คอนฟิก compose ตัด `NET_RAW`/`NET_ADMIN` ออก และเปิดใช้งาน
    `no-new-privileges` ทั้งบน `openclaw-gateway` และ `openclaw-cli`
  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    อิมเมจรันเป็น `node` (uid 1000) หากคุณเห็นข้อผิดพลาดด้านสิทธิ์บน
    `/home/node/.openclaw` ให้ตรวจสอบว่า bind mount ของโฮสต์มีเจ้าของเป็น uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    ความไม่ตรงกันเดียวกันอาจแสดงเป็นคำเตือนของ Plugin เช่น
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    ตามด้วย `plugin present but blocked` นั่นหมายความว่า uid ของโปรเซสและเจ้าของไดเรกทอรี
    Plugin ที่เมานต์ไว้ไม่ตรงกัน แนะนำให้รันคอนเทนเนอร์ด้วย uid เริ่มต้น 1000
    และแก้ไขความเป็นเจ้าของของ bind mount ให้ถูกต้อง ให้ chown
    `/path/to/openclaw-config/npm` เป็น `root:root` เฉพาะเมื่อคุณตั้งใจรัน
    OpenClaw เป็น root ระยะยาวเท่านั้น

  </Accordion>

  <Accordion title="การ rebuild ที่เร็วขึ้น">
    จัดลำดับ Dockerfile ของคุณเพื่อให้เลเยอร์ dependency ถูกแคชไว้ วิธีนี้หลีกเลี่ยงการรัน
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
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อน และรันเป็น `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์ที่มี
    ฟีเจอร์ครบขึ้น:

    1. **คงอยู่ของ `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง system deps**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ติดตั้งเบราว์เซอร์ Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **คงอยู่ของการดาวน์โหลดเบราว์เซอร์**: ตั้งค่า
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` และใช้
       `OPENCLAW_HOME_VOLUME` หรือ `OPENCLAW_EXTRA_MOUNTS`

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบ headless)">
    หากคุณเลือก OpenAI Codex OAuth ในวิซาร์ด ระบบจะเปิด URL ของเบราว์เซอร์ ใน
    Docker หรือการตั้งค่าแบบ headless ให้คัดลอก URL redirect แบบเต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปในวิซาร์ดเพื่อทำ auth ให้เสร็จ
  </Accordion>

  <Accordion title="เมตาดาต้าอิมเมจพื้นฐาน">
    อิมเมจ runtime หลักของ Docker ใช้ `node:24-bookworm-slim` และเผยแพร่ annotation ของ OCI
    base-image รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และรายการอื่น ๆ digest พื้นฐานของ Node จะถูก
    รีเฟรชผ่าน PR ของ Dependabot Docker base-image; build สำหรับ release จะไม่รัน
    เลเยอร์ distro upgrade ดู
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### รันบน VPS?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอน deploy VM ที่ใช้ร่วมกัน
รวมถึงการ bake ไบนารี การคงอยู่ และการอัปเดต

## แซนด์บ็อกซ์ของเอเจนต์

เมื่อเปิดใช้งาน `agents.defaults.sandbox` ด้วย backend Docker, Gateway
จะรันการปฏิบัติงานของเครื่องมือเอเจนต์ (shell, การอ่าน/เขียนไฟล์ และอื่น ๆ) ภายในคอนเทนเนอร์ Docker
ที่แยกออกจากกัน ในขณะที่ตัว Gateway เองยังอยู่บนโฮสต์ วิธีนี้ให้กำแพงที่แข็งแรง
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือมีหลายผู้เช่า โดยไม่ต้องทำให้ Gateway ทั้งหมดเป็นคอนเทนเนอร์

ขอบเขตแซนด์บ็อกซ์สามารถเป็นต่อเอเจนต์ (ค่าเริ่มต้น), ต่อเซสชัน หรือใช้ร่วมกันได้ แต่ละขอบเขต
จะมี workspace ของตัวเองที่เมานต์ไว้ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบายอนุญาต/ปฏิเสธเครื่องมือ การแยกเครือข่าย ขีดจำกัดทรัพยากร และคอนเทนเนอร์
เบราว์เซอร์ได้ด้วย

สำหรับคอนฟิกฉบับเต็ม อิมเมจ หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ ดู:

- [Sandboxing](/th/gateway/sandboxing) -- ข้อมูลอ้างอิงแซนด์บ็อกซ์ฉบับสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึง shell แบบโต้ตอบไปยังคอนเทนเนอร์แซนด์บ็อกซ์
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การ override ต่อเอเจนต์

### เปิดใช้งานแบบเร็ว

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

สร้างอิมเมจแซนด์บ็อกซ์เริ่มต้น (จาก source checkout):

```bash
scripts/sandbox-setup.sh
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout ดู [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="อิมเมจหายไปหรือคอนเทนเนอร์แซนด์บ็อกซ์ไม่เริ่มทำงาน">
    สร้างอิมเมจแซนด์บ็อกซ์ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) หรือคำสั่ง `docker build` แบบ inline จาก [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) (ติดตั้ง npm),
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็นอิมเมจแบบกำหนดเองของคุณ
    คอนเทนเนอร์จะถูกสร้างอัตโนมัติต่อเซสชันเมื่อต้องการ
  </Accordion>

  <Accordion title="ข้อผิดพลาดด้านสิทธิ์ในแซนด์บ็อกซ์">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับความเป็นเจ้าของ workspace ที่เมานต์ไว้ของคุณ
    หรือ chown โฟลเดอร์ workspace
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือแบบกำหนดเองในแซนด์บ็อกซ์">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่ง source
    `/etc/profile` และอาจรีเซ็ต PATH ตั้งค่า `docker.env.PATH` เพื่อเติมพาธ
    เครื่องมือแบบกำหนดเองของคุณไว้ด้านหน้า หรือเพิ่มสคริปต์ไว้ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM-killed ระหว่าง build อิมเมจ (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ใช้ machine class ที่ใหญ่ขึ้นแล้วลองอีกครั้ง
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

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือข้อผิดพลาด pairing จาก Docker CLI">
    รีเซ็ตโหมด Gateway และ bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีติดตั้งทั้งหมด
- [Podman](/th/install/podman) — ทางเลือก Podman แทน Docker
- [ClawDock](/th/install/clawdock) — การตั้งค่า Docker Compose จากชุมชน
- [การอัปเดต](/th/install/updating) — การทำให้ OpenClaw ทันสมัยอยู่เสมอ
- [คอนฟิก](/th/gateway/configuration) — คอนฟิก Gateway หลังติดตั้ง
