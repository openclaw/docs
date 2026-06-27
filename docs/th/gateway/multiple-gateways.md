---
read_when:
    - เรียกใช้ Gateway มากกว่าหนึ่งตัวบนเครื่องเดียวกัน
    - คุณต้องมีการกำหนดค่า/สถานะ/พอร์ตที่แยกกันสำหรับแต่ละ Gateway
summary: เรียกใช้ OpenClaw Gateways หลายตัวบนโฮสต์เดียว (การแยกส่วน, พอร์ต, และโปรไฟล์)
title: หลาย Gateway
x-i18n:
    generated_at: "2026-06-27T17:35:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

การตั้งค่าส่วนใหญ่ควรใช้ Gateway เดียว เพราะ Gateway เดียวสามารถรองรับการเชื่อมต่อข้อความและเอเจนต์หลายรายการได้ หากคุณต้องการการแยกที่แข็งแรงขึ้นหรือความซ้ำซ้อน (เช่น บอตกู้คืน) ให้รัน Gateway แยกกันด้วยโปรไฟล์/พอร์ตที่แยกจากกัน

## การตั้งค่าที่แนะนำที่สุด

สำหรับผู้ใช้ส่วนใหญ่ การตั้งค่าบอตกู้คืนที่ง่ายที่สุดคือ:

- เก็บบอตหลักไว้บนโปรไฟล์เริ่มต้น
- รันบอตกู้คืนบน `--profile rescue`
- ใช้บอต Telegram ที่แยกต่างหากโดยสมบูรณ์สำหรับบัญชีกู้คืน
- เก็บบอตกู้คืนไว้บนพอร์ตฐานที่ต่างออกไป เช่น `19789`

วิธีนี้ทำให้บอตกู้คืนแยกออกจากบอตหลัก เพื่อให้สามารถดีบักหรือใช้การเปลี่ยนแปลง
การกำหนดค่าได้หากบอตหลักล่ม เว้นระยะห่างระหว่างพอร์ตฐานอย่างน้อย 20 พอร์ต
เพื่อไม่ให้พอร์ต browser/canvas/CDP ที่คำนวณตามมาเกิดการชนกัน

## เริ่มต้นใช้งานบอตกู้คืนอย่างรวดเร็ว

ใช้แนวทางนี้เป็นค่าเริ่มต้น เว้นแต่คุณมีเหตุผลหนักแน่นที่จะทำอย่างอื่น:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

หากบอตหลักของคุณกำลังรันอยู่แล้ว โดยปกติเท่านี้ก็เพียงพอ

ระหว่าง `openclaw --profile rescue onboard`:

- ใช้โทเค็นบอต Telegram ที่แยกต่างหาก
- เก็บโปรไฟล์ `rescue` ไว้
- ใช้พอร์ตฐานที่สูงกว่าบอตหลักอย่างน้อย 20 พอร์ต
- ยอมรับพื้นที่ทำงานกู้คืนเริ่มต้น เว้นแต่คุณจัดการไว้เองอยู่แล้ว

หากการออนบอร์ดติดตั้งบริการกู้คืนให้คุณแล้ว ก็ไม่จำเป็นต้องรัน
`gateway install` ขั้นสุดท้าย

## เหตุผลที่วิธีนี้ทำงานได้

บอตกู้คืนยังคงเป็นอิสระ เพราะมีสิ่งต่อไปนี้เป็นของตัวเอง:

- โปรไฟล์/การกำหนดค่า
- ไดเรกทอรีสถานะ
- พื้นที่ทำงาน
- พอร์ตฐาน (รวมถึงพอร์ตที่คำนวณตามมา)
- โทเค็นบอต Telegram

สำหรับการตั้งค่าส่วนใหญ่ ให้ใช้บอต Telegram ที่แยกต่างหากโดยสมบูรณ์สำหรับโปรไฟล์กู้คืน:

- ทำให้เป็นแบบเฉพาะผู้ปฏิบัติงานได้ง่าย
- โทเค็นบอตและตัวตนแยกกัน
- เป็นอิสระจากการติดตั้งช่องทาง/แอปของบอตหลัก
- เส้นทางกู้คืนผ่าน DM ที่เรียบง่ายเมื่อบอตหลักเสีย

## สิ่งที่ `--profile rescue onboard` เปลี่ยนแปลง

`openclaw --profile rescue onboard` ใช้โฟลว์ออนบอร์ดปกติ แต่จะ
เขียนทุกอย่างลงในโปรไฟล์แยกต่างหาก

ในทางปฏิบัติ หมายความว่าบอตกู้คืนจะมีสิ่งต่อไปนี้เป็นของตัวเอง:

- ไฟล์การกำหนดค่า
- ไดเรกทอรีสถานะ
- พื้นที่ทำงาน (ค่าเริ่มต้นคือ `~/.openclaw/workspace-rescue`)
- ชื่อบริการที่มีการจัดการ

พรอมป์อื่น ๆ จะเหมือนกับการออนบอร์ดตามปกติ

