---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์แทนการติดตั้งภายในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของโฟลว์ Docker
summary: การตั้งค่าและการเริ่มต้นใช้งาน OpenClaw แบบใช้ Docker ที่เป็นตัวเลือก
title: Docker
x-i18n:
    generated_at: "2026-06-28T20:43:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker เป็น **ตัวเลือกเสริม** ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบคอนเทนเนอร์ หรือต้องการตรวจสอบโฟลว์ Docker

## Docker เหมาะกับฉันไหม?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway ที่แยกขาดและทิ้งได้ หรือต้องการรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งภายในเครื่อง
- **ไม่**: คุณกำลังรันบนเครื่องของคุณเองและต้องการลูปการพัฒนาที่เร็วที่สุด ใช้โฟลว์การติดตั้งปกติแทน
- **หมายเหตุเรื่อง Sandbox**: แบ็กเอนด์ Sandbox เริ่มต้นใช้ Docker เมื่อเปิดใช้ Sandbox แต่ Sandbox ปิดอยู่โดยค่าเริ่มต้นและ **ไม่** ต้องให้ Gateway ทั้งหมดรันใน Docker นอกจากนี้ยังมีแบ็กเอนด์ Sandbox แบบ SSH และ OpenShell ดู [Sandboxing](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการสร้างอิมเมจ (`pnpm install` อาจถูกฆ่าด้วย OOM บนโฮสต์ 1 GB พร้อมรหัสออก 137)
- พื้นที่ดิสก์เพียงพอสำหรับอิมเมจและล็อก
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ
  [การเสริมความปลอดภัยสำหรับการเปิดให้เข้าถึงผ่านเครือข่าย](/th/gateway/security),
  โดยเฉพาะนโยบายไฟร์วอลล์ Docker `DOCKER-USER`

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="Build the image">
    จากรูทของ repo ให้รันสคริปต์ตั้งค่า:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะสร้างอิมเมจ Gateway ภายในเครื่อง หากต้องการใช้อิมเมจที่สร้างไว้ล่วงหน้าแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    อิมเมจที่สร้างไว้ล่วงหน้าจะเผยแพร่ไปยัง
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) ก่อน
    GHCR เป็น registry หลักสำหรับระบบอัตโนมัติของรีลีส การดีพลอยแบบตรึงเวอร์ชัน
    และการตรวจสอบแหล่งที่มา เวิร์กโฟลว์รีลีสเดียวกันยังเผยแพร่มิเรอร์ Docker Hub อย่างเป็นทางการที่ `openclaw/openclaw` สำหรับโฮสต์ที่ต้องการ Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    ใช้ `ghcr.io/openclaw/openclaw` หรือ `openclaw/openclaw` หลีกเลี่ยงมิเรอร์ Docker Hub จากชุมชน
    เพราะ OpenClaw ไม่ได้ควบคุมจังหวะรีลีส การสร้างใหม่ หรือนโยบายการเก็บรักษาของมิเรอร์เหล่านั้น
    แท็กทางการที่พบบ่อย: `main`, `latest`,
    `<version>` (เช่น `2026.2.26`) และเวอร์ชัน beta เช่น
    `2026.2.26-beta.1` แท็ก beta จะไม่ขยับ `latest` หรือ `main`

  </Step>

  <Step title="Airgapped rerun">
    บนโฮสต์ออฟไลน์ ให้ถ่ายโอนและโหลดอิมเมจก่อน:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` ตรวจสอบว่า `OPENCLAW_IMAGE` มีอยู่ภายในเครื่องแล้ว ปิดการ pull และ build ของ Compose แบบแฝง
    จากนั้นรันโฟลว์ตั้งค่าปกติ เช่น การซิงค์ `.env` การแก้สิทธิ์ การ onboarding การซิงค์ค่า config ของ Gateway
    และการเริ่มต้น Compose

    หาก `OPENCLAW_SANDBOX=1` การตั้งค่าแบบออฟไลน์จะตรวจสอบอิมเมจ Sandbox เริ่มต้นที่กำหนดค่าไว้
    และอิมเมจ Sandbox ต่อเอเจนต์ที่ใช้งานอยู่บน daemon หลัง
    `OPENCLAW_DOCKER_SOCKET` ด้วย อิมเมจเบราว์เซอร์ที่ใช้ Docker เป็นแบ็กเอนด์ต้องมีป้ายกำกับสัญญาเบราว์เซอร์ OpenClaw ปัจจุบันด้วย
    เมื่ออิมเมจที่จำเป็นขาดหายหรือเข้ากันไม่ได้ การตั้งค่าจะออกโดยไม่เปลี่ยนค่า config ของ Sandbox
    แทนที่จะรายงานว่าสำเร็จพร้อม Sandbox ที่ใช้งานไม่ได้

  </Step>

  <Step title="Complete onboarding">
    สคริปต์ตั้งค่าจะรัน onboarding โดยอัตโนมัติ โดยจะ:

    - ขอ provider API keys
    - สร้างโทเค็น Gateway และเขียนลงใน `.env`
    - สร้างไดเรกทอรีคีย์ลับ auth-profile
    - เริ่ม Gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า onboarding ก่อนเริ่มและการเขียน config จะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` มีไว้สำหรับคำสั่งที่คุณรันหลังจากคอนเทนเนอร์ Gateway มีอยู่แล้ว

  </Step>

  <Step title="Open the Control UI">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์และวาง shared secret ที่กำหนดค่าไว้ใน Settings
    สคริปต์ตั้งค่าจะเขียนโทเค็นลงใน `.env` โดยค่าเริ่มต้น หากคุณเปลี่ยน config ของคอนเทนเนอร์ไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

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

