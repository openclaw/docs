---
read_when:
    - การตั้งค่า OpenClaw บน Raspberry Pi
    - การใช้งาน OpenClaw บนอุปกรณ์ ARM
    - สร้าง AI ส่วนตัวราคาประหยัดที่พร้อมทำงานตลอดเวลา
summary: โฮสต์ OpenClaw บน Raspberry Pi เพื่อการโฮสต์ด้วยตนเองที่ทำงานตลอดเวลา
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T16:19:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway แบบถาวรและทำงานตลอดเวลาบน Raspberry Pi เนื่องจาก Pi ทำหน้าที่เป็นเพียงเกตเวย์ (โมเดลทำงานบนคลาวด์ผ่าน API) แม้แต่ Pi สเปกทั่วไปก็รองรับภาระงานได้ดี โดยทั่วไปมีค่าใช้จ่ายด้านฮาร์ดแวร์ **$35-80 จ่ายครั้งเดียว** และไม่มีค่าบริการรายเดือน

## ความเข้ากันได้ของฮาร์ดแวร์

| รุ่น Pi      | RAM    | ใช้งานได้หรือไม่ | หมายเหตุ                                      |
| ------------ | ------ | ---------------- | --------------------------------------------- |
| Pi 5         | 4/8 GB | ดีที่สุด         | เร็วที่สุดและแนะนำให้ใช้                      |
| Pi 4         | 4 GB   | ดี               | เป็นตัวเลือกที่ลงตัวสำหรับผู้ใช้ส่วนใหญ่      |
| Pi 4         | 2 GB   | พอใช้            | เพิ่มพื้นที่สลับ                              |
| Pi 4         | 1 GB   | ค่อนข้างจำกัด    | ใช้งานได้เมื่อมีพื้นที่สลับและกำหนดค่าขั้นต่ำ |
| Pi 3B+       | 1 GB   | ช้า              | ใช้งานได้แต่ตอบสนองช้า                        |
| Pi Zero 2 W  | 512 MB | ไม่ได้           | ไม่แนะนำ                                      |

**ขั้นต่ำ:** RAM 1 GB, 1 คอร์, พื้นที่ว่างบนดิสก์ 500 MB และระบบปฏิบัติการ 64 บิต
**แนะนำ:** RAM 2 GB ขึ้นไป, การ์ด SD 16 GB ขึ้นไป (หรือ USB SSD) และ Ethernet

## ข้อกำหนดเบื้องต้น

- Raspberry Pi 4 หรือ 5 ที่มี RAM 2 GB ขึ้นไป (แนะนำ 4 GB)
- การ์ด MicroSD (16 GB ขึ้นไป) หรือ USB SSD (ประสิทธิภาพดีกว่า)
- แหล่งจ่ายไฟอย่างเป็นทางการของ Pi
- การเชื่อมต่อเครือข่าย (Ethernet หรือ WiFi)
- Raspberry Pi OS แบบ 64 บิต (จำเป็น -- ห้ามใช้แบบ 32 บิต)
- เวลาประมาณ 30 นาที

## การตั้งค่า

