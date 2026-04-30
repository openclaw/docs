---
read_when:
    - การตั้งค่า OpenClaw บน Raspberry Pi
    - การเรียกใช้ OpenClaw บนอุปกรณ์ ARM
    - การสร้างปัญญาประดิษฐ์ส่วนตัวราคาประหยัดที่เปิดใช้งานตลอดเวลา
summary: OpenClaw บน Raspberry Pi (การตั้งค่าแบบโฮสต์ด้วยตนเองราคาประหยัด)
title: Raspberry Pi (แพลตฟอร์ม)
x-i18n:
    generated_at: "2026-04-30T10:04:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# OpenClaw บน Raspberry Pi

## เป้าหมาย

รัน OpenClaw Gateway แบบถาวรและเปิดตลอดเวลาบน Raspberry Pi ด้วยค่าใช้จ่ายครั้งเดียว **~$35-80** (ไม่มีค่าบริการรายเดือน)

เหมาะสำหรับ:

- ผู้ช่วย AI ส่วนตัวตลอด 24/7
- ฮับระบบอัตโนมัติในบ้าน
- บอต Telegram/WhatsApp ที่ใช้พลังงานต่ำและพร้อมใช้งานเสมอ

## ข้อกำหนดฮาร์ดแวร์

| รุ่น Pi          | RAM     | ใช้งานได้ไหม? | หมายเหตุ                            |
| --------------- | ------- | -------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ ดีที่สุด | เร็วที่สุด แนะนำให้ใช้              |
| **Pi 4**        | 4GB     | ✅ ดี    | จุดที่เหมาะสมสำหรับผู้ใช้ส่วนใหญ่    |
| **Pi 4**        | 2GB     | ✅ พอใช้ | ใช้งานได้ เพิ่ม swap                |
| **Pi 4**        | 1GB     | ⚠️ จำกัด | เป็นไปได้เมื่อมี swap และ config ขั้นต่ำ |
| **Pi 3B+**      | 1GB     | ⚠️ ช้า   | ใช้งานได้แต่ค่อนข้างอืด            |
| **Pi Zero 2 W** | 512MB   | ❌       | ไม่แนะนำ                           |

**สเปกขั้นต่ำ:** RAM 1GB, 1 คอร์, ดิสก์ 500MB  
**แนะนำ:** RAM 2GB+, OS 64 บิต, การ์ด SD 16GB+ (หรือ USB SSD)

## สิ่งที่คุณต้องมี

- Raspberry Pi 4 หรือ 5 (แนะนำ 2GB+)
- การ์ด MicroSD (16GB+) หรือ USB SSD (ประสิทธิภาพดีกว่า)
- แหล่งจ่ายไฟ (แนะนำ PSU ทางการของ Pi)
- การเชื่อมต่อเครือข่าย (Ethernet หรือ WiFi)
- ประมาณ 30 นาที

## 1) แฟลช OS

ใช้ **Raspberry Pi OS Lite (64-bit)** — ไม่ต้องมีเดสก์ท็อปสำหรับเซิร์ฟเวอร์แบบ headless

1. ดาวน์โหลด [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. เลือก OS: **Raspberry Pi OS Lite (64-bit)**
3. คลิกไอคอนเฟือง (⚙️) เพื่อกำหนดค่าล่วงหน้า:
   - ตั้งชื่อโฮสต์: `gateway-host`
   - เปิดใช้งาน SSH
   - ตั้งชื่อผู้ใช้/รหัสผ่าน
   - กำหนดค่า WiFi (หากไม่ได้ใช้ Ethernet)
4. แฟลชลงการ์ด SD / ไดรฟ์ USB
5. ใส่และบูต Pi

## 2) เชื่อมต่อผ่าน SSH

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) การตั้งค่าระบบ

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) ติดตั้ง Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) เพิ่ม Swap (สำคัญสำหรับ 2GB หรือน้อยกว่า)

Swap ช่วยป้องกันการล่มจากหน่วยความจำไม่พอ:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) ติดตั้ง OpenClaw

### ตัวเลือก A: การติดตั้งมาตรฐาน (แนะนำ)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### ตัวเลือก B: การติดตั้งแบบปรับแต่งได้ (สำหรับลองปรับแก้)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

การติดตั้งแบบปรับแต่งได้ให้คุณเข้าถึงบันทึกและโค้ดได้โดยตรง — มีประโยชน์สำหรับการดีบักปัญหาเฉพาะ ARM

## 7) รัน Onboarding

```bash
openclaw onboard --install-daemon
```

