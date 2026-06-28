---
read_when:
    - การนำแผง macOS Canvas ไปใช้
    - การเพิ่มตัวควบคุมเอเจนต์สำหรับพื้นที่ทำงานแบบภาพ
    - การดีบักการโหลดแคนวาสของ WKWebView
summary: แผง Canvas ที่ควบคุมโดย Agent ซึ่งฝังผ่าน WKWebView + สคีมา URL แบบกำหนดเอง
title: แคนวาส
x-i18n:
    generated_at: "2026-06-28T00:13:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

แอป macOS ฝัง **แผง Canvas** ที่ agent ควบคุมโดยใช้ `WKWebView` แผงนี้
เป็นพื้นที่ทำงานภาพขนาดเบาสำหรับ HTML/CSS/JS, A2UI และพื้นผิว UI
แบบโต้ตอบขนาดเล็ก

## Canvas อยู่ที่ใด

สถานะ Canvas ถูกจัดเก็บใต้ Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

แผง Canvas ให้บริการไฟล์เหล่านั้นผ่าน **รูปแบบ URL แบบกำหนดเอง**:

- `openclaw-canvas://<session>/<path>`

ตัวอย่าง:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

หากไม่มี `index.html` ที่ราก แอปจะแสดง **หน้าสเกฟโฟลด์ในตัว**

## พฤติกรรมของแผง

- แผงไม่มีขอบ ปรับขนาดได้ และยึดใกล้แถบเมนู (หรือเคอร์เซอร์เมาส์)
- จดจำขนาด/ตำแหน่งตามแต่ละเซสชัน
- โหลดซ้ำอัตโนมัติเมื่อไฟล์ Canvas ภายในเครื่องเปลี่ยนแปลง
- แสดงแผง Canvas ได้ครั้งละหนึ่งแผงเท่านั้น (สลับเซสชันตามต้องการ)

สามารถปิดใช้ Canvas ได้จาก การตั้งค่า → **อนุญาต Canvas** เมื่อปิดใช้ คำสั่งโหนด
canvas จะคืนค่า `CANVAS_DISABLED`

## พื้นผิว API สำหรับ agent

Canvas เปิดให้ใช้งานผ่าน **Gateway WebSocket** ดังนั้น agent จึงสามารถ:

- แสดง/ซ่อนแผง
- นำทางไปยังพาธหรือ URL
- ประเมิน JavaScript
- จับภาพสแนปชอต

ตัวอย่าง CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

หมายเหตุ:

- `canvas.navigate` รับ **พาธ Canvas ภายในเครื่อง**, URL `http(s)` และ URL `file://`
- หากส่ง `"/"` Canvas จะแสดงสเกฟโฟลด์ภายในเครื่องหรือ `index.html`

## A2UI ใน Canvas

A2UI ถูกโฮสต์โดยโฮสต์ Canvas ของ Gateway และเรนเดอร์ภายในแผง Canvas
เมื่อ Gateway ประกาศโฮสต์ Canvas แอป macOS จะนำทางอัตโนมัติไปยัง
หน้าโฮสต์ A2UI เมื่อเปิดครั้งแรก

URL โฮสต์ A2UI เริ่มต้น:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### คำสั่ง A2UI (v0.8)

ปัจจุบัน Canvas รับข้อความ **A2UI v0.8** จากเซิร์ฟเวอร์→ไคลเอนต์:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

ไม่รองรับ `createSurface` (v0.9)

ตัวอย่าง CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

การทดสอบเบื้องต้นอย่างรวดเร็ว:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## การทริกเกอร์การรัน agent จาก Canvas

Canvas สามารถทริกเกอร์การรัน agent ใหม่ผ่านลิงก์เชิงลึก:

- `openclaw://agent?...`

ตัวอย่าง (ใน JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

พารามิเตอร์คิวรีที่รองรับ:

- `message`: พรอมป์ agent ที่กรอกไว้ล่วงหน้า
- `sessionKey`: ตัวระบุเซสชันแบบเสถียร
- `thinking`: โปรไฟล์การคิดเสริม
- `deliver`, `to` หรือ `channel`: เป้าหมายการส่งมอบ
- `timeoutSeconds`: ระยะหมดเวลาการรันเสริม
- `key`: โทเค็นความปลอดภัยที่แอปสร้างขึ้นสำหรับผู้เรียกภายในเครื่องที่เชื่อถือได้

แอปจะแจ้งขอการยืนยันเว้นแต่จะมีคีย์ที่ถูกต้อง ลิงก์ที่ไม่มีคีย์
จะแสดงข้อความและ URL ก่อนอนุมัติ และไม่สนใจฟิลด์เส้นทางการส่งมอบ
ลิงก์ที่มีคีย์จะใช้เส้นทางการรัน Gateway ปกติ

## หมายเหตุด้านความปลอดภัย

- สคีมาของ Canvas บล็อกการไล่ผ่านไดเรกทอรี ไฟล์ต้องอยู่ใต้รากของเซสชัน
- เนื้อหา Canvas ภายในเครื่องใช้สคีมาแบบกำหนดเอง (ไม่ต้องใช้เซิร์ฟเวอร์ local loopback)
- อนุญาต URL `http(s)` ภายนอกเฉพาะเมื่อมีการนำทางอย่างชัดเจนเท่านั้น

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [WebChat](/th/web/webchat)