### โฟลว์แบบแมนนวล

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
รัน `docker compose` จากรูทของ repo หากคุณเปิดใช้ `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ตั้งค่าจะเขียน `docker-compose.extra.yml`;
ให้ใส่ไฟล์นี้หลังไฟล์ override มาตรฐานใด ๆ เช่น
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
เมื่อมีไฟล์ override ทั้งสองไฟล์
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้ namespace เครือข่ายเดียวกับ `openclaw-gateway` จึงเป็น
เครื่องมือหลังเริ่มระบบ ก่อน `docker compose up -d openclaw-gateway` ให้รัน onboarding
และการเขียน config ระหว่างตั้งค่าผ่าน `openclaw-gateway` พร้อม
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ตั้งค่ารองรับตัวแปรสภาพแวดล้อมแบบเลือกใช้เหล่านี้:

| ตัวแปร                                      | วัตถุประสงค์                                                           |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ใช้อิมเมจระยะไกลแทนการสร้างภายในเครื่อง                              |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่าง build (คั่นด้วยช่องว่าง)          |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | ติดตั้งแพ็กเกจ Python เพิ่มเติมระหว่าง build (คั่นด้วยช่องว่าง)       |
| `OPENCLAW_EXTENSIONS`                      | ติดตั้ง dependency ของ plugin ล่วงหน้าขณะ build (ชื่อคั่นด้วยช่องว่าง) |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mount ของโฮสต์เพิ่มเติม (คั่นด้วยจุลภาค `source:target[:opts]`)  |
| `OPENCLAW_HOME_VOLUME`                     | คงข้อมูล `/home/node` ไว้ใน Docker volume ที่มีชื่อ                   |
| `OPENCLAW_SANDBOX`                         | เลือกใช้การ bootstrap ของ Sandbox (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_SKIP_ONBOARDING`                 | ข้ามขั้นตอน onboarding แบบโต้ตอบ (`1`, `true`, `yes`, `on`)           |
| `OPENCLAW_DOCKER_SOCKET`                   | แทนที่พาธ Docker socket                                               |
| `OPENCLAW_DISABLE_BONJOUR`                 | ปิดการโฆษณา Bonjour/mDNS (ค่าเริ่มต้นเป็น `1` สำหรับ Docker)          |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | ปิด overlay แบบ bind-mount ของซอร์ส plugin ที่ bundle มา              |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | endpoint ตัวรวบรวม OTLP/HTTP ร่วมสำหรับการ export OpenTelemetry       |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | endpoint OTLP เฉพาะสัญญาณสำหรับ traces, metrics หรือ logs            |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | ค่าแทนที่โปรโตคอล OTLP ปัจจุบันรองรับเฉพาะ `http/protobuf`            |
| `OTEL_SERVICE_NAME`                        | ชื่อบริการที่ใช้สำหรับทรัพยากร OpenTelemetry                          |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | เลือกใช้แอตทริบิวต์เชิงความหมาย GenAI รุ่นทดลองล่าสุด                |
| `OPENCLAW_OTEL_PRELOADED`                  | ข้ามการเริ่ม OpenTelemetry SDK ตัวที่สองเมื่อมีการโหลดไว้ล่วงหน้า    |