ทำตามตัวช่วยตั้งค่า:

1. **โหมด Gateway:** Local
2. **การยืนยันตัวตน:** แนะนำ API keys (OAuth อาจจุกจิกบน Pi แบบ headless)
3. **ช่องทาง:** Telegram เริ่มต้นง่ายที่สุด
4. **Daemon:** ใช่ (systemd)

## 8) ตรวจสอบการติดตั้ง

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) เข้าถึง OpenClaw Dashboard

แทนที่ `user@gateway-host` ด้วยชื่อผู้ใช้และชื่อโฮสต์หรือที่อยู่ IP ของ Pi ของคุณ

บนคอมพิวเตอร์ของคุณ ให้ขอให้ Pi พิมพ์ URL ของแดชบอร์ดใหม่:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

คำสั่งจะพิมพ์ `Dashboard URL:` ขึ้นอยู่กับวิธีกำหนดค่า `gateway.auth.token`
URL อาจเป็นลิงก์ธรรมดา `http://127.0.0.1:18789/` หรือเป็นลิงก์
ที่มี `#token=...`

ในเทอร์มินัลอีกหน้าบนคอมพิวเตอร์ของคุณ ให้สร้าง SSH tunnel:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

จากนั้นเปิด Dashboard URL ที่พิมพ์ออกมาในเบราว์เซอร์ภายในเครื่องของคุณ

หาก UI ขอการยืนยันตัวตนแบบ shared-secret ให้วาง token หรือรหัสผ่านที่กำหนดค่าไว้
ใน settings ของ Control UI สำหรับการยืนยันตัวตนด้วย token ให้ใช้ `gateway.auth.token` (หรือ
`OPENCLAW_GATEWAY_TOKEN`)

สำหรับการเข้าถึงระยะไกลแบบเปิดตลอดเวลา โปรดดู [Tailscale](/th/gateway/tailscale)

---

## การปรับประสิทธิภาพ

### ใช้ USB SSD (ปรับปรุงได้มาก)

การ์ด SD ช้าและสึกหรอง่าย USB SSD ช่วยเพิ่มประสิทธิภาพได้อย่างมาก:

```bash
# Check if booting from USB
lsblk
```

ดู [คู่มือการบูต Pi จาก USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) สำหรับการตั้งค่า

### เร่งการเริ่มต้น CLI (แคชการคอมไพล์โมดูล)

บนโฮสต์ Pi ที่ใช้พลังประมวลผลต่ำกว่า ให้เปิดใช้แคชการคอมไพล์โมดูลของ Node เพื่อให้การรัน CLI ซ้ำเร็วขึ้น:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

หมายเหตุ:

- `NODE_COMPILE_CACHE` ช่วยเร่งการรันครั้งถัดไป (`status`, `health`, `--help`)
- `/var/tmp` อยู่รอดข้ามการรีบูตได้ดีกว่า `/tmp`
- `OPENCLAW_NO_RESPAWN=1` หลีกเลี่ยงค่าใช้จ่ายการเริ่มต้นเพิ่มเติมจากการ respawn ตัวเองของ CLI
- การรันครั้งแรกจะอุ่นแคช การรันครั้งหลังจะได้ประโยชน์มากที่สุด

### การปรับแต่งการเริ่มต้น systemd (ไม่บังคับ)

หาก Pi เครื่องนี้รัน OpenClaw เป็นหลัก ให้เพิ่ม service drop-in เพื่อลดความผันผวนในการรีสตาร์ต
และคงค่า env ตอนเริ่มต้นให้เสถียร:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

จากนั้นนำไปใช้:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

หากเป็นไปได้ ให้เก็บสถานะ/แคชของ OpenClaw บนพื้นที่จัดเก็บที่รองรับด้วย SSD เพื่อหลีกเลี่ยง
คอขวด I/O แบบสุ่มของการ์ด SD ระหว่างการเริ่มแบบ cold start

หากนี่เป็น Pi แบบ headless ให้เปิดใช้งาน lingering หนึ่งครั้ง เพื่อให้บริการของผู้ใช้ยังทำงานต่อ
หลัง logout:

```bash
sudo loginctl enable-linger "$(whoami)"
```

