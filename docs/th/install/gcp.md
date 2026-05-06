---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานตลอด 24/7 บน GCP
    - คุณต้องการ Gateway ระดับใช้งานจริงที่ทำงานตลอดเวลาบน VM ของคุณเอง
    - คุณต้องการควบคุมการคงอยู่ ไบนารี และพฤติกรรมการรีสตาร์ตอย่างเต็มที่
summary: เรียกใช้ OpenClaw Gateway ตลอด 24/7 บน GCP Compute Engine VM (Docker) พร้อมสถานะที่คงอยู่ถาวร
title: GCP
x-i18n:
    generated_at: "2026-05-06T09:19:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: eefd3a324ababdaa3072cda5354c1d59ddfe80c2f88f24a4ad21208f54636e89
    source_path: install/gcp.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway แบบถาวรบน GCP Compute Engine VM ด้วย Docker พร้อมสถานะที่คงทน ไบนารีที่รวมไว้ในอิมเมจ และพฤติกรรมการรีสตาร์ตที่ปลอดภัย

ถ้าคุณต้องการ "OpenClaw ตลอด 24/7 ในราคาประมาณ ~$5-12/เดือน" นี่คือการตั้งค่าที่เชื่อถือได้บน Google Cloud
ราคาจะแตกต่างกันตามประเภทเครื่องและภูมิภาค เลือก VM ที่เล็กที่สุดซึ่งรองรับงานของคุณได้ และขยายขึ้นถ้าคุณเจอ OOM

## เรากำลังทำอะไรอยู่ (อธิบายแบบง่าย)?

- สร้างโปรเจกต์ GCP และเปิดใช้การเรียกเก็บเงิน
- สร้าง Compute Engine VM
- ติดตั้ง Docker (รันไทม์แอปแบบแยกส่วน)
- เริ่ม OpenClaw Gateway ใน Docker
- ทำให้ `~/.openclaw` + `~/.openclaw/workspace` อยู่ถาวรบนโฮสต์ (คงอยู่หลังรีสตาร์ต/สร้างใหม่)
- เข้าถึง Control UI จากแล็ปท็อปของคุณผ่านอุโมงค์ SSH

สถานะ `~/.openclaw` ที่เมานต์นั้นประกอบด้วย `openclaw.json`, ต่อเอเจนต์
`agents/<agentId>/agent/auth-profiles.json` และ `.env`

สามารถเข้าถึง Gateway ได้ผ่าน:

- การส่งต่อพอร์ต SSH จากแล็ปท็อปของคุณ
- การเปิดพอร์ตโดยตรงถ้าคุณจัดการไฟร์วอลล์และโทเค็นเอง

คู่มือนี้ใช้ Debian บน GCP Compute Engine
Ubuntu ก็ใช้ได้เช่นกัน ให้เทียบแพ็กเกจให้สอดคล้องกัน
สำหรับขั้นตอน Docker ทั่วไป ดู [Docker](/th/install/docker)

---

## เส้นทางด่วน (ผู้ปฏิบัติงานที่มีประสบการณ์)

1. สร้างโปรเจกต์ GCP + เปิดใช้ Compute Engine API
2. สร้าง Compute Engine VM (e2-small, Debian 12, 20GB)
3. SSH เข้า VM
4. ติดตั้ง Docker
5. โคลนที่เก็บ OpenClaw
6. สร้างไดเรกทอรีโฮสต์แบบถาวร
7. กำหนดค่า `.env` และ `docker-compose.yml`
8. รวมไบนารีที่จำเป็นไว้ในอิมเมจ สร้าง และเริ่มใช้งาน

---

## สิ่งที่คุณต้องมี

