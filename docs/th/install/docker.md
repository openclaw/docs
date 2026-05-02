---
read_when:
    - คุณต้องการ Gateway ที่อยู่ในคอนเทนเนอร์แทนการติดตั้งภายในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของโฟลว์ Docker
summary: การตั้งค่าและการเริ่มต้นใช้งานแบบใช้ Docker ที่เป็นทางเลือกสำหรับ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-02T10:20:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8467618438209c1c7c74eadf2c793dbae21622eb92fa3ddbd13d668d8be5bf1f
    source_path: install/docker.md
    workflow: 16
---

Docker เป็นตัวเลือกเสริม ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบคอนเทนเนอร์ หรือต้องการตรวจสอบความถูกต้องของโฟลว์ Docker

## Docker เหมาะกับฉันหรือไม่?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway ที่แยกขาด ทิ้งได้ง่าย หรือรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งภายในเครื่อง
- **ไม่**: คุณกำลังรันบนเครื่องของคุณเองและต้องการเพียงลูปการพัฒนาที่เร็วที่สุด ให้ใช้โฟลว์ติดตั้งปกติแทน
- **หมายเหตุเรื่องแซนด์บ็อกซ์**: แบ็กเอนด์แซนด์บ็อกซ์เริ่มต้นใช้ Docker เมื่อเปิดใช้แซนด์บ็อกซ์ แต่แซนด์บ็อกซ์ปิดอยู่โดยค่าเริ่มต้น และ **ไม่** จำเป็นต้องรัน Gateway ทั้งหมดใน Docker นอกจากนี้ยังมีแบ็กเอนด์แซนด์บ็อกซ์ SSH และ OpenShell ให้ใช้ด้วย ดู [แซนด์บ็อกซ์](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการบิลด์อิมเมจ (`pnpm install` อาจถูก OOM-killed บนโฮสต์ 1 GB พร้อมรหัสออก 137)
- พื้นที่ดิสก์เพียงพอสำหรับอิมเมจและล็อก
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ
  [การเสริมความปลอดภัยสำหรับการเปิดเผยผ่านเครือข่าย](/th/gateway/security),
  โดยเฉพาะนโยบายไฟร์วอลล์ Docker `DOCKER-USER`

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="บิลด์อิมเมจ">
    จากราก repo ให้รันสคริปต์ตั้งค่า:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะบิลด์อิมเมจ Gateway ภายในเครื่อง หากต้องการใช้อิมเมจที่บิลด์ไว้ล่วงหน้าแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    อิมเมจที่บิลด์ไว้ล่วงหน้าถูกเผยแพร่ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    แท็กที่ใช้บ่อย: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="ทำ onboarding ให้เสร็จ">
    สคริปต์ตั้งค่าจะรัน onboarding โดยอัตโนมัติ โดยจะ:

    - ถาม provider API keys
    - สร้างโทเค็น Gateway และเขียนลงใน `.env`
    - เริ่ม Gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า onboarding ก่อนเริ่มต้นและการเขียนคอนฟิกจะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` ใช้สำหรับคำสั่งที่คุณรันหลังจาก
    คอนเทนเนอร์ Gateway มีอยู่แล้ว

  </Step>

  <Step title="เปิด Control UI">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ แล้ววาง shared secret ที่กำหนดค่าไว้
    ลงใน Settings สคริปต์ตั้งค่าจะเขียนโทเค็นลงใน `.env` โดยค่าเริ่มต้น
    หากคุณเปลี่ยนคอนฟิกคอนเทนเนอร์เป็นการยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้
    รหัสผ่านนั้นแทน

    ต้องการ URL อีกครั้งหรือไม่?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="กำหนดค่าช่องทาง (ไม่บังคับ)">
    ใช้คอนเทนเนอร์ CLI เพื่อเพิ่มช่องทางส่งข้อความ:

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

### โฟลว์แบบทำเอง

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
เนื่องจาก `openclaw-cli` ใช้ namespace เครือข่ายร่วมกับ `openclaw-gateway`
จึงเป็นเครื่องมือหลังเริ่มต้น ก่อน `docker compose up -d openclaw-gateway`
ให้รัน onboarding และการเขียนคอนฟิกช่วงตั้งค่าผ่าน `openclaw-gateway` ด้วย
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ตั้งค่ารองรับตัวแปรสภาพแวดล้อมแบบไม่บังคับเหล่านี้:

| ตัวแปร                                    | จุดประสงค์                                                     |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ใช้อิมเมจระยะไกลแทนการบิลด์ภายในเครื่อง                       |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่างบิลด์ (คั่นด้วยช่องว่าง)    |
| `OPENCLAW_EXTENSIONS`                      | รวมตัวช่วย Plugin ที่บันเดิลไว้ที่เวลา build                   |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mount ของโฮสต์เพิ่มเติม (คั่นด้วยจุลภาค `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | คงอยู่ `/home/node` ใน Docker volume ที่มีชื่อ                  |
| `OPENCLAW_SANDBOX`                         | เลือกเข้าร่วม sandbox bootstrap (`1`, `true`, `yes`, `on`)      |
| `OPENCLAW_SKIP_ONBOARDING`                 | ข้ามขั้นตอน onboarding แบบโต้ตอบ (`1`, `true`, `yes`, `on`)    |
| `OPENCLAW_DOCKER_SOCKET`                   | แทนที่พาธ Docker socket                                        |
| `OPENCLAW_DISABLE_BONJOUR`                 | ปิดการประกาศ Bonjour/mDNS (ค่าเริ่มต้นเป็น `1` สำหรับ Docker)  |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | ปิด source bind-mount overlay ของ Plugin ที่บันเดิลไว้          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint ตัวรวบรวม OTLP/HTTP ร่วมสำหรับการส่งออก OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpoint OTLP เฉพาะสัญญาณสำหรับ traces, metrics หรือ logs      |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | แทนที่โปรโตคอล OTLP ปัจจุบันรองรับเฉพาะ `http/protobuf`        |
| `OTEL_SERVICE_NAME`                        | ชื่อบริการที่ใช้สำหรับทรัพยากร OpenTelemetry                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | เลือกใช้แอตทริบิวต์เชิงความหมาย GenAI แบบทดลองล่าสุด          |
| `OPENCLAW_OTEL_PRELOADED`                  | ข้ามการเริ่ม OpenTelemetry SDK ตัวที่สองเมื่อมีตัวหนึ่งโหลดไว้ล่วงหน้า |

ผู้ดูแลสามารถทดสอบซอร์ส Plugin ที่บันเดิลไว้กับอิมเมจแบบแพ็กเกจได้โดยเมานต์
ไดเรกทอรีซอร์สของ Plugin หนึ่งรายการทับพาธซอร์สแบบแพ็กเกจของมัน เช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ไดเรกทอรีซอร์สที่เมานต์นั้นจะแทนที่บันเดิลที่คอมไพล์แล้ว
`/app/dist/extensions/synology-chat` ที่ตรงกันสำหรับ plugin id เดียวกัน

### การสังเกตการณ์

การส่งออก OpenTelemetry เป็นการเชื่อมต่อขาออกจากคอนเทนเนอร์ Gateway ไปยัง
ตัวรวบรวม OTLP ของคุณ ไม่จำเป็นต้องมีพอร์ต Docker ที่เผยแพร่ หากคุณบิลด์อิมเมจ
ภายในเครื่องและต้องการให้ exporter OpenTelemetry ที่บันเดิลไว้พร้อมใช้งานภายในอิมเมจ
ให้รวม runtime dependencies ของมัน:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ติดตั้ง Plugin อย่างเป็นทางการ `@openclaw/diagnostics-otel` ในการติดตั้ง Docker
แบบแพ็กเกจก่อนเปิดใช้การส่งออก อิมเมจที่บิลด์จากซอร์สแบบกำหนดเองยังสามารถรวม
ซอร์ส Plugin ภายในเครื่องด้วย `OPENCLAW_EXTENSIONS=diagnostics-otel` ได้
หากต้องการเปิดใช้การส่งออก ให้อนุญาตและเปิดใช้ Plugin `diagnostics-otel`
ในคอนฟิก จากนั้นตั้งค่า `diagnostics.otel.enabled=true` หรือใช้ตัวอย่างคอนฟิกใน
[การส่งออก OpenTelemetry](/th/gateway/opentelemetry) ส่วนหัวสำหรับยืนยันตัวตนของ
collector กำหนดค่าผ่าน `diagnostics.otel.headers` ไม่ใช่ผ่านตัวแปรสภาพแวดล้อม Docker

Prometheus metrics ใช้พอร์ต Gateway ที่เผยแพร่อยู่แล้ว เปิดใช้ Plugin
`diagnostics-prometheus` แล้ว scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

เส้นทางนี้ได้รับการป้องกันด้วยการยืนยันตัวตนของ Gateway อย่าเปิดพอร์ต
สาธารณะ `/metrics` แยกต่างหาก หรือ reverse-proxy path ที่ไม่ผ่านการยืนยันตัวตน ดู
[Prometheus metrics](/th/gateway/prometheus)

### การตรวจสอบสถานะ

endpoint สำหรับ probe คอนเทนเนอร์ (ไม่ต้องยืนยันตัวตน):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

อิมเมจ Docker มี `HEALTHCHECK` ในตัวที่ ping `/healthz`
หากการตรวจสอบล้มเหลวต่อเนื่อง Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy` และ
ระบบ orchestration สามารถรีสตาร์ทหรือแทนที่ได้

สแนปช็อตสุขภาพเชิงลึกแบบยืนยันตัวตน:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงโฮสต์ไปยัง
`http://127.0.0.1:18789` ทำงานร่วมกับการเผยแพร่พอร์ต Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์ของโฮสต์และ CLI ของโฮสต์เข้าถึงพอร์ต Gateway ที่เผยแพร่ได้
- `loopback`: เฉพาะโปรเซสภายใน namespace เครือข่ายของคอนเทนเนอร์เท่านั้นที่เข้าถึง
  Gateway ได้โดยตรง

<Note>
ใช้ค่าโหมด bind ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่นามแฝงโฮสต์อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### Provider ภายในโฮสต์

เมื่อ OpenClaw รันใน Docker, `127.0.0.1` ภายในคอนเทนเนอร์หมายถึงตัวคอนเทนเนอร์เอง
ไม่ใช่เครื่องโฮสต์ของคุณ ใช้ `host.docker.internal` สำหรับ provider AI ที่
รันบนโฮสต์:

| Provider  | URL เริ่มต้นของโฮสต์       | URL สำหรับการตั้งค่า Docker        |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่า Docker ที่บันเดิลไว้ใช้ URL โฮสต์เหล่านั้นเป็นค่าเริ่มต้น onboarding
ของ LM Studio และ Ollama และ `docker-compose.yml` จะแมป `host.docker.internal`
ไปยัง Gateway ของโฮสต์ Docker สำหรับ Linux Docker Engine ส่วน Docker Desktop
มี hostname เดียวกันนี้ให้อยู่แล้วบน macOS และ Windows

บริการบนโฮสต์ต้องฟังบนที่อยู่ที่ Docker เข้าถึงได้ด้วย:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

หากคุณใช้ไฟล์ Compose หรือคำสั่ง `docker run` ของคุณเอง ให้เพิ่มการแมปโฮสต์
แบบเดียวกันด้วยตัวเอง เช่น
`--add-host=host.docker.internal:host-gateway`

### Bonjour / mDNS

เครือข่าย Docker bridge มักไม่ส่งต่อ multicast ของ Bonjour/mDNS
(`224.0.0.251:5353`) ได้อย่างน่าเชื่อถือ ดังนั้นการตั้งค่า Compose ที่บันเดิลไว้จึงตั้งค่าเริ่มต้น
`OPENCLAW_DISABLE_BONJOUR=1` เพื่อให้ Gateway ไม่ crash-loop หรือเริ่มประกาศซ้ำ ๆ
เมื่อ bridge ทิ้งทราฟฟิก multicast

ใช้ URL Gateway ที่เผยแพร่ไว้, Tailscale หรือ DNS-SD แบบ wide-area สำหรับโฮสต์ Docker
ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วย host networking, macvlan
หรือเครือข่ายอื่นที่ทราบว่า mDNS multicast ทำงานได้

สำหรับข้อควรระวังและการแก้ปัญหา ดู [การค้นพบ Bonjour](/th/gateway/bonjour)

### พื้นที่จัดเก็บและการคงอยู่

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw` และ
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` ดังนั้นพาธเหล่านั้น
จึงคงอยู่หลังการแทนที่คอนเทนเนอร์ เมื่อไม่ได้ตั้งค่าตัวแปรใดตัวแปรหนึ่ง
`docker-compose.yml` ที่บันเดิลไว้จะ fallback ไปที่ `${HOME}/.openclaw` (และ
`${HOME}/.openclaw/workspace` สำหรับ workspace mount) หรือ `/tmp/.openclaw`
เมื่อ `HOME` เองก็หายไปด้วย วิธีนี้ป้องกันไม่ให้ `docker compose up`
ส่งออก volume spec ที่มี source ว่างในสภาพแวดล้อมเปล่า

ไดเรกทอรีคอนฟิกที่เมานต์นั้นคือที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับคอนฟิกพฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับการยืนยันตัวตน OAuth/API-key ของ provider ที่จัดเก็บไว้
- `.env` สำหรับ secret รันไทม์ที่อิง env เช่น `OPENCLAW_GATEWAY_TOKEN`

Plugin ที่ติดตั้งแบบดาวน์โหลดได้จะเก็บสถานะแพ็กเกจไว้ใต้ OpenClaw home ที่เมานต์
ดังนั้นบันทึกการติดตั้ง Plugin และ package roots จึงคงอยู่หลังการแทนที่คอนเทนเนอร์
การเริ่มต้น Gateway จะไม่สร้าง dependency trees ของ Plugin ที่บันเดิลไว้

สำหรับรายละเอียดการคงอยู่ทั้งหมดบนการปรับใช้ VM ดู
[Docker VM Runtime - สิ่งใดคงอยู่ที่ไหน](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่มีการเติบโตของดิสก์สูง:** คอยตรวจดู `media/`, ไฟล์ JSONL ของเซสชัน,
`cron/runs/*.jsonl`, รากแพ็กเกจ Plugin ที่ติดตั้งแล้ว และไฟล์บันทึกแบบหมุนเวียน
ภายใต้ `/tmp/openclaw/`.

### ตัวช่วย Shell (ไม่บังคับ)

เพื่อให้จัดการ Docker ประจำวันได้ง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จากพาธดิบเก่า `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้ง เพื่อให้ไฟล์ตัวช่วยภายในเครื่องติดตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` ฯลฯ รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดู [ClawDock](/th/install/clawdock) สำหรับคู่มือตัวช่วยฉบับเต็ม

<AccordionGroup>
  <Accordion title="เปิดใช้งาน sandbox ของเอเจนต์สำหรับ Docker gateway">
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

    สคริปต์จะเมานต์ `docker.sock` เฉพาะหลังจากข้อกำหนดเบื้องต้นของ sandbox ผ่านแล้วเท่านั้น หาก
    การตั้งค่า sandbox ทำไม่สำเร็จ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    เป็น `off`

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ / CI (ไม่โต้ตอบ)">
    ปิดใช้งานการจัดสรร pseudo-TTY ของ Compose ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="หมายเหตุความปลอดภัยของเครือข่ายที่ใช้ร่วมกัน">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` เพื่อให้คำสั่ง
    CLI เข้าถึง gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความไว้วางใจที่ใช้ร่วมกัน
    การตั้งค่า compose จะตัด `NET_RAW`/`NET_ADMIN` และเปิดใช้
    `no-new-privileges` บน `openclaw-cli`
  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    อิมเมจรันเป็น `node` (uid 1000) หากคุณเห็นข้อผิดพลาดเรื่องสิทธิ์บน
    `/home/node/.openclaw` ให้ตรวจสอบว่า bind mount ของโฮสต์เป็นของ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="การ rebuild ที่เร็วขึ้น">
    จัดลำดับ Dockerfile ของคุณเพื่อให้เลเยอร์ dependency ถูกแคช วิธีนี้จะเลี่ยงการรัน
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
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยเป็นอันดับแรกและรันเป็น `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์ที่มี
    คุณสมบัติครบกว่า:

    1. **คงอยู่ของ `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง dependency ของระบบ**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ติดตั้งเบราว์เซอร์ Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **คงอยู่ของการดาวน์โหลดเบราว์เซอร์**: ตั้งค่า
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` และใช้
       `OPENCLAW_HOME_VOLUME` หรือ `OPENCLAW_EXTRA_MOUNTS`

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบไม่มีหน้าจอ)">
    หากคุณเลือก OpenAI Codex OAuth ในวิซาร์ด ระบบจะเปิด URL ของเบราว์เซอร์ ใน
    Docker หรือการตั้งค่าแบบไม่มีหน้าจอ ให้คัดลอก URL redirect แบบเต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปในวิซาร์ดเพื่อทำการยืนยันตัวตนให้เสร็จ
  </Accordion>

  <Accordion title="เมตาดาต้าอิมเมจฐาน">
    อิมเมจ runtime หลักของ Docker ใช้ `node:24-bookworm-slim` และเผยแพร่ annotation ของ OCI
    สำหรับอิมเมจฐาน รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และอื่น ๆ digest ของอิมเมจฐาน Node จะถูก
    รีเฟรชผ่าน PR ของ Dependabot สำหรับอิมเมจฐาน Docker; build สำหรับ release จะไม่รัน
    เลเยอร์อัปเกรด distro ดู
    [annotation ของอิมเมจ OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### กำลังรันบน VPS ใช่ไหม

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอนการ deploy VM ที่ใช้ร่วมกัน
รวมถึงการฝัง binary, persistence และการอัปเดต

## sandbox ของเอเจนต์

เมื่อเปิดใช้ `agents.defaults.sandbox` ด้วย backend ของ Docker, gateway
จะรันการเรียกใช้เครื่องมือของเอเจนต์ (shell, การอ่าน/เขียนไฟล์ ฯลฯ) ภายในคอนเทนเนอร์ Docker
ที่แยกออกจากกัน ขณะที่ gateway เองยังอยู่บนโฮสต์ วิธีนี้ให้กำแพงกั้นที่แข็งแรง
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือมีผู้เช่าหลายราย โดยไม่ต้องทำให้ gateway ทั้งหมด
อยู่ในคอนเทนเนอร์

ขอบเขต sandbox สามารถเป็นต่อเอเจนต์ (ค่าเริ่มต้น), ต่อเซสชัน หรือใช้ร่วมกันได้ แต่ละขอบเขต
จะมี workspace ของตัวเองที่เมานต์ไว้ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบายอนุญาต/ปฏิเสธเครื่องมือ, การแยกเครือข่าย, ขีดจำกัดทรัพยากร และคอนเทนเนอร์
เบราว์เซอร์ได้

สำหรับการกำหนดค่าฉบับเต็ม อิมเมจ หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ ดู:

- [Sandboxing](/th/gateway/sandboxing) -- เอกสารอ้างอิง sandbox ฉบับสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึง shell แบบโต้ตอบไปยังคอนเทนเนอร์ sandbox
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

สร้างอิมเมจ sandbox เริ่มต้น (จาก source checkout):

```bash
scripts/sandbox-setup.sh
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout ดู [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="อิมเมจหายไปหรือคอนเทนเนอร์ sandbox ไม่เริ่มทำงาน">
    สร้างอิมเมจ sandbox ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) หรือคำสั่ง `docker build` แบบ inline จาก [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup) (ติดตั้ง npm),
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็นอิมเมจแบบกำหนดเองของคุณ
    คอนเทนเนอร์จะถูกสร้างอัตโนมัติต่อเซสชันเมื่อมีความต้องการ
  </Accordion>

  <Accordion title="ข้อผิดพลาดเรื่องสิทธิ์ใน sandbox">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับ ownership ของ workspace ที่เมานต์ไว้
    หรือ chown โฟลเดอร์ workspace
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือแบบกำหนดเองใน sandbox">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่ง source
    `/etc/profile` และอาจรีเซ็ต PATH ตั้งค่า `docker.env.PATH` เพื่อเติมพาธ
    เครื่องมือแบบกำหนดเองของคุณไว้ข้างหน้า หรือเพิ่มสคริปต์ไว้ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM-killed ระหว่าง build อิมเมจ (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ใช้ machine class ที่ใหญ่ขึ้นแล้วลองอีกครั้ง
  </Accordion>

  <Accordion title="ไม่ได้รับอนุญาตหรือต้อง pairing ใน Control UI">
    ดึงลิงก์ dashboard ใหม่และอนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    รายละเอียดเพิ่มเติม: [Dashboard](/th/web/dashboard), [Devices](/th/cli/devices)

  </Accordion>

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือข้อผิดพลาด pairing จาก Docker CLI">
    รีเซ็ตโหมด gateway และ bind:

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
- [การอัปเดต](/th/install/updating) — การทำให้ OpenClaw ทันสมัยอยู่เสมอ
- [การกำหนดค่า](/th/gateway/configuration) — การกำหนดค่า gateway หลังการติดตั้ง
