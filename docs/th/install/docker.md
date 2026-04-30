---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์แทนการติดตั้งในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของโฟลว์ Docker
summary: การตั้งค่าและการเริ่มต้นใช้งาน OpenClaw แบบใช้ Docker ซึ่งเป็นทางเลือก
title: Docker
x-i18n:
    generated_at: "2026-04-30T09:59:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker เป็นสิ่งที่**ไม่บังคับ** ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบคอนเทนเนอร์ หรือต้องการตรวจสอบโฟลว์ Docker

## Docker เหมาะกับฉันหรือไม่?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway ที่แยกขาด ใช้แล้วทิ้งได้ หรือต้องการรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งภายในเครื่อง
- **ไม่**: คุณกำลังรันบนเครื่องของคุณเองและต้องการลูปพัฒนาที่เร็วที่สุด ให้ใช้โฟลว์ติดตั้งปกติแทน
- **หมายเหตุเรื่องแซนด์บ็อกซ์**: แบ็กเอนด์แซนด์บ็อกซ์เริ่มต้นใช้ Docker เมื่อเปิดใช้งานแซนด์บ็อกซ์ แต่แซนด์บ็อกซ์ปิดอยู่ตามค่าเริ่มต้น และ**ไม่**จำเป็นต้องให้ Gateway ทั้งหมดรันใน Docker นอกจากนี้ยังมีแบ็กเอนด์แซนด์บ็อกซ์ SSH และ OpenShell ด้วย ดู [แซนด์บ็อกซ์](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการสร้างอิมเมจ (`pnpm install` อาจถูกยุติเนื่องจากหน่วยความจำไม่พอบนโฮสต์ 1 GB พร้อมรหัสออก 137)
- พื้นที่ดิสก์เพียงพอสำหรับอิมเมจและบันทึก
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ
  [การเสริมความปลอดภัยสำหรับการเปิดเผยบนเครือข่าย](/th/gateway/security)
  โดยเฉพาะนโยบายไฟร์วอลล์ Docker `DOCKER-USER`

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="สร้างอิมเมจ">
    จากราก repo ให้รันสคริปต์ตั้งค่า:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะสร้างอิมเมจ Gateway ภายในเครื่อง หากต้องการใช้อิมเมจที่สร้างไว้แล้วแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    อิมเมจที่สร้างไว้แล้วเผยแพร่ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    แท็กที่ใช้บ่อย: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="ทำ onboarding ให้เสร็จ">
    สคริปต์ตั้งค่าจะรัน onboarding โดยอัตโนมัติ โดยจะ:

    - ถามคีย์ API ของผู้ให้บริการ
    - สร้างโทเค็น Gateway และเขียนลงใน `.env`
    - เริ่ม Gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า onboarding ก่อนเริ่มทำงานและการเขียน config จะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` ใช้สำหรับคำสั่งที่คุณรันหลังจาก
    คอนเทนเนอร์ Gateway มีอยู่แล้ว

  </Step>

  <Step title="เปิด UI ควบคุม">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ของคุณ แล้ววางความลับที่ใช้ร่วมกัน
    ซึ่งกำหนดค่าไว้ลงในการตั้งค่า สคริปต์ตั้งค่าจะเขียนโทเค็นลงใน `.env` ตามค่าเริ่มต้น
    หากคุณเปลี่ยน config คอนเทนเนอร์ไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้
    รหัสผ่านนั้นแทน

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
รัน `docker compose` จากราก repo หากคุณเปิดใช้ `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ตั้งค่าจะเขียน `docker-compose.extra.yml`;
ให้รวมไฟล์นั้นด้วย `-f docker-compose.yml -f docker-compose.extra.yml`
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้เนมสเปซเครือข่ายร่วมกับ `openclaw-gateway` จึงเป็น
เครื่องมือหลังเริ่มทำงาน ก่อน `docker compose up -d openclaw-gateway` ให้รัน onboarding
และการเขียน config ระหว่างตั้งค่าผ่าน `openclaw-gateway` ด้วย
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ตั้งค่ารองรับตัวแปรสภาพแวดล้อมเสริมเหล่านี้:

| ตัวแปร | วัตถุประสงค์ |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE` | ใช้อิมเมจระยะไกลแทนการสร้างภายในเครื่อง |
| `OPENCLAW_DOCKER_APT_PACKAGES` | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่างการสร้าง (คั่นด้วยช่องว่าง) |
| `OPENCLAW_EXTENSIONS` | ติดตั้ง deps ของ Plugin ล่วงหน้าระหว่างการสร้าง (ชื่อคั่นด้วยช่องว่าง) |
| `OPENCLAW_EXTRA_MOUNTS` | bind mount โฮสต์เพิ่มเติม (คั่นด้วยจุลภาค `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME` | เก็บ `/home/node` ไว้ในโวลุ่ม Docker ที่มีชื่อ |
| `OPENCLAW_PLUGIN_STAGE_DIR` | พาธคอนเทนเนอร์สำหรับ deps และ mirror ของ Plugin ที่รวมมาและสร้างขึ้น |
| `OPENCLAW_SANDBOX` | เลือกเปิดใช้การบูตสแตรปแซนด์บ็อกซ์ (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_SKIP_ONBOARDING` | ข้ามขั้นตอน onboarding แบบโต้ตอบ (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET` | แทนที่พาธซ็อกเก็ต Docker |
| `OPENCLAW_DISABLE_BONJOUR` | ปิดการโฆษณา Bonjour/mDNS (ค่าเริ่มต้นเป็น `1` สำหรับ Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | ปิดโอเวอร์เลย์ bind-mount ซอร์สของ Plugin ที่รวมมา |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | endpoint ตัวรวบรวม OTLP/HTTP ที่ใช้ร่วมกันสำหรับการส่งออก OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT` | endpoint OTLP เฉพาะสัญญาณสำหรับ trace, metric หรือ log |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | การแทนที่โปรโตคอล OTLP วันนี้รองรับเฉพาะ `http/protobuf` |
| `OTEL_SERVICE_NAME` | ชื่อบริการที่ใช้สำหรับทรัพยากร OpenTelemetry |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | เลือกใช้แอตทริบิวต์เชิงความหมาย GenAI แบบทดลองล่าสุด |
| `OPENCLAW_OTEL_PRELOADED` | ข้ามการเริ่ม OpenTelemetry SDK ชุดที่สองเมื่อมีการโหลดไว้ล่วงหน้าแล้ว |

ผู้ดูแลสามารถทดสอบซอร์สของ Plugin ที่รวมมากับอิมเมจแบบแพ็กเกจได้โดยเมานต์
ไดเรกทอรีซอร์สของ Plugin หนึ่งรายการทับพาธซอร์สแบบแพ็กเกจ เช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ไดเรกทอรีซอร์สที่เมานต์นั้นจะแทนที่บันเดิลที่คอมไพล์แล้วที่ตรงกันใน
`/app/dist/extensions/synology-chat` สำหรับ id ของ Plugin เดียวกัน

### ความสามารถในการสังเกต

การส่งออก OpenTelemetry เป็นการเชื่อมต่อขาออกจากคอนเทนเนอร์ Gateway ไปยังตัวรวบรวม
OTLP ของคุณ ไม่จำเป็นต้องมีพอร์ต Docker ที่เผยแพร่ หากคุณสร้างอิมเมจ
ภายในเครื่องและต้องการให้ exporter OpenTelemetry ที่รวมมาใช้งานได้ภายในอิมเมจ
ให้รวม dependency ระหว่างรันของมันด้วย:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

อิมเมจ Docker release อย่างเป็นทางการของ OpenClaw รวมซอร์ส Plugin
`diagnostics-otel` ไว้ด้วย ขึ้นอยู่กับอิมเมจและสถานะแคช
Gateway อาจยังต้อง stage dependency ระหว่างรันของ OpenTelemetry ที่อยู่ใน Plugin
ภายในครั้งแรกที่เปิดใช้ Plugin ดังนั้นให้อนุญาตให้การบูตครั้งแรกเข้าถึง package
registry หรือ prewarm อิมเมจใน release lane ของคุณ หากต้องการเปิดใช้การส่งออก ให้อนุญาตและ
เปิดใช้ Plugin `diagnostics-otel` ใน config จากนั้นตั้งค่า
`diagnostics.otel.enabled=true` หรือใช้ตัวอย่าง config ใน
[การส่งออก OpenTelemetry](/th/gateway/opentelemetry) ส่วนหัว auth ของตัวรวบรวมจะ
กำหนดค่าผ่าน `diagnostics.otel.headers` ไม่ใช่ผ่านตัวแปรสภาพแวดล้อม Docker

เมตริก Prometheus ใช้พอร์ต Gateway ที่เผยแพร่อยู่แล้ว เปิดใช้ Plugin
`diagnostics-prometheus` แล้วจึง scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

เส้นทางนี้ได้รับการปกป้องโดยการยืนยันตัวตน Gateway อย่าเปิดเผยพอร์ต
`/metrics` สาธารณะแยกต่างหาก หรือพาธ reverse-proxy ที่ไม่ต้องยืนยันตัวตน ดู
[เมตริก Prometheus](/th/gateway/prometheus)

### การตรวจสุขภาพ

endpoint สำหรับ probe ของคอนเทนเนอร์ (ไม่ต้อง auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

อิมเมจ Docker มี `HEALTHCHECK` ในตัวที่ ping `/healthz`
หากการตรวจล้มเหลวต่อเนื่อง Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy` และ
ระบบ orchestration สามารถเริ่มใหม่หรือแทนที่ได้

สแนปช็อตสุขภาพเชิงลึกที่ต้องยืนยันตัวตน:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` ใช้งานได้กับการเผยแพร่พอร์ตของ Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์บนโฮสต์และ CLI บนโฮสต์สามารถเข้าถึงพอร์ต Gateway ที่เผยแพร่ได้
- `loopback`: เฉพาะโปรเซสภายในเนมสเปซเครือข่ายของคอนเทนเนอร์เท่านั้นที่สามารถเข้าถึง
  Gateway ได้โดยตรง

<Note>
ใช้ค่าของโหมด bind ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่นามแฝงโฮสต์อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### ผู้ให้บริการในเครื่องโฮสต์

เมื่อ OpenClaw รันใน Docker, `127.0.0.1` ภายในคอนเทนเนอร์คือคอนเทนเนอร์
เอง ไม่ใช่เครื่องโฮสต์ของคุณ ใช้ `host.docker.internal` สำหรับผู้ให้บริการ AI ที่
รันบนโฮสต์:

| ผู้ให้บริการ | URL เริ่มต้นของโฮสต์ | URL สำหรับตั้งค่า Docker |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234` | `http://host.docker.internal:1234` |
| Ollama | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่า Docker ที่รวมมาจะใช้ URL โฮสต์เหล่านั้นเป็นค่าเริ่มต้นของ onboarding สำหรับ
LM Studio และ Ollama และ `docker-compose.yml` จะ map `host.docker.internal` ไปยัง
Gateway ของโฮสต์ของ Docker สำหรับ Linux Docker Engine ส่วน Docker Desktop มี hostname
เดียวกันนี้บน macOS และ Windows อยู่แล้ว

บริการบนโฮสต์ต้องฟังบนที่อยู่ที่ Docker เข้าถึงได้ด้วย:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

หากคุณใช้ไฟล์ Compose หรือคำสั่ง `docker run` ของคุณเอง ให้เพิ่มการ map โฮสต์
แบบเดียวกันด้วยตัวเอง เช่น
`--add-host=host.docker.internal:host-gateway`

### Bonjour / mDNS

เครือข่ายบริดจ์ของ Docker มักไม่ส่งต่อ multicast ของ Bonjour/mDNS
(`224.0.0.251:5353`) ได้อย่างเชื่อถือได้ ดังนั้นการตั้งค่า Compose ที่รวมมาจึงตั้งค่าเริ่มต้น
`OPENCLAW_DISABLE_BONJOUR=1` เพื่อไม่ให้ Gateway crash-loop หรือเริ่มโฆษณาซ้ำๆ
เมื่อบริดจ์ทิ้งทราฟฟิก multicast

ใช้ URL ของ Gateway ที่เผยแพร่แล้ว, Tailscale หรือ DNS-SD แบบ wide-area สำหรับโฮสต์ Docker
ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วยเครือข่ายของโฮสต์, macvlan,
หรือเครือข่ายอื่นที่ทราบว่า multicast ของ mDNS ใช้งานได้

สำหรับข้อควรระวังและการแก้ปัญหา ดู [การค้นพบ Bonjour](/th/gateway/bonjour)

### พื้นที่จัดเก็บและการคงอยู่

Docker Compose จะ bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw` และ
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` ดังนั้นพาธเหล่านั้น
จะยังอยู่รอดหลังการแทนที่คอนเทนเนอร์ เมื่อไม่ได้ตั้งค่าตัวแปรใดตัวแปรหนึ่ง
`docker-compose.yml` ที่รวมมาจะถอยกลับไปใช้ `${HOME}/.openclaw` (และ
`${HOME}/.openclaw/workspace` สำหรับเมานต์ workspace) หรือ `/tmp/.openclaw`
เมื่อไม่มี `HOME` ด้วย วิธีนี้ป้องกันไม่ให้ `docker compose up` ส่งออก
volume spec ที่มี source ว่างในสภาพแวดล้อมเปล่า

ไดเรกทอรี config ที่เมานต์นั้นคือที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับ config พฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับ auth OAuth/API-key ของผู้ให้บริการที่จัดเก็บไว้
- `.env` สำหรับ secret ระหว่างรันที่อิง env เช่น `OPENCLAW_GATEWAY_TOKEN`

ดีเพนเดนซีรันไทม์ของ Plugin ที่มาพร้อมชุดติดตั้งและไฟล์รันไทม์ที่มิเรอร์ไว้เป็นสถานะที่สร้างขึ้น
ไม่ใช่คอนฟิกผู้ใช้ Compose จัดเก็บไว้ใน Docker volume แบบมีชื่อ
`openclaw-plugin-runtime-deps` ที่เมานต์ที่
`/var/lib/openclaw/plugin-runtime-deps` การแยกทรีที่เปลี่ยนแปลงบ่อยนี้ออกจาก
bind mount คอนฟิกบนโฮสต์ช่วยหลีกเลี่ยงการทำงานกับไฟล์ที่ช้าของ Docker Desktop/WSL และแฮนเดิล Windows ที่ค้างระหว่างการเริ่ม Gateway แบบเย็น

ไฟล์ Compose เริ่มต้นตั้งค่า `OPENCLAW_PLUGIN_STAGE_DIR` เป็นพาธนั้นสำหรับทั้ง
`openclaw-gateway` และ `openclaw-cli` ดังนั้น `openclaw doctor --fix`, คำสั่ง
ล็อกอิน/ตั้งค่าช่องทาง และการเริ่ม Gateway จึงใช้ volume รันไทม์ที่สร้างขึ้นตัวเดียวกันทั้งหมด

สำหรับรายละเอียดการคงอยู่ทั้งหมดบนการปรับใช้ VM โปรดดู
[Docker VM Runtime - สิ่งใดคงอยู่ที่ใด](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ดิสก์โตเร็ว:** เฝ้าดู `media/`, ไฟล์ JSONL ของเซสชัน, `cron/runs/*.jsonl`,
Docker volume `openclaw-plugin-runtime-deps` และไฟล์ล็อกแบบหมุนเวียนใต้
`/tmp/openclaw/`

### ตัวช่วย Shell (ไม่บังคับ)

เพื่อให้จัดการ Docker ในแต่ละวันได้ง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จากพาธ raw เดิม `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้งเพื่อให้ไฟล์ตัวช่วยในเครื่องติดตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` ฯลฯ รัน
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

    สคริปต์จะเมานต์ `docker.sock` หลังจากข้อกำหนดเบื้องต้นของแซนด์บ็อกซ์ผ่านแล้วเท่านั้น หาก
    ตั้งค่าแซนด์บ็อกซ์ไม่สำเร็จ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
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
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` เพื่อให้คำสั่ง
    CLI เข้าถึง gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความเชื่อถือที่ใช้ร่วมกัน
    คอนฟิก compose จะดรอป `NET_RAW`/`NET_ADMIN` และเปิดใช้
    `no-new-privileges` บน `openclaw-cli`
  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    อิมเมจรันในชื่อ `node` (uid 1000) หากคุณเห็นข้อผิดพลาดด้านสิทธิ์บน
    `/home/node/.openclaw` ให้ตรวจสอบว่า bind mount บนโฮสต์เป็นของ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="การรีบิลด์ที่เร็วขึ้น">
    จัดลำดับ Dockerfile ของคุณเพื่อให้เลเยอร์ดีเพนเดนซีถูกแคชไว้ วิธีนี้หลีกเลี่ยงการรัน
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
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อนและรันเป็น `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์ที่
    มีความสามารถครบถ้วนมากขึ้น:

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
    กลับเข้าไปในวิซาร์ดเพื่อจบการยืนยันตัวตน
  </Accordion>

  <Accordion title="เมตาดาต้าของอิมเมจฐาน">
    อิมเมจรันไทม์ Docker หลักใช้ `node:24-bookworm-slim` และเผยแพร่คำอธิบายประกอบ OCI
    ของอิมเมจฐาน รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และรายการอื่นๆ ไดเจสต์ฐาน Node จะถูก
    รีเฟรชผ่าน PR อิมเมจฐาน Docker ของ Dependabot; บิลด์รีลีสจะไม่รัน
    เลเยอร์อัปเกรดดิสโทร ดู
    [คำอธิบายประกอบอิมเมจ OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### รันบน VPS?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอนการปรับใช้ VM ที่ใช้ร่วมกัน
รวมถึงการ bake ไบนารี การคงอยู่ และการอัปเดต

## แซนด์บ็อกซ์เอเจนต์

เมื่อเปิดใช้ `agents.defaults.sandbox` ด้วย backend Docker, gateway จะรัน
การดำเนินการเครื่องมือของเอเจนต์ (shell, อ่าน/เขียนไฟล์ ฯลฯ) ภายในคอนเทนเนอร์ Docker
ที่แยกออกจากกัน ขณะที่ gateway เองยังอยู่บนโฮสต์ วิธีนี้ให้กำแพงที่แข็งแรง
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือมีผู้เช่าหลายราย โดยไม่ต้องทำให้ gateway ทั้งหมดอยู่ในคอนเทนเนอร์

ขอบเขตแซนด์บ็อกซ์สามารถเป็นรายเอเจนต์ (ค่าเริ่มต้น), รายเซสชัน หรือใช้ร่วมกันได้ แต่ละขอบเขต
จะมี workspace ของตัวเองที่เมานต์ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบายเครื่องมือ allow/deny, การแยกเครือข่าย, ขีดจำกัดทรัพยากร และคอนเทนเนอร์
เบราว์เซอร์ได้

สำหรับคอนฟิกทั้งหมด อิมเมจ หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ โปรดดู:

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิงแซนด์บ็อกซ์ฉบับสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึง shell แบบโต้ตอบไปยังคอนเทนเนอร์แซนด์บ็อกซ์
- [แซนด์บ็อกซ์และเครื่องมือหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- การ override รายเอเจนต์

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

บิลด์อิมเมจแซนด์บ็อกซ์เริ่มต้น:

```bash
scripts/sandbox-setup.sh
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีอิมเมจหรือคอนเทนเนอร์แซนด์บ็อกซ์ไม่เริ่มทำงาน">
    บิลด์อิมเมจแซนด์บ็อกซ์ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็นอิมเมจที่กำหนดเองของคุณ
    คอนเทนเนอร์จะถูกสร้างอัตโนมัติตามแต่ละเซสชันเมื่อจำเป็น
  </Accordion>

  <Accordion title="ข้อผิดพลาดด้านสิทธิ์ในแซนด์บ็อกซ์">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับความเป็นเจ้าของ workspace ที่เมานต์ของคุณ
    หรือ chown โฟลเดอร์ workspace
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือแบบกำหนดเองในแซนด์บ็อกซ์">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่งจะ source
    `/etc/profile` และอาจรีเซ็ต PATH ตั้งค่า `docker.env.PATH` เพื่อเติม
    พาธเครื่องมือแบบกำหนดเองของคุณไว้ด้านหน้า หรือเพิ่มสคริปต์ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM kill ระหว่างบิลด์อิมเมจ (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ใช้คลาสเครื่องที่ใหญ่ขึ้นแล้วลองอีกครั้ง
  </Accordion>

  <Accordion title="ไม่ได้รับอนุญาตหรือต้องจับคู่ใน Control UI">
    ดึงลิงก์แดชบอร์ดใหม่และอนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    รายละเอียดเพิ่มเติม: [แดชบอร์ด](/th/web/dashboard), [อุปกรณ์](/th/cli/devices)

  </Accordion>

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือข้อผิดพลาดการจับคู่จาก Docker CLI">
    รีเซ็ตโหมด gateway และการ bind:

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
- [การอัปเดต](/th/install/updating) — ทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ
- [คอนฟิก](/th/gateway/configuration) — คอนฟิก gateway หลังติดตั้ง
