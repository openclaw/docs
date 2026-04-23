---
read_when:
    - คุณต้องการ Gateway แบบ containerized แทนการติดตั้งภายในเครื่อง
    - คุณกำลังตรวจสอบโฟลว์ Docker
summary: การตั้งค่าและการเริ่มต้นใช้งาน OpenClaw แบบใช้ Docker ที่เป็นตัวเลือก
title: Docker
x-i18n:
    generated_at: "2026-04-23T10:18:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a874ff7a3c5405ba4437a1d6746f0d9268ba7bd4faf3e20cee6079d5fb68d3
    source_path: install/docker.md
    workflow: 15
---

# Docker (ตัวเลือก)

Docker เป็น**ตัวเลือก** ใช้เฉพาะเมื่อคุณต้องการ Gateway แบบ containerized หรือต้องการตรวจสอบโฟลว์ Docker

## Docker เหมาะกับฉันหรือไม่?

- **ใช่**: คุณต้องการสภาพแวดล้อม Gateway แบบแยกและทิ้งได้ หรือรัน OpenClaw บนโฮสต์ที่ไม่มีการติดตั้งภายในเครื่อง
- **ไม่ใช่**: คุณกำลังรันบนเครื่องของตัวเองและต้องการ dev loop ที่เร็วที่สุด ให้ใช้โฟลว์การติดตั้งปกติแทน
- **หมายเหตุเรื่อง Sandboxing**: แบ็กเอนด์ sandbox เริ่มต้นจะใช้ Docker เมื่อเปิดใช้งาน sandboxing แต่ sandboxing ปิดอยู่โดยค่าเริ่มต้น และ **ไม่** จำเป็นต้องรัน Gateway ทั้งหมดใน Docker นอกจากนี้ยังมีแบ็กเอนด์ sandbox แบบ SSH และ OpenShell ให้ใช้ด้วย ดู [Sandboxing](/th/gateway/sandboxing)

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการ build image (`pnpm install` อาจถูก OOM-kill บนโฮสต์ 1 GB พร้อม exit 137)
- พื้นที่ดิสก์เพียงพอสำหรับ image และ log
- หากรันบน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ
  [การเสริมความแข็งแกร่งด้านความปลอดภัยสำหรับการเปิดเผยเครือข่าย](/th/gateway/security)
  โดยเฉพาะนโยบายไฟร์วอลล์ Docker `DOCKER-USER`

## Gateway แบบ containerized

<Steps>
  <Step title="Build image">
    จาก repo root ให้รันสคริปต์ตั้งค่า:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้จะ build image ของ Gateway ภายในเครื่อง หากต้องการใช้ image ที่ build ไว้ล่วงหน้าแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    image ที่ build ไว้ล่วงหน้าถูกเผยแพร่ที่
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)
    แท็กรวมที่ใช้บ่อย: `main`, `latest`, `<version>` (เช่น `2026.2.26`)

  </Step>

  <Step title="ทำ onboarding ให้เสร็จ">
    สคริปต์ตั้งค่าจะรัน onboarding ให้อัตโนมัติ โดยจะ:

    - ขอ provider API key
    - สร้าง gateway token และเขียนลง `.env`
    - เริ่มต้น Gateway ผ่าน Docker Compose

    ระหว่างการตั้งค่า onboarding ก่อนเริ่มต้นและการเขียนคอนฟิกจะรันผ่าน
    `openclaw-gateway` โดยตรง `openclaw-cli` ใช้สำหรับคำสั่งที่คุณรันหลังจาก
    container ของ Gateway มีอยู่แล้ว

  </Step>

  <Step title="เปิด Control UI">
    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์ของคุณ แล้ววาง shared secret ที่กำหนดค่าไว้ลงใน Settings สคริปต์ตั้งค่าจะเขียน token ลง `.env` โดยค่าเริ่มต้น; หากคุณเปลี่ยนคอนฟิก container ไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

    ต้องการ URL อีกครั้งหรือไม่?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="กำหนดค่าช่องทาง (ตัวเลือก)">
    ใช้ CLI container เพื่อเพิ่มช่องทางส่งข้อความ:

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
รัน `docker compose` จาก repo root หากคุณเปิดใช้งาน `OPENCLAW_EXTRA_MOUNTS`
หรือ `OPENCLAW_HOME_VOLUME` สคริปต์ตั้งค่าจะเขียน `docker-compose.extra.yml`;
ให้รวมไฟล์นี้ด้วย `-f docker-compose.yml -f docker-compose.extra.yml`
</Note>

