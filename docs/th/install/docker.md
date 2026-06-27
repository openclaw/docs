---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์แทนการติดตั้งในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของขั้นตอน Docker
summary: การตั้งค่าและการเริ่มต้นใช้งานแบบ Docker ที่เป็นตัวเลือกสำหรับ OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-27T17:43:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker เป็นสิ่งที่**ไม่บังคับ** ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบคอนเทนเนอร์ หรือต้องการตรวจสอบความถูกต้องของขั้นตอน Docker

## Docker เหมาะกับฉันหรือไม่?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway ที่แยกโดดเดี่ยวและทิ้งได้ หรือรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งในเครื่อง
- **ไม่**: คุณกำลังรันบนเครื่องของคุณเองและต้องการวงจรพัฒนาที่เร็วที่สุดเท่านั้น ให้ใช้ขั้นตอนติดตั้งปกติแทน
- **หมายเหตุเรื่อง Sandboxing**: แบ็กเอนด์ sandbox เริ่มต้นใช้ Docker เมื่อเปิดใช้ sandboxing แต่ sandboxing ปิดอยู่ตามค่าเริ่มต้น และ**ไม่**จำเป็นต้องรัน Gateway ทั้งหมดใน Docker นอกจากนี้ยังมีแบ็กเอนด์ sandbox แบบ SSH และ OpenShell ให้ใช้ด้วย ดู [Sandboxing](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการสร้างอิมเมจ (`pnpm install` อาจถูก OOM-killed บนโฮสต์ 1 GB พร้อมรหัสออก 137)
- พื้นที่ดิสก์เพียงพอสำหรับอิมเมจและบันทึก
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจทาน
  [การเสริมความปลอดภัยสำหรับการเปิดเผยบนเครือข่าย](/th/gateway/security),
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

    อิมเมจที่สร้างไว้ล่วงหน้าเผยแพร่ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    แท็กที่พบบ่อย: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="รันซ้ำแบบ airgapped">
    บนโฮสต์ออฟไลน์ ให้ถ่ายโอนและโหลดอิมเมจก่อน:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` ตรวจสอบว่า `OPENCLAW_IMAGE` มีอยู่ในเครื่องแล้ว ปิดใช้งาน
    การ pull และ build โดยนัยของ Compose แล้วรันขั้นตอนตั้งค่าปกติ เช่น
    การซิงโครไนซ์ `.env`, การแก้ไขสิทธิ์, onboarding, การซิงก์การกำหนดค่า Gateway,
    และการเริ่มต้น Compose

    หาก `OPENCLAW_SANDBOX=1` การตั้งค่าแบบออฟไลน์จะตรวจสอบอิมเมจ sandbox เริ่มต้น
    ที่กำหนดค่าไว้และอิมเมจ sandbox ราย agent ที่ใช้งานอยู่บน daemon เบื้องหลัง
    `OPENCLAW_DOCKER_SOCKET` ด้วย อิมเมจเบราว์เซอร์ที่รองรับด้วย Docker ต้องมี
    ป้ายกำกับสัญญาเบราว์เซอร์ OpenClaw ปัจจุบันด้วย เมื่ออิมเมจที่จำเป็นขาดหายหรือ
    เข้ากันไม่ได้ การตั้งค่าจะออกโดยไม่เปลี่ยนการกำหนดค่า sandbox แทนที่จะ
    รายงานว่าสำเร็จพร้อม sandbox ที่ใช้งานไม่ได้

  </Step>

  <Step title="ทำ onboarding ให้เสร็จ">
    สคริปต์ตั้งค่าจะรัน onboarding โดยอัตโนมัติ โดยจะ:

    - ถาม provider API keys
    - สร้างโทเค็น Gateway และเขียนลงใน `.env`
    - สร้างไดเรกทอรีคีย์ลับของ auth-profile
    - เริ่ม Gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า onboarding ก่อนเริ่มและการเขียน config จะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` มีไว้สำหรับคำสั่งที่คุณรันหลังจาก
    คอนเทนเนอร์ Gateway มีอยู่แล้ว

  </Step>

  <Step title="เปิด Control UI">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ของคุณ แล้ววาง shared secret
    ที่กำหนดค่าไว้ใน Settings สคริปต์ตั้งค่าจะเขียนโทเค็นลงใน `.env` ตามค่าเริ่มต้น;
    หากคุณเปลี่ยน config ของคอนเทนเนอร์ไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้
    รหัสผ่านนั้นแทน

    ต้องการ URL อีกครั้งหรือไม่?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="กำหนดค่า channels (ไม่บังคับ)">
    ใช้คอนเทนเนอร์ CLI เพื่อเพิ่มช่องทางข้อความ:

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
รัน `docker compose` จากรากของ repo หากคุณเปิดใช้ `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ตั้งค่าจะเขียน `docker-compose.extra.yml`;
ให้รวมไฟล์นี้หลังไฟล์ override มาตรฐานใด ๆ เช่น
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
เมื่อมีไฟล์ override ทั้งสองอยู่
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้ namespace เครือข่ายร่วมกับ `openclaw-gateway`
จึงเป็นเครื่องมือหลังเริ่ม ก่อน `docker compose up -d openclaw-gateway` ให้รัน onboarding
และการเขียน config ระหว่างตั้งค่าผ่าน `openclaw-gateway` ด้วย
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ตั้งค่ารองรับตัวแปรสภาพแวดล้อมที่ไม่บังคับเหล่านี้:

| ตัวแปร                                   | วัตถุประสงค์                                                               |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ใช้อิมเมจระยะไกลแทนการสร้างในเครื่อง                        |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่าง build (คั่นด้วยช่องว่าง)             |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | ติดตั้งแพ็กเกจ Python เพิ่มเติมระหว่าง build (คั่นด้วยช่องว่าง)          |
| `OPENCLAW_EXTENSIONS`                      | ติดตั้ง dependencies ของ plugin ล่วงหน้าในเวลา build (ชื่อคั่นด้วยช่องว่าง) |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mounts ของโฮสต์เพิ่มเติม (คั่นด้วยจุลภาค `source:target[:opts]`)       |
| `OPENCLAW_HOME_VOLUME`                     | เก็บ `/home/node` ไว้ถาวรใน Docker volume ที่ตั้งชื่อไว้                         |
| `OPENCLAW_SANDBOX`                         | เลือกใช้การ bootstrap sandbox (`1`, `true`, `yes`, `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                 | ข้ามขั้นตอน onboarding แบบโต้ตอบ (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`                   | แทนที่พาธ Docker socket                                           |
| `OPENCLAW_DISABLE_BONJOUR`                 | ปิดใช้งานการโฆษณา Bonjour/mDNS (ค่าเริ่มต้นเป็น `1` สำหรับ Docker)         |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | ปิดใช้งาน overlays แบบ bind-mount ของซอร์ส plugin ที่ bundled                     |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint ตัวรวบรวม OTLP/HTTP ร่วมสำหรับการ export OpenTelemetry          |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpoint OTLP เฉพาะสัญญาณสำหรับ traces, metrics หรือ logs           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | การแทนที่โปรโตคอล OTLP ปัจจุบันรองรับเฉพาะ `http/protobuf`       |
| `OTEL_SERVICE_NAME`                        | ชื่อบริการที่ใช้สำหรับทรัพยากร OpenTelemetry                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | เลือกใช้แอตทริบิวต์ semantic GenAI รุ่นทดลองล่าสุด               |
| `OPENCLAW_OTEL_PRELOADED`                  | ข้ามการเริ่ม OpenTelemetry SDK ตัวที่สองเมื่อมีตัวหนึ่ง preloaded อยู่        |

อิมเมจ Docker อย่างเป็นทางการไม่ได้มาพร้อม Homebrew ระหว่าง onboarding OpenClaw
จะซ่อนตัวติดตั้ง dependencies ของ skill ที่มีเฉพาะ brew เมื่อรันในคอนเทนเนอร์ Linux
ที่ไม่มี `brew`; dependencies เหล่านั้นต้องจัดเตรียมโดยอิมเมจ custom หรือ
ติดตั้งด้วยตนเอง สำหรับ dependencies ที่มีจากแพ็กเกจ Debian ให้ใช้
`OPENCLAW_IMAGE_APT_PACKAGES` ระหว่างการสร้างอิมเมจ ชื่อ legacy
`OPENCLAW_DOCKER_APT_PACKAGES` ยังรองรับอยู่
สำหรับ dependencies ของ Python ให้ใช้ `OPENCLAW_IMAGE_PIP_PACKAGES` คำสั่งนี้รัน
`python3 -m pip install --break-system-packages` ระหว่างการสร้างอิมเมจ ดังนั้นให้ pin
เวอร์ชันแพ็กเกจและใช้เฉพาะดัชนีแพ็กเกจที่คุณเชื่อถือ

ผู้ดูแลสามารถทดสอบซอร์ส plugin ที่ bundled กับอิมเมจที่แพ็กเกจแล้วได้โดย mount
ไดเรกทอรีซอร์สของ plugin หนึ่งรายการทับพาธซอร์สที่แพ็กเกจไว้ ตัวอย่างเช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ไดเรกทอรีซอร์สที่ mount นั้นจะแทนที่ bundle ที่คอมไพล์แล้วที่ตรงกัน
`/app/dist/extensions/synology-chat` สำหรับ plugin id เดียวกัน

### Observability

การ export OpenTelemetry เป็นขาออกจากคอนเทนเนอร์ Gateway ไปยังตัวรวบรวม OTLP
ของคุณ ไม่จำเป็นต้องมีพอร์ต Docker ที่เผยแพร่ หากคุณสร้างอิมเมจในเครื่อง
และต้องการให้ตัว export OpenTelemetry ที่ bundled พร้อมใช้งานภายในอิมเมจ
ให้รวม runtime dependencies ของมัน:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ติดตั้ง Plugin อย่างเป็นทางการ `@openclaw/diagnostics-otel` จาก ClawHub ใน
การติดตั้ง Docker แบบแพ็กเกจก่อนเปิดใช้การ export อิมเมจ custom ที่สร้างจากซอร์สยังสามารถ
รวมซอร์ส plugin ในเครื่องด้วย
`OPENCLAW_EXTENSIONS=diagnostics-otel` ได้ หากต้องการเปิดใช้การ export ให้อนุญาตและเปิดใช้
Plugin `diagnostics-otel` ใน config จากนั้นตั้งค่า
`diagnostics.otel.enabled=true` หรือใช้ตัวอย่าง config ใน [การ export OpenTelemetry
](/th/gateway/opentelemetry) ส่วนหัว auth ของตัวรวบรวมกำหนดค่าผ่าน
`diagnostics.otel.headers` ไม่ใช่ผ่านตัวแปรสภาพแวดล้อม Docker

metrics ของ Prometheus ใช้พอร์ต Gateway ที่เผยแพร่อยู่แล้ว ติดตั้ง
`clawhub:@openclaw/diagnostics-prometheus`, เปิดใช้ Plugin
`diagnostics-prometheus` แล้ว scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

เส้นทางนี้ได้รับการป้องกันด้วยการยืนยันตัวตนของ Gateway อย่าเปิดเผยพอร์ต
`/metrics` สาธารณะแยกต่างหาก หรือพาธ reverse-proxy ที่ไม่ต้องยืนยันตัวตน ดู
[metrics ของ Prometheus](/th/gateway/prometheus)

### Health checks

endpoint ตรวจสอบคอนเทนเนอร์ (ไม่ต้องมี auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

อิมเมจ Docker มี `HEALTHCHECK` ในตัวที่ ping `/healthz`
หากการตรวจสอบยังล้มเหลว Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy` และ
ระบบ orchestration สามารถรีสตาร์ทหรือแทนที่คอนเทนเนอร์ได้

snapshot สุขภาพเชิงลึกที่ต้องยืนยันตัวตน:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` ทำงานกับการเผยแพร่พอร์ตของ Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์บนโฮสต์และ CLI บนโฮสต์สามารถเข้าถึงพอร์ต Gateway ที่เผยแพร่ได้
- `loopback`: เฉพาะกระบวนการภายใน namespace เครือข่ายของคอนเทนเนอร์เท่านั้นที่เข้าถึง
  Gateway ได้โดยตรง

<Note>
ใช้ค่าของโหมด bind ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่นามแฝงโฮสต์อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### Providers ในเครื่องของโฮสต์

เมื่อ OpenClaw รันใน Docker, `127.0.0.1` ภายในคอนเทนเนอร์คือคอนเทนเนอร์
เอง ไม่ใช่เครื่องโฮสต์ของคุณ ใช้ `host.docker.internal` สำหรับ provider AI ที่
รันบนโฮสต์:

| Provider  | URL เริ่มต้นบนโฮสต์         | URL สำหรับการตั้งค่า Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่า Docker ที่ bundled ใช้ URL โฮสต์เหล่านั้นเป็นค่าเริ่มต้น onboarding ของ LM Studio และ Ollama
และ `docker-compose.yml` map `host.docker.internal` ไปยัง
Gateway ของโฮสต์ Docker สำหรับ Linux Docker Engine ส่วน Docker Desktop มี
hostname เดียวกันให้อยู่แล้วบน macOS และ Windows

บริการบนโฮสต์ต้อง listen บนที่อยู่ที่ Docker เข้าถึงได้ด้วย:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

หากคุณใช้ไฟล์ Compose หรือคำสั่ง `docker run` ของคุณเอง ให้เพิ่ม host
mapping เดียวกันด้วยตนเอง เช่น
`--add-host=host.docker.internal:host-gateway`.

### แบ็กเอนด์ Claude CLI ใน Docker

อิมเมจ Docker อย่างเป็นทางการของ OpenClaw ไม่ได้ติดตั้ง Claude Code ไว้ล่วงหน้า ให้ติดตั้งและ
เข้าสู่ระบบ Claude Code ภายในผู้ใช้ของคอนเทนเนอร์ที่รัน OpenClaw จากนั้นคงอยู่
home ของคอนเทนเนอร์นั้นไว้ เพื่อไม่ให้การอัปเกรดอิมเมจลบไบนารีหรือสถานะการยืนยันตัวตน Claude

สำหรับการติดตั้ง Docker ใหม่ ให้เปิดใช้ volume `/home/node` แบบคงอยู่ก่อนรัน
setup:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

สำหรับการติดตั้ง Docker ที่มีอยู่แล้ว ให้หยุด stack ก่อน แล้วโหลดค่า
Docker `.env` ปัจจุบันอีกครั้งก่อนรัน setup ซ้ำ สคริปต์ setup ไม่ได้อ่าน
`.env` เอง แต่จะเขียน `.env` ใหม่จาก shell ปัจจุบันและค่าเริ่มต้น สำหรับ
`.env` ที่สร้างขึ้น ให้รัน:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

หาก `.env` ของคุณมีค่าที่ shell ของคุณ source ไม่ได้ ให้ re-export
ค่าที่มีอยู่ซึ่งคุณต้องพึ่งพาด้วยตนเองก่อน เช่น `OPENCLAW_IMAGE`, พอร์ต, โหมด bind,
พาธที่กำหนดเอง, `OPENCLAW_EXTRA_MOUNTS`, sandbox และการตั้งค่า skip-onboarding
overlay ที่สร้างขึ้นจะ mount home volume สำหรับทั้ง `openclaw-gateway` และ
`openclaw-cli`

รันคำสั่งที่เหลือด้วย Compose overlay ที่สร้างขึ้น เพื่อให้ทั้งสองบริการ
mount home ที่คงอยู่ หาก setup ของคุณใช้ `docker-compose.override.yml` ด้วย
ให้รวมไว้ก่อน `docker-compose.extra.yml`

ติดตั้ง Claude Code ใน home ที่คงอยู่นั้น:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

ตัวติดตั้ง native จะเขียนไบนารี `claude` ไว้ใต้
`/home/node/.local/bin/claude` แจ้งให้ OpenClaw ใช้พาธคอนเทนเนอร์นั้น:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

เข้าสู่ระบบและตรวจสอบจากภายใน home ของคอนเทนเนอร์แบบคงอยู่เดียวกัน:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

หลังจากนั้น คุณสามารถใช้แบ็กเอนด์ `claude-cli` ที่มาพร้อมชุดได้:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` ทำให้การติดตั้ง Claude Code แบบ native คงอยู่ใต้
`/home/node/.local/bin` และ `/home/node/.local/share/claude` รวมถึงการตั้งค่า Claude Code
และสถานะการยืนยันตัวตนใต้ `/home/node/.claude` และ `/home/node/.claude.json`
การคงอยู่เฉพาะ `/home/node/.openclaw` ไม่เพียงพอสำหรับการใช้ Claude CLI ซ้ำ หาก
คุณใช้ `OPENCLAW_EXTRA_MOUNTS` แทน home volume ให้ mount พาธ Claude ทั้งหมดเหล่านั้น
เข้าไปในทั้งสองบริการ Docker

<Note>
สำหรับ automation production ที่ใช้ร่วมกัน หรือการเรียกเก็บเงิน Anthropic ที่คาดการณ์ได้ ให้เลือกใช้
เส้นทาง API key ของ Anthropic การใช้ Claude CLI ซ้ำจะเป็นไปตาม
เวอร์ชัน Claude Code ที่ติดตั้งไว้, การเข้าสู่ระบบบัญชี, การเรียกเก็บเงิน และพฤติกรรมการอัปเดต
</Note>

### Bonjour / mDNS

โดยปกติ Docker bridge networking จะไม่ forward multicast ของ Bonjour/mDNS
(`224.0.0.251:5353`) ได้อย่างเชื่อถือได้ ดังนั้น setup Compose ที่มาพร้อมชุดจึงตั้งค่าเริ่มต้น
`OPENCLAW_DISABLE_BONJOUR=1` เพื่อไม่ให้ Gateway crash-loop หรือเริ่ม advertising ซ้ำๆ
เมื่อ bridge ทิ้งทราฟฟิก multicast

ใช้ URL ของ Gateway ที่เผยแพร่แล้ว, Tailscale หรือ wide-area DNS-SD สำหรับโฮสต์ Docker
ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วย host networking, macvlan
หรือเครือข่ายอื่นที่ทราบว่า multicast mDNS ทำงานได้

สำหรับข้อควรระวังและการแก้ปัญหา ดู [การค้นพบ Bonjour](/th/gateway/bonjour)

### พื้นที่จัดเก็บและการคงอยู่

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` ไปที่ `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` ไปที่ `/home/node/.openclaw/workspace` และ
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` ไปที่ `/home/node/.config/openclaw` ดังนั้น
พาธเหล่านั้นจะคงอยู่หลังการแทนที่คอนเทนเนอร์ เมื่อไม่ได้ตั้งค่าตัวแปรใดไว้ `docker-compose.yml`
ที่มาพร้อมชุดจะ fallback ไปใต้ `${HOME}` หรือ `/tmp` เมื่อ `HOME` เองก็
ไม่มีอยู่เช่นกัน ซึ่งช่วยป้องกันไม่ให้ `docker compose up` ส่งออก spec ของ volume
ที่มี source ว่างในสภาพแวดล้อมเปล่า

ไดเรกทอรี config ที่ mount นั้นคือที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับ config พฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับการยืนยันตัวตน OAuth/API key ของ provider ที่จัดเก็บไว้
- `.env` สำหรับ runtime secrets ที่ backed ด้วย env เช่น `OPENCLAW_GATEWAY_TOKEN`

ไดเรกทอรีคีย์ลับ auth-profile จัดเก็บคีย์เข้ารหัสในเครื่องที่ใช้สำหรับ
วัสดุ token ของ auth profile ที่ backed ด้วย OAuth เก็บไว้ร่วมกับสถานะโฮสต์ Docker ของคุณ
แต่แยกจาก `OPENCLAW_CONFIG_DIR`

Plugin ที่ดาวน์โหลดได้ซึ่งติดตั้งแล้วจะเก็บสถานะ package ของตนไว้ใต้ home ของ OpenClaw ที่ mount ไว้
ดังนั้น record การติดตั้ง Plugin และ root ของ package จะคงอยู่หลังการแทนที่คอนเทนเนอร์
การเริ่มต้น Gateway ไม่ได้สร้าง dependency tree ของ bundled-plugin

สำหรับรายละเอียดการคงอยู่แบบเต็มในการปรับใช้ VM ดู
[Docker VM Runtime - สิ่งใดคงอยู่ที่ใด](/th/install/docker-vm-runtime#what-persists-where)

  **จุดที่ดิสก์มีแนวโน้มโตเร็ว:** เฝ้าดู `media/`, ไฟล์ JSONL ของเซสชัน, ฐานข้อมูลสถานะ SQLite แบบใช้ร่วมกัน, รากแพ็กเกจ Plugin ที่ติดตั้งแล้ว และล็อกไฟล์แบบหมุนเวียนภายใต้ `/tmp/openclaw/`

  ### ตัวช่วย Shell (ไม่บังคับ)

  เพื่อให้จัดการ Docker ในแต่ละวันได้ง่ายขึ้น ให้ติดตั้ง `ClawDock`:

  ```bash
  mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
  echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
  ```

  หากคุณติดตั้ง ClawDock จากพาธ raw เดิม `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้ง เพื่อให้ไฟล์ตัวช่วยในเครื่องของคุณตามตำแหน่งใหม่

  จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` เป็นต้น รัน
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
    เป็น `off` เทิร์น code-mode ของ Codex ยังคงถูกจำกัดให้อยู่ใน Codex
    `workspace-write` ขณะที่ sandbox ของ OpenClaw ทำงานอยู่ อย่าเมานต์
    socket Docker ของโฮสต์เข้าไปในคอนเทนเนอร์ sandbox ของเอเจนต์

  </Accordion>

  <Accordion title="Automation / CI (แบบไม่โต้ตอบ)">
    ปิดการจัดสรร pseudo-TTY ของ Compose ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="หมายเหตุด้านความปลอดภัยของเครือข่ายที่ใช้ร่วมกัน">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` เพื่อให้คำสั่ง CLI
    เข้าถึง gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความไว้วางใจร่วมกัน
    config ของ compose จะตัด `NET_RAW`/`NET_ADMIN` และเปิดใช้
    `no-new-privileges` ทั้งบน `openclaw-gateway` และ `openclaw-cli`
  </Accordion>

  <Accordion title="ความล้มเหลว DNS ของ Docker Desktop ใน openclaw-cli">
    การตั้งค่า Docker Desktop บางแบบค้นหา DNS จาก sidecar
    `openclaw-cli` บนเครือข่ายที่ใช้ร่วมกันไม่สำเร็จหลังจากตัด `NET_RAW` ซึ่งจะแสดงเป็น
    `EAI_AGAIN` ระหว่างคำสั่งที่พึ่งพา npm เช่น `openclaw plugins install`
    ให้ใช้ไฟล์ compose แบบเสริมความแข็งแกร่งตามค่าเริ่มต้นสำหรับการทำงานของ gateway ตามปกติ
    override ในเครื่องด้านล่างจะผ่อนคลาย posture ด้านความปลอดภัยของคอนเทนเนอร์ CLI โดย
    คืนค่า capabilities เริ่มต้นของ Docker ดังนั้นให้ใช้เฉพาะกับคำสั่ง CLI แบบครั้งเดียว
    ที่ต้องเข้าถึง package registry ไม่ใช่ใช้เป็นคำสั่ง Compose เริ่มต้นของคุณ:

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
    เปลี่ยน Linux capabilities บนคอนเทนเนอร์ที่สร้างไว้แล้วได้

  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    อิมเมจรันเป็น `node` (uid 1000) หากคุณเห็นข้อผิดพลาดด้านสิทธิ์บน
    `/home/node/.openclaw` ให้ตรวจสอบว่า bind mount บนโฮสต์ของคุณมีเจ้าของเป็น uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    ความไม่ตรงกันแบบเดียวกันอาจแสดงเป็นคำเตือนของ Plugin เช่น
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    ตามด้วย `plugin present but blocked` นั่นหมายความว่า uid ของโปรเซสและเจ้าของไดเรกทอรี Plugin
    ที่เมานต์อยู่ไม่ตรงกัน ควรรันคอนเทนเนอร์ด้วย uid 1000 ตามค่าเริ่มต้นและแก้ไขเจ้าของของ bind mount
    ให้ถูกต้อง chown
    `/path/to/openclaw-config/npm` เป็น `root:root` เฉพาะเมื่อคุณตั้งใจรัน
    OpenClaw เป็น root ในระยะยาวเท่านั้น

  </Accordion>

  <Accordion title="การ rebuild ที่เร็วขึ้น">
    จัดลำดับ Dockerfile ของคุณเพื่อให้เลเยอร์ dependency ถูกแคช วิธีนี้ช่วยเลี่ยงการรัน
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
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อน และรันเป็น `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์ที่
    มีความสามารถครบถ้วนยิ่งขึ้น:

    1. **คงอยู่ของ `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง system deps ลงอิมเมจ**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **ฝัง Python deps ลงอิมเมจ**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **ฝัง Playwright Chromium ลงอิมเมจ**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **หรือติดตั้งเบราว์เซอร์ Playwright ลงใน volume ที่คงอยู่**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **คงอยู่ของการดาวน์โหลดเบราว์เซอร์**: ใช้ `OPENCLAW_HOME_VOLUME` หรือ
       `OPENCLAW_EXTRA_MOUNTS` OpenClaw ตรวจจับ Chromium ที่จัดการโดย Playwright
       ของอิมเมจ Docker บน Linux โดยอัตโนมัติ

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบ headless)">
    หากคุณเลือก OpenAI Codex OAuth ในวิซาร์ด ระบบจะเปิด URL ของเบราว์เซอร์ ใน
    Docker หรือการตั้งค่าแบบ headless ให้คัดลอก URL redirect แบบเต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปในวิซาร์ดเพื่อทำ auth ให้เสร็จ
  </Accordion>

  <Accordion title="ข้อมูลเมตาของอิมเมจฐาน">
    อิมเมจรันไทม์ Docker หลักใช้ `node:24-bookworm-slim` และรวม `tini` เป็นกระบวนการ init ของ entrypoint (PID 1) เพื่อให้แน่ใจว่ากระบวนการซอมบี้ถูกเก็บกวาดและสัญญาณถูกจัดการอย่างถูกต้องในคอนเทนเนอร์ที่รันระยะยาว อิมเมจนี้เผยแพร่คำอธิบายประกอบอิมเมจฐาน OCI รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และรายการอื่นๆ digest ฐานของ Node จะถูก
    รีเฟรชผ่าน PR อิมเมจฐาน Docker ของ Dependabot; บิลด์สำหรับรีลีสจะไม่รัน
    เลเยอร์อัปเกรดดิสโทร ดู
    [คำอธิบายประกอบอิมเมจ OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### รันบน VPS?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[รันไทม์ Docker VM](/th/install/docker-vm-runtime) สำหรับขั้นตอนการปรับใช้ VM ร่วม
รวมถึงการอบไบนารี การคงอยู่ของข้อมูล และการอัปเดต

## แซนด์บ็อกซ์ของเอเจนต์

เมื่อเปิดใช้ `agents.defaults.sandbox` ด้วยแบ็กเอนด์ Docker, gateway
จะรันการดำเนินการเครื่องมือของเอเจนต์ (shell, การอ่าน/เขียนไฟล์ ฯลฯ) ภายในคอนเทนเนอร์ Docker
ที่แยกไว้ ในขณะที่ gateway เองยังอยู่บนโฮสต์ วิธีนี้ให้กำแพงกั้นที่แข็งแรง
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือมีผู้เช่าหลายราย โดยไม่ต้องทำให้ทั้ง
gateway อยู่ในคอนเทนเนอร์

ขอบเขตของแซนด์บ็อกซ์สามารถเป็นรายเอเจนต์ (ค่าเริ่มต้น), รายเซสชัน หรือแบบใช้ร่วมกันได้ แต่ละขอบเขต
จะมีเวิร์กสเปซของตัวเองที่เมานต์ไว้ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบายอนุญาต/ปฏิเสธเครื่องมือ การแยกเครือข่าย ขีดจำกัดทรัพยากร และคอนเทนเนอร์เบราว์เซอร์ได้

สำหรับการกำหนดค่าฉบับเต็ม อิมเมจ หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ ดู:

- [แซนด์บ็อกซ์](/th/gateway/sandboxing) -- เอกสารอ้างอิงแซนด์บ็อกซ์ฉบับครบถ้วน
- [OpenShell](/th/gateway/openshell) -- การเข้าถึง shell แบบโต้ตอบไปยังคอนเทนเนอร์แซนด์บ็อกซ์
- [แซนด์บ็อกซ์และเครื่องมือหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- การกำหนดทับรายเอเจนต์

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

สร้างอิมเมจแซนด์บ็อกซ์เริ่มต้น (จาก source checkout):

```bash
scripts/sandbox-setup.sh
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout โปรดดู [แซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีอิมเมจหรือคอนเทนเนอร์แซนด์บ็อกซ์ไม่เริ่มทำงาน">
    สร้างอิมเมจแซนด์บ็อกซ์ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) หรือคำสั่ง `docker build` แบบ inline จาก [แซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) (ติดตั้ง npm),
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็นอิมเมจที่กำหนดเองของคุณ
    คอนเทนเนอร์จะถูกสร้างอัตโนมัติตามเซสชันเมื่อมีความต้องการใช้งาน
  </Accordion>

  <Accordion title="ข้อผิดพลาดสิทธิ์ในแซนด์บ็อกซ์">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับ ownership ของเวิร์กสเปซที่เมานต์ไว้ของคุณ
    หรือ chown โฟลเดอร์เวิร์กสเปซ
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือที่กำหนดเองในแซนด์บ็อกซ์">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่งจะโหลด
    `/etc/profile` และอาจรีเซ็ต PATH ตั้งค่า `docker.env.PATH` เพื่อเติม path
    ของเครื่องมือที่กำหนดเองไว้ข้างหน้า หรือเพิ่มสคริปต์ไว้ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM-killed ระหว่างการสร้างอิมเมจ (ออกด้วยรหัส 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ใช้คลาสเครื่องที่ใหญ่ขึ้นแล้วลองใหม่
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

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือมีข้อผิดพลาดการจับคู่จาก Docker CLI">
    รีเซ็ตโหมดและการ bind ของ gateway:

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
- [การอัปเดต](/th/install/updating) — การทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ
- [การกำหนดค่า](/th/gateway/configuration) — การกำหนดค่า gateway หลังติดตั้ง
