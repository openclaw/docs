---
read_when:
    - การตั้งค่า OpenClaw บน DigitalOcean
    - มองหา VPS แบบชำระเงินที่ใช้งานง่ายสำหรับ OpenClaw
summary: โฮสต์ OpenClaw บน DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T09:18:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway แบบถาวรบน DigitalOcean Droplet (ประมาณ $6/เดือนสำหรับแผน Basic ขนาด 1 GB)

DigitalOcean เป็นเส้นทาง VPS แบบจ่ายเงินที่ง่ายที่สุด หากคุณต้องการตัวเลือกที่ถูกกว่าหรือฟรี:

- [Hetzner](/th/install/hetzner) — €3.79/เดือน ได้คอร์/RAM ต่อดอลลาร์มากกว่า
- [Oracle Cloud](/th/install/oracle) — ARM แบบ Always Free (สูงสุด 4 OCPU, RAM 24 GB) แต่การสมัครอาจยุ่งยากและรองรับเฉพาะ ARM

## ข้อกำหนดเบื้องต้น

- บัญชี DigitalOcean ([สมัครใช้งาน](https://cloud.digitalocean.com/registrations/new))
- คู่คีย์ SSH (หรือยินดีใช้การยืนยันตัวตนด้วยรหัสผ่าน)
- เวลาประมาณ 20 นาที

## การตั้งค่า

<Steps>
  <Step title="สร้าง Droplet">
    <Warning>
    ใช้อิมเมจพื้นฐานที่สะอาด (Ubuntu 24.04 LTS) หลีกเลี่ยงอิมเมจ Marketplace แบบ 1-click จากบุคคลที่สาม เว้นแต่คุณจะตรวจสอบสคริปต์เริ่มต้นและค่าเริ่มต้นของไฟร์วอลล์แล้ว
    </Warning>

    1. เข้าสู่ระบบ [DigitalOcean](https://cloud.digitalocean.com/)
    2. คลิก **Create > Droplets**
    3. เลือก:
       - **ภูมิภาค:** ใกล้คุณที่สุด
       - **อิมเมจ:** Ubuntu 24.04 LTS
       - **ขนาด:** Basic, Regular, 1 vCPU / RAM 1 GB / SSD 25 GB
       - **การยืนยันตัวตน:** คีย์ SSH (แนะนำ) หรือรหัสผ่าน
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
    openclaw --version
    ```

  </Step>

  <Step title="เรียกใช้การเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --install-daemon
    ```

    วิซาร์ดจะพาคุณผ่านการยืนยันตัวตนของโมเดล การตั้งค่าช่องทาง การสร้างโทเค็น Gateway และการติดตั้ง daemon (systemd)

  </Step>

  <Step title="เพิ่ม swap (แนะนำสำหรับ Droplet ขนาด 1 GB)">
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
    Gateway จะผูกกับ loopback เป็นค่าเริ่มต้น เลือกหนึ่งในตัวเลือกเหล่านี้

    **ตัวเลือก A: ทันเนล SSH (ง่ายที่สุด)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    จากนั้นเปิด `http://localhost:18789`

    **ตัวเลือก B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    จากนั้นเปิด `https://<magicdns>/` จากอุปกรณ์ใดก็ได้ใน tailnet ของคุณ

    Tailscale Serve ยืนยันตัวตนทราฟฟิก UI ควบคุมและ WebSocket ผ่านส่วนหัวตัวตนของ tailnet ซึ่งถือว่าโฮสต์ Gateway เองเป็นที่เชื่อถือได้ ปลายทาง HTTP API จะใช้โหมดการยืนยันตัวตนปกติของ Gateway (โทเค็น/รหัสผ่าน) ไม่ว่าจะอย่างไรก็ตาม หากต้องการบังคับใช้ข้อมูลประจำตัวแบบ shared-secret อย่างชัดเจนผ่าน Serve ให้ตั้งค่า `gateway.auth.allowTailscale: false` และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

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

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` ต่อ agent, สถานะของช่องทาง/ผู้ให้บริการ และข้อมูลเซสชัน
- `~/.openclaw/workspace/` — พื้นที่ทำงานของ agent (SOUL.md, หน่วยความจำ, อาร์ติแฟกต์)

ข้อมูลเหล่านี้ยังคงอยู่หลังจาก Droplet รีบูต หากต้องการสร้างสแนปช็อตที่พกพาได้:

```bash
openclaw backup create
```

สแนปช็อตของ DigitalOcean จะสำรองทั้ง Droplet ส่วน `openclaw backup create` สามารถพกพาข้ามโฮสต์ได้

## เคล็ดลับสำหรับ RAM 1 GB

Droplet ราคา $6 มี RAM เพียง 1 GB เพื่อให้การใช้งานลื่นไหล:

- ตรวจสอบให้แน่ใจว่าขั้นตอน swap ด้านบนอยู่ใน `/etc/fstab` เพื่อให้ยังคงอยู่หลังรีบูต
- เลือกใช้โมเดลแบบ API (Claude, GPT) แทนโมเดลภายในเครื่อง — การอนุมาน LLM ภายในเครื่องไม่เหมาะกับ 1 GB
- ตั้งค่า `agents.defaults.model.primary` เป็นโมเดลที่เล็กลงหากคุณเจอ OOM กับพรอมป์ต์ขนาดใหญ่
- ตรวจสอบด้วย `free -h` และ `htop`

## การแก้ไขปัญหา

**Gateway ไม่เริ่มทำงาน** -- เรียกใช้ `openclaw doctor --non-interactive` และตรวจสอบล็อกด้วย `journalctl --user -u openclaw-gateway.service -n 50`

**พอร์ตถูกใช้งานอยู่แล้ว** -- เรียกใช้ `lsof -i :18789` เพื่อหากระบวนการ แล้วหยุดกระบวนการนั้น

**หน่วยความจำไม่พอ** -- ตรวจสอบว่า swap ทำงานอยู่ด้วย `free -h` หากยังเจอ OOM ให้ใช้โมเดลแบบ API (Claude, GPT) แทนโมเดลภายในเครื่อง หรืออัปเกรดเป็น Droplet ขนาด 2 GB

## ขั้นตอนถัดไป

- [ช่องทาง](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่นๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือกการกำหนดค่าทั้งหมด
- [การอัปเดต](/th/install/updating) -- ทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [Fly.io](/th/install/fly)
- [Hetzner](/th/install/hetzner)
- [โฮสติ้ง VPS](/th/vps)
