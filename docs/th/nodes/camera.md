---
read_when:
    - การเพิ่มหรือแก้ไขการถ่ายภาพด้วยกล้องบน Node ของ iOS/Android หรือ macOS
    - การขยายเวิร์กโฟลว์ไฟล์ชั่วคราว MEDIA ที่เอเจนต์เข้าถึงได้
summary: 'การจับภาพจากกล้อง (Node บน iOS/Android + แอป macOS) สำหรับเอเจนต์: ภาพถ่าย (jpg) และคลิปวิดีโอสั้น (mp4)'
title: การจับภาพจากกล้อง
x-i18n:
    generated_at: "2026-07-12T16:18:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw รองรับการจับภาพจากกล้องสำหรับเวิร์กโฟลว์ของเอเจนต์บน Node **iOS**, **Android** และ **macOS** ที่จับคู่แล้ว โดยสามารถถ่ายภาพ (`jpg`) หรือบันทึกคลิปวิดีโอสั้น (`mp4` พร้อมเสียงได้ตามต้องการ) ผ่าน `node.invoke` ของ Gateway

การเข้าถึงกล้องทั้งหมดอยู่ภายใต้การควบคุมของการตั้งค่าผู้ใช้ในแต่ละแพลตฟอร์ม

## Node iOS

### การตั้งค่าผู้ใช้บน iOS

- แท็บ iOS Settings → **Camera** → **Allow Camera** (`camera.enabled`)
  - ค่าเริ่มต้น: **เปิด** (หากไม่มีคีย์ จะถือว่าเปิดใช้งาน)
  - เมื่อปิด: คำสั่ง `camera.*` จะส่งคืน `CAMERA_DISABLED`

### คำสั่ง iOS (ผ่าน `node.invoke` ของ Gateway)

- `camera.list`
  - เพย์โหลดการตอบกลับ: `devices` — อาร์เรย์ของ `{ id, name, position, deviceType }`

- `camera.snap`
  - พารามิเตอร์:
    - `facing`: `front|back` (ค่าเริ่มต้น: `front`)
    - `maxWidth`: ตัวเลข (ไม่บังคับ; ค่าเริ่มต้น `1600`)
    - `quality`: `0..1` (ไม่บังคับ; ค่าเริ่มต้น `0.9` และจำกัดให้อยู่ในช่วง `[0.05, 1.0]`)
    - `format`: ปัจจุบันคือ `jpg`
    - `delayMs`: ตัวเลข (ไม่บังคับ; ค่าเริ่มต้น `0` และจำกัดภายในไว้สูงสุดที่ `10000`)
    - `deviceId`: สตริง (ไม่บังคับ; ได้จาก `camera.list`)
  - เพย์โหลดการตอบกลับ: `format: "jpg"`, `base64`, `width`, `height`
  - การป้องกันขนาดเพย์โหลด: บีบอัดภาพใหม่เพื่อให้เพย์โหลดที่เข้ารหัสแบบ base64 มีขนาดต่ำกว่า 5MB

- `camera.clip`
  - พารามิเตอร์:
    - `facing`: `front|back` (ค่าเริ่มต้น: `front`)
    - `durationMs`: ตัวเลข (ค่าเริ่มต้น `3000` และจำกัดให้อยู่ในช่วง `[250, 60000]`)
    - `includeAudio`: ค่าบูลีน (ค่าเริ่มต้น `true`)
    - `format`: ปัจจุบันคือ `mp4`
    - `deviceId`: สตริง (ไม่บังคับ; ได้จาก `camera.list`)
  - เพย์โหลดการตอบกลับ: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`

### ข้อกำหนดการทำงานเบื้องหน้าของ iOS

เช่นเดียวกับ `canvas.*` Node iOS อนุญาตคำสั่ง `camera.*` เฉพาะขณะที่แอปอยู่ใน **เบื้องหน้า** เท่านั้น การเรียกใช้ขณะอยู่เบื้องหลังจะส่งคืน `NODE_BACKGROUND_UNAVAILABLE`

### ตัวช่วย CLI

วิธีรับไฟล์สื่อที่ง่ายที่สุดคือใช้ตัวช่วย CLI ซึ่งจะเขียนสื่อที่ถอดรหัสแล้วลงในไฟล์ชั่วคราวและแสดงพาธที่บันทึกไว้

```bash
openclaw nodes camera snap --node <id>                 # ค่าเริ่มต้น: ทั้งกล้องหน้าและหลัง (2 บรรทัด MEDIA)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

ค่าเริ่มต้นของ `nodes camera snap` คือ `--facing both` ซึ่งจับภาพจากทั้งกล้องหน้าและกล้องหลังเพื่อให้เอเจนต์เห็นภาพจากทั้งสองมุมมอง หากระบุ `--device-id` ต้องใช้ทิศทางกล้องเดียวอย่างชัดเจน (`both` จะถูกปฏิเสธเมื่อตั้งค่า `--device-id`) ไฟล์ผลลัพธ์เป็นไฟล์ชั่วคราว (ในไดเรกทอรีชั่วคราวของระบบปฏิบัติการ) เว้นแต่คุณจะสร้างตัวครอบคำสั่งของคุณเอง

## Node Android

### การตั้งค่าผู้ใช้บน Android

- แผง Android Settings → **Camera** → **Allow Camera** (`camera.enabled`)
  - **การติดตั้งใหม่มีค่าเริ่มต้นเป็นปิด** การติดตั้งเดิมที่มีอยู่ก่อนเพิ่มการตั้งค่านี้จะถูกย้ายค่าเป็น **เปิด** เพื่อไม่ให้การอัปเกรดทำให้สูญเสียการเข้าถึงกล้องที่เคยใช้งานได้โดยไม่มีการแจ้งเตือน
  - เมื่อปิด: คำสั่ง `camera.*` จะส่งคืน `CAMERA_DISABLED: enable Camera in Settings`

