---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานตลอด 24 ชั่วโมงทุกวันบน GCP
    - คุณต้องการ Gateway ระดับพร้อมใช้งานจริงที่ทำงานตลอดเวลาบน VM ของคุณเอง
    - คุณต้องการควบคุมการจัดเก็บข้อมูลถาวร ไบนารี และลักษณะการทำงานเมื่อรีสตาร์ตได้อย่างเต็มที่
summary: เรียกใช้ OpenClaw Gateway ตลอด 24 ชั่วโมงทุกวันบน VM ของ GCP Compute Engine (Docker) พร้อมสถานะที่จัดเก็บอย่างถาวร
title: GCP
x-i18n:
    generated_at: "2026-07-12T16:17:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ca46b2ee78731162261cae6ea5a26b718be6035b998fa92e4ee5c9ea2e7ae07
    source_path: install/gcp.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway แบบถาวรบน VM ของ GCP Compute Engine โดยใช้ Docker พร้อมสถานะที่คงอยู่ ไบนารีที่ฝังไว้ในอิมเมจ และพฤติกรรมการรีสตาร์ตที่ปลอดภัย

ราคาจะแตกต่างกันตามประเภทเครื่องและภูมิภาค เลือก VM ที่เล็กที่สุดซึ่งรองรับภาระงานของคุณ และเพิ่มขนาดหากพบข้อผิดพลาดหน่วยความจำไม่เพียงพอ

คุณสามารถเข้าถึง Gateway ผ่านการส่งต่อพอร์ต SSH จากแล็ปท็อป หรือเปิดพอร์ตโดยตรงหากคุณจัดการไฟร์วอลล์และโทเค็นด้วยตนเอง

คู่มือนี้ใช้ Debian บน GCP Compute Engine โดย Ubuntu ก็ใช้งานได้เช่นกัน แต่ต้องปรับแพ็กเกจให้สอดคล้องกัน สำหรับขั้นตอนทั่วไปของ Docker โปรดดู [Docker](/th/install/docker)

## สิ่งที่คุณต้องมี

