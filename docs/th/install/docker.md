---
read_when:
    - คุณต้องการ gateway แบบคอนเทนเนอร์แทนการติดตั้งในเครื่อง
    - คุณกำลังตรวจสอบโฟลว์ Docker
summary: การตั้งค่าและเริ่มใช้งาน OpenClaw แบบใช้ Docker ซึ่งเป็นทางเลือกเพิ่มเติม
title: Docker
x-i18n:
    generated_at: "2026-04-26T11:33:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

Docker เป็นตัวเลือก **เสริม** ใช้เฉพาะเมื่อคุณต้องการ gateway แบบคอนเทนเนอร์ หรือต้องการตรวจสอบโฟลว์ Docker

## Docker เหมาะกับฉันหรือไม่?

- **ใช่**: คุณต้องการสภาพแวดล้อม gateway แบบแยกขาดและทิ้งได้ หรืออยากรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งในเครื่อง
- **ไม่ใช่**: คุณกำลังรันบนเครื่องของตัวเองและแค่อยากได้ dev loop ที่เร็วที่สุด ให้ใช้โฟลว์การติดตั้งปกติแทน
- **หมายเหตุเรื่อง sandboxing**: backend sandbox ค่าเริ่มต้นใช้ Docker เมื่อเปิด sandboxing แต่ sandboxing ปิดอยู่เป็นค่าเริ่มต้นและ **ไม่จำเป็น** ต้องรัน gateway ทั้งตัวใน Docker นอกจากนี้ยังมี backend sandbox แบบ SSH และ OpenShell ให้ใช้งานด้วย ดู [Sandboxing](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการ build image (`pnpm install` อาจถูก OOM-killed บนโฮสต์ 1 GB พร้อม exit 137)
- พื้นที่ดิสก์เพียงพอสำหรับ image และ log
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ
  [การทำ hardening ด้านความปลอดภัยสำหรับการเปิดเผยเครือข่าย](/th/gateway/security)
  โดยเฉพาะนโยบาย firewall `DOCKER-USER` ของ Docker

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="สร้าง image">
    จากราก repo ให้รันสคริปต์ตั้งค่า:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะ build image ของ gateway ในเครื่อง หากต้องการใช้ image ที่ build ไว้แล้วแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    image ที่ build ไว้แล้วเผยแพร่อยู่ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    แท็กที่ใช้บ่อย: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="ทำ onboarding ให้เสร็จ">
    สคริปต์ตั้งค่าจะรัน onboarding ให้อัตโนมัติ โดยจะ:

    - ถามหา API key ของ provider
    - สร้างโทเค็น gateway และเขียนลง `.env`
    - เริ่ม gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า onboarding ก่อนเริ่มต้นและการเขียนคอนฟิกจะรันผ่าน
    `openclaw-gateway` โดยตรง ส่วน `openclaw-cli` มีไว้สำหรับคำสั่งที่คุณรันหลังจาก
    คอนเทนเนอร์ gateway มีอยู่แล้ว

  </Step>

  <Step title="เปิด Control UI">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ แล้ววาง shared secret ที่ตั้งค่าไว้ลงใน Settings โดยค่าเริ่มต้นสคริปต์ตั้งค่าจะเขียนโทเค็นลงใน `.env`; หากคุณเปลี่ยนคอนฟิกคอนเทนเนอร์ให้ใช้ auth แบบ password ให้ใช้ password นั้นแทน

    ต้องการ URL อีกครั้งหรือไม่?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="ตั้งค่า channel (เลือกได้)">
    ใช้คอนเทนเนอร์ CLI เพื่อเพิ่ม channel สำหรับส่งข้อความ:

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

### โฟลว์แบบ manual

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
ให้รวมไฟล์นี้ด้วย `-f docker-compose.yml -f docker-compose.extra.yml`
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้ network namespace ร่วมกับ `openclaw-gateway` จึงเป็น
เครื่องมือหลังเริ่มต้น ก่อน `docker compose up -d openclaw-gateway` ให้รัน onboarding
และการเขียนคอนฟิกช่วงตั้งค่าผ่าน `openclaw-gateway` ด้วย
`--no-deps --entrypoint node`
</Note>

### ตัวแปรแวดล้อม

สคริปต์ตั้งค่ารองรับตัวแปรแวดล้อมแบบเลือกได้ดังต่อไปนี้:

| ตัวแปร                                     | วัตถุประสงค์                                                    |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | ใช้ image ระยะไกลแทนการ build ในเครื่อง                        |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | ติดตั้งแพ็กเกจ apt เพิ่มระหว่าง build (คั่นด้วยช่องว่าง)       |
| `OPENCLAW_EXTENSIONS`                      | ติดตั้ง dependency ของ Plugin ล่วงหน้าในเวลา build (ชื่อคั่นด้วยช่องว่าง) |
| `OPENCLAW_EXTRA_MOUNTS`                    | bind mount เพิ่มจากโฮสต์ (คั่นด้วยจุลภาค `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                     | เก็บ `/home/node` ไว้ถาวรใน Docker volume แบบมีชื่อ            |
| `OPENCLAW_SANDBOX`                         | เลือกใช้การ bootstrap sandbox (`1`, `true`, `yes`, `on`)       |
| `OPENCLAW_DOCKER_SOCKET`                   | override path ของ Docker socket                                 |
| `OPENCLAW_DISABLE_BONJOUR`                 | ปิดการประกาศ Bonjour/mDNS (ค่าเริ่มต้นเป็น `1` สำหรับ Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | ปิด bundled plugin source bind-mount overlays                   |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | ปลายทาง collector แบบ OTLP/HTTP ร่วมสำหรับการ export OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | ปลายทาง OTLP แยกตามสัญญาณสำหรับ traces, metrics หรือ logs      |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | override โปรโตคอล OTLP ปัจจุบันรองรับเฉพาะ `http/protobuf`     |
| `OTEL_SERVICE_NAME`                        | ชื่อบริการที่ใช้สำหรับ resource ของ OpenTelemetry               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | เลือกใช้ semantic attributes แบบทดลองล่าสุดของ GenAI            |
| `OPENCLAW_OTEL_PRELOADED`                  | ข้ามการเริ่ม OpenTelemetry SDK ตัวที่สองเมื่อมีตัวหนึ่งถูก preload แล้ว |

ผู้ดูแลสามารถทดสอบ source ของ Plugin ที่มาพร้อมในชุดกับ image แบบแพ็กเกจได้โดย mount
ไดเรกทอรี source ของ Plugin หนึ่งตัวทับ path source แบบแพ็กเกจของมัน ตัวอย่างเช่น
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`
ไดเรกทอรี source ที่ถูก mount นี้จะ override bundle ที่คอมไพล์แล้วใน
`/app/dist/extensions/synology-chat` ของ Plugin id เดียวกัน

### Observability

การ export OpenTelemetry เป็นทราฟฟิกขาออกจากคอนเทนเนอร์ Gateway ไปยัง OTLP
collector ของคุณ โดยไม่ต้องเปิดเผย Docker port เพิ่มเติม หากคุณ build image
ในเครื่องและต้องการให้ exporter ของ OpenTelemetry ที่มาพร้อมในชุดใช้งานได้ภายใน image
ให้รวม runtime dependency ของมันไว้ด้วย:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Docker release image อย่างเป็นทางการของ OpenClaw มี source ของ Plugin
`diagnostics-otel` ที่มาพร้อมในชุดรวมอยู่แล้ว ทั้งนี้ขึ้นอยู่กับ image และสถานะ cache
Gateway อาจยังต้องจัดเตรียม runtime dependency ของ OpenTelemetry ระดับ Plugin ในการบูตครั้งแรกที่เปิดใช้ Plugin ดังนั้นควรให้การบูตครั้งแรกนั้นเข้าถึง package registry ได้ หรืออุ่น image ล่วงหน้าใน release lane ของคุณ หากต้องการเปิดใช้การ export ให้ allow และ enable Plugin `diagnostics-otel` ในคอนฟิก จากนั้นตั้ง
`diagnostics.otel.enabled=true` หรือใช้ตัวอย่างคอนฟิกใน
[การ export OpenTelemetry](/th/gateway/opentelemetry) ส่วน header สำหรับยืนยันตัวตนกับ collector
ให้ตั้งค่าผ่าน `diagnostics.otel.headers` ไม่ใช่ผ่านตัวแปรแวดล้อมของ Docker

Prometheus metrics ใช้พอร์ต Gateway ที่เปิดเผยไว้อยู่แล้ว ให้เปิดใช้ Plugin
`diagnostics-prometheus` แล้ว scrape จาก:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

เส้นทางนี้ถูกป้องกันด้วยการยืนยันตัวตนของ Gateway อย่าเปิดเผยพอร์ต `/metrics` สาธารณะแยกต่างหาก หรือเส้นทาง reverse-proxy ที่ไม่ต้องยืนยันตัวตน ดู
[Prometheus metrics](/th/gateway/prometheus)

### การตรวจสอบสุขภาพระบบ

ปลายทาง probe ของคอนเทนเนอร์ (ไม่ต้องยืนยันตัวตน):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image มี `HEALTHCHECK` ในตัวที่ ping ไปยัง `/healthz`
หากการตรวจสอบล้มเหลวต่อเนื่อง Docker จะทำเครื่องหมายคอนเทนเนอร์เป็น `unhealthy` และ
ระบบ orchestration จะสามารถรีสตาร์ตหรือแทนที่ได้

snapshot สุขภาพระบบเชิงลึกแบบยืนยันตัวตนแล้ว:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ใช้ค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` ใช้งานได้ร่วมกับการ publish พอร์ตของ Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์และ CLI บนโฮสต์สามารถเข้าถึงพอร์ต gateway ที่ publish ไว้ได้
- `loopback`: เฉพาะโพรเซสภายใน network namespace ของคอนเทนเนอร์เท่านั้นที่เข้าถึง
  gateway โดยตรงได้

<Note>
ให้ใช้ค่าของ bind mode ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่ alias ของโฮสต์อย่าง `0.0.0.0` หรือ `127.0.0.1`
</Note>

### Bonjour / mDNS

เครือข่าย Docker bridge มักไม่ส่งต่อ Bonjour/mDNS multicast
(`224.0.0.251:5353`) ได้อย่างเชื่อถือได้ ดังนั้น Compose setup ที่มาพร้อมในชุดจึงตั้งค่าเริ่มต้น
`OPENCLAW_DISABLE_BONJOUR=1` เพื่อให้ Gateway ไม่ crash-loop หรือรีสตาร์ตการประกาศซ้ำ ๆ
เมื่อ bridge ทำ multicast traffic หล่นหาย

ให้ใช้ URL ของ Gateway ที่เปิดเผยไว้, Tailscale หรือ DNS-SD แบบ wide-area สำหรับโฮสต์ Docker
ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=0` เฉพาะเมื่อรันด้วย host networking, macvlan
หรือเครือข่ายอื่นที่ทราบแน่ชัดว่า mDNS multicast ทำงานได้

สำหรับข้อควรระวังและการแก้ปัญหา ดู [Bonjour discovery](/th/gateway/bonjour)

### ที่เก็บข้อมูลและความคงอยู่

Docker Compose จะ bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw` และ
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` ดังนั้น path เหล่านี้จะยังคงอยู่แม้เปลี่ยนคอนเทนเนอร์

ไดเรกทอรีคอนฟิกที่ถูก mount นี้เป็นที่ที่ OpenClaw จัดเก็บ:

- `openclaw.json` สำหรับคอนฟิกพฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับ auth ของ provider แบบ OAuth/API-key ที่จัดเก็บไว้
- `.env` สำหรับ secret ของ runtime ที่อิงกับ env เช่น `OPENCLAW_GATEWAY_TOKEN`

สำหรับรายละเอียดความคงอยู่ทั้งหมดในการติดตั้งใช้งานบน VM ดู
[Docker VM Runtime - อะไรคงอยู่ที่ไหน](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ดิสก์โตเร็ว:** ให้เฝ้าดู `media/`, ไฟล์ session JSONL, `cron/runs/*.jsonl`,
และ rolling file log ภายใต้ `/tmp/openclaw/`

### ตัวช่วยเชลล์ (เลือกได้)

เพื่อให้การจัดการ Docker ในชีวิตประจำวันง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จาก raw path แบบเก่า `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้ง เพื่อให้ไฟล์ตัวช่วยในเครื่องของคุณติดตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` เป็นต้น รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดู [ClawDock](/th/install/clawdock) สำหรับคู่มือตัวช่วยฉบับเต็ม

<AccordionGroup>
  <Accordion title="เปิดใช้ agent sandbox สำหรับ Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    path ของ socket แบบกำหนดเอง (เช่น Docker แบบ rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    สคริปต์จะ mount `docker.sock` ก็ต่อเมื่อผ่านข้อกำหนดเบื้องต้นของ sandbox แล้วเท่านั้น หาก
    การตั้งค่า sandbox ไม่สามารถทำให้เสร็จได้ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    กลับเป็น `off`

  </Accordion>

  <Accordion title="Automation / CI (ไม่โต้ตอบ)">
    ปิดการจัดสรร Compose pseudo-TTY ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="หมายเหตุด้านความปลอดภัยของเครือข่ายที่ใช้ร่วมกัน">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` ดังนั้นคำสั่ง CLI
    จึงเข้าถึง gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความเชื่อถือที่ใช้ร่วมกัน
    คอนฟิก compose จะถอด `NET_RAW`/`NET_ADMIN` และเปิดใช้
    `no-new-privileges` บน `openclaw-cli`
  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    image นี้รันเป็นผู้ใช้ `node` (uid 1000) หากคุณพบข้อผิดพลาดเกี่ยวกับสิทธิ์บน
    `/home/node/.openclaw` โปรดตรวจสอบให้แน่ใจว่า bind mount จากโฮสต์เป็นของ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="การ build ใหม่ให้เร็วขึ้น">
    จัดลำดับ Dockerfile ของคุณเพื่อให้เลเยอร์ dependency ถูกแคช วิธีนี้จะช่วยหลีกเลี่ยงการรัน
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

  <Accordion title="ตัวเลือกคอนเทนเนอร์สำหรับผู้ใช้ระดับสูง">
    image ค่าเริ่มต้นให้ความสำคัญกับความปลอดภัยเป็นหลักและรันเป็นผู้ใช้ `node` ที่ไม่ใช่ root หากต้องการ
    คอนเทนเนอร์ที่มีความสามารถครบกว่า:

    1. **เก็บ `/home/node` ไว้ถาวร**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง system dependency ลงไป**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ติดตั้งเบราว์เซอร์ของ Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **เก็บ browser downloads ไว้ถาวร**: ตั้งค่า
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` และใช้
       `OPENCLAW_HOME_VOLUME` หรือ `OPENCLAW_EXTRA_MOUNTS`

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบ headless)">
    หากคุณเลือก OpenAI Codex OAuth ในวิซาร์ด ระบบจะเปิด URL ในเบราว์เซอร์ ใน
    Docker หรือการตั้งค่าแบบ headless ให้คัดลอก redirect URL เต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปในวิซาร์ดเพื่อจบการยืนยันตัวตน
  </Accordion>

  <Accordion title="Metadata ของ base image">
    Docker image หลักใช้ `node:24-bookworm` และเผยแพร่ OCI base-image
    annotations รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และอื่น ๆ ดู
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### รันบน VPS อยู่หรือไม่?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอนการติดตั้งใช้งานบน VM ที่ใช้ร่วมกัน
ซึ่งรวมถึงการฝังไบนารี ความคงอยู่ของข้อมูล และการอัปเดต

## Agent Sandbox

เมื่อเปิดใช้ `agents.defaults.sandbox` ร่วมกับ backend แบบ Docker, gateway
จะรันการทำงานของเครื่องมือเอเจนต์ (shell, การอ่าน/เขียนไฟล์ ฯลฯ) ภายในคอนเทนเนอร์ Docker
ที่แยกจากกัน ขณะที่ตัว gateway เองยังคงอยู่บนโฮสต์ วิธีนี้ช่วยสร้างกำแพงที่ชัดเจน
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือแบบหลายผู้เช่า โดยไม่ต้องทำให้
gateway ทั้งหมดอยู่ในคอนเทนเนอร์

ขอบเขตของ Sandbox สามารถเป็นต่อเอเจนต์ (ค่าเริ่มต้น), ต่อเซสชัน หรือใช้ร่วมกันได้ แต่ละขอบเขต
จะมี workspace ของตัวเองที่ mount ไว้ที่ `/workspace` นอกจากนี้คุณยังสามารถกำหนดค่า
นโยบาย allow/deny ของเครื่องมือ การแยกเครือข่าย ขีดจำกัดทรัพยากร และคอนเทนเนอร์
เบราว์เซอร์ได้

สำหรับการตั้งค่าเต็มรูปแบบ image หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ ดู:

- [Sandboxing](/th/gateway/sandboxing) -- ข้อมูลอ้างอิง sandbox ฉบับสมบูรณ์
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

สร้าง image sandbox ค่าเริ่มต้น:

```bash
scripts/sandbox-setup.sh
```

## การแก้ปัญหา

<AccordionGroup>
  <Accordion title="ไม่พบ image หรือคอนเทนเนอร์ sandbox ไม่เริ่มทำงาน">
    สร้าง image sandbox ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    หรือกำหนด `agents.defaults.sandbox.docker.image` ให้เป็น image แบบกำหนดเองของคุณ
    ระบบจะสร้างคอนเทนเนอร์อัตโนมัติต่อเซสชันเมื่อมีการใช้งาน
  </Accordion>

  <Accordion title="ข้อผิดพลาดเรื่องสิทธิ์ใน sandbox">
    ตั้งค่า `docker.user` ให้เป็น UID:GID ที่ตรงกับสิทธิ์ความเป็นเจ้าของของ workspace ที่ mount ไว้
    หรือใช้ chown กับโฟลเดอร์ workspace
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือแบบกำหนดเองใน sandbox">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่งจะ source
    `/etc/profile` และอาจรีเซ็ต PATH ให้ตั้ง `docker.env.PATH` เพื่อ prepend path ของเครื่องมือแบบกำหนดเอง
    หรือเพิ่มสคริปต์ภายใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM-killed ระหว่าง build image (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ให้ใช้ machine class ที่ใหญ่ขึ้นแล้วลองใหม่
  </Accordion>

  <Accordion title="Unauthorized หรือจำเป็นต้องจับคู่ใน Control UI">
    ดึงลิงก์ dashboard ใหม่และอนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    รายละเอียดเพิ่มเติม: [Dashboard](/th/web/dashboard), [อุปกรณ์](/th/cli/devices)

  </Accordion>

  <Accordion title="Gateway target แสดง ws://172.x.x.x หรือเกิดข้อผิดพลาดการจับคู่จาก Docker CLI">
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
- [ClawDock](/th/install/clawdock) — การตั้งค่า Docker Compose โดยชุมชน
- [การอัปเดต](/th/install/updating) — การดูแล OpenClaw ให้ทันสมัย
- [การตั้งค่า](/th/gateway/configuration) — การตั้งค่า gateway หลังติดตั้ง
