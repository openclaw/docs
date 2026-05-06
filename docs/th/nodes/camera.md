---
read_when:
    - การเพิ่มหรือแก้ไขการจับภาพจากกล้องบนโหนด iOS/Android หรือ macOS
    - การขยายเวิร์กโฟลว์ไฟล์ชั่วคราวสำหรับสื่อที่เอเจนต์เข้าถึงได้
summary: 'การจับภาพจากกล้อง (โหนด iOS/Android + แอป macOS) สำหรับการใช้งานของเอเจนต์: รูปภาพ (jpg) และคลิปวิดีโอสั้น (mp4)'
title: การจับภาพจากกล้อง
x-i18n:
    generated_at: "2026-05-06T09:20:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw รองรับ **การถ่ายภาพจากกล้อง** สำหรับเวิร์กโฟลว์ของเอเจนต์:

- **iOS Node** (จับคู่ผ่าน Gateway): ถ่าย **ภาพถ่าย** (`jpg`) หรือ **คลิปวิดีโอสั้น** (`mp4` พร้อมเสียงหรือไม่ก็ได้) ผ่าน `node.invoke`
- **Android Node** (จับคู่ผ่าน Gateway): ถ่าย **ภาพถ่าย** (`jpg`) หรือ **คลิปวิดีโอสั้น** (`mp4` พร้อมเสียงหรือไม่ก็ได้) ผ่าน `node.invoke`
- **แอป macOS** (Node ผ่าน Gateway): ถ่าย **ภาพถ่าย** (`jpg`) หรือ **คลิปวิดีโอสั้น** (`mp4` พร้อมเสียงหรือไม่ก็ได้) ผ่าน `node.invoke`

การเข้าถึงกล้องทั้งหมดถูกควบคุมด้วย **การตั้งค่าที่ผู้ใช้ควบคุมได้**

## iOS Node

### การตั้งค่าของผู้ใช้ (เปิดโดยค่าเริ่มต้น)

- แท็บการตั้งค่า iOS → **กล้อง** → **อนุญาตกล้อง** (`camera.enabled`)
  - ค่าเริ่มต้น: **เปิด** (หากไม่มีคีย์นี้ จะถือว่าเปิดใช้งาน)
  - เมื่อปิด: คำสั่ง `camera.*` จะส่งคืน `CAMERA_DISABLED`

### คำสั่ง (ผ่าน Gateway `node.invoke`)

- `camera.list`
  - เพย์โหลดการตอบกลับ:
    - `devices`: อาร์เรย์ของ `{ id, name, position, deviceType }`

- `camera.snap`
  - พารามิเตอร์:
    - `facing`: `front|back` (ค่าเริ่มต้น: `front`)
    - `maxWidth`: ตัวเลข (ไม่บังคับ; ค่าเริ่มต้น `1600` บน iOS Node)
    - `quality`: `0..1` (ไม่บังคับ; ค่าเริ่มต้น `0.9`)
    - `format`: ปัจจุบันคือ `jpg`
    - `delayMs`: ตัวเลข (ไม่บังคับ; ค่าเริ่มต้น `0`)
    - `deviceId`: สตริง (ไม่บังคับ; จาก `camera.list`)
  - เพย์โหลดการตอบกลับ:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - การป้องกันขนาดเพย์โหลด: ภาพถ่ายจะถูกบีบอัดใหม่เพื่อให้เพย์โหลด base64 มีขนาดต่ำกว่า 5 MB

- `camera.clip`
  - พารามิเตอร์:
    - `facing`: `front|back` (ค่าเริ่มต้น: `front`)
    - `durationMs`: ตัวเลข (ค่าเริ่มต้น `3000` และจำกัดค่าสูงสุดไว้ที่ `60000`)
    - `includeAudio`: บูลีน (ค่าเริ่มต้น `true`)
    - `format`: ปัจจุบันคือ `mp4`
    - `deviceId`: สตริง (ไม่บังคับ; จาก `camera.list`)
  - เพย์โหลดการตอบกลับ:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### ข้อกำหนดเรื่องการอยู่เบื้องหน้า

เช่นเดียวกับ `canvas.*` iOS Node อนุญาตคำสั่ง `camera.*` เฉพาะเมื่ออยู่ใน **เบื้องหน้า** เท่านั้น การเรียกใช้เบื้องหลังจะส่งคืน `NODE_BACKGROUND_UNAVAILABLE`

### ตัวช่วย CLI (ไฟล์ชั่วคราว + MEDIA)

วิธีที่ง่ายที่สุดในการรับไฟล์แนบคือผ่านตัวช่วย CLI ซึ่งจะเขียนสื่อที่ถอดรหัสแล้วลงในไฟล์ชั่วคราวและพิมพ์ `MEDIA:<path>`

ตัวอย่าง:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

หมายเหตุ:

