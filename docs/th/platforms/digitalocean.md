---
read_when:
    - การตั้งค่า OpenClaw บน DigitalOcean
    - กำลังมองหาโฮสติ้ง VPS ราคาถูกสำหรับ OpenClaw
summary: OpenClaw บน DigitalOcean (ตัวเลือก VPS แบบชำระเงินที่เรียบง่าย)
title: DigitalOcean (แพลตฟอร์ม)
x-i18n:
    generated_at: "2026-04-30T10:03:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw บน DigitalOcean

## เป้าหมาย

รัน OpenClaw Gateway แบบถาวรบน DigitalOcean ในราคา **$6/เดือน** (หรือ $4/เดือนเมื่อใช้ราคาระยะยาว)

หากคุณต้องการตัวเลือก $0/เดือนและไม่รังเกียจ ARM + การตั้งค่าเฉพาะผู้ให้บริการ โปรดดู [คู่มือ Oracle Cloud](/th/install/oracle)

## การเปรียบเทียบค่าใช้จ่าย (2026)

| ผู้ให้บริการ | แผน | สเปก | ราคา/เดือน | หมายเหตุ |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | สูงสุด 4 OCPU, RAM 24GB | $0 | ARM, ความจุจำกัด / ขั้นตอนสมัครมีข้อจุกจิก |
| Hetzner | CX22 | 2 vCPU, RAM 4GB | €3.79 (~$4) | ตัวเลือกแบบเสียเงินที่ถูกที่สุด |
| DigitalOcean | Basic | 1 vCPU, RAM 1GB | $6 | UI ใช้ง่าย, เอกสารดี |
| Vultr | Cloud Compute | 1 vCPU, RAM 1GB | $6 | มีหลายตำแหน่ง |
| Linode | Nanode | 1 vCPU, RAM 1GB | $5 | ปัจจุบันเป็นส่วนหนึ่งของ Akamai |

**การเลือกผู้ให้บริการ:**

- DigitalOcean: UX ง่ายที่สุด + การตั้งค่าคาดเดาได้ (คู่มือนี้)
- Hetzner: ราคา/ประสิทธิภาพดี (ดู [คู่มือ Hetzner](/th/install/hetzner))
- Oracle Cloud: อาจเป็น $0/เดือน แต่จุกจิกกว่าและรองรับเฉพาะ ARM (ดู [คู่มือ Oracle](/th/install/oracle))

---

## ข้อกำหนดเบื้องต้น

