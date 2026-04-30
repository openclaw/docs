---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานตลอด 24 ชั่วโมงทุกวันบนเซิร์ฟเวอร์ส่วนตัวเสมือนบนคลาวด์ (ไม่ใช่บนแล็ปท็อปของคุณ)
    - คุณต้องการ Gateway ระดับโปรดักชันที่ทำงานตลอดเวลาบน VPS ของคุณเอง
    - คุณต้องการควบคุมการคงอยู่ ไบนารี และพฤติกรรมการรีสตาร์ทได้อย่างเต็มที่
    - คุณกำลังเรียกใช้ OpenClaw ใน Docker บน Hetzner หรือผู้ให้บริการที่คล้ายกัน
summary: เรียกใช้ OpenClaw Gateway ตลอด 24/7 บน Hetzner VPS ราคาประหยัด (Docker) พร้อมสถานะถาวรและไบนารีที่รวมมาในตัว
title: Hetzner
x-i18n:
    generated_at: "2026-04-30T10:00:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96b5b54bfd8d976c575ecffcd229106fc322b9a53828a9d7358f583434b7bbc2
    source_path: install/hetzner.md
    workflow: 16
---

# OpenClaw บน Hetzner (Docker, คู่มือ VPS สำหรับการใช้งานจริง)

## เป้าหมาย

เรียกใช้ OpenClaw Gateway แบบถาวรบน Hetzner VPS โดยใช้ Docker พร้อมสถานะที่คงทน ไบนารีที่ฝังมากับอิมเมจ และพฤติกรรมการรีสตาร์ตที่ปลอดภัย

ถ้าคุณต้องการ “OpenClaw ตลอด 24/7 ในราคา ~$5” นี่คือการตั้งค่าที่เรียบง่ายและเชื่อถือได้ที่สุด
ราคาของ Hetzner อาจเปลี่ยนแปลงได้ ให้เลือก Debian/Ubuntu VPS ขนาดเล็กที่สุด แล้วค่อยขยายขนาดหากพบปัญหา OOM

คำเตือนเกี่ยวกับโมเดลความปลอดภัย:

- เอเจนต์ที่ใช้ร่วมกันในบริษัทใช้ได้เมื่อทุกคนอยู่ภายในขอบเขตความไว้วางใจเดียวกัน และ runtime ใช้สำหรับธุรกิจเท่านั้น
- รักษาการแยกอย่างเข้มงวด: VPS/runtime เฉพาะ + บัญชีเฉพาะ; ห้ามมีโปรไฟล์ Apple/Google/เบราว์เซอร์/ตัวจัดการรหัสผ่านส่วนตัวบนโฮสต์นั้น
- หากผู้ใช้มีแนวโน้มเป็นปฏิปักษ์ต่อกัน ให้แยกตาม gateway/โฮสต์/ผู้ใช้ OS

ดู [ความปลอดภัย](/th/gateway/security) และ [การโฮสต์ VPS](/th/vps)

## เรากำลังทำอะไรอยู่ (แบบเข้าใจง่าย)?

- เช่าเซิร์ฟเวอร์ Linux ขนาดเล็ก (Hetzner VPS)
- ติดตั้ง Docker (runtime แอปแบบแยกส่วน)
- เริ่ม OpenClaw Gateway ใน Docker
- เก็บ `~/.openclaw` + `~/.openclaw/workspace` แบบถาวรบนโฮสต์ (ยังอยู่หลังรีสตาร์ต/สร้างใหม่)
- เข้าถึง Control UI จากแล็ปท็อปผ่านอุโมงค์ SSH

สถานะ `~/.openclaw` ที่เมานต์ไว้นั้นประกอบด้วย `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` แยกตามเอเจนต์ และ `.env`

Gateway สามารถเข้าถึงได้ผ่าน:

- การส่งต่อพอร์ต SSH จากแล็ปท็อปของคุณ
- การเปิดพอร์ตโดยตรง หากคุณจัดการไฟร์วอลล์และโทเคนด้วยตัวเอง