### สิทธิ์

- ต้องมีสิทธิ์ `CAMERA` สำหรับทั้ง `camera.snap` และ `camera.clip` หากไม่มีหรือปฏิเสธสิทธิ์ จะส่งคืน `CAMERA_PERMISSION_REQUIRED`
- ต้องมีสิทธิ์ `RECORD_AUDIO` สำหรับ `camera.clip` เมื่อ `includeAudio` เป็น `true` หากไม่มีหรือปฏิเสธสิทธิ์ จะส่งคืน `MIC_PERMISSION_REQUIRED`

แอปจะแจ้งขอสิทธิ์ขณะทำงานเมื่อสามารถทำได้

### ข้อกำหนดการทำงานเบื้องหน้าของ Android

เช่นเดียวกับ `canvas.*` Node Android อนุญาตคำสั่ง `camera.*` เฉพาะขณะที่แอปอยู่ใน **เบื้องหน้า** เท่านั้น การเรียกใช้ขณะอยู่เบื้องหลังจะส่งคืน `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`

### คำสั่ง Android (ผ่าน `node.invoke` ของ Gateway)

- `camera.list`
  - เพย์โหลดการตอบกลับ: `devices` — อาร์เรย์ของ `{ id, name, position, deviceType }`

- `camera.snap`
  - พารามิเตอร์: `facing` (`front|back` ค่าเริ่มต้น `front`), `quality` (ค่าเริ่มต้น `0.95` และจำกัดให้อยู่ในช่วง `[0.1, 1.0]`), `maxWidth` (ค่าเริ่มต้น `1600`), `deviceId` (ไม่บังคับ; หากไม่รู้จักรหัสจะล้มเหลวด้วย `INVALID_REQUEST`)
  - เพย์โหลดการตอบกลับ: `format: "jpg"`, `base64`, `width`, `height`
  - การป้องกันขนาดเพย์โหลด: บีบอัดใหม่เพื่อให้ base64 มีขนาดต่ำกว่า 5MB (ใช้ขีดจำกัดเดียวกับ iOS)

- `camera.clip`
  - พารามิเตอร์: `facing` (ค่าเริ่มต้น `front`), `durationMs` (ค่าเริ่มต้น `3000` และจำกัดให้อยู่ในช่วง `[200, 60000]`), `includeAudio` (ค่าเริ่มต้น `true`), `deviceId` (ไม่บังคับ)
  - เพย์โหลดการตอบกลับ: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`
  - การป้องกันขนาดเพย์โหลด: MP4 ดิบถูกจำกัดไว้ที่ 18MB ก่อนเข้ารหัสแบบ base64 คลิปที่มีขนาดเกินจะล้มเหลวด้วย `PAYLOAD_TOO_LARGE` (ลด `durationMs` แล้วลองอีกครั้ง)

## แอป macOS

### การตั้งค่าผู้ใช้บน macOS

แอปคู่หู macOS มีช่องทำเครื่องหมายดังนี้:

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - ค่าเริ่มต้น: **ปิด**
  - เมื่อปิด: คำขอใช้กล้องจะส่งคืน `CAMERA_DISABLED: enable Camera in Settings`

### ตัวช่วย CLI (การเรียกใช้ Node)

ใช้ CLI หลัก `openclaw` เพื่อเรียกคำสั่งกล้องบน Node macOS

```bash
openclaw nodes camera list --node <id>                     # แสดงรายการรหัสกล้อง
openclaw nodes camera snap --node <id>                     # แสดงพาธที่บันทึกไว้
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # แสดงพาธที่บันทึกไว้
openclaw nodes camera clip --node <id> --duration-ms 3000   # แสดงพาธที่บันทึกไว้ (แฟล็กเดิม)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- ค่าเริ่มต้นของ `openclaw nodes camera snap` คือ `maxWidth=1600` เว้นแต่จะกำหนดค่าอื่น
- `camera.snap` จะรอเป็นเวลา `delayMs` (ค่าเริ่มต้น 2000ms และจำกัดให้อยู่ในช่วง `[0, 10000]`) หลังจากอุ่นเครื่อง/รอให้การรับแสงคงที่ ก่อนจับภาพ
- เพย์โหลดภาพถ่ายจะถูกบีบอัดใหม่เพื่อให้ base64 มีขนาดต่ำกว่า 5MB

## ความปลอดภัยและขีดจำกัดในการใช้งานจริง

- การเข้าถึงกล้องและไมโครโฟนจะเรียกข้อความแจ้งขอสิทธิ์ตามปกติของระบบปฏิบัติการ (และต้องมีสตริงคำอธิบายการใช้งานใน `Info.plist`)
- คลิปวิดีโอถูกจำกัดไว้ที่ 60 วินาที เพื่อหลีกเลี่ยงเพย์โหลดของ Node ที่มีขนาดใหญ่เกินไป (โอเวอร์เฮดของ base64 รวมกับขีดจำกัดข้อความ)

## วิดีโอหน้าจอบน macOS (ระดับระบบปฏิบัติการ)

สำหรับวิดีโอ_หน้าจอ_ (ไม่ใช่กล้อง) ให้ใช้แอปคู่หู macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # แสดงพาธที่บันทึกไว้
```

ต้องมีสิทธิ์ **Screen Recording** ของ macOS (TCC)

## เนื้อหาที่เกี่ยวข้อง

- [การรองรับรูปภาพและสื่อ](/th/nodes/images)
- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [คำสั่งตำแหน่งที่ตั้ง](/th/nodes/location-command)