- `nodes camera snap` ใช้ทั้ง **สอง** ทิศทางกล้องเป็นค่าเริ่มต้น เพื่อให้เอเจนต์มีภาพจากทั้งสองมุมมอง
- ไฟล์ผลลัพธ์เป็นไฟล์ชั่วคราว (ในไดเรกทอรีชั่วคราวของ OS) เว้นแต่คุณจะสร้าง wrapper ของคุณเอง

## Android Node

### การตั้งค่าของผู้ใช้ Android (เปิดโดยค่าเริ่มต้น)

- แผ่นการตั้งค่า Android → **กล้อง** → **อนุญาตกล้อง** (`camera.enabled`)
  - ค่าเริ่มต้น: **เปิด** (หากไม่มีคีย์นี้ จะถือว่าเปิดใช้งาน)
  - เมื่อปิด: คำสั่ง `camera.*` จะส่งคืน `CAMERA_DISABLED`

### สิทธิ์

- Android ต้องใช้สิทธิ์ขณะรันไทม์:
  - `CAMERA` สำหรับทั้ง `camera.snap` และ `camera.clip`
  - `RECORD_AUDIO` สำหรับ `camera.clip` เมื่อ `includeAudio=true`

หากไม่มีสิทธิ์ แอปจะแสดงพรอมป์เมื่อทำได้; หากถูกปฏิเสธ คำขอ `camera.*` จะล้มเหลวพร้อมข้อผิดพลาด
`*_PERMISSION_REQUIRED`

### ข้อกำหนดเรื่องการอยู่เบื้องหน้าบน Android

เช่นเดียวกับ `canvas.*` Android Node อนุญาตคำสั่ง `camera.*` เฉพาะเมื่ออยู่ใน **เบื้องหน้า** เท่านั้น การเรียกใช้เบื้องหลังจะส่งคืน `NODE_BACKGROUND_UNAVAILABLE`

### คำสั่ง Android (ผ่าน Gateway `node.invoke`)

- `camera.list`
  - เพย์โหลดการตอบกลับ:
    - `devices`: อาร์เรย์ของ `{ id, name, position, deviceType }`

### การป้องกันขนาดเพย์โหลด

ภาพถ่ายจะถูกบีบอัดใหม่เพื่อให้เพย์โหลด base64 มีขนาดต่ำกว่า 5 MB

## แอป macOS

### การตั้งค่าของผู้ใช้ (ปิดโดยค่าเริ่มต้น)

แอปคู่ขนานบน macOS แสดงช่องทำเครื่องหมาย:

- **การตั้งค่า → ทั่วไป → อนุญาตกล้อง** (`openclaw.cameraEnabled`)
  - ค่าเริ่มต้น: **ปิด**
  - เมื่อปิด: คำขอกล้องจะส่งคืน "กล้องถูกปิดใช้งานโดยผู้ใช้"

### ตัวช่วย CLI (การเรียกใช้ Node)

ใช้ CLI หลักของ `openclaw` เพื่อเรียกใช้คำสั่งกล้องบน macOS Node

ตัวอย่าง:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

หมายเหตุ:

- `openclaw nodes camera snap` ใช้ค่าเริ่มต้นเป็น `maxWidth=1600` เว้นแต่จะถูกแทนที่
- บน macOS, `camera.snap` จะรอ `delayMs` (ค่าเริ่มต้น 2000ms) หลังจากการวอร์มอัป/การปรับแสงนิ่งแล้วก่อนถ่ายภาพ
- เพย์โหลดภาพถ่ายจะถูกบีบอัดใหม่เพื่อให้ base64 มีขนาดต่ำกว่า 5 MB

## ความปลอดภัย + ขีดจำกัดเชิงปฏิบัติ

- การเข้าถึงกล้องและไมโครโฟนจะเรียกพรอมป์สิทธิ์ตามปกติของ OS (และต้องมีสตริงการใช้งานใน Info.plist)
- คลิปวิดีโอถูกจำกัดความยาว (ปัจจุบัน `<= 60s`) เพื่อหลีกเลี่ยงเพย์โหลด Node ที่มีขนาดใหญ่เกินไป (โอเวอร์เฮด base64 + ขีดจำกัดข้อความ)

## วิดีโอหน้าจอ macOS (ระดับ OS)

สำหรับวิดีโอ _หน้าจอ_ (ไม่ใช่กล้อง) ให้ใช้แอปคู่ขนานบน macOS:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

หมายเหตุ:

- ต้องใช้สิทธิ์ **การบันทึกหน้าจอ** ของ macOS (TCC)

## ที่เกี่ยวข้อง

- [การรองรับรูปภาพและสื่อ](/th/nodes/images)
- [การทำความเข้าใจสื่อ](/th/nodes/media-understanding)
- [คำสั่งตำแหน่งที่ตั้ง](/th/nodes/location-command)