- บัญชี DigitalOcean ([สมัครพร้อมเครดิตฟรี $200](https://m.do.co/c/signup))
- คู่กุญแจ SSH (หรือยินดีใช้การยืนยันตัวตนด้วยรหัสผ่าน)
- ประมาณ 20 นาที

## 1) สร้าง Droplet

<Warning>
ใช้ภาพระบบพื้นฐานที่สะอาด (Ubuntu 24.04 LTS) หลีกเลี่ยงอิมเมจ 1-click จาก Marketplace ของบุคคลที่สาม เว้นแต่คุณได้ตรวจสอบสคริปต์เริ่มต้นและค่าเริ่มต้นของไฟร์วอลล์แล้ว
</Warning>

1. เข้าสู่ระบบที่ [DigitalOcean](https://cloud.digitalocean.com/)
2. คลิก **Create → Droplets**
3. เลือก:
   - **Region:** ใกล้คุณที่สุด (หรือใกล้ผู้ใช้ของคุณ)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo** (1 vCPU, RAM 1GB, SSD 25GB)
   - **Authentication:** กุญแจ SSH (แนะนำ) หรือรหัสผ่าน
4. คลิก **Create Droplet**
5. จดที่อยู่ IP

## 2) เชื่อมต่อผ่าน SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) ติดตั้ง OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) รันการเริ่มต้นใช้งาน

```bash
openclaw onboard --install-daemon
```

วิซาร์ดจะแนะนำคุณผ่านขั้นตอนต่อไปนี้:

- การยืนยันตัวตนโมเดล (คีย์ API หรือ OAuth)
- การตั้งค่าช่องทาง (Telegram, WhatsApp, Discord ฯลฯ)
- โทเค็น Gateway (สร้างให้อัตโนมัติ)
- การติดตั้ง daemon (systemd)

## 5) ตรวจสอบ Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) เข้าถึงแดชบอร์ด

Gateway จะ bind กับลูปแบ็กตามค่าเริ่มต้น หากต้องการเข้าถึง Control UI:

**ตัวเลือก A: SSH Tunnel (แนะนำ)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**ตัวเลือก B: Tailscale Serve (HTTPS, เฉพาะลูปแบ็ก)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

เปิด: `https://<magicdns>/`

หมายเหตุ:

- Serve ทำให้ Gateway ใช้เฉพาะลูปแบ็ก และยืนยันตัวตนทราฟฟิก Control UI/WebSocket ผ่านส่วนหัวตัวตนของ Tailscale (การยืนยันตัวตนแบบไม่มีโทเค็นถือว่า host ของ gateway น่าเชื่อถือ; HTTP API จะไม่ใช้ส่วนหัว Tailscale เหล่านั้น และจะใช้โหมดการยืนยันตัวตน HTTP ปกติของ gateway แทน)
- หากต้องการบังคับใช้ข้อมูลประจำตัวแบบ shared-secret อย่างชัดเจนแทน ให้ตั้งค่า `gateway.auth.allowTailscale: false` และใช้ `gateway.auth.mode: "token"` หรือ `"password"`

**ตัวเลือก C: bind กับ tailnet (ไม่มี Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

เปิด: `http://<tailscale-ip>:18789` (ต้องใช้โทเค็น)

## 7) เชื่อมต่อช่องทางของคุณ

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

ดู [ช่องทาง](/th/channels) สำหรับผู้ให้บริการอื่น

---

## การปรับให้เหมาะสมสำหรับ RAM 1GB

Droplet ราคา $6 มี RAM เพียง 1GB เพื่อให้ระบบทำงานได้ราบรื่น:

### เพิ่ม swap (แนะนำ)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### ใช้โมเดลที่เบากว่า

หากคุณเจอ OOM ให้พิจารณา:

- ใช้โมเดลแบบ API (Claude, GPT) แทนโมเดล local
- ตั้งค่า `agents.defaults.model.primary` เป็นโมเดลที่เล็กลง

### ตรวจสอบหน่วยความจำ

```bash
free -h
htop
```

---

## ความคงอยู่ของข้อมูล

สถานะทั้งหมดอยู่ใน:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` ราย agent, สถานะช่องทาง/ผู้ให้บริการ และข้อมูลเซสชัน
- `~/.openclaw/workspace/` — workspace (SOUL.md, memory ฯลฯ)

ข้อมูลเหล่านี้ยังคงอยู่หลังรีบูต สำรองข้อมูลเป็นระยะ:

```bash
openclaw backup create
```

---

## ทางเลือกฟรีบน Oracle Cloud

Oracle Cloud มีอินสแตนซ์ ARM แบบ **Always Free** ที่มีประสิทธิภาพสูงกว่าตัวเลือกแบบเสียเงินใด ๆ ที่นี่อย่างมาก — ในราคา $0/เดือน

| สิ่งที่คุณได้รับ | สเปก |
| ----------------- | ---------------------- |
| **4 OCPUs** | ARM Ampere A1 |
| **RAM 24GB** | มากเกินพอ |
| **พื้นที่จัดเก็บ 200GB** | Block volume |
| **ฟรีตลอดไป** | ไม่มีการเรียกเก็บจากบัตรเครดิต |

**ข้อควรระวัง:**

- การสมัครอาจจุกจิก (ลองใหม่หากล้มเหลว)
- สถาปัตยกรรม ARM — ส่วนใหญ่ทำงานได้ แต่ไบนารีบางตัวต้องมี build สำหรับ ARM

สำหรับคู่มือการตั้งค่าแบบเต็ม โปรดดู [Oracle Cloud](/th/install/oracle) สำหรับเคล็ดลับการสมัครและการแก้ปัญหากระบวนการลงทะเบียน โปรดดู [คู่มือชุมชน](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) นี้

---

## การแก้ปัญหา

### Gateway ไม่เริ่มทำงาน

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### พอร์ตถูกใช้งานอยู่แล้ว

```bash
lsof -i :18789
kill <PID>
```

### หน่วยความจำไม่พอ

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## ที่เกี่ยวข้อง

- [คู่มือ Hetzner](/th/install/hetzner) — ถูกกว่า, ทรงพลังกว่า
- [การติดตั้ง Docker](/th/install/docker) — การตั้งค่าแบบคอนเทนเนอร์
- [Tailscale](/th/gateway/tailscale) — การเข้าถึงระยะไกลอย่างปลอดภัย
- [การกำหนดค่า](/th/gateway/configuration) — อ้างอิงการกำหนดค่าแบบเต็ม