<Note>
เนื่องจาก `openclaw-cli` ใช้ network namespace ร่วมกับ `openclaw-gateway` มันจึงเป็น
tool หลังการเริ่มต้น ก่อน `docker compose up -d openclaw-gateway` ให้รัน onboarding
และการเขียนคอนฟิกช่วงตั้งค่าผ่าน `openclaw-gateway` โดยใช้
`--no-deps --entrypoint node`
</Note>

### ตัวแปรสภาพแวดล้อม

สคริปต์ตั้งค่ารองรับตัวแปรสภาพแวดล้อมเสริมเหล่านี้:

| Variable                       | วัตถุประสงค์                                                    |
| ------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`               | ใช้ image ระยะไกลแทนการ build ภายในเครื่อง                     |
| `OPENCLAW_DOCKER_APT_PACKAGES` | ติดตั้ง apt package เพิ่มเติมระหว่าง build (คั่นด้วยช่องว่าง)   |
| `OPENCLAW_EXTENSIONS`          | ติดตั้ง dependency ของ plugin ล่วงหน้าตอน build (ชื่อคั่นด้วยช่องว่าง) |
| `OPENCLAW_EXTRA_MOUNTS`        | bind mount โฮสต์เพิ่มเติม (คั่นด้วยจุลภาค `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`         | เก็บ `/home/node` ไว้ใน Docker volume แบบมีชื่อ                |
| `OPENCLAW_SANDBOX`             | เลือกเปิด sandbox bootstrap (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_DOCKER_SOCKET`       | แทนที่ path ของ Docker socket                                   |

### การตรวจสอบสถานะการทำงาน

endpoint สำหรับ probe ของ container (ไม่ต้องยืนยันตัวตน):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker image มี `HEALTHCHECK` ในตัวที่ ping ไปยัง `/healthz`
หากการตรวจสอบล้มเหลวซ้ำ ๆ Docker จะทำเครื่องหมาย container เป็น `unhealthy` และ
ระบบ orchestration สามารถรีสตาร์ตหรือแทนที่มันได้

สแนปชอตสถานะเชิงลึกแบบยืนยันตัวตน:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ตั้งค่าเริ่มต้น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้การเข้าถึงจากโฮสต์ไปยัง
`http://127.0.0.1:18789` ทำงานได้ร่วมกับการ publish พอร์ตของ Docker

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์และ CLI บนโฮสต์เข้าถึงพอร์ต Gateway ที่ publish ไว้ได้
- `loopback`: เฉพาะโปรเซสภายใน network namespace ของ container เท่านั้นที่เข้าถึง
  Gateway โดยตรงได้

<Note>
ให้ใช้ค่า bind mode ใน `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`) ไม่ใช่ host alias เช่น `0.0.0.0` หรือ `127.0.0.1`
</Note>

### การจัดเก็บและการคงอยู่ของข้อมูล

