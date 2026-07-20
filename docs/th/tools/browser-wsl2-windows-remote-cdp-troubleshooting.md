---
read_when:
    - เรียกใช้ OpenClaw Gateway ใน WSL2 ขณะที่ Chrome อยู่บน Windows
    - พบข้อผิดพลาดของเบราว์เซอร์/control-ui ที่ซ้ำซ้อนกันทั้งใน WSL2 และ Windows
    - การเลือกระหว่าง Chrome MCP ภายในโฮสต์กับ CDP ระยะไกลแบบดิบในการตั้งค่าที่แยกโฮสต์
summary: แก้ไขปัญหา Gateway บน WSL2 และ CDP ระยะไกลของ Chrome บน Windows แบบเป็นลำดับชั้น
title: การแก้ไขปัญหา WSL2 + Windows + Chrome CDP ระยะไกล
x-i18n:
    generated_at: "2026-07-20T06:08:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 66ec4ed5bfccc66b594a43d56296c69242e8b9cf50b36c6cb3990b1d6ea58faa
    source_path: tools/browser-wsl2-windows-remote-cdp-troubleshooting.md
    workflow: 16
---

ในการตั้งค่าแบบแยกโฮสต์ที่ใช้กันทั่วไป OpenClaw Gateway จะทำงานภายใน WSL2 ส่วน Chrome จะทำงาน
บน Windows และการควบคุมเบราว์เซอร์ต้องข้ามขอบเขตระหว่าง WSL2/Windows ปัญหาอิสระหลายอย่าง
อาจเกิดขึ้นพร้อมกันได้ (ดู
[ปัญหา #39369](https://github.com/openclaw/openclaw/issues/39369)): การส่งผ่านข้อมูล CDP
ความปลอดภัยของต้นทาง Control UI และโทเค็น/การจับคู่ อาจล้มเหลวแยกจากกัน
แต่แสดงข้อผิดพลาดที่ดูคล้ายกัน ให้ตรวจสอบตามชั้นด้านล่าง
ตามลำดับ แทนที่จะคาดเดาว่าส่วนใดเสีย

## เลือกโหมดเบราว์เซอร์ที่ถูกต้องก่อน

### ตัวเลือกที่ 1: CDP ระยะไกลแบบดิบจาก WSL2 ไปยัง Windows

ใช้โปรไฟล์เบราว์เซอร์ระยะไกลที่ชี้จาก WSL2 ไปยังปลายทาง CDP ของ Chrome บน Windows
เลือกวิธีนี้เมื่อ Gateway ยังคงทำงานภายใน WSL2, Chrome ทำงานบน
Windows และการควบคุมเบราว์เซอร์จำเป็นต้องข้ามขอบเขต WSL2/Windows

### ตัวเลือกที่ 2: Chrome MCP ภายในโฮสต์

ใช้ไดรเวอร์ `existing-session` (โปรไฟล์ `user`) เฉพาะเมื่อ Gateway ทำงาน
บนโฮสต์เดียวกับ Chrome ต้องการใช้สถานะเบราว์เซอร์ภายในเครื่องที่ลงชื่อเข้าใช้อยู่ ไม่
จำเป็นต้องส่งผ่านข้อมูลเบราว์เซอร์ข้ามโฮสต์ และไม่จำเป็นต้องใช้ `responsebody`,
การส่งออก PDF, การสกัดกั้นการดาวน์โหลด หรือการดำเนินการแบบกลุ่ม (โปรไฟล์ Chrome MCP
ไม่รองรับความสามารถเหล่านี้)

สำหรับ Gateway บน WSL2 + Chrome บน Windows ให้ใช้ CDP ระยะไกลแบบดิบ Chrome MCP
ทำงานภายในโฮสต์ ไม่ใช่บริดจ์จาก WSL2 ไปยัง Windows

## สถาปัตยกรรมที่ใช้งานได้

- WSL2 เรียกใช้ Gateway ที่ `127.0.0.1:18789`
- Windows เปิด Control UI ในเบราว์เซอร์ปกติที่ `http://127.0.0.1:18789/`
- Chrome บน Windows เปิดเผยปลายทาง CDP บนพอร์ต `9222`
- WSL2 สามารถเข้าถึงปลายทาง CDP บน Windows นั้นได้
- OpenClaw กำหนดให้โปรไฟล์เบราว์เซอร์ชี้ไปยังที่อยู่ที่เข้าถึงได้จาก WSL2

## กฎสำคัญสำหรับ Control UI

เมื่อเปิด UI จาก Windows ให้ใช้ localhost ของ Windows เว้นแต่จะตั้งค่า
HTTPS ไว้โดยเจตนา:

```text
http://127.0.0.1:18789/
```

อย่าใช้ IP ของ LAN เป็นค่าเริ่มต้น HTTP แบบไม่เข้ารหัสบนที่อยู่ LAN หรือ tailnet อาจ
กระตุ้นพฤติกรรมเกี่ยวกับต้นทางที่ไม่ปลอดภัย/การยืนยันตัวตนอุปกรณ์ ซึ่งไม่เกี่ยวข้องกับ CDP โดยตรง ดู
[Control UI](/th/web/control-ui)

## ตรวจสอบแยกตามชั้น

ดำเนินการจากบนลงล่าง อย่าข้ามขั้น แม้แก้ไขชั้นหนึ่งแล้ว ก็อาจยังเห็น
ข้อผิดพลาดอีกชนิดจากชั้นที่อยู่ถัดลงไป

### ชั้นที่ 1: ตรวจสอบว่า Chrome ให้บริการ CDP บน Windows

```powershell
chrome.exe --remote-debugging-port=9222 --user-data-dir="$env:LOCALAPPDATA\OpenClaw\ChromeCDP"
```

Chrome 136 และใหม่กว่าจะไม่สนใจสวิตช์บรรทัดคำสั่งสำหรับการดีบักระยะไกลเมื่อใช้
ไดเรกทอรีข้อมูลเริ่มต้นของ Chrome ให้ใช้ไดเรกทอรีข้อมูลแยกต่างหากที่ไม่ใช่ค่าเริ่มต้น
ดังที่แสดงด้านบน ดู
[การเปลี่ยนแปลงด้านความปลอดภัยของการดีบักระยะไกล](https://developer.chrome.com/blog/remote-debugging-port)
วิธีนี้ไม่ได้ทำให้โปรไฟล์ Chrome ปกติที่ลงชื่อเข้าใช้อยู่สามารถควบคุมจากระยะไกลได้

จาก Windows ให้ตรวจสอบ Chrome เองก่อน:

```powershell
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://127.0.0.1:9222/json/list
```

หากขั้นตอนนี้ล้มเหลว ให้วินิจฉัยตัวรับฟังบน Windows ด้านล่าง ขณะนี้ปัญหา
ยังไม่ใช่ OpenClaw

#### วินิจฉัย IPv4 และ IPv6 ก่อนเปลี่ยน portproxy

Chromium จะพยายามผูกการดีบักระยะไกลกับ `127.0.0.1` ก่อน และจะเปลี่ยนไปใช้
`[::1]` ก็ต่อเมื่อการผูก IPv4 ล้มเหลว กฎ `v4tov4` แบบถาวรที่รับฟังบน
`127.0.0.1:9222` อาจยึดปลายทางนั้นก่อนที่ Chrome จะเริ่มทำงาน จากนั้น Chrome
จะเปลี่ยนไปใช้ `[::1]:9222` ขณะที่กฎเดิมส่งต่อการรับส่งข้อมูล IPv4 กลับไปยัง
ตัวรับฟังของตนเองและส่งคืนการตอบกลับว่างเปล่า

ตรวจสอบตัวรับฟังและกฎพร็อกซีจริงจาก Windows แทนการอนุมาน
จากเวอร์ชันของ Chrome:

```powershell
netstat -ano | findstr :9222
netsh interface portproxy show all
curl.exe http://127.0.0.1:9222/json/version
curl.exe http://[::1]:9222/json/version
```

ใช้ `tasklist /fi "PID eq <PID>"` สำหรับแต่ละ PID จาก `netstat`

- หาก `chrome.exe` ตอบสนองบน `127.0.0.1` ให้ลบกฎ portproxy ที่
  รับฟังบน `127.0.0.1:9222` ด้วย ส่งต่อเฉพาะที่อยู่อะแดปเตอร์ Windows
  ที่ WSL2 เข้าถึงได้ไปยัง `127.0.0.1`
- หาก `chrome.exe` ตอบสนองเฉพาะบน `[::1]` ให้ชี้ตัวรับฟังที่ WSL2 เข้าถึงได้ไปยัง
  `::1` ด้วย `v4tov6` แทนการส่งต่อไปยังที่อยู่ IPv4 ที่ไม่ได้ใช้งาน:

  ```powershell
  netsh interface portproxy add v4tov6 listenaddress=WINDOWS_HOST_OR_IP listenport=9222 connectaddress=::1 connectport=9222
  ```

ผูกตัวรับฟังกับที่อยู่อะแดปเตอร์ที่ WSL2 ต้องใช้ อย่าเปิดเผยพอร์ต CDP
บน `0.0.0.0`, ที่อยู่ LAN หรือที่อยู่ tailnet เพราะ CDP มอบสิทธิ์ควบคุม
เซสชันเบราว์เซอร์

### ชั้นที่ 2: ตรวจสอบว่า WSL2 เข้าถึงปลายทาง Windows นั้นได้

จาก WSL2 ให้ทดสอบที่อยู่เดียวกับที่วางแผนจะใช้ใน `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

ผลลัพธ์ที่ถูกต้อง:

- `/json/version` ส่งคืน JSON พร้อมข้อมูลเมตา Browser / Protocol-Version
- `/json/list` ส่งคืน JSON (อาร์เรย์ว่างก็ใช้ได้หากไม่มีหน้าใดเปิดอยู่)

หากขั้นตอนนี้ล้มเหลว แสดงว่า Windows ยังไม่ได้เปิดเผยพอร์ตให้ WSL2 เข้าถึง
ที่อยู่ไม่ถูกต้องสำหรับฝั่ง WSL2 หรือยังไม่มีไฟร์วอลล์/การส่งต่อพอร์ต/การทำพร็อกซี ให้แก้ไข
ส่วนนี้ก่อนเปลี่ยนการกำหนดค่า OpenClaw

### ชั้นที่ 3: กำหนดค่าโปรไฟล์เบราว์เซอร์ที่ถูกต้อง

กำหนดให้ OpenClaw ชี้ไปยังที่อยู่ที่เข้าถึงได้จาก WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

หมายเหตุ:

- ใช้ที่อยู่ที่ WSL2 เข้าถึงได้ ไม่ใช่ที่อยู่ที่ใช้ได้เฉพาะบน Windows
- คงค่า `attachOnly: true` ไว้สำหรับเบราว์เซอร์ที่จัดการจากภายนอก
- `cdpUrl` สามารถเป็น `http://`, `https://`, `ws://` หรือ `wss://`
- ใช้ HTTP(S) เมื่อต้องการให้ OpenClaw ค้นหา `/json/version`
- ใช้ WS(S) เฉพาะเมื่อผู้ให้บริการเบราว์เซอร์มอบ URL ซ็อกเก็ต DevTools
  โดยตรง
- ทดสอบ URL เดียวกันด้วย `curl` ก่อนคาดหวังว่า OpenClaw จะทำงานสำเร็จ

### ชั้นที่ 4: ตรวจสอบชั้น Control UI แยกต่างหาก

เปิด `http://127.0.0.1:18789/` จาก Windows แล้วตรวจสอบว่า:

- ต้นทางของหน้าตรงกับที่ `gateway.controlUi.allowedOrigins` คาดไว้
- กำหนดค่าการยืนยันตัวตนด้วยโทเค็นหรือการจับคู่อย่างถูกต้อง
- ไม่ได้กำลังดีบักปัญหาการยืนยันตัวตนของ Control UI โดยเข้าใจผิดว่าเป็นปัญหา
  ของเบราว์เซอร์

หน้าที่เป็นประโยชน์: [Control UI](/th/web/control-ui)

### ชั้นที่ 5: ตรวจสอบการควบคุมเบราว์เซอร์แบบครบวงจร

จาก WSL2:

```bash
openclaw browser --browser-profile remote open https://example.com
openclaw browser --browser-profile remote tabs
```

ผลลัพธ์ที่ถูกต้อง:

- แท็บเปิดใน Chrome บน Windows
- `browser tabs` ส่งคืนเป้าหมาย
- การดำเนินการภายหลัง (`snapshot`, `screenshot`, `navigate`) ทำงานจากโปรไฟล์
  เดียวกัน

## ข้อผิดพลาดที่มักทำให้เข้าใจผิด

| ข้อความ                                                                                 | ความหมาย                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `control-ui-insecure-auth`                                                              | ปัญหาต้นทาง UI/บริบทที่ปลอดภัย ไม่ใช่ปัญหาการส่งผ่านข้อมูล CDP                                                                                                                     |
| `token_missing`                                                                         | ปัญหาการกำหนดค่าการยืนยันตัวตน                                                                                                                                                        |
| `pairing required`                                                                      | ปัญหาการอนุมัติอุปกรณ์                                                                                                                                                           |
| `Remote CDP for profile "remote" is not reachable`                                      | WSL2 ไม่สามารถเข้าถึง `cdpUrl` ที่กำหนดค่าไว้                                                                                                                                         |
| การตอบกลับ CDP ว่างเปล่า / `other side closed` ผ่าน portproxy                               | ตัวรับฟังบน Windows ไม่ตรงกันหรือเกิดลูปกลับเข้าตัวเอง ให้ตรวจสอบทั้งสองตระกูล loopback และ `netsh interface portproxy show all`                                                                 |
| `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` | ปลายทาง HTTP ตอบสนอง แต่ไม่สามารถเปิด DevTools WebSocket ได้                                                                                                        |
| การตั้งค่าวิวพอร์ต / โหมดมืด / โลเคล / ออฟไลน์ที่ค้างอยู่หลังเซสชันระยะไกล          | เรียกใช้ `openclaw browser --browser-profile remote stop` เพื่อปิดเซสชันและปล่อยการเชื่อมต่อ Playwright/CDP ที่แคชไว้ โดยไม่ต้องรีสตาร์ต Gateway หรือเบราว์เซอร์ภายนอก |
| หมดเวลาระหว่างตรวจสอบการเข้าถึง CDP                                                         | โดยทั่วไปยังคงเป็นปัญหาการเข้าถึง CDP หรือปลายทางระยะไกลที่ช้าหรือเข้าถึงไม่ได้                                                                                                             |
| `Playwright page enumeration timed out after 3000ms`                                    | เชื่อมต่อ CDP ระยะไกลได้แล้ว แต่การอ่านแท็บแบบถาวรหยุดค้าง                                                                                                                     |
| `No Chrome tabs found for profile="user"`                                               | เลือกโปรไฟล์ Chrome MCP ภายในเครื่องในกรณีที่ไม่มีแท็บภายในโฮสต์ให้ใช้งาน                                                                                                          |

## รายการตรวจสอบเพื่อคัดแยกปัญหาอย่างรวดเร็ว

1. Windows: `127.0.0.1` หรือ `[::1]` รายการใดตอบสนองบน `/json/version` และ
   ตัวรับฟังนั้นเป็นของ `chrome.exe` หรือไม่
2. WSL2: `curl http://WINDOWS_HOST_OR_IP:9222/json/version` ใช้งานได้หรือไม่
3. การกำหนดค่า OpenClaw: `browser.profiles.<name>.cdpUrl` ใช้ที่อยู่เดียวกัน
   ที่ WSL2 เข้าถึงได้หรือไม่
4. Control UI: กำลังเปิด `http://127.0.0.1:18789/` แทน IP ของ LAN หรือไม่
5. กำลังพยายามใช้ `existing-session` ข้ามระหว่าง WSL2 และ Windows
   แทน CDP ระยะไกลแบบดิบหรือไม่

ตรวจสอบปลายทาง Chrome บน Windows ภายในเครื่องก่อน จากนั้นตรวจสอบปลายทางเดียวกัน
จาก WSL2 และหลังจากนั้นจึงดีบักการกำหนดค่า OpenClaw หรือการยืนยันตัวตนของ Control UI

## เนื้อหาที่เกี่ยวข้อง

- [เบราว์เซอร์](/th/tools/browser)
- [การเข้าสู่ระบบเบราว์เซอร์](/th/tools/browser-login)
- [การแก้ไขปัญหาเบราว์เซอร์บน Linux](/th/tools/browser-linux-troubleshooting)