อิมเมจ Docker ทางการไม่ได้มาพร้อม Homebrew ระหว่าง onboarding OpenClaw
จะซ่อนตัวติดตั้ง dependency ของ skill ที่ใช้ได้เฉพาะ brew เมื่อรันอยู่ในคอนเทนเนอร์ Linux
ที่ไม่มี `brew`; dependency เหล่านั้นต้องมาจากอิมเมจที่กำหนดเอง
หรือติดตั้งด้วยตนเอง สำหรับ dependency ที่มีจากแพ็กเกจ Debian ให้ใช้
`OPENCLAW_IMAGE_APT_PACKAGES` ระหว่าง build อิมเมจ ชื่อเดิม
`OPENCLAW_DOCKER_APT_PACKAGES` ยังรองรับอยู่
สำหรับ dependency ของ Python ให้ใช้ `OPENCLAW_IMAGE_PIP_PACKAGES` ค่านี้จะรัน
`python3 -m pip install --break-system-packages` ระหว่าง build อิมเมจ ดังนั้นให้ตรึง
เวอร์ชันแพ็กเกจและใช้เฉพาะ package indexes ที่คุณเชื่อถือ

ผู้ดูแลสามารถทดสอบซอร์ส plugin ที่ bundle มากับอิมเมจแบบแพ็กเกจได้โดย mount
ไดเรกทอรีซอร์สของ plugin หนึ่งตัวทับพาธซอร์สที่แพ็กเกจไว้ เช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ไดเรกทอรีซอร์สที่ mount นั้นจะแทนที่ bundle ที่คอมไพล์แล้วที่ตรงกันใน
`/app/dist/extensions/synology-chat` สำหรับ plugin id เดียวกัน

### Observability

การ export OpenTelemetry เป็นทราฟฟิกขาออกจากคอนเทนเนอร์ Gateway ไปยังตัวรวบรวม OTLP
ของคุณ ไม่จำเป็นต้องเผยแพร่พอร์ต Docker หากคุณ build อิมเมจ
ภายในเครื่องและต้องการให้ exporter OpenTelemetry ที่ bundle มาใช้งานได้ภายในอิมเมจ
ให้รวม dependency runtime ของมัน:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

ติดตั้ง Plugin ทางการ `@openclaw/diagnostics-otel` จาก ClawHub ใน
การติดตั้ง Docker แบบแพ็กเกจก่อนเปิดใช้การ export อิมเมจที่ build จากซอร์สแบบกำหนดเองยังคง
รวมซอร์ส plugin ภายในเครื่องได้ด้วย
`OPENCLAW_EXTENSIONS=diagnostics-otel` หากต้องการเปิดใช้การ export ให้ allow และ enable
Plugin `diagnostics-otel` ใน config จากนั้นตั้งค่า
`diagnostics.otel.enabled=true` หรือใช้ตัวอย่าง config ใน [การ export OpenTelemetry
](/th/gateway/opentelemetry) ส่วนหัว auth ของ collector กำหนดค่าผ่าน
`diagnostics.otel.headers` ไม่ใช่ผ่านตัวแปรสภาพแวดล้อม Docker

Prometheus metrics ใช้พอร์ต Gateway ที่เผยแพร่อยู่แล้ว ติดตั้ง
`clawhub:@openclaw/diagnostics-prometheus`, เปิดใช้ Plugin
`diagnostics-prometheus` จากนั้น scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

