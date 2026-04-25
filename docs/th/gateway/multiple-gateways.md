---
read_when:
    - การรัน Gateway มากกว่าหนึ่งตัวบนเครื่องเดียวกัน
    - คุณต้องการคอนฟิก/สถานะ/พอร์ตที่แยกจากกันสำหรับแต่ละ Gateway
summary: รัน OpenClaw Gateways หลายตัวบนโฮสต์เดียว (การแยกออกจากกัน, พอร์ต และโปรไฟล์)
title: Gateways หลายตัว
x-i18n:
    generated_at: "2026-04-25T13:48:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6477a16dc55b694cb73ad6b5140e94529071bad8fc2100ecca88daaa31f9c3c0
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

การตั้งค่าส่วนใหญ่ควรใช้ Gateway เพียงตัวเดียว เพราะ Gateway ตัวเดียวสามารถจัดการการเชื่อมต่อข้อความและเอเจนต์หลายตัวได้ หากคุณต้องการการแยกที่เข้มงวดยิ่งขึ้นหรือความทนทานสำรอง (เช่น rescue bot) ให้รัน Gateways แยกกันโดยใช้โปรไฟล์/พอร์ตที่แยกออกจากกัน

## การตั้งค่าที่แนะนำที่สุด

สำหรับผู้ใช้ส่วนใหญ่ การตั้งค่า rescue bot ที่ง่ายที่สุดคือ:

- ให้บอตหลักอยู่บนโปรไฟล์เริ่มต้น
- ให้ rescue bot รันบน `--profile rescue`
- ใช้ Telegram bot ที่แยกออกจากกันโดยสิ้นเชิงสำหรับบัญชี rescue
- ให้ rescue bot ใช้ base port อื่น เช่น `19789`

สิ่งนี้ทำให้ rescue bot แยกจากบอตหลัก เพื่อให้สามารถดีบักหรือปรับใช้
การเปลี่ยนแปลงคอนฟิกได้หากบอตหลักล่ม เว้นระยะอย่างน้อย 20 พอร์ตระหว่าง
base ports เพื่อให้พอร์ต browser/canvas/CDP ที่คำนวณต่อยอดไม่ชนกัน

## เริ่มต้นใช้งาน Rescue-Bot อย่างรวดเร็ว

ใช้วิธีนี้เป็นเส้นทางเริ่มต้น เว้นแต่คุณจะมีเหตุผลที่ชัดเจนในการทำอย่างอื่น:

```bash
# Rescue bot (Telegram bot แยก, โปรไฟล์แยก, พอร์ต 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

หากบอตหลักของคุณรันอยู่แล้ว โดยทั่วไปนี่ก็เพียงพอแล้ว

ระหว่าง `openclaw --profile rescue onboard`:

- ใช้ token ของ Telegram bot ที่แยกต่างหาก
- ใช้โปรไฟล์ `rescue` ต่อไป
- ใช้ base port ที่สูงกว่าบอตหลักอย่างน้อย 20
- ยอมรับ workspace สำหรับ rescue ตามค่าเริ่มต้น เว้นแต่คุณจัดการไว้เองอยู่แล้ว

หาก onboarding ได้ติดตั้งบริการ rescue ให้คุณแล้ว คำสั่งสุดท้าย
`gateway install` ก็ไม่จำเป็น

## เหตุใดวิธีนี้จึงใช้ได้ผล

rescue bot ยังคงเป็นอิสระ เพราะมีสิ่งเหล่านี้เป็นของตัวเอง:

- โปรไฟล์/คอนฟิก
- state directory
- workspace
- base port (รวมถึงพอร์ตที่ต่อยอดจากมัน)
- Telegram bot token

สำหรับการตั้งค่าส่วนใหญ่ ให้ใช้ Telegram bot ที่แยกต่างหากโดยสิ้นเชิงสำหรับโปรไฟล์ rescue:

- ควบคุมให้เป็นของ operator เท่านั้นได้ง่าย
- แยก bot token และตัวตน
- เป็นอิสระจากการติดตั้ง channel/app ของบอตหลัก
- มีเส้นทางการกู้คืนผ่าน DM ที่เรียบง่ายเมื่อบอตหลักเสีย

## สิ่งที่ `--profile rescue onboard` เปลี่ยนแปลง

`openclaw --profile rescue onboard` ใช้โฟลว์ onboarding ปกติ แต่จะ
เขียนทุกอย่างลงในโปรไฟล์แยกต่างหาก

ในทางปฏิบัติ หมายความว่า rescue bot จะมีสิ่งเหล่านี้เป็นของตัวเอง:

- ไฟล์คอนฟิก
- state directory
- workspace (ค่าเริ่มต้นคือ `~/.openclaw/workspace-rescue`)
- ชื่อบริการแบบ managed

อย่างอื่นในการถามตอบจะเหมือน onboarding ปกติ

## การตั้งค่า Multi-Gateway ทั่วไป

รูปแบบ rescue-bot ข้างต้นเป็นค่าเริ่มต้นที่ง่ายที่สุด แต่รูปแบบการแยกเดียวกันนี้
ใช้ได้กับ Gateway คู่หรือกลุ่มใดๆ บนโฮสต์เดียวกัน

สำหรับการตั้งค่าที่ทั่วไปกว่า ให้กำหนดโปรไฟล์ที่มีชื่อของตัวเองและ
base port ของตัวเองให้กับแต่ละ Gateway เพิ่มเติม:

```bash
# main (โปรไฟล์เริ่มต้น)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

