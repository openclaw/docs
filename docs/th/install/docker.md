---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์แทนการติดตั้งภายในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของโฟลว์ Docker
summary: การตั้งค่าและการเริ่มต้นใช้งาน OpenClaw แบบทางเลือกโดยใช้ Docker
title: Docker
x-i18n:
    generated_at: "2026-05-12T12:51:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 241db808dcdaa91df67a88b93d94de61cb4c2265de0e84a3b7f031166c94ee77
    source_path: install/docker.md
    workflow: 16
---

Docker เป็น **ตัวเลือก** ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบคอนเทนเนอร์ หรือต้องการตรวจสอบความถูกต้องของขั้นตอน Docker

## Docker เหมาะกับฉันหรือไม่?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway ที่แยกออกมาและทิ้งได้ หรือต้องการรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งภายในเครื่อง
- **ไม่**: คุณกำลังรันบนเครื่องของคุณเองและต้องการเพียงรอบการพัฒนาที่เร็วที่สุด ให้ใช้ขั้นตอนการติดตั้งปกติแทน
- **หมายเหตุเรื่อง sandboxing**: แบ็กเอนด์ sandbox เริ่มต้นใช้ Docker เมื่อเปิดใช้ sandboxing แต่ sandboxing จะปิดไว้โดยค่าเริ่มต้น และ **ไม่** ต้องให้ Gateway ทั้งหมดรันใน Docker นอกจากนี้ยังมีแบ็กเอนด์ sandbox แบบ SSH และ OpenShell ดู [Sandboxing](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการ build image (`pnpm install` อาจถูก OOM-killed บนโฮสต์ 1 GB พร้อมรหัสออก 137)
- พื้นที่ดิสก์เพียงพอสำหรับ image และ log
- หากรันบน VPS/โฮสต์สาธารณะ ให้ทบทวน
  [การเพิ่มความปลอดภัยสำหรับการเปิดให้เข้าถึงผ่านเครือข่าย](/th/gateway/security),
  โดยเฉพาะนโยบายไฟร์วอลล์ `DOCKER-USER` ของ Docker

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="Build image">
    จากราก repo ให้รันสคริปต์ตั้งค่า:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะ build image ของ Gateway ในเครื่อง หากต้องการใช้ image ที่ build ไว้ล่วงหน้าแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    image ที่ build ไว้ล่วงหน้าถูกเผยแพร่ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    แท็กที่พบบ่อย: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="ดำเนินการ onboarding ให้เสร็จ">
    สคริปต์ตั้งค่าจะรัน onboarding ให้อัตโนมัติ โดยจะ:

    - ถามหา provider API keys
    - สร้างโทเค็น Gateway และเขียนลงใน `.env`
    - สร้างไดเรกทอรีคีย์ลับของ auth-profile
    - เริ่ม Gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า onboarding ก่อนเริ่มและการเขียน config จะรันผ่าน
    `openclaw-gateway` โดยตรง ส่วน `openclaw-cli` ใช้สำหรับคำสั่งที่คุณรันหลังจาก
    คอนเทนเนอร์ Gateway มีอยู่แล้ว

  </Step>

  <Step title="เปิด Control UI">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ของคุณ แล้ววาง shared secret
    ที่กำหนดไว้ลงใน Settings โดยค่าเริ่มต้นสคริปต์ตั้งค่าจะเขียนโทเค็นลงใน `.env`;
    หากคุณเปลี่ยน config ของคอนเทนเนอร์เป็นการยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้
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

### ขั้นตอนแบบ Manual

หากคุณต้องการรันแต่ละขั้นตอนเองแทนการใช้สคริปต์ตั้งค่า:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
รัน `docker compose` จากราก repo หากคุณเปิดใช้ `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ตั้งค่าจะเขียน `docker-compose.extra.yml`;
ให้รวมไฟล์นั้นด้วย `-f docker-compose.yml -f docker-compose.extra.yml`
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้ network namespace ร่วมกับ `openclaw-gateway`
จึงเป็นเครื่องมือหลังเริ่มใช้งาน ก่อน `docker compose up -d openclaw-gateway`
ให้รัน onboarding และการเขียน config ระหว่างตั้งค่าผ่าน `openclaw-gateway` ด้วย
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ตั้งค่ารองรับตัวแปรสภาพแวดล้อมแบบไม่บังคับเหล่านี้:

| ตัวแปร                                     | วัตถุประสงค์                                                     |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ใช้ image ระยะไกลแทนการ build ในเครื่อง                       |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่าง build (คั่นด้วยช่องว่าง)   |
| `OPENCLAW_EXTENSIONS`                      | รวมตัวช่วย Plugin ที่ bundled ที่เลือกไว้ในช่วง build          |
| `OPENCLAW_EXTRA_MOUNTS`                    | host bind mounts เพิ่มเติม (คั่นด้วยจุลภาค `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | คงข้อมูล `/home/node` ไว้ใน named Docker volume                |
| `OPENCLAW_SANDBOX`                         | เลือกใช้ sandbox bootstrap (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | ข้ามขั้นตอน onboarding แบบโต้ตอบ (`1`, `true`, `yes`, `on`)    |
| `OPENCLAW_DOCKER_SOCKET`                   | แทนที่พาธ Docker socket                                        |
| `OPENCLAW_DISABLE_BONJOUR`                 | ปิดการโฆษณา Bonjour/mDNS (ค่าเริ่มต้นเป็น `1` สำหรับ Docker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | ปิด source bind-mount overlays ของ Plugin ที่ bundled          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | ปลายทาง OTLP/HTTP collector ร่วมสำหรับการส่งออก OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | ปลายทาง OTLP เฉพาะ signal สำหรับ traces, metrics หรือ logs     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | แทนที่โปรโตคอล OTLP ปัจจุบันรองรับเฉพาะ `http/protobuf`        |
| `OTEL_SERVICE_NAME`                        | ชื่อ service ที่ใช้สำหรับทรัพยากร OpenTelemetry                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | เลือกใช้แอตทริบิวต์ semantic GenAI ทดลองล่าสุด                 |
| `OPENCLAW_OTEL_PRELOADED`                  | ข้ามการเริ่ม OpenTelemetry SDK ตัวที่สองเมื่อมีตัวหนึ่งโหลดไว้ล่วงหน้า |

ผู้ดูแลสามารถทดสอบ source ของ Plugin ที่ bundled กับ image แบบแพ็กเกจได้โดย mount
ไดเรกทอรี source ของ Plugin หนึ่งรายการทับพาธ source แบบแพ็กเกจของมัน เช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ไดเรกทอรี source ที่ mount นั้นจะแทนที่ bundle ที่คอมไพล์แล้วที่ตรงกัน
`/app/dist/extensions/synology-chat` สำหรับ plugin id เดียวกัน

### Observability

การส่งออก OpenTelemetry เป็นการเชื่อมต่อขาออกจากคอนเทนเนอร์ Gateway ไปยัง OTLP
collector ของคุณ ไม่จำเป็นต้องมีพอร์ต Docker ที่เผยแพร่ หากคุณ build image
ในเครื่องและต้องการให้ exporter ของ OpenTelemetry ที่ bundled พร้อมใช้งานภายใน image
ให้รวม runtime dependencies ของมัน:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ติดตั้ง Plugin `@openclaw/diagnostics-otel` อย่างเป็นทางการจาก ClawHub ใน
การติดตั้ง Docker แบบแพ็กเกจก่อนเปิดใช้การส่งออก image ที่ build จาก source เอง
ยังสามารถรวม source ของ Plugin ภายในเครื่องด้วย
`OPENCLAW_EXTENSIONS=diagnostics-otel` ได้ หากต้องการเปิดใช้การส่งออก ให้ allow และเปิดใช้
Plugin `diagnostics-otel` ใน config จากนั้นตั้งค่า
`diagnostics.otel.enabled=true` หรือใช้ตัวอย่าง config ใน [การส่งออก OpenTelemetry
](/th/gateway/opentelemetry) ส่วนหัวสำหรับการยืนยันตัวตนของ collector กำหนดค่าผ่าน
`diagnostics.otel.headers` ไม่ใช่ผ่านตัวแปรสภาพแวดล้อม Docker

metrics ของ Prometheus ใช้พอร์ต Gateway ที่เผยแพร่อยู่แล้ว ติดตั้ง
`clawhub:@openclaw/diagnostics-prometheus`, เปิดใช้ Plugin
`diagnostics-prometheus` แล้วจึง scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

route นี้ได้รับการป้องกันด้วยการยืนยันตัวตนของ Gateway อย่าเปิดเผยพอร์ต
`/metrics` สาธารณะแยกต่างหาก หรือพาธ reverse-proxy ที่ไม่ต้องยืนยันตัวตน ดู
[metrics ของ Prometheus](/th/gateway/prometheus)

### Health checks

ปลายทาง probe ของคอนเทนเนอร์ (ไม่ต้องยืนยันตัวตน):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image มี `HEALTHCHECK` ในตัวที่จะ ping `/healthz`
หากการตรวจสอบยังล้มเหลว Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy` และ
ระบบ orchestration สามารถรีสตาร์ตหรือแทนที่ได้

สแนปช็อตสุขภาพเชิงลึกที่ยืนยันตัวตนแล้ว:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงของโฮสต์ไปยัง
`http://127.0.0.1:18789` ทำงานได้กับการเผยแพร่พอร์ตของ Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์ของโฮสต์และ CLI ของโฮสต์สามารถเข้าถึงพอร์ต Gateway ที่เผยแพร่ได้
- `loopback`: เฉพาะ process ภายใน network namespace ของคอนเทนเนอร์เท่านั้นที่เข้าถึง
  Gateway ได้โดยตรง

<Note>
ใช้ค่าของ bind mode ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่ host aliases อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### Provider ภายในเครื่องของโฮสต์

เมื่อ OpenClaw รันใน Docker, `127.0.0.1` ภายในคอนเทนเนอร์คือคอนเทนเนอร์
เอง ไม่ใช่เครื่องโฮสต์ของคุณ ใช้ `host.docker.internal` สำหรับ provider AI ที่
รันบนโฮสต์:

| Provider  | URL เริ่มต้นของโฮสต์       | URL สำหรับตั้งค่า Docker              |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่า Docker ที่ bundled ใช้ URL ของโฮสต์เหล่านั้นเป็นค่าเริ่มต้นของ onboarding
สำหรับ LM Studio และ Ollama และ `docker-compose.yml` จะ map `host.docker.internal` ไปยัง
Gateway ของโฮสต์ Docker สำหรับ Linux Docker Engine ส่วน Docker Desktop มี hostname
เดียวกันนี้อยู่แล้วบน macOS และ Windows

บริการของโฮสต์ต้อง listen บน address ที่ Docker เข้าถึงได้ด้วย:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

หากคุณใช้ไฟล์ Compose ของคุณเองหรือคำสั่ง `docker run` ให้เพิ่ม host
mapping เดียวกันเอง เช่น
`--add-host=host.docker.internal:host-gateway`

### Bonjour / mDNS

โดยปกติ Docker bridge networking จะไม่ forward multicast ของ Bonjour/mDNS
(`224.0.0.251:5353`) ได้อย่างน่าเชื่อถือ ดังนั้นการตั้งค่า Compose ที่ bundled
จึงตั้งค่าเริ่มต้น `OPENCLAW_DISABLE_BONJOUR=1` เพื่อไม่ให้ Gateway crash-loop หรือ
รีสตาร์ตการโฆษณาซ้ำ ๆ เมื่อ bridge ทิ้ง traffic multicast

ใช้ URL ของ Gateway ที่เผยแพร่, Tailscale หรือ wide-area DNS-SD สำหรับโฮสต์ Docker
ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วย host networking, macvlan
หรือเครือข่ายอื่นที่ทราบว่า mDNS multicast ทำงานได้

สำหรับข้อควรระวังและการแก้ไขปัญหา ดู [การค้นพบ Bonjour](/th/gateway/bonjour)

### พื้นที่จัดเก็บและการคงอยู่ของข้อมูล

Docker Compose จะ bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` และ
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` ไปยัง `/home/node/.config/openclaw` เพื่อให้พาธเหล่านั้น
คงอยู่หลังการแทนที่คอนเทนเนอร์ เมื่อไม่ได้ตั้งค่าตัวแปรใด ๆ `docker-compose.yml`
ที่ bundled จะ fallback ไปใต้ `${HOME}` หรือ `/tmp` เมื่อ `HOME` เองก็หายไปด้วย
ซึ่งช่วยป้องกันไม่ให้ `docker compose up` ปล่อย volume spec ที่มี source ว่าง
บนสภาพแวดล้อมเปล่า

ไดเรกทอรี config ที่ mount นั้นคือที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับ config พฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับ auth ของ provider OAuth/API-key ที่จัดเก็บไว้
- `.env` สำหรับความลับ runtime ที่หนุนด้วย env เช่น `OPENCLAW_GATEWAY_TOKEN`

ไดเรกทอรีคีย์ลับของ auth-profile เก็บคีย์เข้ารหัสภายในเครื่องที่ใช้สำหรับ
ข้อมูลโทเค็นของ auth profile ที่หนุนด้วย OAuth เก็บไว้กับสถานะโฮสต์ Docker ของคุณ
แต่แยกออกจาก `OPENCLAW_CONFIG_DIR`

Plugin ที่ดาวน์โหลดมาติดตั้งจะเก็บสถานะแพ็กเกจไว้ใต้ OpenClaw home ที่เมานต์ไว้ ดังนั้นระเบียนการติดตั้ง Plugin และรากแพ็กเกจจึงคงอยู่รอดจากการเปลี่ยนคอนเทนเนอร์ การเริ่มต้น Gateway จะไม่สร้างแผนผัง dependency ของ Plugin ที่บันเดิลมา

สำหรับรายละเอียดการคงอยู่แบบเต็มในการปรับใช้ VM ดู
[Docker VM Runtime - สิ่งใดคงอยู่ที่ใด](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ดิสก์เติบโตเร็ว:** เฝ้าดู `media/`, ไฟล์ JSONL ของเซสชัน,
`cron/runs/*.jsonl`, รากแพ็กเกจของ Plugin ที่ติดตั้งแล้ว และ rolling file logs
ใต้ `/tmp/openclaw/`

### ตัวช่วย Shell (ไม่บังคับ)

เพื่อให้จัดการ Docker ในแต่ละวันได้ง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จากพาธ raw เก่า `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้ง เพื่อให้ไฟล์ตัวช่วยในเครื่องของคุณติดตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` ฯลฯ รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดู [ClawDock](/th/install/clawdock) สำหรับคู่มือตัวช่วยฉบับเต็ม

<AccordionGroup>
  <Accordion title="เปิดใช้งาน sandbox ของ agent สำหรับ Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    พาธ socket แบบกำหนดเอง (เช่น rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    สคริปต์จะเมานต์ `docker.sock` หลังจากข้อกำหนดเบื้องต้นของ sandbox ผ่านแล้วเท่านั้น หาก
    การตั้งค่า sandbox ทำให้เสร็จสมบูรณ์ไม่ได้ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    เป็น `off` เทิร์นโหมดโค้ดของ Codex ยังถูกจำกัดให้อยู่ใน Codex
    `workspace-write` ขณะที่ sandbox ของ OpenClaw ทำงานอยู่; อย่าเมานต์
    socket ของ Docker บนโฮสต์เข้าไปในคอนเทนเนอร์ sandbox ของ agent

  </Accordion>

  <Accordion title="Automation / CI (ไม่โต้ตอบ)">
    ปิดการจัดสรร pseudo-TTY ของ Compose ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="หมายเหตุความปลอดภัยของเครือข่ายที่ใช้ร่วมกัน">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` เพื่อให้คำสั่ง CLI
    ติดต่อ gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความไว้วางใจที่ใช้ร่วมกัน
    คอนฟิก compose ตัด `NET_RAW`/`NET_ADMIN` และเปิดใช้
    `no-new-privileges` ทั้งบน `openclaw-gateway` และ `openclaw-cli`
  </Accordion>

  <Accordion title="ความล้มเหลว DNS ของ Docker Desktop ใน openclaw-cli">
    การตั้งค่า Docker Desktop บางแบบทำให้การ lookup DNS จาก sidecar
    `openclaw-cli` บนเครือข่ายที่ใช้ร่วมกันล้มเหลวหลังจากตัด `NET_RAW` ออก ซึ่งจะแสดงเป็น
    `EAI_AGAIN` ระหว่างคำสั่งที่พึ่งพา npm เช่น `openclaw plugins install`
    ให้ใช้ไฟล์ compose ที่เสริมความแข็งแรงเป็นค่าเริ่มต้นสำหรับการทำงาน Gateway ปกติ
    override ในเครื่องด้านล่างจะผ่อนท่าทีด้านความปลอดภัยของคอนเทนเนอร์ CLI โดย
    คืนค่าความสามารถเริ่มต้นของ Docker ดังนั้นให้ใช้เฉพาะกับคำสั่ง CLI ครั้งเดียว
    ที่ต้องเข้าถึง package registry เท่านั้น ไม่ใช่เป็นการเรียก Compose ค่าเริ่มต้นของคุณ:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    หากคุณสร้างคอนเทนเนอร์ `openclaw-cli` ที่ทำงานระยะยาวไว้แล้ว ให้สร้างใหม่
    ด้วย override เดียวกัน `docker compose exec` และ `docker exec` ไม่สามารถ
    เปลี่ยน Linux capabilities บนคอนเทนเนอร์ที่สร้างไว้แล้วได้

  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    image ทำงานเป็น `node` (uid 1000) หากคุณเห็นข้อผิดพลาดด้านสิทธิ์บน
    `/home/node/.openclaw` ตรวจสอบให้แน่ใจว่า bind mount บนโฮสต์ของคุณเป็นของ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    ความไม่ตรงกันแบบเดียวกันอาจแสดงเป็นคำเตือน Plugin เช่น
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    ตามด้วย `plugin present but blocked` นั่นหมายความว่า uid ของ process และเจ้าของ
    ไดเรกทอรี Plugin ที่เมานต์ไว้ไม่ตรงกัน ควรรันคอนเทนเนอร์ด้วย uid เริ่มต้น 1000
    และแก้ ownership ของ bind mount จะดีกว่า ให้ chown
    `/path/to/openclaw-config/npm` เป็น `root:root` เฉพาะเมื่อคุณตั้งใจรัน
    OpenClaw เป็น root ในระยะยาวเท่านั้น

  </Accordion>

  <Accordion title="การ rebuild ที่เร็วขึ้น">
    จัดลำดับ Dockerfile เพื่อให้เลเยอร์ dependency ถูกแคช วิธีนี้หลีกเลี่ยงการรัน
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
    image เริ่มต้นให้ความสำคัญกับความปลอดภัยและทำงานเป็น `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์
    ที่มีฟีเจอร์ครบขึ้น:

    1. **คงอยู่ `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง system deps**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ฝัง Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **หรือ ติดตั้งเบราว์เซอร์ Playwright ลงใน volume ที่คงอยู่**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **คงอยู่ browser downloads**: ใช้ `OPENCLAW_HOME_VOLUME` หรือ
       `OPENCLAW_EXTRA_MOUNTS` OpenClaw ตรวจพบ Chromium ที่จัดการโดย Playwright
       ของ Docker image บน Linux โดยอัตโนมัติ

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบ headless)">
    หากคุณเลือก OpenAI Codex OAuth ใน wizard ระบบจะเปิด URL ของเบราว์เซอร์ ใน
    การตั้งค่า Docker หรือ headless ให้คัดลอก redirect URL เต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปใน wizard เพื่อทำ auth ให้เสร็จ
  </Accordion>

  <Accordion title="เมทาดาทา base image">
    image runtime หลักของ Docker ใช้ `node:24-bookworm-slim` และรวม `tini` เป็น process init ของ entrypoint (PID 1) เพื่อให้แน่ใจว่า zombie process ถูกเก็บกวาดและสัญญาณถูกจัดการอย่างถูกต้องในคอนเทนเนอร์ที่ทำงานระยะยาว image นี้เผยแพร่ annotation ของ OCI base-image รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และรายการอื่น ๆ digest ฐานของ Node จะถูก
    รีเฟรชผ่าน PR ของ Dependabot สำหรับ Docker base-image; release build ไม่รัน
    เลเยอร์อัปเกรด distro ดู
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### กำลังรันบน VPS ใช่ไหม?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอนการปรับใช้ VM ร่วมกัน
รวมถึงการฝังไบนารี การคงอยู่ และการอัปเดต

## Agent sandbox

เมื่อเปิดใช้งาน `agents.defaults.sandbox` ด้วย backend ของ Docker, gateway
จะรันการดำเนินการเครื่องมือของ agent (shell, การอ่าน/เขียนไฟล์ ฯลฯ) ภายในคอนเทนเนอร์ Docker
ที่แยกอยู่ ขณะที่ gateway เองยังอยู่บนโฮสต์ วิธีนี้ให้กำแพงแข็งแรง
รอบเซสชัน agent ที่ไม่ไว้วางใจหรือมีผู้เช่าหลายราย โดยไม่ต้องทำให้ gateway ทั้งหมด
เป็นคอนเทนเนอร์

ขอบเขต sandbox สามารถเป็นต่อ agent (ค่าเริ่มต้น), ต่อเซสชัน หรือใช้ร่วมกัน แต่ละขอบเขต
จะมี workspace ของตัวเองเมานต์ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบาย allow/deny ของเครื่องมือ การแยกเครือข่าย ขีดจำกัดทรัพยากร และคอนเทนเนอร์เบราว์เซอร์ได้

สำหรับคอนฟิกทั้งหมด images, หมายเหตุความปลอดภัย และโปรไฟล์ multi-agent ดู:

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง sandbox ฉบับสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึง shell แบบโต้ตอบไปยังคอนเทนเนอร์ sandbox
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- override ต่อ agent

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

สร้าง sandbox image เริ่มต้น (จาก source checkout):

```bash
scripts/sandbox-setup.sh
```

สำหรับการติดตั้งผ่าน npm โดยไม่มี source checkout ดู [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มี image หรือคอนเทนเนอร์ sandbox ไม่เริ่มทำงาน">
    สร้าง sandbox image ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) หรือคำสั่ง `docker build` แบบ inline จาก [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) (ติดตั้ง npm),
    หรือกำหนด `agents.defaults.sandbox.docker.image` เป็น image แบบกำหนดเองของคุณ
    คอนเทนเนอร์จะถูกสร้างอัตโนมัติต่อเซสชันเมื่อต้องการ
  </Accordion>

  <Accordion title="ข้อผิดพลาดสิทธิ์ใน sandbox">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับ ownership ของ workspace ที่เมานต์ไว้ของคุณ
    หรือ chown โฟลเดอร์ workspace
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือแบบกำหนดเองใน sandbox">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่งจะ source
    `/etc/profile` และอาจรีเซ็ต PATH ตั้งค่า `docker.env.PATH` เพื่อเติมพาธ
    เครื่องมือแบบกำหนดเองของคุณไว้ด้านหน้า หรือเพิ่มสคริปต์ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM-killed ระหว่าง build image (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ใช้ machine class ที่ใหญ่ขึ้นแล้วลองใหม่
  </Accordion>

  <Accordion title="Unauthorized หรือต้อง pairing ใน Control UI">
    ดึงลิงก์ dashboard ใหม่และอนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    รายละเอียดเพิ่มเติม: [Dashboard](/th/web/dashboard), [Devices](/th/cli/devices)

  </Accordion>

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือข้อผิดพลาด pairing จาก Docker CLI">
    รีเซ็ตโหมดและ bind ของ gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีติดตั้งทั้งหมด
- [Podman](/th/install/podman) — ทางเลือก Podman แทน Docker
- [ClawDock](/th/install/clawdock) — การตั้งค่า Docker Compose ของชุมชน
- [การอัปเดต](/th/install/updating) — การทำให้ OpenClaw ทันสมัยอยู่เสมอ
- [Configuration](/th/gateway/configuration) — คอนฟิก gateway หลังการติดตั้ง
