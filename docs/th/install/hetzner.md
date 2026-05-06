---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานตลอด 24/7 บน VPS บนคลาวด์ (ไม่ใช่บนแล็ปท็อปของคุณ)
    - คุณต้องการ Gateway ระดับใช้งานจริงที่เปิดทำงานตลอดเวลาบน VPS ของคุณเอง
    - คุณต้องการควบคุมการคงอยู่ของข้อมูล ไบนารี และพฤติกรรมการรีสตาร์ทอย่างเต็มที่
    - คุณกำลังใช้งาน OpenClaw ใน Docker บน Hetzner หรือผู้ให้บริการที่คล้ายกัน
summary: เรียกใช้ OpenClaw Gateway ตลอด 24/7 บน Hetzner VPS ราคาถูก (Docker) พร้อมสถานะที่คงทนและไบนารีที่ฝังมาในตัว
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T09:19:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2625a028b6242f653d29b8f45035bf2d796c5c60453582cf269fd1c3776eca52
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw บน Hetzner (Docker, คู่มือ VPS สำหรับ Production)

## เป้าหมาย

เรียกใช้ OpenClaw Gateway แบบถาวรบน Hetzner VPS โดยใช้ Docker พร้อมสถานะที่คงทน ไบนารีที่อบไว้ในอิมเมจ และพฤติกรรมการรีสตาร์ตที่ปลอดภัย

หากคุณต้องการ "OpenClaw ตลอด 24/7 ในราคาประมาณ $5" นี่คือการตั้งค่าที่เชื่อถือได้และง่ายที่สุด
ราคาของ Hetzner เปลี่ยนแปลงได้ ให้เลือก Debian/Ubuntu VPS ขนาดเล็กที่สุด แล้วค่อยขยายหากเจอ OOM

คำเตือนเกี่ยวกับโมเดลความปลอดภัย:

- agent ที่แชร์กันในบริษัทใช้ได้เมื่อทุกคนอยู่ในขอบเขตความไว้วางใจเดียวกัน และ runtime ใช้เพื่อธุรกิจเท่านั้น
- แยกให้ชัดเจน: VPS/runtime เฉพาะ + บัญชีเฉพาะ; อย่าใช้โปรไฟล์ Apple/Google/เบราว์เซอร์/ตัวจัดการรหัสผ่านส่วนตัวบนโฮสต์นั้น
- หากผู้ใช้มีความเป็นปฏิปักษ์ต่อกัน ให้แยกตาม gateway/host/ผู้ใช้ OS

ดู [ความปลอดภัย](/th/gateway/security) และ [การโฮสต์ VPS](/th/vps)

## เรากำลังทำอะไร (แบบเข้าใจง่าย)?

- เช่าเซิร์ฟเวอร์ Linux ขนาดเล็ก (Hetzner VPS)
- ติดตั้ง Docker (runtime แอปแบบแยกส่วน)
- เริ่ม OpenClaw Gateway ใน Docker
- คงสถานะ `~/.openclaw` + `~/.openclaw/workspace` ไว้บนโฮสต์ (อยู่รอดหลังรีสตาร์ต/สร้างใหม่)
- เข้าถึง Control UI จากแล็ปท็อปของคุณผ่าน SSH tunnel

สถานะ `~/.openclaw` ที่ mount ไว้นั้นรวมถึง `openclaw.json`, ต่อ agent
`agents/<agentId>/agent/auth-profiles.json`, และ `.env`

สามารถเข้าถึง Gateway ได้ผ่าน:

- SSH port forwarding จากแล็ปท็อปของคุณ
- การเปิด port โดยตรง หากคุณจัดการ firewall และ token เอง

คู่มือนี้สมมติว่าใช้ Ubuntu หรือ Debian บน Hetzner  
หากคุณใช้ Linux VPS อื่น ให้เทียบแพ็กเกจให้สอดคล้องกัน
สำหรับขั้นตอน Docker ทั่วไป ดู [Docker](/th/install/docker)

---

## เส้นทางด่วน (สำหรับผู้ดูแลระบบที่มีประสบการณ์)

1. จัดเตรียม Hetzner VPS
2. ติดตั้ง Docker
3. Clone repository ของ OpenClaw
4. สร้างไดเรกทอรีโฮสต์แบบถาวร
5. กำหนดค่า `.env` และ `docker-compose.yml`
6. อบไบนารีที่จำเป็นเข้าไปในอิมเมจ
7. `docker compose up -d`
8. ตรวจสอบ persistence และการเข้าถึง Gateway

---

## สิ่งที่คุณต้องมี