Docker Compose จะ bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw` และ
`OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` ดังนั้น path เหล่านั้น
จะยังคงอยู่แม้ container ถูกแทนที่

ไดเรกทอรีคอนฟิกที่ mount ไว้นี้คือที่ OpenClaw ใช้เก็บ:

- `openclaw.json` สำหรับคอนฟิกพฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับ OAuth/API-key auth ของ provider ที่จัดเก็บไว้
- `.env` สำหรับ secret รันไทม์ที่อิง env เช่น `OPENCLAW_GATEWAY_TOKEN`

สำหรับรายละเอียดการคงอยู่ของข้อมูลบนการติดตั้งใช้งาน VM ทั้งหมด ดู
[Docker VM Runtime - What persists where](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ดิสก์โตเร็ว:** ให้เฝ้าดู `media/`, ไฟล์ JSONL ของเซสชัน, `cron/runs/*.jsonl`,
และ rolling file log ภายใต้ `/tmp/openclaw/`

### ตัวช่วย shell (ตัวเลือก)

หากต้องการให้การจัดการ Docker ในแต่ละวันง่ายขึ้น ให้ติดตั้ง `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้ง ClawDock จาก raw path แบบเก่า `scripts/shell-helpers/clawdock-helpers.sh` ให้รันคำสั่งติดตั้งด้านบนอีกครั้งเพื่อให้ไฟล์ helper ในเครื่องของคุณติดตามตำแหน่งใหม่

จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` เป็นต้น รัน
`clawdock-help` เพื่อดูคำสั่งทั้งหมด
ดู [ClawDock](/th/install/clawdock) สำหรับคู่มือ helper แบบเต็ม

<AccordionGroup>
  <Accordion title="เปิดใช้งาน agent sandbox สำหรับ Docker Gateway">
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
    การตั้งค่า sandbox ไม่สามารถทำให้เสร็จสมบูรณ์ได้ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode`
    เป็น `off`

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
    จึงเข้าถึง Gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความเชื่อถือร่วมกัน
    คอนฟิก compose จะตัด `NET_RAW`/`NET_ADMIN` และเปิดใช้
    `no-new-privileges` บน `openclaw-cli`
  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    image รันในฐานะ `node` (uid 1000) หากคุณพบข้อผิดพลาดเรื่องสิทธิ์บน
    `/home/node/.openclaw` ให้ตรวจสอบว่า bind mount บนโฮสต์เป็นเจ้าของโดย uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="การ build ใหม่ให้เร็วขึ้น">
    จัดลำดับ Dockerfile ของคุณให้เลเยอร์ dependency ถูกแคช วิธีนี้จะช่วยหลีกเลี่ยงการรัน
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

  <Accordion title="ตัวเลือก container สำหรับผู้ใช้ระดับสูง">
    image เริ่มต้นเน้นความปลอดภัยและรันเป็นผู้ใช้ `node` ที่ไม่ใช่ root หากต้องการ
    container ที่มีความสามารถครบกว่าปกติ:

    1. **เก็บ `/home/node` แบบถาวร**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **ฝัง dependency ของระบบ**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **ติดตั้ง browser ของ Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **เก็บการดาวน์โหลด browser แบบถาวร**: ตั้งค่า
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` และใช้
       `OPENCLAW_HOME_VOLUME` หรือ `OPENCLAW_EXTRA_MOUNTS`

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบ headless)">
    หากคุณเลือก OpenAI Codex OAuth ใน wizard มันจะเปิด URL ในเบราว์เซอร์ ใน
    Docker หรือการตั้งค่าแบบ headless ให้คัดลอก redirect URL แบบเต็มที่คุณไปถึง แล้ววาง
    กลับเข้าไปใน wizard เพื่อทำ auth ให้เสร็จ
  </Accordion>

  <Accordion title="Metadata ของ base image">
    Docker image หลักใช้ `node:24-bookworm` และเผยแพร่ annotation ของ OCI base-image
    รวมถึง `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` และอื่น ๆ ดู
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### กำลังรันบน VPS อยู่หรือไม่?

ดู [Hetzner (Docker VPS)](/th/install/hetzner) และ
[Docker VM Runtime](/th/install/docker-vm-runtime) สำหรับขั้นตอนการติดตั้งใช้งานบน VM ร่วมกัน
ซึ่งรวมถึงการฝังไบนารี การคงอยู่ของข้อมูล และการอัปเดต

## Agent Sandbox

เมื่อเปิดใช้งาน `agents.defaults.sandbox` ด้วยแบ็กเอนด์ Docker Gateway
จะรันการทำงานของ tool ของเอเจนต์ (shell, file read/write เป็นต้น) ภายใน Docker
container แบบแยก ขณะที่ตัว Gateway เองยังคงอยู่บนโฮสต์ วิธีนี้ช่วยสร้างกำแพงที่แข็งแรง
รอบเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือหลายผู้เช่า โดยไม่ต้องทำให้ Gateway ทั้งหมดเป็น container

ขอบเขตของ sandbox สามารถเป็นรายเอเจนต์ (ค่าเริ่มต้น), รายเซสชัน หรือใช้ร่วมกันได้ แต่ละขอบเขต
จะมี workspace ของตัวเองที่ mount ไว้ที่ `/workspace` คุณยังสามารถกำหนดค่า
นโยบายอนุญาต/ปฏิเสธ tool, การแยกเครือข่าย, ขีดจำกัดทรัพยากร และ browser container ได้

สำหรับการกำหนดค่าแบบเต็ม image หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ ดู:

- [Sandboxing](/th/gateway/sandboxing) -- ข้อมูลอ้างอิง sandbox แบบสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึงเชลล์แบบโต้ตอบไปยัง sandbox container
- [Multi-Agent Sandbox and Tools](/th/tools/multi-agent-sandbox-tools) -- การแทนที่รายเอเจนต์

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

build sandbox image เริ่มต้น:

```bash
scripts/sandbox-setup.sh
```

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มี image หรือ sandbox container ไม่เริ่มทำงาน">
    build sandbox image ด้วย
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็น image แบบกำหนดเองของคุณ
    container จะถูกสร้างอัตโนมัติรายเซสชันเมื่อมีการใช้งาน
  </Accordion>

  <Accordion title="ข้อผิดพลาดเรื่องสิทธิ์ใน sandbox">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับเจ้าของ workspace ที่ mount ไว้
    หรือเปลี่ยนเจ้าของโฟลเดอร์ workspace
  </Accordion>

  <Accordion title="ไม่พบ custom tool ใน sandbox">
    OpenClaw รันคำสั่งด้วย `sh -lc` (login shell) ซึ่งจะโหลด
    `/etc/profile` และอาจรีเซ็ต PATH ให้ตั้งค่า `docker.env.PATH` เพื่อเพิ่ม
    path ของ custom tool ของคุณไว้ด้านหน้า หรือเพิ่มสคริปต์ใต้ `/etc/profile.d/` ใน Dockerfile ของคุณ
  </Accordion>

  <Accordion title="ถูก OOM-kill ระหว่าง build image (exit 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ให้ใช้เครื่องขนาดใหญ่ขึ้นแล้วลองใหม่
  </Accordion>

  <Accordion title="Unauthorized หรือจำเป็นต้องจับคู่ใน Control UI">
    ดึงลิงก์ dashboard ใหม่และอนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    รายละเอียดเพิ่มเติม: [Dashboard](/th/web/dashboard), [Devices](/th/cli/devices)

  </Accordion>

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือเกิดข้อผิดพลาด pairing จาก Docker CLI">
    รีเซ็ตโหมดและ bind ของ Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีการติดตั้งทั้งหมด
- [Podman](/th/install/podman) — ทางเลือก Podman แทน Docker
- [ClawDock](/th/install/clawdock) — การตั้งค่าชุมชนด้วย Docker Compose
- [การอัปเดต](/th/install/updating) — การดูแลให้ OpenClaw ทันสมัย
- [การกำหนดค่า](/th/gateway/configuration) — การกำหนดค่า Gateway หลังการติดตั้ง
