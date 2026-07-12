---
read_when:
    - คุณต้องการให้ OpenClaw ทำงานตลอด 24 ชั่วโมงทุกวันบน VPS บนคลาวด์ (ไม่ใช่แล็ปท็อปของคุณ)
    - คุณต้องการ Gateway ระดับพร้อมใช้งานจริงที่ทำงานตลอดเวลาบน VPS ของคุณเอง
    - คุณต้องการควบคุมการจัดเก็บข้อมูลถาวร ไบนารี และลักษณะการทำงานเมื่อเริ่มระบบใหม่อย่างเต็มรูปแบบ
    - คุณกำลังเรียกใช้ OpenClaw ใน Docker บน Hetzner หรือผู้ให้บริการที่คล้ายกัน
summary: ใช้งาน OpenClaw Gateway ตลอด 24 ชั่วโมงทุกวันบน VPS ราคาประหยัดของ Hetzner (Docker) พร้อมสถานะที่คงอยู่และไบนารีที่รวมมาในอิมเมจ
title: Hetzner
x-i18n:
    generated_at: "2026-07-12T16:18:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8ffebc0ce725fd219d13d0a556940327e70dab810b8fbee0b365c4870dc7109b
    source_path: install/hetzner.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway แบบถาวรบน Hetzner VPS โดยใช้ Docker พร้อมสถานะที่คงอยู่ ไบนารีที่รวมไว้ในอิมเมจ และพฤติกรรมการรีสตาร์ตที่ปลอดภัย

ราคาของ Hetzner อาจเปลี่ยนแปลงได้ ให้เลือก VPS Debian/Ubuntu ขนาดเล็กที่สุดที่เพียงพอต่อการใช้งาน และเพิ่มขนาดหากพบข้อผิดพลาด OOM

คุณสามารถเข้าถึง Gateway ผ่านการส่งต่อพอร์ต SSH จากแล็ปท็อป หรือเปิดพอร์ตโดยตรงหากคุณจัดการไฟร์วอลล์และโทเค็นด้วยตนเอง

ข้อควรจำเกี่ยวกับโมเดลความปลอดภัย:

- เอเจนต์ที่ใช้ร่วมกันภายในบริษัทเหมาะสมเมื่อทุกคนอยู่ภายในขอบเขตความไว้วางใจเดียวกัน และรันไทม์ใช้สำหรับธุรกิจเท่านั้น
- แยกสภาพแวดล้อมอย่างเคร่งครัด: ใช้ VPS/รันไทม์เฉพาะและบัญชีเฉพาะ ห้ามมีโปรไฟล์ Apple/Google/เบราว์เซอร์/โปรแกรมจัดการรหัสผ่านส่วนตัวบนโฮสต์นั้น
- หากผู้ใช้เป็นฝ่ายตรงข้ามกัน ให้แยกตาม Gateway/โฮสต์/ผู้ใช้ระบบปฏิบัติการ

ดู [ความปลอดภัย](/th/gateway/security) และ [การโฮสต์บน VPS](/th/vps)

คู่มือนี้ถือว่าคุณใช้ Ubuntu หรือ Debian บน Hetzner หากใช้ Linux VPS อื่น ให้ปรับแพ็กเกจให้สอดคล้องกัน สำหรับขั้นตอน Docker ทั่วไป โปรดดู [Docker](/th/install/docker)

## สิ่งที่คุณต้องมี

- Hetzner VPS ที่มีสิทธิ์เข้าถึง root
- การเข้าถึงผ่าน SSH จากแล็ปท็อป
- Docker และ Docker Compose
- ข้อมูลรับรองการยืนยันตัวตนของโมเดล
- ข้อมูลรับรองของผู้ให้บริการซึ่งไม่บังคับ (คิวอาร์โค้ด WhatsApp, โทเค็นบอต Telegram, Gmail OAuth)
- ประมาณ 20 นาที

## ขั้นตอนด่วน

