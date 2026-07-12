---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: แก้ไขปัญหาการเริ่มต้น CDP ของ Chrome/Brave/Edge/Chromium สำหรับการควบคุมเบราว์เซอร์ของ OpenClaw บน Linux
title: การแก้ไขปัญหาเบราว์เซอร์
x-i18n:
    generated_at: "2026-07-12T16:45:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0256e8ee441802086cd486923060be54f8966b423e5dcb71fc8961bbab5d729
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## ปัญหา: ไม่สามารถเริ่ม Chrome CDP บนพอร์ต 18800

```json
{ "error": "Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"." }
```

### สาเหตุหลัก

บน Ubuntu และลินุกซ์ดิสทริบิวชันส่วนใหญ่ `apt install chromium` จะติดตั้งตัวห่อหุ้มแบบ snap
ไม่ใช่เบราว์เซอร์จริง:

```text
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

การจำกัดสิทธิ์ด้วย AppArmor ของ Snap รบกวนวิธีที่ OpenClaw สร้างและตรวจติดตาม
โปรเซสของเบราว์เซอร์

ความล้มเหลวอื่น ๆ ที่พบบ่อยในการเริ่มทำงานบน Linux:

- `The profile appears to be in use by another Chromium process`: มีไฟล์ล็อก
  `Singleton*` ที่ค้างอยู่ในไดเรกทอรีโปรไฟล์ที่จัดการโดยระบบ OpenClaw จะลบ
  ล็อกเหล่านี้และลองอีกครั้งหนึ่งครั้ง เมื่อล็อกชี้ไปยังโปรเซสที่หยุดทำงานแล้วหรือ
  โปรเซสบนโฮสต์อื่น
- `Missing X server or $DISPLAY`: มีการร้องขอให้เปิดเบราว์เซอร์แบบแสดงผลอย่างชัดเจน
  บนโฮสต์ที่ไม่มีเซสชันเดสก์ท็อป โปรไฟล์ภายในเครื่องที่จัดการโดยระบบจะเปลี่ยนไปใช้
  โหมดไม่มีส่วนติดต่อแบบกราฟิกบน Linux เมื่อไม่ได้ตั้งค่าทั้ง `DISPLAY` และ `WAYLAND_DISPLAY`
  หากคุณตั้งค่า `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` หรือ
  `browser.profiles.<name>.headless: false` ให้ลบการแทนที่เพื่อใช้โหมดแสดงผลนั้น ตั้งค่า
  `OPENCLAW_BROWSER_HEADLESS=1` เริ่ม `Xvfb` เรียกใช้
  `openclaw browser start --headless` เพื่อเริ่มเบราว์เซอร์ที่จัดการโดยระบบแบบครั้งเดียว หรือเรียกใช้
  OpenClaw ในเซสชันเดสก์ท็อปจริง

### วิธีแก้ไขที่ 1: ติดตั้ง Google Chrome (แนะนำ)

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # หากมีข้อผิดพลาดเกี่ยวกับการขึ้นต่อกัน
```

อัปเดต `~/.openclaw/openclaw.json`:

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### วิธีแก้ไขที่ 2: ใช้ snap Chromium ในโหมดเชื่อมต่อเท่านั้น

หากคุณจำเป็นต้องใช้ snap Chromium ต่อไป ให้กำหนดค่า OpenClaw ให้เชื่อมต่อกับ
เบราว์เซอร์ที่เริ่มด้วยตนเองแทนการเปิดเบราว์เซอร์เอง:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

เริ่ม Chromium ด้วยตนเอง:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

