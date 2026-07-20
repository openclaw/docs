---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: แก้ไขปัญหาการเริ่มต้น CDP ของ Chrome/Brave/Edge/Chromium สำหรับการควบคุมเบราว์เซอร์ของ OpenClaw บน Linux
title: การแก้ไขปัญหาเบราว์เซอร์
x-i18n:
    generated_at: "2026-07-20T06:14:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e5db2da2d43129862f0c005213df828f6eae81f5561e57d41795ea90787822a
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 16
---

## ปัญหา: ไม่สามารถเริ่ม Chrome CDP บนพอร์ต 18800

```json
{ "error": "ข้อผิดพลาด: ไม่สามารถเริ่ม Chrome CDP บนพอร์ต 18800 สำหรับโปรไฟล์ \"openclaw\" ได้" }
```

### สาเหตุหลัก

บน Ubuntu และ Linux ดิสโทรส่วนใหญ่ `apt install chromium` จะติดตั้งตัวครอบ snap
ไม่ใช่เบราว์เซอร์จริง:

```text
หมายเหตุ กำลังเลือก 'chromium-browser' แทน 'chromium'
chromium-browser เป็นเวอร์ชันใหม่ล่าสุดอยู่แล้ว (2:1snap1-0ubuntu2)
```

การจำกัดสิทธิ์ด้วย AppArmor ของ Snap รบกวนวิธีที่ OpenClaw เริ่มและตรวจสอบ
โปรเซสของเบราว์เซอร์

ความล้มเหลวในการเริ่มทำงานอื่นๆ ที่พบบ่อยบน Linux:

- `The profile appears to be in use by another Chromium process`: ไฟล์ล็อก
  `Singleton*` ที่ค้างอยู่ในไดเรกทอรีโปรไฟล์ที่มีการจัดการ OpenClaw จะลบ
  ล็อกเหล่านี้และลองอีกครั้งหนึ่งครั้ง เมื่อล็อกชี้ไปยังโปรเซสที่หยุดทำงานแล้วหรือ
  โปรเซสบนโฮสต์อื่น
- `Missing X server or $DISPLAY`: มีการร้องขอเบราว์เซอร์แบบแสดงหน้าต่างอย่างชัดเจน
  บนโฮสต์ที่ไม่มีเซสชันเดสก์ท็อป โปรไฟล์ภายในเครื่องที่มีการจัดการจะกลับไปใช้
  โหมด headless บน Linux เมื่อไม่ได้ตั้งค่าทั้ง `DISPLAY` และ `WAYLAND_DISPLAY`
  หากตั้งค่า `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless: false` หรือ
  `browser.profiles.<name>.headless: false` ให้ลบการบังคับใช้โหมดแสดงหน้าต่างดังกล่าว ตั้งค่า
  `OPENCLAW_BROWSER_HEADLESS=1` เริ่ม `Xvfb` เรียกใช้
  `openclaw browser start --headless` เพื่อเริ่มเบราว์เซอร์ที่มีการจัดการแบบครั้งเดียว หรือเรียกใช้
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

### วิธีแก้ไขที่ 2: ใช้ snap Chromium ในโหมดแนบอย่างเดียว

หากจำเป็นต้องใช้ snap Chromium ต่อไป ให้กำหนดค่า OpenClaw ให้แนบกับ
เบราว์เซอร์ที่เริ่มด้วยตนเองแทนการเริ่มเบราว์เซอร์เอง:

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

หรือกำหนดให้เริ่มโดยอัตโนมัติด้วยบริการผู้ใช้ systemd:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=เบราว์เซอร์ OpenClaw (Chrome CDP)
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