1. จัดเตรียม Hetzner VPS
2. ติดตั้ง Docker
3. โคลนรีโพซิทอรี OpenClaw
4. สร้างไดเรกทอรีถาวรบนโฮสต์
5. กำหนดค่า `.env` และ `docker-compose.yml`
6. รวมไบนารีที่จำเป็นไว้ในอิมเมจ
7. `docker compose up -d`
8. ตรวจสอบการคงอยู่ของข้อมูลและการเข้าถึง Gateway

<Steps>
  <Step title="จัดเตรียม VPS">
    สร้าง Ubuntu หรือ Debian VPS ใน Hetzner จากนั้นเชื่อมต่อด้วยสิทธิ์ root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    ให้ถือว่า VPS เป็นโครงสร้างพื้นฐานที่มีสถานะ ไม่ใช่โครงสร้างพื้นฐานที่สามารถทิ้งและสร้างใหม่ได้ตลอดเวลา

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

  <Step title="โคลนรีโพซิทอรี OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    คู่มือนี้สร้างอิมเมจแบบกำหนดเอง เพื่อให้ไบนารีที่คุณรวมไว้ยังคงอยู่หลังการรีสตาร์ต

  </Step>

  <Step title="สร้างไดเรกทอรีถาวรบนโฮสต์">
    คอนเทนเนอร์ Docker เป็นแบบชั่วคราว สถานะที่ต้องคงอยู่ระยะยาวทั้งหมดจึงต้องอยู่บนโฮสต์

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Set ownership to the container user (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="กำหนดค่าตัวแปรสภาพแวดล้อม">
    สร้าง `.env` ที่รากของรีโพซิทอรี:

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

    ตั้งค่า `OPENCLAW_GATEWAY_TOKEN` เพื่อจัดการโทเค็น Gateway แบบคงที่ผ่าน
    `.env` มิฉะนั้น ให้กำหนดค่า `gateway.auth.token` ก่อนใช้งานไคลเอนต์
    ข้ามการรีสตาร์ต หากไม่ได้ตั้งค่าทั้งสองอย่าง OpenClaw จะใช้โทเค็นที่ใช้ได้
    เฉพาะในรันไทม์สำหรับการเริ่มทำงานครั้งนั้น สร้างรหัสผ่านพวงกุญแจสำหรับ `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **ห้ามคอมมิตไฟล์นี้** ไฟล์นี้เก็บตัวแปรสภาพแวดล้อมของคอนเทนเนอร์/รันไทม์ เช่น
    `OPENCLAW_GATEWAY_TOKEN` ส่วนข้อมูลยืนยันตัวตน OAuth/คีย์ API ของผู้ให้บริการที่จัดเก็บไว้จะอยู่ใน
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ที่เมานต์ไว้

  </Step>

  <Step title="การกำหนดค่า Docker Compose">
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

    `--allow-unconfigured` มีไว้เพื่อความสะดวกในการเริ่มต้นระบบเท่านั้น ไม่สามารถใช้แทนการกำหนดค่า Gateway ที่เหมาะสมได้ คุณยังต้องตั้งค่าการยืนยันตัวตน (`gateway.auth.token` หรือรหัสผ่าน) และโหมดการผูกเครือข่ายที่ปลอดภัยสำหรับการปรับใช้ของคุณ

  </Step>

  <Step title="ขั้นตอนรันไทม์ Docker VM ที่ใช้ร่วมกัน">
    ทำตามคู่มือรันไทม์ที่ใช้ร่วมกันสำหรับขั้นตอนทั่วไปบนโฮสต์ Docker:

    - [รวมไบนารีที่จำเป็นไว้ในอิมเมจ](/th/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [สร้างและเริ่มใช้งาน](/th/install/docker-vm-runtime#build-and-launch)
    - [ข้อมูลใดคงอยู่ที่ตำแหน่งใด](/th/install/docker-vm-runtime#what-persists-where)
    - [การอัปเดต](/th/install/docker-vm-runtime#updates)

  </Step>

  <Step title="การเข้าถึงเฉพาะสำหรับ Hetzner">
    หลังจากทำขั้นตอนสร้างและเริ่มใช้งานในคู่มือที่ใช้ร่วมกันแล้ว ให้เปิดทันเนล

    **ข้อกำหนดเบื้องต้น:** ตรวจสอบว่าการกำหนดค่า sshd ของ VPS อนุญาตการส่งต่อ TCP หากคุณ
    เพิ่มความเข้มงวดให้การกำหนดค่า SSH ให้ตรวจสอบ `/etc/ssh/sshd_config` และตั้งค่า:

    ```text
    AllowTcpForwarding local
    ```

    `local` อนุญาตการส่งต่อภายในด้วย `ssh -L` จากแล็ปท็อปของคุณ พร้อมทั้งบล็อก
    การส่งต่อระยะไกลจากเซิร์ฟเวอร์ หากตั้งค่าเป็น `no` ทันเนลจะล้มเหลวพร้อมข้อความ:
    `channel 3: open failed: administratively prohibited: open failed`

    หลังจากยืนยันว่าเปิดใช้งานการส่งต่อ TCP แล้ว ให้รีสตาร์ตบริการ SSH
    (`systemctl restart ssh`) และเรียกใช้ทันเนลจากแล็ปท็อป:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    เปิด `http://127.0.0.1:18789/` แล้ววางข้อมูลลับที่ใช้ร่วมกันซึ่งกำหนดค่าไว้
    โดยค่าเริ่มต้น คู่มือนี้ใช้โทเค็น Gateway หากคุณเปลี่ยนไปใช้การยืนยันตัวตน
    ด้วยรหัสผ่าน ให้ใช้รหัสผ่านที่กำหนดค่าไว้แทน

  </Step>
</Steps>

แผนผังการคงอยู่ของข้อมูลที่ใช้ร่วมกันอยู่ใน [รันไทม์ Docker VM](/th/install/docker-vm-runtime#what-persists-where)

## โครงสร้างพื้นฐานในรูปแบบโค้ด (Terraform)

สำหรับทีมที่ต้องการเวิร์กโฟลว์โครงสร้างพื้นฐานในรูปแบบโค้ด การตั้งค่า Terraform ที่ชุมชนดูแลมีคุณสมบัติดังนี้:

- การกำหนดค่า Terraform แบบโมดูลาร์พร้อมการจัดการสถานะระยะไกล
- การจัดเตรียมอัตโนมัติผ่าน cloud-init
- สคริปต์การปรับใช้ (เริ่มต้นระบบ ปรับใช้ สำรอง/กู้คืน)
- การเพิ่มความปลอดภัย (ไฟร์วอลล์ UFW และการเข้าถึงผ่าน SSH เท่านั้น)
- การกำหนดค่าทันเนล SSH สำหรับเข้าถึง Gateway

**รีโพซิทอรี:**

- โครงสร้างพื้นฐาน: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- การกำหนดค่า Docker: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

แนวทางนี้เสริมการตั้งค่า Docker ด้านบนด้วยการปรับใช้ที่ทำซ้ำได้ โครงสร้างพื้นฐานที่ควบคุมเวอร์ชัน และการกู้คืนจากภัยพิบัติแบบอัตโนมัติ

<Note>
ดูแลโดยชุมชน สำหรับปัญหาหรือการมีส่วนร่วม โปรดดูลิงก์รีโพซิทอรีด้านบน
</Note>

## ขั้นตอนถัดไป

- ตั้งค่าช่องทางรับส่งข้อความ: [ช่องทาง](/th/channels)
- กำหนดค่า Gateway: [การกำหนดค่า Gateway](/th/gateway/configuration)
- อัปเดต OpenClaw ให้เป็นเวอร์ชันล่าสุดอยู่เสมอ: [การอัปเดต](/th/install/updating)

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Fly.io](/th/install/fly)
- [Docker](/th/install/docker)
- [การโฮสต์บน VPS](/th/vps)
