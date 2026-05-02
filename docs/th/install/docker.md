---
read_when:
    - คุณต้องการ Gateway ที่อยู่ในคอนเทนเนอร์แทนการติดตั้งภายในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของโฟลว์ Docker
summary: การตั้งค่าและการเริ่มต้นใช้งาน OpenClaw ด้วย Docker ซึ่งเป็นทางเลือก
title: Docker
x-i18n:
    generated_at: "2026-05-02T20:46:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e57659c89a0b207b4b331752e7faaa814fe1f0043dad97043e95e460286c551
    source_path: install/docker.md
    workflow: 16
---

Docker เป็นสิ่งที่**ไม่บังคับ** ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบคอนเทนเนอร์ หรือเพื่อตรวจสอบโฟลว์ Docker

## Docker เหมาะกับฉันหรือไม่?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway ที่แยกออกมาและทิ้งได้ หรือรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งในเครื่อง
- **ไม่**: คุณกำลังรันบนเครื่องของคุณเองและต้องการลูปพัฒนาที่เร็วที่สุด ใช้โฟลว์ติดตั้งปกติแทน
- **หมายเหตุเรื่องแซนด์บ็อกซ์**: แบ็กเอนด์แซนด์บ็อกซ์เริ่มต้นใช้ Docker เมื่อเปิดใช้แซนด์บ็อกซ์ แต่แซนด์บ็อกซ์ปิดอยู่โดยค่าเริ่มต้น และ**ไม่**จำเป็นต้องรัน Gateway ทั้งหมดใน Docker นอกจากนี้ยังมีแบ็กเอนด์แซนด์บ็อกซ์ SSH และ OpenShell ดู [แซนด์บ็อกซ์](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการสร้างอิมเมจ (`pnpm install` อาจถูก OOM-killed บนโฮสต์ 1 GB พร้อม exit 137)
- พื้นที่ดิสก์เพียงพอสำหรับอิมเมจและล็อก
- หากรันบน VPS/โฮสต์สาธารณะ ให้ทบทวน
  [การเสริมความปลอดภัยสำหรับการเปิดเผยผ่านเครือข่าย](/th/gateway/security),
  โดยเฉพาะนโยบายไฟร์วอลล์ Docker `DOCKER-USER`

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="สร้างอิมเมจ">
    จากรูทของ repo ให้รันสคริปต์ตั้งค่า:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะสร้างอิมเมจ Gateway ในเครื่อง หากต้องการใช้อิมเมจที่สร้างไว้ล่วงหน้าแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    อิมเมจที่สร้างไว้ล่วงหน้าเผยแพร่ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    แท็กทั่วไป: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="ทำการเริ่มใช้งานให้เสร็จ">
    สคริปต์ตั้งค่าจะรันการเริ่มใช้งานโดยอัตโนมัติ โดยจะ:

    - แจ้งให้ป้อนคีย์ API ของผู้ให้บริการ
    - สร้างโทเค็น Gateway และเขียนลงใน `.env`
    - เริ่ม Gateway ผ่าน Docker Compose

    ระหว่างตั้งค่า การเริ่มใช้งานก่อนเริ่มระบบและการเขียนคอนฟิกจะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` ใช้สำหรับคำสั่งที่คุณรันหลังจาก
    คอนเทนเนอร์ Gateway มีอยู่แล้ว

  </Step>

  <Step title="เปิดส่วนติดต่อควบคุม">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ของคุณ แล้ววาง shared secret
    ที่กำหนดค่าไว้ใน Settings โดยค่าเริ่มต้น สคริปต์ตั้งค่าจะเขียนโทเค็นลงใน `.env`;
    หากคุณเปลี่ยนคอนฟิกคอนเทนเนอร์ไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

    ต้องการ URL อีกครั้งหรือไม่?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="กำหนดค่าช่องทาง (ไม่บังคับ)">
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
รัน `docker compose` จากรูทของ repo หากคุณเปิดใช้ `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ตั้งค่าจะเขียน `docker-compose.extra.yml`;
ให้รวมไฟล์นั้นด้วย `-f docker-compose.yml -f docker-compose.extra.yml`
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้เนมสเปซเครือข่ายร่วมกับ `openclaw-gateway` จึงเป็น
เครื่องมือหลังเริ่มระบบ ก่อน `docker compose up -d openclaw-gateway` ให้รันการเริ่มใช้งาน
และการเขียนคอนฟิกในช่วงตั้งค่าผ่าน `openclaw-gateway` ด้วย
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ตั้งค่ารองรับตัวแปรสภาพแวดล้อมที่ไม่บังคับเหล่านี้:

| ตัวแปร | วัตถุประสงค์ |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ใช้อิมเมจระยะไกลแทนการสร้างในเครื่อง                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่างการสร้าง (คั่นด้วยช่องว่าง)       |
| `OPENCLAW_EXTENSIONS`                      | รวมตัวช่วย Plugin แบบบันเดิลที่เลือกไว้ในเวลาสร้าง           |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mount ของโฮสต์เพิ่มเติม (คั่นด้วยจุลภาค `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | เก็บ `/home/node` ไว้ใน named Docker volume                   |
| `OPENCLAW_SANDBOX`                         | เลือกใช้การบูตสแตรปแซนด์บ็อกซ์ (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | ข้ามขั้นตอนเริ่มใช้งานแบบโต้ตอบ (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | แทนที่พาธซ็อกเก็ต Docker                                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | ปิดการโฆษณา Bonjour/mDNS (ค่าเริ่มต้นเป็น `1` สำหรับ Docker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | ปิดโอเวอร์เลย์ bind-mount ของซอร์ส Plugin แบบบันเดิล               |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | เอนด์พอยต์คอลเลกเตอร์ OTLP/HTTP ร่วมสำหรับการส่งออก OpenTelemetry    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | เอนด์พอยต์ OTLP เฉพาะสัญญาณสำหรับเทรซ เมตริก หรือล็อก     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | แทนที่โปรโตคอล OTLP ปัจจุบันรองรับเฉพาะ `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | ชื่อบริการที่ใช้สำหรับทรัพยากร OpenTelemetry                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | เลือกใช้แอตทริบิวต์เชิงความหมาย GenAI แบบทดลองล่าสุด         |
| `OPENCLAW_OTEL_PRELOADED`                  | ข้ามการเริ่ม OpenTelemetry SDK ตัวที่สองเมื่อมีตัวหนึ่งโหลดไว้ล่วงหน้า  |

ผู้ดูแลสามารถทดสอบซอร์ส Plugin แบบบันเดิลกับอิมเมจแบบแพ็กเกจได้โดยเมานต์
ไดเรกทอรีซอร์ส Plugin หนึ่งรายการทับพาธซอร์สแบบแพ็กเกจของมัน เช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
ไดเรกทอรีซอร์สที่เมานต์นั้นจะแทนที่บันเดิลที่คอมไพล์แล้วที่ตรงกัน
`/app/dist/extensions/synology-chat` สำหรับ id ของ Plugin เดียวกัน

### การสังเกตการณ์

การส่งออก OpenTelemetry เป็นการส่งออกจากคอนเทนเนอร์ Gateway ไปยังคอลเลกเตอร์ OTLP
ของคุณ ไม่จำเป็นต้องมีพอร์ต Docker ที่เผยแพร่ หากคุณสร้างอิมเมจในเครื่อง
และต้องการให้ exporter OpenTelemetry แบบบันเดิลพร้อมใช้งานภายในอิมเมจ
ให้รวม dependency ระดับรันไทม์ของมัน:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ติดตั้ง Plugin ทางการ `@openclaw/diagnostics-otel` จาก ClawHub ใน
การติดตั้ง Docker แบบแพ็กเกจก่อนเปิดใช้การส่งออก อิมเมจแบบสร้างจากซอร์สที่กำหนดเองยังคง
รวมซอร์ส Plugin ในเครื่องด้วย
`OPENCLAW_EXTENSIONS=diagnostics-otel` ได้ หากต้องการเปิดใช้การส่งออก ให้อนุญาตและเปิดใช้
Plugin `diagnostics-otel` ในคอนฟิก จากนั้นตั้งค่า
`diagnostics.otel.enabled=true` หรือใช้ตัวอย่างคอนฟิกใน [การส่งออก OpenTelemetry
](/th/gateway/opentelemetry). เฮดเดอร์การยืนยันตัวตนของคอลเลกเตอร์กำหนดค่าผ่าน
`diagnostics.otel.headers` ไม่ใช่ผ่านตัวแปรสภาพแวดล้อม Docker

เมตริก Prometheus ใช้พอร์ต Gateway ที่เผยแพร่อยู่แล้ว ติดตั้ง
`clawhub:@openclaw/diagnostics-prometheus` เปิดใช้
Plugin `diagnostics-prometheus` แล้ว scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

เส้นทางนี้ได้รับการป้องกันด้วยการยืนยันตัวตนของ Gateway อย่าเปิดเผยพอร์ต
`/metrics` สาธารณะแยกต่างหากหรือพาธ reverse-proxy ที่ไม่ผ่านการยืนยันตัวตน ดู
[เมตริก Prometheus](/th/gateway/prometheus)

### การตรวจสอบสุขภาพ

เอนด์พอยต์ probe ของคอนเทนเนอร์ (ไม่ต้องยืนยันตัวตน):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

อิมเมจ Docker มี `HEALTHCHECK` ในตัวที่ ping `/healthz`
หากการตรวจสอบยังคงล้มเหลว Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy` และ
ระบบ orchestration สามารถรีสตาร์ทหรือแทนที่คอนเทนเนอร์ได้

สแนปช็อตสุขภาพเชิงลึกที่ผ่านการยืนยันตัวตน:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` ทำงานได้กับการเผยแพร่พอร์ต Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์ของโฮสต์และ CLI ของโฮสต์เข้าถึงพอร์ต Gateway ที่เผยแพร่ได้
- `loopback`: มีเพียงโปรเซสภายในเนมสเปซเครือข่ายของคอนเทนเนอร์ที่เข้าถึง
  Gateway โดยตรงได้

<Note>
ใช้ค่าโหมด bind ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่ alias ของโฮสต์อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### ผู้ให้บริการในเครื่องบนโฮสต์

เมื่อ OpenClaw รันใน Docker, `127.0.0.1` ภายในคอนเทนเนอร์คือคอนเทนเนอร์
เอง ไม่ใช่เครื่องโฮสต์ของคุณ ใช้ `host.docker.internal` สำหรับผู้ให้บริการ AI ที่
รันบนโฮสต์:

| ผู้ให้บริการ | URL เริ่มต้นของโฮสต์ | URL ตั้งค่า Docker |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่า Docker แบบบันเดิลใช้ URL ของโฮสต์เหล่านั้นเป็นค่าเริ่มต้นสำหรับการเริ่มใช้งาน
LM Studio และ Ollama และ `docker-compose.yml` แมป `host.docker.internal` ไปยัง
Gateway ของโฮสต์ Docker สำหรับ Linux Docker Engine ส่วน Docker Desktop มี
ชื่อโฮสต์เดียวกันอยู่แล้วบน macOS และ Windows

บริการบนโฮสต์ต้อง listen บนที่อยู่ที่ Docker เข้าถึงได้ด้วย:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

หากคุณใช้ไฟล์ Compose หรือคำสั่ง `docker run` ของคุณเอง ให้เพิ่มการแมปโฮสต์
เดียวกันด้วยตัวเอง เช่น
`--add-host=host.docker.internal:host-gateway`

### Bonjour / mDNS

เครือข่าย bridge ของ Docker มักไม่ส่งต่อมัลติคาสต์ Bonjour/mDNS
(`224.0.0.251:5353`) ได้อย่างน่าเชื่อถือ ดังนั้นการตั้งค่า Compose แบบบันเดิลจึงตั้งค่าเริ่มต้น
`OPENCLAW_DISABLE_BONJOUR=1` เพื่อให้ Gateway ไม่ crash-loop หรือรีสตาร์ทการโฆษณาซ้ำๆ
เมื่อ bridge ทิ้งทราฟฟิกมัลติคาสต์

ใช้ URL Gateway ที่เผยแพร่แล้ว, Tailscale หรือ wide-area DNS-SD สำหรับโฮสต์ Docker
ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วย host networking, macvlan
หรือเครือข่ายอื่นที่ทราบว่า multicast mDNS ทำงานได้

สำหรับข้อควรระวังและการแก้ปัญหา ดู [การค้นพบ Bonjour](/th/gateway/bonjour)

### พื้นที่จัดเก็บและการคงอยู่

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw` และ
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` ดังนั้นพาธเหล่านั้น
จะอยู่รอดหลังการแทนที่คอนเทนเนอร์ เมื่อไม่ได้ตั้งค่าตัวแปรใดตัวแปรหนึ่ง
`docker-compose.yml` แบบบันเดิลจะ fallback ไปที่ `${HOME}/.openclaw` (และ
`${HOME}/.openclaw/workspace` สำหรับเมานต์ workspace) หรือ `/tmp/.openclaw`
เมื่อไม่มี `HOME` ด้วยเช่นกัน วิธีนี้ป้องกันไม่ให้ `docker compose up`
ปล่อย volume spec ที่มี source ว่างในสภาพแวดล้อมเปล่า

ไดเรกทอรีคอนฟิกที่เมานต์นั้นคือที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับคอนฟิกพฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับ auth ของผู้ให้บริการแบบ OAuth/API-key ที่จัดเก็บไว้
- `.env` สำหรับความลับระดับรันไทม์ที่อิง env เช่น `OPENCLAW_GATEWAY_TOKEN`

Plugin ดาวน์โหลดได้ที่ติดตั้งแล้วจะเก็บสถานะแพ็กเกจไว้ใต้ OpenClaw home ที่เมานต์ไว้
ดังนั้นบันทึกการติดตั้ง Plugin และรูทแพ็กเกจจะอยู่รอดหลังการแทนที่คอนเทนเนอร์
การเริ่ม Gateway จะไม่สร้าง dependency tree ของ Plugin แบบบันเดิล

สำหรับรายละเอียดการคงอยู่ทั้งหมดในการปรับใช้ VM ดู
[Docker VM Runtime - สิ่งใดคงอยู่ที่ใด](/th/install/docker-vm-runtime#what-persists-where).

**ฮอตสปอตการเติบโตของดิสก์:** เฝ้าดู `media/`, ไฟล์ JSONL ของเซสชัน,
`cron/runs/*.jsonl`, รากแพ็กเกจ Plugin ที่ติดตั้งแล้ว และไฟล์ล็อกแบบหมุนเวียน
ใต้ `/tmp/openclaw/`

### ตัวช่วย Shell (ไม่บังคับ)

เพื่อให้จัดการ Docker ในแต่ละวันได้ง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จากพาธ raw เดิม `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้ง เพื่อให้ไฟล์ตัวช่วยในเครื่องของคุณติดตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` และอื่นๆ รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดู [ClawDock](/th/install/clawdock) สำหรับคู่มือตัวช่วยฉบับเต็ม

<AccordionGroup>
  <Accordion title="เปิดใช้แซนด์บ็อกซ์เอเจนต์สำหรับ Docker gateway">
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

    สคริปต์จะเมานต์ `docker.sock` เฉพาะหลังจากข้อกำหนดเบื้องต้นของแซนด์บ็อกซ์ผ่านแล้วเท่านั้น หาก
    การตั้งค่าแซนด์บ็อกซ์ทำให้เสร็จไม่ได้ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
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
    เข้าถึง gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความเชื่อถือที่ใช้ร่วมกัน
    คอนฟิก compose จะตัด `NET_RAW`/`NET_ADMIN` ออก และเปิดใช้
    `no-new-privileges` บน `openclaw-cli`
  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    อิมเมจรันเป็น `node` (uid 1000) หากคุณเห็นข้อผิดพลาดด้านสิทธิ์บน
    `/home/node/.openclaw` ตรวจสอบให้แน่ใจว่า bind mount บนโฮสต์ของคุณเป็นเจ้าของโดย uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

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
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยเป็นอันดับแรก และรันเป็น `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์ที่มี
    ความสามารถครบถ้วนมากขึ้น:

    1. **คงอยู่ `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง deps ของระบบ**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ติดตั้งเบราว์เซอร์ Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **คงอยู่ไฟล์ดาวน์โหลดของเบราว์เซอร์**: ตั้งค่า
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` และใช้
       `OPENCLAW_HOME_VOLUME` หรือ `OPENCLAW_EXTRA_MOUNTS`

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบ headless)">
    หากคุณเลือก OpenAI Codex OAuth ในตัวช่วยตั้งค่า ระบบจะเปิด URL ของเบราว์เซอร์ ใน
    Docker หรือการตั้งค่าแบบ headless ให้คัดลอก URL redirect แบบเต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปในตัวช่วยตั้งค่าเพื่อจบการยืนยันตัวตน
  </Accordion>

  <Accordion title="เมตาดาต้าของอิมเมจฐาน">
    อิมเมจ runtime หลักของ Docker ใช้ `node:24-bookworm-slim` และเผยแพร่ annotation ของอิมเมจฐานแบบ OCI
    รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และรายการอื่นๆ digest ฐานของ Node จะถูก
    รีเฟรชผ่าน PR Docker base-image ของ Dependabot; build สำหรับ release จะไม่รัน
    เลเยอร์อัปเกรด distro ดู
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### กำลังรันบน VPS หรือไม่?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอนการปรับใช้ VM ที่ใช้ร่วมกัน
รวมถึงการฝังไบนารี การคงอยู่ และการอัปเดต

## แซนด์บ็อกซ์ของเอเจนต์

เมื่อเปิดใช้ `agents.defaults.sandbox` กับ backend ของ Docker, gateway
จะรันการดำเนินการเครื่องมือของเอเจนต์ (shell, การอ่าน/เขียนไฟล์ และอื่นๆ) ภายใน Docker
คอนเทนเนอร์ที่แยกออกมา ขณะที่ gateway เองยังคงอยู่บนโฮสต์ วิธีนี้ให้กำแพงแข็งแรง
ล้อมรอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือมีผู้เช่าหลายราย โดยไม่ต้องทำให้ทั้ง
gateway เป็นคอนเทนเนอร์

ขอบเขตแซนด์บ็อกซ์อาจเป็นรายเอเจนต์ (ค่าเริ่มต้น), รายเซสชัน หรือแบบใช้ร่วมกัน แต่ละขอบเขต
มี workspace ของตัวเองที่เมานต์ไว้ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบายเครื่องมือ allow/deny, การแยกเครือข่าย, ขีดจำกัดทรัพยากร และคอนเทนเนอร์
เบราว์เซอร์ได้

สำหรับคอนฟิกทั้งหมด อิมเมจ หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ ดู:

- [Sandboxing](/th/gateway/sandboxing) -- อ้างอิงแซนด์บ็อกซ์ฉบับสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึง shell แบบโต้ตอบไปยังคอนเทนเนอร์แซนด์บ็อกซ์
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การ override รายเอเจนต์

### เปิดใช้อย่างรวดเร็ว

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

Build อิมเมจแซนด์บ็อกซ์เริ่มต้น (จาก source checkout):

```bash
scripts/sandbox-setup.sh
```

สำหรับการติดตั้ง npm โดยไม่มี source checkout ดู [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="อิมเมจหายไปหรือคอนเทนเนอร์แซนด์บ็อกซ์ไม่เริ่มทำงาน">
    Build อิมเมจแซนด์บ็อกซ์ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) หรือคำสั่ง `docker build` แบบ inline จาก [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) (การติดตั้ง npm),
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็นอิมเมจที่คุณกำหนดเอง
    คอนเทนเนอร์จะถูกสร้างอัตโนมัติรายเซสชันตามต้องการ
  </Accordion>

  <Accordion title="ข้อผิดพลาดด้านสิทธิ์ในแซนด์บ็อกซ์">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับ ownership ของ workspace ที่เมานต์ไว้ของคุณ
    หรือ chown โฟลเดอร์ workspace
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือที่กำหนดเองในแซนด์บ็อกซ์">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่ง source
    `/etc/profile` และอาจรีเซ็ต PATH ตั้งค่า `docker.env.PATH` เพื่อเติมพาธเครื่องมือ
    ที่กำหนดเองของคุณไว้ด้านหน้า หรือเพิ่มสคริปต์ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM kill ระหว่าง build อิมเมจ (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ใช้ machine class ที่ใหญ่ขึ้นแล้วลองใหม่
  </Accordion>

  <Accordion title="ไม่ได้รับอนุญาตหรือต้องจับคู่ใน Control UI">
    ดึงลิงก์แดชบอร์ดใหม่และอนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    รายละเอียดเพิ่มเติม: [Dashboard](/th/web/dashboard), [Devices](/th/cli/devices)

  </Accordion>

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือข้อผิดพลาดการจับคู่จาก Docker CLI">
    รีเซ็ตโหมด gateway และ bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีการติดตั้งทั้งหมด
- [Podman](/th/install/podman) — ทางเลือก Podman แทน Docker
- [ClawDock](/th/install/clawdock) — การตั้งค่า Docker Compose ของชุมชน
- [การอัปเดต](/th/install/updating) — การทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ
- [Configuration](/th/gateway/configuration) — คอนฟิก gateway หลังติดตั้ง
