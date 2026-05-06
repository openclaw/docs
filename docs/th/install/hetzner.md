---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานตลอด 24/7 บน VPS บนคลาวด์ (ไม่ใช่แล็ปท็อปของคุณ)
    - คุณต้องการ Gateway ระดับโปรดักชันที่ทำงานตลอดเวลาบน VPS ของคุณเอง
    - คุณต้องการควบคุมการคงอยู่ของข้อมูล ไบนารี และพฤติกรรมการรีสตาร์ทอย่างเต็มรูปแบบ
    - คุณกำลังเรียกใช้ OpenClaw ใน Docker บน Hetzner หรือผู้ให้บริการที่คล้ายกัน
summary: รัน OpenClaw Gateway ตลอด 24/7 บน VPS ราคาถูกของ Hetzner (Docker) พร้อมสถานะที่คงทนถาวรและไบนารีที่ฝังมาในตัว
title: Hetzner
x-i18n:
    generated_at: "2026-05-06T17:58:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6102649b381b3b1ecd6f52e1cf518fc36147fe143ebc8fd4be5f44ab26cb3b4d
    source_path: install/hetzner.md
    workflow: 16
---

## เป้าหมาย

รัน OpenClaw Gateway แบบถาวรบน Hetzner VPS โดยใช้ Docker พร้อมสถานะที่คงทน ไบนารีที่ฝังไว้ในอิมเมจ และพฤติกรรมการรีสตาร์ตที่ปลอดภัย

หากคุณต้องการ "OpenClaw ตลอด 24/7 ในราคา ~$5" นี่คือการตั้งค่าที่เรียบง่ายและเชื่อถือได้ที่สุด
ราคา Hetzner อาจเปลี่ยนแปลงได้; เลือก VPS Debian/Ubuntu ขนาดเล็กที่สุด แล้วค่อยขยายขนาดหากพบปัญหา OOM

ข้อเตือนใจเรื่องโมเดลความปลอดภัย:

- เอเจนต์ที่ใช้ร่วมกันในบริษัทใช้ได้เมื่อทุกคนอยู่ในขอบเขตความไว้วางใจเดียวกันและรันไทม์ใช้เพื่อธุรกิจเท่านั้น
- แยกอย่างเคร่งครัด: VPS/รันไทม์เฉพาะ + บัญชีเฉพาะ; ห้ามใช้โปรไฟล์ Apple/Google/เบราว์เซอร์/ตัวจัดการรหัสผ่านส่วนตัวบนโฮสต์นั้น
- หากผู้ใช้มีลักษณะเป็นปฏิปักษ์ต่อกัน ให้แยกตาม gateway/โฮสต์/ผู้ใช้ OS

ดู [ความปลอดภัย](/th/gateway/security) และ [การโฮสต์ VPS](/th/vps)

## เรากำลังทำอะไรอยู่ (แบบเข้าใจง่าย)?

- เช่าเซิร์ฟเวอร์ Linux ขนาดเล็ก (Hetzner VPS)
- ติดตั้ง Docker (รันไทม์แอปแบบแยกส่วน)
- เริ่ม OpenClaw Gateway ใน Docker
- เก็บ `~/.openclaw` + `~/.openclaw/workspace` ไว้บนโฮสต์แบบถาวร (ยังอยู่หลังรีสตาร์ต/สร้างใหม่)
- เข้าถึง Control UI จากแล็ปท็อปของคุณผ่าน SSH tunnel

สถานะ `~/.openclaw` ที่เมานต์ไว้นั้นรวมถึง `openclaw.json`, ไฟล์ต่อเอเจนต์
`agents/<agentId>/agent/auth-profiles.json` และ `.env`

สามารถเข้าถึง Gateway ได้ผ่าน:

- การส่งต่อพอร์ต SSH จากแล็ปท็อปของคุณ
- การเปิดพอร์ตโดยตรง หากคุณจัดการไฟร์วอลล์และโทเคนเอง