คู่มือนี้ถือว่าคุณใช้ Ubuntu หรือ Debian บน Hetzner  
หากคุณใช้ Linux VPS อื่น ให้จับคู่แพ็กเกจให้เหมาะสม
สำหรับขั้นตอน Docker แบบทั่วไป ดู [Docker](/th/install/docker)

---

## เส้นทางด่วน (สำหรับผู้ปฏิบัติงานที่มีประสบการณ์)

1. จัดเตรียม Hetzner VPS
2. ติดตั้ง Docker
3. โคลนที่เก็บ OpenClaw
4. สร้างไดเรกทอรีโฮสต์แบบถาวร
5. กำหนดค่า `.env` และ `docker-compose.yml`
6. ฝังไบนารีที่จำเป็นลงในอิมเมจ
7. `docker compose up -d`
8. ตรวจสอบการคงอยู่ของข้อมูลและการเข้าถึง Gateway

---

## สิ่งที่คุณต้องมี

- Hetzner VPS พร้อมสิทธิ์ root
- การเข้าถึง SSH จากแล็ปท็อปของคุณ
- ความคุ้นเคยพื้นฐานกับ SSH + การคัดลอก/วาง
- ~20 นาที
- Docker และ Docker Compose
- ข้อมูลรับรองการยืนยันตัวตนของโมเดล
- ข้อมูลรับรองผู้ให้บริการเพิ่มเติม
  - WhatsApp QR
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="จัดเตรียม VPS">
    สร้าง Ubuntu หรือ Debian VPS ใน Hetzner

    เชื่อมต่อเป็น root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    คู่มือนี้ถือว่า VPS มีสถานะแบบถาวร
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

  <Step title="โคลนที่เก็บ OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    คู่มือนี้ถือว่าคุณจะสร้างอิมเมจแบบกำหนดเองเพื่อรับประกันการคงอยู่ของไบนารี

  </Step>

  <Step title="สร้างไดเรกทอรีโฮสต์แบบถาวร">
    คอนเทนเนอร์ Docker เป็นแบบชั่วคราว
    สถานะที่ต้องอยู่ระยะยาวทั้งหมดต้องอยู่บนโฮสต์

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="กำหนดค่าตัวแปรสภาพแวดล้อม">
    สร้าง `.env` ในรากของที่เก็บ

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

    เว้น `OPENCLAW_GATEWAY_TOKEN` ว่างไว้ เว้นแต่คุณต้องการจัดการผ่าน `.env` อย่างชัดเจน; OpenClaw จะเขียน gateway token แบบสุ่มลงใน config เมื่อเริ่มครั้งแรก สร้างรหัสผ่าน keyring แล้ววางลงใน `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **อย่า commit ไฟล์นี้**

    ไฟล์ `.env` นี้ใช้สำหรับ env ของ container/runtime เช่น `OPENCLAW_GATEWAY_TOKEN`
    การยืนยันตัวตน OAuth/API-key ของผู้ให้บริการที่จัดเก็บไว้จะอยู่ใน
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ที่เมานต์ไว้

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

    `--allow-unconfigured` ใช้เพื่อความสะดวกในการ bootstrap เท่านั้น ไม่ใช่สิ่งทดแทนการกำหนดค่า gateway ที่เหมาะสม ยังคงต้องตั้งค่าการยืนยันตัวตน (`gateway.auth.token` หรือรหัสผ่าน) และใช้การตั้งค่า bind ที่ปลอดภัยสำหรับการปรับใช้ของคุณ

  </Step>

  <Step title="ขั้นตอน runtime Docker VM ที่ใช้ร่วมกัน">
    ใช้คู่มือ runtime ที่ใช้ร่วมกันสำหรับขั้นตอนโฮสต์ Docker ทั่วไป:

    - [ฝังไบนารีที่จำเป็นลงในอิมเมจ](/th/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [สร้างและเปิดใช้งาน](/th/install/docker-vm-runtime#build-and-launch)
    - [สิ่งใดคงอยู่ที่ใด](/th/install/docker-vm-runtime#what-persists-where)
    - [การอัปเดต](/th/install/docker-vm-runtime#updates)

  </Step>

  <Step title="การเข้าถึงเฉพาะสำหรับ Hetzner">
    หลังจากขั้นตอนสร้างและเปิดใช้งานที่ใช้ร่วมกัน ให้ตั้งค่าต่อไปนี้ให้เสร็จเพื่อเปิดอุโมงค์:

    **ข้อกำหนดเบื้องต้น:** ตรวจสอบให้แน่ใจว่า config sshd ของ VPS อนุญาตการส่งต่อ TCP หากคุณ
    ได้ทำให้ config SSH ของคุณเข้มงวดขึ้น ให้ตรวจสอบ `/etc/ssh/sshd_config` และตั้งค่า:

    ```
    AllowTcpForwarding local
    ```

    `local` อนุญาตการส่งต่อภายในเครื่องด้วย `ssh -L` จากแล็ปท็อปของคุณ พร้อมกับบล็อก
    การส่งต่อระยะไกลจากเซิร์ฟเวอร์ การตั้งค่าเป็น `no` จะทำให้อุโมงค์ล้มเหลว
    พร้อมข้อความ:
    `channel 3: open failed: administratively prohibited: open failed`

    หลังจากยืนยันว่าเปิดใช้งานการส่งต่อ TCP แล้ว ให้รีสตาร์ตบริการ SSH
    (`systemctl restart ssh`) และเรียกใช้อุโมงค์จากแล็ปท็อปของคุณ:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    เปิด:

    `http://127.0.0.1:18789/`

    วาง shared secret ที่กำหนดค่าไว้ คู่มือนี้ใช้ gateway token โดย
    ค่าเริ่มต้น; หากคุณเปลี่ยนไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

  </Step>