หากคุณต้องการให้ทั้งสอง Gateway ใช้โปรไฟล์ที่มีชื่อ ก็ทำได้เช่นกัน:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

บริการต่างๆ ใช้รูปแบบเดียวกัน:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

ใช้การเริ่มต้นแบบรวดเร็วของ rescue-bot เมื่อคุณต้องการ fallback operator lane ใช้
รูปแบบโปรไฟล์ทั่วไปเมื่อคุณต้องการ Gateways หลายตัวแบบ long-lived สำหรับ
channels, tenants, workspaces หรือบทบาทการปฏิบัติงานที่แตกต่างกัน

## รายการตรวจสอบการแยก

ทำให้สิ่งเหล่านี้ไม่ซ้ำกันสำหรับแต่ละอินสแตนซ์ของ Gateway:

- `OPENCLAW_CONFIG_PATH` — ไฟล์คอนฟิกต่ออินสแตนซ์
- `OPENCLAW_STATE_DIR` — sessions, credentials, caches ต่ออินสแตนซ์
- `agents.defaults.workspace` — root ของ workspace ต่ออินสแตนซ์
- `gateway.port` (หรือ `--port`) — ต้องไม่ซ้ำกันต่ออินสแตนซ์
- พอร์ต browser/canvas/CDP ที่ต่อยอด

หากใช้ร่วมกัน คุณจะเจอ config races และ port conflicts

## การแมปพอร์ต (ค่าที่ต่อยอด)

Base port = `gateway.port` (หรือ `OPENCLAW_GATEWAY_PORT` / `--port`)

- พอร์ต browser control service = base + 2 (loopback เท่านั้น)
- canvas host ให้บริการบนเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`)
- พอร์ต Browser profile CDP จะจัดสรรอัตโนมัติจาก `browser.controlPort + 9 .. + 108`

หากคุณ override ค่าใดในนี้ผ่านคอนฟิกหรือ env คุณต้องทำให้ไม่ซ้ำกันต่ออินสแตนซ์

## หมายเหตุเกี่ยวกับ Browser/CDP (จุดพลาดที่พบบ่อย)

- **อย่า** pin `browser.cdpUrl` ให้เป็นค่าเดียวกันบนหลายอินสแตนซ์
- แต่ละอินสแตนซ์ต้องมี browser control port และช่วง CDP ของตัวเอง (คำนวณจาก gateway port)
- หากคุณต้องการพอร์ต CDP แบบชัดเจน ให้ตั้ง `browser.profiles.<name>.cdpPort` ต่ออินสแตนซ์
- Remote Chrome: ใช้ `browser.profiles.<name>.cdpUrl` (ต่อโปรไฟล์ ต่ออินสแตนซ์)

## ตัวอย่าง env แบบกำหนดเอง

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## การตรวจสอบอย่างรวดเร็ว

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

การแปลผล:

- `gateway status --deep` ช่วยตรวจจับบริการ launchd/systemd/schtasks ที่ค้างจากการติดตั้งรุ่นเก่า
- ข้อความเตือนจาก `gateway probe` เช่น `multiple reachable gateways detected` ถือว่าเป็นเรื่องปกติเฉพาะเมื่อคุณตั้งใจรัน isolated gateway มากกว่าหนึ่งตัว

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [Gateway lock](/th/gateway/gateway-lock)
- [Configuration](/th/gateway/configuration)