- Hetzner VPS พร้อมสิทธิ์ root
- การเข้าถึง SSH จากแล็ปท็อปของคุณ
- ความคุ้นเคยพื้นฐานกับ SSH + การคัดลอก/วาง
- ประมาณ 20 นาที
- Docker และ Docker Compose
- ข้อมูลยืนยันตัวตนสำหรับโมเดล
- ข้อมูลยืนยันตัวตนของ provider แบบไม่บังคับ
  - WhatsApp QR
  - token บอต Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="จัดเตรียม VPS">
    สร้าง Ubuntu หรือ Debian VPS ใน Hetzner

    เชื่อมต่อในฐานะ root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    คู่มือนี้สมมติว่า VPS มีสถานะถาวร
    อย่าปฏิบัติกับมันเหมือนโครงสร้างพื้นฐานที่ทิ้งได้

  </Step>

  <Step title="ติดตั้ง Docker (บน VPS)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    ตรวจสอบ:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Clone repository ของ OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    คู่มือนี้สมมติว่าคุณจะ build อิมเมจแบบกำหนดเองเพื่อรับประกันว่าไบนารีจะคงอยู่

  </Step>

  <Step title="สร้างไดเรกทอรีโฮสต์แบบถาวร">
    Docker container เป็นแบบชั่วคราว
    สถานะที่ต้องอยู่ระยะยาวทั้งหมดต้องอยู่บนโฮสต์

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="กำหนดค่าตัวแปรสภาพแวดล้อม">
    สร้าง `.env` ในรากของ repository

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    เว้น `OPENCLAW_GATEWAY_TOKEN` ว่างไว้ เว้นแต่คุณต้องการจัดการมันผ่าน `.env` อย่างชัดเจน; OpenClaw จะเขียน token ของ gateway แบบสุ่มลงใน config เมื่อเริ่มครั้งแรก สร้างรหัสผ่าน keyring แล้ววางลงใน
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **อย่า commit ไฟล์นี้**

    ไฟล์ `.env` นี้ใช้สำหรับ env ของ container/runtime เช่น `OPENCLAW_GATEWAY_TOKEN`
    การยืนยันตัวตน OAuth/API-key ของ provider ที่จัดเก็บไว้จะอยู่ในไฟล์ที่ mount
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

  </Step>

  <Step title="การกำหนดค่า Docker Compose">
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
          # Recommended: keep the Gateway loopback-only on the VPS; access via SSH tunnel.
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

    `--allow-unconfigured` ใช้เพื่อความสะดวกในการ bootstrap เท่านั้น ไม่ใช่สิ่งทดแทนการกำหนดค่า gateway ที่เหมาะสม ให้ยังคงตั้งค่า auth (`gateway.auth.token` หรือรหัสผ่าน) และใช้การตั้งค่า bind ที่ปลอดภัยสำหรับ deployment ของคุณ

  </Step>

  <Step title="ขั้นตอน runtime ของ Docker VM ที่ใช้ร่วมกัน">
    ใช้คู่มือ runtime ที่ใช้ร่วมกันสำหรับขั้นตอนทั่วไปของโฮสต์ Docker:

    - [อบไบนารีที่จำเป็นเข้าไปในอิมเมจ](/th/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Build และเปิดใช้งาน](/th/install/docker-vm-runtime#build-and-launch)
    - [อะไรคงอยู่ที่ไหน](/th/install/docker-vm-runtime#what-persists-where)
    - [การอัปเดต](/th/install/docker-vm-runtime#updates)

  </Step>

  <Step title="การเข้าถึงเฉพาะของ Hetzner">
    หลังจากขั้นตอน build และเปิดใช้งานแบบใช้ร่วมกัน ให้ตั้งค่าต่อไปนี้ให้เสร็จเพื่อเปิด tunnel:

    **ข้อกำหนดเบื้องต้น:** ตรวจสอบว่า config sshd ของ VPS อนุญาต TCP forwarding หากคุณ
    hardened config SSH ไว้ ให้ตรวจสอบ `/etc/ssh/sshd_config` และตั้งค่า:

    ```
    AllowTcpForwarding local
    ```

    `local` อนุญาต local forward ด้วย `ssh -L` จากแล็ปท็อปของคุณ พร้อมบล็อก
    remote forward จากเซิร์ฟเวอร์ การตั้งค่าเป็น `no` จะทำให้ tunnel ล้มเหลว
    ด้วย:
    `channel 3: open failed: administratively prohibited: open failed`

    หลังจากยืนยันว่าเปิด TCP forwarding แล้ว ให้รีสตาร์ตบริการ SSH
    (`systemctl restart ssh`) และรัน tunnel จากแล็ปท็อปของคุณ:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    เปิด:

    `http://127.0.0.1:18789/`

    วาง shared secret ที่กำหนดค่าไว้ คู่มือนี้ใช้ token ของ gateway เป็นค่าเริ่มต้น; หากคุณเปลี่ยนไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

  </Step>
</Steps>

แผนผัง persistence ที่ใช้ร่วมกันอยู่ใน [Docker VM Runtime](/th/install/docker-vm-runtime#what-persists-where)

## Infrastructure as Code (Terraform)

สำหรับทีมที่ต้องการ workflow แบบ infrastructure-as-code มีการตั้งค่า Terraform ที่ดูแลโดยชุมชน ซึ่งมี:

- การกำหนดค่า Terraform แบบโมดูลาร์พร้อมการจัดการ remote state
- การจัดเตรียมอัตโนมัติผ่าน cloud-init
- สคริปต์ deployment (bootstrap, deploy, backup/restore)
- การเสริมความปลอดภัย (firewall, UFW, การเข้าถึงผ่าน SSH เท่านั้น)
- การกำหนดค่า SSH tunnel สำหรับการเข้าถึง gateway

**Repositories:**

- Infrastructure: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Config Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

แนวทางนี้เสริมการตั้งค่า Docker ข้างต้นด้วย deployment ที่ทำซ้ำได้ โครงสร้างพื้นฐานที่ควบคุมเวอร์ชันได้ และการกู้คืนเมื่อเกิดภัยพิบัติแบบอัตโนมัติ

<Note>
ดูแลโดยชุมชน สำหรับปัญหาหรือการมีส่วนร่วม โปรดดูลิงก์ repository ด้านบน
</Note>

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางการส่งข้อความ: [ช่องทาง](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- ทำให้ OpenClaw อัปเดตอยู่เสมอ: [การอัปเดต](/th/install/updating)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Fly.io](/th/install/fly)
- [Docker](/th/install/docker)
- [การโฮสต์ VPS](/th/vps)
