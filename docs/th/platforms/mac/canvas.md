---
read_when:
    - การนำแผง Canvas บน macOS ไปใช้
    - การเพิ่มส่วนควบคุมเอเจนต์สำหรับพื้นที่ทำงานแบบภาพ
    - การดีบักการโหลดแคนวาสใน WKWebView
summary: แผงแคนวาสที่ควบคุมโดยเอเจนต์ ซึ่งฝังผ่าน WKWebView + สคีม URL แบบกำหนดเอง
title: แคนวาส
x-i18n:
    generated_at: "2026-05-06T09:22:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d8e53f5d1c2e5b3b46e77cb74632e56123f3312dfcc395aa5ac8182c8d58b6cf
    source_path: platforms/mac/canvas.md
    workflow: 16
---

แอป macOS ฝัง **แผง Canvas** ที่ควบคุมโดยเอเจนต์ด้วย `WKWebView` แผงนี้เป็นพื้นที่ทำงานแบบภาพที่มีน้ำหนักเบาสำหรับ HTML/CSS/JS, A2UI และพื้นผิว UI แบบโต้ตอบขนาดเล็ก

## ตำแหน่งที่ Canvas อยู่

สถานะ Canvas ถูกเก็บไว้ใต้ Application Support:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

แผง Canvas ให้บริการไฟล์เหล่านั้นผ่าน **สคีม URL แบบกำหนดเอง**:

- `openclaw-canvas://<session>/<path>`

ตัวอย่าง:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

หากไม่มี `index.html` อยู่ที่ราก แอปจะแสดง **หน้าสแคฟโฟลด์ในตัว**

## ลักษณะการทำงานของแผง

- แผงไร้ขอบ ปรับขนาดได้ และยึดใกล้แถบเมนู (หรือเคอร์เซอร์เมาส์)
- จดจำขนาด/ตำแหน่งแยกตามเซสชัน
- โหลดใหม่อัตโนมัติเมื่อไฟล์ canvas ในเครื่องเปลี่ยนแปลง
- แสดงแผง Canvas ได้ครั้งละหนึ่งแผงเท่านั้น (สลับเซสชันตามต้องการ)

สามารถปิดใช้งาน Canvas ได้จาก Settings → **Allow Canvas** เมื่อปิดใช้งานแล้ว คำสั่งโหนด canvas จะส่งคืน `CANVAS_DISABLED`

## พื้นผิว API ของเอเจนต์

Canvas ถูกเปิดเผยผ่าน **Gateway WebSocket** ดังนั้นเอเจนต์จึงสามารถ:

- แสดง/ซ่อนแผง
- นำทางไปยังพาธหรือ URL
- ประเมิน JavaScript
- จับภาพสแนปช็อต

ตัวอย่าง CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

หมายเหตุ:

- `canvas.navigate` รับ **พาธ canvas ในเครื่อง**, URL แบบ `http(s)` และ URL แบบ `file://`
- หากคุณส่ง `"/"` Canvas จะแสดงสแคฟโฟลด์ในเครื่องหรือ `index.html`

## A2UI ใน Canvas

A2UI ถูกโฮสต์โดยโฮสต์ canvas ของ Gateway และเรนเดอร์ภายในแผง Canvas เมื่อ Gateway ประกาศโฮสต์ Canvas แอป macOS จะนำทางอัตโนมัติไปยังหน้าโฮสต์ A2UI ในการเปิดครั้งแรก

URL โฮสต์ A2UI เริ่มต้น:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### คำสั่ง A2UI (v0.8)

ขณะนี้ Canvas รับข้อความเซิร์ฟเวอร์→ไคลเอนต์ **A2UI v0.8**:

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

การ smoke test อย่างรวดเร็ว:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## การทริกเกอร์การรันเอเจนต์จาก Canvas

Canvas สามารถทริกเกอร์การรันเอเจนต์ใหม่ผ่าน deep links:

- `openclaw://agent?...`

ตัวอย่าง (ใน JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

แอปจะขอการยืนยัน เว้นแต่จะมีการระบุคีย์ที่ถูกต้อง

## หมายเหตุด้านความปลอดภัย

- สคีม Canvas บล็อกการข้ามไดเรกทอรี ไฟล์ต้องอยู่ใต้รากของเซสชัน
- เนื้อหา Canvas ในเครื่องใช้สคีมแบบกำหนดเอง (ไม่จำเป็นต้องมีเซิร์ฟเวอร์ local loopback)
- อนุญาต URL ภายนอกแบบ `http(s)` เฉพาะเมื่อนำทางอย่างชัดเจนเท่านั้น

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [WebChat](/th/web/webchat)