<Steps>
  <Step title="แฟลชระบบปฏิบัติการ">
    ใช้ **Raspberry Pi OS Lite (64-bit)** -- เซิร์ฟเวอร์แบบไม่มีหน้าจอไม่จำเป็นต้องมีเดสก์ท็อป

    1. ดาวน์โหลด [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
    2. เลือกระบบปฏิบัติการ: **Raspberry Pi OS Lite (64-bit)**
    3. กำหนดค่าล่วงหน้าในกล่องโต้ตอบการตั้งค่า:
       - ชื่อโฮสต์: `gateway-host`
       - เปิดใช้งาน SSH
       - ตั้งชื่อผู้ใช้และรหัสผ่าน
       - กำหนดค่า WiFi (หากไม่ได้ใช้ Ethernet)
    4. แฟลชลงในการ์ด SD หรือไดรฟ์ USB จากนั้นเสียบอุปกรณ์และเปิดเครื่อง Pi

  </Step>

  <Step title="เชื่อมต่อผ่าน SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="อัปเดตระบบ">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="ติดตั้ง Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="เพิ่มพื้นที่สลับ (สำคัญสำหรับ RAM 2 GB หรือน้อยกว่า)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="ติดตั้ง OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="ดำเนินการเริ่มต้นใช้งาน">
    ```bash
    openclaw onboard --install-daemon
    ```

    ทำตามตัวช่วยสร้าง สำหรับอุปกรณ์แบบไม่มีหน้าจอ แนะนำให้ใช้คีย์ API แทน OAuth โดย Telegram เป็นช่องทางที่เริ่มต้นใช้งานได้ง่ายที่สุด

  </Step>

  <Step title="ตรวจสอบ">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="เข้าถึงส่วนติดต่อควบคุม">
    รับ URL แดชบอร์ดจาก Pi บนคอมพิวเตอร์ของคุณ:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    จากนั้นสร้างอุโมงค์ SSH ในเทอร์มินัลอีกหน้าต่างหนึ่ง:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    เปิด URL ที่แสดงในเบราว์เซอร์ภายในเครื่องของคุณ สำหรับการเข้าถึงจากระยะไกลที่พร้อมใช้งานตลอดเวลา โปรดดู[การผสานการทำงานกับ Tailscale](/th/gateway/tailscale)

  </Step>
</Steps>

## เคล็ดลับด้านประสิทธิภาพ

**ใช้ USB SSD** -- การ์ด SD ทำงานช้าและเสื่อมสภาพได้ง่าย USB SSD ช่วยเพิ่มประสิทธิภาพอย่างมากและรองรับรอบการเขียนได้มากกว่า หากยังติดตั้งระบบปฏิบัติการไว้บน SD ให้ใช้ USB SSD สำหรับ `OPENCLAW_STATE_DIR` โปรดดู[คู่มือการบูต Pi ผ่าน USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)

**เปิดใช้งานแคชการคอมไพล์โมดูล** -- ช่วยเพิ่มความเร็วในการเรียกใช้ CLI ซ้ำบนโฮสต์ Pi ที่มีกำลังประมวลผลต่ำ `OPENCLAW_NO_RESPAWN=1` ทำให้การรีสตาร์ต Gateway ตามปกติเกิดขึ้นภายในกระบวนการเดิม หลีกเลี่ยงการส่งต่องานระหว่างกระบวนการเพิ่มเติมและทำให้การติดตาม PID บนโฮสต์ขนาดเล็กไม่ซับซ้อน:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

ใช้ `/var/tmp` แทน `/tmp` -- ดิสทริบิวชันบางตัวล้าง `/tmp` เมื่อบูต ซึ่งจะทำให้แคชที่เตรียมไว้หายไป

**ลดการใช้หน่วยความจำ** -- สำหรับการตั้งค่าแบบไม่มีหน้าจอ ให้คืนหน่วยความจำของ GPU และปิดใช้งานบริการที่ไม่ได้ใช้:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**ไฟล์กำหนดค่าเพิ่มเติมของ systemd เพื่อการรีสตาร์ตที่เสถียร** -- หาก Pi เครื่องนี้ใช้เรียกใช้ OpenClaw เป็นหลัก ให้เพิ่มไฟล์กำหนดค่าเพิ่มเติมของบริการ:

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

จากนั้นเรียกใช้ `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` สำหรับ Pi แบบไม่มีหน้าจอ ให้เปิดใช้งานการทำงานต่อเนื่องหนึ่งครั้งด้วย เพื่อให้บริการของผู้ใช้ยังคงทำงานหลังออกจากระบบ: `sudo loginctl enable-linger "$(whoami)"`

## การตั้งค่าโมเดลที่แนะนำ

เนื่องจาก Pi เรียกใช้เพียง Gateway ให้ใช้โมเดล API ที่โฮสต์บนคลาวด์ -- อย่าเรียกใช้ LLM ภายในเครื่องบน Pi เพราะแม้แต่โมเดลขนาดเล็กก็ช้าเกินกว่าจะใช้งานได้จริง:

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

## หมายเหตุเกี่ยวกับไบนารี ARM

ฟีเจอร์ส่วนใหญ่ของ OpenClaw ทำงานบน ARM64 ได้โดยไม่ต้องแก้ไข (Node.js, Telegram, WhatsApp/Baileys และ Chromium) ไบนารีที่บางครั้งไม่มีบิลด์สำหรับ ARM มักเป็นเครื่องมือ CLI ภาษา Go/Rust ซึ่งเป็นส่วนเสริมที่มาพร้อมกับ Skills ตรวจสอบสถาปัตยกรรมด้วย `uname -m` (ควรแสดง `aarch64`) จากนั้นตรวจสอบหน้ารีลีสของไบนารีที่ขาดหายว่ามีอาร์ติแฟกต์ `linux-arm64` / `aarch64` หรือไม่ ก่อนเปลี่ยนไปบิลด์จากซอร์สโค้ด

## การเก็บรักษาข้อมูลและการสำรองข้อมูล

สถานะของ OpenClaw อยู่ภายใต้:

- `~/.openclaw/` -- `openclaw.json`, `auth-profiles.json` ของแต่ละเอเจนต์, สถานะของช่องทาง/ผู้ให้บริการ และเซสชัน
- `~/.openclaw/workspace/` -- พื้นที่ทำงานของเอเจนต์ (SOUL.md, หน่วยความจำ และอาร์ติแฟกต์)

ข้อมูลเหล่านี้ยังคงอยู่หลังการรีบูต และการใช้ SSD แทนการ์ด SD จะช่วยทั้งด้านประสิทธิภาพและอายุการใช้งาน สร้างสแนปช็อตที่เคลื่อนย้ายได้ด้วย:

```bash
openclaw backup create
```

## การแก้ไขปัญหา

**หน่วยความจำไม่เพียงพอ** -- ตรวจสอบว่าพื้นที่สลับทำงานอยู่ด้วย `free -h` ปิดใช้งานบริการที่ไม่ได้ใช้ (`sudo systemctl disable cups bluetooth avahi-daemon`) และใช้เฉพาะโมเดลที่ทำงานผ่าน API

**ประสิทธิภาพช้า** -- ใช้ USB SSD แทนการ์ด SD ตรวจสอบการลดความเร็วของ CPU ด้วย `vcgencmd get_throttled` (ควรคืนค่า `0x0`)

**บริการไม่เริ่มทำงาน** -- ตรวจสอบบันทึกด้วย `journalctl --user -u openclaw-gateway.service --no-pager -n 100` และเรียกใช้ `openclaw doctor --non-interactive` หากเป็น Pi แบบไม่มีหน้าจอ ให้ตรวจสอบด้วยว่าเปิดใช้งานการทำงานต่อเนื่องแล้ว: `sudo loginctl enable-linger "$(whoami)"`

**ปัญหาเกี่ยวกับไบนารี ARM** -- หากสกิลล้มเหลวพร้อมข้อความ "exec format error" ให้ตรวจสอบว่าไบนารีนั้นมีบิลด์ ARM64 หรือไม่ ตรวจสอบสถาปัตยกรรมด้วย `uname -m` (ควรแสดง `aarch64`)

**WiFi หลุด** -- ปิดใช้งานการจัดการพลังงานของ WiFi: `sudo iwconfig wlan0 power off`

## ขั้นตอนถัดไป

- [ช่องทาง](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่นๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือกการกำหนดค่าทั้งหมด
- [การอัปเดต](/th/install/updating) -- ดูแล OpenClaw ให้เป็นเวอร์ชันล่าสุด

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [เซิร์ฟเวอร์ Linux](/th/vps)
- [แพลตฟอร์ม](/th/platforms)
