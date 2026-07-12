---
read_when:
    - การตั้งค่า OpenClaw บน DigitalOcean
    - กำลังมองหา VPS แบบเสียเงินที่เรียบง่ายสำหรับ OpenClaw
summary: โฮสต์ OpenClaw บน DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T16:18:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

รัน OpenClaw Gateway แบบถาวรบน DigitalOcean Droplet (ประมาณ $6/เดือนสำหรับแผน Basic ขนาด 1 GB)

DigitalOcean เป็นทางเลือก VPS แบบชำระเงินที่ตั้งค่าได้ตรงไปตรงมา สำหรับตัวเลือกที่ถูกกว่าหรือฟรี:

- [Hetzner](/th/install/hetzner) -- ได้คอร์/RAM มากกว่าเมื่อเทียบต่อหนึ่งดอลลาร์
- [Oracle Cloud](/th/install/oracle) -- ระดับ ARM แบบ Always Free (สูงสุด 4 OCPU, RAM 24 GB) แต่การสมัครอาจติดขัดและรองรับเฉพาะ ARM

## ข้อกำหนดเบื้องต้น

- บัญชี DigitalOcean ([สมัคร](https://cloud.digitalocean.com/registrations/new))
- คู่กุญแจ SSH (หรือยินดีใช้การยืนยันตัวตนด้วยรหัสผ่าน)
- เวลาประมาณ 20 นาที

## การตั้งค่า

<Steps>
  <Step title="สร้าง Droplet">
    <Warning>
    ใช้อิมเมจพื้นฐานที่สะอาด (Ubuntu 24.04 LTS) หลีกเลี่ยงอิมเมจแบบ 1-click จาก Marketplace ของบุคคลที่สาม เว้นแต่คุณได้ตรวจสอบสคริปต์เริ่มต้นระบบและค่าเริ่มต้นของไฟร์วอลล์แล้ว
    </Warning>

    1. เข้าสู่ระบบ [DigitalOcean](https://cloud.digitalocean.com/)
    2. คลิก **Create > Droplets**
    3. เลือก:
       - **Region:** ใกล้ตำแหน่งของคุณที่สุด
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / RAM 1 GB / SSD 25 GB
       - **Authentication:** กุญแจ SSH (แนะนำ) หรือรหัสผ่าน
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

    ใช้เชลล์ root เฉพาะสำหรับการเตรียมระบบขั้นต้นเท่านั้น รันคำสั่ง OpenClaw ในฐานะผู้ใช้ `openclaw` ที่ไม่ใช่ root เพื่อให้สถานะอยู่ภายใต้ `/home/openclaw/.openclaw/` และติดตั้ง Gateway เป็นบริการ systemd `--user` ของผู้ใช้รายนั้น

  </Step>

  <Step title="ดำเนินการเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --install-daemon
    ```

    ตัวช่วยจะนำคุณผ่านการยืนยันตัวตนของโมเดล การตั้งค่าช่องทาง การสร้างโทเค็น Gateway และการติดตั้งดีมอน (บริการผู้ใช้ systemd)

  </Step>

  <Step title="เพิ่มพื้นที่สลับ (แนะนำสำหรับ Droplet ขนาด 1 GB)">
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

  <Step title="เข้าถึงส่วนติดต่อควบคุม">
    โดยค่าเริ่มต้น Gateway จะผูกกับ local loopback เลือกหนึ่งในตัวเลือกต่อไปนี้

    **ตัวเลือก A: อุโมงค์ SSH (ง่ายที่สุด)**

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

    จากนั้นเปิด `https://<magicdns>/` จากอุปกรณ์ใดก็ได้บน tailnet ของคุณ

    Tailscale Serve ยืนยันตัวตนของทราฟฟิกส่วนติดต่อควบคุมและ WebSocket ผ่านส่วนหัวข้อมูลประจำตัวของ tailnet ซึ่งตั้งอยู่บนสมมติฐานว่าโฮสต์ Gateway นั้นเชื่อถือได้ ปลายทาง HTTP API ยังคงใช้โหมดการยืนยันตัวตนตามปกติของ Gateway (โทเค็น/รหัสผ่าน) ไม่ว่าในกรณีใด หากต้องการบังคับใช้ข้อมูลประจำตัวที่เป็นความลับร่วมกันอย่างชัดเจนผ่าน Serve ให้ตั้งค่า `gateway.auth.allowTailscale: false` และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

    **ตัวเลือก C: ผูกกับ Tailnet (ไม่ใช้ Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    จากนั้นเปิด `http://<tailscale-ip>:18789` (ต้องใช้โทเค็น)

  </Step>
</Steps>

## การคงอยู่ของข้อมูลและการสำรองข้อมูล

สถานะของ OpenClaw อยู่ภายใต้:

- `~/.openclaw/` -- `openclaw.json`, ข้อมูลประจำตัวของช่องทาง/ผู้ให้บริการ, `auth-profiles.json` สำหรับแต่ละเอเจนต์ และข้อมูลเซสชัน
- `~/.openclaw/workspace/` -- พื้นที่ทำงานของเอเจนต์ (SOUL.md, หน่วยความจำ, อาร์ติแฟกต์)

ข้อมูลเหล่านี้ยังคงอยู่หลังจากรีบูต Droplet หากต้องการสร้างสแนปช็อตแบบพกพา:

```bash
openclaw backup create
```

สแนปช็อตของ DigitalOcean จะสำรองข้อมูลทั้ง Droplet ส่วน `openclaw backup create` สามารถย้ายข้ามโฮสต์ได้

## เคล็ดลับสำหรับ RAM 1 GB

Droplet ราคา $6 มี RAM เพียง 1 GB เพื่อให้ทำงานได้อย่างราบรื่น:

- ตรวจสอบว่าขั้นตอนการตั้งค่าพื้นที่สลับด้านบนถูกเพิ่มไว้ใน `/etc/fstab` เพื่อให้ยังคงทำงานหลังรีบูต
- เลือกใช้โมเดลผ่าน API (Claude, GPT) แทนโมเดลภายในเครื่อง -- การอนุมาน LLM ภายในเครื่องไม่สามารถทำงานได้ภายใน RAM 1 GB
- ตั้งค่า `agents.defaults.model.primary` เป็นโมเดลที่เล็กลง หากพบข้อผิดพลาดหน่วยความจำไม่เพียงพอเมื่อใช้พรอมต์ขนาดใหญ่
- ตรวจสอบด้วย `free -h` และ `htop`

## การแก้ไขปัญหา

**Gateway ไม่เริ่มทำงาน** -- รัน `openclaw doctor --non-interactive` และตรวจสอบบันทึกด้วย `journalctl --user -u openclaw-gateway.service -n 50`

**พอร์ตถูกใช้งานอยู่แล้ว** -- รัน `lsof -i :18789` เพื่อค้นหากระบวนการ แล้วหยุดกระบวนการนั้น

**หน่วยความจำไม่เพียงพอ** -- ตรวจสอบว่าพื้นที่สลับทำงานอยู่ด้วย `free -h` หากยังพบข้อผิดพลาดหน่วยความจำไม่เพียงพอ ให้เปลี่ยนไปใช้โมเดลผ่าน API (Claude, GPT) แทนโมเดลภายในเครื่อง หรืออัปเกรดเป็น Droplet ขนาด 2 GB

## ขั้นตอนถัดไป

- [ช่องทาง](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่นๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือกการกำหนดค่าทั้งหมด
- [การอัปเดต](/th/install/updating) -- ดูแลให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Fly.io](/th/install/fly)
- [Hetzner](/th/install/hetzner)
- [การโฮสต์บน VPS](/th/vps)
