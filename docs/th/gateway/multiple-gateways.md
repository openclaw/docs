---
read_when:
    - การรัน Gateway มากกว่าหนึ่งตัวบนเครื่องเดียวกัน
    - คุณต้องมีการกำหนดค่า/สถานะ/พอร์ตที่แยกกันสำหรับแต่ละ Gateway
summary: เรียกใช้ OpenClaw Gateway หลายอินสแตนซ์บนโฮสต์เดียว (การแยกสภาพแวดล้อม พอร์ต และโปรไฟล์)
title: Gateway หลายรายการ
x-i18n:
    generated_at: "2026-04-30T09:53:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 655f9ea5100813d5836f24eb47a5646443f83d70953efa64122633a5a1341002
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

การตั้งค่าส่วนใหญ่ควรใช้ Gateway เดียว เพราะ Gateway เดียวสามารถจัดการการเชื่อมต่อข้อความและเอเจนต์ได้หลายรายการ หากคุณต้องการการแยกที่เข้มงวดขึ้นหรือความซ้ำซ้อน (เช่น บอตกู้คืน) ให้รัน Gateway แยกกันด้วยโปรไฟล์/พอร์ตที่แยกกัน

## การตั้งค่าที่แนะนำที่สุด

สำหรับผู้ใช้ส่วนใหญ่ การตั้งค่าบอตกู้คืนที่ง่ายที่สุดคือ:

- เก็บบอตหลักไว้บนโปรไฟล์เริ่มต้น
- รันบอตกู้คืนบน `--profile rescue`
- ใช้บอต Telegram แยกต่างหากโดยสิ้นเชิงสำหรับบัญชีกู้คืน
- เก็บบอตกู้คืนไว้บนพอร์ตฐานอื่น เช่น `19789`

วิธีนี้จะทำให้บอตกู้คืนแยกออกจากบอตหลัก เพื่อให้สามารถดีบักหรือปรับใช้
การเปลี่ยนแปลงการตั้งค่าได้หากบอตหลักล่ม เว้นระยะพอร์ตฐานอย่างน้อย 20 พอร์ต
เพื่อไม่ให้พอร์ต browser/canvas/CDP ที่ได้มาชนกัน

## เริ่มต้นใช้งานบอตกู้คืนอย่างรวดเร็ว

ใช้เส้นทางนี้เป็นค่าเริ่มต้น เว้นแต่คุณจะมีเหตุผลหนักแน่นที่จะทำอย่างอื่น:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

หากบอตหลักของคุณกำลังทำงานอยู่ โดยปกติเท่านี้ก็เพียงพอแล้ว

ระหว่าง `openclaw --profile rescue onboard`:

- ใช้โทเคนบอต Telegram แยกต่างหาก
- เก็บโปรไฟล์ `rescue` ไว้
- ใช้พอร์ตฐานที่สูงกว่าบอตหลักอย่างน้อย 20 พอร์ต
- ยอมรับพื้นที่ทำงานกู้คืนเริ่มต้น เว้นแต่คุณจัดการเองอยู่แล้ว

หากการเริ่มต้นใช้งานได้ติดตั้งบริการกู้คืนให้คุณแล้ว คำสั่ง
`gateway install` สุดท้ายก็ไม่จำเป็น

## เหตุผลที่วิธีนี้ใช้ได้

บอตกู้คืนยังคงเป็นอิสระเพราะมีสิ่งเหล่านี้เป็นของตัวเอง:

- โปรไฟล์/การตั้งค่า
- ไดเรกทอรีสถานะ
- พื้นที่ทำงาน
- พอร์ตฐาน (รวมถึงพอร์ตที่ได้มา)
- โทเคนบอต Telegram

สำหรับการตั้งค่าส่วนใหญ่ ให้ใช้บอต Telegram แยกต่างหากโดยสิ้นเชิงสำหรับโปรไฟล์กู้คืน:

- ทำให้จำกัดเฉพาะผู้ปฏิบัติการได้ง่าย
- โทเคนและตัวตนของบอตแยกกัน
- เป็นอิสระจากการติดตั้งช่องทาง/แอปของบอตหลัก
- เส้นทางกู้คืนผ่าน DM ที่เรียบง่ายเมื่อบอตหลักเสีย

## สิ่งที่ `--profile rescue onboard` เปลี่ยน

`openclaw --profile rescue onboard` ใช้ขั้นตอนการเริ่มต้นใช้งานปกติ แต่จะ
เขียนทุกอย่างลงในโปรไฟล์แยกต่างหาก

ในทางปฏิบัติ หมายความว่าบอตกู้คืนจะได้รับสิ่งเหล่านี้เป็นของตัวเอง:

