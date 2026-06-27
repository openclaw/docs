---
read_when:
    - การตั้งค่า OpenClaw บน Raspberry Pi
    - การรัน OpenClaw บนอุปกรณ์ ARM
    - สร้าง AI ส่วนตัวราคาประหยัดที่เปิดใช้งานตลอดเวลา
summary: โฮสต์ OpenClaw บน Raspberry Pi เพื่อการโฮสต์ด้วยตนเองที่ทำงานตลอดเวลา
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T17:45:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

รัน OpenClaw Gateway แบบถาวรและเปิดใช้งานตลอดเวลาบน Raspberry Pi เนื่องจาก Pi เป็นเพียง Gateway (โมเดลรันบนคลาวด์ผ่าน API) แม้แต่ Pi รุ่นไม่สูงมากก็รับภาระงานได้ดี — ต้นทุนฮาร์ดแวร์ทั่วไปคือ **$35–80 จ่ายครั้งเดียว** ไม่มีค่าบริการรายเดือน

## ความเข้ากันได้ของฮาร์ดแวร์

| Pi model    | RAM    | Works? | Notes                               |
| ----------- | ------ | ------ | ----------------------------------- |
| Pi 5        | 4/8 GB | ดีที่สุด | เร็วที่สุด แนะนำให้ใช้               |
| Pi 4        | 4 GB   | ดี   | จุดที่คุ้มค่าสำหรับผู้ใช้ส่วนใหญ่          |
| Pi 4        | 2 GB   | ใช้ได้     | เพิ่ม swap                           |
| Pi 4        | 1 GB   | ค่อนข้างจำกัด  | เป็นไปได้เมื่อใช้ swap และตั้งค่าน้อยที่สุด |
| Pi 3B+      | 1 GB   | ช้า   | ใช้งานได้แต่หน่วง                 |
| Pi Zero 2 W | 512 MB | ไม่     | ไม่แนะนำ                    |

**ขั้นต่ำ:** RAM 1 GB, 1 คอร์, พื้นที่ว่างดิสก์ 500 MB, ระบบปฏิบัติการ 64-bit
**แนะนำ:** RAM 2 GB ขึ้นไป, การ์ด SD 16 GB ขึ้นไป (หรือ USB SSD), Ethernet

## ข้อกำหนดเบื้องต้น

- Raspberry Pi 4 หรือ 5 พร้อม RAM 2 GB ขึ้นไป (แนะนำ 4 GB)
- การ์ด MicroSD (16 GB ขึ้นไป) หรือ USB SSD (ประสิทธิภาพดีกว่า)
- อะแดปเตอร์จ่ายไฟ Pi ทางการ
- การเชื่อมต่อเครือข่าย (Ethernet หรือ WiFi)
- Raspberry Pi OS แบบ 64-bit (จำเป็น -- อย่าใช้ 32-bit)
- ประมาณ 30 นาที

## การตั้งค่า