คู่มือนี้สมมติว่าใช้ Ubuntu หรือ Debian บน Hetzner  
หากคุณใช้ Linux VPS อื่น ให้เทียบแพ็กเกจตามความเหมาะสม
สำหรับขั้นตอน Docker ทั่วไป ดู [Docker](/th/install/docker)

---

## เส้นทางด่วน (สำหรับผู้ดูแลระบบที่มีประสบการณ์)

1. จัดเตรียม Hetzner VPS
2. ติดตั้ง Docker
3. โคลนรีโพซิทอรี OpenClaw
4. สร้างไดเรกทอรีโฮสต์แบบถาวร
5. กำหนดค่า `.env` และ `docker-compose.yml`
6. ฝังไบนารีที่จำเป็นลงในอิมเมจ
7. `docker compose up -d`
8. ตรวจสอบการคงอยู่ของข้อมูลและการเข้าถึง Gateway

---

## สิ่งที่คุณต้องมี

- Hetzner VPS พร้อมสิทธิ์ root
- การเข้าถึง SSH จากแล็ปท็อปของคุณ
- ใช้งาน SSH + คัดลอก/วางได้ในระดับพื้นฐาน
- ประมาณ 20 นาที
- Docker และ Docker Compose
- ข้อมูลรับรองการยืนยันตัวตนของโมเดล
- ข้อมูลรับรองผู้ให้บริการเสริม
  - WhatsApp QR
  - โทเคนบอต Telegram
  - Gmail OAuth

---