- ไฟล์การตั้งค่า
- ไดเรกทอรีสถานะ
- พื้นที่ทำงาน (ค่าเริ่มต้นคือ `~/.openclaw/workspace-rescue`)
- ชื่อบริการที่จัดการ

พรอมป์อื่นๆ จะเหมือนกับการเริ่มต้นใช้งานปกติ

## การตั้งค่า Gateway หลายตัวทั่วไป

รูปแบบบอตกู้คืนด้านบนเป็นค่าเริ่มต้นที่ง่ายที่สุด แต่รูปแบบการแยกเดียวกัน
ใช้ได้กับ Gateway คู่ใดก็ได้หรือกลุ่มใดก็ได้บนโฮสต์เดียว

สำหรับการตั้งค่าที่ทั่วไปกว่า ให้ Gateway เพิ่มเติมแต่ละตัวมีโปรไฟล์ที่ตั้งชื่อของตัวเองและ
พอร์ตฐานของตัวเอง:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

หากคุณต้องการให้ Gateway ทั้งสองใช้โปรไฟล์ที่ตั้งชื่อไว้ ก็ทำได้เช่นกัน:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

บริการใช้รูปแบบเดียวกัน:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

ใช้การเริ่มต้นใช้งานบอตกู้คืนอย่างรวดเร็วเมื่อคุณต้องการช่องทางผู้ปฏิบัติการสำรอง ใช้
รูปแบบโปรไฟล์ทั่วไปเมื่อคุณต้องการ Gateway หลายตัวที่ใช้งานระยะยาวสำหรับ
ช่องทาง ผู้เช่า พื้นที่ทำงาน หรือบทบาทการปฏิบัติงานที่แตกต่างกัน

## รายการตรวจสอบการแยก

ทำให้รายการเหล่านี้ไม่ซ้ำกันต่ออินสแตนซ์ Gateway:

- `OPENCLAW_CONFIG_PATH` — ไฟล์การตั้งค่าต่ออินสแตนซ์
- `OPENCLAW_STATE_DIR` — เซสชัน ข้อมูลรับรอง แคช ต่ออินสแตนซ์
- `agents.defaults.workspace` — รากพื้นที่ทำงานต่ออินสแตนซ์
- `gateway.port` (หรือ `--port`) — ไม่ซ้ำกันต่ออินสแตนซ์
- พอร์ต browser/canvas/CDP ที่ได้มา

หากแชร์สิ่งเหล่านี้ คุณจะเจอการแย่งเขียนการตั้งค่าและพอร์ตชนกัน

## การแมปพอร์ต (ที่ได้มา)

พอร์ตฐาน = `gateway.port` (หรือ `OPENCLAW_GATEWAY_PORT` / `--port`)

- พอร์ตบริการควบคุมเบราว์เซอร์ = ฐาน + 2 (เฉพาะ loopback)
- โฮสต์ canvas ให้บริการบนเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`)
- พอร์ต CDP ของโปรไฟล์เบราว์เซอร์จัดสรรอัตโนมัติจาก `browser.controlPort + 9 .. + 108`

หากคุณแทนที่ค่าใดๆ เหล่านี้ใน config หรือ env คุณต้องทำให้ค่าเหล่านั้นไม่ซ้ำกันต่ออินสแตนซ์

## หมายเหตุ Browser/CDP (ข้อผิดพลาดที่พบบ่อย)

- **อย่า** ปัก `browser.cdpUrl` ไว้เป็นค่าเดียวกันในหลายอินสแตนซ์
- แต่ละอินสแตนซ์ต้องมีพอร์ตควบคุมเบราว์เซอร์และช่วง CDP ของตัวเอง (ได้มาจากพอร์ต Gateway ของมัน)
- หากคุณต้องการพอร์ต CDP แบบชัดเจน ให้ตั้ง `browser.profiles.<name>.cdpPort` ต่ออินสแตนซ์
- Chrome ระยะไกล: ใช้ `browser.profiles.<name>.cdpUrl` (ต่อโปรไฟล์ ต่ออินสแตนซ์)

## ตัวอย่าง env แบบแมนนวล

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

การตีความ:

- `gateway status --deep` ช่วยตรวจจับบริการ launchd/systemd/schtasks ค้างจากการติดตั้งเก่า
- ข้อความเตือนของ `gateway probe` เช่น `multiple reachable gateways detected` คาดหวังได้เฉพาะเมื่อคุณตั้งใจรัน Gateway ที่แยกกันมากกว่าหนึ่งตัว

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [ล็อก Gateway](/th/gateway/gateway-lock)
- [การตั้งค่า](/th/gateway/configuration)