<Steps>
  <Step title="Flash the OS">
    ใช้ **Raspberry Pi OS Lite (64-bit)** -- ไม่จำเป็นต้องมีเดสก์ท็อปสำหรับเซิร์ฟเวอร์แบบ headless

    1. ดาวน์โหลด [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
    2. เลือกระบบปฏิบัติการ: **Raspberry Pi OS Lite (64-bit)**
    3. ในกล่องโต้ตอบการตั้งค่า ให้กำหนดค่าล่วงหน้า:
       - Hostname: `gateway-host`
       - เปิดใช้ SSH
       - ตั้งชื่อผู้ใช้และรหัสผ่าน
       - ตั้งค่า WiFi (ถ้าไม่ได้ใช้ Ethernet)
    4. เขียนอิมเมจลงในการ์ด SD หรือไดรฟ์ USB ใส่เข้าไป แล้วบูต Pi

  </Step>

  <Step title="Connect via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Update the system">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Install Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Add swap (important for 2 GB or less)">
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

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    ทำตามวิซาร์ด แนะนำให้ใช้คีย์ API แทน OAuth สำหรับอุปกรณ์แบบ headless Telegram เป็นช่องทางที่เริ่มต้นได้ง่ายที่สุด

  </Step>

  <Step title="Verify">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    บนคอมพิวเตอร์ของคุณ ให้รับ URL แดชบอร์ดจาก Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    จากนั้นสร้างอุโมงค์ SSH ในเทอร์มินัลอีกหน้าต่างหนึ่ง:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    เปิด URL ที่พิมพ์ออกมาในเบราว์เซอร์ภายในเครื่องของคุณ สำหรับการเข้าถึงระยะไกลแบบเปิดตลอดเวลา โปรดดู [การผสานรวม Tailscale](/th/gateway/tailscale)

  </Step>
</Steps>

## เคล็ดลับด้านประสิทธิภาพ

**ใช้ USB SSD** -- การ์ด SD ช้าและเสื่อมสภาพ USB SSD ช่วยเพิ่มประสิทธิภาพอย่างมาก ดู [คู่มือการบูต Pi จาก USB](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)

**เปิดใช้แคชการคอมไพล์โมดูล** -- ช่วยเร่งการเรียกใช้ CLI ซ้ำบนโฮสต์ Pi ที่ใช้พลังงานต่ำกว่า:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` ทำให้การรีสตาร์ต Gateway ตามปกติอยู่ภายในกระบวนการเดิม ซึ่งหลีกเลี่ยงการส่งต่อระหว่างกระบวนการเพิ่มเติมและทำให้การติดตาม PID บนโฮสต์ขนาดเล็กเรียบง่าย

**ลดการใช้หน่วยความจำ** -- สำหรับการตั้งค่าแบบ headless ให้คืนหน่วยความจำ GPU และปิดบริการที่ไม่ได้ใช้:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd drop-in สำหรับการรีสตาร์ตที่เสถียร** -- หาก Pi เครื่องนี้ใช้รัน OpenClaw เป็นหลัก ให้เพิ่ม service drop-in:

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

จากนั้นรัน `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service` บน Pi แบบ headless ให้เปิดใช้ lingering หนึ่งครั้งด้วย เพื่อให้บริการของผู้ใช้อยู่รอดหลังออกจากระบบ: `sudo loginctl enable-linger "$(whoami)"`

## การตั้งค่าโมเดลที่แนะนำ

เนื่องจาก Pi รันเฉพาะ Gateway ให้ใช้โมเดล API ที่โฮสต์บนคลาวด์:

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

อย่ารัน LLM ภายในเครื่องบน Pi — แม้แต่โมเดลขนาดเล็กก็ช้าเกินกว่าจะมีประโยชน์ ให้ Claude หรือ GPT ทำงานด้านโมเดลแทน

## หมายเหตุเกี่ยวกับไบนารี ARM

ฟีเจอร์ส่วนใหญ่ของ OpenClaw ใช้งานได้บน ARM64 โดยไม่ต้องเปลี่ยนแปลง (Node.js, Telegram, WhatsApp/Baileys, Chromium) ไบนารีที่บางครั้งไม่มีบิลด์ ARM มักเป็นเครื่องมือ CLI ของ Go/Rust ที่ Skills จัดส่งมาแบบไม่บังคับ ตรวจสอบหน้า release ของไบนารีที่ขาดหายสำหรับอาร์ติแฟกต์ `linux-arm64` / `aarch64` ก่อนถอยกลับไปบิลด์จากซอร์ส

## การคงอยู่ของข้อมูลและการสำรองข้อมูล

สถานะของ OpenClaw อยู่ภายใต้:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` ต่อ agent, สถานะ channel/provider, session
- `~/.openclaw/workspace/` — workspace ของ agent (SOUL.md, memory, artifact)

ข้อมูลเหล่านี้ยังคงอยู่หลังรีบูต สร้าง snapshot แบบพกพาได้ด้วย:

```bash
openclaw backup create
```

หากเก็บข้อมูลเหล่านี้ไว้บน SSD ทั้งประสิทธิภาพและอายุการใช้งานจะดีขึ้นเมื่อเทียบกับการ์ด SD

## การแก้ไขปัญหา

**หน่วยความจำไม่พอ** -- ตรวจสอบว่า swap เปิดใช้งานอยู่ด้วย `free -h` ปิดบริการที่ไม่ได้ใช้ (`sudo systemctl disable cups bluetooth avahi-daemon`) ใช้เฉพาะโมเดลแบบ API

**ประสิทธิภาพช้า** -- ใช้ USB SSD แทนการ์ด SD ตรวจสอบการลดความเร็ว CPU ด้วย `vcgencmd get_throttled` (ควรส่งคืน `0x0`)

**บริการไม่เริ่มทำงาน** -- ตรวจสอบล็อกด้วย `journalctl --user -u openclaw-gateway.service --no-pager -n 100` และรัน `openclaw doctor --non-interactive` หากเป็น Pi แบบ headless ให้ตรวจสอบด้วยว่าเปิดใช้ lingering แล้ว: `sudo loginctl enable-linger "$(whoami)"`

**ปัญหาไบนารี ARM** -- หาก skill ล้มเหลวพร้อมข้อความ "exec format error" ให้ตรวจสอบว่าไบนารีมีบิลด์ ARM64 หรือไม่ ตรวจสอบสถาปัตยกรรมด้วย `uname -m` (ควรแสดง `aarch64`)

**WiFi หลุด** -- ปิดการจัดการพลังงานของ WiFi: `sudo iwconfig wlan0 power off`

## ขั้นตอนถัดไป

- [ช่องทาง](/th/channels) -- เชื่อมต่อ Telegram, WhatsApp, Discord และอื่นๆ
- [การกำหนดค่า Gateway](/th/gateway/configuration) -- ตัวเลือกการตั้งค่าทั้งหมด
- [การอัปเดต](/th/install/updating) -- ทำให้ OpenClaw เป็นเวอร์ชันล่าสุดอยู่เสมอ

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [เซิร์ฟเวอร์ Linux](/th/vps)
- [แพลตฟอร์ม](/th/platforms)