หากต้องการ คุณสามารถตั้งค่าให้เริ่มโดยอัตโนมัติด้วยบริการผู้ใช้ systemd:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable --now openclaw-browser.service
```

### ตรวจสอบว่าเบราว์เซอร์ทำงานได้

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### ข้อมูลอ้างอิงการกำหนดค่า

| ตัวเลือก                           | คำอธิบาย                                                          | ค่าเริ่มต้น                                                            |
| -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `browser.enabled`                | เปิดใช้งานการควบคุมเบราว์เซอร์                                               | `true`                                                             |
| `browser.executablePath`         | พาธไปยังไฟล์ไบนารีของเบราว์เซอร์ที่ใช้ Chromium (Chrome/Brave/Edge/Chromium) | ตรวจหาโดยอัตโนมัติ (ให้ความสำคัญกับเบราว์เซอร์เริ่มต้นของระบบปฏิบัติการหากใช้ Chromium) |
| `browser.headless`               | ทำงานโดยไม่มีส่วนติดต่อแบบกราฟิก                                                      | `false`                                                            |
| `OPENCLAW_BROWSER_HEADLESS`      | ค่าแทนที่ระดับโปรเซสสำหรับโหมดไม่มีส่วนติดต่อแบบกราฟิกของเบราว์เซอร์ภายในเครื่องที่จัดการโดยระบบ         | ไม่ได้ตั้งค่า                                                              |
| `browser.noSandbox`              | เพิ่มแฟล็ก `--no-sandbox` (จำเป็นสำหรับการตั้งค่า Linux บางแบบ)               | `false`                                                            |
| `browser.attachOnly`             | ไม่เปิดเบราว์เซอร์ แต่เชื่อมต่อกับเบราว์เซอร์ที่มีอยู่เท่านั้น              | `false`                                                            |
| `browser.cdpPortRangeStart`      | พอร์ต CDP ภายในเครื่องเริ่มต้นสำหรับโปรไฟล์ที่กำหนดค่าโดยอัตโนมัติ                   | `18800` (คำนวณจากพอร์ตของ Gateway)                            |
| `browser.localLaunchTimeoutMs`   | ระยะหมดเวลาสำหรับการค้นหา Chrome ภายในเครื่องที่จัดการโดยระบบ สูงสุด `120000`               | `15000`                                                            |
| `browser.localCdpReadyTimeoutMs` | ระยะหมดเวลารอ CDP พร้อมใช้งานหลังเริ่ม Chrome ภายในเครื่องที่จัดการโดยระบบ สูงสุด `120000`      | `8000`                                                             |

ค่าระยะหมดเวลาทั้งสองต้องเป็นจำนวนเต็มบวกไม่เกิน `120000` มิลลิวินาที ค่าอื่น ๆ
จะถูกปฏิเสธขณะโหลดการกำหนดค่า บน Raspberry Pi, โฮสต์ VPS รุ่นเก่า หรือพื้นที่จัดเก็บข้อมูล
ที่ทำงานช้า ให้เพิ่ม `browser.localLaunchTimeoutMs` เมื่อ Chrome ต้องใช้เวลามากขึ้นเพื่อ
เปิดเผยปลายทาง HTTP ของ CDP ให้เพิ่ม `browser.localCdpReadyTimeoutMs` เมื่อ
เริ่มทำงานสำเร็จแล้ว แต่ `openclaw browser start` ยังคงรายงานว่า `not reachable
after start`

### ปัญหา: ไม่พบแท็บ Chrome สำหรับ profile="user"

คุณกำลังใช้โปรไฟล์ `user` (`existing-session` / Chrome MCP) และไม่มี
แท็บที่เปิดอยู่ให้เชื่อมต่อ

ตัวเลือกในการแก้ไข:

1. ใช้เบราว์เซอร์ที่จัดการโดยระบบแทน:
   `openclaw browser --browser-profile openclaw start` (หรือตั้งค่า
   `browser.defaultProfile: "openclaw"`)
2. เปิด Chrome ภายในเครื่องไว้โดยมีแท็บเปิดอยู่อย่างน้อยหนึ่งแท็บ แล้วลองอีกครั้งด้วย
   `--browser-profile user`

หมายเหตุ:

- `user` ใช้งานได้เฉพาะบนโฮสต์เท่านั้น บนเซิร์ฟเวอร์ Linux, คอนเทนเนอร์ หรือโฮสต์ระยะไกล ควรใช้
  โปรไฟล์ CDP แทน
- `user` และโปรไฟล์ `existing-session` อื่น ๆ ใช้ข้อจำกัดปัจจุบันของ Chrome MCP
  ร่วมกัน ได้แก่ รองรับเฉพาะการดำเนินการที่ขับเคลื่อนด้วยข้อมูลอ้างอิง อัปโหลดได้ครั้งละหนึ่งไฟล์ ไม่มีการแทนที่ `timeoutMs`
  สำหรับกล่องโต้ตอบ ไม่รองรับ `wait --load networkidle` และไม่รองรับ `responsebody` การส่งออก PDF
  การดักจับการดาวน์โหลด หรือการดำเนินการแบบกลุ่ม
- โปรไฟล์ไดรเวอร์ `openclaw` ภายในเครื่องจะกำหนด `cdpPort`/`cdpUrl` โดยอัตโนมัติ ให้ตั้งค่า
  เหล่านี้ด้วยตนเองเฉพาะสำหรับ CDP ระยะไกลเท่านั้น
- โปรไฟล์ CDP ระยะไกลรองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) สำหรับการค้นหาผ่าน `/json/version` หรือใช้ WS(S) เมื่อบริการเบราว์เซอร์
  ให้ URL ซ็อกเก็ต DevTools โดยตรงแก่คุณ

## เนื้อหาที่เกี่ยวข้อง

- [เบราว์เซอร์](/th/tools/browser)
- [การเข้าสู่ระบบเบราว์เซอร์](/th/tools/browser-login)
- [การแก้ไขปัญหา WSL2 ของเบราว์เซอร์](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