</Steps>

แผนผังการคงอยู่แบบใช้ร่วมกันอยู่ใน [Docker VM Runtime](/th/install/docker-vm-runtime#what-persists-where)

## โครงสร้างพื้นฐานเป็นโค้ด (Terraform)

สำหรับทีมที่ต้องการเวิร์กโฟลว์โครงสร้างพื้นฐานเป็นโค้ด การตั้งค่า Terraform ที่ดูแลโดยชุมชนมี:

- การกำหนดค่า Terraform แบบโมดูลาร์พร้อมการจัดการสถานะระยะไกล
- การจัดเตรียมอัตโนมัติผ่าน cloud-init
- สคริปต์การปรับใช้ (bootstrap, deploy, backup/restore)
- การเพิ่มความแข็งแกร่งด้านความปลอดภัย (ไฟร์วอลล์, UFW, การเข้าถึงผ่าน SSH เท่านั้น)
- การกำหนดค่าอุโมงค์ SSH สำหรับการเข้าถึง gateway

**ที่เก็บ:**

- โครงสร้างพื้นฐาน: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- config Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

แนวทางนี้ช่วยเสริมการตั้งค่า Docker ข้างต้นด้วยการปรับใช้ที่ทำซ้ำได้ โครงสร้างพื้นฐานที่ควบคุมเวอร์ชัน และการกู้คืนจากภัยพิบัติแบบอัตโนมัติ

<Note>
ดูแลโดยชุมชน สำหรับปัญหาหรือการมีส่วนร่วม โปรดดูลิงก์ที่เก็บข้างต้น
</Note>

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางส่งข้อความ: [ช่องทาง](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- อัปเดต OpenClaw ให้เป็นปัจจุบันอยู่เสมอ: [การอัปเดต](/th/install/updating)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Fly.io](/th/install/fly)
- [Docker](/th/install/docker)
- [การโฮสต์ VPS](/th/vps)
