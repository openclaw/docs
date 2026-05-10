---
read_when:
    - การตั้งค่า OpenClaw บน DigitalOcean
    - กำลังมองหา VPS แบบชำระเงินที่เรียบง่ายสำหรับ OpenClaw
summary: โฮสต์ OpenClaw บน DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-10T19:43:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ddfe3e6df5e48616584e912e12eede30a62f869fc307f586c9604c9c06c9e5b
    source_path: install/digitalocean.md
    workflow: 16
---

รัน OpenClaw Gateway แบบทำงานต่อเนื่องบน DigitalOcean Droplet (ประมาณ $6/เดือนสำหรับแผน Basic 1 GB)

DigitalOcean เป็นเส้นทาง VPS แบบเสียเงินที่ง่ายที่สุด หากคุณต้องการตัวเลือกที่ถูกกว่าหรือฟรี:

- [Hetzner](/th/install/hetzner) — €3.79/เดือน, ได้คอร์/RAM ต่อเงินหนึ่งดอลลาร์มากกว่า
- [Oracle Cloud](/th/install/oracle) — ARM แบบ Always Free (สูงสุด 4 OCPU, RAM 24 GB) แต่การสมัครอาจจุกจิกและรองรับเฉพาะ ARM

## ข้อกำหนดเบื้องต้น

- บัญชี DigitalOcean ([สมัคร](https://cloud.digitalocean.com/registrations/new))
- คู่คีย์ SSH (หรือยินดีใช้การยืนยันตัวตนด้วยรหัสผ่าน)
- ประมาณ 20 นาที

## การตั้งค่า

<Steps>
  <Step title="สร้าง Droplet">
    <Warning>
    ใช้อิมเมจฐานที่สะอาด (Ubuntu 24.04 LTS) หลีกเลี่ยงอิมเมจ 1-click จาก Marketplace ของบุคคลที่สาม เว้นแต่คุณจะตรวจสอบสคริปต์เริ่มต้นและค่าเริ่มต้นไฟร์วอลล์ของอิมเมจเหล่านั้นแล้ว
    </Warning>

    1. เข้าสู่ระบบ [DigitalOcean](https://cloud.digitalocean.com/)
    2. คลิก **Create > Droplets**
    3. เลือก:
       - **Region:** ใกล้คุณที่สุด
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** คีย์ SSH (แนะนำ) หรือรหัสผ่าน
    4. คลิก **Create Droplet** และจดที่อยู่ IP ไว้

  </Step>

  <Step title="เชื่อมต่อและติดตั้ง">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    ใช้เชลล์ root เฉพาะสำหรับการบูตสแตรประบบเท่านั้น รันคำสั่ง OpenClaw ในฐานะผู้ใช้ `openclaw` ที่ไม่ใช่ root เพื่อให้สถานะอยู่ใต้ `/home/openclaw/.openclaw/` และ Gateway ติดตั้งเป็นบริการ systemd ของผู้ใช้นั้น

  </Step>

  <Step title="รันการเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --install-daemon
    ```

    ตัวช่วยจะแนะนำคุณผ่านการยืนยันตัวตนโมเดล, การตั้งค่าช่องทาง, การสร้างโทเค็น Gateway และการติดตั้ง daemon (systemd)

  </Step>

  <Step title="เพิ่ม swap (แนะนำสำหรับ Droplet 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="ตรวจสอบ Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="เข้าถึง UI ควบคุม">
    Gateway จะผูกกับ loopback โดยค่าเริ่มต้น เลือกหนึ่งในตัวเลือกเหล่านี้

    **ตัวเลือก A: ทันเนล SSH (ง่ายที่สุด)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    จากนั้นเปิด `http://localhost:18789`

    **ตัวเลือก B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    จากนั้นเปิด `https://<magicdns>/` จากอุปกรณ์ใดก็ได้ใน tailnet ของคุณ

    Tailscale Serve ยืนยันตัวตนทราฟฟิกของ UI ควบคุมและ WebSocket ผ่านส่วนหัวระบุตัวตนของ tailnet ซึ่งถือว่าโฮสต์ Gateway นั้นเชื่อถือได้อยู่แล้ว ปลายทาง HTTP API จะใช้โหมด auth ปกติของ Gateway (โทเค็น/รหัสผ่าน) เสมอ หากต้องการบังคับใช้ข้อมูลประจำตัวแบบ shared-secret อย่างชัดเจนผ่าน Serve ให้ตั้งค่า `gateway.auth.allowTailscale: false` และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

    **ตัวเลือก C: ผูกกับ Tailnet (ไม่ใช้ Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    จากนั้นเปิด `http://<tailscale-ip>:18789` (ต้องใช้โทเค็น)

  </Step>
</Steps>

## ความคงอยู่และการสำรองข้อมูล

สถานะของ OpenClaw อยู่ภายใต้:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` ต่อเอเจนต์, สถานะช่องทาง/ผู้ให้บริการ และข้อมูลเซสชัน
- `~/.openclaw/workspace/` — พื้นที่ทำงานของเอเจนต์ (SOUL.md, หน่วยความจำ, อาร์ติแฟกต์)

ข้อมูลเหล่านี้จะยังอยู่หลังรีบูต Droplet หากต้องการสร้างสแนปช็อตแบบพกพาได้:

```bash
openclaw backup create
```

สแนปช็อตของ DigitalOcean จะสำรองข้อมูลทั้ง Droplet ส่วน `openclaw backup create` สามารถย้ายข้ามโฮสต์ได้

## เคล็ดลับสำหรับ RAM 1 GB

Droplet ราคา $6 มี RAM เพียง 1 GB เพื่อให้การทำงานลื่นไหล:

- ตรวจสอบให้แน่ใจว่าขั้นตอน swap ด้านบนอยู่ใน `/etc/fstab` เพื่อให้ยังคงอยู่หลังรีบูต
- เลือกใช้โมเดลแบบ API (Claude, GPT) แทนโมเดลในเครื่อง — การอนุมาน LLM ในเครื่องไม่เหมาะกับ 1 GB
- ตั้งค่า `agents.defaults.model.primary` เป็นโมเดลที่เล็กลงหากพบ OOM จากพรอมป์ขนาดใหญ่
- เฝ้าดูด้วย `free -h` และ `htop`

## การแก้ไขปัญหา

**Gateway ไม่เริ่มทำงาน** -- รัน `openclaw doctor --non-interactive` และตรวจสอบบันทึกด้วย `journalctl --user -u openclaw-gateway.service -n 50`

**พอร์ตถูกใช้งานอยู่แล้ว** -- รัน `lsof -i :18789` เพื่อค้นหากระบวนการ แล้วหยุดกระบวนการนั้น

**หน่วยความจำไม่พอ** -- ตรวจสอบว่า swap ทำงานอยู่ด้วย `free -h` หากยังพบ OOM ให้ใช้โมเดลแบบ API (Claude, GPT) แทนโมเดลในเครื่อง หรืออัปเกรดเป็น Droplet 2 GB

## ขั้นตอนถัดไป

- [ช่องทาง](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่นๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือกการกำหนดค่าทั้งหมด
- [การอัปเดต](/th/install/updating) -- ทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Fly.io](/th/install/fly)
- [Hetzner](/th/install/hetzner)
- [โฮสติ้ง VPS](/th/vps)