วิธีที่นโยบาย `Restart=` ช่วยการกู้คืนอัตโนมัติ:
[systemd สามารถทำให้การกู้คืนบริการเป็นอัตโนมัติ](https://www.redhat.com/en/blog/systemd-automate-recovery)

### ลดการใช้หน่วยความจำ

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### ตรวจสอบทรัพยากร

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## หมายเหตุเฉพาะ ARM

### ความเข้ากันได้ของไบนารี

ฟีเจอร์ส่วนใหญ่ของ OpenClaw ใช้งานได้บน ARM64 แต่ไบนารีภายนอกบางตัวอาจต้องมีบิลด์ ARM:

| เครื่องมือ          | สถานะ ARM64 | หมายเหตุ                            |
| ------------------ | ------------ | ----------------------------------- |
| Node.js            | ✅           | ใช้งานได้ดีมาก                      |
| WhatsApp (Baileys) | ✅           | JS ล้วน ไม่มีปัญหา                  |
| Telegram           | ✅           | JS ล้วน ไม่มีปัญหา                  |
| gog (Gmail CLI)    | ⚠️           | ตรวจสอบว่ามีรุ่น ARM หรือไม่        |
| Chromium (เบราว์เซอร์) | ✅           | `sudo apt install chromium-browser` |

หาก skill ล้มเหลว ให้ตรวจสอบว่าไบนารีของมันมีบิลด์ ARM หรือไม่ เครื่องมือ Go/Rust จำนวนมากมี แต่บางตัวไม่มี

### 32 บิต เทียบกับ 64 บิต

**ใช้ OS 64 บิตเสมอ** Node.js และเครื่องมือสมัยใหม่จำนวนมากต้องใช้ ตรวจสอบด้วย:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## การตั้งค่าโมเดลที่แนะนำ

เนื่องจาก Pi เป็นเพียง Gateway (โมเดลรันในคลาวด์) ให้ใช้โมเดลแบบ API:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

**อย่าพยายามรัน LLM ภายในเครื่องบน Pi** — แม้แต่โมเดลขนาดเล็กก็ช้าเกินไป ให้ Claude/GPT จัดการงานหนักแทน

---

## เริ่มอัตโนมัติเมื่อบูต

Onboarding จะตั้งค่าส่วนนี้ให้ แต่เพื่อตรวจสอบ:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## การแก้ไขปัญหา

### หน่วยความจำไม่พอ (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### ประสิทธิภาพช้า

- ใช้ USB SSD แทนการ์ด SD
- ปิดบริการที่ไม่ได้ใช้: `sudo systemctl disable cups bluetooth avahi-daemon`
- ตรวจสอบการลดความเร็ว CPU: `vcgencmd get_throttled` (ควรคืนค่า `0x0`)

### บริการไม่เริ่มทำงาน

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### ปัญหาไบนารี ARM

หาก skill ล้มเหลวด้วย "exec format error":

1. ตรวจสอบว่าไบนารีมีบิลด์ ARM64 หรือไม่
2. ลองบิลด์จากซอร์ส
3. หรือใช้ Docker container ที่รองรับ ARM

### WiFi หลุด

สำหรับ Pi แบบ headless ที่ใช้ WiFi:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## การเปรียบเทียบค่าใช้จ่าย

| การตั้งค่า       | ค่าใช้จ่ายครั้งเดียว | ค่าใช้จ่ายรายเดือน | หมายเหตุ                  |
| -------------- | ------------- | ------------ | ------------------------- |
| **Pi 4 (2GB)** | ~$45          | $0           | + ค่าไฟ (~$5/ปี)          |
| **Pi 4 (4GB)** | ~$55          | $0           | แนะนำ                     |
| **Pi 5 (4GB)** | ~$60          | $0           | ประสิทธิภาพดีที่สุด       |
| **Pi 5 (8GB)** | ~$80          | $0           | เกินจำเป็นแต่รองรับอนาคต |
| DigitalOcean   | $0            | $6/เดือน     | $72/ปี                    |
| Hetzner        | $0            | €3.79/เดือน  | ~$50/ปี                   |

**จุดคุ้มทุน:** Pi คืนทุนใน ~6-12 เดือนเมื่อเทียบกับ VPS บนคลาวด์

---

## ที่เกี่ยวข้อง

- [คู่มือ Linux](/th/platforms/linux) — การตั้งค่า Linux ทั่วไป
- [คู่มือ DigitalOcean](/th/install/digitalocean) — ทางเลือกบนคลาวด์
- [คู่มือ Hetzner](/th/install/hetzner) — การตั้งค่า Docker
- [Tailscale](/th/gateway/tailscale) — การเข้าถึงระยะไกล
- [Nodes](/th/nodes) — จับคู่แล็ปท็อป/โทรศัพท์ของคุณกับ Pi gateway
