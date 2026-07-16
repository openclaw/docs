---
read_when:
    - การใช้งานแผง Canvas บน macOS
    - การเพิ่มการควบคุมเอเจนต์สำหรับพื้นที่ทำงานแบบภาพ
    - การดีบักการโหลด Canvas ใน WKWebView
summary: แผง Canvas ที่ควบคุมโดยเอเจนต์ ซึ่งฝังผ่าน WKWebView และรูปแบบ URL แบบกำหนดเอง
title: แคนวาส
x-i18n:
    generated_at: "2026-07-16T19:24:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

แอป macOS ฝัง **แผง Canvas** ที่ควบคุมโดยเอเจนต์โดยใช้ `WKWebView` ซึ่งเป็น
พื้นที่ทำงานแบบภาพขนาดเล็กสำหรับ HTML/CSS/JS, A2UI และพื้นผิว UI แบบโต้ตอบ
ขนาดเล็ก

## ตำแหน่งที่ Canvas อยู่

สถานะ Canvas จะจัดเก็บไว้ภายใต้ Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

แผง Canvas ให้บริการไฟล์เหล่านั้นผ่านรูปแบบ URL แบบกำหนดเอง
`openclaw-canvas://<session>/<path>`:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

หากไม่มี `index.html` ที่ราก แอปจะแสดงหน้าต้นแบบในตัว

## ลักษณะการทำงานของแผง

- แผงไร้ขอบที่ปรับขนาดได้และยึดไว้ใกล้แถบเมนู (หรือเคอร์เซอร์เมาส์)
- จดจำขนาด/ตำแหน่งในแต่ละเซสชัน
- โหลดใหม่โดยอัตโนมัติเมื่อไฟล์ Canvas ภายในเครื่องมีการเปลี่ยนแปลง
- แสดงแผง Canvas ได้ครั้งละหนึ่งแผงเท่านั้น (สลับเซสชันตามความจำเป็น)

สามารถปิดใช้งาน Canvas ได้จาก Settings -> **Allow Canvas** เมื่อปิดใช้งาน
คำสั่งโหนด Canvas จะส่งคืน `CANVAS_DISABLED`

## พื้นผิว API สำหรับเอเจนต์

Canvas เปิดให้ใช้งานผ่าน WebSocket ของ Gateway ดังนั้นเอเจนต์จึงสามารถแสดง/ซ่อน
แผง นำทางไปยังพาธหรือ URL ประเมิน JavaScript และจับภาพ
สแนปช็อตได้:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` รองรับพาธ Canvas ภายในเครื่อง, URL แบบ `http(s)` และ URL แบบ `file://`
การส่ง `"/"` จะแสดงต้นแบบภายในเครื่องหรือ `index.html`

เป้าหมายที่โฮสต์โดย Gateway ภายใต้ `/__openclaw__/canvas/` และ
`/__openclaw__/a2ui/` จะได้รับการแก้ไขผ่าน URL ของ Canvas ที่จำกัดขอบเขตในปัจจุบันของเซสชันโหนด
แอปจะรีเฟรชสิทธิ์ความสามารถอายุสั้นนั้นก่อนนำทาง
ไม่จำเป็นต้องสร้างหรือคัดลอก URL ของสิทธิ์ความสามารถด้วยตนเอง

## A2UI ใน Canvas

A2UI โฮสต์โดยโฮสต์ Canvas ของ Gateway และแสดงผลภายในแผง Canvas
เมื่อ Gateway ประกาศโฮสต์ Canvas แอป macOS จะนำทาง
ไปยังหน้าโฮสต์ A2UI โดยอัตโนมัติเมื่อเปิดครั้งแรก

URL ที่ประกาศจะถูกจำกัดขอบเขตด้วยสิทธิ์ความสามารถ ตัวอย่างเช่น
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`
ให้ถือว่า URL นี้เป็นข้อมูลประจำตัวชั่วคราว ไม่ใช่ลิงก์ถาวร

### คำสั่ง A2UI (v0.8)

Canvas รองรับข้อความ A2UI v0.8 จากเซิร์ฟเวอร์ไปยังไคลเอ็นต์ ได้แก่ `beginRendering`,
`surfaceUpdate`, `dataModelUpdate`, `deleteSurface` ส่วน `createSurface` (v0.9)
ยังไม่รองรับ

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"หากคุณอ่านข้อความนี้ได้ แสดงว่าการพุช A2UI ทำงานแล้ว"},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

การทดสอบเบื้องต้นอย่างรวดเร็ว:

```bash
openclaw nodes canvas a2ui push --node <id> --text "สวัสดีจาก A2UI"
```

## การทริกเกอร์การเรียกใช้เอเจนต์จาก Canvas

Canvas สามารถทริกเกอร์การเรียกใช้เอเจนต์ใหม่ผ่านดีปลิงก์ `openclaw://agent?...`:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

พารามิเตอร์คิวรีที่รองรับ:

| พารามิเตอร์                  | ความหมาย                                               |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | พรอมต์เอเจนต์ที่กรอกไว้ล่วงหน้า                               |
| `sessionKey`               | ตัวระบุเซสชันแบบคงที่                            |
| `thinking`                 | โปรไฟล์การคิดที่ระบุหรือไม่ก็ได้                            |
| `deliver`, `to`, `channel` | เป้าหมายการส่ง                                      |
| `timeoutSeconds`           | ระยะหมดเวลาการเรียกใช้ที่ระบุหรือไม่ก็ได้                                 |
| `key`                      | โทเค็นความปลอดภัยที่แอปสร้างขึ้นสำหรับผู้เรียกใช้ภายในเครื่องที่เชื่อถือได้ |

แอปจะแจ้งให้ยืนยัน เว้นแต่จะมีการระบุคีย์ที่ถูกต้อง ลิงก์
ที่ไม่มีคีย์จะแสดงข้อความและ URL ก่อนอนุมัติ และจะไม่ใช้ฟิลด์การกำหนดเส้นทาง
การส่ง ส่วนลิงก์ที่มีคีย์จะใช้เส้นทางการเรียกใช้ Gateway ตามปกติ

## หมายเหตุด้านความปลอดภัย

- รูปแบบ Canvas ป้องกันการข้ามไดเรกทอรี ไฟล์ต้องอยู่ภายใต้รากของเซสชัน
- เนื้อหา Canvas ภายในเครื่องใช้รูปแบบที่กำหนดเอง (ไม่ต้องใช้เซิร์ฟเวอร์ลูปแบ็ก)
- อนุญาต URL `http(s)` ภายนอกเฉพาะเมื่อนำทางไปยัง URL นั้นอย่างชัดเจนเท่านั้น
- หน้าเว็บทั่วไปใช้สำหรับการแสดงผลเท่านั้น ระบบยอมรับการดำเนินการของเอเจนต์เฉพาะจาก
  รูปแบบ Canvas ที่แอปเป็นเจ้าของ หรือเอกสาร A2UI ของ Gateway ที่จำกัดขอบเขตด้วยสิทธิ์ความสามารถตรงกับที่
  แอปเลือกเท่านั้น เฟรมย่อย การเปลี่ยนเส้นทาง สิทธิ์ความสามารถที่หมดอายุ และคิวรีที่เปลี่ยนแปลง
  ไม่สามารถส่งการดำเนินการได้

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [WebChat](/th/web/webchat)
