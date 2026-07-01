---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์แทนการติดตั้งภายในเครื่อง
    - คุณกำลังตรวจสอบยืนยันโฟลว์ Docker
summary: การตั้งค่าและการเริ่มใช้งาน OpenClaw แบบใช้ Docker ที่เป็นทางเลือก
title: Docker
x-i18n:
    generated_at: "2026-07-01T13:27:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker เป็น **ตัวเลือก** ใช้เฉพาะเมื่อคุณต้องการ gateway แบบคอนเทนเนอร์ หรือต้องการตรวจสอบความถูกต้องของ flow Docker

## Docker เหมาะกับฉันหรือไม่?

- **ใช่**: คุณต้องการสภาพแวดล้อม gateway ที่แยกขาดและทิ้งได้ หรือรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งในเครื่อง
- **ไม่**: คุณกำลังรันบนเครื่องของคุณเอง และต้องการ dev loop ที่เร็วที่สุด ให้ใช้ flow การติดตั้งปกติแทน
- **หมายเหตุเรื่อง sandboxing**: sandbox backend เริ่มต้นใช้ Docker เมื่อเปิดใช้ sandboxing แต่ sandboxing ปิดไว้โดยค่าเริ่มต้น และ **ไม่** จำเป็นต้องรัน gateway ทั้งหมดใน Docker นอกจากนี้ยังมี sandbox backend แบบ SSH และ OpenShell ให้ใช้ด้วย ดู [Sandboxing](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการ build image (`pnpm install` อาจถูก OOM-killed บนโฮสต์ 1 GB พร้อม exit 137)
- พื้นที่ดิสก์เพียงพอสำหรับ image และ log
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ
  [การเสริมความปลอดภัยสำหรับการเปิดให้เข้าถึงผ่านเครือข่าย](/th/gateway/security)
  โดยเฉพาะนโยบาย firewall ของ Docker `DOCKER-USER`

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="Build image">
    จาก root ของ repo ให้รันสคริปต์ตั้งค่า:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะ build gateway image ในเครื่อง หากต้องการใช้ image ที่ build ไว้ล่วงหน้าแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    image ที่ build ไว้ล่วงหน้าจะถูกเผยแพร่ก่อนที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    GHCR เป็น registry หลักสำหรับ release automation, deployment แบบตรึงเวอร์ชัน,
    และการตรวจสอบ provenance release workflow เดียวกันยังเผยแพร่ mirror อย่างเป็นทางการบน
    Docker Hub ที่ `openclaw/openclaw` สำหรับโฮสต์ที่ต้องการใช้ Docker Hub ด้วย:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    ใช้ `ghcr.io/openclaw/openclaw` หรือ `openclaw/openclaw` หลีกเลี่ยง mirror
    Docker Hub จากชุมชน เพราะ OpenClaw ไม่ได้ควบคุมเวลา release,
    การ rebuild, หรือนโยบาย retention ของ mirror เหล่านั้น tag ทางการที่พบบ่อย: `main`, `latest`,
    `<version>` (เช่น `2026.2.26`) และเวอร์ชัน beta เช่น
    `2026.2.26-beta.1` tag beta จะไม่เลื่อน `latest` หรือ `main`

  </Step>

  <Step title="รันซ้ำแบบ airgapped">
    บนโฮสต์ offline ให้ถ่ายโอนและโหลด image ก่อน:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` จะตรวจสอบว่า `OPENCLAW_IMAGE` มีอยู่ในเครื่องแล้ว ปิด
    Compose pull และ build แบบอัตโนมัติ จากนั้นรัน flow ตั้งค่าปกติ เช่น
    การซิงค์ `.env`, การแก้ permission, onboarding, การซิงค์ config ของ gateway,
    และการเริ่มต้น Compose

    หาก `OPENCLAW_SANDBOX=1` การตั้งค่า offline จะตรวจสอบ default ที่กำหนดค่าไว้
    และ sandbox image ต่อ agent ที่กำลังใช้งานบน daemon หลัง
    `OPENCLAW_DOCKER_SOCKET` ด้วย image สำหรับ browser ที่ใช้ Docker เป็น backend ต้องมี
    label สัญญา browser ปัจจุบันของ OpenClaw ด้วย เมื่อ image ที่จำเป็นขาดหายหรือ
    เข้ากันไม่ได้ setup จะออกโดยไม่เปลี่ยนการกำหนดค่า sandbox แทนที่จะ
    รายงานว่าสำเร็จพร้อม sandbox ที่ใช้งานไม่ได้

  </Step>

  <Step title="ทำ onboarding ให้เสร็จ">
    สคริปต์ setup จะรัน onboarding โดยอัตโนมัติ โดยจะ:

    - แจ้งให้กรอก provider API key
    - สร้าง gateway token และเขียนลง `.env`
    - สร้างไดเรกทอรี secret key ของ auth-profile
    - เริ่ม gateway ผ่าน Docker Compose

    ระหว่าง setup การ onboarding ก่อนเริ่มต้นและการเขียน config จะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` ใช้สำหรับคำสั่งที่คุณรันหลังจาก
    มี gateway container แล้ว

  </Step>

  <Step title="เปิด Control UI">
    เปิด `http://127.0.0.1:18789/` ใน browser ของคุณ แล้ววาง shared secret
    ที่กำหนดค่าไว้ใน Settings สคริปต์ setup จะเขียน token ลง `.env` โดย
    ค่าเริ่มต้น หากคุณเปลี่ยน config ของ container ไปใช้ password auth ให้ใช้
    password นั้นแทน

    ต้องการ URL อีกครั้งหรือไม่?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="กำหนดค่า channel (ไม่บังคับ)">
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

### Flow แบบ manual

หากคุณต้องการรันแต่ละขั้นตอนเองแทนการใช้สคริปต์ setup:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
รัน `docker compose` จาก root ของ repo หากคุณเปิดใช้ `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ setup จะเขียน `docker-compose.extra.yml`;
ให้ include หลังไฟล์ override มาตรฐานใดๆ เช่น
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
เมื่อมีไฟล์ override ทั้งสองไฟล์
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้ network namespace ร่วมกับ `openclaw-gateway` จึงเป็น
เครื่องมือหลังเริ่มต้น ก่อน `docker compose up -d openclaw-gateway` ให้รัน onboarding
และการเขียน config ช่วง setup ผ่าน `openclaw-gateway` พร้อม
`--no-deps --entrypoint node`
</Note>

### Environment variable

สคริปต์ setup รับ environment variable แบบไม่บังคับต่อไปนี้:

| Variable                                        | วัตถุประสงค์                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | ใช้ remote image แทนการ build ในเครื่อง                        |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | ติดตั้ง apt package เพิ่มเติมระหว่าง build (คั่นด้วย space)             |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | ติดตั้ง Python package เพิ่มเติมระหว่าง build (คั่นด้วย space)          |
| `OPENCLAW_EXTENSIONS`                           | ติดตั้ง dependency ของ plugin ล่วงหน้าในช่วง build (ชื่อคั่นด้วย space) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | override ตัวเลือก Node สำหรับ source-build ในเครื่อง                          |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | override heap ของ tsdown สำหรับ source-build ในเครื่อง หน่วย MB                     |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | ข้าม declaration output ระหว่างการ build local image สำหรับ runtime เท่านั้น        |
| `OPENCLAW_EXTRA_MOUNTS`                         | host bind mount เพิ่มเติม (`source:target[:opts]` คั่นด้วย comma)       |
| `OPENCLAW_HOME_VOLUME`                          | คงอยู่ `/home/node` ใน Docker volume แบบมีชื่อ                         |
| `OPENCLAW_SANDBOX`                              | เลือกใช้ sandbox bootstrap (`1`, `true`, `yes`, `on`)                |
| `OPENCLAW_SKIP_ONBOARDING`                      | ข้ามขั้นตอน onboarding แบบ interactive (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`                        | override path ของ Docker socket                                           |
| `OPENCLAW_DISABLE_BONJOUR`                      | ปิดการโฆษณา Bonjour/mDNS (ค่าเริ่มต้นเป็น `1` สำหรับ Docker)         |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | ปิด bundled plugin source bind-mount overlay                     |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | endpoint ของ OTLP/HTTP collector ที่ใช้ร่วมกันสำหรับ OpenTelemetry export          |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | endpoint ของ OTLP เฉพาะ signal สำหรับ trace, metric, หรือ log           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | override โปรโตคอล OTLP ปัจจุบันรองรับเฉพาะ `http/protobuf`       |
| `OTEL_SERVICE_NAME`                             | ชื่อ service ที่ใช้สำหรับ OpenTelemetry resource                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | เลือกใช้ semantic attribute ของ GenAI รุ่นทดลองล่าสุด               |
| `OPENCLAW_OTEL_PRELOADED`                       | ข้ามการเริ่ม OpenTelemetry SDK ตัวที่สองเมื่อมีตัวหนึ่ง preload อยู่        |

Docker image อย่างเป็นทางการไม่ได้รวม Homebrew มาด้วย ระหว่าง onboarding OpenClaw
จะซ่อนตัวติดตั้ง dependency ของ skill ที่ใช้ได้เฉพาะ brew เมื่อกำลังรันใน Linux
container ที่ไม่มี `brew`; dependency เหล่านั้นต้องจัดเตรียมด้วย custom image
หรือติดตั้งเอง สำหรับ dependency ที่มีจาก Debian package ให้ใช้
`OPENCLAW_IMAGE_APT_PACKAGES` ระหว่าง build image ชื่อเดิม
`OPENCLAW_DOCKER_APT_PACKAGES` ยังยอมรับอยู่
สำหรับ dependency ของ Python ให้ใช้ `OPENCLAW_IMAGE_PIP_PACKAGES` ค่านี้จะรัน
`python3 -m pip install --break-system-packages` ระหว่าง build image ดังนั้นให้ pin
เวอร์ชัน package และใช้เฉพาะ package index ที่คุณเชื่อถือ
source build ตั้งค่าเริ่มต้น `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` เป็น
`--max-old-space-size=8192` และปล่อย
`OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` ว่างไว้ เพื่อให้ wrapper ของ tsdown
เคารพขีดจำกัดหน่วยความจำของ container และยังตั้งค่าเริ่มต้น
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1` เพราะ runtime image จะตัดไฟล์ declaration
ออกหลัง build หาก Docker รายงาน `ResourceExhausted`, `cannot allocate
memory`, หรือ abort ระหว่าง `tsdown` ให้เพิ่มขีดจำกัดหน่วยความจำของ Docker builder หรือ
ลองใหม่ด้วย heap ที่ระบุให้เล็กลง เช่น
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`

Maintainer สามารถทดสอบ bundled plugin source กับ packaged image ได้โดย mount
ไดเรกทอรี source ของ plugin หนึ่งตัวทับ path source ที่ package ไว้ เช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ไดเรกทอรี source ที่ mount นั้นจะ override bundle ที่ compile แล้วซึ่งตรงกันใน
`/app/dist/extensions/synology-chat` สำหรับ plugin id เดียวกัน

### Observability

OpenTelemetry export เป็นการส่งออกจาก Gateway container ไปยัง OTLP
collector ของคุณ ไม่จำเป็นต้องเผยแพร่ Docker port หากคุณ build image
ในเครื่องและต้องการให้ exporter ของ OpenTelemetry ที่ bundled ไว้พร้อมใช้งานภายใน image
ให้ include runtime dependency ของมัน:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ติดตั้ง Plugin ทางการ `@openclaw/diagnostics-otel` จาก ClawHub ใน
การติดตั้ง Docker แบบ packaged ก่อนเปิดใช้ export custom source-built image ยังสามารถ
include source ของ plugin ในเครื่องด้วย
`OPENCLAW_EXTENSIONS=diagnostics-otel` ได้ หากต้องการเปิดใช้ export ให้ allow และ enable
Plugin `diagnostics-otel` ใน config จากนั้นตั้งค่า
`diagnostics.otel.enabled=true` หรือใช้ตัวอย่าง config ใน [OpenTelemetry
export](/th/gateway/opentelemetry) header สำหรับ auth ของ collector จะกำหนดค่าผ่าน
`diagnostics.otel.headers` ไม่ใช่ผ่าน environment variable ของ Docker

metric ของ Prometheus ใช้ Gateway port ที่เผยแพร่อยู่แล้ว ติดตั้ง
`clawhub:@openclaw/diagnostics-prometheus`, enable Plugin
`diagnostics-prometheus` จากนั้น scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

route นี้ได้รับการป้องกันด้วยการยืนยันตัวตนของ Gateway อย่าเปิดเผย port
`/metrics` สาธารณะแยกต่างหาก หรือ path reverse-proxy ที่ไม่ต้องยืนยันตัวตน ดู
[metric ของ Prometheus](/th/gateway/prometheus)

### Health check

endpoint สำหรับ probe container (ไม่ต้องใช้ auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

อิมเมจ Docker มี `HEALTHCHECK` ในตัวที่ ping ไปยัง `/healthz`
หากการตรวจสอบยังคงล้มเหลว Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy` และ
ระบบ orchestration สามารถรีสตาร์ทหรือแทนที่คอนเทนเนอร์นั้นได้

สแนปช็อตสุขภาพเชิงลึกแบบยืนยันตัวตนแล้ว:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` ใช้งานได้กับการเผยแพร่พอร์ตของ Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์บนโฮสต์และ CLI บนโฮสต์สามารถเข้าถึงพอร์ต Gateway ที่เผยแพร่ไว้ได้
- `loopback`: เฉพาะโปรเซสภายใน namespace เครือข่ายของคอนเทนเนอร์เท่านั้นที่สามารถเข้าถึง
  Gateway ได้โดยตรง

<Note>
ใช้ค่าโหมด bind ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่ alias ของโฮสต์ เช่น `0.0.0.0` หรือ `127.0.0.1`
</Note>

### ผู้ให้บริการภายในโฮสต์

เมื่อ OpenClaw ทำงานใน Docker, `127.0.0.1` ภายในคอนเทนเนอร์คือคอนเทนเนอร์
เอง ไม่ใช่เครื่องโฮสต์ของคุณ ใช้ `host.docker.internal` สำหรับผู้ให้บริการ AI ที่
ทำงานบนโฮสต์:

| ผู้ให้บริการ | URL เริ่มต้นของโฮสต์ | URL สำหรับตั้งค่า Docker |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่า Docker ที่มาพร้อมกันใช้ URL ของโฮสต์เหล่านั้นเป็นค่าเริ่มต้นในการ onboarding
ของ LM Studio และ Ollama และ `docker-compose.yml` จะ map `host.docker.internal` ไปยัง
host gateway ของ Docker สำหรับ Linux Docker Engine ส่วน Docker Desktop มี
hostname เดียวกันนี้ให้แล้วบน macOS และ Windows

บริการบนโฮสต์ต้อง listen บนที่อยู่ที่ Docker เข้าถึงได้ด้วย:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

หากคุณใช้ไฟล์ Compose หรือคำสั่ง `docker run` ของคุณเอง ให้เพิ่ม host
mapping เดียวกันด้วยตัวเอง ตัวอย่างเช่น
`--add-host=host.docker.internal:host-gateway`

### แบ็กเอนด์ Claude CLI ใน Docker

อิมเมจ Docker อย่างเป็นทางการของ OpenClaw ไม่ได้ติดตั้ง Claude Code มาให้ล่วงหน้า ติดตั้งและ
เข้าสู่ระบบ Claude Code ภายในผู้ใช้ของคอนเทนเนอร์ที่รัน OpenClaw จากนั้นทำให้
home ของคอนเทนเนอร์นั้นคงอยู่ถาวร เพื่อให้การอัปเกรดอิมเมจไม่ลบไบนารีหรือสถานะ auth ของ Claude

สำหรับการติดตั้ง Docker ใหม่ ให้เปิดใช้ volume ถาวรของ `/home/node` ก่อนรัน
setup:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

สำหรับการติดตั้ง Docker ที่มีอยู่แล้ว ให้หยุด stack ก่อนและโหลดค่า Docker `.env`
ปัจจุบันอีกครั้งก่อนรัน setup ซ้ำ สคริปต์ setup จะไม่อ่าน
`.env` เอง; สคริปต์จะเขียน `.env` ใหม่จาก shell ปัจจุบันและค่าเริ่มต้น สำหรับ
`.env` ที่สร้างขึ้น ให้รัน:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

หาก `.env` ของคุณมีค่าที่ shell ของคุณ source ไม่ได้ ให้ re-export
ค่าที่มีอยู่ซึ่งคุณพึ่งพาด้วยตนเองก่อน เช่น `OPENCLAW_IMAGE`, พอร์ต, โหมด bind,
พาธกำหนดเอง, `OPENCLAW_EXTRA_MOUNTS`, sandbox และการตั้งค่า skip-onboarding
overlay ที่สร้างขึ้นจะ mount home volume ให้ทั้ง `openclaw-gateway` และ
`openclaw-cli`

รันคำสั่งที่เหลือด้วย Compose overlay ที่สร้างขึ้น เพื่อให้ทั้งสองบริการ
mount home ที่คงอยู่ถาวร หากการตั้งค่าของคุณใช้ `docker-compose.override.yml` ด้วย
ให้รวมไฟล์นั้นก่อน `docker-compose.extra.yml`

ติดตั้ง Claude Code ใน home ถาวรนั้น:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

ตัวติดตั้ง native จะเขียนไบนารี `claude` ไว้ใต้
`/home/node/.local/bin/claude` บอก OpenClaw ให้ใช้พาธในคอนเทนเนอร์นั้น:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

เข้าสู่ระบบและตรวจสอบจากภายใน home ของคอนเทนเนอร์ถาวรเดียวกัน:

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

หลังจากนั้น คุณสามารถใช้แบ็กเอนด์ `claude-cli` ที่มาพร้อมกันได้:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` ทำให้การติดตั้ง native Claude Code คงอยู่ถาวรใต้
`/home/node/.local/bin` และ `/home/node/.local/share/claude` รวมถึงการตั้งค่า
และสถานะ auth ของ Claude Code ใต้ `/home/node/.claude` และ `/home/node/.claude.json`
การทำให้เฉพาะ `/home/node/.openclaw` คงอยู่ถาวรไม่เพียงพอสำหรับการนำ Claude CLI กลับมาใช้ซ้ำ หาก
คุณใช้ `OPENCLAW_EXTRA_MOUNTS` แทน home volume ให้ mount พาธ Claude เหล่านั้นทั้งหมด
เข้าไปในบริการ Docker ทั้งสองตัว

<Note>
สำหรับ automation การผลิตที่ใช้ร่วมกันหรือการคิดค่าบริการ Anthropic ที่คาดการณ์ได้ ให้เลือกใช้
เส้นทางคีย์ API ของ Anthropic การนำ Claude CLI กลับมาใช้ซ้ำจะเป็นไปตามเวอร์ชันที่ติดตั้งของ Claude Code,
การเข้าสู่ระบบบัญชี, การคิดค่าบริการ และพฤติกรรมการอัปเดต
</Note>

### Bonjour / mDNS

โดยปกติ Docker bridge networking จะไม่ส่งต่อ multicast ของ Bonjour/mDNS
(`224.0.0.251:5353`) อย่างน่าเชื่อถือ ดังนั้นการตั้งค่า Compose ที่มาพร้อมกันจึงตั้งค่าเริ่มต้น
`OPENCLAW_DISABLE_BONJOUR=1` เพื่อไม่ให้ Gateway crash-loop หรือเริ่ม
ประกาศซ้ำ ๆ เมื่อ bridge ทิ้งทราฟฟิก multicast

ใช้ URL ของ Gateway ที่เผยแพร่ไว้, Tailscale หรือ wide-area DNS-SD สำหรับโฮสต์ Docker
ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วย host networking, macvlan,
หรือเครือข่ายอื่นที่ทราบว่า mDNS multicast ใช้งานได้

สำหรับข้อควรระวังและการแก้ไขปัญหา ดู [การค้นพบ Bonjour](/th/gateway/bonjour)

### ที่เก็บข้อมูลและการคงอยู่ถาวร

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` และ
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` ไปยัง `/home/node/.config/openclaw` เพื่อให้
พาธเหล่านั้นอยู่รอดหลังการแทนที่คอนเทนเนอร์ เมื่อไม่ได้ตั้งค่าตัวแปรใด ๆ ไว้
`docker-compose.yml` ที่มาพร้อมกันจะ fallback ไปใต้ `${HOME}` หรือ `/tmp` เมื่อ `HOME` เองก็
ไม่มีอยู่เช่นกัน วิธีนี้ทำให้ `docker compose up` ไม่ปล่อย volume spec ที่มี source ว่าง
ในสภาพแวดล้อมเปล่า

ไดเรกทอรี config ที่ mount นั้นคือที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับ config พฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับ OAuth/API-key auth ของผู้ให้บริการที่จัดเก็บไว้
- `.env` สำหรับ secret runtime ที่อ้างอิง env เช่น `OPENCLAW_GATEWAY_TOKEN`

ไดเรกทอรีคีย์ลับของ auth-profile เก็บคีย์เข้ารหัสภายในเครื่องที่ใช้สำหรับ
วัสดุ token ของ auth profile ที่อ้างอิง OAuth เก็บไว้กับสถานะโฮสต์ Docker ของคุณ
แต่แยกจาก `OPENCLAW_CONFIG_DIR`

Plugin ที่ดาวน์โหลดมาติดตั้งจะเก็บสถานะแพ็กเกจไว้ใต้ home ของ OpenClaw ที่ mount ไว้
ดังนั้นบันทึกการติดตั้ง Plugin และรากแพ็กเกจจะอยู่รอดหลังการแทนที่คอนเทนเนอร์
การเริ่มต้น Gateway จะไม่สร้าง dependency tree ของ bundled-plugin

สำหรับรายละเอียดการคงอยู่ถาวรทั้งหมดบนการ deploy แบบ VM ดู
[Docker VM Runtime - สิ่งใดคงอยู่ที่ใด](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ดิสก์โตเร็ว:** เฝ้าดู `media/`, ไฟล์ JSONL ของ session, ฐานข้อมูลสถานะ
SQLite ที่ใช้ร่วมกัน, รากแพ็กเกจของ Plugin ที่ติดตั้ง และ rolling file logs
ใต้ `/tmp/openclaw/`

### ตัวช่วย shell (ไม่บังคับ)

เพื่อให้จัดการ Docker ในแต่ละวันได้ง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จาก raw path เก่า `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้งเพื่อให้ไฟล์ตัวช่วยในเครื่องของคุณติดตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` เป็นต้น รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดู [ClawDock](/th/install/clawdock) สำหรับคู่มือตัวช่วยฉบับเต็ม

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    พาธ socket กำหนดเอง (เช่น rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    สคริปต์จะ mount `docker.sock` เฉพาะหลังจากข้อกำหนดเบื้องต้นของ sandbox ผ่านแล้ว หาก
    การตั้งค่า sandbox ทำให้เสร็จไม่ได้ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    เป็น `off` รอบ code-mode ของ Codex ยังคงถูกจำกัดไว้ที่ Codex
    `workspace-write` ขณะที่ sandbox ของ OpenClaw เปิดใช้งานอยู่; อย่า mount
    host Docker socket เข้าไปในคอนเทนเนอร์ sandbox ของ agent

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    ปิดการจัดสรร pseudo-TTY ของ Compose ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` เพื่อให้คำสั่ง CLI
    เข้าถึง Gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็น trust boundary ที่ใช้ร่วมกัน
    config ของ compose จะ drop `NET_RAW`/`NET_ADMIN` และเปิดใช้
    `no-new-privileges` ทั้งบน `openclaw-gateway` และ `openclaw-cli`
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    การตั้งค่า Docker Desktop บางแบบทำให้การ lookup DNS จาก sidecar
    `openclaw-cli` แบบ shared-network ล้มเหลวหลังจาก drop `NET_RAW` ซึ่งจะแสดงเป็น
    `EAI_AGAIN` ระหว่างคำสั่งที่อ้างอิง npm เช่น `openclaw plugins install`
    ใช้ไฟล์ compose แบบ hardened ค่าเริ่มต้นสำหรับการทำงานปกติของ Gateway ต่อไป
    override ในเครื่องด้านล่างจะผ่อนคลาย posture ด้านความปลอดภัยของคอนเทนเนอร์ CLI โดย
    กู้คืน capability ค่าเริ่มต้นของ Docker ดังนั้นให้ใช้เฉพาะกับคำสั่ง CLI แบบครั้งเดียว
    ที่ต้องเข้าถึง registry ของแพ็กเกจ ไม่ใช่เป็นการเรียก Compose ค่าเริ่มต้นของคุณ:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    หากคุณสร้างคอนเทนเนอร์ `openclaw-cli` ที่ทำงานยาวไว้แล้ว ให้สร้างใหม่
    ด้วย override เดียวกัน `docker compose exec` และ `docker exec` ไม่สามารถ
    เปลี่ยน Linux capabilities บนคอนเทนเนอร์ที่สร้างไว้แล้วได้

  </Accordion>

  <Accordion title="Permissions and EACCES">
    อิมเมจทำงานเป็น `node` (uid 1000) หากคุณเห็นข้อผิดพลาดสิทธิ์บน
    `/home/node/.openclaw` ให้ตรวจสอบว่า bind mounts บนโฮสต์ของคุณเป็นของ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    ความไม่ตรงกันแบบเดียวกันอาจแสดงเป็นคำเตือน Plugin เช่น
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    ตามด้วย `plugin present but blocked` ซึ่งหมายความว่า process uid และเจ้าของ
    ไดเรกทอรี Plugin ที่ mount ไว้ไม่ตรงกัน แนะนำให้รันคอนเทนเนอร์เป็น
    uid 1000 ค่าเริ่มต้นและแก้ ownership ของ bind mount ใช้ chown
    `/path/to/openclaw-config/npm` เป็น `root:root` เฉพาะเมื่อคุณตั้งใจรัน
    OpenClaw เป็น root ในระยะยาวเท่านั้น

  </Accordion>

  <Accordion title="Faster rebuilds">
    จัดลำดับ Dockerfile ของคุณเพื่อให้ layer ของ dependency ถูก cache วิธีนี้หลีกเลี่ยงการรัน
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
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยเป็นอันดับแรก และทำงานเป็น `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์ที่มี
    ความสามารถครบถ้วนมากขึ้น:

    1. **คงอยู่ `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง system deps**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **ฝัง Python deps**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **ฝัง Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **หรือติดตั้งเบราว์เซอร์ Playwright ลงในวอลุ่มที่คงอยู่**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **คงอยู่การดาวน์โหลดเบราว์เซอร์**: ใช้ `OPENCLAW_HOME_VOLUME` หรือ
       `OPENCLAW_EXTRA_MOUNTS` OpenClaw ตรวจพบ Chromium ที่ Docker image
       จัดการผ่าน Playwright บน Linux โดยอัตโนมัติ

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบไม่มีหน้าจอ)">
    หากคุณเลือก OpenAI Codex OAuth ในวิซาร์ด ระบบจะเปิด URL ของเบราว์เซอร์ ใน
    Docker หรือการตั้งค่าแบบไม่มีหน้าจอ ให้คัดลอก URL เปลี่ยนเส้นทางแบบเต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปในวิซาร์ดเพื่อดำเนินการยืนยันตัวตนให้เสร็จ
  </Accordion>

  <Accordion title="เมทาดาทาอิมเมจฐาน">
    อิมเมจรันไทม์ Docker หลักใช้ `node:24-bookworm-slim` และรวม `tini` เป็นกระบวนการ init ของ entrypoint (PID 1) เพื่อให้แน่ใจว่าโปรเซสซอมบี้ถูกเก็บกวาด และสัญญาณถูกจัดการอย่างถูกต้องในคอนเทนเนอร์ที่ทำงานระยะยาว อิมเมจเผยแพร่คำกำกับอิมเมจฐาน OCI รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และรายการอื่น ๆ digest ฐานของ Node จะถูก
    รีเฟรชผ่าน PR อิมเมจฐาน Docker ของ Dependabot; บิลด์รีลีสจะไม่รัน
    เลเยอร์อัปเกรดดิสโทร ดู
    [คำกำกับอิมเมจ OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### กำลังรันบน VPS?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[รันไทม์ VM Docker](/th/install/docker-vm-runtime) สำหรับขั้นตอนการปรับใช้ VM ร่วมกัน
รวมถึงการฝังไบนารี การคงอยู่ และการอัปเดต

## แซนด์บ็อกซ์ของเอเจนต์

เมื่อเปิดใช้ `agents.defaults.sandbox` กับแบ็กเอนด์ Docker, gateway
จะรันการดำเนินการเครื่องมือของเอเจนต์ (shell, การอ่าน/เขียนไฟล์ ฯลฯ) ภายในคอนเทนเนอร์ Docker
ที่แยกออกมา ขณะที่ gateway เองยังคงอยู่บนโฮสต์ สิ่งนี้ให้กำแพงกั้นที่แข็งแรง
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือมีผู้เช่าหลายราย โดยไม่ต้องทำให้ gateway ทั้งหมด
อยู่ในคอนเทนเนอร์

ขอบเขตแซนด์บ็อกซ์สามารถเป็นต่อเอเจนต์ (ค่าเริ่มต้น), ต่อเซสชัน หรือแชร์ร่วมกัน แต่ละขอบเขต
จะมีเวิร์กสเปซของตนเองที่เมานต์ไว้ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบายอนุญาต/ปฏิเสธเครื่องมือ การแยกเครือข่าย ขีดจำกัดทรัพยากร และคอนเทนเนอร์
เบราว์เซอร์ได้

สำหรับการกำหนดค่าแบบเต็ม อิมเมจ หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ โปรดดู:

- [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing) -- เอกสารอ้างอิงแซนด์บ็อกซ์ฉบับสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึง shell แบบโต้ตอบไปยังคอนเทนเนอร์แซนด์บ็อกซ์
- [แซนด์บ็อกซ์และเครื่องมือหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- การแทนที่ค่าต่อเอเจนต์

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

สำหรับการติดตั้ง npm ที่ไม่มี source checkout ให้ดู [การทำแซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบฝังในเอกสาร

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="อิมเมจหายไปหรือคอนเทนเนอร์แซนด์บ็อกซ์ไม่เริ่มทำงาน">
    สร้างอิมเมจแซนด์บ็อกซ์ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (source checkout) หรือคำสั่ง `docker build` แบบฝังในเอกสารจาก [การทำแซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) (การติดตั้ง npm),
    หรือกำหนด `agents.defaults.sandbox.docker.image` เป็นอิมเมจที่กำหนดเองของคุณ
    คอนเทนเนอร์จะถูกสร้างอัตโนมัติต่อเซสชันเมื่อมีความต้องการใช้งาน
  </Accordion>

  <Accordion title="ข้อผิดพลาดสิทธิ์ในแซนด์บ็อกซ์">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับความเป็นเจ้าของเวิร์กสเปซที่เมานต์ไว้ของคุณ
    หรือ chown โฟลเดอร์เวิร์กสเปซ
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือกำหนดเองในแซนด์บ็อกซ์">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่งจะอ่านค่า
    `/etc/profile` และอาจรีเซ็ต PATH ตั้งค่า `docker.env.PATH` เพื่อเติมพาธเครื่องมือ
    กำหนดเองของคุณไว้ข้างหน้า หรือเพิ่มสคริปต์ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM-killed ระหว่างสร้างอิมเมจ (exit 137)">
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

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือเกิดข้อผิดพลาดการจับคู่จาก Docker CLI">
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
- [ClawDock](/th/install/clawdock) — การตั้งค่าชุมชนด้วย Docker Compose
- [การอัปเดต](/th/install/updating) — ทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ
- [การกำหนดค่า](/th/gateway/configuration) — การกำหนดค่า gateway หลังติดตั้ง