- บัญชี GCP (`e2-micro` มีสิทธิ์ใช้แพ็กเกจฟรี)
- CLI `gcloud` หรือ [Cloud Console](https://console.cloud.google.com)
- สิทธิ์เข้าถึงผ่าน SSH จากแล็ปท็อป
- Docker และ Docker Compose
- ข้อมูลรับรองสำหรับการยืนยันตัวตนกับโมเดล
- ข้อมูลรับรองของผู้ให้บริการเพิ่มเติมตามต้องการ (คิวอาร์โค้ด WhatsApp, โทเค็นบอต Telegram, Gmail OAuth)
- เวลาประมาณ 20-30 นาที

## ขั้นตอนด่วน

1. สร้างโปรเจกต์ GCP เปิดใช้การเรียกเก็บเงินและ Compute Engine API
2. สร้าง VM ของ Compute Engine (`e2-small`, Debian 12, 20GB)
3. เชื่อมต่อ VM ผ่าน SSH และติดตั้ง Docker
4. โคลนที่เก็บ OpenClaw
5. สร้างไดเรกทอรีถาวรบนโฮสต์
6. กำหนดค่า `.env` และ `docker-compose.yml`
7. ฝังไบนารีที่จำเป็น สร้างอิมเมจ และเริ่มทำงาน

<Steps>
  <Step title="Install gcloud CLI (or use Console)">
    ติดตั้งจาก [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) จากนั้นเรียกใช้:

    ```bash
    gcloud init
    gcloud auth login
    ```

    หรือดำเนินการทุกขั้นตอนด้านล่างผ่านเว็บ UI ของ [Cloud Console](https://console.cloud.google.com) แทน

  </Step>

  <Step title="Create a GCP project">
    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    gcloud services enable compute.googleapis.com
    ```

    เปิดใช้การเรียกเก็บเงินที่ [console.cloud.google.com/billing](https://console.cloud.google.com/billing) (จำเป็นสำหรับ Compute Engine)

    ขั้นตอนที่เทียบเท่าใน Console: ไปที่ IAM & Admin > Create Project เปิดใช้การเรียกเก็บเงิน จากนั้นไปที่ APIs & Services > Enable APIs > "Compute Engine API" > Enable

  </Step>

  <Step title="Create the VM">
    | ประเภท    | ข้อมูลจำเพาะ              | ค่าใช้จ่าย                  | หมายเหตุ                                              |
    | --------- | ------------------------ | -------------------------- | ----------------------------------------------------- |
    | e2-medium | 2 vCPU, RAM 4GB          | ประมาณ $25/เดือน            | เชื่อถือได้มากที่สุดสำหรับการสร้าง Docker ภายในเครื่อง |
    | e2-small  | 2 vCPU, RAM 2GB          | ประมาณ $12/เดือน            | ขนาดขั้นต่ำที่แนะนำสำหรับการสร้าง Docker              |
    | e2-micro  | 2 vCPU (ใช้ร่วมกัน), RAM 1GB | มีสิทธิ์ใช้แพ็กเกจฟรี   | การสร้าง Docker มักล้มเหลวเพราะหน่วยความจำไม่พอ (รหัสออก 137) |

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

  </Step>

  <Step title="SSH into the VM">
    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    ใน Console: คลิก "SSH" ถัดจาก VM ในแดชบอร์ด Compute Engine

    การเผยแพร่คีย์ SSH อาจใช้เวลา 1-2 นาทีหลังสร้าง VM หากการเชื่อมต่อถูกปฏิเสธ ให้รอแล้วลองใหม่

  </Step>

  <Step title="Install Docker (on the VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    ออกจากระบบแล้วเข้าสู่ระบบอีกครั้งเพื่อให้การเปลี่ยนแปลงกลุ่มมีผล จากนั้นเชื่อมต่อผ่าน SSH อีกครั้ง:

    ```bash
    exit
    ```

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    ตรวจสอบ:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone the OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    คู่มือนี้สร้างอิมเมจแบบกำหนดเอง เพื่อให้ไบนารีที่คุณฝังไว้ยังคงอยู่หลังการรีสตาร์ต

  </Step>

  <Step title="Create persistent host directories">
    คอนเทนเนอร์ Docker มีลักษณะชั่วคราว ดังนั้นสถานะระยะยาวทั้งหมดต้องจัดเก็บไว้บนโฮสต์

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configure environment variables">
    สร้าง `.env` ที่รากของที่เก็บ:

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    กำหนด `OPENCLAW_GATEWAY_TOKEN` เพื่อจัดการโทเค็น Gateway แบบคงที่ผ่าน
    `.env` มิฉะนั้น ให้กำหนดค่า `gateway.auth.token` ก่อนพึ่งพาไคลเอนต์
    ข้ามการรีสตาร์ต หากไม่ได้ตั้งค่าทั้งสองอย่าง OpenClaw จะใช้โทเค็น
    เฉพาะรันไทม์สำหรับการเริ่มทำงานครั้งนั้น สร้างรหัสผ่านพวงกุญแจสำหรับ `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **ห้ามคอมมิตไฟล์นี้** ไฟล์นี้เก็บตัวแปรสภาพแวดล้อมของคอนเทนเนอร์/รันไทม์ เช่น
    `OPENCLAW_GATEWAY_TOKEN` ส่วนการยืนยันตัวตน OAuth/คีย์ API ของผู้ให้บริการที่จัดเก็บไว้
    จะอยู่ใน `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ที่เมานต์ไว้

  </Step>

  <Step title="Docker Compose configuration">
    สร้างหรืออัปเดต `docker-compose.yml`:

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Recommended: keep the Gateway loopback-only on the VM; access via SSH tunnel.
          # To expose it publicly, remove the `127.0.0.1:` prefix and firewall accordingly.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` มีไว้เพื่อความสะดวกในขั้นตอนเริ่มต้นเท่านั้น ไม่สามารถใช้แทนการกำหนดค่า Gateway จริงได้ คุณยังคงต้องตั้งค่าการยืนยันตัวตน (`gateway.auth.token` หรือรหัสผ่าน) และโหมดการผูกที่ปลอดภัยสำหรับการปรับใช้งานของคุณ

  </Step>

  <Step title="Shared Docker VM runtime steps">
    ปฏิบัติตามคู่มือรันไทม์ที่ใช้ร่วมกันสำหรับขั้นตอนทั่วไปของโฮสต์ Docker:

    - [ฝังไบนารีที่จำเป็นลงในอิมเมจ](/th/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [สร้างและเริ่มทำงาน](/th/install/docker-vm-runtime#build-and-launch)
    - [สิ่งใดคงอยู่ที่ตำแหน่งใด](/th/install/docker-vm-runtime#what-persists-where)
    - [การอัปเดต](/th/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-specific launch notes">
    หากการสร้างล้มเหลวโดยแสดง `Killed` หรือ `exit code 137` ระหว่าง `pnpm install --frozen-lockfile` แสดงว่า VM มีหน่วยความจำไม่เพียงพอ ให้ใช้ `e2-small` เป็นอย่างน้อย หรือใช้ `e2-medium` เพื่อให้การสร้างครั้งแรกเชื่อถือได้มากขึ้น

    เมื่อผูกกับ LAN (`OPENCLAW_GATEWAY_BIND=lan`) ให้กำหนดต้นทางของเบราว์เซอร์ที่เชื่อถือได้ก่อนดำเนินการต่อ:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    หากคุณเปลี่ยนพอร์ต ให้แทนที่ `18789` ด้วยพอร์ตที่กำหนดไว้

  </Step>

  <Step title="Access from your laptop">
    สร้างอุโมงค์ SSH เพื่อส่งต่อพอร์ตของ Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    เปิด `http://127.0.0.1:18789/` ในเบราว์เซอร์

    แสดงลิงก์แดชบอร์ดที่ไม่มีข้อมูลส่วนเกินอีกครั้ง:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    หาก UI ขอการยืนยันตัวตนด้วยข้อมูลลับที่ใช้ร่วมกัน ให้วางโทเค็นหรือ
    รหัสผ่านที่กำหนดค่าไว้ในการตั้งค่า UI ควบคุม (ขั้นตอน Docker นี้จะเขียนโทเค็น
    โดยค่าเริ่มต้น หากคุณเปลี่ยนเป็นการยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่าน
    ที่กำหนดไว้แทน)

    หาก UI ควบคุมแสดง `unauthorized` หรือ `disconnected (1008): pairing required` ให้อนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    โปรดดูแผนผังการจัดเก็บถาวรที่ใช้ร่วมกันใน [รันไทม์ VM ของ Docker](/th/install/docker-vm-runtime#what-persists-where) และดู [ขั้นตอนการอัปเดต](/th/install/docker-vm-runtime#updates)

  </Step>
</Steps>

## การแก้ไขปัญหา

**การเชื่อมต่อ SSH ถูกปฏิเสธ**

การเผยแพร่คีย์ SSH อาจใช้เวลา 1-2 นาทีหลังสร้าง VM ให้รอแล้วลองใหม่

**ปัญหา OS Login**

ตรวจสอบโปรไฟล์ OS Login ของคุณ:

```bash
gcloud compute os-login describe-profile
```

ตรวจสอบว่าบัญชีของคุณมีสิทธิ์ IAM ที่จำเป็น (Compute OS Login หรือ Compute OS Admin Login)

**หน่วยความจำไม่เพียงพอ (OOM)**

หากการสร้าง Docker ล้มเหลวโดยแสดง `Killed` และ `exit code 137` แสดงว่า VM ถูกระบบยุติเนื่องจากหน่วยความจำไม่เพียงพอ:

```bash
# Stop the VM first
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Start the VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

## บัญชีบริการ (แนวทางปฏิบัติที่ดีที่สุดด้านความปลอดภัย)

สำหรับการใช้งานส่วนบุคคล บัญชีผู้ใช้เริ่มต้นของคุณก็เพียงพอ สำหรับระบบอัตโนมัติหรือ CI/CD ให้สร้างบัญชีบริการโดยเฉพาะซึ่งมีสิทธิ์ขั้นต่ำ:

```bash
gcloud iam service-accounts create openclaw-deploy \
  --display-name="OpenClaw Deployment"

gcloud projects add-iam-policy-binding my-openclaw-project \
  --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

หลีกเลี่ยงบทบาท Owner สำหรับระบบอัตโนมัติ ให้ใช้บทบาทที่มีขอบเขตแคบที่สุดซึ่งยังใช้งานได้ โปรดดู [ทำความเข้าใจบทบาท](https://cloud.google.com/iam/docs/understanding-roles)

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางรับส่งข้อความ: [ช่องทาง](/th/channels)
- จับคู่อุปกรณ์ภายในเครื่องเป็น Node: [Node](/th/nodes)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Azure](/th/install/azure)
- [การโฮสต์บน VPS](/th/vps)