- บัญชี GCP (มีสิทธิ์ใช้ free tier สำหรับ e2-micro)
- ติดตั้ง gcloud CLI แล้ว (หรือใช้ Cloud Console)
- การเข้าถึง SSH จากแล็ปท็อปของคุณ
- คุ้นเคยพื้นฐานกับ SSH + การคัดลอก/วาง
- ประมาณ 20-30 นาที
- Docker และ Docker Compose
- ข้อมูลรับรองการยืนยันตัวตนของโมเดล
- ข้อมูลรับรองผู้ให้บริการเสริม
  - WhatsApp QR
  - โทเค็นบอต Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Install gcloud CLI (or use Console)">
    **ตัวเลือก A: gcloud CLI** (แนะนำสำหรับระบบอัตโนมัติ)

    ติดตั้งจาก [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    เริ่มต้นและยืนยันตัวตน:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **ตัวเลือก B: Cloud Console**

    ทุกขั้นตอนสามารถทำผ่านเว็บ UI ได้ที่ [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Create a GCP project">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    เปิดใช้การเรียกเก็บเงินที่ [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (จำเป็นสำหรับ Compute Engine)

    เปิดใช้ Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. ไปที่ IAM & Admin > Create Project
    2. ตั้งชื่อและสร้าง
    3. เปิดใช้การเรียกเก็บเงินสำหรับโปรเจกต์
    4. ไปที่ APIs & Services > Enable APIs > ค้นหา "Compute Engine API" > Enable

  </Step>

  <Step title="Create the VM">
    **ประเภทเครื่อง:**

    | ประเภท      | สเปก                    | ค่าใช้จ่าย               | หมายเหตุ                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, RAM 4GB          | ~$25/เดือน            | เชื่อถือได้มากที่สุดสำหรับการสร้าง Docker ภายในเครื่อง        |
    | e2-small  | 2 vCPU, RAM 2GB          | ~$12/เดือน            | ขั้นต่ำที่แนะนำสำหรับการสร้าง Docker         |
    | e2-micro  | 2 vCPU (ใช้ร่วมกัน), RAM 1GB | มีสิทธิ์ free tier | มักล้มเหลวจาก Docker build OOM (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. ไปที่ Compute Engine > VM instances > Create instance
    2. ชื่อ: `openclaw-gateway`
    3. ภูมิภาค: `us-central1`, โซน: `us-central1-a`
    4. ประเภทเครื่อง: `e2-small`
    5. ดิสก์บูต: Debian 12, 20GB
    6. สร้าง

  </Step>

  <Step title="SSH into the VM">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    คลิกปุ่ม "SSH" ถัดจาก VM ของคุณในแดชบอร์ด Compute Engine

    หมายเหตุ: การเผยแพร่คีย์ SSH อาจใช้เวลา 1-2 นาทีหลังสร้าง VM ถ้าการเชื่อมต่อถูกปฏิเสธ ให้รอแล้วลองใหม่

  </Step>

  <Step title="Install Docker (on the VM)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    ออกจากระบบแล้วเข้าสู่ระบบใหม่เพื่อให้การเปลี่ยนกลุ่มมีผล:

    ```bash
    exit
    ```

    จากนั้น SSH กลับเข้าไป:

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

    คู่มือนี้ถือว่าคุณจะสร้างอิมเมจแบบกำหนดเองเพื่อรับประกันว่าไบนารีจะคงอยู่

  </Step>

  <Step title="Create persistent host directories">
    คอนเทนเนอร์ Docker เป็นแบบชั่วคราว
    สถานะที่ต้องอยู่ระยะยาวทั้งหมดต้องอยู่บนโฮสต์

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Configure environment variables">
    สร้าง `.env` ในรากของที่เก็บ

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

    เว้น `OPENCLAW_GATEWAY_TOKEN` ให้ว่างไว้ เว้นแต่คุณต้องการจัดการอย่างชัดเจน
    ผ่าน `.env`; OpenClaw จะเขียนโทเค็น Gateway แบบสุ่มลงใน
    คอนฟิกเมื่อเริ่มครั้งแรก สร้างรหัสผ่าน keyring แล้ววางลงใน
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **อย่า commit ไฟล์นี้**

    ไฟล์ `.env` นี้ใช้สำหรับ env ของคอนเทนเนอร์/รันไทม์ เช่น `OPENCLAW_GATEWAY_TOKEN`
    การยืนยันตัวตน OAuth/API-key ของผู้ให้บริการที่จัดเก็บไว้จะอยู่ใน
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ที่เมานต์ไว้

  </Step>

  <Step title="Docker Compose configuration">
    สร้างหรืออัปเดต `docker-compose.yml`

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

    `--allow-unconfigured` มีไว้เพื่อความสะดวกในการบูตสแตรปเท่านั้น ไม่ใช่สิ่งทดแทนการกำหนดค่า Gateway ที่เหมาะสม ยังคงต้องตั้งค่าการยืนยันตัวตน (`gateway.auth.token` หรือรหัสผ่าน) และใช้การตั้งค่า bind ที่ปลอดภัยสำหรับการติดตั้งใช้งานของคุณ

  </Step>

  <Step title="Shared Docker VM runtime steps">
    ใช้คู่มือรันไทม์ที่ใช้ร่วมกันสำหรับขั้นตอนทั่วไปของโฮสต์ Docker:

    - [รวมไบนารีที่จำเป็นไว้ในอิมเมจ](/th/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [สร้างและเริ่มใช้งาน](/th/install/docker-vm-runtime#build-and-launch)
    - [อะไรคงอยู่ที่ไหน](/th/install/docker-vm-runtime#what-persists-where)
    - [การอัปเดต](/th/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP-specific launch notes">
    บน GCP ถ้าการสร้างล้มเหลวด้วย `Killed` หรือ `exit code 137` ระหว่าง `pnpm install --frozen-lockfile` แสดงว่า VM หน่วยความจำไม่พอ ใช้ `e2-small` เป็นอย่างน้อย หรือ `e2-medium` เพื่อให้การสร้างครั้งแรกเชื่อถือได้มากขึ้น

    เมื่อ bind ไปยัง LAN (`OPENCLAW_GATEWAY_BIND=lan`) ให้กำหนดค่า origin ของเบราว์เซอร์ที่เชื่อถือได้ก่อนดำเนินการต่อ:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    ถ้าคุณเปลี่ยนพอร์ต Gateway ให้แทนที่ `18789` ด้วยพอร์ตที่คุณกำหนดค่าไว้

  </Step>

  <Step title="Access from your laptop">
    สร้างอุโมงค์ SSH เพื่อส่งต่อพอร์ต Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    เปิดในเบราว์เซอร์ของคุณ:

    `http://127.0.0.1:18789/`

    พิมพ์ลิงก์แดชบอร์ดที่สะอาดอีกครั้ง:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    ถ้า UI ขอการยืนยันตัวตนแบบ shared-secret ให้วางโทเค็นหรือ
    รหัสผ่านที่กำหนดค่าไว้ใน Control UI settings ขั้นตอน Docker นี้เขียนโทเค็น
    โดยค่าเริ่มต้น; ถ้าคุณสลับคอนฟิกคอนเทนเนอร์ไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้
    รหัสผ่านนั้นแทน

    ถ้า Control UI แสดง `unauthorized` หรือ `disconnected (1008): pairing required` ให้อนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    ต้องการข้อมูลอ้างอิงเรื่องความคงอยู่ที่ใช้ร่วมกันและการอัปเดตอีกครั้งหรือไม่?
    ดู [Docker VM Runtime](/th/install/docker-vm-runtime#what-persists-where) และ [การอัปเดต Docker VM Runtime](/th/install/docker-vm-runtime#updates)

  </Step>
</Steps>

---

## การแก้ไขปัญหา

**การเชื่อมต่อ SSH ถูกปฏิเสธ**

การเผยแพร่คีย์ SSH อาจใช้เวลา 1-2 นาทีหลังสร้าง VM ให้รอแล้วลองใหม่

**ปัญหา OS Login**

ตรวจสอบโปรไฟล์ OS Login ของคุณ:

```bash
gcloud compute os-login describe-profile
```

ตรวจสอบให้แน่ใจว่าบัญชีของคุณมีสิทธิ์ IAM ที่จำเป็น (Compute OS Login หรือ Compute OS Admin Login)

**หน่วยความจำไม่พอ (OOM)**

ถ้า Docker build ล้มเหลวด้วย `Killed` และ `exit code 137` แสดงว่า VM ถูก OOM-killed อัปเกรดเป็น e2-small (ขั้นต่ำ) หรือ e2-medium (แนะนำสำหรับการสร้างภายในเครื่องที่เชื่อถือได้):

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

---

## บัญชีบริการ (แนวทางปฏิบัติด้านความปลอดภัยที่ดีที่สุด)

สำหรับการใช้งานส่วนตัว บัญชีผู้ใช้เริ่มต้นของคุณใช้ได้ดี

สำหรับระบบอัตโนมัติหรือไปป์ไลน์ CI/CD ให้สร้างบัญชีบริการเฉพาะที่มีสิทธิ์ขั้นต่ำ:

1. สร้างบัญชีบริการ:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. ให้สิทธิ์บทบาท Compute Instance Admin (หรือบทบาทกำหนดเองที่แคบกว่า):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

หลีกเลี่ยงการใช้บทบาท Owner สำหรับระบบอัตโนมัติ ใช้หลักการให้สิทธิ์เท่าที่จำเป็น

ดู [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles) สำหรับรายละเอียดบทบาท IAM

---

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางการรับส่งข้อความ: [ช่องทาง](/th/channels)
- จับคู่อุปกรณ์ภายในเครื่องให้เป็นโหนด: [โหนด](/th/nodes)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Azure](/th/install/azure)
- [การโฮสต์บน VPS](/th/vps)