## การตั้งค่า Gateway หลายตัวแบบทั่วไป

เลย์เอาต์บอตกู้คืนด้านบนเป็นค่าเริ่มต้นที่ง่ายที่สุด แต่รูปแบบการแยกแบบเดียวกัน
ใช้ได้กับ Gateway คู่ใด ๆ หรือกลุ่มใด ๆ บนโฮสต์เดียว

สำหรับการตั้งค่าที่ทั่วไปกว่า ให้กำหนดโปรไฟล์ที่มีชื่อของตัวเองและพอร์ตฐาน
ของตัวเองให้ Gateway เพิ่มเติมแต่ละตัว:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

หากคุณต้องการให้ Gateway ทั้งสองตัวใช้โปรไฟล์ที่มีชื่อ ก็ทำได้เช่นกัน:

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

ใช้วิธีเริ่มต้นใช้งานบอตกู้คืนอย่างรวดเร็วเมื่อคุณต้องการช่องทางผู้ปฏิบัติงานสำรอง ใช้
รูปแบบโปรไฟล์ทั่วไปเมื่อคุณต้องการ Gateway หลายตัวที่ทำงานระยะยาวสำหรับ
ช่องทาง ผู้เช่า พื้นที่ทำงาน หรือบทบาทการปฏิบัติการที่แตกต่างกัน

## รายการตรวจสอบการแยก

เก็บสิ่งเหล่านี้ให้ไม่ซ้ำกันต่ออินสแตนซ์ Gateway:

- `OPENCLAW_CONFIG_PATH` — ไฟล์การกำหนดค่าต่ออินสแตนซ์
- `OPENCLAW_STATE_DIR` — เซสชัน ข้อมูลรับรอง แคช ต่ออินสแตนซ์
- `agents.defaults.workspace` — รากพื้นที่ทำงานต่ออินสแตนซ์
- `gateway.port` (หรือ `--port`) — ไม่ซ้ำกันต่ออินสแตนซ์
- พอร์ต browser/canvas/CDP ที่คำนวณตามมา

หากใช้สิ่งเหล่านี้ร่วมกัน คุณจะเจอการแย่งกันเขียนการกำหนดค่าและพอร์ตชนกัน

## การแมปพอร์ต (คำนวณตามมา)

พอร์ตฐาน = `gateway.port` (หรือ `OPENCLAW_GATEWAY_PORT` / `--port`)

- พอร์ตบริการควบคุมเบราว์เซอร์ = ฐาน + 2 (เฉพาะ loopback)
- canvas host ให้บริการบนเซิร์ฟเวอร์ HTTP ของ Gateway (พอร์ตเดียวกับ `gateway.port`)
- พอร์ต CDP ของโปรไฟล์เบราว์เซอร์จะจัดสรรอัตโนมัติจาก `browser.controlPort + 9 .. + 108`

หากคุณแทนที่ค่าใด ๆ เหล่านี้ในการกำหนดค่าหรือ env คุณต้องเก็บให้ไม่ซ้ำกันต่ออินสแตนซ์

## หมายเหตุเกี่ยวกับ Browser/CDP (ข้อผิดพลาดที่พบบ่อย)

- **อย่า** ตรึง `browser.cdpUrl` ให้เป็นค่าเดียวกันบนหลายอินสแตนซ์
- แต่ละอินสแตนซ์ต้องมีพอร์ตควบคุมเบราว์เซอร์และช่วง CDP ของตัวเอง (คำนวณจากพอร์ต Gateway ของตัวเอง)
- หากคุณต้องการพอร์ต CDP แบบระบุชัดเจน ให้ตั้งค่า `browser.profiles.<name>.cdpPort` ต่ออินสแตนซ์
- Chrome ระยะไกล: ใช้ `browser.profiles.<name>.cdpUrl` (ต่อโปรไฟล์ ต่ออินสแตนซ์)

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

การตีความ:

- `gateway status --deep` ช่วยตรวจจับบริการ launchd/systemd/schtasks ที่ค้างจากการติดตั้งเก่า
- ข้อความเตือนของ `gateway probe` เช่น `multiple reachable gateway identities detected` คาดว่าจะเกิดขึ้นเฉพาะเมื่อคุณตั้งใจรัน Gateway ที่แยกกันมากกว่าหนึ่งตัว หรือเมื่อ OpenClaw พิสูจน์ไม่ได้ว่าเป้าหมาย probe ที่เข้าถึงได้เป็น Gateway เดียวกัน SSH tunnel, proxy URL หรือ URL ระยะไกลที่กำหนดค่าไว้ไปยัง Gateway เดียวกันถือเป็น Gateway เดียวที่มีหลายทรานสปอร์ต แม้พอร์ตทรานสปอร์ตจะแตกต่างกันก็ตาม

## ที่เกี่ยวข้อง

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [ล็อก Gateway](/th/gateway/gateway-lock)
- [การกำหนดค่า](/th/gateway/configuration)