<Steps>
  <Step title="Provision the VPS">
    สร้าง VPS Ubuntu หรือ Debian ใน Hetzner

    เชื่อมต่อเป็น root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    คู่มือนี้สมมติว่า VPS มีสถานะแบบคงอยู่
    อย่าปฏิบัติต่อมันเหมือนโครงสร้างพื้นฐานที่ใช้แล้วทิ้ง

  </Step>

  <Step title="Install Docker (on the VPS)">
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

  <Step title="Clone the OpenClaw repository">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    คู่มือนี้สมมติว่าคุณจะสร้างอิมเมจแบบกำหนดเองเพื่อรับประกันว่าไบนารีจะคงอยู่

  </Step>

  <Step title="Create persistent host directories">
    คอนเทนเนอร์ Docker มีลักษณะชั่วคราว
    สถานะที่ต้องอยู่ระยะยาวทั้งหมดต้องอยู่บนโฮสต์

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Configure environment variables">
    สร้าง `.env` ในรากของรีโพซิทอรี

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

    ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` เมื่อคุณต้องการจัดการโทเคน gateway
    แบบคงที่ผ่าน `.env`; มิฉะนั้นให้กำหนดค่า `gateway.auth.token` ก่อน
    พึ่งพาไคลเอนต์ข้ามการรีสตาร์ต หากไม่มีแหล่งใดอยู่ OpenClaw จะใช้
    โทเคนเฉพาะรันไทม์สำหรับการเริ่มต้นครั้งนั้น สร้างรหัสผ่าน keyring แล้ววาง
    ลงใน `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **อย่า commit ไฟล์นี้**

    ไฟล์ `.env` นี้ใช้สำหรับ env ของคอนเทนเนอร์/รันไทม์ เช่น `OPENCLAW_GATEWAY_TOKEN`
    การยืนยันตัวตน OAuth/API-key ของผู้ให้บริการที่จัดเก็บไว้จะอยู่ในไฟล์ที่เมานต์
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

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

    `--allow-unconfigured` มีไว้เพื่อความสะดวกในการบูตสแตรปเท่านั้น ไม่ใช่สิ่งทดแทนการกำหนดค่า gateway ที่เหมาะสม ยังคงต้องตั้งค่าการยืนยันตัวตน (`gateway.auth.token` หรือรหัสผ่าน) และใช้การตั้งค่า bind ที่ปลอดภัยสำหรับการปรับใช้ของคุณ

  </Step>

  <Step title="Shared Docker VM runtime steps">
    ใช้คู่มือรันไทม์ร่วมสำหรับขั้นตอนโฮสต์ Docker ทั่วไป:

    - [ฝังไบนารีที่จำเป็นลงในอิมเมจ](/th/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [สร้างและเริ่มใช้งาน](/th/install/docker-vm-runtime#build-and-launch)
    - [สิ่งใดคงอยู่ที่ใด](/th/install/docker-vm-runtime#what-persists-where)
    - [การอัปเดต](/th/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner-specific access">
    หลังจากขั้นตอนสร้างและเริ่มใช้งานร่วมกันเสร็จแล้ว ให้ตั้งค่าต่อไปนี้เพื่อเปิด tunnel:

    **ข้อกำหนดเบื้องต้น:** ตรวจสอบให้แน่ใจว่าคอนฟิก sshd ของ VPS อนุญาตการส่งต่อ TCP หากคุณ
    ทำให้คอนฟิก SSH แข็งแรงขึ้นแล้ว ให้ตรวจสอบ `/etc/ssh/sshd_config` และตั้งค่า:

    ```
    AllowTcpForwarding local
    ```

    `local` อนุญาต `ssh -L` local forwards จากแล็ปท็อปของคุณ พร้อมทั้งบล็อก
    remote forwards จากเซิร์ฟเวอร์ การตั้งค่าเป็น `no` จะทำให้ tunnel ล้มเหลว
    ด้วย:
    `channel 3: open failed: administratively prohibited: open failed`

    หลังจากยืนยันว่าเปิดใช้งานการส่งต่อ TCP แล้ว ให้รีสตาร์ตบริการ SSH
    (`systemctl restart ssh`) และรัน tunnel จากแล็ปท็อปของคุณ:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    เปิด:

    `http://127.0.0.1:18789/`

    วาง shared secret ที่กำหนดค่าไว้ คู่มือนี้ใช้โทเคน gateway เป็นค่าเริ่มต้น;
    หากคุณเปลี่ยนไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

  </Step>
</Steps>

แผนที่การคงอยู่ร่วมกันอยู่ใน [รันไทม์ Docker VM](/th/install/docker-vm-runtime#what-persists-where)

## โครงสร้างพื้นฐานในรูปแบบโค้ด (Terraform)

สำหรับทีมที่ต้องการเวิร์กโฟลว์โครงสร้างพื้นฐานในรูปแบบโค้ด การตั้งค่า Terraform ที่ดูแลโดยชุมชนมีสิ่งต่อไปนี้:

- การกำหนดค่า Terraform แบบโมดูลาร์พร้อมการจัดการสถานะระยะไกล
- การจัดเตรียมอัตโนมัติผ่าน cloud-init
- สคริปต์การปรับใช้ (bootstrap, deploy, backup/restore)
- การเสริมความปลอดภัย (ไฟร์วอลล์, UFW, การเข้าถึงผ่าน SSH เท่านั้น)
- การกำหนดค่า SSH tunnel สำหรับการเข้าถึง gateway

**รีโพซิทอรี:**

- โครงสร้างพื้นฐาน: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- คอนฟิก Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

แนวทางนี้เสริมการตั้งค่า Docker ด้านบนด้วยการปรับใช้ที่ทำซ้ำได้ โครงสร้างพื้นฐานที่ควบคุมเวอร์ชันได้ และการกู้คืนจากภัยพิบัติแบบอัตโนมัติ

<Note>
ดูแลโดยชุมชน สำหรับปัญหาหรือการมีส่วนร่วม โปรดดูที่ลิงก์รีโพซิทอรีด้านบน
</Note>

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางข้อความ: [ช่องทาง](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- อัปเดต OpenClaw ให้ทันสมัยอยู่เสมอ: [การอัปเดต](/th/install/updating)

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Fly.io](/th/install/fly)
- [Docker](/th/install/docker)
- [การโฮสต์ VPS](/th/vps)
