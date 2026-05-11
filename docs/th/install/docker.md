---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์แทนการติดตั้งในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของโฟลว์ Docker
summary: การตั้งค่าและการเริ่มต้นใช้งาน OpenClaw ด้วย Docker แบบเป็นทางเลือก
title: Docker
x-i18n:
    generated_at: "2026-05-11T20:32:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73e7f028708f6455b21aa38adf9dcd833bf6bc169d5405d32faa42641186b4a0
    source_path: install/docker.md
    workflow: 16
---

Docker เป็น **ตัวเลือกเสริม** ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบคอนเทนเนอร์ หรือเพื่อตรวจสอบความถูกต้องของ Docker flow

## Docker เหมาะกับฉันหรือไม่?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway ที่แยกขาดและทิ้งได้ หรือรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งภายในเครื่อง
- **ไม่**: คุณกำลังรันบนเครื่องของคุณเองและต้องการ dev loop ที่เร็วที่สุดเท่านั้น ให้ใช้ขั้นตอนการติดตั้งปกติแทน
- **หมายเหตุเรื่อง sandboxing**: sandbox backend เริ่มต้นใช้ Docker เมื่อเปิดใช้ sandboxing แต่ sandboxing ปิดอยู่ตามค่าเริ่มต้น และ **ไม่** จำเป็นต้องให้ Gateway ทั้งหมดรันใน Docker นอกจากนี้ยังมี SSH และ OpenShell sandbox backend ให้ใช้งาน ดู [Sandboxing](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการ build image (`pnpm install` อาจถูก OOM-killed บนโฮสต์ 1 GB ด้วย exit 137)
- พื้นที่ดิสก์เพียงพอสำหรับ image และ log
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ
  [การเสริมความปลอดภัยสำหรับการเปิดสู่เครือข่าย](/th/gateway/security),
  โดยเฉพาะนโยบายไฟร์วอลล์ Docker `DOCKER-USER`

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="Build image">
    จาก repo root ให้รันสคริปต์ตั้งค่า:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะ build Gateway image ภายในเครื่อง หากต้องการใช้ image ที่ build ไว้ล่วงหน้าแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    image ที่ build ไว้ล่วงหน้าถูกเผยแพร่ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    tag ที่ใช้บ่อย: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="ดำเนินการ onboarding ให้เสร็จ">
    สคริปต์ตั้งค่าจะรัน onboarding โดยอัตโนมัติ โดยจะ:

    - prompt ให้ใส่ provider API keys
    - สร้าง Gateway token และเขียนลงใน `.env`
    - เริ่ม Gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า onboarding ก่อนเริ่มและการเขียน config จะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` ใช้สำหรับคำสั่งที่คุณรันหลังจาก
    Gateway container มีอยู่แล้ว

  </Step>

  <Step title="เปิด Control UI">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ แล้ววาง shared secret ที่ตั้งค่าไว้
    ลงใน Settings สคริปต์ตั้งค่าจะเขียน token ลงใน `.env` ตามค่าเริ่มต้น
    หากคุณเปลี่ยน config ของ container ไปใช้ password auth ให้ใช้รหัสผ่านนั้นแทน

    ต้องการ URL อีกครั้งหรือไม่?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="กำหนดค่า channel (ตัวเลือกเสริม)">
    ใช้ CLI container เพื่อเพิ่ม messaging channel:

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
รัน `docker compose` จาก repo root หากคุณเปิดใช้ `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ตั้งค่าจะเขียน `docker-compose.extra.yml`;
ให้รวมไฟล์นั้นด้วย `-f docker-compose.yml -f docker-compose.extra.yml`
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้ network namespace ร่วมกับ `openclaw-gateway`
จึงเป็นเครื่องมือหลังเริ่มทำงาน ก่อน `docker compose up -d openclaw-gateway`
ให้รัน onboarding และการเขียน config ระหว่างตั้งค่าผ่าน `openclaw-gateway`
พร้อม `--no-deps --entrypoint node`
</Note>

### Environment variable

สคริปต์ตั้งค่ารองรับ environment variable แบบตัวเลือกเสริมเหล่านี้:

| Variable                                   | วัตถุประสงค์                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ใช้ image ระยะไกลแทนการ build ภายในเครื่อง                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ติดตั้ง apt package เพิ่มเติมระหว่าง build (คั่นด้วยช่องว่าง)       |
| `OPENCLAW_EXTENSIONS`                      | รวม bundled plugin helper ที่เลือกไว้ในเวลา build           |
| `OPENCLAW_EXTRA_MOUNTS`                    | host bind mount เพิ่มเติม (คั่นด้วยจุลภาค `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | ทำให้ `/home/node` คงอยู่ใน named Docker volume                   |
| `OPENCLAW_SANDBOX`                         | เลือกเปิดใช้ sandbox bootstrap (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | ข้ามขั้นตอน interactive onboarding (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | แทนที่ path ของ Docker socket                                     |
| `OPENCLAW_DISABLE_BONJOUR`                 | ปิดการโฆษณา Bonjour/mDNS (ค่าเริ่มต้นเป็น `1` สำหรับ Docker)   |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | ปิด bundled plugin source bind-mount overlay               |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint ของ OTLP/HTTP collector ที่ใช้ร่วมกันสำหรับการ export OpenTelemetry    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpoint ของ OTLP แบบเฉพาะ signal สำหรับ traces, metrics หรือ logs     |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | แทนที่ OTLP protocol ปัจจุบันรองรับเฉพาะ `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | ชื่อ service ที่ใช้สำหรับ OpenTelemetry resources                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | เลือกใช้ experimental GenAI semantic attributes ล่าสุด         |
| `OPENCLAW_OTEL_PRELOADED`                  | ข้ามการเริ่ม OpenTelemetry SDK ตัวที่สองเมื่อมีตัวหนึ่ง preload อยู่  |

ผู้ดูแลสามารถทดสอบ bundled plugin source กับ packaged image ได้โดย mount
ไดเรกทอรี source ของ Plugin หนึ่งตัวทับ path ของ packaged source เช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
ไดเรกทอรี source ที่ mount นั้นจะแทนที่ bundle ที่ compile แล้วที่ตรงกัน
`/app/dist/extensions/synology-chat` สำหรับ plugin id เดียวกัน

### Observability

การ export OpenTelemetry เป็น outbound จาก Gateway container ไปยัง OTLP
collector ของคุณ ไม่จำเป็นต้องเผยแพร่ Docker port หากคุณ build image
ภายในเครื่องและต้องการให้ bundled OpenTelemetry exporter พร้อมใช้งานใน image
ให้รวม runtime dependencies ของมัน:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ติดตั้ง Plugin ทางการ `@openclaw/diagnostics-otel` จาก ClawHub ใน
การติดตั้ง Docker แบบ packaged ก่อนเปิดใช้ export image ที่ build จาก source
แบบกำหนดเองยังสามารถรวม local plugin source ด้วย
`OPENCLAW_EXTENSIONS=diagnostics-otel` ได้ หากต้องการเปิดใช้ export ให้ allow และ enable
Plugin `diagnostics-otel` ใน config จากนั้นตั้งค่า
`diagnostics.otel.enabled=true` หรือใช้ตัวอย่าง config ใน [OpenTelemetry
export](/th/gateway/opentelemetry). Collector auth headers ถูกกำหนดค่าผ่าน
`diagnostics.otel.headers` ไม่ใช่ผ่าน Docker environment variables

Prometheus metrics ใช้ Gateway port ที่เผยแพร่อยู่แล้ว ติดตั้ง
`clawhub:@openclaw/diagnostics-prometheus`, เปิดใช้ Plugin
`diagnostics-prometheus` แล้ว scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

route นี้ได้รับการป้องกันด้วย Gateway authentication อย่าเปิดเผย port `/metrics`
สาธารณะแยกต่างหาก หรือ unauthenticated reverse-proxy path ดู
[Prometheus metrics](/th/gateway/prometheus)

### Health check

Container probe endpoints (ไม่ต้องมี auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image มี `HEALTHCHECK` ในตัวที่ ping `/healthz`
หาก check ล้มเหลวต่อเนื่อง Docker จะทำเครื่องหมาย container เป็น `unhealthy` และ
orchestration system สามารถ restart หรือ replace ได้

Authenticated deep health snapshot:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้ host เข้าถึง
`http://127.0.0.1:18789` ได้ด้วย Docker port publishing

- `lan` (ค่าเริ่มต้น): host browser และ host CLI สามารถเข้าถึง Gateway port ที่เผยแพร่ได้
- `loopback`: เฉพาะ process ภายใน container network namespace เท่านั้นที่เข้าถึง
  Gateway ได้โดยตรง

<Note>
ใช้ค่า bind mode ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่ host alias เช่น `0.0.0.0` หรือ `127.0.0.1`
</Note>

### Host Local Providers

เมื่อ OpenClaw รันใน Docker, `127.0.0.1` ภายใน container คือ container
เอง ไม่ใช่เครื่อง host ของคุณ ใช้ `host.docker.internal` สำหรับ AI providers ที่
รันบน host:

| Provider  | Host default URL         | Docker setup URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่า Docker ที่ bundled ใช้ host URL เหล่านั้นเป็นค่าเริ่มต้นของ onboarding
สำหรับ LM Studio และ Ollama และ `docker-compose.yml` map `host.docker.internal` ไปยัง
host gateway ของ Docker สำหรับ Linux Docker Engine ส่วน Docker Desktop มี
hostname เดียวกันนี้บน macOS และ Windows อยู่แล้ว

Host service ต้อง listen บน address ที่ Docker เข้าถึงได้ด้วย:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

หากคุณใช้ Compose file หรือคำสั่ง `docker run` ของคุณเอง ให้เพิ่ม host
mapping เดียวกันด้วยตัวเอง เช่น
`--add-host=host.docker.internal:host-gateway`

### Bonjour / mDNS

Docker bridge networking โดยปกติไม่ forward Bonjour/mDNS multicast
(`224.0.0.251:5353`) ได้อย่างน่าเชื่อถือ ดังนั้นการตั้งค่า Compose ที่ bundled จึงตั้งค่าเริ่มต้น
`OPENCLAW_DISABLE_BONJOUR=1` เพื่อไม่ให้ Gateway crash-loop หรือ restart
การโฆษณาซ้ำเมื่อ bridge drop multicast traffic

ใช้ Gateway URL ที่เผยแพร่แล้ว, Tailscale หรือ wide-area DNS-SD สำหรับ Docker hosts
ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วย host networking, macvlan
หรือเครือข่ายอื่นที่ทราบว่า mDNS multicast ใช้งานได้

สำหรับข้อควรระวังและการแก้ปัญหา ดู [Bonjour discovery](/th/gateway/bonjour)

### พื้นที่จัดเก็บและการคงอยู่ของข้อมูล

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw` และ
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` ดังนั้น path เหล่านั้น
จึงอยู่รอดหลังเปลี่ยน container เมื่อไม่ได้ตั้งค่าตัวแปรใดตัวแปรหนึ่ง
`docker-compose.yml` ที่ bundled จะ fallback ไปที่ `${HOME}/.openclaw` (และ
`${HOME}/.openclaw/workspace` สำหรับ workspace mount) หรือ `/tmp/.openclaw`
เมื่อ `HOME` เองก็ไม่มีเช่นกัน วิธีนี้ทำให้ `docker compose up` ไม่
ส่งออก empty-source volume spec บน environment เปล่า

ไดเรกทอรี config ที่ mount นั้นคือที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับ behavior config
- `agents/<agentId>/agent/auth-profiles.json` สำหรับ provider OAuth/API-key auth ที่จัดเก็บไว้
- `.env` สำหรับ runtime secrets ที่อิง env เช่น `OPENCLAW_GATEWAY_TOKEN`

Plugin แบบดาวน์โหลดได้ที่ติดตั้งแล้วจะเก็บ package state ไว้ใต้ OpenClaw home
ที่ mount ไว้ ดังนั้น plugin install records และ package roots จะอยู่รอดหลัง
เปลี่ยน container การเริ่ม Gateway ไม่สร้าง dependency trees ของ bundled-plugin

สำหรับรายละเอียดการคงอยู่ของข้อมูลทั้งหมดบนการ deploy VM ดู
[Docker VM Runtime - สิ่งใดคงอยู่ที่ใด](/th/install/docker-vm-runtime#what-persists-where).

**จุดที่ดิสก์โตเร็ว:** เฝ้าดู `media/`, ไฟล์ JSONL ของเซสชัน,
`cron/runs/*.jsonl`, รากแพ็กเกจ Plugin ที่ติดตั้งไว้ และไฟล์ log แบบ rolling
ภายใต้ `/tmp/openclaw/`.

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
  <Accordion title="เปิดใช้ sandbox ของเอเจนต์สำหรับ Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    พาธ socket แบบกำหนดเอง (เช่น Docker แบบ rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    สคริปต์จะเมานต์ `docker.sock` หลังจากข้อกำหนดเบื้องต้นของ sandbox ผ่านแล้วเท่านั้น หาก
    การตั้งค่า sandbox ทำไม่สำเร็จ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    เป็น `off` เทิร์น code-mode ของ Codex ยังถูกจำกัดให้อยู่ใน Codex
    `workspace-write` ขณะที่ sandbox ของ OpenClaw ทำงานอยู่ อย่าเมานต์
    socket Docker ของโฮสต์เข้าไปในคอนเทนเนอร์ sandbox ของเอเจนต์

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
    เข้าถึง gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความไว้วางใจที่ใช้ร่วมกัน
    การตั้งค่า compose จะตัด `NET_RAW`/`NET_ADMIN` และเปิดใช้
    `no-new-privileges` ทั้งบน `openclaw-gateway` และ `openclaw-cli`
  </Accordion>

  <Accordion title="Docker Desktop DNS ล้มเหลวใน openclaw-cli">
    การตั้งค่า Docker Desktop บางแบบค้นหา DNS จาก sidecar
    `openclaw-cli` บนเครือข่ายที่ใช้ร่วมกันไม่สำเร็จหลังจากตัด `NET_RAW` ซึ่งจะแสดงเป็น
    `EAI_AGAIN` ระหว่างคำสั่งที่พึ่งพา npm เช่น `openclaw plugins install`
    ให้เก็บไฟล์ compose แบบเสริมความปลอดภัยเริ่มต้นไว้สำหรับการทำงาน gateway ตามปกติ
    override ในเครื่องด้านล่างจะลดระดับความปลอดภัยของคอนเทนเนอร์ CLI โดย
    กู้คืน capability เริ่มต้นของ Docker ดังนั้นให้ใช้เฉพาะกับคำสั่ง CLI แบบครั้งเดียว
    ที่ต้องเข้าถึง package registry ไม่ใช่เป็นการเรียก Compose เริ่มต้นของคุณ:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    หากคุณสร้างคอนเทนเนอร์ `openclaw-cli` แบบรันระยะยาวไว้แล้ว ให้สร้างใหม่
    ด้วย override เดียวกัน `docker compose exec` และ `docker exec` ไม่สามารถ
    เปลี่ยน capability ของ Linux บนคอนเทนเนอร์ที่สร้างไว้แล้วได้

  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    อิมเมจรันเป็น `node` (uid 1000) หากคุณเห็นข้อผิดพลาดด้านสิทธิ์บน
    `/home/node/.openclaw` ให้ตรวจสอบว่า bind mount บนโฮสต์ของคุณมีเจ้าของเป็น uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    ความไม่ตรงกันเดียวกันอาจแสดงเป็นคำเตือนของ Plugin เช่น
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    ตามด้วย `plugin present but blocked` ซึ่งหมายความว่า uid ของโปรเซสและเจ้าของ
    ไดเรกทอรี Plugin ที่เมานต์ไว้ไม่ตรงกัน ควรรันคอนเทนเนอร์ด้วย
    uid เริ่มต้น 1000 และแก้เจ้าของ bind mount ให้ถูกต้อง ให้ chown
    `/path/to/openclaw-config/npm` เป็น `root:root` เฉพาะเมื่อคุณตั้งใจรัน
    OpenClaw เป็น root ระยะยาวเท่านั้น

  </Accordion>

  <Accordion title="สร้างใหม่ได้เร็วขึ้น">
    จัดลำดับ Dockerfile ของคุณเพื่อให้เลเยอร์ dependency ถูกแคช วิธีนี้ช่วยหลีกเลี่ยงการรัน
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
    ความสามารถครบถ้วนขึ้น:

    1. **คงไว้ซึ่ง `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง deps ของระบบ**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ฝัง Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    4. **หรือติดตั้งเบราว์เซอร์ Playwright ลงใน volume ที่คงอยู่**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **คงไว้ซึ่งไฟล์ดาวน์โหลดของเบราว์เซอร์**: ใช้ `OPENCLAW_HOME_VOLUME` หรือ
       `OPENCLAW_EXTRA_MOUNTS` OpenClaw ตรวจจับ Chromium บน Linux ที่จัดการโดย Playwright
       ของอิมเมจ Docker ได้อัตโนมัติ

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบไม่มีหน้าจอ)">
    หากคุณเลือก OpenAI Codex OAuth ใน wizard จะมีการเปิด URL ของเบราว์เซอร์ ใน
    Docker หรือการตั้งค่าแบบไม่มีหน้าจอ ให้คัดลอก URL redirect แบบเต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปใน wizard เพื่อยืนยันตัวตนให้เสร็จ
  </Accordion>

  <Accordion title="เมทาดาทาของอิมเมจพื้นฐาน">
    อิมเมจ runtime หลักของ Docker ใช้ `node:24-bookworm-slim` และรวม `tini` เป็นโปรเซส init ของ entrypoint (PID 1) เพื่อให้แน่ใจว่าโปรเซส zombie ถูกเก็บกวาดและสัญญาณถูกจัดการอย่างถูกต้องในคอนเทนเนอร์ที่รันระยะยาว อิมเมจเผยแพร่ annotation ของ OCI base-image รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และรายการอื่นๆ digest พื้นฐานของ Node จะถูก
    รีเฟรชผ่าน PR Docker base-image ของ Dependabot; build สำหรับ release ไม่ได้รัน
    เลเยอร์อัปเกรด distro ดู
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### กำลังรันบน VPS?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอน deployment บน VM ที่ใช้ร่วมกัน
รวมถึงการฝัง binary, persistence และการอัปเดต

## sandbox ของเอเจนต์

เมื่อเปิดใช้ `agents.defaults.sandbox` ด้วย backend Docker gateway
จะรันการเรียกใช้เครื่องมือของเอเจนต์ (shell, อ่าน/เขียนไฟล์ และอื่นๆ) ภายในคอนเทนเนอร์ Docker
ที่แยกออกจากกัน ขณะที่ gateway เองยังอยู่บนโฮสต์ วิธีนี้ให้กำแพงที่แข็งแรง
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือมีผู้เช่าหลายราย โดยไม่ต้องทำให้ gateway ทั้งหมด
อยู่ในคอนเทนเนอร์

ขอบเขต sandbox เป็นแบบต่อเอเจนต์ (ค่าเริ่มต้น), ต่อเซสชัน หรือใช้ร่วมกันได้ แต่ละขอบเขต
จะมี workspace ของตัวเองที่เมานต์ไว้ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบายเครื่องมือ allow/deny, การแยกเครือข่าย, resource limit และคอนเทนเนอร์
เบราว์เซอร์ได้

สำหรับการกำหนดค่าเต็มรูปแบบ, อิมเมจ, หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ ดู:

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง sandbox ฉบับสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึง shell แบบโต้ตอบไปยังคอนเทนเนอร์ sandbox
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- override ต่อเอเจนต์

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

สร้างอิมเมจ sandbox เริ่มต้น (จาก source checkout):

```bash
scripts/sandbox-setup.sh
```

สำหรับการติดตั้ง npm โดยไม่มี source checkout ดู [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีอิมเมจหรือคอนเทนเนอร์ sandbox ไม่เริ่มทำงาน">
    สร้างอิมเมจ sandbox ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) หรือคำสั่ง `docker build` แบบ inline จาก [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) (ติดตั้ง npm),
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็นอิมเมจแบบกำหนดเองของคุณ
    คอนเทนเนอร์จะถูกสร้างอัตโนมัติต่อเซสชันตามต้องการ
  </Accordion>

  <Accordion title="ข้อผิดพลาดด้านสิทธิ์ใน sandbox">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับเจ้าของ workspace ที่เมานต์ไว้ของคุณ
    หรือ chown โฟลเดอร์ workspace
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือแบบกำหนดเองใน sandbox">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่ง source
    `/etc/profile` และอาจรีเซ็ต PATH ได้ ตั้งค่า `docker.env.PATH` เพื่อเติมพาธ
    เครื่องมือแบบกำหนดเองไว้ด้านหน้า หรือเพิ่มสคริปต์ภายใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM kill ระหว่าง build อิมเมจ (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ใช้ machine class ที่ใหญ่ขึ้นแล้วลองอีกครั้ง
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
- [ClawDock](/th/install/clawdock) — การตั้งค่า Docker Compose โดยชุมชน
- [การอัปเดต](/th/install/updating) — การทำให้ OpenClaw เป็นปัจจุบันอยู่เสมอ
- [การกำหนดค่า](/th/gateway/configuration) — การกำหนดค่า gateway หลังติดตั้ง