| ตัวเลือก                      | คำอธิบาย                                                          | ค่าเริ่มต้น                                                            |
| --------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `browser.enabled`           | เปิดใช้การควบคุมเบราว์เซอร์                                               | `true`                                                             |
| `browser.executablePath`    | พาธไปยังไบนารีของเบราว์เซอร์ที่ใช้ Chromium (Chrome/Brave/Edge/Chromium) | ตรวจหาโดยอัตโนมัติ (เลือกเบราว์เซอร์เริ่มต้นของระบบปฏิบัติการก่อน หากใช้ Chromium) |
| `browser.headless`          | ทำงานโดยไม่มี GUI                                                      | `false`                                                            |
| `OPENCLAW_BROWSER_HEADLESS` | การบังคับใช้ระดับโปรเซสสำหรับโหมด headless ของเบราว์เซอร์ภายในเครื่องที่มีการจัดการ         | ไม่ได้ตั้งค่า                                                              |
| `browser.noSandbox`         | เพิ่มแฟล็ก `--no-sandbox` (จำเป็นสำหรับการตั้งค่า Linux บางรูปแบบ)               | `false`                                                            |
| `browser.attachOnly`        | ไม่เริ่มเบราว์เซอร์ แนบกับเบราว์เซอร์ที่มีอยู่เท่านั้น              | `false`                                                            |

บน Raspberry Pi, โฮสต์ VPS รุ่นเก่า หรือพื้นที่จัดเก็บข้อมูลที่ช้า ให้ใช้เบราว์เซอร์ที่เริ่ม
ด้วยตนเองพร้อม `attachOnly` เมื่อ Chrome ต้องใช้เวลาในการเปิดเผยปลายทาง HTTP ของ CDP
หรือเตรียมพร้อมนานกว่ากำหนดเวลาของเบราว์เซอร์ที่มีการจัดการจะอนุญาต

### ปัญหา: ไม่พบแท็บ Chrome สำหรับ profile="user"

กำลังใช้โปรไฟล์ `user` (`existing-session` / Chrome MCP) และไม่มี
แท็บที่เปิดอยู่ให้แนบ

ตัวเลือกการแก้ไข:

1. ใช้เบราว์เซอร์ที่มีการจัดการแทน:
   `openclaw browser --browser-profile openclaw start` (หรือตั้งค่า
   `browser.defaultProfile: "openclaw"`)
2. เปิด Chrome ภายในเครื่องค้างไว้โดยมีแท็บเปิดอยู่อย่างน้อยหนึ่งแท็บ แล้วลองอีกครั้งด้วย
   `--browser-profile user`

หมายเหตุ:

- `user` ใช้ได้เฉพาะบนโฮสต์เท่านั้น บนเซิร์ฟเวอร์ Linux, คอนเทนเนอร์ หรือโฮสต์ระยะไกล ควรใช้
  โปรไฟล์ CDP แทน
- `user` และโปรไฟล์ `existing-session` อื่นๆ ใช้ข้อจำกัดปัจจุบันของ Chrome MCP
  ร่วมกัน ได้แก่ ทำได้เฉพาะการดำเนินการที่ขับเคลื่อนด้วยการอ้างอิง อัปโหลดได้ครั้งละหนึ่งไฟล์ ไม่มีการบังคับค่า `timeoutMs`
  ของกล่องโต้ตอบ ไม่มี `wait --load networkidle` และไม่มี `responsebody`, การส่งออก PDF,
  การสกัดกั้นการดาวน์โหลด หรือการดำเนินการแบบกลุ่ม
- โปรไฟล์ไดรเวอร์ `openclaw` ภายในเครื่องจะกำหนด `cdpPort`/`cdpUrl` โดยอัตโนมัติ ให้ตั้งค่า
  เหล่านี้ด้วยตนเองเฉพาะสำหรับ CDP ระยะไกล
- โปรไฟล์ CDP ระยะไกลยอมรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) สำหรับการค้นหา `/json/version` หรือใช้ WS(S) เมื่อบริการเบราว์เซอร์
  ให้ URL ซ็อกเก็ต DevTools โดยตรง

## ที่เกี่ยวข้อง

- [เบราว์เซอร์](/th/tools/browser)
- [การเข้าสู่ระบบเบราว์เซอร์](/th/tools/browser-login)
- [การแก้ไขปัญหา WSL2 ของเบราว์เซอร์](/th/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