route นี้ได้รับการป้องกันด้วยการยืนยันตัวตนของ Gateway อย่าเปิดเผยพอร์ต
`/metrics` สาธารณะแยกต่างหากหรือพาธ reverse-proxy ที่ไม่ต้องยืนยันตัวตน ดู
[Prometheus metrics](/th/gateway/prometheus)

### การตรวจสอบสุขภาพ

endpoint สำหรับ probe คอนเทนเนอร์ (ไม่ต้องใช้ auth):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

อิมเมจ Docker มี `HEALTHCHECK` ในตัวที่ ping `/healthz`
หากการตรวจสอบล้มเหลวต่อเนื่อง Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy`
และระบบ orchestration สามารถรีสตาร์ทหรือแทนที่คอนเทนเนอร์ได้

สแนปช็อตสุขภาพเชิงลึกที่ยืนยันตัวตนแล้ว:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` ใช้งานได้กับการเผยแพร่พอร์ตของ Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์บนโฮสต์และ CLI บนโฮสต์เข้าถึงพอร์ต Gateway ที่เผยแพร่ได้
- `loopback`: เฉพาะโปรเซสภายใน namespace เครือข่ายของคอนเทนเนอร์เท่านั้นที่เข้าถึง
  Gateway ได้โดยตรง

<Note>
ใช้ค่าโหมด bind ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่ alias ของโฮสต์อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### ผู้ให้บริการภายในเครื่องของโฮสต์

เมื่อ OpenClaw รันใน Docker, `127.0.0.1` ภายในคอนเทนเนอร์คือคอนเทนเนอร์เอง
ไม่ใช่เครื่องโฮสต์ของคุณ ใช้ `host.docker.internal` สำหรับผู้ให้บริการ AI ที่
รันบนโฮสต์:

| ผู้ให้บริการ | URL เริ่มต้นของโฮสต์ | URL สำหรับตั้งค่า Docker |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่า Docker ที่รวมมาให้ใช้ URL ของโฮสต์เหล่านั้นเป็นค่าเริ่มต้นสำหรับ onboarding ของ LM Studio และ Ollama และ `docker-compose.yml` จะแมป `host.docker.internal` ไปยัง host gateway ของ Docker สำหรับ Linux Docker Engine ส่วน Docker Desktop มี hostname เดียวกันนี้ให้ใช้อยู่แล้วบน macOS และ Windows

บริการบนโฮสต์ต้อง listen บนที่อยู่ที่ Docker เข้าถึงได้ด้วย:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

หากคุณใช้ไฟล์ Compose หรือคำสั่ง `docker run` ของคุณเอง ให้เพิ่มการแมปโฮสต์เดียวกันด้วยตนเอง ตัวอย่างเช่น
`--add-host=host.docker.internal:host-gateway`.

### แบ็กเอนด์ Claude CLI ใน Docker

อิมเมจ Docker อย่างเป็นทางการของ OpenClaw ไม่ได้ติดตั้ง Claude Code ไว้ล่วงหน้า ให้ติดตั้งและเข้าสู่ระบบ Claude Code ภายในผู้ใช้คอนเทนเนอร์ที่รัน OpenClaw จากนั้นทำให้ home ของคอนเทนเนอร์นั้นคงอยู่ เพื่อให้การอัปเกรดอิมเมจไม่ลบไบนารีหรือสถานะ auth ของ Claude

สำหรับการติดตั้ง Docker ใหม่ ให้เปิดใช้ volume `/home/node` แบบถาวรก่อนรันการตั้งค่า:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

สำหรับการติดตั้ง Docker ที่มีอยู่แล้ว ให้หยุด stack ก่อนและโหลดค่า Docker `.env` ปัจจุบันซ้ำก่อนรันการตั้งค่าอีกครั้ง สคริปต์ตั้งค่าไม่ได้อ่าน `.env` เอง แต่จะเขียน `.env` ใหม่จาก shell ปัจจุบันและค่าเริ่มต้น สำหรับ `.env` ที่สร้างขึ้น ให้รัน:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

หาก `.env` ของคุณมีค่าที่ shell ของคุณ source ไม่ได้ ให้ re-export ค่าที่มีอยู่ซึ่งคุณต้องพึ่งพาด้วยตนเองก่อน เช่น `OPENCLAW_IMAGE`, พอร์ต, โหมด bind, พาธกำหนดเอง, `OPENCLAW_EXTRA_MOUNTS`, sandbox และการตั้งค่า skip-onboarding overlay ที่สร้างขึ้นจะเมานต์ home volume ให้ทั้ง `openclaw-gateway` และ `openclaw-cli`

รันคำสั่งที่เหลือด้วย Compose overlay ที่สร้างขึ้น เพื่อให้บริการทั้งสองเมานต์ home ที่คงอยู่ หากการตั้งค่าของคุณใช้ `docker-compose.override.yml` ด้วย ให้รวมไฟล์นั้นไว้ก่อน `docker-compose.extra.yml`

ติดตั้ง Claude Code ใน home ที่คงอยู่นั้น:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

ตัวติดตั้ง native จะเขียนไบนารี `claude` ไว้ใต้
`/home/node/.local/bin/claude` บอก OpenClaw ให้ใช้พาธของคอนเทนเนอร์นั้น:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

เข้าสู่ระบบและตรวจสอบจากภายใน home ของคอนเทนเนอร์แบบถาวรเดียวกัน:

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

หลังจากนั้น คุณสามารถใช้แบ็กเอนด์ `claude-cli` ที่รวมมาให้ได้:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` ทำให้การติดตั้ง Claude Code แบบ native คงอยู่ใต้
`/home/node/.local/bin` และ `/home/node/.local/share/claude` รวมถึงการตั้งค่าและสถานะ auth ของ Claude Code ใต้ `/home/node/.claude` และ `/home/node/.claude.json` การทำให้เฉพาะ `/home/node/.openclaw` คงอยู่นั้นไม่เพียงพอสำหรับการใช้ Claude CLI ซ้ำ หากคุณใช้ `OPENCLAW_EXTRA_MOUNTS` แทน home volume ให้เมานต์พาธ Claude ทั้งหมดเหล่านั้นเข้าไปในบริการ Docker ทั้งสอง

<Note>
สำหรับ automation การผลิตแบบใช้ร่วมกันหรือการเรียกเก็บเงิน Anthropic ที่คาดการณ์ได้ ให้เลือกเส้นทาง API key ของ Anthropic การใช้ Claude CLI ซ้ำจะเป็นไปตามเวอร์ชัน Claude Code ที่ติดตั้งไว้ การเข้าสู่ระบบบัญชี การเรียกเก็บเงิน และพฤติกรรมการอัปเดตของ Claude Code
</Note>

### Bonjour / mDNS

โดยปกติ Docker bridge networking จะไม่ส่งต่อ multicast ของ Bonjour/mDNS
(`224.0.0.251:5353`) ได้อย่างน่าเชื่อถือ ดังนั้นการตั้งค่า Compose ที่รวมมาให้จึงตั้งค่าเริ่มต้นเป็น
`OPENCLAW_DISABLE_BONJOUR=1` เพื่อให้ Gateway ไม่ crash-loop หรือเริ่มการโฆษณาซ้ำๆ เมื่อ bridge ทิ้งทราฟฟิก multicast

ใช้ URL ของ Gateway ที่เผยแพร่แล้ว, Tailscale หรือ DNS-SD แบบ wide-area สำหรับโฮสต์ Docker ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วย host networking, macvlan หรือเครือข่ายอื่นที่ทราบว่า multicast ของ mDNS ทำงานได้

สำหรับข้อควรระวังและการแก้ปัญหา โปรดดู [การค้นพบ Bonjour](/th/gateway/bonjour)

### ที่จัดเก็บและความคงอยู่

Docker Compose bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` และ
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` ไปยัง `/home/node/.config/openclaw` ดังนั้นพาธเหล่านั้นจึงอยู่รอดหลังการแทนที่คอนเทนเนอร์ เมื่อไม่ได้ตั้งค่าตัวแปรใดๆ `docker-compose.yml` ที่รวมมาให้จะ fallback ไปใต้ `${HOME}` หรือ `/tmp` เมื่อ `HOME` เองก็ขาดหายไปด้วย วิธีนี้ป้องกันไม่ให้ `docker compose up` ส่ง volume spec ที่มี source ว่างในสภาพแวดล้อมเปล่า

ไดเรกทอรี config ที่เมานต์นั้นคือที่ที่ OpenClaw เก็บ:

- `openclaw.json` สำหรับ config พฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับ auth OAuth/API key ของผู้ให้บริการที่จัดเก็บไว้
- `.env` สำหรับ runtime secrets ที่อิง env เช่น `OPENCLAW_GATEWAY_TOKEN`

ไดเรกทอรีคีย์ลับของ auth-profile เก็บคีย์เข้ารหัสภายในเครื่องที่ใช้สำหรับ token material ของ auth profile ที่อิง OAuth เก็บไว้กับสถานะโฮสต์ Docker ของคุณ แต่แยกจาก `OPENCLAW_CONFIG_DIR`

Plugin ที่ติดตั้งแบบดาวน์โหลดได้จะเก็บสถานะแพ็กเกจไว้ใต้ home ของ OpenClaw ที่เมานต์ ดังนั้น install records ของ Plugin และ package roots จึงอยู่รอดหลังการแทนที่คอนเทนเนอร์ การเริ่มต้น Gateway จะไม่สร้าง dependency trees ของ bundled-plugin

สำหรับรายละเอียดความคงอยู่ทั้งหมดในการปรับใช้ VM โปรดดู
[Docker VM Runtime - สิ่งใดคงอยู่ที่ไหน](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ดิสก์โตเร็ว:** เฝ้าดู `media/`, ไฟล์ JSONL ของ session, ฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกัน, package roots ของ Plugin ที่ติดตั้งไว้ และ rolling file logs ใต้ `/tmp/openclaw/`

### ตัวช่วย shell (ไม่บังคับ)

เพื่อให้การจัดการ Docker ในแต่ละวันง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จาก raw path เก่า `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้ง เพื่อให้ไฟล์ helper ในเครื่องของคุณติดตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` ฯลฯ รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดู [ClawDock](/th/install/clawdock) สำหรับคู่มือ helper ฉบับเต็ม

<AccordionGroup>
  <Accordion title="เปิดใช้ sandbox ของเอเจนต์สำหรับ Docker gateway">
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

    สคริปต์จะเมานต์ `docker.sock` เฉพาะหลังจากข้อกำหนดเบื้องต้นของ sandbox ผ่านแล้ว หากการตั้งค่า sandbox ทำให้เสร็จไม่ได้ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    เป็น `off` เทิร์นโหมดโค้ดของ Codex ยังถูกจำกัดอยู่ที่ Codex
    `workspace-write` ขณะที่ sandbox ของ OpenClaw ทำงานอยู่ อย่าเมานต์
    host Docker socket เข้าไปในคอนเทนเนอร์ sandbox ของเอเจนต์

  </Accordion>

  <Accordion title="Automation / CI (ไม่โต้ตอบ)">
    ปิดการจัดสรร pseudo-TTY ของ Compose ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="หมายเหตุด้านความปลอดภัยของเครือข่ายที่ใช้ร่วมกัน">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` เพื่อให้คำสั่ง CLI เข้าถึง gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็น trust boundary ที่ใช้ร่วมกัน config ของ compose จะ drop `NET_RAW`/`NET_ADMIN` และเปิดใช้
    `no-new-privileges` บนทั้ง `openclaw-gateway` และ `openclaw-cli`
  </Accordion>

  <Accordion title="ความล้มเหลว DNS ของ Docker Desktop ใน openclaw-cli">
    การตั้งค่า Docker Desktop บางแบบ lookup DNS จาก sidecar `openclaw-cli` บนเครือข่ายที่ใช้ร่วมกันไม่สำเร็จหลังจาก `NET_RAW` ถูก drop ซึ่งจะแสดงเป็น
    `EAI_AGAIN` ระหว่างคำสั่งที่อิง npm เช่น `openclaw plugins install`
    ใช้ไฟล์ compose เริ่มต้นที่ hardened แล้วต่อไปสำหรับการทำงาน gateway ปกติ override ภายในเครื่องด้านล่างนี้ผ่อน posture ด้านความปลอดภัยของคอนเทนเนอร์ CLI โดยคืนค่า capabilities เริ่มต้นของ Docker ดังนั้นให้ใช้เฉพาะกับคำสั่ง CLI แบบครั้งเดียวที่ต้องเข้าถึง package registry เท่านั้น ไม่ใช่เป็นการเรียกใช้ Compose เริ่มต้นของคุณ:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    หากคุณสร้างคอนเทนเนอร์ `openclaw-cli` ที่รันระยะยาวไว้แล้ว ให้สร้างใหม่ด้วย override เดียวกัน `docker compose exec` และ `docker exec` ไม่สามารถเปลี่ยน Linux capabilities บนคอนเทนเนอร์ที่สร้างไว้แล้วได้

  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    อิมเมจรันเป็น `node` (uid 1000) หากคุณเห็นข้อผิดพลาดสิทธิ์บน
    `/home/node/.openclaw` ตรวจสอบให้แน่ใจว่า host bind mounts ของคุณมีเจ้าของเป็น uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    ความไม่ตรงกันเดียวกันอาจแสดงเป็นคำเตือนของ Plugin เช่น
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    ตามด้วย `plugin present but blocked` นั่นหมายความว่า process uid และเจ้าของไดเรกทอรี Plugin ที่เมานต์ไม่ตรงกัน แนะนำให้รันคอนเทนเนอร์ด้วย uid เริ่มต้น 1000 และแก้ ownership ของ bind mount เฉพาะเมื่อคุณตั้งใจรัน OpenClaw เป็น root ระยะยาวเท่านั้น จึงค่อย chown
    `/path/to/openclaw-config/npm` เป็น `root:root`

  </Accordion>

  <Accordion title="การ rebuild ที่เร็วขึ้น">
    จัดลำดับ Dockerfile ของคุณเพื่อให้ dependency layers ถูกแคช วิธีนี้หลีกเลี่ยงการรัน
    `pnpm install` ซ้ำ เว้นแต่ lockfiles จะเปลี่ยน:

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

  <Accordion title="ตัวเลือกคอนเทนเนอร์สำหรับ power user">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยก่อนและรันเป็น `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์ที่มีฟีเจอร์ครบถ้วนมากขึ้น:

    1. **คงอยู่ `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง system deps**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **ฝัง Python deps**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **ฝัง Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **หรือติดตั้งเบราว์เซอร์ Playwright ลงในวอลุ่มที่คงอยู่**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **คงอยู่ไฟล์ดาวน์โหลดของเบราว์เซอร์**: ใช้ `OPENCLAW_HOME_VOLUME` หรือ
       `OPENCLAW_EXTRA_MOUNTS` OpenClaw ตรวจพบ Chromium ที่จัดการโดย Playwright
       ของอิมเมจ Docker บน Linux โดยอัตโนมัติ

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบ headless)">
    หากคุณเลือก OpenAI Codex OAuth ในวิซาร์ด ระบบจะเปิด URL ของเบราว์เซอร์ ในการตั้งค่า
    Docker หรือ headless ให้คัดลอก URL เปลี่ยนเส้นทางแบบเต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปในวิซาร์ดเพื่อทำการยืนยันตัวตนให้เสร็จ
  </Accordion>

  <Accordion title="เมตาดาต้าของอิมเมจฐาน">
    อิมเมจรันไทม์ Docker หลักใช้ `node:24-bookworm-slim` และรวม `tini` เป็นกระบวนการ init ของ entrypoint (PID 1) เพื่อให้แน่ใจว่ากระบวนการ zombie ถูกเก็บกวาดและสัญญาณถูกจัดการอย่างถูกต้องในคอนเทนเนอร์ที่รันเป็นเวลานาน อิมเมจเผยแพร่ annotation ของอิมเมจฐาน OCI รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และรายการอื่นๆ digest ฐานของ Node จะถูก
    รีเฟรชผ่าน PR อิมเมจฐาน Docker ของ Dependabot; บิลด์รีลีสไม่ได้รัน
    เลเยอร์อัปเกรดดิสโทร ดู
    [annotation ของอิมเมจ OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### กำลังรันบน VPS?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[รันไทม์ Docker VM](/th/install/docker-vm-runtime) สำหรับขั้นตอนการปรับใช้ VM ร่วมกัน
รวมถึงการฝังไบนารี การคงอยู่ และการอัปเดต

## แซนด์บ็อกซ์ของเอเจนต์

เมื่อเปิดใช้ `agents.defaults.sandbox` กับแบ็กเอนด์ Docker, gateway
จะรันการดำเนินการเครื่องมือของเอเจนต์ (เชลล์, การอ่าน/เขียนไฟล์ ฯลฯ) ภายในคอนเทนเนอร์ Docker
ที่แยกออกจากกัน ขณะที่ gateway เองยังอยู่บนโฮสต์ วิธีนี้ให้กำแพงแยกที่แข็งแรง
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือมีผู้เช่าหลายราย โดยไม่ต้องทำให้ gateway
ทั้งหมดอยู่ในคอนเทนเนอร์

ขอบเขตแซนด์บ็อกซ์อาจเป็นต่อเอเจนต์ (ค่าเริ่มต้น), ต่อเซสชัน หรือแบบใช้ร่วมกัน แต่ละขอบเขต
จะมีเวิร์กสเปซของตัวเองที่เมานต์ไว้ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบายอนุญาต/ปฏิเสธเครื่องมือ, การแยกเครือข่าย, ขีดจำกัดทรัพยากร และคอนเทนเนอร์
เบราว์เซอร์ได้

สำหรับการกำหนดค่า อิมเมจ หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์แบบครบถ้วน โปรดดู:

- [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing) -- เอกสารอ้างอิงแซนด์บ็อกซ์ฉบับสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึงเชลล์แบบโต้ตอบไปยังคอนเทนเนอร์แซนด์บ็อกซ์
- [แซนด์บ็อกซ์และเครื่องมือหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- การแทนที่ต่อเอเจนต์

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

สร้างอิมเมจแซนด์บ็อกซ์ค่าเริ่มต้น (จากซอร์ส checkout):

```bash
scripts/sandbox-setup.sh
```

สำหรับการติดตั้ง npm ที่ไม่มีซอร์ส checkout โปรดดู [การทำแซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีอิมเมจหรือคอนเทนเนอร์แซนด์บ็อกซ์ไม่เริ่มทำงาน">
    สร้างอิมเมจแซนด์บ็อกซ์ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (ซอร์ส checkout) หรือคำสั่ง `docker build` แบบ inline จาก [การทำแซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) (การติดตั้ง npm),
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็นอิมเมจแบบกำหนดเองของคุณ
    คอนเทนเนอร์จะถูกสร้างโดยอัตโนมัติต่อเซสชันเมื่อจำเป็น
  </Accordion>

  <Accordion title="ข้อผิดพลาดสิทธิ์ในแซนด์บ็อกซ์">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับ ownership ของเวิร์กสเปซที่เมานต์ของคุณ
    หรือ chown โฟลเดอร์เวิร์กสเปซ
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือแบบกำหนดเองในแซนด์บ็อกซ์">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่งจะโหลด
    `/etc/profile` และอาจรีเซ็ต PATH ตั้งค่า `docker.env.PATH` เพื่อเติม path
    เครื่องมือแบบกำหนดเองของคุณไว้ข้างหน้า หรือเพิ่มสคริปต์ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM-killed ระหว่างสร้างอิมเมจ (exit 137)">
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

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือข้อผิดพลาดการจับคู่จาก Docker CLI">
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
- [ClawDock](/th/install/clawdock) — การตั้งค่าชุมชนด้วย Docker Compose
- [การอัปเดต](/th/install/updating) — การทำให้ OpenClaw เป็นเวอร์ชันล่าสุดเสมอ
- [การกำหนดค่า](/th/gateway/configuration) — การกำหนดค่า gateway หลังติดตั้ง
